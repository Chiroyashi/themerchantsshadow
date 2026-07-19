import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, update } from "firebase/database";
import { db } from "../lib/firebase";
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import { Scroll, Gavel, Users, Sparkles, Sun, Wallet, Eye, Shield, Crosshair, Wand2, Ghost, SkipForward } from 'lucide-react';

const roleIcons = {
  Pedagang: { icon: Wallet, color: "text-emerald-400" },
  Werewolf: { icon: Ghost, color: "text-red-500" },
  Seer: { icon: Eye, color: "text-purple-400" },
  Guard: { icon: Shield, color: "text-blue-400" },
  Hakim: { icon: Gavel, color: "text-amber-500" },
  Hunter: { icon: Crosshair, color: "text-orange-500" },
  Warlock: { icon: Wand2, color: "text-purple-600" }
};

const IntroFable = ({ players, roomCode, onFinish, playerData }) => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  // Ambil data untuk narasi dinamis
  const hakim = players.find(p => p.role === 'Hakim');
  const counts = players.reduce((acc, p) => {
    if (p.role !== 'Moderator') acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => { lockScroll(); return () => unlockScroll(); }, []);

  // Local timer — jalan tanpa Firebase sync
  // Catatan: sengaja kosongin dependency array — pakai ref biar gak restart
  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 20;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const currentProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(currentProgress);

      if (elapsed < 6) setStep(1);
      else if (elapsed < 11) setStep(2);
      else if (elapsed < 16) setStep(3);
      else if (elapsed < 21) setStep(4);
      else if (!finishedRef.current) {
        finishedRef.current = true;
        clearInterval(interval);
        // Catat ke Firebase bahwa player ini sudah lihat intro
        update(ref(db, `rooms/${roomCode}/introFinished`), {
          [playerData?.id || 'unknown']: true
        }).catch(() => {});
        onFinishRef.current();
      }
    }, 100);

    // Fallback: jika 30 detik tidak selesai, paksa selesai
    const fallback = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        clearInterval(interval);
        onFinishRef.current();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(fallback);
    };
  }, [roomCode, playerData?.id]); // sengaja tanpa onFinish — pakai ref

  const handleSkip = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinishRef.current();
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 md:p-6 text-center overflow-hidden font-sans" style={{ zIndex: Z_LAYER.INTRO_FABLE }}>
      {/* Ambience Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-red-900/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="max-w-md w-full relative z-10">
        
        {/* STEP 1: PROLOGUE */}
        {step === 1 && (
          <div className="space-y-4 md:space-y-6 animate-in fade-in zoom-in duration-1000">
            <Scroll className="w-12 h-12 md:w-16 md:h-16 text-amber-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase">Waranasura</h2>
            <div className="space-y-3 md:space-y-4">
              <p className="text-slate-300 leading-relaxed italic text-xs md:text-sm">
                "Disebuah kota bernama <span className="text-amber-500 font-bold">Waranasura</span>, ada <span className="text-blue-400 font-bold">{counts['Pedagang'] || 0} Pedagang</span> yang mempertaruhkan segalanya demi kepingan koin..."
              </p>
              <p className="text-slate-400 leading-relaxed italic text-[10px] md:text-xs opacity-80">
                Namun di balik hiruk pikuk pasar, bayangan gelap mulai bergerak mencari mangsa.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: REVEAL HAKIM */}
        {step === 2 && (
          <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="relative inline-block scale-110 md:scale-125 mb-4">
              <Gavel className="w-16 h-16 md:w-20 md:h-20 text-amber-500" />
              <Sparkles className="absolute -top-1 md:-top-2 -right-1 md:-right-2 text-white animate-pulse" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white italic tracking-tighter leading-none uppercase">
              "Keadilan Adalah <br/> Milik Mereka yang Berani!"
            </h1>
            
            <div className="bg-amber-500 p-1 rounded-[2rem] rotate-2 shadow-[0_20px_50px_rgba(245,158,11,0.3)]">
              <div className="bg-slate-900 rounded-[1.8rem] p-4 md:p-6 rotate-[-2deg]">
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[.2em] text-amber-500 mb-1">Identitas Terbuka</p>
                <span className="inline-block text-3xl md:text-4xl font-black text-amber-400 uppercase italic tracking-tight bg-amber-500/10 px-3 md:px-4 py-1 md:py-2 rounded-xl">Hakim</span>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight mt-2 md:mt-3">{hakim?.name || "ANONYMOUS"}</h3>
                <p className="text-slate-500 text-[8px] md:text-[10px] mt-1 md:mt-2 font-bold uppercase tracking-widest">The Grand Justice of Waranasura</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ROLE LIST CARD */}
        {step === 3 && (
          <div className="space-y-4 md:space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="flex flex-col items-center gap-1 mb-2">
              <Users size={20} md:size={24} className="text-blue-500" />
              <h2 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Tatanan Penduduk</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {Object.entries(counts).map(([role, count]) => {
                const roleData = roleIcons[role] || { icon: Users, color: "text-slate-400" };
                const Icon = roleData.icon;
                return (
                  <div key={role} className="p-3 md:p-4 rounded-2xl flex flex-col items-center group hover:scale-105 transition-transform">
                    <Icon size={32} md:size={36} className={`mb-1 transition-colors ${roleData.color}`} />
                    <span className="text-2xl md:text-3xl font-black text-white leading-none">{count}</span>
                    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mt-1 ${roleData.color}`}>{role}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: MORNING ANNOUNCEMENT */}
        {step === 4 && (
          <div className="space-y-8 animate-in zoom-in duration-1000">
            <div className="relative">
               <div className="absolute inset-0 bg-orange-500/20 blur-[60px] animate-pulse" />
               <div className="w-24 h-24 bg-gradient-to-tr from-orange-600 to-yellow-400 rounded-full mx-auto flex items-center justify-center shadow-2xl relative border-4 border-white/20">
                 <Sun size={48} className="text-white animate-spin-slow" />
               </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Fajar Menyingsing</h2>
              <p className="text-slate-400 text-sm italic px-6 leading-relaxed">
                "Rahasia malam mulai terbongkar. Siapa yang akan bertahan, dan siapa yang akan menjadi tumbal?"
              </p>
            </div>
            <div className="inline-block px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full">
               <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Permainan Segera Dimulai...</p>
            </div>
          </div>
        )}
      </div>

      {/* Skip Button */}
      <div className="absolute bottom-8 left-0 w-full flex justify-center z-20">
        <button
          onClick={handleSkip}
          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 transition-all active:scale-95"
        >
          Skip Intro
        </button>
      </div>

      {/* Cinematic Progress Bar (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-900 flex">
        <div 
          className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      {/* Step Indicator (Top) */}
      <div className="absolute top-10 left-0 w-full flex justify-center gap-1.5">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
        ))}
      </div>
    </div>
  );
};

export default IntroFable;