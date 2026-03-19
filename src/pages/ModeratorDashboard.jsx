import React, { useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  Skull, Heart, Play, Pause, RefreshCw, Info, LogOut, 
  Sun, Sunset, Moon, Plus, Clock, Timer as TimerIcon,
  BarChart3, FastForward, ShieldAlert
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import ChatRoom from '../components/ChatRoom';

const ModeratorDashboard = ({ 
  players, roomCode, onKill, onExit, 
  onToggleTimer, onResetTimer, onSetPhase, onEditTimer,
  seconds, phase, isActive, day // Terima props day dari App.jsx
}) => {
  const [votes, setVotes] = useState({});
  const [nightActions, setNightActions] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [timeInput, setTimeInput] = useState("05:00");

  // 1. LISTENERS (VOTING & NIGHT ACTIONS)
  useEffect(() => {
    if (!roomCode) return;
    
    // Listener Voting
    const votesRef = ref(db, `rooms/${roomCode}/votes`);
    const unsubscribeVotes = onValue(votesRef, (snapshot) => {
      setVotes(snapshot.val() || {});
    });

    // Listener Aksi Malam Pemain
    const nightRef = ref(db, `rooms/${roomCode}/nightActions`);
    const unsubscribeNight = onValue(nightRef, (snapshot) => {
      setNightActions(snapshot.val() || {});
    });

    if (!isEditing) {
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      setTimeInput(`${mins}:${secs}`);
    }

    return () => {
      unsubscribeVotes();
      unsubscribeNight();
    };
  }, [roomCode, seconds, isEditing]);

  // 2. AUTO-PHASE PROGRESSION
  useEffect(() => {
    if (isActive && seconds <= 0) {
      let nextPhase = "";
      const current = phase?.toLowerCase() || "";
      if (current.includes("pagi")) nextPhase = "Siang (Voting)";
      else if (current.includes("siang")) nextPhase = "Malam (Eksekusi)";
      else if (current.includes("malam")) nextPhase = "Pagi (Diskusi)";

      if (nextPhase) {
        onSetPhase(nextPhase); 
        onEditTimer(300);
      }
    }
  }, [seconds, isActive, phase, onSetPhase, onEditTimer]);

  // 3. DATA CALCULATIONS
  const activePlayers = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator');
  const votesData = Object.values(votes);
  const totalVotesReceived = votesData.length;
  const skipCount = votesData.filter(v => v === 'skip').length;
  const targetVotesCount = votesData.filter(v => v !== 'skip').length;
  const killThreshold = Math.floor(activePlayers.length / 2) + 1;

  const handleTimeSubmit = () => {
    const parts = timeInput.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const secondsVal = parseInt(parts[1]) || 0;
      onEditTimer((minutes * 60) + secondsVal);
    }
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-8 border-b border-slate-800 pb-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-black text-red-600 uppercase italic leading-none tracking-tighter">Command Center</h1>
            <p className="text-[10px] text-slate-500 font-mono mt-2 tracking-[0.2em]">OPERATIONAL ROOM: {roomCode} • HARI {day}</p>
          </div>
          <button onClick={onExit} className="flex items-center gap-2 px-4 py-2 bg-red-900/10 text-red-500 border border-red-900/30 rounded-lg hover:bg-red-900/20 transition-all text-[10px] font-black uppercase tracking-widest w-fit">
            <LogOut size={14} /> Bubarkan Room
          </button>
        </div>

        {/* TIME CONTROLLER */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl w-full lg:max-w-md space-y-6">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "Pagi (Diskusi)", label: "Pagi", icon: Sun, color: "text-amber-500", bg: "bg-amber-500/10" },
              { id: "Siang (Voting)", label: "Siang", icon: Sunset, color: "text-orange-500", bg: "bg-orange-500/10" },
              { id: "Malam (Eksekusi)", label: "Malam", icon: Moon, color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map((p) => (
              <button key={p.id} onClick={() => onSetPhase(p.id)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${phase === p.id ? `${p.bg} border-slate-500 ${p.color}` : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                <p.icon size={18} />
                <span className="text-[8px] font-black uppercase">{p.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex items-center justify-between gap-4">
             <button onClick={() => setIsEditing(true)} className="flex-1 aspect-square bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500 transition-colors">
               <TimerIcon size={20} />
             </button>
             <div className="flex-[2] scale-110">
               <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
             </div>
             <button onClick={() => onEditTimer(seconds + 60)} className="flex-1 aspect-square bg-blue-600/10 text-blue-500 border border-blue-600/20 rounded-xl hover:bg-blue-600/20 flex flex-col items-center justify-center transition-all">
               <Plus size={20} />
               <span className="text-[7px] font-black mt-1">+01:00</span>
             </button>
             {isEditing && (
                <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center p-2 rounded-xl animate-in zoom-in">
                  <input type="text" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} className="bg-transparent text-blue-500 text-4xl font-black w-full text-center outline-none font-mono" autoFocus />
                  <div className="flex gap-2 w-full mt-2">
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-1 text-[8px] font-black text-slate-500 uppercase">Batal</button>
                    <button onClick={handleTimeSubmit} className="flex-[2] py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase">Confirm</button>
                  </div>
                </div>
             )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => onToggleTimer(isActive, seconds)} className={`flex-1 flex justify-center items-center gap-3 p-4 rounded-2xl font-black transition-all shadow-lg ${isActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-green-700 hover:bg-green-600'}`}>
              {isActive ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
              <span className="uppercase tracking-widest text-xs">{isActive ? 'Pause' : 'Play'}</span>
            </button>
            <button onClick={onResetTimer} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all text-slate-400 hover:text-white"><RefreshCw size={20} /></button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT & CENTER: PLAYER LIST (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center px-2">
            <span className="text-orange-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><BarChart3 size={14} /> Population Monitor</span>
            <span className="text-slate-600 text-[9px] font-black uppercase">Voters: {totalVotesReceived}/{activePlayers.length} • Threshold: {killThreshold}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {players.filter(p => p.role !== 'Moderator').map((p) => {
              const voteCount = votesData.filter(v => v === p.id).length;
              const isDanger = voteCount >= killThreshold;
              const isDead = p.status === 'dead';

              return (
                <div key={p.id} className={`group relative p-5 rounded-2xl border transition-all duration-300 ${isDead ? 'bg-slate-950 border-red-900/20 opacity-40 grayscale' : isDanger ? 'bg-orange-900/10 border-orange-500 shadow-lg shadow-orange-900/20' : 'bg-slate-900 border-slate-800 hover:border-slate-600 shadow-xl'}`}>
                  {voteCount > 0 && !isDead && (
                    <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-slate-950 flex items-center justify-center font-black text-xs shadow-xl animate-in zoom-in ${isDanger ? 'bg-red-600 text-white animate-bounce' : 'bg-orange-500 text-slate-950'}`}>
                      {voteCount}
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div className="overflow-hidden">
                      <h3 className={`font-bold truncate ${isDead ? 'text-slate-600 line-through' : 'text-white'}`}>{p.name}</h3>
                      <p className={`text-[10px] font-black uppercase tracking-wider mt-1 text-blue-400`}>{p.role}</p>
                    </div>
                    <button onClick={() => onKill(p.id, p.status)} className={`p-2.5 rounded-xl transition-all ${isDead ? 'bg-red-900/30 text-red-500' : isDanger ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-red-700 hover:text-white shadow-lg'}`}>
                      {isDead ? <Skull size={18} /> : <Heart size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.role.toLowerCase().includes('werewolf') ? 'bg-red-600' : 'bg-blue-600'}`}></div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{p.role.toLowerCase().includes('werewolf') ? 'Antagonis' : 'Protagonis'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: LOGS & INTEL (1 Column) */}
        <div className="lg:col-span-1 space-y-6">
          {/* NIGHT ACTION LOG */}
          <div className="bg-slate-900 border border-purple-500/20 p-5 rounded-[2.5rem] shadow-2xl h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase text-purple-400 flex items-center gap-2 tracking-widest">
                <Moon size={14} /> Malam Ke-{day} Log
              </h2>
              {Object.keys(nightActions).length > 0 && <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></span>}
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(nightActions).length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                  <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest">Sinyal Lemah...</p>
                </div>
              ) : (
                Object.entries(nightActions).map(([id, act]) => (
                  <div key={id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 animate-in slide-in-from-right-4">
                    <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest mb-1">{act.role}</p>
                    <p className="text-[10px] font-bold text-white leading-tight">
                      <span className="text-slate-500 font-medium">{act.senderName}</span> <br/>
                      <span className="text-purple-500">→</span> {act.targetName}
                    </p>
                    <div className="mt-2 text-[7px] bg-slate-900 w-fit px-2 py-0.5 rounded font-black text-slate-400 uppercase tracking-tighter">
                      Action: {act.action}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MONITOR INTEL (CHAT) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest px-2">
              <ShieldAlert size={14} /> Intelligence Monitor
            </div>
            <ChatRoom 
              roomCode={roomCode} 
              myId="host" 
              myName="MODERATOR" 
              players={players} 
              isHost={true} 
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModeratorDashboard;