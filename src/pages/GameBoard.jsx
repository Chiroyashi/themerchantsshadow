import React from 'react';
import { Skull, Heart, ArrowLeft } from 'lucide-react';
import SharedTimer from '../components/SharedTimer';

const GameBoard = ({ players, roomCode, onBack }) => {
  // Filter Moderator agar tidak muncul di daftar target diskusi
  const gamePlayers = players.filter(p => p.role !== 'Moderator');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans flex flex-col items-center">
      <header className="max-w-4xl w-full flex flex-col items-center gap-6 mb-8">
        {/* Tombol Kembali */}
        <button 
          onClick={onBack} 
          className="self-start flex items-center gap-2 text-slate-600 hover:text-white transition-all text-[10px] uppercase font-black tracking-widest group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          Kembali ke Peran
        </button>

        {/* Judul Halaman */}
        <div className="text-center space-y-2">
          <h2 className="text-slate-500 uppercase tracking-[0.4em] text-[10px] font-black">Informasi Kota</h2>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-red-600 leading-none">
            Daftar Kematian
          </h1>
          <p className="text-slate-600 text-[9px] uppercase tracking-widest font-medium">
            Gunakan informasi ini untuk berdiskusi & voting
          </p>
        </div>

        {/* Timer Sinkron (Pusat Perhatian saat Diskusi) */}
        <div className="scale-110">
          <SharedTimer roomCode={roomCode} />
        </div>
      </header>

      {/* Grid Daftar Pemain */}
      <div className="max-w-4xl w-full grid grid-cols-2 md:grid-cols-3 gap-3">
        {gamePlayers.map((player) => (
          <div 
            key={player.id}
            className={`p-4 rounded-2xl border transition-all duration-500 flex items-center gap-4
              ${player.status === 'dead' 
                ? 'bg-slate-900/20 border-red-900/10 grayscale opacity-40 shadow-inner' 
                : 'bg-slate-900 border-slate-800 shadow-xl hover:border-slate-600'}`}
          >
            {/* Icon Status */}
            <div className={`p-3 rounded-xl shrink-0 transition-colors
              ${player.status === 'dead' ? 'bg-red-950/30 text-red-700' : 'bg-slate-800 text-blue-500'}`}>
              {player.status === 'dead' ? <Skull size={20} /> : <Heart size={20} />}
            </div>
            
            {/* Detail Pemain */}
            <div className="overflow-hidden w-full">
              <p className={`text-sm font-black truncate leading-tight
                ${player.status === 'dead' ? 'line-through text-slate-600' : 'text-slate-100'}`}>
                {player.name}
              </p>
              <p className={`text-[8px] uppercase tracking-[0.2em] font-black mt-0.5
                ${player.status === 'dead' ? 'text-red-900' : 'text-slate-600'}`}>
                {player.status === 'dead' ? 'Gugur' : 'Bernapas'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Branding */}
      <footer className="mt-auto pt-12 text-center">
        <p className="text-[10px] text-slate-800 uppercase tracking-[0.5em] font-black italic">
          The Merchant's Shadow • PCC Edition
        </p>
      </footer>
    </div>
  );
};

export default GameBoard;