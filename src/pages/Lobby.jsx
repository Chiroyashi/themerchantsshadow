import React, { useState } from 'react';
import { Users, Play, Copy, Check, AlertTriangle, ShieldCheck, XCircle, UserMinus, ChevronLeft } from 'lucide-react';

const Lobby = ({ roomCode, players, isHost, onStart, onKick, onBack }) => {
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
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8 flex flex-col items-center font-sans selection:bg-red-600/30">
      <div className="max-w-md w-full space-y-8 text-center mt-6">
        
        {/* BACK BUTTON */}
        <div className="flex justify-start">
          <button 
            onClick={onBack} 
            className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors text-[10px] uppercase font-black tracking-widest"
          >
            <ChevronLeft size={14} /> Kembali
          </button>
        </div>

        {/* ROOM CODE SECTION */}
        <div 
          onClick={handleCopyCode}
          className="group cursor-pointer space-y-1 active:scale-95 transition-all"
        >
          <p className="text-slate-500 uppercase tracking-[0.4em] text-[9px] font-black italic">
            Access Key
          </p>
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-6xl md:text-7xl font-black text-red-600 tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-colors group-hover:text-red-500">
              {roomCode}
            </h1>
            <div className="p-2.5 bg-slate-900 border border-white/5 rounded-2xl group-hover:border-red-600/50 transition-colors shadow-xl">
              {isCopied ? (
                <Check size={20} className="text-green-500 animate-in zoom-in duration-300" />
              ) : (
                <Copy size={20} className="text-slate-600 group-hover:text-red-500" />
              )}
            </div>
          </div>
          <div className="h-4 flex justify-center">
            {isCopied && (
              <span className="text-green-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
                Copied to Clipboard
              </span>
            )}
          </div>
        </div>

        {/* --- ALERT AREA --- */}
        {!isReady && (
          <div className="bg-red-600/5 border border-red-600/20 p-5 rounded-[2rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="p-3 bg-red-600/10 rounded-2xl shrink-0">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Status: Unstable</p>
              <p className="text-slate-400 text-[11px] leading-relaxed italic uppercase tracking-wider">
                Butuh <span className="text-white font-bold">{minPlayers - currentPlayerCount} orang</span> lagi untuk menstabilkan gerbang Waranasura.
              </p>
            </div>
          </div>
        )}

        {/* DAFTAR PEMAIN */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          {/* Background Decorative Icon */}
          <Users className="absolute -bottom-10 -right-10 text-white/[0.02] w-48 h-48 -rotate-12 pointer-events-none" />

          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4 px-2 relative z-10">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck size={18} className="text-red-600" />
              <span className="font-black text-[10px] uppercase tracking-[0.3em]">
                Antrian
              </span>
            </div>
            <span className={`text-[10px] font-black px-4 py-1 rounded-full border ${isReady ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-600/10 border-amber-500/20 text-amber-500'}`}>
              Min. {minPlayers}
            </span>
          </div>
          
          <ul className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {players.map((p) => {
              const isModerator = p.role === 'Moderator';
              return (
                <li 
                  key={p.id} 
                  className="flex justify-between items-center bg-slate-950/60 p-4 rounded-2xl border border-white/5 hover:border-red-600/30 hover:bg-slate-950 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isModerator ? 'bg-red-600/20' : 'bg-blue-600/20'}`}>
                      <ShieldCheck size={20} className={isModerator ? 'text-red-500' : 'text-blue-400'} />
                    </div>
                    
                    {/* Info */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Nama</span>
                      <span className="font-black text-base text-white truncate max-w-[160px]">
                        {p.name}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isModerator && (
                      <span className="text-[8px] font-black bg-red-600/20 text-red-500 px-3 py-1.5 rounded-full border border-red-600/30 uppercase tracking-wide">
                        Host
                      </span>
                    )}
                    {isHost && !isModerator ? (
                      <button 
                        onClick={() => onKick(p.id)}
                        className="p-2 hover:bg-red-600 text-slate-600 hover:text-white rounded-xl transition-all active:scale-90 group/kick"
                        title="Kick"
                      >
                        <UserMinus size={16} className="group-hover/kick:animate-pulse" />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ACTION AREA */}
        <div className="pt-4">
          {isHost ? (
            <button 
              onClick={onStart}
              disabled={!isReady}
              className={`w-full py-6 font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-3 transition-all active:scale-95 rounded-[2rem] shadow-2xl
                ${isReady 
                  ? 'bg-red-700 hover:bg-red-600 text-white shadow-red-900/40 border-b-4 border-red-900 active:border-b-0' 
                  : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5 opacity-50'}`}
            >
              {isReady ? (
                <><Play size={18} fill="currentColor" /> Initialize Game</>
              ) : (
                <>Locked • Waiting for Players</>
              )}
            </button>
          ) : (
            <div className="py-6 px-6 bg-slate-900/30 border border-white/5 rounded-[2rem] backdrop-blur-sm">
               <p className="text-slate-500 animate-pulse uppercase tracking-[0.3em] text-[9px] font-black italic leading-loose">
                 {isReady 
                  ? "Moderator is preparing the gate..." 
                  : `Summoning ${minPlayers - currentPlayerCount} more souls...`}
               </p>
            </div>
          )}
        </div>

        {/* FOOTER INFO */}
        <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.5em]">
          Waranasura Chronicles • Secured Connection
        </p>
      </div>
    </div>
  );
};

export default Lobby;