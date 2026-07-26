import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, set } from "firebase/database";
import { db } from "../lib/firebase";
import {
  Skull, ArrowLeft, User, MessageSquare
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import ChatRoom from '../components/ChatRoom';
import { useGameContext } from '../contexts/GameContext';
import { useTimerContext } from '../contexts/TimerContext';
import { useNotification } from '../contexts/NotificationContext';
import { Z_LAYER } from '../constants/zIndex';
import { isMalam, isSiang } from '../constants/phases';

const GameBoard = ({ onBack }) => {
  const { players, roomCode, myPlayerId } = useGameContext();
  const { seconds, phase, isActive } = useTimerContext();
  const { showNotif } = useNotification();
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [hasActed, setHasActed] = useState(false);
  const [actionNotif, setActionNotif] = useState(null);
  const [allVotes, setAllVotes] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevPhaseRef = useRef(phase);

  const me = players.find(p => p.id === myPlayerId);
  const isDead = me?.status === 'dead';
  const malam = isMalam(phase);
  const isVotingTime = isSiang(phase);
  const gamePlayers = players.filter(p => p.role !== 'Moderator');

  // Hitung vote count per player
  const votesArray = Object.values(allVotes);
  const getVoteCount = (playerId) => votesArray.filter(v => v === playerId).length;

  // Reset target & action status pada perubahan phase atau roomCode (render phase reset untuk menghindari setState dalam effect)
  const [prevPhaseRoom, setPrevPhaseRoom] = useState({ phase, roomCode });
  if (phase !== prevPhaseRoom.phase || roomCode !== prevPhaseRoom.roomCode) {
    setPrevPhaseRoom({ phase, roomCode });
    setSelectedTarget(null);
    setHasActed(false);
  }

  // Listener vote pemain sendiri
  useEffect(() => {
    if (!roomCode || !myPlayerId) return;

    if (isVotingTime) {
      const voteRef = ref(db, `rooms/${roomCode}/votes/${myPlayerId}`);
      return onValue(voteRef, (snap) => {
        if (snap.exists()) {
          setHasActed(true);
          setSelectedTarget(snap.val());
        }
      });
    }

    if (malam) {
      const actionRef = ref(db, `rooms/${roomCode}/players/${myPlayerId}/currentAction`);
      return onValue(actionRef, (snap) => {
        if (snap.exists()) {
          setHasActed(true);
          setSelectedTarget(snap.val().targetId);
        }
      });
    }
  }, [roomCode, myPlayerId, phase, isVotingTime, malam]);

  // Listener semua vote (untuk vote count)
  useEffect(() => {
    if (!roomCode || !isVotingTime) return;
    const votesRef = ref(db, `rooms/${roomCode}/votes`);
    const unsub = onValue(votesRef, snap => setAllVotes(snap.val() || {}));
    return () => unsub();
  }, [roomCode, isVotingTime]);

  // Auto-redirect ke ViewRole saat bukan Siang (Voting)
  useEffect(() => {
    if (!phase) return;
    const isSiangPhase = isSiang(phase);
    const wasSiang = isSiang(prevPhaseRef.current);
    if (!isSiangPhase && wasSiang) {
      onBack();
    }
    prevPhaseRef.current = phase;
  }, [phase, onBack]);

  const executeVote = async (targetId) => {
    const targetName = targetId === 'skip'
      ? "tidak ada"
      : (players.find(p => p.id === targetId)?.name || "Unknown");

    setActionNotif(targetId === 'skip' ? `⏭️ Kamu skip vote` : `🗳️ Kamu vote ${targetName}`);
    setTimeout(() => setActionNotif(null), 3000);
    setHasActed(true);
    setSelectedTarget(targetId === 'skip' ? null : targetId);

    try {
      await set(ref(db, `rooms/${roomCode}/votes/${myPlayerId}`), targetId === 'skip' ? 'skip' : targetId);
    } catch (err) {
      console.error("Gagal vote:", err);
      setHasActed(false);
    }
  };

  const handleAction = (targetId) => {
    if (hasActed || isDead || !isVotingTime) return;

    const targetName = targetId === 'skip'
      ? "tidak ada (Skip)"
      : (players.find(p => p.id === targetId)?.name || "Unknown");

    const message = targetId === 'skip'
      ? "Apakah Anda yakin ingin melewatkan vote (Skip) pada siang ini?"
      : `Apakah Anda yakin ingin memberikan suara (Vote) kepada "${targetName}"? Pilihan ini tidak dapat diubah.`;

    showNotif("Konfirmasi Vote", message, "confirm", () => executeVote(targetId));
  };

  if (!me) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500 font-black uppercase tracking-widest">Data Error...</div>;

  return (
    <div className="h-screen overflow-y-auto bg-slate-950 text-slate-100 font-sans selection:bg-red-500/30 animate-in fade-in duration-500 relative">
      {/* Sunset/Voting Ambience Glow Layer */}
      {!isDead && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-full blur-[120px] bg-orange-600/10 transition-all duration-1000" />
        </div>
      )}

      {/* Header — simpler, no back button */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 p-4 flex flex-col items-center gap-3">
        <div className="text-center">
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${malam ? 'text-purple-500' : 'text-orange-500'}`}>{phase}</p>
          <h1 className="text-lg font-black italic uppercase tracking-tighter">Vote?</h1>
        </div>
        <div className="w-full max-w-[280px] sm:max-w-xs bg-black/40 rounded-2xl p-2 border border-white/5">
          <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
        </div>
        <div className="text-center">
          <p className={`text-[9px] font-black uppercase tracking-widest ${isVotingTime ? 'text-orange-400' : 'text-slate-600'}`}>
            {isVotingTime ? '🗳️ Silahkan Vote' : '🔒 Belum saatnya Vote'}
          </p>
        </div>
      </header>

      {/* Grid Pemain */}
      <main className="p-3 sm:p-4 grid grid-cols-2 gap-2 sm:gap-3 max-w-2xl mx-auto pb-64">
        {gamePlayers.map((player) => {
          const pDead = player.status === 'dead';
          const isMe = player.id === myPlayerId;
          const isSelected = selectedTarget === player.id;
          const voteCount = getVoteCount(player.id);

          return (
            <div
              key={player.id}
              onClick={() => { if (isVotingTime && !hasActed && !pDead) { handleAction(player.id); } }}
              className={`relative p-3 sm:p-4 rounded-3xl border-2 transition-all text-center overflow-hidden select-none
                ${pDead ? 'bg-slate-900/40 border-transparent grayscale opacity-40' : 'bg-slate-900 border-slate-800 shadow-xl'}
                ${isSelected && !pDead ? 'border-red-500 bg-red-600/10 ring-4 ring-red-500/20' : ''}
                ${isVotingTime && !pDead && !hasActed ? 'active:scale-95 cursor-pointer hover:border-blue-500/50' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`mx-auto w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${pDead ? 'bg-slate-800' : malam ? 'bg-purple-900/40' : 'bg-blue-900/40'}`}>
                  {pDead ? (
                    <Skull size={22} className="text-slate-600" />
                  ) : (
                    <User size={22} className={malam ? 'text-purple-400' : 'text-blue-400'} />
                  )}
                </div>
                {isMe && <span className="absolute top-3 right-3 text-[7px] font-black bg-blue-600 px-2 py-1 rounded-full uppercase tracking-wide">Anda</span>}
              </div>

              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Username</p>

              <p className={`font-black text-base truncate leading-tight ${pDead ? 'text-slate-600' : 'text-blue-400'}`}>
                {player.name}
              </p>

              {isVotingTime && (
              <div className="mt-3 pt-2 border-t border-white/5 text-center">
                <span className={`inline-block px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide ${
                  pDead
                    ? 'bg-red-900/20 text-red-700'
                    : isSelected
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {pDead ? '☠️ Mati' : isSelected ? '✓ Voted' : '🗳️ Vote'}
                </span>
                {!pDead && voteCount > 0 && (
                  <div className="mt-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 rounded-full text-[9px] font-bold text-orange-400">
                      {voteCount} vote
                    </span>
                  </div>
                )}
              </div>
              )}
              {!isVotingTime && (
              <div className="mt-3 pt-2 border-t border-white/5 text-center">
                <span className={`inline-block px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide ${
                  pDead
                    ? 'bg-red-900/20 text-red-700'
                    : isMe
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'bg-slate-800/40 text-slate-500 border border-slate-700/30'
                }`}>
                  {pDead ? '☠️ Mati' : isMe ? player.role : '🛡️ Aktif'}
                </span>
              </div>
              )}
            </div>
          );
        })}
      </main>

      {/* ACTION NOTIFICATION TOAST */}
      {actionNotif && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 animate-in slide-in-from-top-4 fade-in duration-300" style={{ zIndex: Z_LAYER.NOTIFICATION }}>
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl px-6 py-4 shadow-2xl shadow-blue-900/20 text-center">
            <p className="text-xs md:text-sm font-black text-white uppercase tracking-wide">{actionNotif}</p>
          </div>
        </div>
      )}

      {/* ChatRoom — portal diaktifkan via status luar (tanpa floating button bawaan) */}
      <ChatRoom
        roomCode={roomCode}
        myId={myPlayerId}
        myName={me?.name}
        players={players}
        isHost={false}
        isOpenExternal={chatOpen}
        onToggleExternal={() => setChatOpen(!chatOpen)}
        onUnreadChange={(count) => setUnreadCount(count)}
      />

      {/* BOTTOM FAB BARS — message icon (bulat) di kanan, skip & back di tengah */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 max-w-lg mx-auto w-full pointer-events-none">
        <div className="flex flex-col items-stretch gap-2">
          {/* 1️⃣ Message icon — kecil bulat di atas skip/back, rata kanan */}
          <div className="flex justify-end w-full">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="pointer-events-auto relative w-12 h-12 rounded-2xl bg-slate-900 border border-blue-500/30 shadow-2xl flex items-center justify-center hover:bg-slate-800 hover:border-blue-400/50 active:scale-90 transition-all duration-200"
            >
              <MessageSquare size={20} className="text-blue-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] rounded-full bg-red-600 text-white text-[8px] font-black flex items-center justify-center px-1 shadow-lg animate-in zoom-in duration-200">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* 2️⃣ & 3️⃣ Skip Vote & Kembali */}
          <div className="w-full flex flex-col gap-2 pointer-events-auto">
            {isVotingTime && !isDead && (
              <>
                {hasActed ? (
                  <div className="w-full py-3.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg">
                    ✓ Suara Terkirim
                  </div>
                ) : (
                  <button
                    onClick={() => handleAction('skip')}
                    className="w-full py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-700 active:scale-[0.98] transition-all shadow-lg"
                  >
                    ⏭️ Skip Vote
                  </button>
                )}
                <button
                  onClick={onBack}
                  className="w-full py-3.5 bg-slate-900 border border-blue-500/30 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:border-blue-400 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} /> Kembali
                </button>
              </>
            )}
            {(!isVotingTime || isDead) && (
              <button
                onClick={onBack}
                className="w-full py-3.5 bg-slate-900 border border-blue-500/30 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:border-blue-400 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
