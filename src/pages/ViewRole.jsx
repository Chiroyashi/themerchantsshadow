import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Skull, HelpCircle, BookOpen, X } from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import RoleModal from '../components/RoleModal'; // Pastikan import ini benar

const ViewRole = ({ playerData, roomCode, onNext, onLeave }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);

  // Menentukan tema visual kartu berdasarkan role
  const theme = (() => {
    const role = playerData?.role?.toLowerCase() || "";
    if (role.includes('werewolf') || role.includes('warlock')) 
      return { color: "text-red-500", bg: "bg-red-950/20", border: "border-red-600", icon: Skull };
    if (role.includes('moderator')) 
      return { color: "text-amber-500", bg: "bg-amber-950/20", border: "border-amber-600", icon: Shield };
    return { color: "text-blue-500", bg: "bg-blue-950/20", border: "border-blue-600", icon: Shield };
  })();

  const RoleIcon = theme.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center font-sans">
      
      {/* 1. Timer Sinkron (Fixed at Top) */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 scale-90 md:scale-100">
        <SharedTimer roomCode={roomCode} />
      </div>

      {/* 2. Pop-up Tutorial Role */}
      <RoleModal 
        role={playerData?.role} 
        isOpen={showMechanics} 
        onClose={() => setShowMechanics(false)} 
      />

      <div className="max-w-md w-full space-y-8 text-center pt-12">
        {/* Identitas Pemain */}
        <div className="space-y-1">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Identity Assigned</p>
          <h2 className="text-xl font-bold italic">{playerData?.name || "Pemain"}</h2>
          <p className="text-slate-600 text-xs font-mono uppercase tracking-widest">Room: {roomCode}</p>
        </div>

        {/* 3. Kartu Role Utama */}
        <div className={`relative aspect-[3/4] w-full rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden
            ${isRevealed ? `${theme.bg} ${theme.border} shadow-[0_0_30px_rgba(220,38,38,0.2)]` : 'bg-slate-900 border-slate-800'}`}>
          
          {!isRevealed ? (
            /* Tampilan Tertutup */
            <div className="space-y-4 animate-pulse">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                <HelpCircle className="text-slate-600 w-10 h-10" />
              </div>
              <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">
                Ketuk tombol di bawah <br/> untuk melihat peran
              </p>
            </div>
          ) : (
            /* Tampilan Terbuka */
            <div className="space-y-6 z-10 animate-in fade-in zoom-in duration-300 text-center">
              <RoleIcon className={`${theme.color} w-24 h-24 mx-auto drop-shadow-lg`} />
              <div className="space-y-2">
                <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme.color}`}>
                  {playerData?.role}
                </h3>
                <div className="h-[1px] w-12 bg-slate-700 mx-auto"></div>
                <p className="text-slate-400 text-xs leading-relaxed max-w-[200px] mx-auto italic">
                  "Rahasiakan peranmu, atau kegelapan akan menjemputmu lebih cepat."
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4. Action Buttons Area */}
        <div className="space-y-6">
          {/* Tombol Tahan Intip */}
          <button 
            onMouseDown={() => setIsRevealed(true)}
            onMouseUp={() => setIsRevealed(false)}
            onTouchStart={() => setIsRevealed(true)}
            onTouchEnd={() => setIsRevealed(false)}
            className={`w-full py-5 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 select-none
              ${isRevealed ? 'bg-slate-100 text-slate-950 shadow-inner' : 'bg-red-700 hover:bg-red-600 shadow-lg shadow-red-900/20'}`}
          >
            {isRevealed ? <EyeOff size={20} /> : <Eye size={20} />}
            {isRevealed ? "LEPASKAN UNTUK SEMBUNYI" : "TAHAN UNTUK INTIP ROLE"}
          </button>

          <div className="flex flex-col gap-6 items-center">
            {/* Navigasi & Tutorial (Hanya muncul saat diintip) */}
            {isRevealed && (
              <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button 
                  onClick={() => setShowMechanics(true)}
                  className="flex items-center justify-center gap-2 text-amber-500 hover:text-amber-400 text-[10px] uppercase font-black tracking-[0.2em]"
                >
                  <BookOpen size={14} /> Panduan Peran ({playerData?.role})
                </button>
                
                <button 
                  onClick={onNext}
                  className="w-full py-4 border border-slate-800 text-slate-500 hover:text-white rounded-xl text-[10px] uppercase font-bold tracking-[0.2em] transition-all"
                >
                  Lanjut ke Daftar Pemain
                </button>
              </div>
            )}

            {/* Tombol Keluar Manual (Menyerah) */}
            <button 
              onClick={onLeave}
              className="text-[9px] text-slate-700 hover:text-red-500 font-bold uppercase tracking-[0.3em] transition-colors flex items-center gap-2 border-t border-slate-900 pt-4 w-full justify-center"
            >
              <X size={12} /> Keluar & Menyerah
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewRole;