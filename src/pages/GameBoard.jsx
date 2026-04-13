import React, { useState, useEffect } from 'react';
import { ref, onValue, set, update } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  Skull, Heart, ArrowLeft, CheckCircle2, 
  FastForward, User, Send, Eye, Shield, Zap, Info
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';

const GameBoard = ({ players, roomCode, phase, seconds, isActive, onBack, myPlayerId }) => {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [hasActed, setHasActed] = useState(false);
  
  const me = players.find(p => p.id === myPlayerId);
  const isDead = me?.status === 'dead';
  const isMalam = phase?.toLowerCase().includes("malam");
  const isVotingTime = phase?.toLowerCase().includes("siang");
  const isDiskusi = phase?.toLowerCase().includes("pagi") || phase?.toLowerCase().includes("diskusi");
  const gamePlayers = players.filter(p => p.role !== 'Moderator');

  // Sync Status Aksi (Voting atau Skill Malam)
  useEffect(() => {
    if (!roomCode || !myPlayerId) return;

    // Reset pilihan visual jika fase berubah
    setSelectedTarget(null);
    setHasActed(false);

    // Listener khusus Voting Siang
    if (isVotingTime) {
      const voteRef = ref(db, `rooms/${roomCode}/votes/${myPlayerId}`);
      return onValue(voteRef, (snap) => {
        if (snap.exists()) {
          setHasActed(true);
          setSelectedTarget(snap.val());
        }
      });
    }

    // Listener khusus Aksi Malam
    if (isMalam) {
      const actionRef = ref(db, `rooms/${roomCode}/players/${myPlayerId}/currentAction`);
      return onValue(actionRef, (snap) => {
        if (snap.exists()) {
          setHasActed(true);
          setSelectedTarget(snap.val().targetId);
        }
      });
    }
  }, [roomCode, myPlayerId, phase, isVotingTime, isMalam]);

  // Handler Kirim Aksi
  const handleAction = async (targetId) => {
    if (hasActed || isDead) return;

    try {
      if (isVotingTime) {
        // Logika Vote Siang
        await set(ref(db, `rooms/${roomCode}/votes/${myPlayerId}`), targetId);
      } else if (isMalam) {
        // Logika Skill Malam (RPG & Ekonomi)
        const updates = {};
        updates[`rooms/${roomCode}/players/${myPlayerId}/currentAction`] = {
          role: me.role,
          targetId: targetId,
          targetName: players.find(p => p.id === targetId)?.name || "Unknown",
          timestamp: Date.now()
        };
        // Tambahkan Log Transaksi jika ini Warlock/Pedagang
        updates[`rooms/${roomCode}/nightHistory/Malam_Current/${myPlayerId}`] = {
          role: me.role,
          senderName: me.name,
          targetId: targetId,
          targetName: players.find(p => p.id === targetId)?.name || "Unknown",
          action: isMalam ? "Skill Malam" : "Vote"
        };
        await update(ref(db, `rooms/${roomCode}`), updates);
      }
      setHasActed(true);
    } catch (err) {
      console.error("Gagal mengirim aksi:", err);
    }
  };

  if (!me) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500 font-black uppercase tracking-widest">Data Error...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500/30 pb-32">
      {/* Header Mobile Optimized */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 p-4 flex flex-col items-center gap-4">
        <div className="w-full flex justify-between items-center">
          <button onClick={onBack} className="p-2 bg-slate-900 rounded-xl border border-white/5"><ArrowLeft size={18} /></button>
          <div className="text-center">
             <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isMalam ? 'text-purple-500' : 'text-orange-500'}`}>{phase}</p>
             <h1 className="text-lg font-black italic uppercase tracking-tighter">Waranasura</h1>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
        
        <div className="w-full max-w-xs bg-black/40 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
           <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
           <div className="text-right">
              <p className="text-[8px] text-slate-500 font-black uppercase">Status Anda</p>
              <p className={`text-xs font-black uppercase ${isDead ? 'text-red-600' : 'text-emerald-500'}`}>
                {isDead ? 'Eliminasi' : '🛡️ Aktif'}
              </p>
           </div>
        </div>
      </header>

      {/* Grid Pemain */}
      <main className="p-4 grid grid-cols-2 gap-3 max-w-2xl mx-auto">
        {gamePlayers.map((player) => {
          const pDead = player.status === 'dead';
          const isMe = player.id === myPlayerId;
          const isSelected = selectedTarget === player.id;

          return (
            <button
              key={player.id}
              disabled={pDead || isDead || hasActed || isMe || (!isMalam && !isVotingTime && !isDiskusi)}
              onClick={() => setSelectedTarget(player.id)}
              className={`relative p-4 rounded-3xl border-2 transition-all text-left overflow-hidden active:scale-95
                ${pDead ? 'bg-slate-900/40 border-transparent grayscale opacity-40' : 'bg-slate-900 border-slate-800 shadow-xl'}
                ${isSelected ? 'border-red-500 bg-red-600/10 ring-4 ring-red-500/20' : ''}
              `}
            >
              {/* Avatar & Status Badge */}
              <div className="flex justify-between items-start mb-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${pDead ? 'bg-slate-800' : isMalam ? 'bg-purple-900/40' : 'bg-blue-900/40'}`}>
                  {pDead ? (
                    <Skull size={28} className="text-slate-600" />
                  ) : (
                    <User size={28} className={isMalam ? 'text-purple-400' : 'text-blue-400'} />
                  )}
                </div>
                {isMe && <span className="text-[7px] font-black bg-blue-600 px-2 py-1 rounded-full uppercase tracking-wide">Anda</span>}
              </div>
              
              {/* Username Label */}
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Username</p>
              
              {/* Username Display */}
              <p className={`font-black text-base truncate leading-tight ${pDead ? 'text-slate-600' : 'text-blue-400'}`}>
                {player.name}
              </p>
              
              {/* Status Footer */}
              <div className="mt-3 pt-2 border-t border-white/5">
                <p className={`text-[9px] font-semibold uppercase tracking-wide ${pDead ? 'text-red-700' : isSelected ? 'text-red-400' : 'text-slate-500'}`}>
                  {pDead ? '☠️ Gugur' : isSelected ? '✓ Ditargetkan' : '🎯 Pilih Target'}
                </p>
              </div>
            </button>
          );
        })}
      </main>

      {/* Info Card Role */}
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 to-black p-6 rounded-[2.5rem] border border-white/5 space-y-4">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 rounded-lg text-red-500"><Info size={16} /></div>
              <h3 className="text-xs font-black uppercase tracking-widest">Catatan Peran</h3>
           </div>
           <p className="text-[11px] text-slate-400 leading-relaxed italic">
             Anda adalah <span className="text-white font-bold">{me.role}</span>. {isMalam ? "Gunakan malam ini untuk strategi trading atau eliminasi." : "Diskusikan hasil temuan malam tadi dan berikan suara Anda."}
           </p>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;