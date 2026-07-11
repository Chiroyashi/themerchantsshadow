import React, { useState, useEffect } from 'react';
import { ref, onValue, set, update } from "firebase/database";
import { db } from "../lib/firebase";
import {
  Skull, Heart, ArrowLeft, CheckCircle2,
  FastForward, User, Send, Eye, Shield, Zap, Info
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import { getRoleActionConfig } from '../utils/roleActions';
import { useGameContext } from '../contexts/GameContext';
import { useTimerContext } from '../contexts/TimerContext';

const GameBoard = ({ onBack }) => {
  const { players, roomCode, myPlayerId } = useGameContext();
  const { seconds, phase, isActive, day } = useTimerContext();
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [hasActed, setHasActed] = useState(false);
  const [roleState, setRoleState] = useState({});
  const [warlockMode, setWarlockMode] = useState('buy');
  const [showWarlockItems, setShowWarlockItems] = useState(false);
  const [actionNotif, setActionNotif] = useState(null);

  const me = players.find(p => p.id === myPlayerId);
  const isDead = me?.status === 'dead';
  const isMalam = phase?.toLowerCase().includes("malam");
  const isVotingTime = phase?.toLowerCase().includes("siang");
  const isDiskusi = phase?.toLowerCase().includes("pagi") || phase?.toLowerCase().includes("diskusi");
  const isSiang = isVotingTime || isDiskusi;
  const gamePlayers = players.filter(p => p.role !== 'Moderator');

  const totalPlayers = players.filter(p => p.role !== 'Moderator').length;
  const dayNum = day || 1;
  const role = me?.role?.toLowerCase() || "";

  const pistolUsedCount = me?.pistolUsedCount || 0;
  const pistolRemaining = Math.max(0, 2 - pistolUsedCount);
  const pistolActed = me?.pistolActed || false;
  const truthActed = me?.truthActed || false;

  const actionConfig = getRoleActionConfig(me?.role, dayNum, totalPlayers, {
    ...roleState,
    currentPhase: phase,
    hasActed: hasActed
  });

  const canUseNightAction = actionConfig.canAct && isMalam;
  const canUseDayAction = actionConfig.canAct && (isVotingTime || isDiskusi || actionConfig.phaseType === 'any');

  useEffect(() => {
    if (!roomCode || !myPlayerId) return;

    setSelectedTarget(null);
    setHasActed(false);

    if (isVotingTime) {
      const voteRef = ref(db, `rooms/${roomCode}/votes/${myPlayerId}`);
      return onValue(voteRef, (snap) => {
        if (snap.exists()) {
          setHasActed(true);
          setSelectedTarget(snap.val());
        }
      });
    }

    if (isMalam) {
      const actionRef = ref(db, `rooms/${roomCode}/players/${myPlayerId}/currentAction`);
      return onValue(actionRef, (snap) => {
        if (snap.exists()) {
          setHasActed(true);
          setSelectedTarget(snap.val().targetId);
        }
      });
    }

    // Subscribe state untuk Warlock + Hakim
    const stateRef = ref(db, `rooms/${roomCode}/players/${myPlayerId}`);
    return onValue(stateRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setRoleState({
          warlockInventory: data.warlockInventory || null,
          warlockTarget: data.warlockTarget || null,
          warlockSkipped: data.warlockSkipped || false,
          warlockItemUsed: data.warlockItemUsed || false,
          warlockActed: data.warlockActed || false,
          hunterActed: data.hunterActed || false
        });
      }
    });
  }, [roomCode, myPlayerId, phase, isVotingTime, isMalam]);

