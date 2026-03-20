/**
 * THE MERCHANT'S SHADOW - OFFICIAL INDEPENDENT CREDITS
 * ---------------------------------------------------
 * Author    : Akbar (ChiroYashi)
 * Release   : March 2026
 * Status    : Private Release / Prototype
 * License   : Personal Intellectual Property (Indie)
 * ---------------------------------------------------
 * Dilarang menyalin atau mendistribusikan ulang logika 
 * permainan tanpa izin tertulis dari pengembang.
 */

import React from 'react';
import { 
  Copyright, ShieldCheck, ChevronLeft, Lock, Code2, Coins,
  ShieldAlert, BookOpen
} from 'lucide-react';

const Credits = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-red-600/30 overflow-x-hidden p-6 md:p-12">
      {/* Background Decor - Solo Creator Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-slate-800 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Navigation */}
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em] mb-12"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Gerbang
        </button>

        {/* Main Header */}
        <header className="space-y-4 mb-16 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[8px] font-black uppercase tracking-[0.3em]">
            <Lock size={10} /> Private Intellectual Property
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
            The <span className="text-red-600">Architect.</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em]">Solo Independent Project • March 2026</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* Main Creator Card */}
          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
            {/* Besar Watermark di Background - Menggunakan Gambar Logo juga */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] group-hover:scale-110 transition-all duration-700 pointer-events-none">
              <img 
                src="/assets/logo.png" 
                alt="Watermark" 
                className="w-72 h-72 object-contain grayscale"
              />
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              {/* Gambar Logo Utama */}
              <div className="w-16 h-16 flex items-center justify-center shadow-xl overflow-hidden group-hover:border-red-600/50 transition-colors">
                <img 
                  src="public/assets/logo.png" 
                  alt="ChiroYashi Logo" 
                  className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter hover:text-red-500 transition-colors">Akbar Muzaky</h2>
                <p className="text-red-500 text-[9px] font-black uppercase tracking-[0.3em]">@chiroyashi Systems</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-400 italic leading-relaxed relative z-10">
              <p>"Seluruh aspek dalam permainan ini mulai dari logika kode, desain peran (RPG-Style), hingga mekanisme Trading & Ekonomi dirancang secara mandiri sebagai karya personal."</p>
            </div>

            <div className="pt-4 border-t border-white/5 relative z-10">
               <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Ownership Status</span>
                  <span className="text-[10px] font-bold text-white uppercase italic">Independent Solo Developer</span>
               </div>
            </div>
          </div>

          {/* Legal Section */}
          <div className="space-y-6">
             <div className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-amber-500">
                  <Coins size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Unique Mechanics Claim</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed uppercase tracking-wider">
                  Mekanisme <span className="text-white font-bold">Trading Economy</span> dan sistem <span className="text-white font-bold">RPG Roleplay</span> di dalam game ini dilindungi oleh hak cipta kepemilikan individu. Dilarang menyalin logika transaksi Warlock/Pedagang tanpa izin.
                </p>
             </div>

             <div className="p-6 bg-red-600/5 border border-red-600/20 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-red-500">
                  <ShieldAlert size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Anti-Plagiarism Statement</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest italic">
                  Game ini tidak berafiliasi dengan organisasi mana pun. Seluruh tanggung jawab pengembangan dan hak moral sepenuhnya berada di tangan pengembang (Akbar).
                </p>
             </div>
          </div>
        </div>

        {/* Story Teaser (New) */}
        <section className="p-8 bg-gradient-to-r from-slate-900 to-slate-950 border border-white/5 rounded-[2.5rem] mb-20 text-center relative overflow-hidden">
           <div className="relative z-10 space-y-4">
              <div className="flex justify-center text-red-600 mb-2"><BookOpen size={24} /></div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Next Expansion</h3>
              <h4 className="text-2xl font-black italic text-white uppercase tracking-tighter">Waranasura Chronicles: The Untold Story</h4>
              <p className="text-xs text-slate-500 italic max-w-md mx-auto">"Setiap keping koin di pasar Waranasura menyimpan rahasia berdarah yang belum terungkap..."</p>
           </div>
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>
        </section>

        {/* Supporting Tech */}
        <section className="border-t border-white/5 pt-12 mb-20 text-center">
           <div className="flex items-center gap-3 justify-center mb-8">
              <Code2 size={16} className="text-slate-600" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">Built With Industrial Tech</h3>
           </div>
           <div className="flex flex-wrap justify-center gap-10 opacity-30 grayscale italic font-black text-xl tracking-tighter">
              <span>REACT.JS</span>
              <span>FIREBASE</span>
              <span>VITE</span>
              <span>LUCIDE</span>
           </div>
        </section>

        {/* Final Footer Credits */}
        <footer className="py-12 border-t border-white/10 flex flex-col items-center space-y-10">
           <div className="inline-block px-6 py-2 border border-red-600/30 rounded-full bg-red-600/5">
              <p className="text-red-500 text-[8px] font-black uppercase tracking-[0.6em]">
                PERSONAL LICENSE SECURED • NO AFFILIATION
              </p>
           </div>
           
           <div className="text-center space-y-2">
              <div className="flex justify-center gap-4 mb-4">
                 <Copyright size={24} className="text-slate-500" />
              </div>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest italic">
                Copyright © {new Date().getFullYear()} THE MERCHANT'S SHADOW
              </p>
              <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em]">
                Original Concept & Code by Akbar (ChiroYashi)
              </p>
           </div>

           <div className="p-5 border border-white/5 rounded-2xl bg-black/40 max-w-sm text-center">
              <p className="text-[8px] uppercase font-black text-slate-500 tracking-[0.2em] leading-relaxed">
                Unauthorized redistribution, imitation of game logic, or reverse engineering is strictly prohibited. <br />
                <span className="text-slate-700 mt-2 block tracking-[0.1em]">Identity Hash: AKB-MS-IND-2026-X1</span>
              </p>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default Credits;