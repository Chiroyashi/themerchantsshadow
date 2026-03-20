/**
 * THE MERCHANT'S SHADOW - OFFICIAL INDEPENDENT CREDITS
 * ---------------------------------------------------
 * Author    : Akbar Muzaky (ChiroYashi)
 * Release   : March 2026
 * Status    : Private Release / Prototype
 * License   : Personal Intellectual Property (Indie)
 */

import React from 'react';
import { 
  Copyright, ShieldCheck, ChevronLeft, Lock, Code2, Coins,
  ShieldAlert, BookOpen
} from 'lucide-react';

const Credits = ({ onBack }) => {
  // Metode URL Constructor: Cara paling aman di Vite untuk akses folder public
  const logoUrl = new URL('/assets/logo.png', import.meta.url).href;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-red-600/30 overflow-x-hidden p-4 md:p-12">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-5%] left-[-10%] w-[70%] h-[40%] bg-red-600 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[70%] h-[40%] bg-slate-800 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Navigation */}
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[9px] font-black uppercase tracking-[0.3em] mb-8 md:mb-12"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Kembali
        </button>

        {/* Main Header */}
        <header className="space-y-3 mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[7px] font-black uppercase tracking-[0.3em]">
            <Lock size={10} /> Private Intellectual Property
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">Architect.</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Solo Independent Project • 2026</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
          {/* Main Creator Card */}
          <div className="bg-slate-900/40 border border-white/5 p-6 md:p-8 rounded-[2rem] space-y-6 relative overflow-hidden group">
            {/* Watermark Background */}
            <div className="absolute -top-10 -right-10 opacity-[0.02] group-hover:opacity-[0.05] group-hover:scale-110 transition-all duration-700 pointer-events-none">
              <img 
                src={logoUrl} 
                alt="" 
                className="w-48 h-48 md:w-72 md:h-72 object-contain grayscale"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              {/* Logo Utama dengan Fallback UI Avatars */}
              <div className="w-14 h-14 flex items-center justify-center shadow-2xl overflow-hidden rounded-2xl bg-slate-950 border border-white/10 group-hover:border-red-600/50 transition-colors">
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://ui-avatars.com/api/?name=AM&background=b91c1c&color=fff";
                  }}
                />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Akbar Muzaky</h2>
                <p className="text-red-500 text-[9px] font-black uppercase tracking-[0.3em]">@chiroyashi</p>
              </div>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-400 italic leading-relaxed relative z-10">
              <p>"Seluruh aspek dalam permainan ini dirancang secara mandiri sebagai karya personal, mulai dari logika kode hingga mekanisme Trading & RPG."</p>
            </div>

            <div className="pt-4 border-t border-white/5 relative z-10">
               <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Ownership Status</span>
                  <span className="text-[10px] font-bold text-white uppercase italic">Independent Solo Developer</span>
               </div>
            </div>
          </div>

          {/* Legal Section */}
          <div className="grid grid-cols-1 gap-4 md:gap-6">
             <div className="p-5 md:p-6 bg-slate-900/40 border border-white/5 rounded-3xl space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-amber-500">
                  <Coins size={18} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Unique Mechanics</span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium leading-relaxed uppercase tracking-wider">
                  Mekanisme <span className="text-white font-bold">Economy</span> dan sistem <span className="text-white font-bold">RPG Roleplay</span> dilindungi hak cipta pribadi. Dilarang menyalin tanpa izin.
                </p>
             </div>

             <div className="p-5 md:p-6 bg-red-600/5 border border-red-600/20 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-red-500">
                  <ShieldAlert size={18} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Anti-Plagiarism</span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest italic">
                  Game ini tidak berafiliasi dengan organisasi mana pun. Hak moral sepenuhnya berada di tangan Akbar.
                </p>
             </div>
          </div>
        </div>

        {/* Story Teaser */}
        <section className="p-6 md:p-8 bg-gradient-to-r from-slate-900 to-slate-950 border border-white/5 rounded-[2rem] mb-16 text-center relative overflow-hidden">
           <div className="relative z-10 space-y-3">
              <div className="flex justify-center text-red-600 mb-1"><BookOpen size={20} /></div>
              <h3 className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500">Next Expansion</h3>
              <h4 className="text-lg md:text-2xl font-black italic text-white uppercase tracking-tighter leading-tight">Waranasura Chronicles:<br className="md:hidden" /> The Untold Story</h4>
              <p className="text-[10px] text-slate-500 italic max-w-xs mx-auto">"Setiap keping koin di pasar Waranasura menyimpan rahasia berdarah..."</p>
           </div>
           <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>
        </section>

        {/* Supporting Tech Stack */}
        <section className="border-t border-white/5 pt-8 mb-16 text-center">
           <div className="flex items-center gap-2 justify-center mb-6">
              <Code2 size={14} className="text-slate-600" />
              <h3 className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-600">Industrial Tech Stack</h3>
           </div>
           <div className="grid grid-cols-2 md:flex md:justify-center gap-6 md:gap-10 opacity-20 grayscale italic font-black text-sm md:text-xl tracking-tighter">
              <span>REACT.JS</span>
              <span>FIREBASE</span>
              <span>VITE</span>
              <span>LUCIDE</span>
           </div>
        </section>

        {/* Final Footer Credits */}
        <footer className="py-8 border-t border-white/10 flex flex-col items-center space-y-8">
           <div className="inline-block px-5 py-2 border border-red-600/30 rounded-full bg-red-600/5">
              <p className="text-red-500 text-[7px] font-black uppercase tracking-[0.6em]">
                PERSONAL LICENSE SECURED
              </p>
           </div>
           
           <div className="text-center space-y-2 px-4">
              <div className="flex justify-center gap-4 mb-2">
                 <Copyright size={20} className="text-slate-500" />
              </div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest italic">
                Copyright © 2026 THE MERCHANT'S SHADOW
              </p>
              <p className="text-slate-600 text-[8px] font-black uppercase tracking-[0.3em]">
                Created by Akbar Muzaky
              </p>
           </div>

           <div className="p-4 border border-white/5 rounded-xl bg-black/40 max-w-[280px] text-center">
              <p className="text-[7px] uppercase font-black text-slate-500 tracking-[0.2em] leading-relaxed">
                Unauthorized redistribution is strictly prohibited. <br />
                <span className="text-slate-700 mt-1 block tracking-[0.1em]">Identity Hash: AKB-MS-IND-2026-X1</span>
              </p>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default Credits;