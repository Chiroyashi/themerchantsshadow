import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from "firebase/database";
import { db } from "../lib/firebase";
import { Scroll, Gavel, Users, Sparkles, Sun, Quote } from 'lucide-react';

const IntroFable = ({ players, roomCode, onFinish, playerData }) => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);

  // Ambil data untuk narasi dinamis
  const hakim = players.find(p => p.role === 'Hakim');
  const counts = players.reduce((acc, p) => {
    if (p.role !== 'Moderator') acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => {
    const introRef = ref(db, `rooms/${roomCode}/introStartedAt`);
    
    const unsubscribe = onValue(introRef, (snapshot) => {
      const startTime = snapshot.val();
      
      // Jika intro sudah selesai (tidak ada startTime), langsung finish
      if (!startTime) {
        onFinish();
        return;
      }

      const totalDuration = 20; // Total durasi intro dalam detik

      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        
        // Update Progress Bar (0 - 100)
        const currentProgress = Math.min((elapsed / totalDuration) * 100, 100);
        setProgress(currentProgress);

        // Sinkronisasi Step berdasarkan waktu yang lewat
        if (elapsed < 6) setStep(1);        // 0-6 detik: Prologue
        else if (elapsed < 11) setStep(2);  // 6-11 detik: Reveal Hakim
        else if (elapsed < 16) setStep(3);  // 11-16 detik: Komposisi Role
        else if (elapsed < 21) setStep(4);  // 16-21 detik: Morning Reveal
        else {
          clearInterval(interval);
          update(ref(db, `rooms/${roomCode}/introFinished`), { 
            [playerData?.id || 'unknown']: true 
          });
          onFinish(); // Selesai otomatis
        }
      }, 50); // Cek setiap 50ms agar progress bar sangat smooth

      return () => clearInterval(interval);
    });

    return () => unsubscribe();
  }, [roomCode, onFinish, playerData?.id]);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex items-center justify-center p-6 text-center overflow-hidden font-sans">
      {/* Ambience Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-red-900/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="max-w-md w-full relative z-10">
        
        {/* STEP 1: PROLOGUE */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-1000">
            <Scroll className="w-16 h-16 text-amber-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Waranasura</h2>
            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed italic text-sm">
                "Disebuah kota bernama <span className="text-amber-500 font-bold">Waranasura</span>, ada <span className="text-blue-400 font-bold">{counts['Pedagang'] || 0} Pedagang</span> yang mempertaruhkan segalanya demi kepingan koin..."
              </p>
              <p className="text-slate-400 leading-relaxed italic text-xs opacity-80">
                Namun di balik hiruk pikuk pasar, bayangan gelap mulai bergerak mencari mangsa.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: REVEAL HAKIM */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="relative inline-block scale-125 mb-4">
              <Gavel className="w-20 h-20 text-amber-500" />
              <Sparkles className="absolute -top-2 -right-2 text-white animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter leading-none uppercase">
              "Keadilan Adalah <br/> Milik Mereka yang Berani!"
            </h1>
            
            <div className="bg-amber-500 p-1 rounded-[2rem] rotate-2 shadow-[0_20px_50px_rgba(245,158,11,0.3)]">
              <div className="bg-slate-900 rounded-[1.8rem] p-6 rotate-[-2deg]">
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-500 mb-1">Identitas Terbuka</p>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{hakim?.name || "ANONYMOUS"}</h3>
                <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-widest">The Grand Justice of Waranasura</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ROLE LIST CARD */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="flex flex-col items-center gap-1 mb-2">
              <Users size={24} className="text-blue-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Tatanan Penduduk</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(counts).map(([role, count]) => (
                <div key={role} className="bg-slate-900/60 border border-white/10 p-4 rounded-3xl flex flex-col items-center backdrop-blur-sm shadow-xl">
                  <span className="text-3xl font-black text-white leading-none">{count}</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{role}</span>
                </div>
              ))}
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