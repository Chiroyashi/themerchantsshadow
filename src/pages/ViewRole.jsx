import React, { useState, useEffect } from 'react';
import { ref, set, onValue, update } from "firebase/database";
import { db } from "../lib/firebase";
import {
  Eye, EyeOff, Shield, Skull, HelpCircle, BookOpen, X, Ghost,
  LayoutGrid, MessageSquare, Send, Zap, Search, Crosshair,
  ShoppingCart, ChevronUp, User, UserCheck, Info, Clock, Gavel, ShoppingBag
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import RoleModal from '../components/RoleModal';
import ChatRoom from '../components/ChatRoom';
import DeathAnnouncement from '../components/DeathAnnouncement';
import IntroFable from '../components/IntroFable';
import GameOverScreen from '../components/GameOverScreen';
import PhaseTransition from '../components/PhaseTransition';
import { useGameContext } from '../contexts/GameContext';
import { useTimerContext } from '../contexts/TimerContext';

const ViewRole = ({ onNext }) => {
  const {
    players, roomCode, myPlayerId, myData, playerName,
    isHost, gameWinner, handleLeaveGame
  } = useGameContext();
  const totalPlayers = players.filter(p => p.role !== 'Moderator').length;
  const { seconds, phase, isActive, day } = useTimerContext();
  const playerData = myData;
  const winner = gameWinner;
  const onLeave = () => handleLeaveGame(!!gameWinner);
  // --- 1. DEKLARASI SEMUA HOOKS (WAJIB DI ATAS) ---
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);
  const [actionTarget, setActionTarget] = useState("");
  const [showTargetList, setShowTargetList] = useState(false);
  const [myClues, setMyClues] = useState(null);
  const [deadToday, setDeadToday] = useState([]);
  const [showDeathPopUp, setShowDeathPopUp] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showCluePopup, setShowCluePopup] = useState(false);
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [transitionFrom, setTransitionFrom] = useState('');
  const [transitionTo, setTransitionTo] = useState('');

  useEffect(() => {
    const checkIntro = async () => {
      // Jika sudah ada di localStorage atau bukan hari 1 phase Pagi, skip
      if (localStorage.getItem(`intro_${roomCode}`)) return;
      // Hanya tampilkan intro jika day = 1 dan phase ada dan contains "Pagi"
      if (day !== 1 || !phase || !phase.includes("Pagi") || winner) return;
      
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

  const [visionResult, setVisionResult] = useState(null);
  const [hasActedThisNight, setHasActedThisNight] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);

  // Warlock-specific state
  const [warlockChoice, setWarlockChoice] = useState(null); // 'buy' or 'skip'
  const [warlockItem, setWarlockItem] = useState(null); // 'poison' or 'vision'

  const isDead = playerData?.status === 'dead';
  const isNight = phase?.toLowerCase().includes("malam");
  const role = playerData?.role?.toLowerCase() || "";

  // Truth limit tracking (after role is declared)
  const truthUsedCount = playerData?.truthUsedCount || 0;
  const truthMaxUses = role === 'hakim'
    ? (totalPlayers < 10 ? 2 : totalPlayers < 20 ? 3 : 4)
    : 0;
  const truthRemaining = Math.max(0, truthMaxUses - truthUsedCount);

  // Hakim pistol tracking
  const pistolUsedCount = playerData?.pistolUsedCount || 0;
  const pistolRemaining = Math.max(0, 2 - pistolUsedCount);
  const truthActed = playerData?.truthActed || false;
  const pistolActed = playerData?.pistolActed || false;

  // Guard constraint: tidak bisa melindungi pemain sama 2x berturut-turut
  const guardLastProtected = playerData?.lastProtectedTarget || null;
  const guardLastProtectedDay = playerData?.lastProtectedDay || null;
  const isGuardLocked = role.includes("guard") && guardLastProtectedDay === day - 1;
  
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
    if (!roomCode) return;
    const deadRef = ref(db, `rooms/${roomCode}/deadToday`);
    const unsubscribe = onValue(deadRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.names && data.names.length > 0) {
        setDeadToday(data.names);
        setShowDeathPopUp(true);
      } else {
        setShowDeathPopUp(false);
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

  const [prevPhase, setPrevPhase] = useState(null);
  useEffect(() => {
    if (!phase) return;
    const isNightToMorning = prevPhase?.toLowerCase().includes("malam") && phase.toLowerCase().includes("pagi");
    if (prevPhase && prevPhase !== phase && !isHost && playerData?.role !== 'Moderator' && !isNightToMorning) {
      setTransitionFrom(prevPhase);
      setTransitionTo(phase);
      setShowPhaseTransition(true);
    }
    setPrevPhase(phase);
  }, [phase, prevPhase, isHost, playerData?.role]);

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

  const handleSwipe = (e, isMobile = false) => {
    if (!isMobile) return;
    if (onNext) onNext();
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.touches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 80) {
      if (onNext) onNext();
      setTouchStartX(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  const handleNightAction = (type) => {
    if (hasActedThisNight && type !== 'skip') return;

    // Handle Warlock 2-stage action
    if (role.includes('warlock') && isNight) {
      if (!warlockChoice) {
        setWarlockChoice(type);
        if (type === 'skip') {
          sendWarlockAction('skip', null, null);
        }
        return;
      } else if (warlockChoice === 'buy' && !warlockItem && type !== 'skip') {
        setWarlockItem(type);
        return;
      }
    }

    const targetPlayer = players.find(p => p.id === actionTarget);
    const folder = isNight ? `malam_${day}` : `hari_${day}`;

    const actionLabel = role.includes('warlock') && warlockItem
      ? `${warlockItem.toUpperCase()}`
      : type;

    const isSelfProtection = role.includes("guard") && actionTarget === playerData?.id;
    const isHakim = role.includes("hakim");
    const isPistol = type === 'pistol';

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

    // Hakim Pistol (siang) — langsung kill via currentAction
    if (isHakim && isPistol && actionTarget) {
      updates[`rooms/${roomCode}/players/${playerData.id}/currentAction`] = {
        role: "Hakim",
        actionType: "pistol",
        targetId: actionTarget,
        targetName: targetPlayer?.name || "Unknown",
        timestamp: Date.now()
      };
      updates[`rooms/${roomCode}/players/${playerData.id}/pistolActed`] = true;
      updates[`rooms/${roomCode}/players/${playerData.id}/pistolUsedCount`] = pistolUsedCount + 1;
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
    }

    // Guard logic
    if (role.includes("guard") && actionTarget) {
      updates[`rooms/${roomCode}/players/${playerData.id}/lastProtectedTarget`] = actionTarget;
      updates[`rooms/${roomCode}/players/${playerData.id}/lastProtectedDay`] = day;
      if (isSelfProtection) {
        updates[`rooms/${roomCode}/players/${playerData.id}/selfProtectedCount`] = (playerData.selfProtectedCount || 0) + 1;
      }
    }

    update(ref(db), updates).then(() => {
      setHasActedThisNight(true);
    });
  };

  const sendWarlockAction = async (choice, item, targetId) => {
    const folder = `malam_${day}`;
    const targetPlayer = players.find(p => p.id === targetId);
    
    await set(ref(db, `rooms/${roomCode}/nightHistory/${folder}/${playerData.id}`), {
      senderName: playerData.name,
      role: playerData.role,
      choice: choice, // 'buy' or 'skip'
      item: item, // 'poison', 'vision', or null
      targetId: targetId || "none",
      targetName: targetPlayer?.name || "Skip",
      timestamp: Date.now()
    });
    
    setHasActedThisNight(true);
    setWarlockChoice(null);
    setWarlockItem(null);
    setActionTarget("");
    setShowTargetList(false);
    triggerNotif(`Aksi berhasil dikirim!`, 'success');
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        .animate-shimmer { animation: shimmer 1s ease-out; }
        .view-role-scroll { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,0.3) transparent; }
      `}</style>
      {showIntro && <IntroFable players={players} playerData={playerData} onFinish={handleIntroFinish} />}
      {showDeathPopUp && <DeathAnnouncement deadPlayers={deadToday} day={day} onClose={() => setShowDeathPopUp(false)} />}
      {showPhaseTransition && !isHost && playerData?.role !== 'Moderator' && (
        <PhaseTransition
          fromPhase={transitionFrom}
          toPhase={transitionTo}
          day={day}
          onComplete={() => setShowPhaseTransition(false)}
        />
      )}

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
            // Tentukan apakah role ini punya action yang available
            const isHakimSiang = role.includes("hakim") && !isNight && pistolRemaining > 0 && !pistolActed;
            const isHakimMalam = role.includes("hakim") && isNight && !truthActed;
            const isWarlockMalam = role.includes("warlock") && isNight;
            const isSeerMalam = role.includes("seer") && isNight;
            const isGuardMalam = role.includes("guard") && isNight && !isGuardLocked;
            const isHunterMalam = role.includes("hunter") && isNight;
            const isWerewolfMalam = role.includes("werewolf") && isNight;
            const isDayForHakimPistol = role.includes("hakim") && !isNight && pistolRemaining > 0 && !pistolActed;

            const hasAction = isHakimSiang || isHakimMalam || isWarlockMalam || isSeerMalam || isGuardMalam || isHunterMalam || isWerewolfMalam || isDayForHakimPistol;

            if (!hasAction || isDead) return null;

            return (
            <div className="p-3 md:p-4 bg-slate-900 border border-blue-500/30 rounded-2xl space-y-3">
               {actionStatus && <div className="text-[8px] md:text-[9px] font-black text-blue-400 uppercase animate-pulse">{actionStatus.msg}</div>}

               {/* ===== WARLOCK ZIGZAG ===== */}
               {isWarlockMalam && (
                 <div className="space-y-3 md:space-y-4">
                   {!warlockChoice ? (
                     // Stage 1: Buy or Skip (Malam 1) / Use or Buy (Malam 2+)
                     <div className="space-y-2 md:space-y-3">
                       <p className="text-[8px] md:text-[9px] font-black text-purple-400 uppercase text-center">Pilih Tindakan</p>
                       <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => setWarlockChoice('buy')} className="py-2 md:py-3 bg-purple-600 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">Beli</button>
                         <button onClick={() => { setWarlockChoice('skip'); handleNightAction('skip'); }} className="py-2 md:py-3 bg-slate-800 text-slate-500 rounded-xl text-[8px] md:text-[10px] font-black uppercase active:scale-95">Skip</button>
                       </div>
                     </div>
                   ) : warlockChoice === 'buy' && !warlockItem ? (
                     // Stage 2: Choose Poison or Vision
                     <div className="space-y-2 md:space-y-3">
                       <p className="text-[8px] md:text-[9px] font-black text-purple-400 uppercase text-center">Pilih Item</p>
                       <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => setWarlockItem('poison')} className="py-2 md:py-3 bg-red-600 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">☠️ Poison</button>
                         <button onClick={() => setWarlockItem('vision')} className="py-2 md:py-3 bg-indigo-600 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">👁️ Vision</button>
                       </div>
                       <button onClick={() => { setWarlockChoice(null); setWarlockItem(null); }} className="text-[7px] md:text-[8px] text-slate-500 underline">Kembali</button>
                     </div>
                   ) : warlockChoice === 'buy' && warlockItem ? (
                     // Stage 3: Select Target (untuk pembelian)
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
                       {isGuardLocked && <span className="text-red-500">Tidak bisa lindungi target sama • </span>}
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
                         const isSameTargetAsLastNight = role.includes("guard") && guardLastProtected === p.id && isGuardLocked;
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
          <div className="flex items-center justify-center gap-2 text-slate-600 text-[8px] font-bold uppercase tracking-widest">
            <button 
              onClick={onNext}
              className="flex items-center gap-2 animate-pulse hover:text-blue-400 transition-colors"
            >
              <span>←</span>
              <span>Geser untuk Papan Game</span>
              <span>→</span>
            </button>
          </div>
          <button onClick={() => {
            if (window.confirm(gameWinner ? "Room akan dihapus dari database. Lanjutkan?" : "Statusmu jadi MATI. Lanjutkan?")) {
              onLeave();
            }
          }} className="w-full pt-4 text-[9px] text-slate-700 hover:text-red-500 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-colors"><X size={12} /> Keluar & Menyerah</button>
        </div>
        <div className="w-full pt-10 border-t border-slate-900 text-left">
          <ChatRoom roomCode={roomCode} myId={playerData?.id} myName={playerData?.name} players={players || []} isHost={false} />
        </div>
        <RoleModal role={playerData?.role} isOpen={showMechanics} onClose={() => setShowMechanics(false)} />

        {/* PEDAGANG CLUE POPUP */}
        {showCluePopup && myClues && role.includes("pedagang") && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
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