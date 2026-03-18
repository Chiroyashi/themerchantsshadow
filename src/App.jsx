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
  // --- 1. State Initialization ---
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || localStorage.getItem('last_page') || 'landing';
  });
  
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('room_code') || '');
  const [isHost, setIsHost] = useState(() => localStorage.getItem('is_host') === 'true');
  const [myPlayerId, setMyPlayerId] = useState(() => localStorage.getItem('my_player_id') || null);
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('player_name') || '');

  // --- 2. URL & Sync ---
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

  // --- 3. Firebase Listeners ---
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
      });
      return () => unsubscribe();
    }
  }, [roomCode, currentPage]);

  useEffect(() => {
    if (myData?.status === 'dead' && currentPage === 'view-role') {
      setCurrentPage('game-board');
    }
  }, [myData?.status, currentPage]);

  // --- 4. TIME GOD HANDLERS (Perbaikan Kritis) ---
  
  const handleToggleTimer = (isActive, currentSeconds) => {
    if (!isHost) return;
    
    // Paksa update secara atomic ke Firebase
    const timerRef = ref(db, `rooms/${roomCode}/timer`);
    
    // Jika posisi sekarang sedang Aktif, maka tujuannya adalah PAUSE (false)
    const targetStatus = !isActive;
    
    update(timerRef, {
      isActive: targetStatus,
      seconds: currentSeconds // Kirim detik terakhir agar semua HP pemain berhenti di angka yang sama
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
      isActive: false // Selalu matikan waktu setiap ganti fase
    });
  };

  // --- 5. Game Handlers ---
  const handlePlayerLeave = () => {
    if (window.confirm("Apakah Anda yakin ingin menyerah?")) {
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

  const handleExitGame = () => {
    if (window.confirm("Bubarkan room?")) {
      localStorage.clear();
      window.location.hash = 'landing';
      window.location.reload();
    }
  };

  const myData = players.find(p => p.id === myPlayerId);

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
    </div>
  );
}

export default App;