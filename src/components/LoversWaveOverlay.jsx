import React, { useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import { playLoversChimeSound } from '../utils/audio';

export default function LoversWaveOverlay({ partnerName, onFinish }) {
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    playLoversChimeSound();

    const timer = setTimeout(() => {
      if (finishRef.current) finishRef.current();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] flex flex-col items-center justify-center overflow-hidden">
      <style>{`
        @keyframes loversSweepDown {
          0% {
            transform: translateY(-25%);
            opacity: 0;
          }
          15% {
            opacity: 0.95;
          }
          85% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(125%);
            opacity: 0;
          }
        }
        .lovers-wave-first {
          animation: loversSweepDown 3.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .lovers-wave-second {
          animation: loversSweepDown 3.2s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards;
        }
      `}</style>

      {/* Romantic Pink Ambient Glow */}
      <div className="absolute inset-0 bg-pink-600/15 backdrop-blur-[2px] transition-opacity duration-1000 animate-in fade-in" />

      {/* Radial soft flare */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/25 rounded-full blur-3xl animate-pulse" />

      {/* Double U-Wave SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow-lovers-pink" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* First U-Wave */}
        <path
          d="M 0,0 Q 50,22 100,0"
          fill="none"
          stroke="#ec4899"
          strokeWidth="7"
          vectorEffect="non-scaling-stroke"
          filter="url(#glow-lovers-pink)"
          className="lovers-wave-first"
        />

        {/* Second U-Wave (Gelombang Ganda) */}
        <path
          d="M 0,0 Q 50,22 100,0"
          fill="none"
          stroke="#f472b6"
          strokeWidth="7"
          vectorEffect="non-scaling-stroke"
          filter="url(#glow-lovers-pink)"
          className="lovers-wave-second"
        />
      </svg>

      {/* Center Notice Toast */}
      <div className="relative z-10 animate-in zoom-in slide-in-from-top-6 duration-700 max-w-sm mx-4 text-center">
        <div className="p-1 rounded-[2.2rem] bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 shadow-[0_0_50px_rgba(236,72,153,0.6)]">
          <div className="bg-slate-950/95 backdrop-blur-md rounded-[2.1rem] px-6 py-5 border border-pink-500/30 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-pink-950/60 border border-pink-500/40 flex items-center justify-center shadow-lg shadow-pink-950/50">
              <Heart size={28} className="text-pink-400 fill-pink-500/30 animate-bounce" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.35em] text-pink-400">
                Ikatan Takdir Terbentuk
              </span>
              <h3 className="text-xl font-black text-white italic tracking-tight">
                JIWA KALIAN TERIKAT
              </h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Kamu kini resmi berpasangan dengan{' '}
                <span className="text-pink-400 font-bold uppercase">{partnerName || 'Pasanganmu'}</span>.
              </p>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-pink-500/80 bg-pink-950/50 px-3 py-1 rounded-full border border-pink-500/20">
              Satu jiwa • Hidup & Mati bersama
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
