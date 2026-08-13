import React, { useEffect } from 'react';
import { Skull, Sun, Crosshair } from 'lucide-react';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const CrackedOverlay = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 100 100" preserveAspectRatio="none">
    <path
      d="M15,0 L30,30 L20,55 L45,75 L35,100"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className="text-red-500/35"
    />
    <path
      d="M30,30 L60,35 L75,15 L100,20 M20,55 L0,65 M45,75 L75,80 L100,60 M75,80 L80,100 M60,35 L65,0"
      stroke="currentColor"
      strokeWidth="1.0"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className="text-red-500/15"
    />
  </svg>
);

const DeathAnnouncement = ({ deadPlayers, deadDetails = {}, day, onClose }) => {
  const isPeacefulNight = deadPlayers.length === 1 && deadPlayers[0] === "TIDAK ADA";

  const hasGunshotDeath = !isPeacefulNight && deadPlayers.some(name => {
    const cause = deadDetails?.[name] || "general";
    return cause === "hakim" || cause === "hunter" || cause === "hunter_backfire";
  });

  useEffect(() => {
    lockScroll();
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => {
      unlockScroll();
      clearTimeout(timer);
    };
  }, [onClose]);

  if (!deadPlayers || deadPlayers.length === 0) return null;

  const gradientBg = isPeacefulNight
    ? 'linear-gradient(to bottom, rgba(2, 6, 23, 1) 0%, rgba(2, 6, 23, 0.7) 70%, rgba(6, 95, 70, 1) 100%)'
    : hasGunshotDeath
      ? 'linear-gradient(to bottom, rgba(2, 6, 23, 1) 0%, rgba(2, 6, 23, 0.7) 70%, rgba(220, 38, 38, 1) 100%)'
      : 'linear-gradient(to bottom, rgba(2, 6, 23, 1) 0%, rgba(2, 6, 23, 0.7) 70%, rgba(153, 27, 27, 1) 100%)';

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-6 sm:p-8 animate-in fade-in duration-700 overflow-y-auto custom-scrollbar text-center"
      style={{
        zIndex: Z_LAYER.PHASE_OVERLAY,
        background: gradientBg
      }}
    >
      <div className="max-w-md w-full my-auto flex flex-col justify-center gap-6 relative z-10 animate-in zoom-in duration-300">
        {hasGunshotDeath && <CrackedOverlay />}

        {/* Dekorasi Background Cahaya */}
        <div className="relative mb-4">
          <div className={`absolute inset-0 blur-2xl rounded-full scale-150 animate-pulse ${isPeacefulNight ? 'bg-emerald-600/20' : 'bg-red-600/20'}`} />
          {isPeacefulNight ? (
            <Sun size={72} className="text-emerald-400 mx-auto relative z-10 animate-bounce" />
          ) : hasGunshotDeath ? (
            <Crosshair size={72} className="text-red-500 mx-auto relative z-10 animate-bounce" />
          ) : (
            <Skull size={72} className="text-red-600 mx-auto relative z-10 animate-bounce" />
          )}
        </div>

        <div className="space-y-2 mb-8 relative z-10">
          <h2 className={`font-black uppercase tracking-[0.4em] text-[10px] ${isPeacefulNight ? 'text-emerald-400' : 'text-red-500'}`}>
            Laporan Forensik • Hari {day}
          </h2>
          <h1 className="text-white text-2xl font-black italic uppercase leading-none tracking-tighter">
            {isPeacefulNight ? 'Pagi telah tiba' : 'Seseorang Telah Gugur'}
          </h1>
        </div>

        <div className="space-y-3 relative z-10 max-h-48 overflow-y-auto custom-scrollbar pr-1 w-full">
          {isPeacefulNight ? (
            <div className="bg-emerald-600/10 border border-emerald-600/20 py-6 rounded-2xl animate-in zoom-in duration-1000">
              <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Semua Orang Selamat</p>
              <p className="text-slate-400 text-[9px] mt-1 italic uppercase font-bold">Tidak ada darah tertumpah malam ini</p>
            </div>
          ) : (
            deadPlayers.map((name, idx) => {
              const cause = deadDetails?.[name] || "general";
              let causeText = "Status: Tereliminasi";
              if (cause === "hakim") causeText = "☠️ DIHUKUM MATI OLEH HAKIM";
              if (cause === "hunter") causeText = "🎯 TEWAS DITEMBAK HUNTER";
              if (cause === "hunter_backfire") causeText = "💥 SALAH TEMBAK & GUGUR";

              const isShot = cause === "hakim" || cause === "hunter" || cause === "hunter_backfire";

              return (
                <div
                  key={idx}
                  className={`relative py-5 rounded-2xl animate-in slide-in-from-bottom-4 transition-all shadow-lg border overflow-hidden ${
                    isShot
                      ? 'bg-red-950/20 border-2 border-red-500 shadow-red-950/30'
                      : 'bg-red-600/10 border-red-600/20'
                  }`}
                >
                  {isShot && (
                    <span className="absolute -bottom-2 -right-2 text-6xl opacity-10 pointer-events-none rotate-12">
                      {cause === "hakim" ? "🔫" : cause === "hunter" ? "🎯" : "💥"}
                    </span>
                  )}
                  <span className="text-white font-black text-2xl tracking-tighter uppercase relative z-10">{name}</span>
                  <p className="text-red-400 text-[9px] font-black uppercase mt-1 tracking-[0.2em] relative z-10">{causeText}</p>
                </div>
              );
            })
          )}
        </div>

        <p className="text-slate-300 text-[10px] mt-8 leading-relaxed italic px-4 uppercase font-bold tracking-tight relative z-10">
          {isPeacefulNight
            ? '"Fajar menyingsing dengan kedamaian. Tapi waspadalah, serigala masih mengintai."'
            : '"Kegelapan malam menyisakan duka. Siapa yang akan kalian hukum pagi ini?"'}
        </p>

        {/* Tombol Aksi — langsung muncul */}
        <div className="mt-8 relative z-10 h-14 w-full">
          <button
            onClick={onClose}
            className={`w-full h-full rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all animate-in zoom-in duration-300 shadow-xl
              ${isPeacefulNight ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-white text-black hover:bg-slate-200'}`}
          >
            Mulai Diskusi
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeathAnnouncement;