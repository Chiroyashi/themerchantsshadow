import React, { useState, useEffect } from 'react'; 
import { ref, set, onValue, update } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  Eye, EyeOff, Shield, Skull, HelpCircle, BookOpen, X, Ghost, 
  LayoutGrid, MessageSquare, Send, Zap, Search, Crosshair, 
  ShoppingCart, ChevronUp, User, UserCheck, Info, Clock, Gavel
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import RoleModal from '../components/RoleModal';
import ChatRoom from '../components/ChatRoom';
import DeathAnnouncement from '../components/DeathAnnouncement';

const ViewRole = ({ playerData, roomCode, phase, seconds, isActive, onNext, onLeave, players, day }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);
  const [actionTarget, setActionTarget] = useState("");
  const [showTargetList, setShowTargetList] = useState(false);
  const [myClues, setMyClues] = useState(null);
  const [deadToday, setDeadToday] = useState([]);
  const [showDeathPopUp, setShowDeathPopUp] = useState(false);

  // --- STATE UNTUK FEEDBACK & LIMITASI ---
  const [visionResult, setVisionResult] = useState(null);
  const [hasActedThisNight, setHasActedThisNight] = useState(false);
  const [actionStatus, setActionStatus] = useState(null); 

  const isDead = playerData?.status === 'dead';
  const isNight = phase?.toLowerCase().includes("malam");
  const role = playerData?.role?.toLowerCase() || "";

  // Logic Lock Cooldown Guard (2 Malam)
  const isGuardLocked = role.includes("guard") && 
                       playerData?.lastActedDay && 
                       (day - playerData.lastActedDay) < 2;

  // Reset status aksi lokal setiap malam/hari berganti
  useEffect(() => {
    setHasActedThisNight(false);
    setVisionResult(null);
    setActionStatus(null);
  }, [day, phase]);

  // 1. LISTENER KEMATIAN HARIAN (FIXED SYNC)
  useEffect(() => {
    if (!roomCode) return;
    
    const deadRef = ref(db, `rooms/${roomCode}/deadToday`);
    const unsubscribe = onValue(deadRef, (snapshot) => {
      const data = snapshot.val();
      
      // Mengabaikan pengecekan day yang kaku agar pop-up sempat muncul sebelum state day berganti
      if (data && data.names && data.names.length > 0) {
        setDeadToday(data.names);
        setShowDeathPopUp(true);
      } else {
        setShowDeathPopUp(false);
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  // 2. LISTENER CLUE PEDAGANG
  useEffect(() => {
    if (role.includes("pedagang") && playerData?.id) {
      const clueRef = ref(db, `rooms/${roomCode}/merchantClues/${playerData.id}`);
      const unsubscribe = onValue(clueRef, (snapshot) => {
        setMyClues(snapshot.val());
      });
      return () => unsubscribe();
    }
  }, [roomCode, playerData?.id, role]);

  const theme = (() => {
    if (isDead) return { color: "text-slate-500", bg: "bg-slate-900/50", border: "border-slate-800", icon: Ghost };
    if (role.includes('werewolf') || role.includes('warlock')) 
      return { color: "text-red-500", bg: "bg-red-950/20", border: "border-red-600", icon: Skull };
    if (role.includes('hakim')) 
      return { color: "text-amber-500", bg: "bg-amber-950/20", border: "border-amber-600", icon: Gavel };
    return { color: "text-blue-500", bg: "bg-blue-950/20", border: "border-blue-600", icon: Shield };
  })();

  const RoleIcon = theme.icon;

  const handleNightAction = (type) => {
    if (role.includes("guard") && isGuardLocked && type !== 'skip') {
      setActionStatus({ type: 'error', msg: 'Guard masih cooldown!' });
      return;
    }
    if (hasActedThisNight && type !== 'skip') {
      setActionStatus({ type: 'error', msg: 'Kemampuan sudah terpakai!' });
      return;
    }

    const isWarlockReq = role.includes("warlock") && actionTarget === "SISTEM_RANDOM";
    if (!actionTarget && type !== 'skip' && !isWarlockReq) {
      setActionStatus({ type: 'error', msg: 'Pilih target terlebih dahulu!' });
      return;
    }

    const targetPlayer = players.find(p => p.id === actionTarget);
    const folder = isNight ? `malam_${day}` : `hari_${day}`;
    const actionRef = ref(db, `rooms/${roomCode}/nightHistory/${folder}/${playerData.id}`);
    
    const actionData = {
      senderName: playerData.name,
      role: playerData.role,
      action: role.includes("hakim") ? "Truth (Reveal)" : type,
      targetId: actionTarget || "none",
      targetName: isWarlockReq ? "Pedagang (Sistem)" : (targetPlayer?.name || "Skip"),
      timestamp: Date.now()
    };

    set(actionRef, actionData).then(() => {
      setHasActedThisNight(true);

      if (role.includes("guard") && type === 'Jaga') {
        update(ref(db, `rooms/${roomCode}/players/${playerData.id}`), { lastActedDay: day });
      }

      if ((role.includes("seer") || role.includes("hakim")) && type !== 'skip' && targetPlayer) {
        setVisionResult({ name: targetPlayer.name, role: targetPlayer.role.toUpperCase() });
        setActionStatus({ type: 'success', msg: role.includes("hakim") ? 'Kebenaran terungkap!' : 'Penglihatan berhasil!' });
      } else {
        setActionStatus({ type: 'success', msg: `Tindakan ${type} direkam!` });
      }
      
      setActionTarget(""); 
      setShowTargetList(false);
      setTimeout(() => setActionStatus(null), 3000);
    });
  };

  const canAct = () => {
    if (isDead) return false;
    if (role.includes("hakim") && !isNight) return true; 
    if (!isNight) return false;
    if (day === 1) return role.includes("seer") || role.includes("guard") || role.includes("hakim");
    return !role.includes("pedagang") && !role.includes("warga");
  };

  const getTargetName = () => {
    if (!actionTarget) return "Pilih Target...";
    if (actionTarget === playerData.id) return "Diri Sendiri";
    const p = players.find(p => p.id === actionTarget);
    return p ? p.name : "Pilih Target...";
  };

  const renderActionUI = () => {
    if (role.includes("pedagang") && !isDead) {
      return (
        <div className="w-full mt-6 p-6 bg-slate-900 border border-emerald-500/30 rounded-[2rem] space-y-4 animate-in zoom-in shadow-2xl relative text-left">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center">
            <ShoppingCart size={20} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-[9px] text-emerald-500 font-black uppercase tracking-tighter">Toko: Terbuka</p>
            <p className="text-[10px] text-slate-400 mt-1 italic">Warlock mungkin memantau tokomu malam ini.</p>
          </div>
          {myClues && (
            <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Info size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Pesan Moderator</span>
              </div>
              <p className="text-xs font-bold text-white leading-relaxed italic">"{myClues.clue}"</p>
              <p className="text-[7px] text-slate-500 mt-2 uppercase font-black">Malam {myClues.night}</p>
            </div>
          )}
        </div>
      );
    }

    if (!canAct()) return null;

    return (
      <div className="w-full mt-6 p-6 bg-slate-900 border border-blue-500/30 rounded-[2rem] space-y-4 animate-in zoom-in shadow-2xl relative text-left">
        <div className="flex items-center justify-between text-blue-400">
          <div className="flex items-center gap-2">
            <Zap size={18} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-widest">Otoritas Peran</span>
          </div>
          <span className="text-[9px] font-black bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{isNight ? `NIGHT ${day}` : `DAY ${day}`}</span>
        </div>

        {actionStatus && (
          <div className={`p-2 rounded-lg text-center font-black text-[8px] uppercase tracking-[0.2em] animate-in slide-in-from-top-2 ${
            actionStatus.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'
          }`}>
            {actionStatus.msg}
          </div>
        )}

        {(role.includes("seer") || role.includes("hakim")) && visionResult && (
          <div className="p-4 bg-purple-500/10 border-2 border-purple-500/30 rounded-2xl animate-in slide-in-from-top-4">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Eye size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">{role.includes("hakim") ? "Hakim: Truth" : "Seer: Vision"}</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-1">Identitas asli <span className="text-white font-bold">{visionResult.name}</span>:</p>
            <p className="text-xl font-black text-white italic tracking-tighter uppercase">{visionResult.role}</p>
          </div>
        )}

        {isGuardLocked && !isDead && (
          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl mb-2 animate-pulse text-center">
            <Clock size={20} className="text-amber-500 mx-auto mb-2" />
            <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest block">Guard Cooldown</span>
            <p className="text-[10px] text-slate-300 leading-tight mt-1">Kamu sedang beristirahat. Aktif kembali dalam {2 - (day - playerData.lastActedDay)} malam.</p>
          </div>
        )}

        {!hasActedThisNight && !isGuardLocked ? (
          <>
            {role.includes("hakim") && !isNight && (
              <p className="text-[10px] text-amber-500 italic px-1 text-center">Tunjuk satu pemain untuk membongkar identitasnya.</p>
            )}

            {role.includes("warlock") && isNight && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setActionTarget("SISTEM_RANDOM"); handleNightAction("Beli Vision"); }} className="py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all">Beli Vision</button>
                  <button onClick={() => { setActionTarget("SISTEM_RANDOM"); handleNightAction("Beli Poison"); }} className="py-3 bg-rose-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all">Beli Poison</button>
                </div>
              </div>
            )}

            {((role.includes("hakim") && !isNight) || (isNight && !role.includes("warlock") && !role.includes("pedagang"))) && (
              <div className="space-y-3 pt-2 relative">
                <div className="relative">
                  <button onClick={() => setShowTargetList(!showTargetList)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 font-bold text-sm ${showTargetList ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'}`}>
                    <div className="flex items-center gap-3">
                      {actionTarget ? <UserCheck size={18} className="text-blue-500" /> : <User size={18} />}
                      <span className="truncate">{getTargetName()}</span>
                    </div>
                    <ChevronUp className={`transition-transform duration-300 ${showTargetList ? 'rotate-180' : ''}`} size={18} />
                  </button>

                  {showTargetList && (
                    <>
                      <div className="fixed inset-0 z-[70]" onClick={() => setShowTargetList(false)} />
                      <div className="absolute bottom-full left-0 right-0 mb-3 z-[80] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="p-3 border-b border-slate-800 bg-slate-950/50 text-[8px] font-black uppercase text-slate-500 tracking-widest">Pemain Tersedia</div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                          {players.filter(p => p.id !== playerData.id && p.status !== 'dead' && p.role !== 'Moderator').map(p => (
                            <button key={p.id} onClick={() => { setActionTarget(p.id); setShowTargetList(false); }} className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between mb-1 ${actionTarget === p.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                              {p.name} {actionTarget === p.id && <UserCheck size={14} />}
                            </button>
                          ))}
                          {role.includes("guard") && (
                            <button onClick={() => { setActionTarget(playerData.id); setShowTargetList(false); }} className={`w-full text-left p-3 rounded-xl text-xs font-bold mt-1 border-t border-slate-800 transition-all ${actionTarget === playerData.id ? 'bg-blue-600 text-white' : 'text-blue-400 hover:bg-white/5'}`}>Diri Sendiri</button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleNightAction(role.includes("guard") ? "Jaga" : "Konfirmasi")} className="py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                    {role.includes("seer") || role.includes("hakim") ? <Search size={14}/> : role.includes("werewolf") ? <Skull size={14}/> : <Zap size={14}/>} {role.includes("hakim") ? "TRUTH" : "SUBMIT"}
                  </button>
                  <button onClick={() => { setActionTarget(""); handleNightAction("skip"); }} className="py-4 bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Skip</button>
                </div>
              </div>
            )}
          </>
        ) : (
          !visionResult && !isGuardLocked && (
            <div className="py-6 text-center">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] italic animate-pulse">Aksi Telah Dikirim</p>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 p-6 flex flex-col items-center font-sans ${isDead ? 'bg-black' : 'bg-slate-950'}`}>
      
      {/* POP-UP PENGUMUMAN KEMATIAN */}
      {showDeathPopUp && (
        <DeathAnnouncement 
          deadPlayers={deadToday} 
          day={day} 
          onClose={() => setShowDeathPopUp(false)} 
        />
      )}

      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 scale-90 md:scale-100">
        <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
      </div>

      <RoleModal role={playerData?.role} isOpen={showMechanics} onClose={() => setShowMechanics(false)} />

      <div className="max-w-md w-full space-y-6 text-center pt-20 pb-20 mt-10">
        <div className="space-y-1">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Identity Assigned • {isNight ? `Malam` : `Hari`} ke-{day}</p>
          <h2 className={`text-xl font-bold italic transition-colors ${isDead ? 'text-slate-600' : 'text-slate-100'}`}>{playerData?.name || "Pemain"} {isDead && "(GHOST)"}</h2>
        </div>

        <div className={`relative aspect-[3/4] w-full rounded-2xl border-2 transition-all duration-700 flex flex-col items-center justify-center p-8 overflow-hidden ${isRevealed ? `${theme.bg} ${theme.border}` : 'bg-slate-900 border-slate-800'}`}>
          {!isRevealed ? (
            <div className="space-y-4 animate-pulse text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                {isDead ? <Ghost className="text-slate-600 w-10 h-10" /> : <HelpCircle className="text-slate-600 w-10 h-10" />}
              </div>
              <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">Tahan tombol merah untuk intip</p>
            </div>
          ) : (
            <div className="space-y-6 z-10 animate-in fade-in zoom-in duration-300 text-center">
              <RoleIcon className={`${theme.color} w-24 h-24 mx-auto`} />
              <div className="space-y-2">
                <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme.color}`}>{playerData?.role}</h3>
                <p className="text-slate-400 text-[10px]">Rahasiakan peranmu.</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 w-full">
          <button onMouseDown={() => setIsRevealed(true)} onMouseUp={() => setIsRevealed(false)} onTouchStart={() => setIsRevealed(true)} onTouchEnd={() => setIsRevealed(false)} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 select-none ${isRevealed ? 'bg-white text-slate-950 shadow-inner' : 'bg-red-700 hover:bg-red-600 shadow-lg'}`}>
            {isRevealed ? <EyeOff size={20} /> : <Eye size={20} />} <span className="text-xs">{isRevealed ? "LEPASKAN" : "TAHAN UNTUK INTIP"}</span>
          </button>

          {renderActionUI()}

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowMechanics(true)} className="flex items-center justify-center gap-2 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-amber-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-colors"><BookOpen size={14} /> Panduan</button>
            <button onClick={onNext} className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><LayoutGrid size={14} /> Papan Game</button>
          </div>

          <button onClick={onLeave} className="w-full pt-4 text-[9px] text-slate-700 hover:text-red-500 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-colors"><X size={12} /> Keluar & Menyerah</button>
        </div>

        <div className="w-full pt-10 border-t border-slate-900 text-left">
          <div className="flex items-center gap-2 mb-4 px-2">
            <MessageSquare size={14} className="text-slate-600" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Enkripsi Suara Aktif</span>
          </div>
          <ChatRoom roomCode={roomCode} myId={playerData?.id} myName={playerData?.name} players={players || []} isHost={false} />
        </div>
      </div>
    </div>
  );
};

export default ViewRole;