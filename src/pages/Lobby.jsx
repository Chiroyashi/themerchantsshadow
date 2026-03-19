import React, { useState } from 'react';
import { Users, Play, Copy, Check } from 'lucide-react';

const Lobby = ({ roomCode, players, isHost, onStart }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    
    // Fungsi utama untuk copy ke clipboard
    navigator.clipboard.writeText(roomCode)
      .then(() => {
        setIsCopied(true);
        // Reset kembali icon setelah 2 detik
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Gagal menyalin kode: ', err);
      });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center font-sans">
      <div className="max-w-md w-full space-y-8 text-center mt-10">
        
        {/* ROOM CODE SECTION - CLICKABLE TO COPY */}
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
            
            {/* Feedback Icon */}
            <div className="p-2 bg-slate-900/50 rounded-xl border border-slate-800 group-hover:border-red-500/50 transition-colors">
              {isCopied ? (
                <Check size={20} className="text-green-500 animate-in zoom-in" />
              ) : (
                <Copy size={20} className="text-slate-600 group-hover:text-red-500" />
              )}
            </div>
          </div>
          
          {/* Notifikasi Teks Kecil */}
          <div className="h-4"> {/* Container tetap agar layout tidak melompat */}
            {isCopied && (
              <p className="text-green-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                Copied to Clipboard!
              </p>
            )}
          </div>
        </div>

        {/* DAFTAR PEMAIN */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-slate-800 pb-3">
            <Users size={18} />
            <span className="font-bold text-sm uppercase tracking-widest">
              Pemain Terhubung ({players.length})
            </span>
          </div>
          
          <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {players.map((p, index) => (
              <li key={index} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                <span className="font-bold text-sm text-slate-200">{p.name}</span>
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
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
            className="w-full py-5 bg-red-700 hover:bg-red-600 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_10px_30px_rgba(185,28,28,0.2)] rounded-2xl"
          >
            <Play size={20} fill="currentColor" /> Start Game
          </button>
        ) : (
          <div className="py-5 px-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
             <p className="text-slate-500 animate-pulse uppercase tracking-[0.2em] text-[10px] font-black">
               Menunggu Moderator memulai permainan...
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;