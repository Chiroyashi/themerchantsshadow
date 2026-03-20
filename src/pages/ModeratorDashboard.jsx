import React, { useState, useEffect } from 'react';
import { ref, onValue, set, update } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  Skull, Heart, Play, Pause, RefreshCw, Info, LogOut, 
  Sun, Sunset, Moon, Plus, Clock, Timer as TimerIcon,
  BarChart3, FastForward, ShieldAlert, ShoppingBag, Send, Sunrise, Shield, Copy, Check
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import ChatRoom from '../components/ChatRoom';

const ModeratorDashboard = ({ 
  players, roomCode, onKill, onExit, onStartGame,
  onToggleTimer, onResetTimer, onSetPhase, onEditTimer,
  seconds, phase, isActive, day 
}) => {
  const [votes, setVotes] = useState({});
  const [nightHistory, setNightHistory] = useState({}); 
  const [isEditing, setIsEditing] = useState(false);
  const [timeInput, setTimeInput] = useState("02:00");
  const [merchantClueInput, setMerchantClueInput] = useState("");
  
  // UI States
  const [showConfirm, setShowConfirm] = useState({ show: false, targetId: null, status: null, msg: "" });
  const [notification, setNotification] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const isLobby = phase === "Waiting";

  // --- 1. DATA CALCULATIONS ---
  const activePlayers = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator');
  const votesData = Object.values(votes);
  const killThreshold = Math.floor(activePlayers.length / 2) + 1;

  // --- 2. LISTENERS ---
  useEffect(() => {
    if (!roomCode) return;
    const votesRef = ref(db, `rooms/${roomCode}/votes`);
    onValue(votesRef, (snapshot) => setVotes(snapshot.val() || {}));

    const historyRef = ref(db, `rooms/${roomCode}/nightHistory`);
    onValue(historyRef, (snapshot) => setNightHistory(snapshot.val() || {}));

    if (!isEditing) {
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      setTimeInput(`${mins}:${secs}`);
    }
  }, [roomCode, seconds, isEditing]);

  const triggerNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- 3. LOGIKA WARLOCK & MERCHANT HELPERS ---
  const handleWarlockRequest = (act) => {
    if (act.targetId !== "SISTEM_RANDOM") return act.targetName;
    const aliveMerchants = players.filter(p => p.role.toLowerCase().includes('pedagang') && p.status === 'alive');
    if (aliveMerchants.length === 0) return "PEDAGANG HABIS";
    const seed = act.timestamp || Date.now();
    const selected = aliveMerchants[seed % aliveMerchants.length];
    return `🛍️ SISTEM: ${selected.name.toUpperCase()}`;
  };

  const sendMerchantClue = (pedagangId, pedagangName) => {
    if (!merchantClueInput) return triggerNotif("Isi clue dulu!");
    const clueRef = ref(db, `rooms/${roomCode}/merchantClues/${pedagangId}`);
    set(clueRef, { clue: merchantClueInput, from: "Moderator", timestamp: Date.now(), night: day })
      .then(() => { 
        triggerNotif(`Clue terkirim ke ${pedagangName}`);
        setMerchantClueInput(""); 
      });
  };

  // --- 4. LOGIKA GAME OVER (CHECK WINNER) ---
  const checkGameState = (updatedPlayers) => {
    const alive = updatedPlayers.filter(p => p.status === 'alive' && p.role !== 'Moderator');
    const antagonists = alive.filter(p => 
      p.role.toLowerCase().includes('werewolf') || 
      p.role.toLowerCase().includes('warlock')
    );

    if (antagonists.length === 0) {
      // WARGA MENANG
      update(ref(db, `rooms/${roomCode}`), { 
        status: 'ended', 
        winner: 'WARGA',
        endTime: Date.now() 
      });
      triggerNotif("GAME OVER: Antagonis Musnah!");
    } else if (antagonists.length >= (alive.length - antagonists.length)) {
      // WEREWOLF MENANG (Jika jumlah serigala >= warga)
      update(ref(db, `rooms/${roomCode}`), { 
        status: 'ended', 
        winner: 'WEREWOLF',
        endTime: Date.now() 
      });
      triggerNotif("GAME OVER: Waranasura Jatuh!");
    }
  };

  const handleModeratorKill = (targetId, currentStatus) => {
    if (!targetId || targetId === "none") return;
    
    // Eksekusi Kill via Props
    onKill(targetId, currentStatus);
    
    // Tunggu sebentar agar status 'dead' terupdate di local players, lalu cek kemenangan
    setTimeout(() => {
      const updatedPlayers = players.map(p => 
        p.id === targetId ? { ...p, status: currentStatus === 'alive' ? 'dead' : 'alive' } : p
      );
      checkGameState(updatedPlayers);
    }, 500);

    triggerNotif("Status Diperbarui");
  };

  const handleTimeSubmit = () => {
    const parts = timeInput.split(':');
    if (parts.length === 2) onEditTimer((parseInt(parts[0]) * 60) + parseInt(parts[1]));
    setIsEditing(false);
  };

  const handleMoveToMorning = async () => {
    const deadPlayersThisNight = players.filter(p => p.status === 'dead' && p.role !== 'Moderator');
    const namesOfDead = deadPlayersThisNight.map(p => p.name);
    const deathData = { day: day, names: namesOfDead.length > 0 ? namesOfDead : ["TIDAK ADA"], timestamp: Date.now() };
    await set(ref(db, `rooms/${roomCode}/deadToday`), deathData);
    setTimeout(() => onSetPhase("Pagi (Diskusi)"), 500);
  };

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-2xl animate-in slide-in-from-top-4">
          {notification}
        </div>
      )}

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-8 border-b border-slate-800 pb-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-black text-red-600 uppercase italic tracking-tighter">Command Center</h1>
            <p className="text-[10px] text-slate-500 font-mono mt-2 tracking-[0.2em]">ROOM: {roomCode} • HARI {day}</p>
          </div>
          <button onClick={onExit} className="px-4 py-2 bg-red-900/10 text-red-500 border border-red-900/30 rounded-lg hover:bg-red-900/20 text-[10px] font-black uppercase tracking-widest w-fit flex items-center gap-2">
            <LogOut size={14} /> Bubarkan
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl w-full lg:max-w-md space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={handleMoveToMorning} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${phase.includes("Pagi") ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'border-slate-800 text-slate-600'}`}>
              <Sunrise size={18} />
              <span className="text-[7px] font-black uppercase">Forensik</span>
            </button>
            <button onClick={() => onSetPhase("Siang (Voting)")} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${phase.includes("Siang") ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'border-slate-800 text-slate-600'}`}>
              <Sunset size={18} />
              <span className="text-[8px] font-black uppercase">Siang</span>
            </button>
            <button onClick={() => onSetPhase("Malam (Eksekusi)")} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${phase.includes("Malam") ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'border-slate-800 text-slate-600'}`}>
              <Moon size={18} />
              <span className="text-[8px] font-black uppercase">Malam</span>
            </button>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl relative overflow-hidden flex items-center justify-between gap-4">
             <button onClick={() => setIsEditing(true)} className="flex-1 aspect-square bg-slate-800 rounded-xl flex items-center justify-center text-slate-500"><TimerIcon size={20} /></button>
             <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
             <button onClick={() => onEditTimer(seconds + 60)} className="flex-1 aspect-square bg-blue-600/10 text-blue-500 border border-blue-600/20 rounded-xl flex flex-col items-center justify-center ml-2"><Plus size={20} /><span className="text-[8px] font-black">+1M</span></button>
             {isEditing && (
                <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center p-2 rounded-xl">
                  <input type="text" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} className="bg-transparent text-blue-500 text-3xl font-black w-full text-center outline-none font-mono" autoFocus />
                  <div className="flex gap-2 w-full mt-2">
                    <button onClick={() => setIsEditing(false)} className="flex-1 text-[8px] font-black text-slate-500 uppercase">Batal</button>
                    <button onClick={handleTimeSubmit} className="flex-[2] py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase">Confirm</button>
                  </div>
                </div>
             )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => onToggleTimer(isActive, seconds)} className={`flex-1 flex justify-center items-center gap-3 p-4 rounded-2xl font-black transition-all ${isActive ? 'bg-amber-600' : 'bg-green-700'}`}>
              {isActive ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
              <span className="uppercase text-xs">{isActive ? 'Pause' : 'Play'}</span>
            </button>
            <button onClick={onResetTimer} className="p-4 bg-slate-800 rounded-2xl text-slate-400 active:rotate-180 transition-transform duration-500"><RefreshCw size={20} /></button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center px-2">
            <span className="text-orange-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><BarChart3 size={14} /> Population Monitor</span>
            <span className="text-slate-600 text-[9px] font-black uppercase">Threshold: {killThreshold} Votes</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {players.filter(p => p.role !== 'Moderator').map((p) => {
              const voteCount = votesData.filter(v => v === p.id).length;
              const isDanger = voteCount >= killThreshold;
              const isDead = p.status === 'dead';

              return (
                <div key={p.id} className={`relative p-5 rounded-2xl border transition-all ${isDead ? 'bg-slate-950 opacity-40 grayscale' : isDanger ? 'bg-orange-900/10 border-orange-500 shadow-lg' : 'bg-slate-900 border-slate-800'}`}>
                  {voteCount > 0 && !isDead && (
                    <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-slate-950 flex items-center justify-center font-black text-xs ${isDanger ? 'bg-red-600 text-white animate-bounce' : 'bg-orange-500 text-slate-950'}`}>{voteCount}</div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`font-bold truncate ${isDead ? 'text-slate-600' : 'text-white'}`}>{p.name}</h3>
                      <p className="text-[10px] font-black uppercase text-blue-400">{p.role}</p>
                    </div>
                    <button onClick={() => handleModeratorKill(p.id, p.status)} className={`p-2.5 rounded-xl transition-all ${isDead ? 'bg-red-900/30 text-red-500' : 'bg-slate-800 text-slate-500 hover:bg-red-700 hover:text-white'}`}>
                      {isDead ? <Skull size={18} /> : <Heart size={18} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-purple-500/20 p-5 rounded-[2rem] shadow-2xl">
            <h2 className="text-[10px] font-black uppercase text-purple-400 mb-4 flex items-center gap-2 tracking-widest"><Moon size={14} /> Master Night Logs</h2>
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(nightHistory).length === 0 ? (
                <p className="text-[8px] text-slate-600 italic text-center py-10">Belum ada aktivitas.</p>
              ) : (
                Object.keys(nightHistory).reverse().map((malamKey) => (
                  <div key={malamKey} className="space-y-2 mb-4">
                    <span className="text-[9px] font-black bg-purple-950 text-purple-400 px-2 py-0.5 rounded uppercase">{malamKey.replace('_', ' ')}</span>
                    {Object.entries(nightHistory[malamKey]).map(([playerId, act]) => {
                      const isBeli = act.action.includes("TRANSAKSI");
                      const isAttackAction = act.role.toLowerCase().includes('werewolf') || act.action.includes("Gunakan Poison");
                      
                      const todaysActions = nightHistory[malamKey] || {};
                      const isTargetProtected = Object.values(todaysActions).some(
                        protectionAct => 
                          protectionAct.role.toLowerCase().includes('guard') && 
                          protectionAct.targetId === act.targetId && 
                          protectionAct.action === 'Jaga'
                      );

                      return (
                        <div key={playerId} className={`p-3 rounded-xl border border-l-4 animate-in slide-in-from-right-2 mb-2 ${isBeli ? 'bg-amber-900/10 border-amber-600' : 'bg-slate-950 border-slate-800 border-l-blue-500'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <p className="text-[7px] font-black uppercase text-blue-500">{act.role}</p>
                              {isAttackAction && isTargetProtected && (
                                <div className="flex items-center gap-1 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                                  <Shield size={8} className="text-blue-400" />
                                  <span className="text-[6px] font-black text-blue-400 uppercase">Protected</span>
                                </div>
                              )}
                            </div>
                            
                            {!isBeli && isAttackAction && !isTargetProtected && (
                              <button 
                                onClick={() => {
                                  const targetPlayer = players.find(p => p.id === act.targetId);
                                  if (targetPlayer) handleModeratorKill(act.targetId, targetPlayer.status);
                                }}
                                className="p-1.5 bg-red-600/20 text-red-500 rounded-lg border border-red-500/30 hover:bg-red-600 hover:text-white transition-all active:scale-90"
                              >
                                <Skull size={10} />
                              </button>
                            )}
                            
                            {isBeli && <span className="text-[7px] bg-amber-600 text-white px-1 rounded animate-pulse">PENDING CLUE</span>}
                          </div>
                          
                          <p className="text-[10px] font-bold text-white mt-1 leading-tight">
                            {act.senderName} → <span className={isBeli ? "text-amber-400" : (isTargetProtected ? "text-blue-400" : isAttackAction ? "text-red-500" : "text-white")}>
                              {isBeli ? "Pedagang Gelap" : act.targetName}
                            </span>
                          </p>

                          {isBeli && (
                            <div className="mt-3 p-2 bg-slate-900 rounded-lg space-y-2 border border-amber-500/20">
                              <p className="text-[7px] font-black text-amber-500 uppercase tracking-widest">
                                Pedagang: {handleWarlockRequest(act)}
                              </p>
                              <div className="flex gap-1">
                                <input 
                                  type="text" 
                                  placeholder="Isi clue..." 
                                  className="flex-1 bg-black border border-slate-700 p-2 rounded text-[9px] text-white outline-none focus:border-amber-500"
                                  value={merchantClueInput}
                                  onChange={(e) => setMerchantClueInput(e.target.value)}
                                />
                                <button 
                                  onClick={() => {
                                    const result = handleWarlockRequest(act);
                                    const merchantName = result.split(": ")[1];
                                    const merchantObj = players.find(p => p.name.toUpperCase() === merchantName);
                                    if(merchantObj) sendMerchantClue(merchantObj.id, merchantObj.name);
                                  }}
                                  className="bg-amber-600 p-2 rounded hover:bg-amber-500 transition-colors"
                                >
                                  <Send size={12} className="text-white" />
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="mt-2 text-[7px] font-black text-slate-500 uppercase tracking-tighter">Action: {act.action}</div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
          <ChatRoom roomCode={roomCode} myId="host" myName="MODERATOR" players={players} isHost={true} />
        </div>
      </div>
    </div>
  );
};

export default ModeratorDashboard;