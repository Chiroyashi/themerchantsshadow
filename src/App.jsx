import React, { useState, useEffect } from 'react';
import { ref, set, onValue, push, update, onDisconnect } from "firebase/database"; 
import { db } from "./lib/firebase";
import { distributeRoles } from './utils/gameLogic';

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

  // Mencari data diri sendiri dari daftar pemain
  const myData = players.find(p => p.id === myPlayerId);

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

  // --- 3. FIREBASE LISTENERS (Real-time Sync) ---
  
  // Memantau Daftar Pemain
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

  // Memantau Status Room (Redirect Game Start & Auto-Kick Bubar)
  useEffect(() => {
    if (roomCode) {
      const statusRef = ref(db, `rooms/${roomCode}/status`);
      const unsubscribe = onValue(statusRef, (snapshot) => {
        const status = snapshot.val();
        
        // JIKA GAME DIMULAI: Redirect dari Lobby ke ViewRole
        if (status === "playing" && currentPage === "room-lobby") {
          setCurrentPage('view-role');
        }

        // JIKA MODERATOR MEMBUBARKAN ROOM: Semua pemain keluar
        if (status === "destroyed") {
          alert("Room telah dibubarkan oleh Moderator.");
          localStorage.clear();
          window.location.hash = 'landing';
          window.location.reload();
        }
      });
      return () => unsubscribe();
    }
  }, [roomCode, currentPage]);

  // Auto-redirect ke GameBoard jika pemain mati (Spectator Mode)
  useEffect(() => {
    if (myData?.status === 'dead' && currentPage === 'view-role') {
      setCurrentPage('game-board');
    }
  }, [myData?.status, currentPage]);

  // --- 4. TIME GOD HANDLERS (Kontrol Moderator) ---
  
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

  // --- 5. GAME LOGIC HANDLERS ---
  
  const handlePlayerLeave = () => {
    if (window.confirm("Apakah Anda yakin ingin menyerah? Status Anda akan menjadi MATI.")) {
      update(ref(db, `rooms/${roomCode}/players/${myPlayerId}`), { status: "dead" });
      localStorage.clear();
      window.location.hash = 'landing';
      window.location.reload();
    }
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

    // OTOMATIS MATI jika tab ditutup atau koneksi hilang
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
    if (window.confirm("Bubarkan room? Semua pemain akan otomatis keluar.")) {
      try {
        // 1. Beritahu Firebase bahwa room ini sudah bubar (status: destroyed)
        await update(ref(db, `rooms/${roomCode}`), { status: "destroyed" });
        
        // 2. Bersihkan data moderator sendiri
        localStorage.clear();
        window.location.hash = 'landing';
        window.location.reload();
      } catch (error) {
        console.error("Gagal membubarkan room:", error);
      }
    }
  };

  // --- 6. RENDER LOGIC ---
  const renderPage = () => {
    switch (currentPage) {
      case 'landing': 
        return <LandingPage onNext={() => setCurrentPage('introduction')} />;
      case 'introduction': 
        return <Introduction onNext={() => setCurrentPage('room-setup')} onBack={() => setCurrentPage('landing')} />;
      case 'room-setup': 
        return <Room onCreate={handleCreateRoom} onJoin={handleJoinRoom} onBack={() => setCurrentPage('introduction')} />;
      case 'room-lobby': 
        return <Lobby roomCode={roomCode} players={players} isHost={isHost} onStart={handleStartGame} onBack={() => setCurrentPage('room-setup')} />;
      case 'view-role':
        return isHost ? (
          <ModeratorDashboard 
            players={players} 
            roomCode={roomCode} 
            onKill={handleKillPlayer} 
            onExit={handleExitGame}
            onToggleTimer={handleToggleTimer} 
            onResetTimer={handleResetTimer}
            onEditTimer={handleEditTimer} 
            onSetPhase={handleSetPhase}
          />
        ) : (
          <ViewRole 
            playerData={myData} 
            roomCode={roomCode} 
            onNext={() => setCurrentPage('game-board')} 
            onLeave={handlePlayerLeave} 
          />
        );
      case 'game-board': 
        return <GameBoard players={players} roomCode={roomCode} onBack={() => setCurrentPage('view-role')} />;
      default: 
        return <LandingPage onNext={() => setCurrentPage('introduction')} />;
    }
  };

  return (
    <div className="antialiased selection:bg-red-500/30">
      {renderPage()}
    </div>
  );
}

export default App;