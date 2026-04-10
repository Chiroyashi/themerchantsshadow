import React, { useState, useEffect } from 'react';
import { ref, set, onValue, push, update, get } from "firebase/database"; 
import { db } from "./lib/firebase";
import { distributeRoles } from './utils/gameLogic';
import { cleanupOldRooms, deleteRoom } from './utils/dbCleanup';
import { AlertCircle, XCircle, Info, CheckCircle2 } from 'lucide-react';

// Import Pages
import LandingPage from './pages/LandingPage';
import Introduction from './pages/Introduction';
import Room from './pages/Room';
import Lobby from './pages/Lobby';
import ViewRole from './pages/ViewRole';
import ModeratorDashboard from './pages/ModeratorDashboard';
import GameBoard from './pages/GameBoard';
import Credits from './pages/Credits'; 

// Import Components
import IntroFable from './components/IntroFable';

function App() {
  // --- 1. STATE MANAGEMENT ---
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || localStorage.getItem('last_page') || 'landing';
  });
  
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('room_code') || '');
  const [isHost, setIsHost] = useState(() => localStorage.getItem('is_host') === 'true');
  const [myPlayerId, setMyPlayerId] = useState(() => localStorage.getItem('my_player_id') || null);
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('player_name') || '');
  const [isJoining, setIsJoining] = useState(false);
  
  const [globalPhase, setGlobalPhase] = useState("Pagi (Diskusi)");
  const [globalSeconds, setGlobalSeconds] = useState(120);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [globalDay, setGlobalDay] = useState(1);
  const [gameWinner, setGameWinner] = useState(null);

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

  // --- 3. SYNC URL & STORAGE ---
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

      if (!data || data.status === "destroyed") {
        if (!hasShownDestroyed) {
          setHasShownDestroyed(true); 
          showNotif("Room Dibubarkan", "Moderator telah menutup permainan ini.", "error");
          setTimeout(() => {
            localStorage.clear();
            setRoomCode('');
            setMyPlayerId(null);
            setCurrentPage('landing');
            window.location.hash = 'landing';
          }, 3000);
        }
        return;
      }

      // Deteksi Kick (ID saya hilang dari list pemain)
      if (!isHost && myPlayerId && data.players && !data.players[myPlayerId]) {
        if (currentPage !== 'landing') {
          showNotif("Dikeluarkan", "Kamu telah dikeluarkan oleh Host.", "error");
          localStorage.clear(); setRoomCode(''); setMyPlayerId(null); setCurrentPage('landing');
          return;
        }
      }

      if (data.status === 'ended') setGameWinner(data.winner);
      else setGameWinner(null);

      if (data.players) {
        setPlayers(Object.entries(data.players).map(([id, val]) => ({ id, ...val })));
      }

      if (data.timer) {
        setGlobalPhase(data.timer.phase || "Pagi (Diskusi)");
        setGlobalDay(data.timer.day || 1);
        setIsTimerActive(data.timer.isActive || false);
        const fbSecs = parseInt(data.timer.seconds);
        if (!isNaN(fbSecs) && (Math.abs(globalSeconds - fbSecs) > 10 || !data.timer.isActive)) {
          setGlobalSeconds(fbSecs);
        }
      }
      
      // Navigasi Otomatis Berdasarkan Status Room
      if (data.status === "intro" && currentPage === "room-lobby") setCurrentPage('intro-fable');
      if (data.status === "playing" && (currentPage === "room-lobby" || currentPage === "intro-fable")) setCurrentPage('view-role');
    });
    return () => unsubscribe();
  }, [roomCode, currentPage, hasShownDestroyed, globalSeconds, myPlayerId, isHost]);

  // LOGIKA HITUNG MUNDUR & BROADCAST
  useEffect(() => {
    let interval = null;
    if (isTimerActive && globalSeconds > 0) {
      interval = setInterval(() => {
        const nextSecs = globalSeconds - 1;
        setGlobalSeconds(nextSecs);
        if (isHost && nextSecs % 5 === 0) {
          update(ref(db, `rooms/${roomCode}/timer`), { seconds: nextSecs });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, globalSeconds, isHost, roomCode]);

  // --- 5. HANDLERS ---
  const handleSetPhase = async (newPhase) => {
    if (!isHost) return;
    const updates = {};
    let nextDay = globalDay;

    if (globalPhase.toLowerCase().includes("malam") && newPhase.toLowerCase().includes("pagi")) {
      nextDay += 1;
      updates[`rooms/${roomCode}/timer/day`] = nextDay;
    }

    if (newPhase.toLowerCase().includes("malam")) {
      players.forEach(p => {
        updates[`rooms/${roomCode}/players/${p.id}/currentAction`] = null;
      });
    }

    if (globalPhase.toLowerCase().includes("siang") && newPhase.toLowerCase().includes("malam")) {
      const roomSnapshot = await get(ref(db, `rooms/${roomCode}`));
      const data = roomSnapshot.val();
      const votes = data.votes || {};
      const currentPlayers = Object.entries(data.players || {}).map(([id, val]) => ({ id, ...val }));
      const activePlayers = currentPlayers.filter(p => p.status !== 'dead' && p.role !== 'Moderator');
      const threshold = Math.floor(activePlayers.length / 2) + 1;
      const counts = {};
      Object.values(votes).forEach(tId => { if (tId !== 'skip') counts[tId] = (counts[tId] || 0) + 1; });
      const victimId = Object.keys(counts).find(id => counts[id] >= threshold);
      const victimName = victimId ? (currentPlayers.find(p => p.id === victimId)?.name || "Pemain") : "Tidak ada";
      updates[`rooms/${roomCode}/lastExecution`] = { victimName, timestamp: Date.now() };
      if (victimId) updates[`rooms/${roomCode}/players/${victimId}/status`] = "dead";
    }

    updates[`rooms/${roomCode}/timer/phase`] = newPhase;
    updates[`rooms/${roomCode}/timer/isActive`] = false; 
    updates[`rooms/${roomCode}/timer/seconds`] = 120; 
    updates[`rooms/${roomCode}/votes`] = null; 
    await update(ref(db), updates);
  };

  const handleJoinRoom = async (code, inputName) => {
    if (isJoining) return; 
    setIsJoining(true);
    await cleanupOldRooms();
    const finalName = inputName || "Player";
    try {
      const snapshot = await get(ref(db, `rooms/${code}`));
      if (!snapshot.exists()) { setIsJoining(false); return showNotif("Gagal", "Room tidak ditemukan.", "error"); }
      if (snapshot.val().status !== "waiting") { setIsJoining(false); return showNotif("Ditolak", "Game berjalan.", "error"); }
      
      const newPlayerRef = push(ref(db, `rooms/${code}/players`));
      await set(newPlayerRef, { name: finalName, role: "Pending", status: "alive", joinedAt: Date.now() });
      setRoomCode(code); setMyPlayerId(newPlayerRef.key); setIsHost(false); setPlayerName(finalName); setCurrentPage('room-lobby');
    } catch (error) { showNotif("Error", "Gagal masuk.", "error"); } finally { setIsJoining(false); }
  };

  const handleKickPlayer = async (targetId) => {
    if (isHost) await set(ref(db, `rooms/${roomCode}/players/${targetId}`), null);
  };

  const handleEndGame = async (winner) => {
    if (!isHost) return;
    await update(ref(db, `rooms/${roomCode}`), { status: "ended", winner, endedAt: Date.now() });
  };

  const handleKillPlayer = (id, status) => {
    if (isHost) update(ref(db, `rooms/${roomCode}/players/${id}`), { status: status === 'dead' ? 'alive' : 'dead' });
  };

  const handleToggleTimer = (isActive, currentSeconds) => {
    if (isHost) update(ref(db, `rooms/${roomCode}/timer`), { isActive: !isActive, seconds: currentSeconds <= 0 ? 120 : currentSeconds });
  };

  const handleStartGame = async () => {
    if (players.length < 6) return showNotif("Gagal", "Minimal 6 pemain!", "error");
    const playersWithRoles = distributeRoles(players);
    const updates = {};
    playersWithRoles.forEach(p => {
      updates[`rooms/${roomCode}/players/${p.id}/role`] = p.role;
      updates[`rooms/${roomCode}/players/${p.id}/status`] = "alive";
    });
    updates[`rooms/${roomCode}/introStartedAt`] = Date.now();
    updates[`rooms/${roomCode}/status`] = "intro"; 
    await update(ref(db), updates);
  };

  const handleCreateRoom = async (name) => {
    await cleanupOldRooms();
    const finalName = name || "Moderator";
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hostId = "host_" + Date.now();
    set(ref(db, 'rooms/' + newCode), {
      status: "waiting", host: finalName,
      createdAt: Date.now(),
      timer: { isActive: false, seconds: 120, phase: "Pagi (Diskusi)", day: 1 },
      players: { [hostId]: { name: finalName + " (Moderator)", role: "Moderator", status: "alive" } }
    });
    setRoomCode(newCode); setMyPlayerId(hostId); setIsHost(true); setPlayerName(finalName); setCurrentPage('room-lobby');
  };

  // --- 6. RENDER LOGIC ---
  const renderPage = () => {
    const timerProps = { 
        seconds: globalSeconds, phase: globalPhase, isActive: isTimerActive, 
        day: globalDay, roomCode, players, myPlayerId
    };

    switch (currentPage) {
      case 'landing': return <LandingPage onNext={() => setCurrentPage('introduction')} onCredits={() => setCurrentPage('credits')} />;
      case 'credits': return <Credits onBack={() => setCurrentPage('landing')} />;
      case 'introduction': return <Introduction onNext={() => setCurrentPage('room-setup')} onBack={() => setCurrentPage('landing')} />;
      case 'room-setup': return <Room onCreate={handleCreateRoom} onJoin={handleJoinRoom} isJoining={isJoining} onBack={() => setCurrentPage('introduction')} />;
      case 'room-lobby': return <Lobby {...timerProps} isHost={isHost} onStart={handleStartGame} onKick={handleKickPlayer} onBack={() => setCurrentPage('room-setup')} />;
      case 'intro-fable': return <IntroFable players={players} roomCode={roomCode} onFinish={() => isHost && update(ref(db, `rooms/${roomCode}`), { status: "playing" })} />;
      case 'view-role':
        return isHost ? (
          <ModeratorDashboard {...timerProps} 
            onKill={handleKillPlayer} 
            onToggleTimer={handleToggleTimer} 
            onSetPhase={handleSetPhase} 
            onResetTimer={() => update(ref(db, `rooms/${roomCode}/timer`), { isActive: false, seconds: 120 })}
            onEditTimer={(s) => update(ref(db, `rooms/${roomCode}/timer`), { seconds: s })}
            onEndGame={(winner) => showNotif("Akhiri Permainan?", "Semua data room akan dihapus.", "confirm", () => handleEndGame(winner))}
            onExit={() => showNotif("Bubarkan?", "Data akan dihapus.", "confirm", async () => {
              await deleteRoom(roomCode);
              localStorage.clear(); setRoomCode(''); setMyPlayerId(null); setCurrentPage('landing');
            })}
          />
        ) : (
          <ViewRole playerData={myData} winner={gameWinner} onNext={() => setCurrentPage('game-board')} 
            onLeave={() => showNotif("Keluar?", gameWinner ? "Room akan dihapus dari database." : "Statusmu jadi MATI.", "confirm", async () => {
              if (gameWinner && isHost) {
                await deleteRoom(roomCode);
              } else if (!gameWinner) {
                update(ref(db, `rooms/${roomCode}/players/${myPlayerId}`), { status: "dead" });
              }
              localStorage.clear(); setRoomCode(''); setMyPlayerId(null); setCurrentPage('landing');
            })}
            {...timerProps}
          />
        );
      case 'game-board': return <GameBoard onBack={() => setCurrentPage('view-role')} {...timerProps} />;
      default: return <LandingPage onNext={() => setCurrentPage('introduction')} />;
    }
  };

  return (
    <div className="antialiased selection:bg-red-500/30">
      {renderPage()}
      {notification.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center space-y-6">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{notification.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{notification.message}</p>
            <div className="flex gap-2">
              <button onClick={closeNotif} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold uppercase text-[10px]">
                {notification.type === "confirm" ? "Batal" : "Tutup"}
              </button>
              {notification.type === "confirm" && (
                <button onClick={() => { notification.onConfirm(); closeNotif(); }} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold uppercase text-[10px]">Lanjut</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;