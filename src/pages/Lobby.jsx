import React, { useState } from 'react';
import { Users, Play, Copy, Check, AlertTriangle, ShieldCheck, XCircle, UserMinus, ChevronLeft, Eye, Shield, Crosshair, Wand2, Settings, Heart } from 'lucide-react';
import ClownIcon from '../components/ClownIcon';
import { useGameContext } from '../contexts/GameContext';
import { calculateRoles } from '../utils/roleBalancer';
import { isRoleActive } from '../utils/gameLogic';

const Lobby = ({ onBack }) => {
  const { roomCode, players, myPlayerId, isHost, handleStartGame, handleKickPlayer, roleSettings, handleToggleRole } = useGameContext();
  const [isCopied, setIsCopied] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // --- LOGIKA PEMBATASAN MINIMAL PEMAIN ---
  const minPlayers = 5;
  const participantsCount = players.filter(p => p.role !== 'Moderator').length;
  const isReady = participantsCount >= minPlayers;
  const roleConfig = calculateRoles(participantsCount, roleSettings);

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
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-red-600 tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-colors group-hover:text-red-500">
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
                Butuh <span className="text-white font-bold">{minPlayers - participantsCount} orang</span> lagi untuk menstabilkan gerbang Waranasura.
              </p>
            </div>
          </div>
        )}

        {/* --- ROLE PREVIEW AREA --- */}
        {participantsCount >= 5 && (
          <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-5 text-left relative overflow-hidden backdrop-blur-sm animate-in fade-in duration-500">
            <p className="text-slate-500 uppercase tracking-[0.2em] text-[8px] font-black italic mb-3">
              Prediksi Distribusi Peran ({participantsCount} Pemain)
            </p>
            <div className="flex flex-wrap gap-2">
              {roleConfig.antagonists.werewolf > 0 && (
                <span className="flex items-center gap-1 bg-red-950/40 border border-red-500/20 text-red-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                  🐺 Werewolf x{roleConfig.antagonists.werewolf}
                </span>
              )}
              {roleConfig.antagonists.warlock > 0 && (
                <span className="flex items-center gap-1 bg-purple-950/40 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                  🔮 Warlock x{roleConfig.antagonists.warlock}
                </span>
              )}
              {roleConfig.protagonists.hakim > 0 && (
                <span className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                  ⚖️ Hakim x{roleConfig.protagonists.hakim}
                </span>
              )}
              {roleConfig.protagonists.seer > 0 && (
                <span className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                  👁️ Seer x{roleConfig.protagonists.seer}
                </span>
              )}
              {roleConfig.protagonists.guard > 0 && (
                <span className="flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                  🛡️ Guard x{roleConfig.protagonists.guard}
                </span>
              )}
              {roleConfig.protagonists.hunter > 0 && (
                <span className="flex items-center gap-1 bg-orange-950/40 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                  🎯 Hunter x{roleConfig.protagonists.hunter}
                </span>
              )}
              {roleConfig.protagonists.lovers > 0 && (
                <span className="flex items-center gap-1 bg-pink-950/40 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                  💖 Lovers x{roleConfig.protagonists.lovers}
                </span>
              )}
              {roleConfig.protagonists.joker > 0 && (
                <span className="flex items-center gap-1 bg-green-950/40 border border-green-500/20 text-green-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                  🤡 Joker x{roleConfig.protagonists.joker}
                </span>
              )}
              {roleConfig.protagonists.pedagang > 0 && (
                <span className="flex items-center gap-1 bg-blue-950/40 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                  💼 Pedagang x{roleConfig.protagonists.pedagang}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ROLE SETTINGS BUTTON (HOST ONLY) */}
        {isHost && (
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-amber-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Settings size={14} /> Pengaturan Peran
          </button>
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
              {isReady ? `Total Pemain: ${participantsCount}` : `Min. ${minPlayers}`}
            </span>
          </div>
          
          <ul className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {[...players]
              .sort((a, b) => {
                if (a.id === myPlayerId) return -1;
                if (b.id === myPlayerId) return 1;

                const aIsMod = a.role === 'Moderator';
                const bIsMod = b.role === 'Moderator';
                if (aIsMod && !bIsMod) return -1;
                if (bIsMod && !aIsMod) return 1;

                const aTime = a.joinedAt || 0;
                const bTime = b.joinedAt || 0;
                if (aTime !== bTime) return aTime - bTime;
                return a.id.localeCompare(b.id);
              })
              .map((p) => {
                const isMe = p.id === myPlayerId;
                const isModerator = p.role === 'Moderator';
                const isHighlight = isMe && !isModerator;
                return (
                  <li
                    key={p.id}
                    className="flex justify-between items-center bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-white/5 hover:border-red-600/30 hover:bg-slate-950 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isModerator ? 'bg-red-600/20' : isHighlight ? 'bg-emerald-600/20' : 'bg-blue-600/20'
                      }`}>
                        <ShieldCheck size={20} className={
                          isModerator ? 'text-red-500' : isHighlight ? 'text-emerald-400' : 'text-blue-400'
                        } />
                      </div>

                      {/* Info */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Nama</span>
                        <span className={`font-black text-base truncate max-w-[160px] ${
                          isHighlight ? 'text-emerald-400' : 'text-white'
                        }`}>
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
                      {isMe && !isModerator && (
                        <span className="text-[8px] font-black bg-emerald-600/20 text-emerald-500 px-3 py-1.5 rounded-full border border-emerald-600/30 uppercase tracking-wide">
                          Anda
                        </span>
                      )}
                      {isHost && !isModerator ? (
                        <button
                          onClick={() => handleKickPlayer(p.id)}
                          className="p-3 hover:bg-red-600 text-slate-600 hover:text-white rounded-xl transition-all active:scale-90 group/kick"
                          title="Kick"
                        >
                          <UserMinus size={18} className="group-hover/kick:animate-pulse" />
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
              onClick={handleStartGame}
              disabled={!isReady}
              className={`w-full py-5 sm:py-6 font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-3 transition-all active:scale-95 rounded-[2rem] shadow-2xl
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
                  : `Summoning ${minPlayers - participantsCount} more souls...`}
               </p>
            </div>
          )}
        </div>

        {/* FOOTER INFO */}
        <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.5em]">
          Waranasura Chronicles • Secured Connection
        </p>
      </div>

      {/* ROLE SETTINGS POPUP MODAL (HOST ONLY) */}
      {showSettingsModal && isHost && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999]" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Settings size={18} className="text-amber-500" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Pengaturan Peran</h2>
            </div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight text-left">
              Wajib: Pedagang, Werewolf, Hakim. Konfigurasi sisa peran:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'Seer', label: 'Seer', icon: Eye },
                { key: 'Guard', label: 'Guard', icon: Shield },
                { key: 'Hunter', label: 'Hunter', icon: Crosshair },
                { key: 'Warlock', label: 'Warlock', icon: Wand2 },
                { key: 'Lovers', label: 'Lovers', icon: Heart },
                { key: 'Joker', label: 'Joker', icon: ClownIcon }
              ].map(r => {
                const isEnabled = isRoleActive(r.key, roleSettings, participantsCount);
                const Icon = r.icon;
                const isRecommended = (
                  (r.key === 'Seer' && participantsCount >= 5) ||
                  (r.key === 'Guard' && participantsCount >= 6) ||
                  (r.key === 'Hunter' && participantsCount >= 8) ||
                  (r.key === 'Warlock' && participantsCount >= 7) ||
                  (r.key === 'Lovers' && participantsCount >= 5) ||
                  (r.key === 'Joker' && participantsCount >= 6)
                );
                return (
                  <button
                    key={r.key}
                    onClick={() => handleToggleRole(r.key, !isEnabled)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer active:scale-95 ${
                      isEnabled
                        ? 'bg-blue-600/10 border-blue-500/30 text-white'
                        : 'bg-slate-950/40 border-transparent text-slate-500'
                    }`}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={isEnabled ? 'text-blue-400' : 'text-slate-600'} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{r.label}</span>
                      </div>
                      {isRecommended && (
                        <span className="text-[7px] font-black uppercase bg-emerald-600/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 mt-0.5">
                          Rekomendasi
                        </span>
                      )}
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                      isEnabled ? 'border-blue-500 bg-blue-500' : 'border-slate-750 bg-transparent'
                    }`}>
                      {isEnabled && <Check size={10} className="text-white font-black" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-colors cursor-pointer"
            >
              Tutup & Simpan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;