import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, update, get } from "firebase/database";
import { db } from "../lib/firebase";
import { useGameContext } from './GameContext';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const { roomCode, isHost, players } = useGameContext();

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
  useEffect(() => {
    let interval = null;

    if (isActive && seconds > 0) {
      interval = setInterval(async () => {
        const nextSecs = secondsRef.current - 1;
        setSeconds(nextSecs);

        // Host update ke Firebase setiap 5 detik
        if (isHost && nextSecs % 5 === 0) {
          await update(ref(db, `rooms/${roomCode}/timer`), { seconds: nextSecs });
        }

        // Auto-advance ketika waktu habis
        if (nextSecs <= 0 && isHost) {
          const curPhase = phaseRef.current;
          const curDay = dayRef.current;
          let nextPhase = "";

          if (curPhase.includes("Pagi")) {
            nextPhase = "Siang (Voting)";
          } else if (curPhase.includes("Siang")) {
            nextPhase = "Malam (Eksekusi)";
          } else if (curPhase.includes("Malam")) {
            nextPhase = "Pagi (Diskusi)";
            const newDay = curDay + 1;
            await update(ref(db, `rooms/${roomCode}/timer`), { day: newDay });
            setDay(newDay);
          }

          if (nextPhase) {
            await update(ref(db, `rooms/${roomCode}/timer`), {
              phase: nextPhase,
              isActive: true,
              seconds: 180
            });
            setPhase(nextPhase);
          }
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isHost, roomCode]);

  // --- Night Result Processing ---
  const processNightResults = useCallback(async () => {
    const alivePlayers = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator');
    if (alivePlayers.length === 0) return;

    const actionsSnapshot = await get(ref(db, `rooms/${roomCode}/players`));
    const historySnapshot = await get(ref(db, `rooms/${roomCode}/nightHistory`));
    if (!actionsSnapshot.exists()) return;

    const allActions = actionsSnapshot.val();
    const nightActions = [];

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
            // Tambah ke nightActions jika belum ada
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

    const deadIds = new Set();
    const logs = [];
    const protectedIds = new Set();

    // Guard protection — proteksi bertahan 2 malam
    nightActions.forEach(action => {
      if (action.role === 'Guard' && action.targetId) {
        protectedIds.add(action.targetId);
      }
    });

    // Juga cek apakah ada player yang masih dalam periode proteksi dari malam sebelumnya
    // Guard yang action kemarin lindungi targetnya untuk malam ini juga
    Object.entries(allActions).forEach(([playerId, playerData]) => {
      if (playerData.role === 'Guard' && playerData.lastProtectedTarget && playerData.lastProtectedDay) {
        const daysSinceProtect = dayRef.current - playerData.lastProtectedDay;
        // Proteksi bertahan 2 malam (malam protek + malam berikutnya)
        if (daysSinceProtect >= 1 && daysSinceProtect <= 2 && playerData.lastProtectedTarget !== 'none' && playerData.lastProtectedTarget) {
          protectedIds.add(playerData.lastProtectedTarget);
        }
      }
    });

    // Werewolf kills (mulai malam ke-2)
    const werewolfKills = nightActions.filter(a => a.role === 'Werewolf' && dayRef.current >= 2);
    for (const kill of werewolfKills) {
      if (kill.targetId && !protectedIds.has(kill.targetId)) {
        const targetAlive = players.find(p => p.id === kill.targetId && p.status !== 'dead');
        if (targetAlive) {
          deadIds.add(kill.targetId);
          logs.push(`Werewolf ${kill.name} membunuh ${kill.targetName}`);
        }
      } else if (kill.targetId && protectedIds.has(kill.targetId)) {
        logs.push(`Werewolf ${kill.name} mencoba membunuh ${kill.targetName} tapi dilindungi!`);
      }
    }

    // Seer reveals
    const seerReveals = nightActions.filter(a => a.role === 'Seer');
    const seerResults = {};
    for (const reveal of seerReveals) {
      if (reveal.targetId) {
        const target = players.find(p => p.id === reveal.targetId);
        if (target) {
          seerResults[reveal.playerId] = { role: target.role, name: target.name };
          logs.push(`Seer ${reveal.name} memeriksa ${reveal.targetName} → ${target.role}`);
        }
      }
    }

    // Hakim truth
    const truthActions = nightActions.filter(a => a.role === 'Hakim');
    const truthTargets = {};
    for (const truth of truthActions) {
      if (truth.targetId) {
        truthTargets[truth.targetId] = true;
        logs.push(`Hakim ${truth.name} menggunakan Truth pada ${truth.targetName}`);
      }
    }

    // Hunter
    const hunterActions = nightActions.filter(a => a.role === 'Hunter' && dayRef.current >= 2);
    for (const hunt of hunterActions) {
      if (hunt.targetId) {
        const target = players.find(p => p.id === hunt.targetId);
        if (target) {
          const wargaTeam = ['Seer', 'Guard', 'Hakim', 'Hunter', 'Pedagang'];
          const isSameTeam = wargaTeam.includes(target.role);

          if (isSameTeam) {
            deadIds.add(hunt.targetId);
            deadIds.add(hunt.playerId);
            logs.push(`Hunter ${hunt.name} menembak Warga ${hunt.targetName} → Keduanya MATI!`);
          } else {
            deadIds.add(hunt.targetId);
            logs.push(`Hunter ${hunt.name} menembak Serigala ${hunt.targetName} → Hunter SELAMAT!`);
          }
        }
      }
    }

    // Warlock items
    for (const action of nightActions) {
      if (action.role === 'Warlock' && action.warlockAction === 'use' && action.purchasedItem) {
        if (action.purchasedItem === 'poison' && action.targetId && !protectedIds.has(action.targetId)) {
          const targetAlive = players.find(p => p.id === action.targetId && p.status !== 'dead');
          if (targetAlive) {
            deadIds.add(action.targetId);
            logs.push(`Warlock ${action.name} menggunakan Poison pada ${action.targetName}`);
          }
        } else if (action.purchasedItem === 'vision' && action.targetId) {
          const target = players.find(p => p.id === action.targetId);
          if (target) {
            logs.push(`Warlock ${action.name} menggunakan Vision pada ${action.targetName} → ${target.role}`);
          }
        }
      }
    }

    // Update Firebase
    const updates = {};
    deadIds.forEach(id => {
      updates[`rooms/${roomCode}/players/${id}/status`] = 'dead';
    });
    Object.entries(seerResults).forEach(([playerId, result]) => {
      updates[`rooms/${roomCode}/seerReveal/${playerId}`] = { ...result, timestamp: Date.now() };
    });
    Object.keys(truthTargets).forEach(id => {
      updates[`rooms/${roomCode}/players/${id}/underTruth`] = true;
    });
    if (logs.length > 0) {
      updates[`rooms/${roomCode}/nightHistory/malam_${dayRef.current}`] = {};
      logs.forEach((log, idx) => {
        updates[`rooms/${roomCode}/nightHistory/malam_${dayRef.current}/log_${idx}`] = log;
      });
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
  }, [roomCode, players]);

  // --- Phase Management ---
  const handleSetPhase = useCallback(async (newPhase) => {
    if (!isHost || !roomCode) return;

    if (newPhase.toLowerCase().includes("pagi")) {
      await processNightResults();
      const newDay = dayRef.current + 1;
      // Reset truthActed untuk Hakim setiap pagi
      for (const p of players) {
        if (p.role === 'Hakim') {
          await update(ref(db, `rooms/${roomCode}/players/${p.id}`), { truthActed: null });
        }
      }
      await update(ref(db, `rooms/${roomCode}/timer`), {
        phase: newPhase, day: newDay, isActive: false, seconds: 120
      });
      setDay(newDay);
    } else if (newPhase.toLowerCase().includes("malam")) {
      for (const p of players) {
        await update(ref(db, `rooms/${roomCode}/players/${p.id}`), { currentAction: null });
      }
      // Reset pistolActed untuk Hakim (biar bisa truth malam)
      for (const p of players) {
        if (p.role === 'Hakim') {
          await update(ref(db, `rooms/${roomCode}/players/${p.id}`), { pistolActed: null });
        }
      }
      await update(ref(db, `rooms/${roomCode}/timer`), {
        phase: newPhase, isActive: true, seconds: 180
      });
    } else {
      await update(ref(db, `rooms/${roomCode}/timer`), {
        phase: newPhase, isActive: false, seconds: 120
      });
    }

    setPhase(newPhase);
  }, [isHost, roomCode, players, processNightResults]);

  // --- Timer Controls ---
  const toggleTimer = useCallback(async () => {
    if (!isHost) return;
    const newActive = !isActiveRef.current;
    setIsActive(newActive);
    await update(ref(db, `rooms/${roomCode}/timer`), {
      isActive: newActive,
      seconds: secondsRef.current <= 0 ? 120 : secondsRef.current
    });
  }, [isHost, roomCode]);

  const resetTimer = useCallback(async () => {
    if (!isHost) return;
    setIsActive(false);
    setSeconds(120);
    await update(ref(db, `rooms/${roomCode}/timer`), { isActive: false, seconds: 120, phase: phaseRef.current });
  }, [isHost, roomCode]);

  const editTimer = useCallback(async (newSeconds) => {
    if (!isHost) return;
    setSeconds(newSeconds);
    await update(ref(db, `rooms/${roomCode}/timer`), { seconds: newSeconds });
  }, [isHost, roomCode]);

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
