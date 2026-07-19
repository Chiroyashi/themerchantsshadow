import React, { useState, useEffect, useRef } from 'react';
import { ref, set, onValue, update, push } from "firebase/database";
import { db } from "../lib/firebase";
import {
  Eye, EyeOff, Shield, Skull, HelpCircle, BookOpen, X, Ghost,
  LayoutGrid, MessageSquare, Send, Zap, Search, Crosshair,
  ShoppingCart, ChevronUp, User, UserCheck, Info, Clock, Gavel, ShoppingBag
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import RoleModal from '../components/RoleModal';
import ChatRoom from '../components/ChatRoom';
import IntroFable from '../components/IntroFable';
import GameOverScreen from '../components/GameOverScreen';
import { useGameContext } from '../contexts/GameContext';
import { useTimerContext } from '../contexts/TimerContext';
import { useNotification } from '../contexts/NotificationContext';
import { checkWinCondition } from '../utils/winCondition';
import { getRoleActionConfig } from '../utils/roleActions';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import { isSiang, isMalam, isPagi } from '../constants/phases';
const ViewRole = ({ onNext }) => {
  const {
    players, roomCode, myPlayerId, myData, playerName,
    isHost, gameWinner, handleLeaveGame
  } = useGameContext();
  const totalPlayers = players.filter(p => p.role !== 'Moderator').length;
  const { seconds, phase, isActive, day } = useTimerContext();
  const { showNotif } = useNotification();
  const playerData = myData;
  const winner = gameWinner;
  const onLeave = () => handleLeaveGame(!!gameWinner);
  // --- 1. DEKLARASI SEMUA HOOKS (WAJIB DI ATAS) ---
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);
  const [actionTarget, setActionTarget] = useState("");
  const [showTargetList, setShowTargetList] = useState(false);
  const [myClues, setMyClues] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  const [showCluePopup, setShowCluePopup] = useState(false);
  const [actionNotif, setActionNotif] = useState(null); // { message, icon }
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [actionPopupData, setActionPopupData] = useState(null);
  const prevPhaseRef = useRef(phase);

  const isDead = playerData?.status === 'dead';
  const isNight = isMalam(phase);
  const role = playerData?.role?.toLowerCase() || "";

  const [visionResult, setVisionResult] = useState(null);
  const [hasActedThisNight, setHasActedThisNight] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  // Warlock-specific state
  const [warlockChoice, setWarlockChoice] = useState(null); // 'buy' or 'skip'
  const [warlockItem, setWarlockItem] = useState(null); // 'poison' or 'vision'


  // ── Gunakan getRoleActionConfig dari roleActions.js ──
  const roleState = {
    hasActed: hasActedThisNight,
    pistolUsedCount: playerData?.pistolUsedCount || 0,
    pistolActed: playerData?.pistolActed || false,
    truthActed: playerData?.truthActed || false,
    hunterActed: playerData?.hunterActed || false,
    lastProtectedDay: playerData?.lastProtectedDay || 0,
    warlockInventory: playerData?.warlockInventory,
    warlockSkipped: playerData?.warlockSkipped,
    warlockItemUsed: playerData?.warlockItemUsed,
    warlockActed: playerData?.warlockActed,
    currentPhase: phase,
  };
  const actionConfig = getRoleActionConfig(playerData?.role || '', day, totalPlayers, roleState);

  // Auto-redirect ke GameBoard saat Siang
  useEffect(() => {
    if (!phase || isDead || isHost) return;
    const isSiangPhase = isSiang(phase);
    const wasNotSiang = !isSiang(prevPhaseRef.current);
    if (isSiang && wasNotSiang) {
      onNext();
    }
    prevPhaseRef.current = phase;
  }, [phase, isDead, isHost, onNext]);

  useEffect(() => {
    const checkIntro = async () => {
      // Jika sudah ada di localStorage atau bukan hari 1 phase Pagi, skip
      if (localStorage.getItem(`intro_${roomCode}`)) return;
      // Hanya tampilkan intro jika day = 1 dan phase ada dan contains "Pagi"
      if (day !== 1 || !phase || !isPagi(phase) || winner) return;
      
      // Cek Firebase apakah intro sudah selesai untuk player ini
      const introFinishedRef = ref(db, `rooms/${roomCode}/introFinished/${playerData?.id}`);
      const snapshot = await new Promise((resolve) => {
        onValue(introFinishedRef, (s) => resolve(s), { onlyOnce: true });
      });
      
      if (!snapshot.val()) {
        setShowIntro(true);
      } else {
        localStorage.setItem(`intro_${roomCode}`, 'true');
      }
    };
    
    if (day && phase) {
      checkIntro();
    }
  }, [day, phase, roomCode, winner, playerData?.id]);

  // Truth limit tracking (after role is declared)
  const truthUsedCount = playerData?.truthUsedCount || 0;
  const truthMaxUses = 2; // Fixed 2x sepanjang game
  const truthRemaining = Math.max(0, truthMaxUses - truthUsedCount);

  // Hakim pistol tracking
  const pistolUsedCount = playerData?.pistolUsedCount || 0;
  const pistolRemaining = Math.max(0, 2 - pistolUsedCount);
  const truthActed = playerData?.truthActed || false;
  const pistolActed = playerData?.pistolActed || false;

  // Guard constraint: usage-based — tidak bisa melindungi pemain sama 2x berturut-turut
  const guardLastProtected = playerData?.lastProtectedTarget || null;
  const guardLastProtectedDay = playerData?.lastProtectedDay || 0;
  const isGuardCooldown = role.includes("guard") && guardLastProtectedDay > 0 && day < guardLastProtectedDay + 3;
  
  // Guard constraint: maksimal 1x lindungi diri sendiri
  const guardSelfProtected = playerData?.selfProtectedCount || 0;
  const canGuardSelf = guardSelfProtected < 1;

  // --- 2. SEMUA USE EFFECTS ---
  useEffect(() => {
    setHasActedThisNight(false);
    setVisionResult(null);
    setActionStatus(null);
    // Reset Warlock states
    setWarlockChoice(null);
    setWarlockItem(null);
  }, [day, phase]);

  useEffect(() => {
    if (!roomCode) return;
    const activityRef = ref(db, `rooms/${roomCode}/truthActivity`);
    const unsubscribe = onValue(activityRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.timestamp > (Date.now() - 3000)) {
        new Audio('/sounds/notif.mp3').play().catch(() => {});
        setActionStatus({ type: 'success', msg: `AKTIVITAS TERDETEKSI: ${data.msg}` });
        setTimeout(() => setActionStatus(null), 4000);
      }
    });
    return () => unsubscribe();
  }, [roomCode]);

  useEffect(() => {
    if (role.includes("pedagang") && playerData?.id) {
      const clueRef = ref(db, `rooms/${roomCode}/merchantClues/${playerData.id}`);
      const unsubscribe = onValue(clueRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.message) {
          setMyClues(data);
          setShowCluePopup(true);
        }
      });
      return () => unsubscribe();
    }
  }, [roomCode, playerData?.id, role]);

  // ── Morning popup: 1 generic listener untuk semua role ──
  useEffect(() => {
    if (!roomCode || !playerData?.id) return;

    const POPUP_CONFIGS = [
      {
        role: 'seer',
        path: `rooms/${roomCode}/seerResult/${playerData.id}`,
        validate: (d) => d && d.role,
        map: (d) => ({
          icon: '👁️', title: 'Hasil Pengintaian',
          desc: `Kamu memeriksa ${d.name}`,
          targetName: d.name, targetRole: d.role,
        }),
      },
      {
        role: 'hunter',
        path: `rooms/${roomCode}/hunterResult/${playerData.id}`,
        validate: (d) => d && d.targetName,
        map: (d) => {
          const isMiss = !d.isCorrect;
          return {
            icon: '🎯', title: isMiss ? 'Salah Tembak!' : 'Tembakan Tepat!',
            desc: `Kamu menembak ${d.targetName}`,
            targetName: d.targetName, targetRole: d.targetRole,
            isHunterResult: true, isMiss,
          };
        },
      },
      {
        role: 'werewolf',
        path: `rooms/${roomCode}/werewolfResult/${playerData.id}`,
        validate: (d) => d && d.targetName,
        map: (d) => ({
          icon: '🐺', title: d.blocked ? 'Diblokir!' : 'Eksekusi Berhasil',
          desc: d.blocked ? `${d.targetName} dilindungi!` : `Kamu membunuh ${d.targetName}`,
        }),
      },
      {
        role: 'warlock',
        path: `rooms/${roomCode}/warlockResult/${playerData.id}`,
        validate: (d) => d && d.targetName,
        map: (d) => {
          const label = d.item === 'poison' ? '☠️ Poison' : '👁️ Vision';
          return {
            icon: label, title: 'Hasil Aksi',
            desc: `${label} pada ${d.targetName}${d.dead ? ' — Target mati!' : d.item === 'vision' ? ` (${d.targetRole})` : ' — Target selamat'}`,
          };
        },
      },
    ];

    const unsubs = POPUP_CONFIGS
      .filter(cfg => role.includes(cfg.role))
      .map(cfg => {
        const ref_ = ref(db, cfg.path);
        return onValue(ref_, (snap) => {
          const data = snap.val();
          if (cfg.validate(data)) {
            setActionPopupData(cfg.map(data));
            setShowActionPopup(true);
          }
        });
      });

    return () => unsubs.forEach(u => u());
  }, [roomCode, playerData?.id, role]);

  // Scroll lock for popups
  useEffect(() => {
    if (showActionPopup) { lockScroll(); return () => unlockScroll(); }
  }, [showActionPopup]);
  useEffect(() => {
    if (showCluePopup) { lockScroll(); return () => unlockScroll(); }
  }, [showCluePopup]);

  // --- 3. HELPER FUNCTIONS ---
  const handleIntroFinish = () => {
    setShowIntro(false);
    localStorage.setItem(`intro_${roomCode}`, 'true');
    if (!isHost && onNext) onNext();
  };

  const triggerNotif = (msg, type = 'info') => {
    setActionStatus({ type, msg });
    setTimeout(() => setActionStatus(null), 4000);
  };

  const reportTruthActivity = (actionDescription) => {
    if (playerData?.underTruth) {
      const activityRef = ref(db, `rooms/${roomCode}/truthActivity`);
      set(activityRef, {
        msg: `${playerData.name} ${actionDescription}`,
        senderId: playerData.id,
        timestamp: Date.now()
      });
    }
  };

  const handleWarlockUse = async () => {
    if (!actionTarget || hasActedThisNight) return;
    const targetPlayer = players.find(p => p.id === actionTarget);
    const item = playerData?.warlockInventory;
    if (!item) return;

    const folder = `malam_${day}`;
    setActionPopupData({
      icon: item === 'poison' ? '☠️' : '👁️',
      title: `Menggunakan ${item.toUpperCase()}`,
      desc: `Kamu menggunakan ${item} pada ${targetPlayer?.name}`
    });
    setShowActionPopup(true);
    setHasActedThisNight(true);

    const updates = {};
    updates[`rooms/${roomCode}/players/${playerData.id}/currentAction`] = {
      role: "Warlock", action: "use", warlockAction: "use",
      purchasedItem: item,
      targetId: actionTarget, targetName: targetPlayer?.name || "Unknown",
      timestamp: Date.now()
    };
    updates[`rooms/${roomCode}/players/${playerData.id}/warlockItemUsed`] = true;
    updates[`rooms/${roomCode}/players/${playerData.id}/warlockInventory`] = null;
    updates[`rooms/${roomCode}/players/${playerData.id}/warlockActed`] = true;
    updates[`rooms/${roomCode}/nightHistory/${folder}/${playerData.id}`] = {
      senderName: playerData.name, role: "Warlock",
      action: item.toUpperCase(),
      targetId: actionTarget, targetName: targetPlayer?.name,
      timestamp: Date.now()
    };

    try {
      await update(ref(db), updates);
      await checkWinCondition(roomCode);
    } catch (e) {
      setHasActedThisNight(false);
    }
  };

  const handleNightAction = (type) => {
    // ACTION: block jika sudah acted, kecuali skip (skip juga diblok)
    if (hasActedThisNight) return;

    // Handle Warlock 2-stage action
    if (role.includes('warlock') && isNight) {
      if (!warlockChoice) {
        setWarlockChoice(type);
        if (type === 'skip') {
          setHasActedThisNight(true);
          sendWarlockAction('skip', null, null);
        }
        return;
      } else if (warlockChoice === 'buy' && !warlockItem && type !== 'skip') {
        setWarlockItem(type);
        return;
      }
    }

    // Jika tidak ada target dan bukan skip, tolak
    if (!actionTarget && type !== 'skip') return;

    const targetPlayer = players.find(p => p.id === actionTarget);
    const folder = isNight ? `malam_${day}` : `hari_${day}`;

    const actionLabel = role.includes('warlock') && warlockItem
      ? `${warlockItem.toUpperCase()}`
      : type;

    const isSelfProtection = role.includes("guard") && actionTarget === playerData?.id;
    const isHakim = role.includes("hakim");
    const isPistol = type === 'pistol';

    // Tentukan popup berdasarkan role
    let popupInfo = null;
    if (role.includes("werewolf")) {
      popupInfo = { icon: "🐺", title: "Eksekusi Malam", desc: `Kamu membunuh ${targetPlayer?.name}` };
    } else if (role.includes("seer")) {
      // Reveal role langsung — target dari state players
      const targetRole = players.find(p => p.id === actionTarget)?.role || "Unknown";
      popupInfo = { icon: "👁️", title: "Pengintaian", desc: `Target: ${targetPlayer?.name}`, targetName: targetPlayer?.name, targetRole };
    } else if (role.includes("guard")) {
      popupInfo = { icon: "🛡️", title: "Proteksi", desc: `Kamu melindungi ${targetPlayer?.name} selama 2 malam`, target: targetPlayer };
    } else if (role.includes("hunter")) {
      popupInfo = { icon: "🎯", title: "Berburu", desc: `Kamu menembak ${targetPlayer?.name}`, target: targetPlayer };
    } else if (role.includes("hakim") && isPistol) {
      popupInfo = { icon: "🔫", title: "Eksekusi", desc: `Kamu menembak ${targetPlayer?.name} dengan Pistol` };
    } else if (role.includes("hakim") && !isPistol) {
      popupInfo = { icon: "👁️", title: "Interogasi", desc: `Kamu Truth target ${targetPlayer?.name}` };
    }
    if (popupInfo) {
      setActionPopupData(popupInfo);
      setShowActionPopup(true);
    }

    // OPTIMISTIC: set state segera, tanpa nunggu Firebase
    setHasActedThisNight(true);

    const updates = {};

    // Write to nightHistory for logging
    const logAction = isHakim ? (isPistol ? 'Pistol' : 'Truth') : actionLabel;
    updates[`rooms/${roomCode}/nightHistory/${folder}/${playerData.id}`] = {
      senderName: playerData.name,
      role: playerData.role,
      action: logAction,
      targetId: actionTarget || "none",
      targetName: targetPlayer?.name || "Unknown",
      timestamp: Date.now()
    };

    // Hakim Pistol (siang) — INSTANT KILL: langsung set status dead
    if (isHakim && isPistol && actionTarget) {
      updates[`rooms/${roomCode}/players/${actionTarget}/status`] = 'dead';
      updates[`rooms/${roomCode}/players/${playerData.id}/pistolActed`] = true;
      updates[`rooms/${roomCode}/players/${playerData.id}/pistolUsedCount`] = pistolUsedCount + 1;
      // Langsung kirim notif kematian ke target
      updates[`rooms/${roomCode}/deadToday`] = {
        day,
        names: [targetPlayer?.name || "Unknown"],
        timestamp: Date.now()
      };
    }

    // Hakim Truth (malam)
    if (isHakim && !isPistol && actionTarget && type !== 'skip') {
      updates[`rooms/${roomCode}/players/${playerData.id}/currentAction`] = {
        role: "Hakim",
        actionType: "truth",
        targetId: actionTarget,
        targetName: targetPlayer?.name || "Unknown",
        timestamp: Date.now()
      };
      updates[`rooms/${roomCode}/players/${playerData.id}/truthActed`] = true;
      updates[`rooms/${roomCode}/players/${playerData.id}/truthUsedCount`] = (playerData?.truthUsedCount || 0) + 1;
    }

    // Guard logic
    if (role.includes("guard") && actionTarget) {
      updates[`rooms/${roomCode}/players/${playerData.id}/lastProtectedTarget`] = actionTarget;
      updates[`rooms/${roomCode}/players/${playerData.id}/lastProtectedDay`] = day;
      if (isSelfProtection) {
        updates[`rooms/${roomCode}/players/${playerData.id}/selfProtectedCount`] = (playerData.selfProtectedCount || 0) + 1;
      }
    }

    update(ref(db), updates).then(async () => {
      // Auto check win condition setelah Pistol kill
      if (isHakim && isPistol && actionTarget) {
        await checkWinCondition(roomCode);
      }
    }).catch(() => {
      // Jika gagal, reset agar user bisa coba lagi
      setHasActedThisNight(false);
    });
  };

  const sendWarlockAction = async (choice, item, targetId) => {
    const folder = `malam_${day}`;
    const targetPlayer = players.find(p => p.id === targetId);

    let popupInfo = null;
    if (choice === 'skip') {
      popupInfo = { icon: "⏭️", title: "Transaksi", desc: "Kamu Skip transaksi malam ini" };
    } else if (item === 'poison') {
      popupInfo = { icon: "☠️", title: "Pembelian Gelap", desc: `Kamu membeli POISON, incar ${targetPlayer?.name}` };
    } else if (item === 'vision') {
      popupInfo = { icon: "👁️", title: "Pembelian Gelap", desc: `Kamu membeli VISION, incar ${targetPlayer?.name}` };
    }
    if (popupInfo) {
      setActionPopupData(popupInfo);
      setShowActionPopup(true);
    }

    await set(ref(db, `rooms/${roomCode}/nightHistory/${folder}/${playerData.id}`), {
      senderName: playerData.name,
      role: playerData.role,
      choice: choice, // 'buy' or 'skip'
      item: item, // 'poison', 'vision', or null
      targetId: targetId || "none",
      targetName: targetPlayer?.name || "Skip",
      timestamp: Date.now()
    });

    // State warlock ke Firebase
    const warlockUpdates = {};
    if (choice === 'skip') {
      warlockUpdates[`rooms/${roomCode}/players/${playerData.id}/warlockSkipped`] = true;
      warlockUpdates[`rooms/${roomCode}/players/${playerData.id}/warlockActed`] = true;
    } else if (choice === 'buy' && item) {
      warlockUpdates[`rooms/${roomCode}/players/${playerData.id}/warlockInventory`] = item;
      warlockUpdates[`rooms/${roomCode}/players/${playerData.id}/warlockItemUsed`] = false;
      warlockUpdates[`rooms/${roomCode}/players/${playerData.id}/warlockActed`] = true;

      // Catat transaksi ke merchantTransaksi — untuk clue popup moderator
      const pedagangList = players.filter(p => p.role === 'Pedagang' && p.status !== 'dead');
      const randomPedagang = pedagangList.length > 0
        ? pedagangList[Math.floor(Math.random() * pedagangList.length)]
        : null;
      const transaksiRef = ref(db, `rooms/${roomCode}/merchantTransaksi/${folder}`);
      await push(transaksiRef, {
        warlock: playerData.name,
        item: item,
        targetId: targetId || "none",
        targetName: targetPlayer?.name || "Unknown",
        merchantId: randomPedagang?.id || "system",
        merchantName: randomPedagang?.name || "System",
        timestamp: Date.now()
      });
    }
    if (Object.keys(warlockUpdates).length > 0) {
      await update(ref(db), warlockUpdates);
    }

    setHasActedThisNight(true);
    setWarlockChoice(null);
    setWarlockItem(null);
    setActionTarget("");
    setShowTargetList(false);
  };

  // --- 4. CONDITIONAL RENDER (HANYA BOLEH SETELAH SEMUA HOOKS) ---
  if (winner) {
    return (
      <GameOverScreen 
        winner={winner} 
        players={players} 
        playerData={playerData} 
        onLeave={onLeave} 
      />
    );
  }

  // --- 5. THEME & UI CALCULATION ---
  const theme = (() => {
    if (isDead) return { color: "text-slate-500", bg: "bg-slate-900/50", border: "border-slate-800", icon: Ghost };
    if (role.includes('werewolf') || role.includes('warlock')) 
      return { color: "text-red-500", bg: "bg-red-950/20", border: "border-red-600", icon: Skull };
    if (role.includes('hakim')) 
      return { color: "text-amber-500", bg: "bg-amber-950/20", border: "border-amber-600", icon: Gavel };
    return { color: "text-blue-500", bg: "bg-blue-950/20", border: "border-blue-600", icon: Shield };
  })();

  const RoleIcon = theme.icon;
  const getTargetName = () => {
    if (!actionTarget) return "Pilih Target...";
    if (actionTarget === playerData?.id) return "Diri Sendiri";
    const p = players.find(p => p.id === actionTarget);
    return p ? p.name : "Pilih Target...";
  };

  return (
    <div
      className={`h-screen overflow-y-auto transition-colors duration-1000 font-sans ${isDead ? 'bg-black' : 'bg-slate-950'}`}
    >
      <style>{`
        .animate-shimmer { animation: shimmer 1s ease-out; }
        .view-role-scroll { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,0.3) transparent; }
      `}</style>
      {showIntro && <IntroFable players={players} playerData={playerData} onFinish={handleIntroFinish} />}

      <>
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-[280px] sm:max-w-xs px-2">
          <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
        </div>

        <div className="max-w-md w-full mx-auto p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 text-center pt-20 md:pt-20 pb-32 md:pb-32">
          <div className="space-y-1">
            <p className="text-slate-500 text-[8px] md:text-[10px] uppercase tracking-[0.3em]">{isNight ? 'Malam' : 'Hari'} ke-{day} • Waranasura</p>
            <h2 className={`text-base sm:text-lg md:text-xl font-bold italic transition-colors ${isDead ? 'text-slate-600' : 'text-blue-400'}`}>{playerData?.name} {playerData?.underTruth && "🔍"}</h2>
          </div>

            <div 
            onMouseDown={() => setIsRevealed(true)} 
            onMouseUp={() => setIsRevealed(false)}
            onMouseLeave={() => setIsRevealed(false)}
            onTouchStart={() => setIsRevealed(true)}
            onTouchEnd={() => setIsRevealed(false)}
            className={`relative aspect-[3/4] sm:aspect-[4/5] w-full max-w-xs sm:max-w-sm mx-auto rounded-2xl border-2 cursor-pointer overflow-hidden transition-all duration-500 select-none ${isRevealed ? 'bg-blue-950/20 border-blue-600' : 'bg-slate-900 border-slate-800 active:border-slate-600'}`}
          >
            {!isRevealed ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-blue-900/50 to-slate-900 border border-blue-700/50 flex items-center justify-center mb-4 shadow-2xl">
                  <div className="w-14 h-20 md:w-16 md:h-24 bg-gradient-to-r from-blue-950 to-slate-800 rounded-lg border border-blue-700/50" />
                </div>
                <p className="text-blue-500 font-bold tracking-widest uppercase text-[8px] md:text-[10px]">Tahan untuk lihat peran</p>
              </div>
            ) : (
              <div className={`absolute inset-0 bg-blue-950/20 flex flex-col items-center justify-center animate-in fade-in duration-500`}>
                <div className={`text-blue-500 p-4 sm:p-6 md:p-8 rounded-full bg-blue-950/30 mb-4`}>
                  <RoleIcon className={`text-blue-500 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40`} />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className={`text-3xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-blue-500`}>{playerData?.role}</h3>
                  <p className="text-slate-400 text-[8px] md:text-[10px]">Rahasiakan peranmu dari mata-mata.</p>
                </div>
              </div>
            )}
          </div>

          {/* === ACTION UI — HIDE jika tidak ada action === */}
          {(() => {
            // Tentukan apakah role ini punya action yang available — via getRoleActionConfig
            const isHakimSiang = actionConfig.phaseType === 'day' && actionConfig.canAct;
            const isHakimMalam = isNight && actionConfig.canAct && actionConfig.actionType === 'truth';
            const isWarlockMalam = role.includes("warlock") && isNight;
            const isSeerMalam = isNight && actionConfig.canAct;
            const isGuardMalam = isNight && actionConfig.canAct;
            const isHunterMalam = isNight && actionConfig.canAct;
            const isWerewolfMalam = isNight && actionConfig.canAct;
            const isDayForHakimPistol = actionConfig.phaseType === 'day' && actionConfig.canAct;

            const hasAction = isHakimSiang || isHakimMalam || isWarlockMalam || isSeerMalam || isGuardMalam || isHunterMalam || isWerewolfMalam || isDayForHakimPistol;

            if (!hasAction || isDead) return null;

            // Jika sudah action, tampilkan status saja (no buttons)
            if (hasActedThisNight) {
              return (
              <div className="p-3 md:p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">✓ Aksi Terkirim</span>
                </div>
                <p className="text-[8px] text-emerald-300/70 italic text-center">
                  {role.includes("hakim")
                    ? (isNight ? "Truth akan aktif malam ini" : "Pistol akan ditembakkan")
                    : "Keputusan sudah dicatat. Silakan tunggu fase selanjutnya."}
                </p>
              </div>
              );
            }

            return (
            <div className="p-3 md:p-4 bg-slate-900 border border-blue-500/30 rounded-2xl space-y-3">
               {actionStatus && <div className="text-[8px] md:text-[9px] font-black text-blue-400 uppercase animate-pulse">{actionStatus.msg}</div>}

               {/* ===== WARLOCK ZIGZAG ===== */}
               {isWarlockMalam && (
                 <div className="space-y-3 md:space-y-4">

                   {/* ── USE MODE: punya inventory → pilih target ── */}
                   {actionConfig.actionType === 'warlock-use' && !hasActedThisNight && (
                     <div className="space-y-3 md:space-y-4">
                       <div className="flex items-center gap-2 border-b border-purple-500/20 pb-2">
                         <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">
                           {playerData?.warlockInventory === 'poison' ? '☠️' : '👁️'} GUNAKAN {(playerData?.warlockInventory || '').toUpperCase()}
                         </span>
                       </div>
                       <p className="text-[8px] text-slate-500">Pilih target untuk menggunakan item-mu.</p>
                       <button onClick={() => setShowTargetList(!showTargetList)} className="w-full p-3 md:p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold flex justify-between items-center text-white">
                         <span className="truncate">{getTargetName()}</span>
                         <ChevronUp size={16} className={showTargetList ? "rotate-180 transition-transform" : ""} />
                       </button>
                       {showTargetList && (
                         <div className="mt-2 grid gap-1 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
                           {players.filter(p=>p.id!==playerData.id && p.status!=='dead' && p.role!=='Moderator').map(p=>(
                             <button key={p.id} onClick={()=>{setActionTarget(p.id); setShowTargetList(false);}} className="p-2 md:p-3 bg-slate-800 hover:bg-purple-600 rounded-lg text-xs text-left text-white transition-colors">{p.name}</button>
                           ))}
                         </div>
                       )}
                       <button onClick={handleWarlockUse} disabled={!actionTarget} className="w-full py-3 bg-purple-600 disabled:bg-slate-800 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">🔫 Konfirmasi</button>
                     </div>
                   )}

                   {/* ── BUY MODE: tidak punya inventory → beli/skip ── */}
                   {actionConfig.actionType !== 'warlock-use' && !hasActedThisNight && (
                   <div className="space-y-3 md:space-y-4">
                     {!warlockChoice ? (
                       <div className="space-y-2 md:space-y-3">
                         <p className="text-[8px] md:text-[9px] font-black text-purple-400 uppercase text-center">Pilih Tindakan</p>
                         <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => setWarlockChoice('buy')} className="py-2 md:py-3 bg-purple-600 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">Beli</button>
                           <button onClick={() => { setWarlockChoice('skip'); handleNightAction('skip'); }} className="py-2 md:py-3 bg-slate-800 text-slate-500 rounded-xl text-[8px] md:text-[10px] font-black uppercase active:scale-95">Skip</button>
                         </div>
                       </div>
                     ) : warlockChoice === 'buy' && !warlockItem ? (
                       <div className="space-y-2 md:space-y-3">
                         <p className="text-[8px] md:text-[9px] font-black text-purple-400 uppercase text-center">Pilih Item</p>
                         <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => setWarlockItem('poison')} className="py-2 md:py-3 bg-red-600 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">☠️ Poison</button>
                           <button onClick={() => setWarlockItem('vision')} className="py-2 md:py-3 bg-indigo-600 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">👁️ Vision</button>
                         </div>
                         <button onClick={() => { setWarlockChoice(null); setWarlockItem(null); }} className="text-[7px] md:text-[8px] text-slate-500 underline">Kembali</button>
                       </div>
                     ) : warlockChoice === 'buy' && warlockItem ? (
                       <div className="space-y-2 md:space-y-3">
                         <p className="text-[8px] md:text-[9px] font-black text-purple-400 uppercase text-center">{warlockItem === 'poison' ? '☠️ Pilih Target' : '👁️ Pilih Target Cek'}</p>
                         <button onClick={() => setShowTargetList(!showTargetList)} className="w-full p-3 md:p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold flex justify-between items-center text-white">
                           <span className="truncate">{getTargetName()}</span>
                           <ChevronUp size={16} className={showTargetList ? "rotate-180 transition-transform" : ""} />
                         </button>
                         {showTargetList && (
                           <div className="mt-2 grid gap-1 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
                             {players.filter(p=>p.id!==playerData.id && p.status!=='dead' && p.role!=='Moderator').map(p=>(
                               <button key={p.id} onClick={()=>{setActionTarget(p.id); setShowTargetList(false);}} className="p-2 md:p-3 bg-slate-800 hover:bg-purple-600 rounded-lg text-xs text-left text-white transition-colors">{p.name}</button>
                             ))}
                           </div>
                         )}
                         <div className="grid grid-cols-2 gap-2 mt-3 md:mt-4">
                           <button onClick={() => sendWarlockAction('buy', warlockItem, actionTarget)} disabled={!actionTarget} className="py-2 md:py-3 bg-purple-600 disabled:bg-slate-800 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">Kirim</button>
                           <button onClick={() => { setWarlockChoice(null); setWarlockItem(null); setActionTarget(""); }} className="py-2 md:py-3 bg-slate-800 text-slate-500 rounded-xl text-[8px] md:text-[10px] font-black uppercase active:scale-95">Batal</button>
                         </div>
                       </div>
                     ) : null}
                   </div>
                   )}
                 </div>
               )}

               {/* ===== HAKIM SIANG: PISTOL ===== */}
               {isHakimSiang && (
                 <>
                   <div className="flex items-center gap-2 border-b border-red-500/20 pb-2">
                     <span className="text-[8px] font-black uppercase tracking-widest text-red-500">🔫 Pistol — Siang Hari</span>
                   </div>
                   <p className="text-[8px] text-slate-500">
                     Tembak target dengan Pistol ({pistolRemaining} peluru tersisa)
                   </p>
                   <button onClick={() => setShowTargetList(!showTargetList)} className="w-full p-3 md:p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold flex justify-between items-center text-white">
                     <span className="truncate">{getTargetName()}</span>
                     <ChevronUp size={16} className={showTargetList ? "rotate-180 transition-transform" : ""} />
                   </button>
                   {showTargetList && (
                     <div className="mt-2 grid gap-1 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
                       {players.filter(p=>p.id!==playerData.id && p.status!=='dead' && p.role!=='Moderator').map(p=>(
                         <button key={p.id} onClick={()=>{setActionTarget(p.id); setShowTargetList(false);}} className="p-2 md:p-3 bg-slate-800 hover:bg-red-600 rounded-lg text-xs text-left text-white transition-colors">{p.name}</button>
                       ))}
                     </div>
                   )}
                   <div className="grid grid-cols-2 gap-2 mt-3 md:mt-4">
                     <button onClick={() => handleNightAction("pistol")} disabled={!actionTarget} className="py-2 md:py-3 bg-red-600 disabled:bg-slate-800 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">🔫 Tembak!</button>
                     <button onClick={() => { setActionTarget(""); handleNightAction("skip"); }} className="py-2 md:py-3 bg-slate-800 text-slate-500 rounded-xl text-[8px] md:text-[10px] font-black uppercase active:scale-95 transition-all">Skip</button>
                   </div>
                 </>
               )}

               {/* ===== HAKIM MALAM: TRUTH ===== */}
               {isHakimMalam && (
                 <>
                   <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
                     <span className="text-[8px] font-black uppercase tracking-widest text-amber-500">👁️ Truth — Malam</span>
                   </div>
                   <p className="text-[8px] text-slate-500">Pilih target untuk bocorkan chat pribadinya ke publik.</p>
                   <button onClick={() => setShowTargetList(!showTargetList)} className="w-full p-3 md:p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold flex justify-between items-center text-white">
                     <span className="truncate">{getTargetName()}</span>
                     <ChevronUp size={16} className={showTargetList ? "rotate-180 transition-transform" : ""} />
                   </button>
                   {showTargetList && (
                     <div className="mt-2 grid gap-1 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
                       {players.filter(p=>p.id!==playerData.id && p.status!=='dead' && p.role!=='Moderator').map(p=>(
                         <button key={p.id} onClick={()=>{setActionTarget(p.id); setShowTargetList(false);}} className="p-2 md:p-3 bg-slate-800 hover:bg-amber-600 rounded-lg text-xs text-left text-white transition-colors">{p.name}</button>
                       ))}
                     </div>
                   )}
                   <div className="grid grid-cols-2 gap-2 mt-3 md:mt-4">
                     <button onClick={() => handleNightAction("Truth")} disabled={!actionTarget} className="py-2 md:py-3 bg-amber-600 disabled:bg-slate-800 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">👁️ Truth</button>
                     <button onClick={() => { setActionTarget(""); handleNightAction("skip"); }} className="py-2 md:py-3 bg-slate-800 text-slate-500 rounded-xl text-[8px] md:text-[10px] font-black uppercase active:scale-95 transition-all">Skip</button>
                   </div>
                 </>
               )}

               {/* ===== OTHER ROLES (Seer, Guard, Hunter, Werewolf) ===== */}
               {!role.includes("warlock") && !role.includes("hakim") && (
                 <>
                   {/* Guard constraint info */}
                   {role.includes("guard") && (
                     <div className="text-[7px] md:text-[8px] text-slate-500 uppercase text-center">
                       {isGuardCooldown && <span className="text-red-500">Tidak bisa lindungi target sama • </span>}
                       {!canGuardSelf && <span className="text-amber-500"> sudah lindungi diri </span>}
                     </div>
                   )}
                   <button onClick={() => setShowTargetList(!showTargetList)} className="w-full p-3 md:p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold flex justify-between items-center text-white">
                     <span className="truncate">{getTargetName()}</span>
                     <ChevronUp size={16} className={showTargetList ? "rotate-180 transition-transform" : ""} />
                   </button>
                   {showTargetList && (
                     <div className="mt-2 grid gap-1 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
                       {players.filter(p=>p.id!==playerData.id && p.status!=='dead' && p.role!=='Moderator').map(p=>{
                         const isSameTargetAsLastNight = role.includes("guard") && guardLastProtected === p.id && isGuardCooldown;
                         const isSelfDisabled = role.includes("guard") && p.id === playerData?.id && !canGuardSelf;
                         const isDisabled = isSameTargetAsLastNight || isSelfDisabled;
                         return (
                           <button key={p.id} onClick={()=>{setActionTarget(p.id); setShowTargetList(false);}} disabled={isDisabled} className={`p-2 md:p-3 rounded-lg text-xs text-left transition-colors ${isDisabled ? 'bg-slate-900 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-blue-600 text-white'}`}>
                             {p.name}{isSameTargetAsLastNight && <span className="text-[7px] text-red-500 ml-1">↺</span>}{isSelfDisabled && <span className="text-[7px] text-amber-500 ml-1">★</span>}
                           </button>
                         );
                       })}
                     </div>
                   )}
                   <div className="grid grid-cols-2 gap-2 mt-3 md:mt-4">
                     <button onClick={() => handleNightAction("Konfirmasi")} disabled={!actionTarget} className="py-2 md:py-3 bg-blue-600 disabled:bg-slate-800 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">Konfirmasi</button>
                     <button onClick={() => { setActionTarget(""); handleNightAction("skip"); }} className="py-2 md:py-3 bg-slate-800 text-slate-500 rounded-xl text-[8px] md:text-[10px] font-black uppercase active:scale-95 transition-all">Skip</button>
                   </div>
                 </>
               )}
            </div>
            );
          })()}

            <button onClick={() => setShowMechanics(true)} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-amber-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-colors"><BookOpen size={14} /> Panduan</button>
            
            {/* Pedagang Clue Display - Only show when popup is closed */}
            {role.includes("pedagang") && myClues && !showCluePopup && (
              <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={14} className="text-emerald-500" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Clue dari暗中 (Dagang)</p>
                </div>
                <p className="text-xs text-emerald-400 italic leading-relaxed">{myClues.message}</p>
                <p className="text-[7px] text-slate-500">Hari ke-{myClues.day}</p>
              </div>
            )}
          <button
            onClick={onNext}
            className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl text-blue-400 font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            🗳️ Vote
          </button>
          <button onClick={() => {
            const msg = gameWinner ? "Room akan dihapus dari database. Lanjutkan?" : "Statusmu jadi MATI. Lanjutkan?";
            showNotif("Keluar", msg, "confirm", onLeave);
          }} className="w-full pt-4 text-[9px] text-slate-700 hover:text-red-500 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-colors"><X size={12} /> Keluar & Menyerah</button>
        </div>
        <ChatRoom roomCode={roomCode} myId={playerData?.id} myName={playerData?.name} players={players || []} isHost={false} />
        <RoleModal role={playerData?.role} isOpen={showMechanics} onClose={() => setShowMechanics(false)} />

        {/* ACTION POPUP */}
        {showActionPopup && actionPopupData && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: Z_LAYER.ACTION_MODAL }}>
            <div className={`bg-slate-900 border ${actionPopupData.isMiss ? 'border-red-500' : 'border-blue-500/30'} rounded-[2rem] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden`}>
              {actionPopupData.isMiss && (
                <>
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-1 h-16 bg-white/20 rotate-45 rounded-full" />
                    <div className="absolute top-1/4 right-1/4 w-1 h-16 bg-white/20 -rotate-45 rounded-full" />
                    <div className="absolute top-1/2 left-1/3 w-1 h-12 bg-white/10 rotate-12 rounded-full" />
                    <div className="absolute top-1/3 right-1/3 w-1 h-14 bg-white/10 -rotate-[30deg] rounded-full" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent animate-pulse" />
                </>
              )}
              <div className="text-6xl mb-2">{actionPopupData.icon}</div>
              <h2 className={`text-xl font-black uppercase italic tracking-tighter ${actionPopupData.isMiss ? 'text-red-500' : 'text-white'}`}>{actionPopupData.title}</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{actionPopupData.desc}</p>
              {actionPopupData.targetName && (
                <div className="bg-slate-950/50 border border-blue-500/20 rounded-xl py-3 px-4 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Target</p>
                  <p className="font-black text-white text-lg">{actionPopupData.targetName}</p>
                  {actionPopupData.targetRole && (
                    <span className="inline-block px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 font-black text-sm">
                      {actionPopupData.targetRole}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowActionPopup(false)}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all ${actionPopupData.isMiss ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {showCluePopup && myClues && role.includes("pedagang") && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: Z_LAYER.ACTION_MODAL }}>
            <div className="bg-gradient-to-br from-emerald-800 to-teal-600 rounded-[2rem] p-1 w-full max-w-sm md:max-w-lg shadow-2xl shadow-emerald-900/50 animate-in zoom-in duration-300">
              <div className="bg-slate-900 rounded-[1.8rem] p-4 md:p-6 space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-600/20 rounded-full mx-auto flex items-center justify-center">
                    <ShoppingBag size={32} className="text-emerald-400" />
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-emerald-400 uppercase italic">暗中 (Pelanggan Gelap)</h2>
                  <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest">Kamu mendapat pesan rahasia!</p>
                </div>

                {/* Message */}
                <div className="bg-slate-950/50 border border-emerald-500/30 rounded-xl p-4">
                  <p className="text-sm md:text-base text-emerald-300 italic leading-relaxed text-center">"{myClues.message}"</p>
                </div>

                {/* Info */}
                <div className="text-center">
                  <p className="text-[7px] md:text-[8px] text-slate-600 font-bold uppercase tracking-widest">Hari ke-{myClues.day} • Dari: {myClues.from}</p>
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setShowCluePopup(false)}
                  className="w-full py-3 bg-emerald-600 rounded-xl font-black uppercase text-xs md:text-sm shadow-lg hover:bg-emerald-500 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default ViewRole;