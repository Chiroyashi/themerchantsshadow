import React, { useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { Skull, Heart, Play, Pause, RefreshCw, Info, LogOut } from 'lucide-react';
import SharedTimer from '../components/SharedTimer';

const ModeratorDashboard = ({ players, roomCode, onKill, onExit, onToggleTimer, onResetTimer }) => {
  // State lokal untuk memantau status timer di Firebase (untuk UI tombol)
  const [globalTimer, setGlobalTimer] = useState({ isActive: false, seconds: 300 });

  useEffect(() => {
    if (!roomCode) return;
    const timerRef = ref(db, `rooms/${roomCode}/timer`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGlobalTimer(data);
    });
    return () => unsubscribe();
  }, [roomCode]);

  const aliveCount = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-slate-800 pb-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-black text-red-600 uppercase italic leading-none tracking-tighter">Command Center</h1>
            <p className="text-[10px] text-slate-500 font-mono mt-2 tracking-[0.2em]">OPERATIONAL ROOM: {roomCode}</p>
          </div>
          
          <button 
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/10 text-red-500 border border-red-900/30 rounded-lg hover:bg-red-900/20 transition-all text-[10px] font-black uppercase tracking-widest w-fit"
          >
            <LogOut size={14} /> Bubarkan Room
          </button>
        </div>

        {/* Global Timer Control */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-3 shadow-2xl min-w-[200px]">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Waktu Diskusi Global</p>
          
          {/* Komponen Timer Sinkron */}
          <SharedTimer roomCode={roomCode} isHost={true} />

          <div className="flex gap-2 w-full">
            <button 
              onClick={() => onToggleTimer(globalTimer.isActive, globalTimer.seconds)}
              className={`flex-1 flex justify-center items-center p-3 rounded-xl transition-all shadow-lg ${
                globalTimer.isActive 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' 
                  : 'bg-green-700 hover:bg-green-600 shadow-green-900/20'
              }`}
            >
              {globalTimer.isActive ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            </button>
            <button 
              onClick={onResetTimer}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div className="hidden lg:block text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pemain Aktif</p>
          <p className="text-3xl font-black text-blue-500 tracking-tighter">{aliveCount} <span className="text-xs text-slate-700">/ {players.length - 1}</span></p>
        </div>
      </header>

      {/* Grid Pemain */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {players.filter(p => p.role !== 'Moderator').map((p) => (
          <div 
            key={p.id} 
            className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
              p.status === 'dead' 
                ? 'bg-slate-950 border-red-900/20 opacity-40 grayscale shadow-inner scale-[0.98]' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-600 shadow-xl'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="overflow-hidden">
                <h3 className={`font-bold truncate ${p.status === 'dead' ? 'text-slate-600 line-through' : 'text-white'}`}>
                  {p.name}
                </h3>
                <p className={`text-[10px] font-black uppercase tracking-wider mt-1 ${
                  p.role.toLowerCase().includes('werewolf') ? 'text-red-500' : 
                  p.role.toLowerCase().includes('warlock') ? 'text-purple-500' : 'text-blue-400'
                }`}>
                  {p.role}
                </p>
              </div>
              
              <button 
                onClick={() => onKill(p.id, p.status)}
                className={`p-2.5 rounded-xl transition-all ${
                  p.status === 'dead' 
                    ? 'bg-red-900/30 text-red-500 shadow-inner' 
                    : 'bg-slate-800 text-slate-500 hover:bg-red-700 hover:text-white hover:rotate-12 shadow-lg'
                }`}
              >
                {p.status === 'dead' ? <Skull size={18} /> : <Heart size={18} />}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
              <div className={`w-2 h-2 rounded-full ${
                p.role.toLowerCase().includes('werewolf') || p.role.toLowerCase().includes('warlock') 
                  ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]' 
                  : 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]'
              }`}></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                {p.role.toLowerCase().includes('werewolf') || p.role.toLowerCase().includes('warlock') ? 'Antagonis' : 'Protagonis'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Info Footer */}
      <footer className="mt-12 p-6 bg-slate-900/20 border border-slate-800/50 rounded-2xl flex items-center gap-4 border-dashed text-slate-500">
        <Info size={20} className="text-amber-500 shrink-0" />
        <p className="text-[11px] leading-relaxed italic">
          <strong>Moderator Mode:</strong> Waktu yang kamu Play/Pause di sini akan muncul secara otomatis di layar setiap pemain. Gunakan fitur ini untuk mendisiplinkan waktu debat warga.
        </p>
      </footer>
    </div>
  );
};

export default ModeratorDashboard;