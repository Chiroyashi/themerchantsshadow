import React from 'react';
import { Shield, Sword, Navigation, ChevronRight, Award } from 'lucide-react';

const LandingPage = ({ onNext, onCredits }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-900 overflow-hidden">
      {/* Hero Section */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-6">
        
        {/* Dekorasi Background - Efek Cahaya V4 Style */}
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-5%] w-96 h-96 bg-blue-600/5 blur-[150px] rounded-full pointer-events-none" />

        <div className="z-10 text-center space-y-8 max-w-3xl">
          {/* Badge Versi */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
              Waranasura Chronicles • Ver 0.0
            </span>
          </div>

          {/* Judul Utama */}
          <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-slate-500 font-black tracking-[0.3em] sm:tracking-[0.4em] uppercase text-[10px] sm:text-xs italic">
              Social Deduction Game
            </h2>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-none">
              THE MERCHANT'S <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400 drop-shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                SHADOW
              </span>
            </h1>
          </div>

          <p className="text-slate-400 text-sm sm:text-lg md:text-xl max-w-xl mx-auto font-light leading-relaxed italic border-x border-white/5 px-4 sm:px-8 animate-in fade-in duration-1000">
            Sembunyi di balik transaksi, lacak jejak melalui arah angin, dan temukan siapa pengkhianat di kota kuno ini.
          </p>

          {/* Tombol Utama */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 animate-in slide-in-from-bottom-8 duration-1000">
            <button
              onClick={onNext}
              className="group relative w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-red-700 hover:bg-red-600 transition-all duration-300 rounded-sm overflow-hidden shadow-xl shadow-red-900/20 active:scale-95"
            >
              <div className="relative z-10 flex items-center justify-center gap-2 font-black tracking-[0.2em] uppercase text-xs">
                Masuk Kota <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>

            <button
              onClick={onCredits}
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 border border-slate-800 hover:border-red-600/50 hover:bg-red-600/5 transition-all rounded-sm font-black tracking-[0.2em] uppercase text-xs text-slate-400 flex items-center justify-center gap-2 active:scale-95"
            >
              <Award className="w-4 h-4" /> Lihat Kredit
            </button>
          </div>
        </div>
      </main>

      {/* Mini Stats Footer */}
      <section className="border-t border-white/5 bg-slate-950/80 backdrop-blur-md py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-2"><Sword className="w-5 h-5 text-red-500/70" /></div>
            <p className="text-xl font-bold italic leading-none">20</p>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">Pemain</p>
          </div>
          <div className="text-center space-y-1 border-x border-white/5">
            <div className="flex justify-center mb-2"><Shield className="w-5 h-5 text-blue-500/70" /></div>
            <p className="text-xl font-bold italic leading-none">7</p>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">Role Unik</p>
          </div>
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-2"><Navigation className="w-5 h-5 text-amber-500/70" /></div>
            <p className="text-xl font-bold italic leading-none">Balance</p>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">Permainan</p>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-6 text-center text-[9px] text-slate-800 font-black tracking-[0.5em] uppercase select-none">
        Developed By <span className="text-slate-600">ChiroYashi Systems</span>
      </footer>
    </div>
  );
};

export default LandingPage;