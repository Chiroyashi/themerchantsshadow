import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Skull, HelpCircle } from 'lucide-react';

const ViewRole = ({ playerData, roomCode, onNext }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  // Fungsi untuk menentukan warna tema berdasarkan role
  const getRoleTheme = (role) => {
    if (!role) return { color: "text-slate-400", bg: "bg-slate-900", icon: HelpCircle };
    const r = role.toLowerCase();
    if (r.includes('werewolf') || r.includes('warlock')) 
      return { color: "text-red-500", bg: "bg-red-950/20", border: "border-red-600", icon: Skull };
    if (r === 'moderator') 
      return { color: "text-amber-500", bg: "bg-amber-950/20", border: "border-amber-600", icon: Shield };
    return { color: "text-blue-500", bg: "bg-blue-950/20", border: "border-blue-600", icon: Shield };
  };

  const theme = getRoleTheme(playerData?.role);
  const RoleIcon = theme.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full space-y-8 text-center">
        
        {/* Header Info */}
        <div className="space-y-1">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Identity Assigned</p>
          <h2 className="text-xl font-bold italic">{playerData?.name || "Pemain"}</h2>
          <p className="text-slate-600 text-xs font-mono uppercase tracking-widest">Room: {roomCode}</p>
        </div>

        {/* Card Section */}
        <div 
          className={`relative aspect-[3/4] w-full rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden
            ${isRevealed ? `${theme.bg} ${theme.border} shadow-[0_0_30px_rgba(220,38,38,0.2)]` : 'bg-slate-900 border-slate-800'}`}
        >
          {/* Efek Cahaya Saat Terbuka */}
          {isRevealed && (
            <div className={`absolute inset-0 opacity-20 blur-3xl rounded-full -translate-y-1/2 ${theme.color.replace('text', 'bg')}`}></div>
          )}

          {!isRevealed ? (
            // Tampilan Kartu Tertutup
            <div className="space-y-4 animate-pulse">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                <HelpCircle className="text-slate-600 w-10 h-10" />
              </div>
              <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Ketuk tombol di bawah <br/> untuk melihat peran</p>
            </div>
          ) : (
            // Tampilan Kartu Terbuka
            <div className="space-y-6 z-10 animate-in fade-in zoom-in duration-300">
              <RoleIcon className={`${theme.color} w-24 h-24 mx-auto drop-shadow-lg`} />
              <div className="space-y-2">
                <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme.color}`}>
                  {playerData?.role}
                </h3>
                <div className="h-[1px] w-12 bg-slate-700 mx-auto"></div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-[200px] mx-auto">
                  Gunakan kemampuanmu dengan bijak dan jangan bocorkan identitasmu.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="space-y-6">
          <button 
            onMouseDown={() => setIsRevealed(true)}
            onMouseUp={() => setIsRevealed(false)}
            onTouchStart={() => setIsRevealed(true)}
            onTouchEnd={() => setIsRevealed(false)}
            className={`w-full py-5 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 select-none
              ${isRevealed ? 'bg-slate-100 text-slate-950' : 'bg-red-700 hover:bg-red-600 shadow-lg shadow-red-900/20'}`}
          >
            {isRevealed ? <EyeOff size={20} /> : <Eye size={20} />}
            {isRevealed ? "LEPASKAN UNTUK SEMBUNYI" : "TAHAN UNTUK INTIP ROLE"}
          </button>

          {isRevealed && (
            <button 
              onClick={onNext}
              className="text-slate-500 hover:text-white text-[10px] uppercase font-bold tracking-[0.2em] animate-fade-in"
            >
              Lanjut ke Panduan Permainan
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-700 uppercase tracking-widest">
          The Merchant's Shadow • Special Edition
        </p>
      </div>
    </div>
  );
};

export default ViewRole;