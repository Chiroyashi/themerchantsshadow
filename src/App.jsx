import React, { useState, useEffect } from 'react';
import { ref, set, onValue, push, update, onDisconnect, get } from "firebase/database"; 
import { db } from "./lib/firebase";
import { distributeRoles } from './utils/gameLogic';
import { AlertCircle, XCircle, Info, CheckCircle2 } from 'lucide-react';

// Import Pages
import LandingPage from './pages/LandingPage';
import Introduction from './pages/Introduction';
import Room from './pages/Room';
import Lobby from './pages/Lobby';
import ViewRole from './pages/ViewRole';
import ModeratorDashboard from './pages/ModeratorDashboard';
import GameBoard from './pages/GameBoard';

function App() {
  // --- 1. INISIALISASI STATE ---
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || localStorage.getItem('last_page') || 'landing';
  });
  
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('room_code') || '');
  const [isHost, setIsHost] = useState(() => localStorage.getItem('is_host') === 'true');
  const [myPlayerId, setMyPlayerId] = useState(() => localStorage.getItem('my_player_id') || null);
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('player_name') || '');
  
  // STATE TIMER GLOBAL (BENTENG ANTI-NaN & ANTI-00:00)
  const [globalPhase, setGlobalPhase] = useState("Pagi (Diskusi)");
  const [globalSeconds, setGlobalSeconds] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [notification, setNotification] = useState({
    show: false, title: "", message: "", type: "info", onConfirm: null
  });
  const [hasShownDestroyed, setHasShownDestroyed] = useState(false);

  const myData = players.find(p => p.id === myPlayerId);

  // --- 2. FUNGSI PEMBANTU ---
  const showNotif = (title, message, type = "info", onConfirm = null) => {
    setNotification({ show: true, title, message, type, onConfirm });
  };
  const closeNotif = () => setNotification(prev => ({ ...prev, show: false }));

  // --- 3. SYNC URL & LOCAL STORAGE ---
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '') || 'landing';
      setCurrentPage(hash);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (window.location.hash !== `#${currentPage}`) {
      window.history.pushState(null, '', `#${currentPage}`);
    }
    localStorage.setItem('last_page', currentPage);
    localStorage.setItem('room_code', roomCode);
    localStorage.setItem('is_host', isHost);
    localStorage.setItem('player_name', playerName);
    if (myPlayerId) localStorage.setItem('my_player_id', myPlayerId);
  }, [currentPage, roomCode, isHost, myPlayerId, playerName]);

  // --- 4. FIREBASE LISTENERS ---
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      if (data.players) {
        setPlayers(Object.entries(data.players).map(([id, val]) => ({ id, ...val })));
      }

      // SYNC TIMER DARI FIREBASE (DENGAN PENGECEKAN)
      if (data.timer) {
        setGlobalPhase(data.timer.phase || "Pagi (Diskusi)");
        setIsTimerActive(data.timer.isActive || false);
        
        const incomingSecs = parseInt(data.timer.seconds);
        if (!isNaN(incomingSecs)) {
          // Hanya update jika waktu > 0 atau sedang aktif, 
          // untuk mencegah loncatan ke 00:00 saat inisialisasi awal
          if (incomingSecs > 0 || data.timer.isActive) {
            setGlobalSeconds(incomingSecs);
          }
        }
      }
      
      if (data.status === "playing" && currentPage === "room-lobby") {
        setCurrentPage('view-role');
      }

      if (data.status === "destroyed" && !hasShownDestroyed) {
        setHasShownDestroyed(true); 
        showNotif("Room Dibubarkan", "Moderator telah menutup permainan ini.", "error");
        setTimeout(() => {
          localStorage.clear();
          window.location.hash = 'landing';
          window.location.reload();
        }, 3500);
      }
    });
    return () => unsubscribe();
  }, [roomCode, currentPage, hasShownDestroyed]);

  // LOGIKA HITUNG MUNDUR (GLOBAL INTERVAL)
  useEffect(() => {
    let interval = null;
    if (isTimerActive && globalSeconds > 0) {
      interval = setInterval(() => {
        setGlobalSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, globalSeconds]);

  // Listener Eksekusi Voting
  useEffect(() => {
    if (!roomCode) return;
    const execRef = ref(db, `rooms/${roomCode}/lastExecution`);
    const unsubscribe = onValue(execRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.timestamp > (Date.now() - 10000)) {
        const isPeaceful = data.victimName === "Tidak ada";
        showNotif(
          isPeaceful ? "Hasil Voting" : "Eksekusi Warga",
          isPeaceful ? "Warga memutuskan tidak ada eksekusi." : `Warga sepakat mengeksekusi ${data.victimName.toUpperCase()}.`,
          isPeaceful ? "success" : "error"
        );
      }
    });
    return () => unsubscribe();
  }, [roomCode]);

  // --- 5. HANDLERS ---
  const handleToggleTimer = (isActive, currentSeconds) => {
    if (!isHost) return;
    // JIKA MAU PLAY TAPI WAKTU HABIS (0), RESET KE 300 DULU OTOMATIS
    const secondsToSent = (currentSeconds <= 0 && !isActive) ? 300 : currentSeconds;
    
    update(ref(db, `rooms/${roomCode}/timer`), { 
      isActive: !isActive, 
      seconds: secondsToSent 
    });
  };

  const handleResetTimer = () => {
    if (!isHost) return;
    update(ref(db, `rooms/${roomCode}/timer`), { isActive: false, seconds: 300 });
  };

  const handleEditTimer = (newSeconds) => {
    if (!isHost) return;
    const cleanSecs = parseInt(newSeconds) || 0;
    update(ref(db, `rooms/${roomCode}/timer`), { seconds: Math.max(0, cleanSecs) });
  };

  const handleSetPhase = async (newPhase) => {
    if (!isHost) return;
    // Logika Auto-Kill (Tetap dipertahankan)
    if (globalPhase.toLowerCase().includes("siang") && newPhase.toLowerCase().includes("malam")) {
      const roomSnapshot = await get(ref(db, `rooms/${roomCode}`));
      const data = roomSnapshot.val();
      const votes = data.votes || {};
      const currentPlayers = Object.entries(data.players || {}).map(([id, val]) => ({ id, ...val }));
      const activePlayers = currentPlayers.filter(p => p.status !== 'dead' && p.role !== 'Moderator');
      const threshold = Math.floor(activePlayers.length / 2) + 1;
      const counts = {};
      Object.values(votes).forEach(targetId => {
        if (targetId !== 'skip') counts[targetId] = (counts[targetId] || 0) + 1;
      });
      const victimId = Object.keys(counts).find(id => counts[id] >= threshold);
      const victimName = victimId ? (currentPlayers.find(p => p.id === victimId)?.name || "Pemain") : "Tidak ada";
      await update(ref(db, `rooms/${roomCode}`), { lastExecution: { victimName, timestamp: Date.now() } });
      if (victimId) { await update(ref(db, `rooms/${roomCode}/players/${victimId}`), { status: "dead" }); }
    }

    const updates = {};
    updates[`rooms/${roomCode}/timer/phase`] = newPhase;
    updates[`rooms/${roomCode}/timer/isActive`] = false; 
    updates[`rooms/${roomCode}/timer/seconds`] = 300; // Reset ke 5 menit tiap ganti fase
    updates[`rooms/${roomCode}/votes`] = null; 
    update(ref(db), updates);
  };

  // ... sisa handler (handleCreateRoom, handleJoinRoom, dll) tetap sama ...
  const handleCreateRoom = (name) => {
    const finalName = name || "Moderator";
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hostId = "host_" + Date.now();
    set(ref(db, 'rooms/' + newCode), {
      status: "waiting", host: finalName,
      timer: { isActive: false, seconds: 300, phase: "Pagi (Diskusi)" },
      players: { [hostId]: { name: finalName + " (Moderator)", role: "Moderator", status: "alive" } }
    });
    setRoomCode(newCode); setMyPlayerId(hostId); setIsHost(true); setCurrentPage('room-lobby');
  };

  const handleJoinRoom = (code, inputName) => {
    const finalName = inputName || "Player";
    const playerRef = ref(db, `rooms/${code}/players`);
    const newPlayerRef = push(playerRef);
    const playerId = newPlayerRef.key;
    onDisconnect(ref(db, `rooms/${code}/players/${playerId}/status`)).set("dead");
    set(newPlayerRef, { name: finalName, role: "Pending", status: "alive" }).then(() => {
      setRoomCode(code); setMyPlayerId(playerId); setIsHost(false); setCurrentPage('room-lobby');
    });
  };

  const handleStartGame = () => {
    const playersWithRoles = distributeRoles(players);
    playersWithRoles.forEach(p => { update(ref(db, `rooms/${roomCode}/players/${p.id}`), { role: p.role }); });
    set(ref(db, `rooms/${roomCode}/status`), "playing");
  };

  const handleKillPlayer = (playerId, currentStatus) => {
    if (!isHost) return;
    update(ref(db, `rooms/${roomCode}/players/${playerId}`), { status: currentStatus === 'dead' ? 'alive' : 'dead' });
  };

  const handleExitGame = async () => {
    showNotif("Bubarkan Room?", "Semua data akan dihapus otomatis.", "confirm", async () => {
      try {
        setHasShownDestroyed(true); 
        await update(ref(db, `rooms/${roomCode}`), { status: "destroyed" });
        localStorage.clear(); window.location.hash = 'landing'; window.location.reload();
      } catch (error) { console.error(error); }
    });
  };

  // --- 6. KOMPONEN NOTIFIKASI ---
  const GameNotification = () => {
    if (!notification.show) return null;
    const icons = {
      info: <Info className="text-blue-500" size={40} />,
      error: <XCircle className="text-red-500" size={40} />,
      success: <CheckCircle2 className="text-emerald-500" size={40} />,
      confirm: <AlertCircle className="text-amber-500" size={40} />
    };
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center space-y-6 transform animate-in zoom-in-95 duration-300">
          <div className="flex justify-center">{icons[notification.type]}</div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{notification.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{notification.message}</p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            {notification.type === "confirm" ? (
              <div className="flex gap-2">
                <button onClick={closeNotif} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold uppercase text-[10px]">Batal</button>
                <button onClick={() => { notification.onConfirm(); closeNotif(); }} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold uppercase text-[10px] shadow-lg">Ya, Lanjut</button>
              </div>
            ) : (
              <button onClick={closeNotif} className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold uppercase text-[10px] shadow-lg">Dimengerti</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- 7. RENDER LOGIC ---
  const renderPage = () => {
    const timerProps = { seconds: globalSeconds, phase: globalPhase, isActive: isTimerActive };

    switch (currentPage) {
      case 'landing': return <LandingPage onNext={() => setCurrentPage('introduction')} />;
      case 'introduction': return <Introduction onNext={() => setCurrentPage('room-setup')} onBack={() => setCurrentPage('landing')} />;
      case 'room-setup': return <Room onCreate={handleCreateRoom} onJoin={handleJoinRoom} onBack={() => setCurrentPage('introduction')} />;
      case 'room-lobby': return <Lobby roomCode={roomCode} players={players} isHost={isHost} onStart={handleStartGame} onBack={() => setCurrentPage('room-setup')} />;
      case 'view-role':
        return isHost ? (
          <ModeratorDashboard 
            players={players} roomCode={roomCode} 
            onKill={handleKillPlayer} onExit={handleExitGame}
            onToggleTimer={handleToggleTimer} onResetTimer={handleResetTimer}
            onEditTimer={handleEditTimer} onSetPhase={handleSetPhase}
            {...timerProps}
          />
        ) : (
          <ViewRole 
            playerData={myData} roomCode={roomCode} 
            {...timerProps}
            onNext={() => setCurrentPage('game-board')} 
            onLeave={() => showNotif("Keluar?", "Statusmu akan jadi MATI.", "confirm", () => {
              update(ref(db, `rooms/${roomCode}/players/${myPlayerId}`), { status: "dead" });
              window.location.reload();
            })}
          />
        );
      case 'game-board': 
        return <GameBoard players={players} roomCode={roomCode} onBack={() => setCurrentPage('view-role')} {...timerProps} />;
      default: return <LandingPage onNext={() => setCurrentPage('introduction')} />;
    }
  };

  return (
    <div className="antialiased selection:bg-red-500/30">
      {renderPage()}
      <GameNotification />
    </div>
  );
}

export default App;