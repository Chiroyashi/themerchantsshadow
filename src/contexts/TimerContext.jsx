import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, update, get, set } from "firebase/database";
import { db } from "../lib/firebase";
import { useGameContext } from './GameContext';
import { checkWinCondition } from '../utils/winCondition';
import { isSiang, isMalam, isPagi, PHASE } from '../constants/phases';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const { roomCode, isHost, myPlayerId, players } = useGameContext();

  // --- Timer State ---
  const [seconds, setSeconds] = useState(120);
  const [phase, setPhase] = useState("Pagi (Diskusi)");
  const [isActive, setIsActive] = useState(false);
  const [day, setDay] = useState(1);

  // Refs untuk menghindari stale closures di setInterval
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const dayRef = useRef(day);
  dayRef.current = day;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
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

      const fbSecs = parseInt(data.seconds);
      if (!isNaN(fbSecs)) {
        const diff = Math.abs(secondsRef.current - fbSecs);
        // Sync jika perbedaan besar atau timer pause
        if (diff > 10 || !data.isActive) {
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
        setSeconds(nextSecs);
        secondsRef.current = nextSecs;
        let nextPhase = "";

        // Host update ke Firebase setiap 5 detik
        if (isHost && nextSecs % 5 === 0) {
          try {
            await update(ref(db, `rooms/${roomCode}/timer`), { seconds: nextSecs });
          } catch (e) { /* skip — timer tetap jalan */ }
        }

        // Auto-advance semua vote-in — langsung ke Malam
        if (isHost && nextSecs > 0 && isSiang(phaseRef.current) && !nextPhase && nextSecs % 5 === 0) {
          try {
            const votesSnap = await get(ref(db, `rooms/${roomCode}/votes`));
            const playersSnap = await get(ref(db, `rooms/${roomCode}/players`));
            if (votesSnap.exists() && playersSnap.exists()) {
              const voteCount = Object.keys(votesSnap.val()).length;
              const alivePlayers = Object.values(playersSnap.val()).filter(
                p => p.status !== 'dead' && p.role !== 'Moderator'
              ).length;
              if (voteCount >= alivePlayers) {
                nextPhase = "Malam (Eksekusi)";
              }
            }
          } catch (e) { /* skip */ }
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
          } catch (e) {
            console.error("Gagal melakukan transisi fase otomatis:", e);
          }
          return; // Stop tick — timer di-reset dengan nilai baru
        }
      }

      // Lanjut tick berikutnya
      if (isActiveRef.current && secondsRef.current > 0) {
        tickRef.current = setTimeout(tick, 500);
      }
    };

    tickRef.current = setTimeout(tick, 500);
    return () => clearTimeout(tickRef.current);
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
    Object.entries(allActions).forEach(([playerId, playerData]) => {
      if (playerData.role === 'Guard' && playerData.lastProtectedTarget && playerData.lastProtectedDay) {
        const daysSinceProtect = dayRef.current - playerData.lastProtectedDay;
        if (daysSinceProtect >= 1 && daysSinceProtect <= 2 && playerData.lastProtectedTarget !== 'none' && playerData.lastProtectedTarget) {
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
        deadIds.add(hunt.playerId);
        logs.push(`Hunter ${hunt.name} menembak Warga ${hunt.targetName} → Keduanya MATI!`);
      } else {
        deadIds.add(hunt.targetId);
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
      for (const kill of werewolfKills) {
        if (!kill.targetId) continue;

        // Werewolf sudah mati dieksekusi Hunter — skip
        if (deadIds.has(kill.playerId)) {
          logs.push(`Werewolf ${kill.name} mati sebelum sempat menyerang!`);
          continue;
        }

        if (protectedIds.has(kill.targetId)) {
          logs.push(`Werewolf ${kill.name} mencoba membunuh ${kill.targetName} tapi dilindungi!`);
          updates[`rooms/${roomCode}/werewolfResult/${kill.playerId}`] = {
            targetName: kill.targetName,
            blocked: true,
            timestamp: Date.now()
          };
          continue;
        }

        const targetAlive = players.find(p => p.id === kill.targetId && p.status !== 'dead');
        if (targetAlive) {
          deadIds.add(kill.targetId);
          logs.push(`Werewolf ${kill.name} membunuh ${kill.targetName}`);
          updates[`rooms/${roomCode}/werewolfResult/${kill.playerId}`] = {
            targetName: kill.targetName,
            blocked: false,
            timestamp: Date.now()
          };
        }
      }
    }

    // ── STAGE 4: Warlock — poison/vision ──
    for (const action of nightActions) {
      if (action.role !== 'Warlock' || action.warlockAction !== 'use' || !action.purchasedItem) continue;

      if (action.purchasedItem === 'poison' && action.targetId && !protectedIds.has(action.targetId)) {
        if (!deadIds.has(action.targetId)) {
          deadIds.add(action.targetId);
          logs.push(`Warlock ${action.name} menggunakan Poison pada ${action.targetName}`);
        }
      } else if (action.purchasedItem === 'vision' && action.targetId) {
        const target = players.find(p => p.id === action.targetId);
        if (target) {
          logs.push(`Warlock ${action.name} menggunakan Vision pada ${action.targetName} → ${target.role}`);
        }
      }

      const target = players.find(p => p.id === action.targetId);
      updates[`rooms/${roomCode}/warlockResult/${action.playerId}`] = {
        item: action.purchasedItem,
        targetName: target?.name || "Unknown",
        targetRole: target?.role || "Unknown",
        dead: deadIds.has(action.targetId),
        timestamp: Date.now()
      };
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
    Object.entries(seerResults).forEach(([playerId, result]) => {
      updates[`rooms/${roomCode}/seerReveal/${playerId}`] = { ...result, timestamp: Date.now() };
      updates[`rooms/${roomCode}/seerResult/${playerId}`] = { ...result, timestamp: Date.now() };
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
    deadIds.forEach(id => {
      const p = players.find(pl => pl.id === id);
      if (p) nightDeadNames.push(p.name);
    });
    updates[`rooms/${roomCode}/deadToday`] = {
      day: dayRef.current,
      names: nightDeadNames.length > 0 ? nightDeadNames : ["TIDAK ADA"],
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

      const targetActive = isActiveOverride !== null ? isActiveOverride : !pLower.includes("siang");

      if (pLower.includes("pagi")) {
        if (nightFn) await nightFn();
        const newDay = dayRef.current + 1;
        // Reset truthActed untuk Hakim setiap pagi
        try {
          for (const p of players) {
            if (p.role === 'Hakim') {
              await update(ref(db, `rooms/${roomCode}/players/${p.id}`), { truthActed: null });
            }
          }
        } catch (e) { /* skip */ }
        await update(ref(db, `rooms/${roomCode}/timer`), {
          phase: newPhase, day: newDay, isActive: targetActive, seconds: 120
        });
        setSeconds(120);
        setDay(newDay);
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
        } catch (e) { /* skip */ }
        await update(ref(db, `rooms/${roomCode}/timer`), {
          phase: newPhase, isActive: targetActive, seconds: 180
        });
        setSeconds(180);
      } else {
        await update(ref(db, `rooms/${roomCode}/timer`), {
          phase: newPhase, isActive: targetActive, seconds: 180
        });
        setSeconds(180);
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
    await update(ref(db, `rooms/${roomCode}/timer`), {
      isActive: newActive,
      seconds: secondsRef.current <= 0 ? 120 : secondsRef.current
    });
  }, [isHost, myPlayerId, roomCode]);

  const resetTimer = useCallback(async () => {
    if (!(isHost || myPlayerId?.startsWith('host_'))) return;
    setIsActive(false);
    setSeconds(120);
    await update(ref(db, `rooms/${roomCode}/timer`), { isActive: false, seconds: 120, phase: phaseRef.current });
  }, [isHost, myPlayerId, roomCode]);

  const editTimer = useCallback(async (newSeconds) => {
    if (!(isHost || myPlayerId?.startsWith('host_'))) return;
    setSeconds(newSeconds);
    await update(ref(db, `rooms/${roomCode}/timer`), { seconds: newSeconds });
  }, [isHost, myPlayerId, roomCode]);

  const value = {
    seconds, phase, isActive, day,
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
