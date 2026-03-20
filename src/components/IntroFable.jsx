import React, { useState, useEffect } from 'react';
import { Scroll, Gavel, Users, Sparkles, Sun } from 'lucide-react';

const IntroFable = ({ players, onFinish }) => {
  const [step, setStep] = useState(1);
  
  // Ambil data untuk narasi
  const hakim = players.find(p => p.role === 'Hakim');
  const counts = players.reduce((acc, p) => {
    if (p.role !== 'Moderator') acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {});

  const nextStep = () => setStep(s => s + 1);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6 text-center font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full relative">
        {/* STEP 1: PROLOGUE */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-1000">
            <Scroll className="w-16 h-16 text-amber-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Waranasura</h2>
            <p className="text-slate-300 leading-relaxed italic text-sm">
              Disebuah kota bernama <span className="text-amber-500 font-bold">Waranasura</span>, ada <span className="text-blue-400 font-bold">{counts['Pedagang'] || 0} Pedagang</span> terkenal yang menjual barang maupun skill...
            </p>
            <p className="text-slate-400 leading-relaxed italic text-xs">
              Disuatu malam sebuah keajaiban sekaligus malapetaka datang, lalu lahirlah sang kebenaran yaitu seorang <span className="text-purple-400 font-bold">SEER</span>.
            </p>
            <button onClick={nextStep} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all">Lanjutkan Kisah</button>
          </div>
        )}

        {/* STEP 2: REVEAL HAKIM */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="relative inline-block">
              <Gavel className="w-20 h-20 text-amber-500 animate-bounce" />
              <Sparkles className="absolute -top-2 -right-2 text-white animate-pulse" />
            </div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter leading-none">
              "WAHAI RAKYAT AKULAH SANG HAKIM!"
            </h1>
            
            <div className="bg-amber-500 p-1 rounded-2xl rotate-2 shadow-[0_20px_50px_rgba(245,158,11,0.3)]">
              <div className="bg-slate-900 rounded-xl p-6 rotate-[-2deg]">
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-500 mb-1">Identitas Terbuka</p>
                <h3 className="text-2xl font-black text-white uppercase italic">{hakim?.name || "TIDAK ADA"}</h3>
                <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-widest">The Supreme Justice</p>
              </div>
            </div>

            <button onClick={nextStep} className="mt-4 px-8 py-3 bg-amber-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-lg active:scale-95 transition-all">Dengarkan Perintahnya</button>
          </div>
        )}

        {/* STEP 3: ROLE LIST CARD */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
              <Users size={20} />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Komposisi Kota</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(counts).map(([role, count]) => (
                <div key={role} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                  <span className="text-2xl font-black text-white">{count}</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{role}</span>
                </div>
              ))}
            </div>

            <div className="pt-8">
              <button onClick={nextStep} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.4em] text-xs shadow-xl active:scale-95 transition-all">Mulai Permainan</button>
            </div>
          </div>
        )}

        {/* STEP 4: MORNING ANNOUNCEMENT */}
        {step === 4 && (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-orange-500 rounded-full mx-auto flex items-center justify-center shadow-[0_0_60px_rgba(249,115,22,0.4)] animate-pulse">
              <Sun size={48} className="text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase italic">Pagi Telah Tiba!</h2>
              <p className="text-slate-400 text-sm italic">"Mentari menyinari rahasia di Waranasura..."</p>
            </div>
            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl">
               <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest leading-relaxed">
                 Pemain dapat melakukan pengakuan atau skip hari.
               </p>
            </div>
            <button onClick={onFinish} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]">Lanjutkan</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntroFable;