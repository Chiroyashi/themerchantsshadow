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

  // --- 3. LOGIKA LOBBY & START GAME ---
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setIsCopied(true);
    triggerNotif("Room Code disalin!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStartGame = async () => {
    if (players.length < 3) {
      triggerNotif("Minimal 3 pemain untuk memulai!");
      return;
    }
    
    // Lock Room: Set status menjadi playing agar JoinRoom menolak pemain baru
    const roomRef = ref(db, `rooms/${roomCode}`);
    await update(roomRef, { status: 'playing' });
    
    onStartGame(); // Panggil fungsi bawaan untuk membagikan role
  };

  // --- 4. LOGIKA IN-GAME ACTIONS ---
  const handleMoveToMorning = async () => {
    const deadPlayersThisNight = players.filter(p => p.status === 'dead' && p.role !== 'Moderator');
    const namesOfDead = deadPlayersThisNight.map(p => p.name);
    const deathData = { day: day, names: namesOfDead.length > 0 ? namesOfDead : ["TIDAK ADA"], timestamp: Date.now() };
    
    try {
      await set(ref(db, `rooms/${roomCode}/deadToday`), deathData);
      setTimeout(() => {
        onSetPhase("Pagi (Diskusi)");
        triggerNotif("Fase Pagi Dimulai!");
      }, 500);
    } catch (error) {
      console.error(error);
    }
  };

  const handleModeratorKill = (targetId, currentStatus) => {
    if (!targetId || targetId === "none") return;
    const currentNightActions = (nightHistory[`malam_${day}`] || nightHistory[`hari_${day}`]) || {};
    const isProtected = Object.values(currentNightActions).some(
      act => act.role.toLowerCase().includes('guard') && act.targetId === targetId && act.action === 'Jaga'
    );

    if (isProtected && currentStatus === 'alive') {
      setShowConfirm({ show: true, targetId, status: currentStatus, msg: "TARGET DILINDUNGI GUARD! Tetap eksekusi?" });
    } else {
      onKill(targetId, currentStatus);
      triggerNotif("Status diperbarui.");
    }
  };

  const handleWarlockRequest = (act) => {
    if (act.targetId !== "SISTEM_RANDOM") return act.targetName;
    const aliveMerchants = players.filter(p => p.role.toLowerCase().includes('pedagang') && p.status === 'alive');
    if (aliveMerchants.length === 0) return "PEDAGANG HABIS";
    const seed = act.timestamp || Date.now();
    const selected = aliveMerchants[seed % aliveMerchants.length];
    return `🛍️ SISTEM: ${selected.name.toUpperCase()}`;
  };

  const handleTimeSubmit = () => {
    const parts = timeInput.split(':');
    if (parts.length === 2) onEditTimer((parseInt(parts[0]) * 60) + parseInt(parts[1]));
    setIsEditing(false);
  };

  // --- RENDER TAMPILAN LOBBY ---
  if (isLobby) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
        {notification && (
          <div className="fixed top-4 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-2xl animate-in slide-in-from-top-4">
            {notification}
          </div>
        )}

        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Lobby Room</h1>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Menunggu Unit Tempur Terkumpul</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] text-center space-y-6 shadow-2xl">
            <div 
              onClick={handleCopyCode}
              className="bg-slate-950 border border-slate-800 p-6 rounded-2xl cursor-pointer hover:border-blue-500 transition-all group relative overflow-hidden"
            >
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2">Operational Code</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-4xl font-black tracking-[0.4em] text-white group-hover:text-blue-500 transition-colors">
                  {roomCode}
                </span>
                {isCopied ? <Check size={24} className="text-green-500" /> : <Copy size={20} className="text-slate-700 group-hover:text-blue-500" />}
              </div>
              {isCopied && <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black text-green-500 uppercase">Copied to Clipboard!</span>}
            </div>

            <div className="py-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Pemain Bergabung: {players.length - 1}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {players.filter(p => p.role !== 'Moderator').map(p => (
                  <div key={p.id} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-bold text-slate-300 animate-in zoom-in">
                    {p.name}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleStartGame}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Play size={20} fill="currentColor" /> Start Operation
            </button>
          </div>

          <button onClick={onExit} className="w-full text-slate-700 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-colors">Batalkan Room</button>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD UTAMA (IN-GAME) ---
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
            <button onClick={onResetTimer} className="p-4 bg-slate-800 rounded-2xl text-slate-400"><RefreshCw size={20} /></button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
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
                    <button onClick={() => handleModeratorKill(p.id, p.status)} className={`p-2.5 rounded-xl transition-all ${isDead ? 'bg-red-900/30 text-red-500' : 'bg-slate-800 text-slate-500'}`}>
                      {isDead ? <Skull size={18} /> : <Heart size={18} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6 h-fit">
          <div className="bg-slate-900 border border-purple-500/20 p-5 rounded-[2rem] shadow-2xl">
            <h2 className="text-[10px] font-black uppercase text-purple-400 mb-4 flex items-center gap-2 tracking-widest"><Moon size={14} /> Master Night Logs</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(nightHistory).reverse().map((malamKey) => (
                <div key={malamKey} className="space-y-2">
                  <span className="text-[8px] font-black bg-purple-950 text-purple-400 px-2 py-0.5 rounded uppercase">{malamKey.replace('_', ' ')}</span>
                  {Object.entries(nightHistory[malamKey]).map(([playerId, act]) => (
                    <div key={playerId} className="p-3 bg-slate-950 rounded-xl border border-slate-800 border-l-2 border-l-blue-500">
                       <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest">{act.role}</p>
                       <p className="text-[10px] font-bold text-white mt-1">{act.senderName} → {act.targetName}</p>
                       <div className="mt-2 text-[7px] font-black text-slate-500 uppercase">Action: {act.action}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <ChatRoom roomCode={roomCode} myId="host" myName="MODERATOR" players={players} isHost={true} />
        </div>
      </div>

      {showConfirm.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-red-600 rounded-[2rem] p-8 max-w-xs w-full text-center shadow-2xl">
            <ShieldAlert size={48} className="text-red-600 mx-auto mb-4" />
            <h3 className="text-white font-black uppercase text-lg leading-tight mb-2">Konfirmasi Eksekusi</h3>
            <p className="text-slate-400 text-[10px] leading-relaxed mb-8 uppercase font-bold tracking-widest">{showConfirm.msg}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm({ show: false })} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black text-[9px] uppercase">Batal</button>
              <button onClick={() => { onKill(showConfirm.targetId, showConfirm.status); setShowConfirm({ show: false }); triggerNotif("Target dieksekusi."); }} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[9px] uppercase">Ya, Bunuh</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeratorDashboard;