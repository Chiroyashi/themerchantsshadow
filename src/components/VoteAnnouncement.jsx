import React, { useEffect } from 'react';
import { ShieldCheck, User } from 'lucide-react';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const GallowsOverlay = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 animate-pulse duration-[3000ms]" viewBox="0 0 100 100" preserveAspectRatio="none">
    {/* Gallows frame (rustic wood) */}
    <path
      d="M75,10 L75,90 M75,10 L35,10 L35,25 M75,25 L60,10"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className="text-red-500/20"
    />
    {/* Rope / Noose */}
    <path
      d="M35,25 L35,38 M35,38 C32,38 30,41 30,46 C30,52 35,55 35,55 C35,55 40,52 40,46 C40,41 38,38 35,38 Z"
      stroke="currentColor"
      strokeWidth="1.0"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className="text-red-500/30"
    />
    {/* Coils of the noose */}
    <path
      d="M33,38 L37,38 M32,40 L38,40 M32,42 L38,42 M33,44 L37,44"
      stroke="currentColor"
      strokeWidth="0.8"
      className="text-red-500/40"
    />
  </svg>
);

const HangedCharacter = ({ name }) => (
  <div className="flex flex-col items-center justify-center relative w-full pt-4 pb-2 z-10">
    {/* Wooden Beam / Gallows Top */}
    <div className="w-20 h-2.5 bg-amber-950 border border-amber-900 rounded-md shadow-md z-20 relative" />

    {/* Swinging Container - pivots from the top wood */}
    <div className="flex flex-col items-center origin-top animate-swing z-10" style={{ transformOrigin: 'top center' }}>
      {/* Hanging Rope */}
      <div className="w-1 h-14 bg-amber-700/80 shadow-[0_0_4px_rgba(180,83,9,0.3)] relative">
        {/* Noose knot */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-4 bg-amber-800 border border-amber-900 rounded-sm" />
      </div>

      {/* Circular Gallows Seat containing User icon */}
      <div className="w-16 h-16 rounded-full bg-red-950/90 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center relative z-10 animate-bounce-slow mt-[-2px]">
        <User size={36} className="text-red-500 animate-pulse" />
      </div>

      {/* Executed Player's Name - placed outside/under the circle but swinging with it */}
      <div className="mt-3 bg-red-950/40 border border-red-500/20 px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
        <span className="text-white font-black text-sm tracking-tight uppercase whitespace-nowrap">{name}</span>
      </div>
    </div>
  </div>
);

const VoteAnnouncement = ({ names, day, onClose }) => {
  const isPeaceful = names?.length === 1 && names[0] === "TIDAK ADA";

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

  if (!names || names.length === 0) return null;

  const borderColor = isPeaceful
    ? 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)]'
    : 'border-red-600 shadow-[0_0_60px_rgba(220,38,38,0.45)]';
  const glowBg = isPeaceful ? 'bg-emerald-600' : 'bg-red-700';
  const accentText = isPeaceful ? 'text-emerald-400' : 'text-red-500';
  const buttonStyle = isPeaceful
    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
    : 'bg-white text-black hover:bg-slate-200';

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-700" style={{ zIndex: Z_LAYER.PHASE_OVERLAY }}>
      <div className={`max-w-sm w-full bg-slate-900 border-2 rounded-[2.5rem] p-6 sm:p-8 text-center relative overflow-hidden transition-all duration-1000 max-h-[95vh] overflow-y-auto custom-scrollbar ${borderColor}`}>
        <style>{`
          @keyframes hang-swing {
            0% { transform: rotate(-8deg); }
            50% { transform: rotate(8deg); }
            100% { transform: rotate(-8deg); }
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(4px); }
          }
          .animate-swing {
            animation: hang-swing 3s ease-in-out infinite;
          }
          .animate-bounce-slow {
            animation: bounce-slow 1.5s ease-in-out infinite;
          }
        `}</style>

        {!isPeaceful && <GallowsOverlay />}

        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl ${glowBg}/10`} />
        <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl ${glowBg}/5`} />

        <div className="relative mb-6">
          <div className={`absolute inset-0 blur-2xl rounded-full scale-150 animate-pulse ${glowBg}/20`} />
          {isPeaceful ? (
            <ShieldCheck size={72} className="text-slate-500 mx-auto relative z-10 animate-bounce" />
          ) : (
            <HangedCharacter name={names[0]} />
          )}
        </div>

        <div className="space-y-2 mb-8 relative z-10">
          <h2 className={`font-black uppercase tracking-[0.4em] text-[10px] ${accentText}`}>
            Laporan Forensik • Hari {day}
          </h2>
          <h1 className="text-white text-2xl font-black italic uppercase leading-none tracking-tighter">
            {isPeaceful ? 'Tidak Ada Hukuman' : 'Dihukum Gantung'}
          </h1>
        </div>

        <div className="space-y-3 relative z-10">
          {isPeaceful ? (
            <div className="bg-slate-800/40 border border-slate-700/30 py-6 rounded-2xl">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Suara tidak mencapai threshold</p>
            </div>
          ) : (
            <div className="bg-red-950/20 border border-red-500/20 py-2.5 rounded-2xl">
              <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.2em]">Status: Tereliminasi</p>
1            </div>
          )}
        </div>

        <p className="text-slate-500 text-[10px] mt-8 leading-relaxed italic px-4 uppercase font-bold tracking-tight relative z-10">
          {isPeaceful
            ? '"Keadilan membutuhkan bukti. Tidak ada yang dihukum hari ini."'
            : '"Keputusan telah diambil. Semoga Waranasura beristirahat dalam damai."'}
        </p>

        <div className="mt-8 relative z-10 h-14">
          <button
            onClick={onClose}
            className={`w-full h-full rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all animate-in zoom-in duration-300 shadow-xl ${buttonStyle}`}
          >
            Lanjut ke Malam
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteAnnouncement;
