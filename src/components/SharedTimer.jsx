import React from 'react';
import { Timer as TimerIcon, Sun, Sunset, Moon, Clock, Play, Pause } from 'lucide-react';

const SharedTimer = ({ seconds, phase, isActive }) => {
  const formatTime = (s) => {
    const totalSeconds = parseInt(s) || 0;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseIcon = () => {
    const p = phase?.toLowerCase() || "";
    if (p.includes("pagi")) return <Sun size={14} className="text-amber-500" />;
    if (p.includes("siang")) return <Sunset size={14} className="text-orange-500" />;
    if (p.includes("malam")) return <Moon size={14} className="text-purple-500 animate-pulse" />;
    return <TimerIcon size={14} className="text-slate-500" />;
  };

  const isUrgent = seconds < 30 && isActive;

  return (
    <div className={`relative overflow-hidden rounded-2xl md:rounded-3xl border transition-all duration-500 w-full ${
      isActive 
        ? isUrgent 
          ? 'border-red-500/50 bg-red-950/20' 
          : 'border-blue-500/30 bg-blue-950/10'
        : 'border-slate-800 bg-slate-900/90'
    }`}>
      {/* Animated background for active state */}
      {isActive && (
        <div className={`absolute inset-0 opacity-10 ${
          isUrgent 
            ? 'bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 animate-pulse' 
            : 'bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0'
        }`} 
        />
      )}

      <div className="relative px-4 md:px-8 py-3 md:py-4 flex flex-col items-center gap-1 md:gap-2">
        {/* Phase indicator */}
        <div className="flex items-center gap-1 md:gap-2">
          {getPhaseIcon()}
          <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] italic ${
            isActive 
              ? isUrgent ? 'text-red-400' : 'text-blue-400'
              : 'text-slate-500'
          }`}>
            {phase || "WAITING"}
          </span>
        </div>

        {/* Time display */}
        <div className="flex items-center gap-2 md:gap-3">
          <Clock 
            size={16} md:size={20} 
            className={`${isActive 
              ? isUrgent 
                ? "text-red-500 animate-bounce" 
                : "text-blue-500 animate-pulse"
              : "text-slate-700"
            }`} 
          />
          <span className={`font-mono text-xl sm:text-2xl md:text-4xl font-black tracking-tighter leading-none tabular-nums ${
            isActive 
              ? isUrgent 
                ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                : "text-white"
              : "text-slate-300"
          }`}>
            {formatTime(seconds)}
          </span>
        </div>

        {/* Status badge */}
        {!isActive && seconds > 0 && (
          <div className="flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 bg-amber-500/10 rounded-full">
            <Pause size={8} md:size={10} className="text-amber-500" />
            <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest text-amber-500">
              PAUSED
            </span>
          </div>
        )}

        {isActive && (
          <div className="flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 bg-blue-500/10 rounded-full">
            <Play size={8} md:size={10} className="text-blue-500" />
            <span className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest ${isUrgent ? 'text-red-500' : 'text-blue-500'}`}>
              RUNNING
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedTimer;