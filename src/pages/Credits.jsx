/**
 * THE MERCHANT'S SHADOW - CREDIT & LICENSE PAGE
 * --------------------------------------------
 * Created By  : Akbar (ChiroYashi)
 * Project     : PCC Special Development 2026
 * Fingerprint : CY-MS-2026-AKBAR-PCC-SECURED
 */

import React from 'react';
import { 
  Copyright, ShieldCheck, Fingerprint, Award, 
  ChevronLeft, Terminal, Globe, Lock, Cpu
} from 'lucide-react';

const Credits = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-red-600/30 overflow-x-hidden p-6 md:p-12">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Navigation */}
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em] mb-12"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Pangkal
        </button>

        {/* Main Header */}
        <header className="space-y-4 mb-16 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[8px] font-black uppercase tracking-[0.3em]">
            <Lock size={10} /> Intellectual Property Secured
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
            The <span className="text-red-600">Architects.</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em]">Waranasura Chronicles • Credit Registry</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* Main Creator Card */}
          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-white group-hover:scale-110 transition-transform">
              <Terminal size={120} />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                A
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Akbar</h2>
                <p className="text-red-500 text-[9px] font-black uppercase tracking-[0.3em]">ChiroYashi Systems</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-400 italic leading-relaxed">
              <p>"Pengembang utama, desainer mekanik Jejak Mata Angin, dan penulis narasi kota kuno Waranasura."</p>
            </div>

            <div className="pt-4 border-t border-white/5 flex gap-4">
               <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Role</span>
                  <span className="text-[10px] font-bold text-white uppercase">Lead Developer</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Organization</span>
                  <span className="text-[10px] font-bold text-white uppercase italic">PCC Semarang</span>
               </div>
            </div>
          </div>

          {/* Legal Section */}
          <div className="space-y-6">
             <div className="p-6 bg-slate-900/20 border border-white/5 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-blue-500 mb-2">
                  <ShieldCheck size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Originality Policy</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
                  Seluruh logika program, aset visual kustom, dan narasi "The Merchant's Shadow" adalah hak milik intelektual dari pengembang. Penggunaan tanpa izin akan ditindaklanjuti.
                </p>
             </div>

             <div className="p-6 bg-slate-900/20 border border-white/5 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-amber-500 mb-2">
                  <Fingerprint size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Digital Signature</span>
                </div>
                <div className="font-mono text-[9px] text-slate-600 break-all bg-black/40 p-3 rounded-xl border border-white/5">
                  ID: CY-MS-V3-2026-BXX-99-AKBAR-PCC-SEMARANG-SECURED-LOGIC-001
                </div>
             </div>
          </div>
        </div>

        {/* Supporting Tech */}
        <section className="border-t border-white/5 pt-12 mb-20 text-center">
           <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 mb-8">Powered By Industrial Standards</h3>
           <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-30 grayscale contrast-125">
              <div className="flex items-center gap-2 font-black italic uppercase tracking-tighter text-xl">React</div>
              <div className="flex items-center gap-2 font-black italic uppercase tracking-tighter text-xl">Firebase</div>
              <div className="flex items-center gap-2 font-black italic uppercase tracking-tighter text-xl">Vite</div>
              <div className="flex items-center gap-2 font-black italic uppercase tracking-tighter text-xl">Lucide</div>
           </div>
        </section>

        {/* Final Footer Credits */}
        <footer className="py-12 border-t border-white/10 flex flex-col items-center space-y-8">
           <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
              <span className="text-red-600">No Plagiarism</span>
              <span className="w-1 h-1 bg-slate-800 rounded-full" />
              <span>Full Integrity</span>
              <span className="w-1 h-1 bg-slate-800 rounded-full" />
              <span className="text-blue-600">Exclusive Version</span>
           </div>
           
           <div className="text-center">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Copyright © {new Date().getFullYear()} THE MERCHANT'S SHADOW</p>
              <p className="text-slate-600 text-[8px] uppercase tracking-[0.2em] mt-2">Developed and Maintained by Akbar & ChiroYashi Systems</p>
           </div>

           <div className="p-4 border border-white/5 rounded-2xl bg-black/40 flex items-center gap-3">
              <Award className="text-amber-500" size={20} />
              <p className="text-[7px] uppercase font-black text-slate-500 tracking-[0.1em] leading-tight">
                This project is a certified work of <br />
                <span className="text-white">POLITEKNIK COMPUTER CLUB CREATIVE LABS</span>
              </p>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default Credits;