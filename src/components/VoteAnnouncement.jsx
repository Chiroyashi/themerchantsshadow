import React, { useEffect, useRef } from 'react';
import { ShieldCheck, User } from 'lucide-react';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import { playGallowsExecutionSound } from '../utils/audio';

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
  <div className="flex flex-col items-center justify-center relative w-full pt-4 pb-2 z-10 h-72">
    {/* Wooden Beam / Gallows Top */}
    <div className="w-24 h-2.5 bg-amber-950 border border-amber-900 rounded-md shadow-md z-20 relative" />

    {/* Drop & Swing Container */}
    <div className="flex flex-col items-center origin-top animate-drop-swing z-10" style={{ transformOrigin: 'top center' }}>
      {/* Hanging Rope */}
      <div className="w-1 h-16 bg-amber-700/80 shadow-[0_0_4px_rgba(180,83,9,0.3)] relative">
        {/* Noose knot */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-4 bg-amber-800 border border-amber-900 rounded-sm" />
      </div>

      {/* Circular Gallows Seat containing User icon */}
      <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center relative z-10 mt-[-2px] animate-hanged-avatar">
        <User size={36} className="text-red-500" />
      </div>

      {/* Executed Player's Name */}
      <div className="mt-3 bg-red-950/40 border border-red-500/20 px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
        <span className="text-white font-black text-sm tracking-tight uppercase whitespace-nowrap">{name}</span>
      </div>
    </div>
  </div>
);

const VoteAnnouncement = ({ names, day, onClose }) => {
  const isPeaceful = names?.length === 1 && names[0] === "TIDAK ADA";
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isPeaceful) {
      playGallowsExecutionSound();
    }
  }, [isPeaceful]);

  useEffect(() => {
    lockScroll();
    const timer = setTimeout(() => {
      closeRef.current();
    }, 3800); // Set duration matching animation duration (3.8s)
    return () => {
      unlockScroll();
      clearTimeout(timer);
    };
  }, []);

  if (!names || names.length === 0) return null;

  const glowBg = isPeaceful ? 'bg-emerald-600' : 'bg-red-700';
  const accentText = isPeaceful ? 'text-emerald-400' : 'text-red-500';

  const gradientBg = isPeaceful
    ? 'linear-gradient(to bottom, rgba(2, 6, 23, 1) 0%, rgba(2, 6, 23, 0.7) 70%, rgba(6, 95, 70, 1) 100%)'
    : 'linear-gradient(to bottom, rgba(2, 6, 23, 1) 0%, rgba(2, 6, 23, 0.7) 70%, rgba(153, 27, 27, 1) 100%)';

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-6 sm:p-8 animate-in fade-in duration-700 overflow-y-auto custom-scrollbar text-center"
      style={{
        zIndex: Z_LAYER.PHASE_OVERLAY,
        background: gradientBg
      }}
    >
      <div className="max-w-md w-full my-auto flex flex-col justify-center gap-6 relative z-10">
        <style>{`
          @keyframes hangDropSwing {
            0% { transform: translateY(-60px) rotate(0deg); }
            4% { transform: translateY(0px) rotate(0deg); }
            12% { transform: translateY(0px) rotate(10deg); }
            24% { transform: translateY(0px) rotate(-10deg); }
            38% { transform: translateY(0px) rotate(7deg); }
            52% { transform: translateY(0px) rotate(-7deg); }
            68% { transform: translateY(0px) rotate(4deg); }
            84% { transform: translateY(0px) rotate(-4deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          @keyframes hangedAvatarDim {
            0% { filter: brightness(1) grayscale(0%); }
            4% { filter: brightness(1) grayscale(0%); }
            75% { filter: brightness(0.55) grayscale(40%); }
            100% { filter: brightness(0.08) grayscale(100%) contrast(150%); }
          }
          .animate-drop-swing {
            animation: hangDropSwing 3.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          }
          .animate-hanged-avatar {
            animation: hangedAvatarDim 3.8s ease-out forwards;
          }
        `}</style>

        {!isPeaceful && <GallowsOverlay />}

        <div className="relative mb-4">
          <div className={`absolute inset-0 blur-2xl rounded-full scale-150 animate-pulse ${glowBg}/20`} />
          {isPeaceful ? (
            <ShieldCheck size={72} className="text-slate-500 mx-auto relative z-10 animate-bounce" />
          ) : (
            <HangedCharacter name={names[0]} />
          )}
        </div>

        <div className="space-y-2 relative z-10">
          <h2 className={`font-black uppercase tracking-[0.4em] text-[10px] ${accentText}`}>
            Laporan Forensik • Hari {day}
          </h2>
          <h1 className="text-white text-2xl font-black italic uppercase leading-none tracking-tighter">
            {isPeaceful ? 'Tidak Ada Hukuman' : 'DIGANTUNG OLEH WARGA'}
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
            </div>
          )}
        </div>

        <p className="text-slate-300 text-[10px] leading-relaxed italic px-4 uppercase font-bold tracking-tight relative z-10">
          {isPeaceful
            ? '"Keadilan membutuhkan bukti. Tidak ada yang dihukum hari ini."'
            : '"Keputusan telah diambil. Semoga Waranasura beristirahat dalam damai."'}
        </p>
      </div>
    </div>
  );
};

export default VoteAnnouncement;
