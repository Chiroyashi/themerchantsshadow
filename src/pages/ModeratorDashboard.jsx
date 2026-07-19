import React, { useState, useEffect } from 'react';
import { ref, onValue, set, update } from "firebase/database";
import { db } from "../lib/firebase";
import {
  Skull, Heart, Play, Pause, RefreshCw, LogOut, User,
  Sunrise, Sunset, Moon, Users, MessageSquare, X, Clock, BarChart3, Edit3, Check, Trophy, Send, ScrollText, AlertTriangle
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import ChatRoom from '../components/ChatRoom';
import { useGameContext } from '../contexts/GameContext';
import { useTimerContext } from '../contexts/TimerContext';
import { useNotification } from '../contexts/NotificationContext';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const ModeratorDashboard = () => {
  const {
    players, roomCode, isHost, handleKillPlayer,
    handleDestroyRoom, handleEndGame
  } = useGameContext();
  const {
    seconds, phase, isActive, day,
    toggleTimer, resetTimer, editTimer, handleSetPhase
  } = useTimerContext();
  const { showNotif } = useNotification();
  const [votes, setVotes] = useState({});
  const [nightHistory, setNightHistory] = useState({}); 

  // State untuk Edit Waktu
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState("");

  const [showEndGame, setShowEndGame] = useState(false);
  
  // State untuk clue pedaganng
  const [clueInput, setClueInput] = useState("");
  const [selectedPedagang, setSelectedPedagang] = useState("");
  const [merchantTransaksi, setMerchantTransaksi] = useState({});
  const [showCluePopup, setShowCluePopup] = useState(false);
  const [currentTransactionKey, setCurrentTransactionKey] = useState(null);
  const [clueSent, setClueSent] = useState({});

  // State untuk notif toast
  const [notifMsg, setNotifMsg] = useState(null);
  const triggerNotif = (msg, type = 'info') => {
    setNotifMsg({ msg, type });
    setTimeout(() => setNotifMsg(null), 4000);
  };

  // Scroll lock for end game modal
  useEffect(() => {
    if (showEndGame) { lockScroll(); return () => unlockScroll(); }
  }, [showEndGame]);

  // Scroll lock for clue popup
  useEffect(() => {
    if (showCluePopup) { lockScroll(); return () => unlockScroll(); }
  }, [showCluePopup]);

  const activePlayers = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator');
  const votesData = Object.values(votes);
  const killThreshold = Math.floor(activePlayers.length / 2) + 1;
  
  const pedagangers = players.filter(p => p.role === 'Pedagang' && p.status !== 'dead');
  const warlocks = players.filter(p => p.role === 'Warlock' && p.status !== 'dead');
  const currentNightHistory = nightHistory[`malam_${day}`] || nightHistory[`hari_${day}`] || {};
  const currentTransactions = merchantTransaksi[`malam_${day}`] || {};
  
  const pendingTransactions = Object.keys(currentTransactions).filter(
    key => !clueSent[`malam_${day}_${key}`]
  );
  const hasUnsentClue = pendingTransactions.length > 0;

  useEffect(() => {
    if (!roomCode) return;

    const votesRef = ref(db, `rooms/${roomCode}/votes`);
    const unsubscribeVotes = onValue(votesRef, (snapshot) => setVotes(snapshot.val() || {}));

    const historyRef = ref(db, `rooms/${roomCode}/nightHistory`);
    const unsubscribeHistory = onValue(historyRef, (snapshot) => setNightHistory(snapshot.val() || {}));

    const transaksiRef = ref(db, `rooms/${roomCode}/merchantTransaksi`);
    const unsubscribeTransaksi = onValue(transaksiRef, (snapshot) => setMerchantTransaksi(snapshot.val() || {}));

    const cluesRef = ref(db, `rooms/${roomCode}/merchantClues`);
    const unsubscribeClues = onValue(cluesRef, (snapshot) => {
      const clues = snapshot.val() || {};
      const sent = {};
      Object.entries(clues).forEach(([merchantId, clueData]) => {
        if (clueData.day === day) {
          sent[`malam_${day}_${clueData.transactionKey}`] = true;
        }
      });
      setClueSent(sent);
    });

    return () => { unsubscribeVotes(); unsubscribeHistory(); unsubscribeTransaksi(); unsubscribeClues(); };
  }, [roomCode, day]);

  useEffect(() => {
    if (hasUnsentClue && !showCluePopup) {
      const firstKey = pendingTransactions[0];
      setCurrentTransactionKey(firstKey);
      const tx = currentTransactions[firstKey];
      if (tx) {
        setSelectedPedagang(tx.merchantId);
        setClueInput("");
        setShowCluePopup(true);
      }
    }
  }, [hasUnsentClue, pendingTransactions, currentTransactions, day]);

  const handleTimeSubmit = () => {
    const totalSeconds = parseInt(timeInput) * 60;
    if (!isNaN(totalSeconds) && totalSeconds > 0) {
      editTimer(totalSeconds);
      setIsEditingTime(false);
      setTimeInput("");
    }
  };

  const handleMoveToMorning = async () => {
    if (typeof handleSetPhase === 'function') {
      await handleSetPhase("Pagi (Diskusi)");
    }
    // handleSetPhase("Pagi") sudah panggil processNightResults + nulis deadToday
    // Tidak perlu nulis deadToday lagi — itu double-write
  };

  const handleEndGameClick = (winner) => {
    handleEndGame(winner);
    setShowEndGame(false);
  };

  const handleSendClue = async () => {
    if (!selectedPedagang || !clueInput.trim() || !currentTransactionKey) return;
    
    await set(ref(db, `rooms/${roomCode}/merchantClues/${selectedPedagang}`), {
      message: clueInput.trim(),
      from: "Moderator",
      day,
      timestamp: Date.now(),
      transactionKey: currentTransactionKey
    });
    
    setClueSent(prev => ({ ...prev, [`malam_${day}_${currentTransactionKey}`]: true }));
    setClueInput("");
    triggerNotif("Clue berhasil dikirim ke pedagang!", "success");
    
    const remainingPending = pendingTransactions.filter(k => k !== currentTransactionKey);
    if (remainingPending.length > 0) {
      const nextKey = remainingPending[0];
      setCurrentTransactionKey(nextKey);
      const nextTx = currentTransactions[nextKey];
      if (nextTx) {
        setSelectedPedagang(nextTx.merchantId);
        setClueInput("");
      }
    } else {
      setShowCluePopup(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* END GAME MODAL */}
      {showEndGame && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: Z_LAYER.ACTION_MODAL }}>
          <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in duration-300">
            <Trophy className="w-12 h-12 md:w-16 md:h-16 mx-auto text-amber-500" />
            <h2 className="text-lg md:text-xl font-black text-white uppercase italic">Pilih Pemenang</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <button onClick={() => handleEndGameClick('WARGA')} className="p-4 md:p-6 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase text-xs md:text-sm transition-all active:scale-95">
                Warga<br/><span className="text-xs opacity-70">Waras</span>
              </button>
              <button onClick={() => handleEndGameClick('SERIGALA')} className="p-4 md:p-6 bg-red-600 hover:bg-red-500 rounded-2xl font-black uppercase text-xs md:text-sm transition-all active:scale-95">
                Serigala<br/><span className="text-xs opacity-70">Kejam</span>
              </button>
            </div>
            <button onClick={() => setShowEndGame(false)} className="text-slate-500 hover:text-white text-sm font-bold">Batal</button>
          </div>
        </div>
      )}

      {/* 1. HEADER */}
      <header className="p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-red-600 uppercase italic tracking-tighter">Command Center</h1>
            <p className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Room: {roomCode} • Day {day}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowEndGame(true)} className="p-2.5 bg-amber-600 text-white border border-amber-500 rounded-xl hover:bg-amber-500 transition-colors">
              <Trophy size={18} />
            </button>
            <button onClick={() => {
              showNotif("Bubarkan Room", "Semua data akan dihapus. Lanjutkan?", "confirm", handleDestroyRoom);
            }} className="p-2.5 bg-red-900/10 text-red-500 border border-red-900/30 rounded-xl">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-6 pb-20">
        
        {/* 2. PHASE BUTTONS */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          <button onClick={handleMoveToMorning} className={`flex flex-col items-center p-2 sm:p-3 rounded-2xl border transition-all ${phase.includes("Pagi") ? 'bg-amber-600 border-amber-500 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
            <Sunrise size={18} /><span className="text-[6px] sm:text-[7px] font-black uppercase mt-0.5 sm:mt-1">Forensik</span>
          </button>
          <button onClick={() => handleSetPhase("Siang (Voting)")} className={`flex flex-col items-center p-2 sm:p-3 rounded-2xl border transition-all ${phase.includes("Siang") ? 'bg-orange-600 border-orange-500 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
            <Sunset size={18} /><span className="text-[6px] sm:text-[7px] font-black uppercase mt-0.5 sm:mt-1">Voting</span>
          </button>
          <button onClick={() => handleSetPhase("Malam (Eksekusi)")} className={`flex flex-col items-center p-2 sm:p-3 rounded-2xl border transition-all ${phase.includes("Malam") ? 'bg-purple-600 border-purple-500 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
            <Moon size={18} /><span className="text-[6px] sm:text-[7px] font-black uppercase mt-0.5 sm:mt-1">Malam</span>
          </button>
        </div>

        {/* 3. IMPROVED TIMER CARD */}
        <section className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-4 sm:p-6 shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-4">
            
            {/* Timer Display - Full width */}
            {isEditingTime ? (
              <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                {/* Quick Presets */}
                <div className="flex gap-2 flex-wrap justify-center">
                  {[1, 2, 3, 5].map(m => (
                    <button 
                      key={m} 
                      onClick={() => setTimeInput(String(m))}
                      className={`px-4 py-2 rounded-full text-xs font-black uppercase transition-all ${timeInput === String(m) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                    >
                      {m} mnt
                    </button>
                  ))}
                </div>
                {/* Manual Input */}
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Menit" 
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="w-24 bg-slate-950 border border-blue-500/30 rounded-xl px-4 py-2 text-center text-2xl font-black text-white outline-none"
                  />
                  <button onClick={handleTimeSubmit} className="p-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500">
                    <Check size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
              </div>
            )}

            {/* Play/Pause & Reset & Edit Row */}
            <div className="flex gap-2">
              <button 
                onClick={toggleTimer}
                className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs transition-all active:scale-95 ${isActive ? 'bg-amber-600 text-white' : 'bg-green-600 text-white shadow-lg shadow-green-900/20'}`}
              >
                {isActive ? <><Pause size={18} fill="currentColor" /> Pause</> : <><Play size={18} fill="currentColor" /> Start</>}
              </button>
              <button 
                onClick={resetTimer}
                className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw size={20} />
              </button>
              <button 
                onClick={() => setIsEditingTime(!isEditingTime)}
                className={`p-4 rounded-2xl transition-colors ${isEditingTime ? 'bg-red-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-blue-400'}`}
              >
                <Clock size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* 4. POPULATION MONITOR */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> Population ({activePlayers.length})
            </h2>
            <div className="bg-slate-900 px-3 py-1 rounded-full border border-white/5">
               <span className="text-slate-400 text-[8px] font-black uppercase">Threshold: {killThreshold}V</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {players.filter(p => p.role !== 'Moderator').map((p) => {
              const voteCount = votesData.filter(v => v === p.id).length;
              const isDead = p.status === 'dead';
              return (
                <div key={p.id} className={`p-4 sm:p-5 rounded-[2rem] border transition-all ${isDead ? 'bg-black/40 border-slate-900 opacity-50' : 'bg-slate-900 border-white/5 shadow-xl'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDead ? 'bg-slate-800' : 'bg-red-900/20'}`}>
                        {isDead ? <Skull size={22} className="text-slate-600" /> : <User size={22} className="text-red-400" />}
                      </div>
                      <div className="truncate">
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Username</p>
                        <p className={`font-black text-lg truncate ${isDead ? 'text-slate-600' : 'text-white'}`}>{p.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleKillPlayer(p.id, p.status)}
                      className={`p-2.5 rounded-xl transition-all ${isDead ? 'bg-red-900/20 text-red-500' : 'bg-slate-950 text-slate-600 hover:text-red-500'}`}
                    >
                      {isDead ? <Skull size={18} /> : <Heart size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <p className={`text-[10px] font-black uppercase tracking-wide ${isDead ? 'text-red-700' : 'text-blue-400'}`}>{p.role}</p>
                    {isDead && <span className="text-[10px] font-bold text-red-700">☠️ ELIMINATED</span>}
                  </div>
                  {voteCount > 0 && !isDead && (
                    <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-white/5 mt-3">
                       <div className="h-1.5 flex-1 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: `${(voteCount/killThreshold)*100}%` }} />
                       </div>
                       <span className="text-[10px] font-black text-orange-500">{voteCount}V</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* INLINE LOG - Action History & Clue Sender */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <ScrollText size={14} /> Riwayat Aksi
            </h2>
          </div>

          {/* CLUE SENDER - POPUP BUTTON */}
          {pendingTransactions.length > 0 && (
            <button 
              onClick={() => {
                const firstKey = pendingTransactions[0];
                setCurrentTransactionKey(firstKey);
                const tx = currentTransactions[firstKey];
                if (tx) {
                  setSelectedPedagang(tx.merchantId);
                  setClueInput("");
                  setShowCluePopup(true);
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-yellow-500 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 animate-pulse"
            >
              <AlertTriangle size={18} />
              Kirim Clue ke Pedagang ({pendingTransactions.length} Menunggu)
            </button>
          )}

          {/* ACTION LOGS */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-2 max-h-64 overflow-y-auto">
            {Object.keys(nightHistory).length === 0 ? (
              <p className="text-[9px] text-slate-600 italic text-center py-4">Belum ada aksi tercatat.</p>
            ) : (
              Object.entries(nightHistory).sort((a, b) => b[0].localeCompare(a[0])).map(([period, actions]) => {
                const periodLabel = period.includes('malam') ? '🌙 Malam' : '☀️ Hari';
                return (
                  <div key={period}>
                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-600 mb-1">{periodLabel}</p>
                    <div className="space-y-1">
                      {Object.values(actions).map((action, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[9px]">
                          <span className={`px-1.5 py-0.5 rounded text-[6px] font-black uppercase ${
                            action.role === 'Warlock' ? 'bg-purple-600 text-white' :
                            action.role === 'Werewolf' ? 'bg-red-600 text-white' :
                            action.role === 'Pedagang' ? 'bg-emerald-600 text-white' :
                            action.role === 'Hakim' ? 'bg-amber-600 text-white' :
                            action.role === 'Seer' ? 'bg-purple-400 text-white' :
                            action.role === 'Guard' ? 'bg-blue-600 text-white' :
                            action.role === 'Hunter' ? 'bg-orange-600 text-white' :
                            'bg-slate-600 text-white'
                          }`}>{action.role}</span>
                          <span className="text-slate-300 font-bold">{action.senderName}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-blue-400">{action.action}</span>
                          {action.targetName && action.targetName !== "Skip" && (
                            <span className="text-amber-400">→ {action.targetName}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <ChatRoom roomCode={roomCode} myId="host" myName="MODERATOR" players={players} isHost={true} />

      {/* NOTIF TOAST */}
      {notifMsg && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-bottom-5 ${
          notifMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
        }`}>
          {notifMsg.msg}
        </div>
      )}

      {/* CLUE POPUP MODAL */}
      {showCluePopup && currentTransactionKey && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: Z_LAYER.ACTION_MODAL }}>
          <div className="bg-gradient-to-br from-amber-700 to-yellow-600 rounded-[2rem] p-1 w-full max-w-sm md:max-w-lg shadow-2xl shadow-amber-900/50">
            <div className="bg-slate-900 rounded-[1.8rem] p-4 md:p-6 space-y-4">
              <div className="text-center space-y-2">
                <AlertTriangle size={32} className="mx-auto text-amber-500" />
                <h2 className="text-lg md:text-xl font-black text-white uppercase italic">Transaksi Terdeteksi</h2>
                <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest">Warlock telah membeli ke Pedagang</p>
              </div>

              {/* Warlock Info */}
              <div className="bg-slate-950/50 border border-purple-500/30 rounded-xl p-3 md:p-4 space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-purple-400">Warlock (Pembeli)</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-1 rounded-lg text-[8px] font-black uppercase bg-purple-600 text-white">Warlock</span>
                  <span className="text-white font-bold text-sm md:text-base">{currentTransactions[currentTransactionKey]?.warlock}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[9px] md:text-[10px]">
                  <span className="text-slate-500">Item:</span>
                  <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${
                    currentTransactions[currentTransactionKey]?.item === 'poison' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
                  }`}>
                    {currentTransactions[currentTransactionKey]?.item === 'poison' ? '☠️ Poison' : '👁️ Vision'}
                  </span>
                  <span className="text-slate-500">→</span>
                  <span className="text-amber-400">{currentTransactions[currentTransactionKey]?.targetName}</span>
                </div>
              </div>

              {/* Clue Input */}
              <div className="space-y-2">
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-amber-500">Pesan Clue untuk Pedagang</p>
                <textarea 
                  value={clueInput}
                  onChange={(e) => setClueInput(e.target.value)}
                  placeholder="Contoh: Ada yang mencurigakan di kelompok tersebut..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs md:text-sm text-white h-20 md:h-24 resize-none"
                />
              </div>

              {/* Pedagang Target */}
              <div className="bg-slate-950/50 border border-emerald-500/30 rounded-xl p-3 space-y-1">
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500">Pedagang Terpilih (Sistem)</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-1 rounded-lg text-[8px] font-black uppercase bg-emerald-600 text-white">Pedagang</span>
                  <span className="text-emerald-400 font-bold text-sm md:text-base">{currentTransactions[currentTransactionKey]?.merchantName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button 
                  onClick={handleSendClue}
                  disabled={!clueInput.trim()}
                  className="flex-1 py-3 bg-amber-600 disabled:bg-slate-800 rounded-xl font-black uppercase text-xs md:text-sm shadow-lg hover:bg-amber-500 transition-colors"
                >
                  Kirim Clue
                </button>
                <button 
                  disabled
                  className="py-3 px-4 bg-slate-800 rounded-xl font-black uppercase text-xs md:text-sm text-slate-600 cursor-not-allowed"
                >
                  Wajib Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ModeratorDashboard;