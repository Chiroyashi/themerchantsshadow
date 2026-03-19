import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  Skull, Heart, ArrowLeft, CheckCircle2, 
  FastForward, AlertTriangle, User, Moon 
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';

// --- KOMPONEN NIGHT OVERLAY ---
const NightOverlay = ({ phase, isDead }) => {
  const isNight = phase?.toLowerCase().includes("malam");
  if (!isNight || isDead) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-1000">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent animate-pulse"></div>
      <div className="relative z-10 text-center space-y-6">
        <Moon size={80} className="text-slate-800 mx-auto animate-bounce duration-[3000ms]" />
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Malam Telah Tiba</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Jangan bersuara dan jangan mengintip.</p>
        </div>
      </div>
    </div>
  );
};

const GameBoard = ({ players, roomCode, phase, onBack }) => {
  const [globalTimer, setGlobalTimer] = useState({ phase: "Pagi", isActive: false });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const myPlayerId = localStorage.getItem('my_player_id');

  useEffect(() => {
    if (!roomCode || !myPlayerId) return;

    const timerRef = ref(db, `rooms/${roomCode}/timer`);
    const unsubscribeTimer = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGlobalTimer(data);
        if (!data.phase?.toLowerCase().includes("siang")) {
          setHasVoted(false);
          setSelectedPlayer(null);
        }
      }
    });

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

  const handleVote = (targetId) => {
    if (hasVoted || isDead || !isVotingTime) return;
    const voteRef = ref(db, `rooms/${roomCode}/votes/${myPlayerId}`);
    set(voteRef, targetId).then(() => {
      setHasVoted(true);
      setSelectedPlayer(targetId);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-sans flex flex-col items-center">
      <header className="max-w-4xl w-full flex flex-col items-center gap-6 mb-8">
        <button onClick={onBack} className="self-start flex items-center gap-2 text-slate-600 hover:text-white transition-all text-[10px] uppercase font-black tracking-widest group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Kembali
        </button>
        <div className="text-center space-y-2">
          <h1 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${isVotingTime ? 'text-orange-500 animate-pulse' : 'text-red-600'}`}>
            {isVotingTime ? "Voting Siang" : "Daftar Pemain"}
          </h1>
        </div>
        <div className="scale-110"><SharedTimer roomCode={roomCode} /></div>
      </header>

      <div className="max-w-4xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-32">
        {gamePlayers.map((player) => {
          const pDead = player.status === 'dead';
          const isTarget = selectedPlayer === player.id;
          return (
            <div key={player.id} onClick={() => !pDead && isVotingTime && handleVote(player.id)} className={`group relative p-5 rounded-[2rem] border-2 transition-all ${pDead ? 'opacity-40 grayscale' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${pDead ? 'bg-red-950/30' : 'bg-slate-800'}`}>{pDead ? <Skull size={20} /> : <User size={20} />}</div>
                  <p className="text-sm font-black">{player.name}</p>
                </div>
                {isTarget && <CheckCircle2 size={24} className="text-orange-500" />}
              </div>
            </div>
          );
        })}
      </div>

      {isVotingTime && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
          <div className="max-w-sm mx-auto">
            {!hasVoted ? (
               <button onClick={() => handleVote('skip')} className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl font-black uppercase text-[10px]">Skip Voting</button>
            ) : (
              <div className="bg-orange-600/10 border border-orange-500/30 p-4 rounded-2xl text-center">
                <p className="text-[11px] text-slate-300">Suara Terkunci</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- OVERLAY MALAM --- */}
      <NightOverlay phase={phase} isDead={isDead} />
    </div>
  );
};

export default GameBoard;