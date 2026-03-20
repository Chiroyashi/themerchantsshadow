import React, { useState } from 'react';
import { Users, Play, Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

const Lobby = ({ roomCode, players, isHost, onStart }) => {
  const [isCopied, setIsCopied] = useState(false);

  // --- LOGIKA PEMBATASAN MINIMAL PEMAIN ---
  const minPlayers = 6;
  const currentPlayerCount = players.length;
  const isReady = currentPlayerCount >= minPlayers;

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Gagal menyalin kode: ', err);
      });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center font-sans">
      <div className="max-w-md w-full space-y-8 text-center mt-10">
        
        {/* ROOM CODE SECTION */}
        <div 
          onClick={handleCopyCode}
          className="group cursor-pointer space-y-1 active:scale-95 transition-all"
          title="Klik untuk menyalin"
        >
          <p className="text-slate-500 uppercase tracking-[0.3em] text-[10px] font-bold">
            Room Code
          </p>
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-7xl font-black text-red-600 tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-colors group-hover:text-red-500">
              {roomCode}
            </h1>
            <div className="p-2 bg-slate-900/50 rounded-xl border border-slate-800 group-hover:border-red-500/50 transition-colors">
              {isCopied ? (
                <Check size={20} className="text-green-500 animate-in zoom-in" />
              ) : (
                <Copy size={20} className="text-slate-600 group-hover:text-red-500" />
              )}
            </div>
          </div>
          <div className="h-4">
            {isCopied && (
              <p className="text-green-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                Copied to Clipboard!
              </p>
            )}
          </div>
        </div>

        {/* --- WARNING CARD: MINIMAL PEMAIN --- */}
        {!isReady && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-[2rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-3 bg-rose-500/20 rounded-2xl">
              <AlertTriangle className="text-rose-500" size={24} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1 text-left">Peringatan Moderator</p>
              <p className="text-slate-400 text-xs leading-relaxed italic">
                Dibutuhkan minimal <span className="text-white font-bold">{minPlayers} orang</span> (termasuk Moderator) untuk menjaga keseimbangan takdir di Waranasura.
              </p>
            </div>
          </div>
        )}

        {/* DAFTAR PEMAIN */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4 px-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Users size={18} />
              <span className="font-bold text-sm uppercase tracking-widest">
                Penduduk Berkumpul
              </span>
            </div>
            <span className={`text-xs font-black px-3 py-1 rounded-full ${isReady ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
              {currentPlayerCount} / {minPlayers}
            </span>
          </div>
          
          <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {players.map((p, index) => (
              <li key={index} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors group">
                <span className="font-bold text-sm text-slate-200">{p.name}</span>
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                   <div className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></div>
                   <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Ready</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ACTION BUTTON */}
        {isHost ? (
          <button 
            onClick={onStart}
            disabled={!isReady}
            className={`w-full py-6 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 rounded-[2rem] shadow-2xl
              ${isReady 
                ? 'bg-red-700 hover:bg-red-600 text-white shadow-red-900/20' 
                : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-white/5 opacity-80'}`}
          >
            {isReady ? (
              <><Play size={20} fill="currentColor" /> Buka Gerbang Waranasura</>
            ) : (
              <><ShieldCheck size={20} /> Menunggu Penduduk...</>
            )}
          </button>
        ) : (
          <div className="py-6 px-6 bg-slate-900/50 border border-slate-800 rounded-[2rem]">
             <p className="text-slate-500 animate-pulse uppercase tracking-[0.2em] text-[10px] font-black">
               {isReady 
                ? "Menunggu Moderator membuka gerbang..." 
                : `Menunggu ${minPlayers - currentPlayerCount} penduduk lagi...`}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;