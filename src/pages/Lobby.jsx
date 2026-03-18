import React from 'react';
import { Users, Play } from 'lucide-react';

const Lobby = ({ roomCode, players, isHost, onStart }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center font-sans">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <p className="text-slate-500 uppercase tracking-widest text-[10px]">Room Code</p>
          <h1 className="text-6xl font-black text-red-600 tracking-tighter">{roomCode}</h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-slate-800 pb-2">
            <Users size={18} />
            <span className="font-bold text-sm uppercase leading-none">Pemain Terhubung ({players.length})</span>
          </div>
          
          <ul className="space-y-3">
            {players.map((p, index) => (
              <li key={index} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                <span className="font-medium text-sm">{p.name}</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Ready</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {isHost ? (
          <button 
            onClick={onStart}
            className="w-full py-4 bg-red-700 hover:bg-red-600 font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-red-900/20"
          >
            <Play size={20} fill="currentColor" /> Start Game
          </button>
        ) : (
          <div className="py-4 px-6 bg-slate-900/50 border border-slate-800 rounded-lg">
             <p className="text-slate-500 animate-pulse uppercase tracking-[0.2em] text-[10px] font-bold">
               Menunggu Moderator memulai permainan...
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;