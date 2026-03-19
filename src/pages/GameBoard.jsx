import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  Skull, Heart, ArrowLeft, CheckCircle2, 
  FastForward, User 
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';

const GameBoard = ({ players, roomCode, phase, seconds, isActive, onBack }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const myPlayerId = localStorage.getItem('my_player_id');

  useEffect(() => {
    if (!roomCode || !myPlayerId) return;

    if (!phase?.toLowerCase().includes("siang")) {
      setHasVoted(false);
      setSelectedPlayer(null);
    }

    const myVoteRef = ref(db, `rooms/${roomCode}/votes/${myPlayerId}`);
    const unsubscribeVote = onValue(myVoteRef, (snapshot) => {
      if (snapshot.exists()) {
        setHasVoted(true);
        setSelectedPlayer(snapshot.val());
      }
    });

    return () => unsubscribeVote();
  }, [roomCode, myPlayerId, phase]);

  const isVotingTime = phase?.toLowerCase().includes("siang");
  const isDead = players.find(p => p.id === myPlayerId)?.status === 'dead';
  const gamePlayers = players.filter(p => p.role !== 'Moderator');

  const handleVote = (targetId) => {
    if (hasVoted || isDead || !isVotingTime) return;
    const voteRef = ref(db, `rooms/${roomCode}/votes/${myPlayerId}`);
    set(voteRef, targetId).then(() => {
      setHasVoted(true);
      setSelectedPlayer(targetId);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-sans flex flex-col items-center selection:bg-orange-500/30">
      <header className="max-w-4xl w-full flex flex-col items-center gap-6 mb-8">
        <button onClick={onBack} className="self-start flex items-center gap-2 text-slate-600 hover:text-white transition-all text-[10px] uppercase font-black tracking-widest group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Kembali
        </button>
        <div className="text-center space-y-2">
          <h1 className={`text-4xl font-black uppercase italic tracking-tighter leading-none transition-colors duration-500 ${isVotingTime ? 'text-orange-500 animate-pulse' : 'text-red-600'}`}>
            {isVotingTime ? "Sesi Voting" : "Daftar Pemain"}
          </h1>
        </div>
        
        <div className="scale-110">
            <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
        </div>
      </header>

      <div className="max-w-4xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-32">
        {gamePlayers.map((player) => {
          const pDead = player.status === 'dead';
          const isTarget = selectedPlayer === player.id;
          const isMe = player.id === myPlayerId;

          return (
            <div 
              key={player.id} 
              onClick={() => !pDead && isVotingTime && handleVote(player.id)} 
              className={`group relative p-5 rounded-[2rem] border-2 transition-all duration-300 overflow-hidden select-none
                ${pDead ? 'bg-slate-900/20 border-red-900/10 grayscale opacity-40 shadow-inner' : 'bg-slate-900 border-slate-800 shadow-xl'}
                ${isVotingTime && !hasVoted && !pDead ? 'hover:border-orange-500 cursor-pointer active:scale-95' : ''}
                ${isTarget ? 'border-orange-500 ring-4 ring-orange-500/10' : ''}
              `}
            >
              {isVotingTime && !pDead && !hasVoted && (
                <div className="absolute inset-0 bg-orange-600/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[2px] z-30">
                  <CheckCircle2 size={32} className="text-white animate-in zoom-in duration-300" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest mt-2">Berikan Suara</span>
                </div>
              )}

              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 transition-colors
                    ${pDead ? 'bg-red-950/30 text-red-700' : isVotingTime ? 'bg-orange-950/30 text-orange-500' : 'bg-slate-800 text-blue-500'}`}>
                    {pDead ? <Skull size={20} /> : <User size={20} />}
                  </div>
                  <div className="overflow-hidden">
                    <p className={`text-sm font-black truncate leading-tight transition-colors
                      ${pDead ? 'line-through text-slate-600' : 'text-slate-100'}`}>
                      {player.name} {isMe && "(Anda)"}
                    </p>
                    <p className={`text-[8px] uppercase tracking-[0.2em] font-black mt-0.5 ${pDead ? 'text-red-900' : 'text-slate-600'}`}>
                      {pDead ? 'Gugur' : 'Aktif'}
                    </p>
                  </div>
                </div>
                {isTarget && (
                  <div className="bg-orange-500 p-1.5 rounded-full animate-in fade-in zoom-in">
                    <CheckCircle2 size={16} className="text-slate-950" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isVotingTime && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-50">
          <div className="max-w-sm mx-auto space-y-3">
            {!hasVoted ? (
               <button onClick={() => handleVote('skip')} className={`w-full py-4 bg-slate-900 border-2 border-slate-800 hover:border-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${isDead ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'}`} disabled={isDead}>
                <FastForward size={16} /> Skip Voting
               </button>
            ) : (
              <div className="bg-orange-600/10 border-2 border-orange-500/30 p-4 rounded-2xl text-center animate-in slide-in-from-bottom-4 shadow-xl">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 italic">Pilihan Terkunci</p>
                <p className="text-[11px] text-slate-300 font-medium">
                  {selectedPlayer === 'skip' ? "Anda memilih untuk: MELEWATI" : <>Memilih: <span className="text-white font-bold">{players.find(p => p.id === selectedPlayer)?.name}</span></>}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;