const handleAction = async (targetId) => {
    if (hasActed || isDead) return;

    const targetName = players.find(p => p.id === targetId)?.name || "Unknown";

    // Notifikasi per role
    let notifMsg = "";
    if (me?.role === 'Werewolf') notifMsg = `🐺 Kamu membunuh ${targetName}`;
    else if (me?.role === 'Seer') notifMsg = `👁️ Kamu memeriksa ${targetName}`;
    else if (me?.role === 'Guard') notifMsg = `🛡️ Kamu melindungi ${targetName}`;
    else if (me?.role === 'Hunter') notifMsg = `🎯 Kamu menembak ${targetName}`;
    else if (me?.role === 'Warlock') {
      if (roleState.warlockInventory && !roleState.warlockItemUsed) {
        notifMsg = `☠️ Kamu menggunakan ${roleState.warlockInventory.toUpperCase()} pada ${targetName}`;
      }
    }
    if (notifMsg) {
      setActionNotif(notifMsg);
      setTimeout(() => setActionNotif(null), 3000);
    }

    // Optimistic: langsung block aksi berikutnya
    setHasActed(true);

    try {
      if (isVotingTime) {
        await set(ref(db, `rooms/${roomCode}/votes/${myPlayerId}`), targetId);
      } else if (isMalam && canUseNightAction) {
        const updates = {};
        const actionData = {
          role: me.role,
          targetId: targetId,
          targetName: targetName,
          timestamp: Date.now()
        };

        // Warlock zigzag: pakai item jika ada inventory dan belum dipakai
        if (me.role === 'Warlock' && dayNum >= 2 && roleState.warlockInventory && !roleState.warlockItemUsed) {
          actionData.warlockAction = 'use';
          actionData.purchasedItem = roleState.warlockInventory;
          updates[`rooms/${roomCode}/players/${myPlayerId}/warlockItemUsed`] = true;
          updates[`rooms/${roomCode}/players/${myPlayerId}/warlockActed`] = true;
        }

        updates[`rooms/${roomCode}/players/${myPlayerId}/currentAction`] = actionData;
        updates[`rooms/${roomCode}/nightHistory/Malam_Current/${myPlayerId}`] = {
          role: me.role,
          senderName: me.name,
          targetId: targetId,
          targetName: targetName,
          action: me.role === 'Warlock' ? `Gunakan ${roleState.warlockInventory?.toUpperCase() || 'Skill'}` : "Skill Malam"
        };

        if (me.role === 'Hunter') {
          updates[`rooms/${roomCode}/players/${myPlayerId}/hunterActed`] = true;
        }

        await update(ref(db, `rooms/${roomCode}`), updates);
      }
    } catch (err) {
      console.error("Gagal mengirim aksi:", err);
      setHasActed(false); // Reset biar bisa coba lagi
    }
  };

  const handleWarlockSkip = async () => {
    if (!isMalam || hasActed || isDead) return;
    if (dayNum === 1 && roleState.warlockSkipped) return;

    const updates = {};
    updates[`rooms/${roomCode}/players/${myPlayerId}/currentAction`] = {
      role: 'Warlock',
      action: 'skip',
      timestamp: Date.now()
    };
    updates[`rooms/${roomCode}/players/${myPlayerId}/warlockActed`] = true;
    if (dayNum === 1) {
      updates[`rooms/${roomCode}/players/${myPlayerId}/warlockSkipped`] = true;
    }
    updates[`rooms/${roomCode}/nightHistory/Malam_Current/${myPlayerId}`] = {
      role: 'Warlock',
      senderName: me.name,
      action: 'Skip',
      targetName: 'SKIP'
    };
    await update(ref(db, `rooms/${roomCode}`), updates);
    setHasActed(true);
  };

  const isActionDisabled = () => {
    if (isDead || hasActed) return true;
    if (isVotingTime) return false;
    if (isMalam) {
      if (!actionConfig.canAct) return true;
      if (me?.role === 'Pedagang') return true;
      if (me?.role === 'Warlock') {
        if (roleState.warlockSkipped) return true;
        return false;
      }
    }
    return false;
  };

  const handleWarlockBuy = async (item) => {
    if (!isMalam || hasActed || isDead) return;
    if (roleState.warlockSkipped) return;
    
    const alivePedagang = players.filter(p => p.role === 'Pedagang' && p.status !== 'dead');
    if (alivePedagang.length === 0) {
      alert("Tidak ada Pedagang alive untuk bertransaksi!");
      return;
    }
    
    const randomPedagang = alivePedagang[Math.floor(Math.random() * alivePedagang.length)];
    
    try {
      const updates = {};
      updates[`rooms/${roomCode}/players/${myPlayerId}/currentAction`] = {
        role: 'Warlock',
        warlockAction: 'buy',
        warlockItem: item,
        timestamp: Date.now()
      };
      updates[`rooms/${roomCode}/players/${myPlayerId}/warlockInventory`] = item;
      updates[`rooms/${roomCode}/players/${myPlayerId}/warlockItemUsed`] = false;
      updates[`rooms/${roomCode}/players/${myPlayerId}/warlockActed`] = true;
      updates[`rooms/${roomCode}/players/${myPlayerId}/warlockMerchantId`] = randomPedagang.id;
      updates[`rooms/${roomCode}/nightHistory/Malam_Current/${myPlayerId}`] = {
        role: 'Warlock',
        senderName: me.name,
        action: `Beli ${item.toUpperCase()}`,
        targetName: me.name
      };
      updates[`rooms/${roomCode}/merchantTransaksi/malam_${dayNum}/${myPlayerId}`] = {
        warlockId: myPlayerId,
        warlockName: me.name,
        merchantId: randomPedagang.id,
        merchantName: randomPedagang.name,
        item: item,
        timestamp: Date.now()
      };
      await update(ref(db, `rooms/${roomCode}`), updates);
      setHasActed(true);
    } catch (err) {
      console.error("Gagal membeli:", err);
    }
  };

  const handleWarlockUse = async (targetId) => {
    if (!isMalam || dayNum < 2 || hasActed || isDead) return;
    if (!roleState.warlockInventory || roleState.warlockSkipped) return;

    try {
      const updates = {};
      updates[`rooms/${roomCode}/players/${myPlayerId}/currentAction`] = {
        role: 'Warlock',
        warlockAction: 'use',
        warlockItem: roleState.warlockInventory,
        targetId: targetId,
        targetName: players.find(p => p.id === targetId)?.name || "Unknown",
        timestamp: Date.now()
      };
      updates[`rooms/${roomCode}/players/${myPlayerId}/warlockItemUsed`] = true;
      updates[`rooms/${roomCode}/nightHistory/Malam_Current/${myPlayerId}`] = {
        role: 'Warlock',
        senderName: me.name,
        action: `Gunakan ${roleState.warlockInventory.toUpperCase()}`,
        targetName: players.find(p => p.id === targetId)?.name || "Unknown",
        targetId: targetId
      };
      await update(ref(db, `rooms/${roomCode}`), updates);
      setHasActed(true);
    } catch (err) {
      console.error("Gagal menggunakan item:", err);
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
             <h1 className="text-lg font-black italic uppercase tracking-tighter">Vote?</h1>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
        
        <div className="w-full max-w-[280px] sm:max-w-xs bg-black/40 rounded-2xl p-2 sm:p-3 border border-white/5 flex items-center justify-between">
           <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
        </div>
        <div className="text-center">
          <p className={`text-[9px] font-black uppercase tracking-widest ${isVotingTime ? 'text-orange-400' : 'text-slate-600'}`}>
            {isVotingTime ? '🗳️ Silahkan Vote' : '🔒 Belum saatnya Vote'}
          </p>
        </div>
      </header>

      {/* Grid Pemain */}
      <main className="p-3 sm:p-4 grid grid-cols-2 gap-2 sm:gap-3 max-w-2xl mx-auto">
        {gamePlayers.map((player) => {
          const pDead = player.status === 'dead';
          const isMe = player.id === myPlayerId;
          const isSelected = selectedTarget === player.id;

          return (
            <button
              key={player.id}
              disabled={isActionDisabled() || isMe || (isMalam && me?.role === 'Pedagang')}
              onClick={() => setSelectedTarget(player.id)}
              className={`relative p-3 sm:p-4 rounded-3xl border-2 transition-all text-left overflow-hidden active:scale-95
                ${pDead ? 'bg-slate-900/40 border-transparent grayscale opacity-40' : 'bg-slate-900 border-slate-800 shadow-xl'}
                ${isSelected ? 'border-red-500 bg-red-600/10 ring-4 ring-red-500/20' : ''}
              `}
            >
              {/* Avatar & Status Badge */}
              <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${pDead ? 'bg-slate-800' : isMalam ? 'bg-purple-900/40' : 'bg-blue-900/40'}`}>
                  {pDead ? (
                    <Skull size={22} className="text-slate-600" />
                  ) : (
                    <User size={22} className={isMalam ? 'text-purple-400' : 'text-blue-400'} />
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

      {/* Info Card Role + Action Info */}
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 to-black p-6 rounded-[2.5rem] border border-white/5 space-y-4">

          {/* Sudah Action — tampilkan selalu ketika hasActed */}
          {hasActed && (
            <div className="flex items-center gap-3 bg-emerald-900/30 border border-emerald-500/30 p-3 rounded-xl">
              <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-500"><CheckCircle2 size={16} /></div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">✓ Action Terkirim</h3>
                <p className="text-[10px] text-emerald-300/70">Keputusan sudah dicatat</p>
              </div>
            </div>
          )}

           {!hasActed && actionConfig.isConfirmed && (
             <div className="flex items-center gap-3 bg-emerald-900/30 border border-emerald-500/30 p-3 rounded-xl">
               <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-500"><CheckCircle2 size={16} /></div>
               <div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Confirmed</h3>
                 <p className="text-[10px] text-emerald-300/70">Action {actionConfig.skillName || me.role} sudah dilakukan malam ini</p>
               </div>
             </div>
           )}
           <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 rounded-lg text-red-500"><Info size={16} /></div>
              <h3 className="text-xs font-black uppercase tracking-widest">Catatan Peran</h3>
           </div>
           <p className="text-[11px] text-slate-400 leading-relaxed italic">
             Anda adalah <span className="text-white font-bold">{me.role}</span>. {actionConfig.reason || (isMalam ? "Gunakan malam ini untuk strategi trading atau eliminasi." : "Diskusikan hasil temuan malam tadi dan berikan suara Anda.")}
           </p>
           


            {me?.role === 'Warlock' && isMalam && !hasActed && !roleState.warlockSkipped && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                {dayNum === 1 && (
                  <>
                    <p className="text-[10px] text-purple-400 font-bold uppercase">Malam 1 - BELI/SKIP:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleWarlockBuy('vision')}
                        className="py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black uppercase text-xs transition-all"
                      >
                        Vision
                      </button>
                      <button
                        onClick={() => handleWarlockBuy('poison')}
                        className="py-2 bg-red-600 hover:bg-red-500 rounded-xl font-black uppercase text-xs transition-all"
                      >
                        Poison
                      </button>
                    </div>
                    <button
                      onClick={handleWarlockSkip}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-black uppercase text-xs text-slate-400"
                    >
                      Skip
                    </button>
                  </>
                )}
                {dayNum > 1 && roleState.warlockInventory && !roleState.warlockItemUsed && (
                  <>
                    <p className="text-[10px] text-purple-400 font-bold uppercase">Item: {roleState.warlockInventory?.toUpperCase()} (BELUM DIGUNAKAN)</p>
                    <p className="text-[8px] text-slate-400">Pilih target di atas untuk menggunakan item!</p>
                  </>
                )}
                {dayNum > 1 && roleState.warlockInventory && roleState.warlockItemUsed && (
                  <>
                    <p className="text-[10px] text-purple-400 font-bold uppercase">Item: {roleState.warlockInventory?.toUpperCase()} (SUDAH DIGUNAKAN)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleWarlockBuy('vision')}
                        className="py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black uppercase text-xs transition-all"
                      >
                        Vision
                      </button>
                      <button
                        onClick={() => handleWarlockBuy('poison')}
                        className="py-2 bg-red-600 hover:bg-red-500 rounded-xl font-black uppercase text-xs transition-all"
                      >
                        Poison
                      </button>
                    </div>
                  </>
                )}
                {dayNum > 1 && !roleState.warlockInventory && (
                  <>
                    <p className="text-[10px] text-purple-400 font-bold uppercase">BELI Item:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleWarlockBuy('vision')}
                        className="py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black uppercase text-xs transition-all"
                      >
                        Vision
                      </button>
                      <button
                        onClick={() => handleWarlockBuy('poison')}
                        className="py-2 bg-red-600 hover:bg-red-500 rounded-xl font-black uppercase text-xs transition-all"
                      >
                        Poison
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {me?.role === 'Warlock' && isMalam && roleState.warlockSkipped && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="text-[10px] text-red-400 font-bold uppercase text-center">Action Ditutup (Sudah Skip)</p>
              </div>
            )}

            {/* HAKIM PISTOL: tampilkan hanya siang */}
            {me?.role === 'Hakim' && isSiang && pistolRemaining > 0 && !pistolActed && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="text-[10px] text-red-400 font-bold uppercase">🔫 Pistol ({pistolRemaining}/{2})</p>
                <p className="text-[8px] text-slate-400">Pilih target untuk ditembak! (hanya siang hari)</p>
              </div>
            )}
            {me?.role === 'Hakim' && isSiang && pistolRemaining <= 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="text-[10px] text-slate-600 font-bold uppercase text-center">Pistol sudah habis digunakan</p>
              </div>
            )}
        </div>
      </div>

      {/* ACTION NOTIFICATION TOAST */}
      {actionNotif && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl px-6 py-4 shadow-2xl shadow-blue-900/20 text-center">
            <p className="text-xs md:text-sm font-black text-white uppercase tracking-wide">{actionNotif}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;