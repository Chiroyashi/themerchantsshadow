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

const ViewRole = ({ playerData, roomCode, phase, seconds, isActive, onNext, onLeave, players, day, winner, isHost }) => {
  // --- 1. DEKLARASI SEMUA HOOKS (WAJIB DI ATAS) ---
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);
  const [actionTarget, setActionTarget] = useState("");
  const [showTargetList, setShowTargetList] = useState(false);
  const [myClues, setMyClues] = useState(null);
  const [deadToday, setDeadToday] = useState([]);
  const [showDeathPopUp, setShowDeathPopUp] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

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

  const isDead = playerData?.status === 'dead';
  const isNight = phase?.toLowerCase().includes("malam");
  const role = playerData?.role?.toLowerCase() || "";

  const isGuardLocked = role.includes("guard") && 
                       playerData?.lastActedDay && 
                       (day - playerData.lastActedDay) < 2;

  // --- 2. SEMUA USE EFFECTS ---
  useEffect(() => {
    setHasActedThisNight(false);
    setVisionResult(null);
    setActionStatus(null);
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
        setMyClues(snapshot.val());
      });
      return () => unsubscribe();
    }
  }, [roomCode, playerData?.id, role]);

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

  const handleNightAction = (type) => {
    if (hasActedThisNight && type !== 'skip') return;
    const targetPlayer = players.find(p => p.id === actionTarget);
    const folder = isNight ? `malam_${day}` : `hari_${day}`;
    
    set(ref(db, `rooms/${roomCode}/nightHistory/${folder}/${playerData.id}`), {
      senderName: playerData.name,
      role: playerData.role,
      action: type,
      targetId: actionTarget || "none",
      targetName: targetPlayer?.name || "Skip",
      timestamp: Date.now()
    }).then(() => {
      setHasActedThisNight(true);
      setActionTarget(""); setShowTargetList(false);
      triggerNotif(`Aksi berhasil dikirim!`, 'success');
    });
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
    <div className={`min-h-screen transition-colors duration-1000 p-6 flex flex-col items-center font-sans ${isDead ? 'bg-black' : 'bg-slate-950'}`}>
      <style>{`
        .animate-shimmer { animation: shimmer 1s ease-out; }
      `}</style>
      {showIntro && <IntroFable players={players} playerData={playerData} onFinish={handleIntroFinish} />}
      {showDeathPopUp && <DeathAnnouncement deadPlayers={deadToday} day={day} onClose={() => setShowDeathPopUp(false)} />}
      
      <>
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 scale-90 md:scale-100">
          <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
        </div>

        <div className="max-w-md w-full space-y-6 text-center pt-20 pb-20 mt-10">
          <div className="space-y-1">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">{isNight ? 'Malam' : 'Hari'} ke-{day} • Waranasura</p>
            <h2 className={`text-xl font-bold italic transition-colors ${isDead ? 'text-slate-600' : 'text-slate-100'}`}>{playerData?.name} {playerData?.underTruth && "🔍"}</h2>
          </div>

          <div 
            onMouseDown={() => setIsRevealed(true)} 
            onMouseUp={() => setIsRevealed(false)}
            onMouseLeave={() => setIsRevealed(false)}
            onTouchStart={() => setIsRevealed(true)}
            onTouchEnd={() => setIsRevealed(false)}
            className={`relative aspect-[3/4] w-full rounded-2xl border-2 cursor-pointer overflow-hidden transition-all duration-500 select-none ${isRevealed ? `${theme.bg} ${theme.border}` : 'bg-slate-900 border-slate-800 active:border-slate-600'}`}
          >
            {!isRevealed ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center mb-4 shadow-2xl">
                  <div className="w-16 h-24 bg-gradient-to-r from-slate-950 to-slate-800 rounded-lg border border-slate-700" />
                </div>
                <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">Tahan untuk lihat peran</p>
              </div>
            ) : (
              <div className={`absolute inset-0 ${theme.bg} flex flex-col items-center justify-center animate-in fade-in duration-500`}>
                <div className={`${theme.color} p-6 rounded-full bg-black/20 mb-4`}>
                  <RoleIcon className={`${theme.color} w-28 h-28`} />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className={`text-5xl font-black uppercase italic tracking-tighter ${theme.color}`}>{playerData?.role}</h3>
                  <p className="text-slate-400 text-[10px]">Rahasiakan peranmu dari mata-mata.</p>
                </div>
              </div>
            )}
          </div>

          {/* Action UI */}
          {((role.includes("hakim") && !isNight) || (isNight && !role.includes("pedagang"))) && !isDead && (
            <div className="p-4 bg-slate-900 border border-blue-500/30 rounded-2xl space-y-3">
               {actionStatus && <div className="text-[9px] font-black text-blue-400 uppercase animate-pulse">{actionStatus.msg}</div>}
               <button 
                 onClick={() => { setShowTargetList(!showTargetList); reportTruthActivity("sedang memantau target..."); }}
                 className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold flex justify-between items-center text-white"
               >
                 <span>{getTargetName()}</span>
                 <ChevronUp size={16} className={showTargetList ? "rotate-180 transition-transform" : ""} />
               </button>
               {showTargetList && (
                 <div className="mt-2 grid gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                   {players.filter(p=>p.id!==playerData.id && p.status!=='dead' && p.role!=='Moderator').map(p=>(
                     <button key={p.id} onClick={()=>{setActionTarget(p.id); setShowTargetList(false); reportTruthActivity(`mengincar ${p.name}`);}} className="p-3 bg-slate-800 hover:bg-blue-600 rounded-lg text-xs text-left text-white transition-colors">{p.name}</button>
                   ))}
                 </div>
               )}
               <div className="grid grid-cols-2 gap-2 mt-4">
                 <button onClick={() => handleNightAction("Konfirmasi")} className="py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">Konfirmasi</button>
                 <button onClick={() => { setActionTarget(""); handleNightAction("skip"); }} className="py-3 bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all">Skip</button>
               </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowMechanics(true)} className="flex items-center justify-center gap-2 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-amber-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-colors"><BookOpen size={14} /> Panduan</button>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-600 text-[8px] font-bold uppercase tracking-widest">
            <span className="animate-pulse">← Geser untuk Papan Game →</span>
          </div>
          <button onClick={onLeave} className="w-full pt-4 text-[9px] text-slate-700 hover:text-red-500 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-colors"><X size={12} /> Keluar & Menyerah</button>
        </div>
        <div className="w-full pt-10 border-t border-slate-900 text-left">
          <ChatRoom roomCode={roomCode} myId={playerData?.id} myName={playerData?.name} players={players || []} isHost={false} />
        </div>
        <RoleModal role={playerData?.role} isOpen={showMechanics} onClose={() => setShowMechanics(false)} />
      </>
    </div>
  );
};

export default ViewRole;