import React, { useState, useEffect } from 'react';
import { Trophy, Skull, Home, Users, ScrollText, Sparkles, Sunrise, Moon, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const getRoleVisuals = (roleName) => {
  const r = roleName?.toLowerCase() || "";
  if (r.includes('werewolf')) {
    return { emoji: "🐺", textColor: "text-red-500", bgColor: "bg-red-950/30", borderColor: "border-red-500/20" };
  }
  if (r.includes('warlock')) {
    return { emoji: "🔮", textColor: "text-purple-400", bgColor: "bg-purple-950/30", borderColor: "border-purple-500/20" };
  }
  if (r.includes('seer')) {
    return { emoji: "👁️", textColor: "text-emerald-400", bgColor: "bg-emerald-950/30", borderColor: "border-emerald-500/20" };
  }
  if (r.includes('guard')) {
    return { emoji: "🛡️", textColor: "text-cyan-400", bgColor: "bg-cyan-950/30", borderColor: "border-cyan-500/20" };
  }
  if (r.includes('hakim')) {
    return { emoji: "⚖️", textColor: "text-amber-400", bgColor: "bg-amber-950/30", borderColor: "border-amber-500/20" };
  }
  if (r.includes('hunter')) {
    return { emoji: "🎯", textColor: "text-orange-400", bgColor: "bg-orange-950/30", borderColor: "border-orange-500/20" };
  }
  if (r.includes('joker')) {
    return { emoji: "🤡", textColor: "text-green-400", bgColor: "bg-green-950/30", borderColor: "border-green-500/20" };
  }
  if (r.includes('lovers')) {
    return { emoji: "💖", textColor: "text-pink-400", bgColor: "bg-pink-950/30", borderColor: "border-pink-500/20" };
  }
  return { emoji: "💼", textColor: "text-blue-400", bgColor: "bg-blue-950/30", borderColor: "border-blue-500/20" };
};

export const isPlayerWinner = (player, winner) => {
  if (!player || !winner) return false;
  const roleLower = player.role?.toLowerCase() || "";

  if (winner === 'JOKER') {
    return roleLower === 'joker';
  }
  if (roleLower === 'joker') {
    return false;
  }
  if (roleLower === 'lovers') {
    const loversTeam = player.loversTeam;
    if (!loversTeam) return false;
    return winner === loversTeam;
  }

  const isAntagonist = roleLower.includes('werewolf') || roleLower.includes('warlock');
  return winner === 'WARGA' ? !isAntagonist : (winner === 'SERIGALA' ? isAntagonist : false);
};

const getPlayerAchievement = (player, allPlayers, winner) => {
  const roleLower = player.role?.toLowerCase() || "";
  const isTeamWinner = isPlayerWinner(player, winner);
  const isAlive = player.status === 'alive';
  const isAntagonist = roleLower.includes('werewolf') || roleLower.includes('warlock');

  if (player.role === 'Moderator') return null;

  // Khusus Joker
  if (roleLower === 'joker') {
    if (winner === 'JOKER') {
      return { title: "Master of Chaos 🤡", desc: "Berhasil memanipulasi warga ke tiang gantungan" };
    }
    return { title: "Failed Prank 🃏", desc: "Gagal dieksekusi di tiang gantungan" };
  }

  // Khusus Lovers
  if (roleLower === 'lovers') {
    if (isTeamWinner) {
      return { title: "Endless Love 💖", desc: "Cinta abadi yang menang bersama pasangannya" };
    }
    return { title: "Broken Heart 💔", desc: "Kisah cinta tragis di Waranasura" };
  }

  // 1. Last Stand: Only survivor of the winning team
  const aliveWinningTeam = allPlayers.filter(p => {
    return isPlayerWinner(p, winner) && p.status === 'alive' && p.role !== 'Moderator';
  });

  if (isTeamWinner && isAlive && aliveWinningTeam.length === 1) {
    return { title: "Last Stand 🎖️", desc: "Satu-satunya pemenang yang bertahan hidup" };
  }

  // 2. Silent Threat: Antagonist who survived
  if (isAntagonist && isAlive) {
    return { title: "Silent Threat 🤫", desc: "Serigala berbulu domba yang selamat" };
  }

  // 3. Survivor: Surviving protagonist
  if (!isAntagonist && isAlive) {
    return { title: "Survivor 🛡️", desc: "Berhasil bertahan hidup hingga fajar tiba" };
  }

  // 4. Martyr: Dead winning protagonist/antagonist (won the game but died)
  if (isTeamWinner && !isAlive) {
    return { title: "Martyr 🕊️", desc: "Gugur demi kemenangan tim" };
  }

  // 5. Fallen: Lost the game and died
  if (!isAlive) {
    return { title: "Fallen ☠️", desc: "Jiwanya kini beristirahat di Waranasura" };
  }

  return null;
};

const GameOverScreen = ({ winner, players, playerData, onLeave }) => {
  useEffect(() => { lockScroll(); return () => unlockScroll(); }, []);
  const [step, setStep] = useState(2);
  const isJokerWinner = winner === 'JOKER';
  const isWargaWinner = winner === 'WARGA';

  // Logika Menang/Kalah Personal
  const myRole = playerData?.role?.toLowerCase() || "";
  const isIWinner = isPlayerWinner(playerData, winner);

  const nextStep = () => setStep(s => s + 1);

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 text-center font-sans overflow-hidden" style={{ zIndex: Z_LAYER.GAME_OVER }}>
      {/* Dynamic Background Ambience */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] ${isJokerWinner ? 'bg-green-600' : isWargaWinner ? 'bg-blue-600' : 'bg-red-900'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] ${isJokerWinner ? 'bg-emerald-500' : isWargaWinner ? 'bg-amber-500' : 'bg-purple-900'}`} />
      </div>

      <div className="max-w-md w-full relative">
        {/* STEP 2: PERSONAL FATE (YOU WIN/LOSE) */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-2">
              <div className={`text-[10px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-full inline-block mx-auto mb-3 ${
                isJokerWinner
                  ? 'bg-green-600/10 text-green-400 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                  : isWargaWinner
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                    : 'bg-red-600/10 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              }`}>
                {isJokerWinner ? "Joker Menang (Solo Victory)" : isWargaWinner ? "Tim Penduduk Menang" : "Tim Werewolf Menang"}
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
                  ? (isJokerWinner ? 'text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]' : isWargaWinner ? 'text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]')
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
                    ? (isJokerWinner
                        ? "Tawa terbahak-bahakmu menggema di tiang gantungan. Seluruh warga dan serigala telah kau perdaya dalam lelucon abadimu!"
                        : "Namamu akan terukir dalam sejarah Waranasura sebagai pahlawan yang membawa cahaya kembali ke kota ini.")
                    : (myRole === 'joker'
                        ? "Leluconmu gagal memikat panggung tiang gantungan. Kamu gugur tanpa mencapai tawa terakhirmu."
                        : "Bayanganmu kini hanya menjadi bagian dari kabut abadi yang menyelimuti sisa-sisa reruntuhan kota terkutuk ini.")}
                </p>
              </div>
            </div>

            <button onClick={nextStep} className="mt-4 px-10 py-4 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-blue-900/40 active:scale-95 transition-all">Lihat Peran?</button>
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
                const pIsWinner = isPlayerWinner(p, winner);
                const isDead = p.status === 'dead';
                const rVisuals = getRoleVisuals(p.role);

                return (
                  <div
                    key={p.id}
                    className={`bg-slate-900/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300 ${
                      isDead ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Role Avatar box */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${rVisuals.bgColor} ${rVisuals.borderColor}`}>
                        <span className="text-lg">{rVisuals.emoji}</span>
                      </div>

                      {/* Info */}
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-black uppercase text-sm tracking-tighter ${
                            isDead ? 'text-slate-400 line-through' : 'text-white'
                          }`}>
                            {p.name}
                          </span>
                          {isDead && (
                            <span className="inline-flex items-center bg-red-950/30 border border-red-500/20 text-red-500 text-[7px] font-black uppercase px-2 py-0.5 rounded-md">
                              DEAD
                            </span>
                          )}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${rVisuals.textColor}`}>
                          {p.role}
                        </span>
                        {/* Achievement Badge */}
                        {(() => {
                          const achievement = getPlayerAchievement(p, players, winner);
                          if (!achievement) return null;
                          return (
                            <div className="mt-1">
                              <span
                                className="inline-block text-[7.5px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider"
                                title={achievement.desc}
                              >
                                {achievement.title}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Win/Lose Badge */}
                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-md ${
                      pIsWinner
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-emerald-950/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-rose-950/20'
                    }`}>
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