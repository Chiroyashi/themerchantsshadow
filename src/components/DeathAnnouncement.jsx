import React, { useState, useEffect } from 'react';
import { Skull, Loader2, ShieldCheck } from 'lucide-react';

const DeathAnnouncement = ({ deadPlayers, day, onClose }) => {
  const [canClose, setCanClose] = useState(false);
  
  // Cek apakah malam ini damai (berdasarkan kiriman "TIDAK ADA" dari Moderator)
  const isPeacefulNight = deadPlayers.length === 1 && deadPlayers[0] === "TIDAK ADA";

  useEffect(() => {
    // Berikan jeda 2 detik agar pemain sempat membaca status malam tersebut
    const timer = setTimeout(() => {
      setCanClose(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [deadPlayers]);

  if (!deadPlayers || deadPlayers.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-700">
      <div className={`max-w-sm w-full bg-slate-900 border-2 ${isPeacefulNight ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)]' : 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)]'} rounded-[2.5rem] p-8 text-center relative overflow-hidden transition-all duration-1000`}>
        
        {/* Dekorasi Background Cahaya Sesuai Kondisi */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 ${isPeacefulNight ? 'bg-emerald-600/10' : 'bg-red-600/10'} rounded-full blur-3xl`} />
        <div className={`absolute -bottom-10 -left-10 w-32 h-32 ${isPeacefulNight ? 'bg-emerald-600/5' : 'bg-red-600/5'} rounded-full blur-3xl`} />
        
        <div className="relative mb-6">
          <div className={`absolute inset-0 ${isPeacefulNight ? 'bg-emerald-600/20' : 'bg-red-600/20'} blur-2xl rounded-full scale-150 animate-pulse`} />
          {isPeacefulNight ? (
            <ShieldCheck size={72} className="text-emerald-500 mx-auto relative z-10 animate-bounce" />
          ) : (
            <Skull size={72} className="text-red-600 mx-auto relative z-10 animate-bounce" />
          )}
        </div>
        
        <div className="space-y-2 mb-8 relative z-10">
          <h2 className={`${isPeacefulNight ? 'text-emerald-500' : 'text-red-500'} font-black uppercase tracking-[0.4em] text-[10px]`}>
            Laporan Forensik • Hari {day}
          </h2>
          <h1 className="text-white text-2xl font-black italic uppercase leading-none tracking-tighter">
            {isPeacefulNight ? 'Malam yang Tenang' : 'Seseorang Telah Gugur'}
          </h1>
        </div>

        <div className="space-y-3 relative z-10 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {isPeacefulNight ? (
            <div className="bg-emerald-600/10 border border-emerald-600/20 py-6 rounded-2xl animate-in zoom-in duration-1000">
              <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Semua Orang Selamat</p>
              <p className="text-slate-400 text-[9px] mt-1 italic uppercase font-bold">Tidak ada darah tertumpah malam ini</p>
            </div>
          ) : (
            deadPlayers.map((name, idx) => (
              <div key={idx} className="bg-red-600/10 border border-red-600/20 py-5 rounded-2xl animate-in slide-in-from-bottom-4 transition-all shadow-lg">
                <span className="text-white font-black text-2xl tracking-tighter uppercase">{name}</span>
                <p className="text-red-400 text-[9px] font-black uppercase mt-1 tracking-[0.2em]">Status: Tereliminasi</p>
              </div>
            ))
          )}
        </div>

        <p className="text-slate-500 text-[10px] mt-8 leading-relaxed italic px-4 uppercase font-bold tracking-tight relative z-10">
          {isPeacefulNight 
            ? '"Fajar menyingsing dengan kedamaian. Tapi waspadalah, serigala masih mengintai."' 
            : '"Kegelapan malam menyisakan duka. Siapa yang akan kalian hukum pagi ini?"'}
        </p>

        {/* Tombol Aksi dengan Delay 2 Detik */}
        <div className="mt-8 relative z-10 h-14">
          {canClose ? (
            <button 
              onClick={onClose}
              className={`w-full h-full ${isPeacefulNight ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-white hover:bg-slate-200'} ${isPeacefulNight ? 'text-white' : 'text-black'} rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all animate-in zoom-in duration-300 shadow-xl`}
            >
              Mulai Diskusi
            </button>
          ) : (
            <div className={`w-full h-full flex items-center justify-center gap-3 ${isPeacefulNight ? 'text-emerald-600/40' : 'text-red-600/40'}`}>
              <Loader2 className="animate-spin" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest animate-pulse font-mono">Syncing Records...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeathAnnouncement;