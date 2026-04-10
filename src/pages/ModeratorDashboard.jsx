import React, { useState, useEffect } from 'react';
import { ref, onValue, set, update } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  Skull, Heart, Play, Pause, RefreshCw, LogOut, User,
  Sunrise, Sunset, Moon, Users, MessageSquare, X, Clock, BarChart3, Edit3, Check, Trophy
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import ChatRoom from '../components/ChatRoom';

const ModeratorDashboard = ({ 
  players, roomCode, onKill, onExit,
  onToggleTimer, onResetTimer, onSetPhase, onEditTimer,
  onEndGame, seconds, phase, isActive, day 
}) => {
  const [votes, setVotes] = useState({});
  const [nightHistory, setNightHistory] = useState({}); 
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // State untuk Edit Waktu
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState("");

  const [showEndGame, setShowEndGame] = useState(false);

  const activePlayers = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator');
  const votesData = Object.values(votes);
  const killThreshold = Math.floor(activePlayers.length / 2) + 1;

  useEffect(() => {
    if (!roomCode) return;
    const votesRef = ref(db, `rooms/${roomCode}/votes`);
    const unsubscribeVotes = onValue(votesRef, (snapshot) => setVotes(snapshot.val() || {}));

    const historyRef = ref(db, `rooms/${roomCode}/nightHistory`);
    const unsubscribeHistory = onValue(historyRef, (snapshot) => setNightHistory(snapshot.val() || {}));

    return () => { unsubscribeVotes(); unsubscribeHistory(); };
  }, [roomCode]);

  const handleTimeSubmit = () => {
    const totalSeconds = parseInt(timeInput) * 60;
    if (!isNaN(totalSeconds) && totalSeconds > 0) {
      onEditTimer(totalSeconds);
      setIsEditingTime(false);
      setTimeInput("");
    }
  };

  const handleMoveToMorning = async () => {
    const deadPlayersThisNight = players.filter(p => p.status === 'dead' && p.role !== 'Moderator');
    await set(ref(db, `rooms/${roomCode}/deadToday`), {
      day,
      names: deadPlayersThisNight.length > 0 ? deadPlayersThisNight.map(p => p.name) : ["TIDAK ADA"],
      timestamp: Date.now()
    });
    onSetPhase("Pagi (Diskusi)");
  };

  const handleEndGame = (winner) => {
    onEndGame(winner);
    setShowEndGame(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* END GAME MODAL */}
      {showEndGame && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in duration-300">
            <Trophy className="w-16 h-16 mx-auto text-amber-500" />
            <h2 className="text-xl font-black text-white uppercase italic">Pilih Pemenang</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleEndGame('WARGA')} className="p-6 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase text-sm transition-all active:scale-95">
                Warga<br/><span className="text-xs opacity-70">Waras</span>
              </button>
              <button onClick={() => handleEndGame('SERIGALA')} className="p-6 bg-red-600 hover:bg-red-500 rounded-2xl font-black uppercase text-sm transition-all active:scale-95">
                Serigala<br/><span className="text-xs opacity-70">Kejam</span>
              </button>
            </div>
            <button onClick={() => setShowEndGame(false)} className="text-slate-500 hover:text-white text-sm font-bold">Batal</button>
          </div>
        </div>
      )}

      {/* 1. HEADER */}
      <header className="p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-red-600 uppercase italic tracking-tighter">Command Center</h1>
            <p className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Room: {roomCode} • Day {day}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsChatOpen(true)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-blue-400 hover:bg-slate-800 transition-colors">
              <MessageSquare size={18} />
            </button>
            <button onClick={() => setShowEndGame(true)} className="p-2.5 bg-amber-600 text-white border border-amber-500 rounded-xl hover:bg-amber-500 transition-colors">
              <Trophy size={18} />
            </button>
            <button onClick={onExit} className="p-2.5 bg-red-900/10 text-red-500 border border-red-900/30 rounded-xl">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-6 pb-20">
        
        {/* 2. PHASE BUTTONS */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={handleMoveToMorning} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${phase.includes("Pagi") ? 'bg-amber-600 border-amber-500 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
            <Sunrise size={20} /><span className="text-[7px] font-black uppercase mt-1">Forensik</span>
          </button>
          <button onClick={() => onSetPhase("Siang (Voting)")} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${phase.includes("Siang") ? 'bg-orange-600 border-orange-500 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
            <Sunset size={20} /><span className="text-[7px] font-black uppercase mt-1">Voting</span>
          </button>
          <button onClick={() => onSetPhase("Malam (Eksekusi)")} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${phase.includes("Malam") ? 'bg-purple-600 border-purple-500 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
            <Moon size={20} /><span className="text-[7px] font-black uppercase mt-1">Malam</span>
          </button>
        </div>

        {/* 3. IMPROVED TIMER CARD */}
        <section className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden">
          <div className="flex flex-col items-center space-y-4">
            
            {/* Edit Timer Button */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditingTime(!isEditingTime)}
                className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-blue-400 transition-colors"
              >
                <Clock size={12} /> Edit Timer
              </button>
            </div>

            {/* Timer Display Area */}
            <div className="relative flex justify-center w-full min-h-[80px] items-center">
              {isEditingTime ? (
                <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                  <input 
                    type="number" 
                    placeholder="Menit" 
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="w-20 bg-slate-950 border border-blue-500/30 rounded-xl px-3 py-2 text-center text-xl font-black text-white outline-none"
                  />
                  <button onClick={handleTimeSubmit} className="p-3 bg-blue-600 rounded-xl text-white">
                    <Check size={20} />
                  </button>
                </div>
              ) : (
                <div className="scale-[1.6]">
                   {/* Pastikan SharedTimer tidak memiliki gaya posisi absolute didalamnya */}
                   <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
                </div>
              )}
            </div>

            {/* Play/Pause & Reset Row */}
            <div className="flex gap-2 w-full pt-4">
              <button 
                onClick={() => onToggleTimer(isActive, seconds)} 
                className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs transition-all active:scale-95 ${isActive ? 'bg-amber-600 text-white' : 'bg-green-600 text-white shadow-lg shadow-green-900/20'}`}
              >
                {isActive ? <><Pause size={18} fill="currentColor" /> Pause</> : <><Play size={18} fill="currentColor" /> Start</>}
              </button>
              <button 
                onClick={onResetTimer} 
                className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* 4. POPULATION MONITOR */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> Population ({activePlayers.length})
            </h2>
            <div className="bg-slate-900 px-3 py-1 rounded-full border border-white/5">
               <span className="text-slate-400 text-[8px] font-black uppercase">Threshold: {killThreshold}V</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.filter(p => p.role !== 'Moderator').map((p) => {
              const voteCount = votesData.filter(v => v === p.id).length;
              const isDead = p.status === 'dead';
              return (
                <div key={p.id} className={`p-5 rounded-[2rem] border transition-all ${isDead ? 'bg-black/40 border-slate-900 opacity-50' : 'bg-slate-900 border-white/5 shadow-xl'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDead ? 'bg-slate-800' : 'bg-red-900/20'}`}>
                        {isDead ? <Skull size={22} className="text-slate-600" /> : <User size={22} className="text-red-400" />}
                      </div>
                      <div className="truncate">
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Username</p>
                        <p className={`font-black text-lg truncate ${isDead ? 'text-slate-600' : 'text-white'}`}>{p.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onKill(p.id, p.status)} 
                      className={`p-2.5 rounded-xl transition-all ${isDead ? 'bg-red-900/20 text-red-500' : 'bg-slate-950 text-slate-600 hover:text-red-500'}`}
                    >
                      {isDead ? <Skull size={18} /> : <Heart size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <p className={`text-[10px] font-black uppercase tracking-wide ${isDead ? 'text-red-700' : 'text-blue-400'}`}>{p.role}</p>
                    {isDead && <span className="text-[10px] font-bold text-red-700">☠️ ELIMINATED</span>}
                  </div>
                  {voteCount > 0 && !isDead && (
                    <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-white/5 mt-3">
                       <div className="h-1.5 flex-1 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: `${(voteCount/killThreshold)*100}%` }} />
                       </div>
                       <span className="text-[10px] font-black text-orange-500">{voteCount}V</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* CHAT OVERLAY */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950 p-4 pt-20 animate-in slide-in-from-right duration-300">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Moderator Chat</h2>
              <button onClick={() => setIsChatOpen(false)} className="p-3 bg-slate-900 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
               <ChatRoom roomCode={roomCode} myId="host" myName="MODERATOR" players={players} isHost={true} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ModeratorDashboard;