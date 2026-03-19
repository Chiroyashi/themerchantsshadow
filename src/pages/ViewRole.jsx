import React, { useState, useEffect } from 'react'; // FIXED: Ditambahkan import Hooks
import { Eye, EyeOff, Shield, Skull, HelpCircle, BookOpen, X, Ghost, LayoutGrid, Moon } from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import RoleModal from '../components/RoleModal';

// --- KOMPONEN NIGHT OVERLAY ---
const NightOverlay = ({ phase, isDead }) => {
  const isNight = phase?.toLowerCase().includes("malam");
  if (!isNight || isDead) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-1000">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent animate-pulse"></div>
      <div className="relative z-10 text-center space-y-6">
        <div className="relative">
           <Moon size={80} className="text-slate-800 mx-auto animate-bounce duration-[3000ms]" />
           <div className="absolute inset-0 blur-2xl bg-purple-600/20 rounded-full"></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Malam Telah Tiba</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">
            Pejamkan matamu... <br/> Jangan ada suara di kota ini.
          </p>
        </div>
      </div>
      <div className="absolute bottom-12 text-[8px] text-slate-800 font-mono tracking-widest uppercase border border-slate-900 px-4 py-2 rounded-full">
        Silent Mode Active
      </div>
    </div>
  );
};

const ViewRole = ({ playerData, roomCode, phase, seconds, isActive, onNext, onLeave }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);

  const isDead = playerData?.status === 'dead';

  // Menentukan tema visual kartu berdasarkan role
  const theme = (() => {
    const role = playerData?.role?.toLowerCase() || "";
    if (isDead) return { color: "text-slate-500", bg: "bg-slate-900/50", border: "border-slate-800", icon: Ghost };
    
    if (role.includes('werewolf') || role.includes('warlock')) 
      return { color: "text-red-500", bg: "bg-red-950/20", border: "border-red-600", icon: Skull };
    if (role.includes('moderator')) 
      return { color: "text-amber-500", bg: "bg-amber-950/20", border: "border-amber-600", icon: Shield };
    return { color: "text-blue-500", bg: "bg-blue-950/20", border: "border-blue-600", icon: Shield };
  })();

  const RoleIcon = theme.icon;

  return (
    <div className={`min-h-screen transition-colors duration-1000 p-6 flex flex-col items-center justify-center font-sans ${isDead ? 'bg-black' : 'bg-slate-950'}`}>
      
      {/* Timer Sinkron (Data dari Parent App.jsx) */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 scale-90 md:scale-100">
        <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
      </div>

      <RoleModal role={playerData?.role} isOpen={showMechanics} onClose={() => setShowMechanics(false)} />

      <div className="max-w-md w-full space-y-6 text-center pt-10">
        <div className="space-y-1">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Identity Assigned</p>
          <h2 className={`text-xl font-bold italic transition-colors ${isDead ? 'text-slate-600' : 'text-slate-100'}`}>
            {playerData?.name || "Pemain"} {isDead && "(GHOST)"}
          </h2>
        </div>

        {/* Kartu Role */}
        <div className={`relative aspect-[3/4] w-full rounded-2xl border-2 transition-all duration-700 flex flex-col items-center justify-center p-8 overflow-hidden
            ${isRevealed ? `${theme.bg} ${theme.border} ${!isDead && 'shadow-[0_0_30px_rgba(220,38,38,0.2)]'}` : 'bg-slate-900 border-slate-800'}
            ${isDead && 'grayscale'}`}>
          
          {!isRevealed ? (
            <div className="space-y-4 animate-pulse">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                {isDead ? <Ghost className="text-slate-600 w-10 h-10" /> : <HelpCircle className="text-slate-600 w-10 h-10" />}
              </div>
              <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">
                {isDead ? "Kamu telah tereliminasi" : "Tahan tombol merah untuk intip"}
              </p>
            </div>
          ) : (
            <div className="space-y-6 z-10 animate-in fade-in zoom-in duration-300 text-center">
              <RoleIcon className={`${theme.color} w-24 h-24 mx-auto drop-shadow-lg ${isDead && 'animate-bounce'}`} />
              <div className="space-y-2">
                <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme.color}`}>
                  {playerData?.role}
                </h3>
                <p className="text-slate-400 text-[10px] leading-relaxed max-w-[200px] mx-auto italic">
                  {isDead ? '"Suaramu kini tak terdengar."' : '"Rahasiakan peranmu."'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 w-full">
          <button 
            onMouseDown={() => setIsRevealed(true)}
            onMouseUp={() => setIsRevealed(false)}
            onTouchStart={() => setIsRevealed(true)}
            onTouchEnd={() => setIsRevealed(false)}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 select-none
              ${isRevealed ? 'bg-white text-slate-950 shadow-inner' : isDead ? 'bg-slate-800 text-slate-500 border border-slate-700 shadow-none' : 'bg-red-700 hover:bg-red-600 shadow-lg shadow-red-900/40'}`}
          >
            {isRevealed ? <EyeOff size={20} /> : <Eye size={20} />}
            <span className="text-xs">{isRevealed ? "LEPASKAN UNTUK SEMBUNYI" : (isDead ? "INTIP SISA PERAN" : "TAHAN UNTUK INTIP")}</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setShowMechanics(true)} 
              className="flex items-center justify-center gap-2 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-amber-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
              <BookOpen size={14} /> Panduan
            </button>
            <button 
              onClick={onNext} 
              className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all"
            >
              <LayoutGrid size={14} /> {isDead ? "Spectator" : "Papan Game"}
            </button>
          </div>

          <button 
            onClick={onLeave} 
            className="w-full pt-4 text-[9px] text-slate-700 hover:text-red-500 font-bold uppercase tracking-[0.3em] transition-colors flex items-center justify-center gap-2"
          >
            <X size={12} /> {isDead ? "Keluar Ke Lobby" : "Keluar & Menyerah"}
          </button>
        </div>
      </div>

      {/* Overlay Malam */}
      <NightOverlay phase={phase} isDead={isDead} />
    </div>
  );
};

export default ViewRole;