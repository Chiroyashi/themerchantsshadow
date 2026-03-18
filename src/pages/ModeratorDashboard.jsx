import React, { useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  Skull, Heart, Play, Pause, RefreshCw, Info, LogOut, 
  Sun, Sunset, Moon, Plus, Clock, Timer as TimerIcon 
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';

const ModeratorDashboard = ({ 
  players, roomCode, onKill, onExit, 
  onToggleTimer, onResetTimer, onSetPhase, onEditTimer 
}) => {
  const [globalTimer, setGlobalTimer] = useState({ isActive: false, seconds: 300, phase: "Pagi (Diskusi)" });
  const [isEditing, setIsEditing] = useState(false);
  
  const [timeInput, setTimeInput] = useState("05:00");
  const [tempSeconds, setTempSeconds] = useState(300);

  useEffect(() => {
    if (!roomCode) return;
    const timerRef = ref(db, `rooms/${roomCode}/timer`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGlobalTimer(data);
        if (!isEditing) {
          setTempSeconds(data.seconds);
          const mins = Math.floor(data.seconds / 60).toString().padStart(2, '0');
          const secs = (data.seconds % 60).toString().padStart(2, '0');
          setTimeInput(`${mins}:${secs}`);
        }
      }
    });
    return () => unsubscribe();
  }, [roomCode, isEditing]);

  useEffect(() => {
    let interval = null;
    if (globalTimer.isActive && tempSeconds > 0) {
      interval = setInterval(() => {
        setTempSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [globalTimer.isActive, tempSeconds]);

  const handleTimeSubmit = () => {
    const parts = timeInput.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      const totalSeconds = (minutes * 60) + seconds;
      onEditTimer(totalSeconds);
    }
    setIsEditing(false);
  };

  const aliveCount = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-8 border-b border-slate-800 pb-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-black text-red-600 uppercase italic leading-none tracking-tighter">Command Center</h1>
            <p className="text-[10px] text-slate-500 font-mono mt-2 tracking-[0.2em]">OPERATIONAL ROOM: {roomCode}</p>
          </div>
          <button 
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/10 text-red-500 border border-red-900/30 rounded-lg hover:bg-red-900/20 transition-all text-[10px] font-black uppercase tracking-widest w-fit"
          >
            <LogOut size={14} /> Bubarkan Room
          </button>
        </div>

        {/* TIME GOD PANEL */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl w-full lg:max-w-md space-y-6">
          <div className="flex justify-between items-center">
             <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black flex items-center gap-2">
               <Clock size={12} /> Time God Controller
             </p>
             <span className="px-2 py-0.5 bg-red-600/10 text-red-500 text-[8px] font-black rounded border border-red-600/20 uppercase animate-pulse">Live Sync</span>
          </div>

          {/* 1. Periode Selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "Pagi (Diskusi)", label: "Pagi", icon: Sun, color: "text-amber-500", bg: "bg-amber-500/10" },
              { id: "Siang (Voting)", label: "Siang", icon: Sunset, color: "text-orange-500", bg: "bg-orange-500/10" },
              { id: "Malam (Eksekusi)", label: "Malam", icon: Moon, color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map((phase) => (
              <button
                key={phase.id}
                onClick={() => onSetPhase(phase.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                  globalTimer.phase === phase.id 
                    ? `${phase.bg} border-${phase.color.split('-')[1]}-500/50 ${phase.color}` 
                    : 'border-slate-800 text-slate-600 hover:border-slate-700'
                }`}
              >
                <phase.icon size={18} />
                <span className="text-[8px] font-black uppercase tracking-tighter">{phase.label}</span>
              </button>
            ))}
          </div>

          {/* 2. Timer Display & Tiga Pilar Kontrol (Edit | Timer | Quick Add) */}
          <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 relative z-10">
              
              {/* Pilar Kiri: Edit Manual */}
              <div className="flex-1 flex justify-center">
                {isEditing ? (
                  <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300 absolute inset-0 z-20 bg-slate-900/95 p-2 rounded-xl justify-center">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
                        className="bg-transparent text-blue-500 text-5xl font-black w-32 text-center outline-none font-mono tracking-tighter"
                        autoFocus
                      />
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Format MM:SS</span>
                    </div>
                    <div className="flex gap-2 w-full mt-2">
                        <button onClick={() => setIsEditing(false)} className="flex-1 py-1 text-[8px] font-black text-slate-500 uppercase">Batal</button>
                        <button onClick={handleTimeSubmit} className="flex-[2] py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-blue-900/40">Confirm</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full aspect-square flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all text-slate-400 hover:text-white group"
                  >
                    <TimerIcon size={20} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-[7px] font-black uppercase mt-1 tracking-tighter">Set Time</span>
                  </button>
                )}
              </div>

              {/* Pilar Tengah: Shared Timer Display */}
              <div className="flex-[1.8] flex justify-center scale-110">
                <SharedTimer roomCode={roomCode} />
              </div>

              {/* Pilar Kanan: Quick +01:00 */}
              <div className="flex-1 flex justify-center">
                <button 
                  onClick={() => onEditTimer(globalTimer.seconds + 60)}
                  className="w-full aspect-square flex flex-col items-center justify-center bg-blue-600/10 text-blue-500 border border-blue-600/20 rounded-xl hover:bg-blue-600/20 transition-all group"
                >
                  <Plus size={20} className="group-hover:scale-125 transition-transform" />
                  <span className="text-[7px] font-black uppercase mt-1">+01:00</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Main Playback Controls */}
          <div className="flex gap-2">
            <button 
              onClick={() => onToggleTimer(globalTimer.isActive, tempSeconds)}
              className={`flex-1 flex justify-center items-center gap-3 p-4 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${
                globalTimer.isActive 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' 
                  : 'bg-green-700 hover:bg-green-600 shadow-green-900/20'
              }`}
            >
              {globalTimer.isActive ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
              <span className="uppercase tracking-widest text-xs">
                {globalTimer.isActive ? 'Pause' : 'Play'}
              </span>
            </button>
            
            <button 
              onClick={onResetTimer}
              className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all text-slate-400 hover:text-white group"
            >
              <RefreshCw size={20} className="group-active:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>

        <div className="hidden xl:block text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pemain Aktif</p>
          <p className="text-3xl font-black text-blue-500 tracking-tighter">{aliveCount} <span className="text-xs text-slate-700">/ {players.length - 1}</span></p>
        </div>
      </header>

      {/* PLAYER GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {players.filter(p => p.role !== 'Moderator').map((p) => (
          <div 
            key={p.id} 
            className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
              p.status === 'dead' 
                ? 'bg-slate-950 border-red-900/20 opacity-40 grayscale shadow-inner scale-[0.98]' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-600 shadow-xl'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="overflow-hidden">
                <h3 className={`font-bold truncate ${p.status === 'dead' ? 'text-slate-600 line-through' : 'text-white'}`}>
                  {p.name}
                </h3>
                <p className={`text-[10px] font-black uppercase tracking-wider mt-1 ${
                  p.role.toLowerCase().includes('werewolf') ? 'text-red-500' : 
                  p.role.toLowerCase().includes('warlock') ? 'text-purple-500' : 
                  p.role.toLowerCase().includes('seer') ? 'text-emerald-500' : 'text-blue-400'
                }`}>
                  {p.role}
                </p>
              </div>
              
              <button 
                onClick={() => onKill(p.id, p.status)}
                className={`p-2.5 rounded-xl transition-all ${
                  p.status === 'dead' 
                    ? 'bg-red-900/30 text-red-500 shadow-inner' 
                    : 'bg-slate-800 text-slate-500 hover:bg-red-700 hover:text-white hover:rotate-12 shadow-lg'
                }`}
              >
                {p.status === 'dead' ? <Skull size={18} /> : <Heart size={18} />}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
              <div className={`w-2 h-2 rounded-full ${
                p.role.toLowerCase().includes('werewolf') || p.role.toLowerCase().includes('warlock') 
                  ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]' 
                  : 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]'
              }`}></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-shadow-sm">
                {p.role.toLowerCase().includes('werewolf') || p.role.toLowerCase().includes('warlock') ? 'Antagonis' : 'Protagonis'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-12 p-6 bg-slate-900/20 border border-slate-800/50 rounded-2xl flex items-center gap-4 border-dashed text-slate-500 text-center">
        <Info size={20} className="text-amber-500 shrink-0 mx-auto" />
        <p className="text-[11px] leading-relaxed italic mt-2">
          <strong>Pro Command Center:</strong> Layout tiga pilar memudahkan kamu mengatur waktu dengan presisi. Klik Set Time untuk input angka raksasa yang mudah dibaca.
        </p>
      </footer>
    </div>
  );
};

export default ModeratorDashboard;