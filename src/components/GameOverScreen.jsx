import React, { useState, useEffect } from 'react';
import { Trophy, Skull, Home, Users, ScrollText, Sparkles, Sunrise, Moon, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const GameOverScreen = ({ winner, players, playerData, onLeave }) => {
  useEffect(() => { lockScroll(); return () => unlockScroll(); }, []);
  const [step, setStep] = useState(1);
  const isWargaWinner = winner === 'WARGA';

  // Logika Menang/Kalah Personal
  const myRole = playerData?.role?.toLowerCase() || "";
  const isAntagonist = myRole.includes('werewolf') || myRole.includes('warlock');
  const isIWinner = isWargaWinner ? !isAntagonist : isAntagonist;

  const nextStep = () => setStep(s => s + 1);

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 text-center font-sans overflow-hidden" style={{ zIndex: Z_LAYER.GAME_OVER }}>
      {/* Dynamic Background Ambience */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] ${isWargaWinner ? 'bg-blue-600' : 'bg-red-900'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] ${isWargaWinner ? 'bg-amber-500' : 'bg-purple-900'}`} />
      </div>

      <div className="max-w-md w-full relative">
        {/* STEP 1: EPILOG NARASI (Gaya IntroFable) */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-1000">
            <div className={`text-[10px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-full inline-block mx-auto ${
              isWargaWinner
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'bg-red-600/10 text-red-500 border border-red-500/20'
            }`}>
              {isWargaWinner ? "Tim Penduduk Menang" : "Tim Werewolf Menang"}
            </div>
            <ScrollText className={`w-16 h-16 mx-auto mb-2 drop-shadow-2xl ${isWargaWinner ? 'text-amber-500' : 'text-red-600'}`} />
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Epilog Waranasura</h2>
            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed italic text-sm px-4">
                {isWargaWinner
                  ? "Cahaya mentari akhirnya menembus kabut tebal yang menyelimuti kota. Kabar tentang tewasnya ancaman terakhir menyebar cepat, membawa fajar baru yang damai..."
                  : "Malam tak kunjung usai. Jeritan penduduk terakhir tenggelam di balik tawa dingin sang Warlock dan raungan buas para Werewolf yang kini berkuasa..."}
              </p>
              <p className={`text-sm font-black uppercase tracking-[0.3em] ${isWargaWinner ? 'text-blue-400' : 'text-red-500'}`}>
                {isWargaWinner ? "KOTA INI TELAH PULIH" : "KOTA INI TELAH JATUH"}
              </p>
            </div>
            <button onClick={nextStep} className="mt-8 px-10 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all active:scale-95">Lihat Nasibmu</button>
          </div>
        )}

        {/* STEP 2: PERSONAL FATE (YOU WIN/LOSE) */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-2">
              <div className={`text-[10px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-full inline-block mx-auto mb-3 ${
                isWargaWinner
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                  : 'bg-red-600/10 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              }`}>
                {isWargaWinner ? "Tim Penduduk Menang" : "Tim Werewolf Menang"}
              </div>
            </div>
            <div className="relative inline-block">
              {isIWinner ? (
                <div className="relative">
                   <Trophy className="w-24 h-24 text-amber-500 animate-pulse" />
                   <Sparkles className="absolute -top-2 -right-2 text-white animate-bounce" />
                </div>
              ) : (
                <Skull className="w-24 h-24 text-slate-700" />
              )}
            </div>

            <div className="space-y-1">
              <h1 className={`text-6xl font-black italic tracking-tighter leading-none ${
                isIWinner
                  ? (isWargaWinner ? 'text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]')
                  : 'text-slate-600'
              }`}>
                {isIWinner ? "VICTORY" : "DEFEAT"}
              </h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Sebagai {playerData?.role}</p>
            </div>

            <div className={`p-1 rounded-2xl rotate-1 shadow-2xl ${isIWinner ? 'bg-gradient-to-r from-amber-500 to-yellow-300' : 'bg-slate-800'}`}>
              <div className="bg-slate-900 rounded-xl p-6 rotate-[-1deg]">
                <p className="text-slate-400 text-xs italic leading-relaxed">
                  {isIWinner 
                    ? "Namamu akan terukir dalam sejarah Waranasura sebagai pahlawan yang membawa cahaya kembali ke kota ini."
                    : "Bayanganmu kini hanya menjadi bagian dari kabut abadi yang menyelimuti sisa-sisa reruntuhan kota terkutuk ini."}
                </p>
              </div>
            </div>

            <button onClick={nextStep} className="mt-4 px-10 py-4 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-blue-900/40 active:scale-95 transition-all">Nasib Penduduk Lain</button>
          </div>
        )}

        {/* STEP 3: FULL PLAYER LIST & RECAP */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
              <Users size={20} />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Arsip Penduduk Waranasura</h2>
            </div>
            
            <div className="grid gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {players.filter(p => p.role !== 'Moderator').map((p) => {
                const pRole = p.role.toLowerCase();
                const pIsAntagonist = pRole.includes('werewolf') || pRole.includes('warlock');
                const pIsWinner = isWargaWinner ? !pIsAntagonist : pIsAntagonist;

                return (
                  <div key={p.id} className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white uppercase text-sm tracking-tighter">{p.name}</span>
                        {p.status === 'dead' && <Skull size={10} className="text-slate-600" />}
                      </div>
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{p.role}</span>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${pIsWinner ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                      {pIsWinner ? 'Win' : 'Lose'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-6">
              <button 
                onClick={onLeave} 
                className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.4em] text-xs shadow-xl hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Home size={16} /> Keluar ke Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameOverScreen;