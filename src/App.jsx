import React, { useState, useEffect } from 'react';
import { ref, set, onValue, push, update, onDisconnect } from "firebase/database"; 
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

  // STATE UNTUK CUSTOM NOTIFIKASI
  const [notification, setNotification] = useState({
    show: false,
    title: "",
    message: "",
    type: "info", // info, error, success, confirm
    onConfirm: null
  });

  const myData = players.find(p => p.id === myPlayerId);

  // Fungsi Pembantu Notifikasi
  const showNotif = (title, message, type = "info", onConfirm = null) => {
    setNotification({ show: true, title, message, type, onConfirm });
  };

  const closeNotif = () => setNotification(prev => ({ ...prev, show: false }));

  // --- 2. SYNC URL & LOCAL STORAGE ---
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

  // --- 3. FIREBASE LISTENERS ---
  
  useEffect(() => {
    if (roomCode) {
      const playersRef = ref(db, `rooms/${roomCode}/players`);
      const unsubscribe = onValue(playersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const playerList = Object.entries(data).map(([id, val]) => ({
            id, ...val
          }));
          setPlayers(playerList);
        }
      });
      return () => unsubscribe();
    }
  }, [roomCode]);

  useEffect(() => {
    if (roomCode) {
      const statusRef = ref(db, `rooms/${roomCode}/status`);
      const unsubscribe = onValue(statusRef, (snapshot) => {
        const status = snapshot.val();
        
        if (status === "playing" && currentPage === "room-lobby") {
          setCurrentPage('view-role');
        }

        if (status === "destroyed") {
          // CUSTOM NOTIF: Ganti alert browser
          showNotif(
            "Room Dibubarkan", 
            "Moderator telah menutup permainan ini. Kamu akan diarahkan kembali ke menu utama.", 
            "error"
          );
          
          setTimeout(() => {
            localStorage.clear();
            window.location.hash = 'landing';
            window.location.reload();
          }, 3500); // Beri waktu pemain membaca notifikasi
        }
      });
      return () => unsubscribe();
    }
  }, [roomCode, currentPage]);

  useEffect(() => {
    if (myData?.status === 'dead' && currentPage === 'view-role') {
      setCurrentPage('game-board');
    }
  }, [myData?.status, currentPage]);

  // --- 4. HANDLERS ---
  
  const handleToggleTimer = (isActive, currentSeconds) => {
    if (!isHost) return;
    update(ref(db, `rooms/${roomCode}/timer`), {
      isActive: !isActive,
      seconds: currentSeconds 
    });
  };

  const handleResetTimer = () => {
    if (!isHost) return;
    update(ref(db, `rooms/${roomCode}/timer`), {
      isActive: false,
      seconds: 300
    });
  };

  const handleEditTimer = (newSeconds) => {
    if (!isHost) return;
    update(ref(db, `rooms/${roomCode}/timer`), {
      seconds: Math.max(0, parseInt(newSeconds))
    });
  };

  const handleSetPhase = (newPhase) => {
    if (!isHost) return;
    update(ref(db, `rooms/${roomCode}/timer`), {
      phase: newPhase,
      isActive: false 
    });
  };

  const handlePlayerLeave = () => {
    showNotif(
      "Konfirmasi Keluar", 
      "Apakah kamu yakin ingin menyerah? Statusmu akan menjadi MATI.", 
      "confirm",
      () => {
        update(ref(db, `rooms/${roomCode}/players/${myPlayerId}`), { status: "dead" });
        localStorage.clear();
        window.location.hash = 'landing';
        window.location.reload();
      }
    );
  };

  const handleCreateRoom = (name) => {
    const finalName = name || "Moderator";
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hostId = "host_" + Date.now();
    
    set(ref(db, 'rooms/' + newCode), {
      status: "waiting",
      host: finalName,
      timer: { isActive: false, seconds: 300, phase: "Pagi (Diskusi)" },
      players: {
        [hostId]: { name: finalName + " (Moderator)", role: "Moderator", status: "alive" }
      }
    });

    setRoomCode(newCode);
    setMyPlayerId(hostId);
    setIsHost(true);
    setCurrentPage('room-lobby');
  };

  const handleJoinRoom = (code, inputName) => {
    const finalName = inputName || "Player";
    const playerRef = ref(db, `rooms/${code}/players`);
    const newPlayerRef = push(playerRef);
    const playerId = newPlayerRef.key;

    onDisconnect(ref(db, `rooms/${code}/players/${playerId}/status`)).set("dead");

    set(newPlayerRef, {
      name: finalName,
      role: "Pending",
      status: "alive"
    }).then(() => {
      setRoomCode(code);
      setMyPlayerId(playerId);
      setIsHost(false);
      setCurrentPage('room-lobby');
    });
  };

  const handleStartGame = () => {
    const playersWithRoles = distributeRoles(players);
    playersWithRoles.forEach(p => {
      update(ref(db, `rooms/${roomCode}/players/${p.id}`), { role: p.role });
    });
    set(ref(db, `rooms/${roomCode}/status`), "playing");
  };

  const handleKillPlayer = (playerId, currentStatus) => {
    if (!isHost) return;
    update(ref(db, `rooms/${roomCode}/players/${playerId}`), { 
      status: currentStatus === 'dead' ? 'alive' : 'dead' 
    });
  };

  const handleExitGame = async () => {
    showNotif(
      "Bubarkan Room?", 
      "Semua data akan dihapus dan pemain akan dikeluarkan otomatis.", 
      "confirm",
      async () => {
        try {
          await update(ref(db, `rooms/${roomCode}`), { status: "destroyed" });
          localStorage.clear();
          window.location.hash = 'landing';
          window.location.reload();
        } catch (error) {
          console.error("Gagal membubarkan room:", error);
        }
      }
    );
  };

  // --- 5. CUSTOM NOTIFICATION COMPONENT ---
  const GameNotification = () => {
    if (!notification.show) return null;

    const icons = {
      info: <Info className="text-blue-500" size={40} />,
      error: <XCircle className="text-red-500" size={40} />,
      success: <CheckCircle2 className="text-emerald-500" size={40} />,
      confirm: <AlertCircle className="text-amber-500" size={40} />
    };

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center space-y-6 transform animate-in zoom-in-95 duration-300">
          <div className="flex justify-center">{icons[notification.type]}</div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
              {notification.title}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {notification.message}
            </p>
          </div>
          
          <div className="flex flex-col gap-2 pt-2">
            {notification.type === "confirm" ? (
              <div className="flex gap-2">
                <button 
                  onClick={closeNotif}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all uppercase text-[10px] tracking-widest"
                >
                  Batal
                </button>
                <button 
                  onClick={() => { notification.onConfirm(); closeNotif(); }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-red-900/20"
                >
                  Ya, Lanjut
                </button>
              </div>
            ) : (
              <button 
                onClick={closeNotif}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/20"
              >
                Dimengerti
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- 6. RENDER LOGIC ---
  const renderPage = () => {
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
          />
        ) : (
          <ViewRole 
            playerData={myData} roomCode={roomCode} 
            onNext={() => setCurrentPage('game-board')} onLeave={handlePlayerLeave} 
          />
        );
      case 'game-board': return <GameBoard players={players} roomCode={roomCode} onBack={() => setCurrentPage('view-role')} />;
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