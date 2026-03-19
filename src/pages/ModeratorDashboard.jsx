import React, { useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  Skull, Heart, Play, Pause, RefreshCw, Info, LogOut, 
  Sun, Sunset, Moon, Plus, Clock, Timer as TimerIcon,
  BarChart3, FastForward
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';

const ModeratorDashboard = ({ 
  players, roomCode, onKill, onExit, 
  onToggleTimer, onResetTimer, onSetPhase, onEditTimer,
  seconds, phase, isActive // Terima props sinkron dari App.jsx
}) => {
  const [votes, setVotes] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [timeInput, setTimeInput] = useState("05:00");

  // 1. SINKRONISASI VOTING & INPUT TIME
  useEffect(() => {
    if (!roomCode) return;
    
    // Listener Voting
    const votesRef = ref(db, `rooms/${roomCode}/votes`);
    const unsubscribeVotes = onValue(votesRef, (snapshot) => {
      setVotes(snapshot.val() || {});
    });

    // Update string input waktu (MM:SS) setiap kali detik global berubah
    // Hanya jika sedang tidak mengetik manual (isEditing)
    if (!isEditing) {
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      setTimeInput(`${mins}:${secs}`);
    }

    return () => unsubscribeVotes();
  }, [roomCode, seconds, isEditing]);

  // 2. LOGIKA AUTO-PHASE PROGRESSION (Moderator side)
  useEffect(() => {
    // Jalankan perpindahan fase otomatis hanya jika timer aktif dan menyentuh 0
    if (isActive && seconds <= 0) {
      let nextPhase = "";
      const current = phase?.toLowerCase() || "";

      if (current.includes("pagi")) {
        nextPhase = "Siang (Voting)";
      } else if (current.includes("siang")) {
        nextPhase = "Malam (Eksekusi)";
      } else if (current.includes("malam")) {
        nextPhase = "Pagi (Diskusi)";
      }

      if (nextPhase) {
        onSetPhase(nextPhase); 
        onEditTimer(300); // Reset ke 5 menit untuk fase baru
      }
    }
  }, [seconds, isActive, phase, onSetPhase, onEditTimer]);

  // 3. KALKULASI VOTING
  const activePlayers = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator');
  const totalPossibleVoters = activePlayers.length;
  const votesData = Object.values(votes);
  const totalVotesReceived = votesData.length;
  const skipCount = votesData.filter(v => v === 'skip').length;
  const targetVotesCount = votesData.filter(v => v !== 'skip').length;
  const killThreshold = Math.floor(totalPossibleVoters / 2) + 1;

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
            <p className="text-[10px] text-slate-500 font-mono mt-2 tracking-[0.2em]">OPERATIONAL ROOM: {roomCode}</p>
          </div>
          <button onClick={onExit} className="flex items-center gap-2 px-4 py-2 bg-red-900/10 text-red-500 border border-red-900/30 rounded-lg hover:bg-red-900/20 transition-all text-[10px] font-black uppercase tracking-widest w-fit">
            <LogOut size={14} /> Bubarkan Room
          </button>
        </div>

        {/* TIME GOD PANEL */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl w-full lg:max-w-md space-y-6">
          <div className="flex justify-between items-center text-[10px] uppercase font-black">
             <span className="flex items-center gap-2 text-slate-500"><Clock size={12} /> Time Controller</span>
             <span className="px-2 py-0.5 bg-red-600/10 text-red-500 rounded border border-red-600/20 animate-pulse">Live Sync</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "Pagi (Diskusi)", label: "Pagi", icon: Sun, color: "text-amber-500", bg: "bg-amber-500/10" },
              { id: "Siang (Voting)", label: "Siang", icon: Sunset, color: "text-orange-500", bg: "bg-orange-500/10" },
              { id: "Malam (Eksekusi)", label: "Malam", icon: Moon, color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map((p) => (
              <button key={p.id} onClick={() => onSetPhase(p.id)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${phase === p.id ? `${p.bg} border-${p.color.split('-')[1]}-500/50 ${p.color}` : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                <p.icon size={18} />
                <span className="text-[8px] font-black uppercase">{p.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="flex-1 flex justify-center">
                {isEditing ? (
                  <div className="flex flex-col items-center gap-2 animate-in zoom-in absolute inset-0 z-20 bg-slate-900/95 p-2 rounded-xl justify-center">
                    <input type="text" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} className="bg-transparent text-blue-500 text-5xl font-black w-32 text-center outline-none font-mono tracking-tighter" autoFocus />
                    <div className="flex gap-2 w-full mt-2">
                        <button onClick={() => setIsEditing(false)} className="flex-1 py-1 text-[8px] font-black text-slate-500 uppercase">Batal</button>
                        <button onClick={handleTimeSubmit} className="flex-[2] py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg">Confirm</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="w-full aspect-square flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all text-slate-400 group">
                    <TimerIcon size={20} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-[7px] font-black uppercase mt-1">Set Time</span>
                  </button>
                )}
              </div>

              {/* TAMPILAN TIMER UTAMA (Menerima seconds dari App.jsx) */}
              <div className="flex-[1.8] flex justify-center scale-110">
                <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
              </div>

              <div className="flex-1 flex justify-center">
                <button onClick={() => onEditTimer(seconds + 60)} className="w-full aspect-square flex flex-col items-center justify-center bg-blue-600/10 text-blue-500 border border-blue-600/20 rounded-xl hover:bg-blue-600/20 transition-all group">
                  <Plus size={20} className="group-hover:scale-125 transition-transform" />
                  <span className="text-[7px] font-black uppercase mt-1">+01:00</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => onToggleTimer(isActive, seconds)} className={`flex-1 flex justify-center items-center gap-3 p-4 rounded-2xl font-black transition-all shadow-lg ${isActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-green-700 hover:bg-green-600'}`}>
              {isActive ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
              <span className="uppercase tracking-widest text-xs">{isActive ? 'Pause' : 'Play'}</span>
            </button>
            <button onClick={onResetTimer} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all text-slate-400 hover:text-white"><RefreshCw size={20} /></button>
          </div>
        </div>

        {/* VOTING MONITOR PANEL */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl w-full lg:max-w-md space-y-4">
          <div className="flex justify-between items-center text-[10px] uppercase font-black">
             <span className="text-orange-500 flex items-center gap-2"><BarChart3 size={14} /> Voting Monitor</span>
             <span className="text-slate-500 font-mono">{totalVotesReceived} / {totalPossibleVoters} Voted</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <FastForward size={14} className="text-slate-500 mx-auto mb-2" />
              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Skip</p>
              <p className="text-3xl font-black text-white">{skipCount}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center relative overflow-hidden">
              <Skull size={14} className="text-orange-500 mx-auto mb-2" />
              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Target</p>
              <p className="text-3xl font-black text-orange-500">{targetVotesCount}</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-600/10">
                <div className="h-full bg-orange-600 transition-all duration-500" style={{ width: `${(totalVotesReceived / (totalPossibleVoters || 1)) * 100}%` }}></div>
              </div>
            </div>
          </div>
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 text-center text-[9px] font-black text-slate-500 uppercase">
             Execution Threshold: <span className="text-red-500">{killThreshold} Votes</span>
          </div>
        </div>
      </header>

      {/* PLAYER GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {players.filter(p => p.role !== 'Moderator').map((p) => {
          const voteCount = votesData.filter(v => v === p.id).length;
          const isDanger = voteCount >= killThreshold;
          const isDead = p.status === 'dead';

          return (
            <div key={p.id} className={`group relative p-5 rounded-2xl border transition-all duration-300 ${isDead ? 'bg-slate-950 border-red-900/20 opacity-40 grayscale scale-[0.98]' : isDanger ? 'bg-orange-900/10 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'bg-slate-900 border-slate-800 hover:border-slate-600 shadow-xl'}`}>
              {voteCount > 0 && !isDead && (
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-slate-950 flex items-center justify-center font-black text-xs shadow-xl animate-in zoom-in ${isDanger ? 'bg-red-600 text-white animate-bounce' : 'bg-orange-500 text-slate-950'}`}>
                  {voteCount}
                </div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div className="overflow-hidden">
                  <h3 className={`font-bold truncate ${isDead ? 'text-slate-600 line-through' : 'text-white'}`}>{p.name}</h3>
                  <p className={`text-[10px] font-black uppercase tracking-wider mt-1 ${p.role.toLowerCase().includes('werewolf') ? 'text-red-500' : p.role.toLowerCase().includes('warlock') ? 'text-purple-500' : p.role.toLowerCase().includes('seer') ? 'text-emerald-500' : 'text-blue-400'}`}>{p.role}</p>
                </div>
                <button onClick={() => onKill(p.id, p.status)} className={`p-2.5 rounded-xl transition-all ${isDead ? 'bg-red-900/30 text-red-500 shadow-inner' : isDanger ? 'bg-red-600 text-white shadow-red-900/50' : 'bg-slate-800 text-slate-500 hover:bg-red-700 hover:text-white shadow-lg'}`}>
                  {isDead ? <Skull size={18} /> : <Heart size={18} />}
                </button>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
                <div className={`w-2 h-2 rounded-full ${p.role.toLowerCase().includes('werewolf') || p.role.toLowerCase().includes('warlock') ? 'bg-red-600' : 'bg-blue-600'}`}></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{p.role.toLowerCase().includes('werewolf') || p.role.toLowerCase().includes('warlock') ? 'Antagonis' : 'Protagonis'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModeratorDashboard;