import React, { useEffect } from 'react';
import { Skull, ShieldCheck, Moon } from 'lucide-react';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const VoteAnnouncement = ({ names, day, onClose }) => {
  const isPeaceful = names?.length === 1 && names[0] === "TIDAK ADA";

  useEffect(() => {
    lockScroll();
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => {
      unlockScroll();
      clearTimeout(timer);
    };
  }, [onClose]);

  if (!names || names.length === 0) return null;

  const borderColor = 'border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.1)]';
  const glowBg = 'bg-purple-600';
  const accentText = 'text-purple-400';

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-700" style={{ zIndex: Z_LAYER.PHASE_OVERLAY }}>
      <div className={`max-w-sm w-full bg-slate-900 border-2 rounded-[2.5rem] p-8 text-center relative overflow-hidden transition-all duration-1000 ${borderColor}`}>

        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl ${glowBg}/10`} />
        <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl ${glowBg}/5`} />

        <div className="relative mb-6">
          <div className={`absolute inset-0 blur-2xl rounded-full scale-150 animate-pulse ${glowBg}/20`} />
          {isPeaceful ? (
            <ShieldCheck size={72} className="text-slate-500 mx-auto relative z-10 animate-bounce" />
          ) : (
            <Skull size={72} className="text-red-600 mx-auto relative z-10 animate-bounce" />
          )}
        </div>

        <div className="space-y-2 mb-8 relative z-10">
          <h2 className={`font-black uppercase tracking-[0.4em] text-[10px] ${accentText}`}>
            Laporan Forensik • Hari {day}
          </h2>
          <h1 className="text-white text-2xl font-black italic uppercase leading-none tracking-tighter">
            {isPeaceful ? 'Tidak Ada Hukuman' : 'Dihukum Gantung'}
          </h1>
        </div>

        <div className="space-y-3 relative z-10">
          {isPeaceful ? (
            <div className="bg-slate-800/40 border border-slate-700/30 py-6 rounded-2xl">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Suara tidak mencapai threshold</p>
            </div>
          ) : (
            <div className="bg-red-600/10 border border-red-600/20 py-5 rounded-2xl">
              <span className="text-white font-black text-2xl tracking-tighter uppercase">{names[0]}</span>
              <p className="text-red-400 text-[9px] font-black uppercase mt-1 tracking-[0.2em]">Status: Tereliminasi</p>
            </div>
          )}
        </div>

        <p className="text-slate-500 text-[10px] mt-8 leading-relaxed italic px-4 uppercase font-bold tracking-tight relative z-10">
          {isPeaceful
            ? '"Keadilan membutuhkan bukti. Tidak ada yang dihukum hari ini."'
            : '"Keputusan telah diambil. Semoga Waranasura beristirahat dalam damai."'}
        </p>

        <div className="mt-8 relative z-10 h-14">
          <button
            onClick={onClose}
            className="w-full h-full rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all animate-in zoom-in duration-300 shadow-xl bg-purple-600 text-white hover:bg-purple-500"
          >
            Lanjut ke Malam
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteAnnouncement;
