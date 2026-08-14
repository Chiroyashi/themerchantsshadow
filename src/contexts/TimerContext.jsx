/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, update, get, set } from "firebase/database";
import { db } from "../lib/firebase";
import { useGameContext } from './GameContext';
import { checkWinCondition } from '../utils/winCondition';
import { isSiang, isMalam, isPagi, PHASE } from '../constants/phases';

const TimerContext = createContext(null);

const getPhaseDuration = (phaseName, dayNum) => {
  const pLower = phaseName?.toLowerCase() || '';
  if (pLower.includes('pagi')) {
    return dayNum === 1 ? 60 : 90;
  }
  if (pLower.includes('siang')) {
    return 120;
  }
  if (pLower.includes('malam')) {
    return 90;
  }
  return 120; // Fallback default
};

export function TimerProvider({ children }) {
  const { roomCode, isHost, myPlayerId, players } = useGameContext();

  // --- Timer State ---
  const [seconds, setSeconds] = useState(60);
  const [phase, setPhase] = useState("Pagi (Diskusi)");
  const [isActive, setIsActive] = useState(false);
  const [day, setDay] = useState(1);
  const [allVoted, setAllVoted] = useState(false);

  // Refs untuk menghindari stale closures di setInterval
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const dayRef = useRef(day);
  dayRef.current = day;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const allVotedRef = useRef(allVoted);
  allVotedRef.current = allVoted;
  const processNightResultsRef = useRef(null);
  const processVoteResultsRef = useRef(null);
  const handleSetPhaseRef = useRef(null);
  const endTimeRef = useRef(null);

  // --- Firebase Listener untuk Timer ---
  useEffect(() => {
    if (!roomCode) return;

    const timerRef = ref(db, `rooms/${roomCode}/timer`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      if (data.phase && data.phase !== phaseRef.current) {
        setPhase(data.phase);
      }
      setDay(data.day || 1);
      setIsActive(data.isActive || false);
      setAllVoted(data.allVoted || false);

      const fbSecs = parseInt(data.seconds);
      if (!isNaN(fbSecs)) {
        const diff = Math.abs(secondsRef.current - fbSecs);
        // Sync jika perbedaan besar (> 2 detik) atau timer pause
        if (diff > 2 || !data.isActive) {
          setSeconds(fbSecs);
        }
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  // --- Countdown Logic ---
  // Pakai setTimeout recursive, bukan setInterval — mencegah race condition async
  const tickRef = useRef(null);
  useEffect(() => {
    let active = true;
    if (!isActive || seconds <= 0) {
      endTimeRef.current = null;
      return;
    }

    const currentEndTime = Date.now() + seconds * 1000;
    if (endTimeRef.current === null || Math.abs(endTimeRef.current - currentEndTime) > 1500) {
      endTimeRef.current = currentEndTime;
    }

    const tick = async () => {
      const nextSecs = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      if (nextSecs !== secondsRef.current) {
        if (!active) return;
        setSeconds(nextSecs);
        secondsRef.current = nextSecs;
        let nextPhase = "";

        // Host update ke Firebase setiap 5 detik
        if (isHost && nextSecs % 5 === 0) {
          try {
            await update(ref(db, `rooms/${roomCode}/timer`), { seconds: nextSecs });
          } catch { /* skip — timer tetap jalan */ }
        }

        // Auto-advance semua vote-in — langsung ke Malam
        if (isHost && nextSecs > 0 && isSiang(phaseRef.current) && !nextPhase) {
          try {
            const [votesSnap, playersSnap] = await Promise.all([
              get(ref(db, `rooms/${roomCode}/votes`)),
              get(ref(db, `rooms/${roomCode}/players`))
            ]);
            if (!active) return;
            if (votesSnap.exists() && playersSnap.exists()) {
              const voteCount = Object.keys(votesSnap.val()).length;
              const alivePlayers = Object.values(playersSnap.val()).filter(
                p => p.status !== 'dead' && p.role !== 'Moderator'
              ).length;
              if (voteCount >= alivePlayers) {
                const isAlreadyAllVoted = allVotedRef.current;
                // Jika waktu tersisa masih lebih dari 10 detik, percepat sisa waktu menjadi 10 detik
                if (nextSecs > 10) {
                  const targetSecs = 10;
                  setSeconds(targetSecs);
                  secondsRef.current = targetSecs;
                  endTimeRef.current = Date.now() + targetSecs * 1000;
                  await update(ref(db, `rooms/${roomCode}/timer`), { seconds: targetSecs, allVoted: true });
                  return; // Keluar dini agar tidak menjadwalkan ulang setTimeout pada tick lama ini
                } else if (!isAlreadyAllVoted) {
                  await update(ref(db, `rooms/${roomCode}/timer`), { allVoted: true });
                }
              }
            }
          } catch { /* skip */ }
        }

        // Auto-advance ketika waktu habis
        if (!nextPhase && nextSecs <= 0 && isHost) {
          const curPhase = phaseRef.current;
          if (isPagi(curPhase)) {
            nextPhase = PHASE.SIANG;
          } else if (isSiang(curPhase)) {
            nextPhase = PHASE.MALAM;
          } else if (isMalam(curPhase)) {
            nextPhase = PHASE.PAGI;
          }
        }

        if (nextPhase) {
          try {
            if (handleSetPhaseRef.current) {
              await handleSetPhaseRef.current(nextPhase, true);
            }
          } catch {
            console.error("Gagal melakukan transisi fase otomatis:");
          }
          return; // Stop tick — timer di-reset dengan nilai baru
        }
      }

      // Lanjut tick berikutnya
      if (isActiveRef.current && secondsRef.current > 0) {
        if (!active) return;
        tickRef.current = setTimeout(tick, 500);
      }
    };

    tickRef.current = setTimeout(tick, 500);
    return () => {
      active = false;
      clearTimeout(tickRef.current);
    };
  }, [isActive, seconds, isHost, roomCode]);

  // --- Night Result Processing ---
  const processNightResults = useCallback(async () => {
    const alivePlayers = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator');
    if (alivePlayers.length === 0) return;

    const actionsSnapshot = await get(ref(db, `rooms/${roomCode}/players`));
    const historySnapshot = await get(ref(db, `rooms/${roomCode}/nightHistory`));
    if (!actionsSnapshot.exists()) return;

    const allActions = actionsSnapshot.val();
    const nightActions = [];
    const updates = {};
    const logs = [];
    const deadIds = new Set();
    const protectedIds = new Set();
    const deathCauses = {};

    // Baca currentAction dari tiap player
    Object.entries(allActions).forEach(([playerId, playerData]) => {
      if (playerData.currentAction) {
        nightActions.push({
          playerId,
          role: playerData.role,
          name: playerData.name,
          targetId: playerData.currentAction.targetId,
          targetName: playerData.currentAction.targetName,
          actionType: playerData.currentAction.action,
          warlockAction: playerData.currentAction.warlockAction,
          warlockItem: playerData.currentAction.warlockItem,
          purchasedItem: playerData.currentAction.purchasedItem
        });
      }
    });

    // Juga baca nightHistory/hari_${day} untuk Truth Hakim di siang hari
    if (historySnapshot.exists()) {
      const history = historySnapshot.val();
      const dayHistory = history[`hari_${dayRef.current}`];
      if (dayHistory) {
        Object.entries(dayHistory).forEach(([playerId, action]) => {
          if (action.role === 'Hakim' && action.targetId && action.action === 'Truth') {
            const alreadyExists = nightActions.some(a => a.playerId === playerId && a.role === 'Hakim');
            if (!alreadyExists) {
              nightActions.push({
                playerId,
                role: 'Hakim',
                name: action.senderName,
                targetId: action.targetId,
                targetName: action.targetName
              });
            }
          }
        });
      }
    }

    // ======================================================
    // PRIORITY QUEUE AKSI MALAM
    // Urutan: Guard → Hunter → Werewolf → Warlock → Seer → Truth
    // ======================================================

    // ── STAGE 1: Guard — proteksi (defensif murni) ──
    nightActions.forEach(action => {
      if (action.role === 'Guard' && action.targetId) {
        protectedIds.add(action.targetId);
      }
    });
    // Proteksi dari malam sebelumnya (bertahan 2 malam)
    Object.entries(allActions).forEach(([, playerData]) => {
      if (playerData.role === 'Guard' && playerData.lastProtectedTarget && playerData.lastProtectedDay) {
        const daysSinceProtect = dayRef.current - playerData.lastProtectedDay;
        if (daysSinceProtect === 1 && playerData.lastProtectedTarget !== 'none' && playerData.lastProtectedTarget) {
          protectedIds.add(playerData.lastProtectedTarget);
        }
      }
    });

    // ── STAGE 2: Hunter — tembak duluan (first strike) ──
    const hunterActions = nightActions.filter(a => a.role === 'Hunter' && dayRef.current >= 2);
    for (const hunt of hunterActions) {
      if (!hunt.targetId) continue;
      const target = players.find(p => p.id === hunt.targetId);
      if (!target) continue;

      const wargaTeam = ['Seer', 'Guard', 'Hakim', 'Hunter', 'Pedagang'];
      const isWarga = wargaTeam.includes(target.role);

      if (isWarga) {
        deadIds.add(hunt.targetId);
        deathCauses[hunt.targetId] = "hunter";
        deadIds.add(hunt.playerId);
        deathCauses[hunt.playerId] = "hunter_backfire";
        logs.push(`Hunter ${hunt.name} menembak Warga ${hunt.targetName} → Keduanya MATI!`);
      } else {
        deadIds.add(hunt.targetId);
        deathCauses[hunt.targetId] = "hunter";
        logs.push(`Hunter ${hunt.name} menembak Serigala ${hunt.targetName} → Hunter SELAMAT!`);
      }

      updates[`rooms/${roomCode}/hunterResult/${hunt.playerId}`] = {
        targetName: target.name,
        targetRole: target.role,
        isCorrect: !isWarga,
        isHost: false,
        timestamp: Date.now()
      };
    }

    // ── STAGE 3: Werewolf — cek apakah masih hidup ──
    if (dayRef.current >= 2) {
      const werewolfKills = nightActions.filter(a => a.role === 'Werewolf');
      // Hanya hitung suara dari Werewolf yang hidup malam ini
      const activeWerewolfKills = werewolfKills.filter(kill => !deadIds.has(kill.playerId) && kill.targetId && kill.targetId !== 'none');
      const aliveWerewolves = players.filter(p => p.role === 'Werewolf' && p.status !== 'dead' && !deadIds.has(p.id));

      if (activeWerewolfKills.length > 0) {
        // Hitung suara
        const werewolfVotesCount = {};
        activeWerewolfKills.forEach(kill => {
          werewolfVotesCount[kill.targetId] = (werewolfVotesCount[kill.targetId] || 0) + 1;
        });

        // Cari perolehan suara tertinggi
        const maxVotes = Math.max(...Object.values(werewolfVotesCount));
        const topTargets = Object.keys(werewolfVotesCount).filter(targetId => werewolfVotesCount[targetId] === maxVotes);

        if (topTargets.length > 1) {
          // Hasil Seri: Batal Bunuh (0 Korban)
          logs.push(`Werewolf gagal mencapai konsensus malam ini (suara seri).`);
          aliveWerewolves.forEach(ww => {
            updates[`rooms/${roomCode}/werewolfResult/${ww.id}`] = {
              targetName: "Batal Bunuh (Seri)",
              blocked: false,
              timestamp: Date.now()
            };
          });
        } else {
          const selectedTargetId = topTargets[0];
          if (selectedTargetId === 'skip') {
            logs.push(`Werewolf memutuskan untuk melewati malam ini (skip).`);
            aliveWerewolves.forEach(ww => {
              updates[`rooms/${roomCode}/werewolfResult/${ww.id}`] = {
                targetName: "Skip",
                blocked: false,
                timestamp: Date.now()
              };
            });
          } else {
            const selectedTargetName = activeWerewolfKills.find(k => k.targetId === selectedTargetId)?.targetName || "Unknown";
            if (protectedIds.has(selectedTargetId)) {
              logs.push(`Werewolf mencoba membunuh ${selectedTargetName} tapi dilindungi!`);
              aliveWerewolves.forEach(ww => {
                updates[`rooms/${roomCode}/werewolfResult/${ww.id}`] = {
                  targetName: selectedTargetName,
                  blocked: true,
                  timestamp: Date.now()
                };
              });
            } else {
              const targetAlive = players.find(p => p.id === selectedTargetId && p.status !== 'dead');
              if (targetAlive) {
                if (!deathCauses[selectedTargetId]) {
                  deadIds.add(selectedTargetId);
                  deathCauses[selectedTargetId] = "werewolf";
                }
                logs.push(`Werewolf membunuh ${selectedTargetName}`);
                aliveWerewolves.forEach(ww => {
                  updates[`rooms/${roomCode}/werewolfResult/${ww.id}`] = {
                    targetName: selectedTargetName,
                    blocked: false,
                    timestamp: Date.now()
                  };
                });
              }
            }
          }
        }
      }
    }

    // ── STAGE 4: Warlock — poison/vision ──
    for (const action of nightActions) {
      if (action.role !== 'Warlock' || action.warlockAction !== 'use' || !action.purchasedItem) continue;

      if (action.purchasedItem === 'poison' && action.targetId && !protectedIds.has(action.targetId)) {
        if (!deadIds.has(action.targetId)) {
          deadIds.add(action.targetId);
          deathCauses[action.targetId] = "poison";
          logs.push(`Warlock ${action.name} menggunakan Poison pada ${action.targetName}`);
        }
      } else if (action.purchasedItem === 'vision' && action.targetId) {
        const target = players.find(p => p.id === action.targetId);
        if (target) {
          logs.push(`Warlock ${action.name} menggunakan Vision pada ${action.targetName} → ${target.role}`);
        }
      }

      const target = players.find(p => p.id === action.targetId);
      if (action.purchasedItem === 'poison') {
        updates[`rooms/${roomCode}/warlockResult/${action.playerId}`] = {
          item: action.purchasedItem,
          targetName: target?.name || "Unknown",
          targetRole: target?.role || "Unknown",
          dead: deadIds.has(action.targetId),
          timestamp: Date.now()
        };
      }
    }

    // ── STAGE 5: Seer — intip role (info murni) ──
    const seerResults = {};
    for (const reveal of nightActions.filter(a => a.role === 'Seer')) {
      if (!reveal.targetId) continue;
      const target = players.find(p => p.id === reveal.targetId);
      if (target) {
        seerResults[reveal.playerId] = { role: target.role, name: target.name };
        logs.push(`Seer ${reveal.name} memeriksa ${reveal.targetName} → ${target.role}`);
      }
    }

    // ── STAGE 6: Hakim Truth (info murni) ──
    const truthTargets = {};
    for (const truth of nightActions.filter(a => a.role === 'Hakim')) {
      if (!truth.targetId) continue;
      truthTargets[truth.targetId] = true;
      logs.push(`Hakim ${truth.name} menggunakan Truth pada ${truth.targetName}`);
    }

    // ======================================================
    // BUILD FIREBASE UPDATES
    // ======================================================

    deadIds.forEach(id => {
      updates[`rooms/${roomCode}/players/${id}/status`] = 'dead';
    });
    Object.keys(truthTargets).forEach(id => {
      updates[`rooms/${roomCode}/players/${id}/underTruth`] = true;
    });
    if (logs.length > 0) {
      logs.forEach((log, idx) => {
        updates[`rooms/${roomCode}/nightHistory/malam_${dayRef.current}/log_${idx}`] = log;
      });
    }

    // Set deadToday
    const nightDeadNames = [];
    const nightDeadDetails = {};
    deadIds.forEach(id => {
      const p = players.find(pl => pl.id === id);
      if (p) {
        nightDeadNames.push(p.name);
        nightDeadDetails[p.name] = deathCauses[id] || "general";
      }
    });
    updates[`rooms/${roomCode}/deadToday`] = {
      day: dayRef.current,
      names: nightDeadNames.length > 0 ? nightDeadNames : ["TIDAK ADA"],
      details: nightDeadDetails,
      timestamp: Date.now()
    };

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }

    // Auto check win condition setelah ada kematian malam
    await checkWinCondition(roomCode);
  }, [roomCode, players]);

  // --- Vote Result Processing ---
  const processVoteResults = useCallback(async () => {
    if (!roomCode) return;
    const votesSnap = await get(ref(db, `rooms/${roomCode}/votes`));
    if (!votesSnap.exists()) {
      await set(ref(db, `rooms/${roomCode}/voteResult`), {
        day: dayRef.current,
        names: ["TIDAK ADA"],
        executedId: null,
        timestamp: Date.now()
      });
      return;
    }

    const votes = votesSnap.val();
    const voteCount = {};
    Object.values(votes).forEach(targetId => {
      voteCount[targetId] = (voteCount[targetId] || 0) + 1;
    });

    const maxVotes = Math.max(...Object.values(voteCount), 0);
    const topTargets = Object.entries(voteCount).filter(([, v]) => v === maxVotes);

    const alivePlayers = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator');
    const killThreshold = Math.floor(alivePlayers.length / 2) + 1;

    // Tie, 0 suara, skip, atau kurang dari threshold → skip
    if (topTargets.length !== 1 || maxVotes === 0 || maxVotes < killThreshold || topTargets[0][0] === 'skip') {
      await set(ref(db, `rooms/${roomCode}/voteResult`), {
        day: dayRef.current,
        names: ["TIDAK ADA"],
        executedId: null,
        timestamp: Date.now()
      });
    } else {
      const executedId = topTargets[0][0];
      const executedPlayer = players.find(p => p.id === executedId);
      await update(ref(db), {
        [`rooms/${roomCode}/players/${executedId}/status`]: 'dead',
        [`rooms/${roomCode}/voteResult`]: {
          day: dayRef.current,
          names: [executedPlayer?.name || "Unknown"],
          executedId,
          timestamp: Date.now()
        }
      });
      // Auto check win condition setelah eksekusi voting
      await checkWinCondition(roomCode);
    }

    // Cleanup votes
    await set(ref(db, `rooms/${roomCode}/votes`), null);
  }, [roomCode, players]);

  // Guard untuk cegah double-transition
  const isTransitioningRef = useRef(false);

  // --- Phase Management ---
  const handleSetPhase = useCallback(async (newPhase, isActiveOverride = null) => {
    const pLower = newPhase?.toLowerCase() || '';
    const isActuallyHost = isHost || myPlayerId?.startsWith('host_');
    if (!isActuallyHost || !roomCode) return;
    if (isTransitioningRef.current) return; // Cegah double-click
    isTransitioningRef.current = true;

    try {
      // Pakai ref supaya tidak ada circular dependency
      const nightFn = processNightResultsRef.current;
      const voteFn = processVoteResultsRef.current;

      const targetActive = isActiveOverride !== null ? isActiveOverride : true;

      if (pLower.includes("pagi")) {
        // Reset underTruth untuk semua player & truthActed untuk Hakim setiap pagi sebelum memproses hasil malam
        try {
          for (const p of players) {
            const reset = { underTruth: false };
            if (p.role === 'Hakim') {
              reset.truthActed = null;
            }
            await update(ref(db, `rooms/${roomCode}/players/${p.id}`), reset);
          }
        } catch { /* skip */ }

        if (nightFn) await nightFn();
        const newDay = dayRef.current + 1;

        const duration = getPhaseDuration(newPhase, newDay);
        endTimeRef.current = Date.now() + duration * 1000;
        setIsActive(targetActive);
        setSeconds(duration);
        setDay(newDay);

        await update(ref(db, `rooms/${roomCode}/timer`), {
          phase: newPhase, day: newDay, isActive: targetActive, seconds: duration, allVoted: false
        });
      } else if (pLower.includes("malam")) {
        if (voteFn) await voteFn();
        // Reset currentAction, pistolActed, dan warlockActed
        try {
          for (const p of players) {
            const reset = { currentAction: null };
            if (p.role === 'Hakim') reset.pistolActed = null;
            if (p.role === 'Warlock') reset.warlockActed = null;
            await update(ref(db, `rooms/${roomCode}/players/${p.id}`), reset);
          }
          // Clean old results at start of night
          await set(ref(db, `rooms/${roomCode}/seerResult`), null);
          await set(ref(db, `rooms/${roomCode}/seerReveal`), null);
          await set(ref(db, `rooms/${roomCode}/warlockResult`), null);
        } catch { /* skip */ }

        const duration = getPhaseDuration(newPhase, dayRef.current);
        endTimeRef.current = Date.now() + duration * 1000;
        setIsActive(targetActive);
        setSeconds(duration);

        await update(ref(db, `rooms/${roomCode}/timer`), {
          phase: newPhase, isActive: targetActive, seconds: duration, allVoted: false
        });
      } else {
        const duration = getPhaseDuration(newPhase, dayRef.current);
        endTimeRef.current = Date.now() + duration * 1000;
        setIsActive(targetActive);
        setSeconds(duration);

        await update(ref(db, `rooms/${roomCode}/timer`), {
          phase: newPhase, isActive: targetActive, seconds: duration, allVoted: false
        });
      }

      setPhase(newPhase);
    } catch (err) {
      console.error("Gagal mengganti fase:", err);
      throw err;
    } finally {
      isTransitioningRef.current = false;
    }
  }, [isHost, myPlayerId, roomCode, players]);

  // Sync refs setelah callbacks didefinisikan
  useEffect(() => {
    processNightResultsRef.current = processNightResults;
    processVoteResultsRef.current = processVoteResults;
    handleSetPhaseRef.current = handleSetPhase;
  }, [processNightResults, processVoteResults, handleSetPhase]);

  // --- Timer Controls ---
  const toggleTimer = useCallback(async () => {
    if (!(isHost || myPlayerId?.startsWith('host_'))) return;
    const newActive = !isActiveRef.current;
    setIsActive(newActive);
    const duration = getPhaseDuration(phaseRef.current, dayRef.current);
    await update(ref(db, `rooms/${roomCode}/timer`), {
      isActive: newActive,
      seconds: secondsRef.current <= 0 ? duration : secondsRef.current
    });
  }, [isHost, myPlayerId, roomCode]);

  const resetTimer = useCallback(async () => {
    if (!(isHost || myPlayerId?.startsWith('host_'))) return;
    setIsActive(false);
    const duration = getPhaseDuration(phaseRef.current, dayRef.current);
    setSeconds(duration);
    await update(ref(db, `rooms/${roomCode}/timer`), { isActive: false, seconds: duration, phase: phaseRef.current });
  }, [isHost, myPlayerId, roomCode]);

  const editTimer = useCallback(async (newSeconds) => {
    if (!(isHost || myPlayerId?.startsWith('host_'))) return;
    setSeconds(newSeconds);
    await update(ref(db, `rooms/${roomCode}/timer`), { seconds: newSeconds });
  }, [isHost, myPlayerId, roomCode]);

  const value = {
    seconds, phase, isActive, day, allVoted,
    toggleTimer, resetTimer, editTimer,
    handleSetPhase, processNightResults, setPhase
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimerContext() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimerContext must be used within TimerProvider');
  return ctx;
}
