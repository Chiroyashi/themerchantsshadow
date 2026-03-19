import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  Skull, Heart, ArrowLeft, CheckCircle2, 
  FastForward, AlertTriangle, User 
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';

const GameBoard = ({ players, roomCode, onBack }) => {
  const [globalTimer, setGlobalTimer] = useState({ phase: "Pagi", isActive: false });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Ambil ID diri sendiri dari LocalStorage
  const myPlayerId = localStorage.getItem('my_player_id');

  // 1. Monitor Fase Game & Status Vote Saya
  useEffect(() => {
    if (!roomCode || !myPlayerId) return;

    // Monitor Fase
    const timerRef = ref(db, `rooms/${roomCode}/timer`);
    const unsubscribeTimer = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGlobalTimer(data);
        // Reset state lokal jika fase berubah dari siang ke fase lain
        if (!data.phase?.toLowerCase().includes("siang")) {
          setHasVoted(false);
          setSelectedPlayer(null);
        }
      }
    });

    // Monitor apakah saya sudah pernah vote (biar kalau refresh tetep terkunci)
    const myVoteRef = ref(db, `rooms/${roomCode}/votes/${myPlayerId}`);
    const unsubscribeVote = onValue(myVoteRef, (snapshot) => {
      if (snapshot.exists()) {
        setHasVoted(true);
        setSelectedPlayer(snapshot.val());
      }
    });

    return () => {
      unsubscribeTimer();
      unsubscribeVote();
    };
  }, [roomCode, myPlayerId]);

  const isVotingTime = globalTimer.phase?.toLowerCase().includes("siang");
  const isDead = players.find(p => p.id === myPlayerId)?.status === 'dead';
  const gamePlayers = players.filter(p => p.role !== 'Moderator');

  // 2. Handler Voting (Dikirim ke Firebase)
  const handleVote = (targetId) => {
    if (hasVoted || isDead || !isVotingTime) return;

    // Simpan ke Firebase agar Moderator bisa menghitung
    const voteRef = ref(db, `rooms/${roomCode}/votes/${myPlayerId}`);
    set(voteRef, targetId).then(() => {
      setHasVoted(true);
      setSelectedPlayer(targetId);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 transition-colors duration-1000 p-6 font-sans flex flex-col items-center">
      
      <header className="max-w-4xl w-full flex flex-col items-center gap-6 mb-8">
        <button 
          onClick={onBack} 
          className="self-start flex items-center gap-2 text-slate-600 hover:text-white transition-all text-[10px] uppercase font-black tracking-widest group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          Kembali ke Peran
        </button>

        <div className="text-center space-y-2">
          <h2 className="text-slate-500 uppercase tracking-[0.4em] text-[10px] font-black italic">
            {isVotingTime ? "The Decision" : "Informasi Kota"}
          </h2>
          <h1 className={`text-4xl font-black uppercase italic tracking-tighter leading-none transition-colors duration-500 ${isVotingTime ? 'text-orange-500 animate-pulse' : 'text-red-600'}`}>
            {isVotingTime ? "Voting Siang" : "Daftar Pemain"}
          </h1>
          <p className="text-slate-600 text-[9px] uppercase tracking-widest font-medium">
            {isVotingTime ? "Pilih satu tersangka untuk diadili" : "Gunakan informasi ini untuk berdiskusi"}
          </p>
        </div>

        <div className="scale-110">
          <SharedTimer roomCode={roomCode} />
        </div>
      </header>

      {/* Grid Daftar Pemain & Voting Area */}
      <div className="max-w-4xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-32">
        {gamePlayers.map((player) => {
          const pDead = player.status === 'dead';
          const isTarget = selectedPlayer === player.id;
          const isMe = player.id === myPlayerId;

          return (
            <div 
              key={player.id}
              onClick={() => !pDead && isVotingTime && handleVote(player.id)}
              className={`group relative p-5 rounded-[2rem] border-2 transition-all duration-300 overflow-hidden
                ${pDead 
                  ? 'bg-slate-900/20 border-red-900/10 grayscale opacity-40 shadow-inner' 
                  : `bg-slate-900 border-slate-800 shadow-xl ${isVotingTime && !hasVoted && 'hover:border-orange-500 cursor-pointer'}`
                }
                ${isTarget ? 'border-orange-500 ring-2 ring-orange-500/20 scale-[1.02]' : ''}
              `}
            >
              {/* HOVER OVERLAY: Muncul centang saat hover di fase Siang & belum vote */}
              {isVotingTime && !pDead && !hasVoted && (
                <div className="absolute inset-0 bg-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] z-20">
                  <CheckCircle2 size={40} className="text-orange-500 animate-in zoom-in duration-300" />
                </div>
              )}

              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 transition-colors
                    ${pDead ? 'bg-red-950/30 text-red-700' : isVotingTime ? 'bg-orange-950/30 text-orange-500' : 'bg-slate-800 text-blue-500'}`}>
                    {pDead ? <Skull size={20} /> : <User size={20} />}
                  </div>
                  
                  <div className="overflow-hidden">
                    <p className={`text-sm font-black truncate leading-tight
                      ${pDead ? 'line-through text-slate-600' : 'text-slate-100'}`}>
                      {player.name} {isMe && "(You)"}
                    </p>
                    <p className={`text-[8px] uppercase tracking-[0.2em] font-black mt-0.5
                      ${pDead ? 'text-red-900' : 'text-slate-600'}`}>
                      {pDead ? 'Eliminated' : 'Verified'}
                    </p>
                  </div>
                </div>

                {isTarget && (
                  <CheckCircle2 size={24} className="text-orange-500 animate-in fade-in" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* VOTING ACTION BAR (Fixed Bottom) */}
      {isVotingTime && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-50">
          <div className="max-w-sm mx-auto space-y-4">
            {!hasVoted ? (
               <button 
                onClick={() => handleVote('skip')}
                className={`w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:text-white transition-all group ${isDead && 'opacity-30 grayscale cursor-not-allowed'}`}
                disabled={isDead}
              >
                <FastForward size={18} className="group-hover:translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Skip Voting / Abstain</span>
              </button>
            ) : (
              <div className="bg-orange-600/10 border border-orange-500/30 p-4 rounded-2xl text-center animate-in slide-in-from-bottom-4">
                <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1 italic text-shadow-sm">Suara Terkunci</p>
                <p className="text-[11px] text-slate-300 font-medium">
                  {selectedPlayer === 'skip' ? (
                    "Kamu memilih untuk: SKIP"
                  ) : (
                    <>Kamu memilih: <span className="text-white font-bold">{players.find(p => p.id === selectedPlayer)?.name}</span></>
                  )}
                </p>
              </div>
            )}
            
            {isDead && (
              <p className="text-[7px] text-red-600 font-black uppercase text-center tracking-widest animate-pulse">
                <AlertTriangle size={8} className="inline mr-1 mb-0.5" /> Ghost cannot participate in voting
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;