import React from 'react';
import { Timer as TimerIcon, Sun, Sunset, Moon, Clock } from 'lucide-react';

const SharedTimer = ({ seconds, phase, isActive }) => {
  // Fungsi format waktu MM:SS
  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pilih Icon berdasarkan fase
  const getPhaseIcon = () => {
    const p = phase?.toLowerCase() || "";
    if (p.includes("pagi")) return <Sun size={14} className="text-amber-500 animate-spin-slow" />;
    if (p.includes("siang")) return <Sunset size={14} className="text-orange-500" />;
    if (p.includes("malam")) return <Moon size={14} className="text-purple-500 animate-pulse" />;
    return <TimerIcon size={14} className="text-slate-500" />;
  };

  return (
    <div className={`flex flex-col items-center gap-1 px-6 py-3 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl transition-all duration-500 
      ${isActive ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'opacity-80'}`}>
      
      {/* Label Fase */}
      <div className="flex items-center gap-2 mb-1">
        {getPhaseIcon()}
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
          {phase || "WAITING"}
        </span>
      </div>

      {/* Display Angka Waktu */}
      <div className="flex items-center gap-3">
        <Clock 
          size={18} 
          className={`${isActive ? (seconds < 30 ? "text-red-500 animate-bounce" : "text-blue-500 animate-pulse") : "text-slate-700"}`} 
        />
        <span className={`font-mono text-3xl font-black tracking-tighter leading-none transition-colors
          ${seconds < 30 && isActive ? "text-red-500 animate-pulse" : "text-white"}`}>
          {formatTime(seconds)}
        </span>
      </div>

      {/* Indikator Pause */}
      {!isActive && seconds > 0 && (
        <span className="text-[7px] font-bold text-amber-500/40 uppercase tracking-widest mt-1">
          PAUSED
        </span>
      )}
    </div>
  );
};

export default SharedTimer;