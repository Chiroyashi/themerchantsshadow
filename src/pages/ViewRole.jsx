import React, { useState } from 'react'; 
import { ref, set } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  Eye, EyeOff, Shield, Skull, HelpCircle, BookOpen, X, Ghost, 
  LayoutGrid, MessageSquare, Send, Zap, Search, Crosshair, ShoppingCart 
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import RoleModal from '../components/RoleModal';
import ChatRoom from '../components/ChatRoom';

const ViewRole = ({ playerData, roomCode, phase, seconds, isActive, onNext, onLeave, players, day }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);
  const [actionTarget, setActionTarget] = useState("");

  const isDead = playerData?.status === 'dead';
  const isNight = phase?.toLowerCase().includes("malam");

  const theme = (() => {
    const role = playerData?.role?.toLowerCase() || "";
    if (isDead) return { color: "text-slate-500", bg: "bg-slate-900/50", border: "border-slate-800", icon: Ghost };
    if (role.includes('werewolf') || role.includes('warlock')) 
      return { color: "text-red-500", bg: "bg-red-950/20", border: "border-red-600", icon: Skull };
    if (role.includes('moderator')) 
      return { color: "text-amber-500", bg: "bg-amber-950/20", border: "border-amber-600", icon: Shield };
    return { color: "text-blue-500", bg: "bg-blue-950/20", border: "border-blue-600", icon: Shield };
  })();

  const RoleIcon = theme.icon;

  // --- LOGIKA AKSI MALAM ---
  const handleNightAction = (type) => {
    if (!actionTarget && type !== 'skip') {
      alert("Pilih target terlebih dahulu!");
      return;
    }
    const actionRef = ref(db, `rooms/${roomCode}/nightActions/${playerData.id}`);
    set(actionRef, {
      senderName: playerData.name,
      role: playerData.role,
      action: type,
      targetId: actionTarget || "none",
      targetName: players.find(p => p.id === actionTarget)?.name || "Skip",
      timestamp: Date.now()
    }).then(() => {
      alert(`Aksi ${type} telah dikirim ke Moderator.`);
    });
  };

  const canAct = () => {
    if (isDead) return false;
    const role = playerData?.role?.toLowerCase() || "";
    
    // Hakim Truth bisa kapan saja (Pagi/Siang/Malam)
    if (role.includes("hakim")) return true;
    
    // Selain Hakim, aksi hanya bisa dilakukan di Malam hari
    if (!isNight) return false;

    // Malam Pertama: Hanya Seer, Guard, & Hakim
    if (day === 1) {
      return role.includes("seer") || role.includes("guard");
    }
    
    // Malam Kedua dst: Semua role aksi boleh (Pedagang pasif tidak masuk canAct)
    return !role.includes("pedagang") && !role.includes("warga");
  };

  const renderActionUI = () => {
    if (!canAct()) return null;
    const role = playerData.role.toLowerCase();

    return (
      <div className="w-full mt-6 p-6 bg-slate-900 border border-blue-500/30 rounded-[2rem] space-y-4 animate-in zoom-in duration-500">
        <div className="flex items-center gap-2 text-blue-400">
          <Zap size={18} fill="currentColor" />
          <span className="text-xs font-black uppercase tracking-widest">Special Ability</span>
        </div>

        {/* Action Hakim: Truth (Muncul di luar sesi malam) */}
        {role.includes("hakim") && !isNight && (
          <div className="space-y-3">
             <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Skill Aktif: Truth (Paksa Jujur)</p>
             <select 
              onChange={(e) => setActionTarget(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none"
            >
              <option value="">Pilih Target Kejujuran...</option>
              {players.filter(p => p.id !== playerData.id && p.status !== 'dead' && p.role !== 'Moderator').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button onClick={() => handleNightAction("Truth")} className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Paksa Jujur</button>
          </div>
        )}

        {/* Action Malam Hari */}
        {isNight && (
          <div className="space-y-3">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Malam ke-{day}: Tentukan Tindakan</p>
            <select 
              onChange={(e) => setActionTarget(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none"
            >
              <option value="">Pilih Target...</option>
              {players.filter(p => p.id !== playerData.id && p.status !== 'dead' && p.role !== 'Moderator').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              {(role.includes("guard")) && <option value={playerData.id}>Diri Sendiri</option>}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleNightAction("Act")} className="py-3 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                {role.includes("seer") ? <Search size={14}/> : role.includes("werewolf") ? <Skull size={14}/> : <Zap size={14}/>}
                {role.includes("seer") ? "Lihat" : role.includes("werewolf") ? "Bunuh" : "Tembak"}
              </button>
              <button onClick={() => handleNightAction("skip")} className="py-3 bg-slate-800 text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest">Skip</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 p-6 flex flex-col items-center font-sans ${isDead ? 'bg-black' : 'bg-slate-950'}`}>
      
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 scale-90 md:scale-100">
        <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
      </div>

      <RoleModal role={playerData?.role} isOpen={showMechanics} onClose={() => setShowMechanics(false)} />

      <div className="max-w-md w-full space-y-6 text-center pt-10 pb-20 mt-10">
        <div className="space-y-1">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Identity Assigned • Malam ke-{day}</p>
          <h2 className={`text-xl font-bold italic transition-colors ${isDead ? 'text-slate-600' : 'text-slate-100'}`}>
            {playerData?.name || "Pemain"} {isDead && "(GHOST)"}
          </h2>
        </div>

        <div className={`relative aspect-[3/4] w-full rounded-2xl border-2 transition-all duration-700 flex flex-col items-center justify-center p-8 overflow-hidden
            ${isRevealed ? `${theme.bg} ${theme.border}` : 'bg-slate-900 border-slate-800'}`}>
          {!isRevealed ? (
            <div className="space-y-4 animate-pulse">
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
          <button 
            onMouseDown={() => setIsRevealed(true)}
            onMouseUp={() => setIsRevealed(false)}
            onTouchStart={() => setIsRevealed(true)}
            onTouchEnd={() => setIsRevealed(false)}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 select-none
              ${isRevealed ? 'bg-white text-slate-950 shadow-inner' : 'bg-red-700 hover:bg-red-600 shadow-lg'}`}
          >
            {isRevealed ? <EyeOff size={20} /> : <Eye size={20} />}
            <span className="text-xs">{isRevealed ? "LEPASKAN" : "TAHAN UNTUK INTIP"}</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowMechanics(true)} className="flex items-center justify-center gap-2 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-amber-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-800">
              <BookOpen size={14} /> Panduan
            </button>
            <button onClick={onNext} className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg">
              <LayoutGrid size={14} /> Papan Game
            </button>
          </div>

          <button onClick={onLeave} className="w-full pt-4 text-[9px] text-slate-700 hover:text-red-500 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <X size={12} /> Keluar & Menyerah
          </button>
        </div>

        {/* RENDER MODAL AKSI */}
        {renderActionUI()}

        {/* CHAT SECTION PEMAIN */}
        <div className="w-full pt-10 border-t border-slate-900 text-left">
          <div className="flex items-center gap-2 mb-4 px-2">
            <MessageSquare size={14} className="text-slate-600" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Enkripsi Suara Aktif</span>
          </div>
          <ChatRoom 
            roomCode={roomCode} 
            myId={playerData?.id} 
            myName={playerData?.name} 
            players={players || []} 
            isHost={false} 
          />
        </div>
      </div>
    </div>
  );
};

export default ViewRole;