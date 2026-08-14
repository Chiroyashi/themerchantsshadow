import React, { useEffect } from 'react';
import { User, Crosshair, Skull, Gavel, ShieldAlert } from 'lucide-react';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

export default function PersonalDeathAnimation({ cause, playerName, onFinish }) {
  useEffect(() => {
    let soundFile = '';
    if (cause === 'hunter' || cause === 'hunter_backfire') {
      soundFile = 'shotgun.mp3';
    } else if (cause === 'werewolf') {
      soundFile = 'werewolf.mp3';
    } else if (cause === 'hakim') {
      soundFile = 'hakim.mp3';
    }

    if (soundFile) {
      const audio = new Audio(`${import.meta.env.BASE_URL}assets/${soundFile}`);
      audio.volume = 0.45;
      audio.play().catch(() => {});
    }
  }, [cause]);

  useEffect(() => {
    lockScroll();
    const timer = setTimeout(() => {
      onFinish();
    }, 3800); // Animation duration is 3.8s
    return () => {
      unlockScroll();
      clearTimeout(timer);
    };
  }, [onFinish]);

  const renderAnimationContent = () => {
    switch (cause) {
      case 'hunter':
      case 'hunter_backfire':
        return (
          <div className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-center h-screen px-4 overflow-hidden">
            {/* White Flash overlay */}
            <div className="absolute inset-0 bg-white opacity-0 animate-white-flash pointer-events-none z-50" />

            {/* Split Screen Avatars */}
            <div className="flex justify-between items-center w-full gap-8 relative z-10 mb-10">
              {/* Hunter Card (Left) */}
              <div className="flex flex-col items-center gap-3 bg-slate-900 border border-red-500/25 p-4 rounded-3xl w-[40%] animate-hunter-recoil shadow-neon-red">
                <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-500 flex items-center justify-center">
                  <Crosshair size={28} className="text-red-500 animate-pulse" />
                </div>
                <span className="text-[9px] text-red-500 font-black uppercase tracking-widest">Hunter</span>
              </div>

              {/* Aiming Crosshair Overlay */}
              <div className="absolute top-1/2 left-[70%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-crosshair-scale opacity-0">
                <div className="w-20 h-20 rounded-full border-4 border-dashed border-red-500 flex items-center justify-center animate-spin-slow">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-ping" />
                </div>
              </div>

              {/* VS Path */}
              <div className="text-slate-700 font-black text-xl italic uppercase tracking-widest select-none">VS</div>

              {/* Victim Card (Right) */}
              <div className="flex flex-col items-center gap-3 bg-slate-900 border border-white/5 p-4 rounded-3xl w-[40%] animate-victim-damage shadow-2xl relative">
                <div className="w-14 h-14 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-center">
                  <User size={28} className="text-blue-400" />
                </div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-full">{playerName}</span>
              </div>
            </div>

            {/* Bottom text */}
            <div className="text-center relative z-10 mt-4 animate-text-reveal opacity-0">
              <h2 className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mb-1.5">Tembakan Terakhir</h2>
              <h1 className="text-red-500 text-3xl font-black italic uppercase tracking-tighter drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                TERTEMBAK HUNTER
              </h1>
            </div>
          </div>
        );

      case 'werewolf':
        return (
          <div className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-center h-screen px-4 overflow-hidden bg-black/85">
            {/* Screen red slash flash */}
            <div className="absolute inset-0 bg-red-950/40 opacity-0 animate-red-flash pointer-events-none z-50" />

            {/* Claw Marks SVG Layer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <svg className="w-72 h-72 text-red-600/90 drop-shadow-[0_0_20px_#ff0000]" viewBox="0 0 100 100">
                {/* Claw 1 */}
                <path d="M20,10 L80,90" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="120" strokeDashoffset="120" className="animate-claw-line-1" />
                {/* Claw 2 */}
                <path d="M10,25 L70,105" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="120" strokeDashoffset="120" className="animate-claw-line-2" />
                {/* Claw 3 */}
                <path d="M30,-5 L90,75" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="120" strokeDashoffset="120" className="animate-claw-line-3" />
              </svg>
            </div>

            {/* Splitting Victim Card */}
            <div className="relative w-48 h-64 mb-10 z-10">
              {/* Card wrapper */}
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-victim-split">
                {/* Top Half */}
                <div className="w-full h-1/2 bg-slate-900 border-x border-t border-white/5 rounded-t-3xl flex flex-col items-center justify-end pb-2 overflow-hidden origin-bottom animate-split-top">
                  <div className="w-14 h-14 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-center translate-y-6">
                    <User size={28} className="text-blue-400" />
                  </div>
                </div>
                {/* Bottom Half */}
                <div className="w-full h-1/2 bg-slate-900 border-x border-b border-white/5 rounded-b-3xl flex flex-col items-center justify-start pt-2 overflow-hidden origin-top animate-split-bottom">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-4 truncate max-w-[80%]">{playerName}</span>
                </div>
              </div>
            </div>

            {/* Bottom text */}
            <div className="text-center relative z-10 animate-text-reveal opacity-0">
              <h2 className="text-red-500/80 text-[9px] font-black uppercase tracking-[0.3em] mb-1.5 animate-pulse">Cakaran Buas</h2>
              <h1 className="text-red-600 text-3xl font-black italic uppercase tracking-tighter drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]">
                DICAKAR WEREWOLF
              </h1>
            </div>
          </div>
        );

      case 'poison':
        return (
          <div className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-center h-screen px-4 overflow-hidden bg-slate-950/90">
            {/* Poison Bubbles Container */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
              {Array.from({ length: 15 }).map((_, i) => {
                const size = Math.random() * 8 + 6;
                const delay = Math.random() * 1.5;
                const left = Math.random() * 60 + 20;
                return (
                  <div
                    key={i}
                    className="absolute bottom-1/4 rounded-full bg-gradient-to-tr from-emerald-500/40 to-purple-600/40 border border-emerald-400/20 animate-bubble-float opacity-0"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      left: `${left}%`,
                      animationDelay: `${delay}s`,
                      animationDuration: '2.5s'
                    }}
                  />
                );
              })}
            </div>

            {/* Poisoning Victim Card */}
            <div className="flex flex-col items-center justify-center bg-slate-900 border-2 border-emerald-500/20 p-8 rounded-[2rem] w-48 h-64 mb-10 shadow-2xl relative z-10 animate-warlock-poison">
              <div className="w-16 h-16 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center mb-4">
                <User size={32} className="text-emerald-400" />
              </div>
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider mb-1">Target</span>
              <span className="text-sm text-slate-300 font-bold uppercase truncate max-w-full">{playerName}</span>
            </div>

            {/* Bottom text */}
            <div className="text-center relative z-10 animate-text-reveal opacity-0">
              <h2 className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.3em] mb-1.5">Kutukan Gelap</h2>
              <h1 className="text-emerald-400 text-3xl font-black italic uppercase tracking-tighter drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">
                TERACUNI WARLOCK
              </h1>
            </div>
          </div>
        );

      case 'hakim':
        return (
          <div className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-center h-screen px-4 overflow-hidden">
            {/* Impact Flash */}
            <div className="absolute inset-0 bg-red-600/10 opacity-0 animate-impact-flash pointer-events-none z-40" />

            {/* Slamming Gavel Element */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-gavel-slam origin-bottom-right">
              <Gavel size={80} className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            </div>

            {/* Guilty Stamped Card */}
            <div className="flex flex-col items-center justify-center bg-slate-900 border border-white/5 p-6 rounded-[2rem] w-48 h-64 mb-10 shadow-2xl relative z-10 animate-gavel-impact">
              <div className="w-14 h-14 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-center mb-4">
                <User size={28} className="text-blue-400" />
              </div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-full mb-2">{playerName}</span>

              {/* Guilty Stamp overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 border-4 border-red-600 text-red-500 px-4 py-2 font-black text-xl tracking-wider uppercase rotate-[-15deg] bg-slate-950/90 rounded-xl shadow-2xl pointer-events-none scale-0 opacity-0 animate-stamp-slam shadow-red-900/40">
                GUILTY
              </div>
            </div>

            {/* Bottom text */}
            <div className="text-center relative z-10 animate-text-reveal opacity-0">
              <h2 className="text-amber-500 text-[9px] font-black uppercase tracking-[0.3em] mb-1.5">Vonis Mati</h2>
              <h1 className="text-red-500 text-3xl font-black italic uppercase tracking-tighter drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                EKSEKUSI HAKIM
              </h1>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 pointer-events-auto"
      style={{ zIndex: Z_LAYER.PHASE_OVERLAY }}
    >
      <style>{`
        /* =======================================================
           COMMON ANIMATIONS
           ======================================================= */
        @keyframes textReveal {
          0% { transform: translateY(15px); opacity: 0; }
          40% { transform: translateY(15px); opacity: 0; }
          60% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-text-reveal {
          animation: textReveal 1.8s ease-out forwards;
        }

        /* =======================================================
           1. HUNTER ANIMATIONS
           ======================================================= */
        @keyframes whiteFlash {
          0% { opacity: 0; }
          15% { opacity: 0; }
          16% { opacity: 1; }
          22% { opacity: 1; }
          40% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes crosshairScale {
          0% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
          10% { transform: translate(-50%, -50%) scale(2.5); opacity: 1; }
          15% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          16% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        @keyframes hunterRecoil {
          0%, 15% { transform: translateX(0); }
          16% { transform: translateX(-24px) rotate(-3deg); }
          28% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
        @keyframes victimDamage {
          0%, 15% { transform: scale(1) rotate(0deg); filter: grayscale(0%); }
          16% { transform: scale(0.9) rotate(8deg); filter: grayscale(0%) brightness(1.5); }
          17% { transform: scale(1.05) translate(8px, -4px) rotate(-10deg); }
          18% { transform: scale(1) translate(-8px, 4px) rotate(12deg); }
          19% { transform: translate(4px, -2px) rotate(-8deg); }
          20% { transform: translate(-4px, 2px) rotate(6deg); }
          22% { transform: translate(0, 0) rotate(15deg); filter: grayscale(100%) brightness(0.4); }
          100% { transform: translate(0, 0) rotate(15deg); filter: grayscale(100%) brightness(0.4); }
        }
        .animate-white-flash {
          animation: whiteFlash 3.5s ease-out forwards;
        }
        .animate-crosshair-scale {
          animation: crosshairScale 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-hunter-recoil {
          animation: hunterRecoil 3.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .animate-victim-damage {
          animation: victimDamage 3.5s ease-out forwards;
        }

        /* =======================================================
           2. WEREWOLF ANIMATIONS
           ======================================================= */
        @keyframes redFlash {
          0%, 18% { opacity: 0; }
          19% { opacity: 1; }
          30% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes clawLine {
          0%, 8% { stroke-dashoffset: 120; }
          16% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes victimSplit {
          0%, 18% { transform: rotate(0deg); }
          19% { transform: scale(0.95); }
          22% { transform: scale(1.05) rotate(-3deg); }
          24% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        @keyframes splitTop {
          0%, 18% { transform: translate(0, 0) rotate(0deg); filter: grayscale(0%); }
          19% { transform: translate(-12px, -18px) rotate(-10deg); filter: grayscale(100%) brightness(0.3); }
          100% { transform: translate(-12px, -18px) rotate(-10deg); filter: grayscale(100%) brightness(0.3); }
        }
        @keyframes splitBottom {
          0%, 18% { transform: translate(0, 0) rotate(0deg); filter: grayscale(0%); }
          19% { transform: translate(12px, 18px) rotate(8deg); filter: grayscale(100%) brightness(0.3); }
          100% { transform: translate(12px, 18px) rotate(8deg); filter: grayscale(100%) brightness(0.3); }
        }
        .animate-red-flash {
          animation: redFlash 3.5s ease-out forwards;
        }
        .animate-claw-line-1 {
          animation: clawLine 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.1s;
        }
        .animate-claw-line-2 {
          animation: clawLine 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.2s;
        }
        .animate-claw-line-3 {
          animation: clawLine 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.3s;
        }
        .animate-victim-split {
          animation: victimSplit 3.5s ease-out forwards;
        }
        .animate-split-top {
          animation: splitTop 3.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .animate-split-bottom {
          animation: splitBottom 3.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        /* =======================================================
           3. WARLOCK ANIMATIONS
           ======================================================= */
        @keyframes bubbleFloat {
          0% { transform: translateY(0) scale(0.3); opacity: 0; }
          10% { opacity: 0.8; }
          85% { opacity: 0.8; }
          100% { transform: translateY(-160px) scale(1.2); opacity: 0; }
        }
        @keyframes poisonPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.1), 0 0 5px rgba(139, 92, 246, 0.05); }
          50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.5), 0 0 15px rgba(139, 92, 246, 0.3); }
        }
        @keyframes poisonEffect {
          0% { filter: hue-rotate(0deg) contrast(100%) blur(0px); opacity: 1; }
          30% { filter: hue-rotate(30deg) contrast(110%) blur(0px); opacity: 1; }
          50% { filter: hue-rotate(90deg) contrast(150%) blur(2px); opacity: 0.8; }
          85% { filter: hue-rotate(120deg) contrast(180%) blur(6px); opacity: 0.4; }
          100% { filter: hue-rotate(120deg) contrast(180%) blur(8px); opacity: 0.25; }
        }
        .animate-bubble-float {
          animation-name: bubbleFloat;
          animation-iteration-count: infinite;
          animation-timing-function: ease-out;
        }
        .animate-warlock-poison {
          animation: poisonPulse 2s ease-in-out infinite, poisonEffect 3.8s ease-out forwards;
        }

        /* =======================================================
           4. HAKIM ANIMATIONS
           ======================================================= */
        @keyframes impactFlash {
          0%, 13% { opacity: 0; }
          14% { opacity: 1; }
          22% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes gavelSlam {
          0% { transform: translate(-50%, -50%) rotate(-45deg) scale(1.5); opacity: 0; }
          8% { transform: translate(-50%, -50%) rotate(-45deg) scale(1.5); opacity: 1; }
          13% { transform: translate(-50%, -50%) rotate(-45deg) scale(1.2); opacity: 1; }
          14% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 1; }
          35% { opacity: 1; }
          45% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0; }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0; }
        }
        @keyframes gavelImpact {
          0%, 13% { transform: scale(1) rotate(0deg); }
          14% { transform: scale(0.94) rotate(-3deg); }
          15% { transform: scale(1.05) translate(4px, 4px) rotate(6deg); }
          16% { transform: scale(0.98) translate(-4px, -2px) rotate(-4deg); }
          18% { transform: scale(1) translate(0, 0) rotate(0deg); }
          100% { transform: scale(1) translate(0, 0) rotate(0deg); }
        }
        @keyframes stampSlam {
          0%, 19% { transform: translate(-50%, -50%) scale(2.5) rotate(-15deg); opacity: 0; }
          20% { transform: translate(-50%, -50%) scale(1.0) rotate(-15deg); opacity: 1; }
          22% { transform: translate(-50%, -50%) scale(1.1) rotate(-15deg); }
          24% { transform: translate(-50%, -50%) scale(1.0) rotate(-15deg); }
          100% { transform: translate(-50%, -50%) scale(1.0) rotate(-15deg); opacity: 1; }
        }
        .animate-impact-flash {
          animation: impactFlash 3.5s ease-out forwards;
        }
        .animate-gavel-slam {
          animation: gavelSlam 3.5s cubic-bezier(0.3, 0, 0.2, 1) forwards;
        }
        .animate-gavel-impact {
          animation: gavelImpact 3.5s ease-out forwards;
        }
        .animate-stamp-slam {
          animation: stampSlam 3.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      {renderAnimationContent()}
    </div>
  );
}
