import React, { useState, useEffect } from 'react';
import { ref, set, onValue, push } from "firebase/database";
import { db } from "./lib/firebase";
import { distributeRoles } from './utils/gameLogic';

// Import Pages
import LandingPage from './pages/LandingPage';
import Introduction from './pages/Introduction';
import Mechanics from './pages/Mechanics';
import Room from './pages/Room';
import Lobby from './pages/Lobby';
import ViewRole from './pages/ViewRole';
import ModeratorDashboard from './pages/ModeratorDashboard'; // JANGAN LUPA IMPORT INI

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [myPlayerId, setMyPlayerId] = useState(null);

  // Monitoring Status Game
  useEffect(() => {
    if (roomCode) {
      const statusRef = ref(db, `rooms/${roomCode}/status`);
      const unsubscribe = onValue(statusRef, (snapshot) => {
        const status = snapshot.val();
        if (status === "playing") {
          setCurrentPage('view-role');
        }
      });
      return () => unsubscribe();
    }
  }, [roomCode]);

  // Listen Players
  const listenToPlayers = (code) => {
    const playersRef = ref(db, `rooms/${code}/players`);
    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playerList = Object.entries(data).map(([id, val]) => ({
          id,
          ...val
        }));
        setPlayers(playerList);
      }
    });
  };

  const handleCreateRoom = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = ref(db, 'rooms/' + newCode);
    const hostId = "host_" + Date.now();
    
    set(roomRef, {
      status: "waiting",
      host: "Akbar",
      createdAt: Date.now(),
      players: {
        [hostId]: { name: "Akbar (Moderator)", role: "Moderator", status: "alive" }
      }
    });

    setRoomCode(newCode);
    setMyPlayerId(hostId);
    setIsHost(true);
    setCurrentPage('room-lobby');
    listenToPlayers(newCode);
  };

  const handleJoinRoom = (code, playerName) => {
    const playerRef = ref(db, `rooms/${code}/players`);
    const newPlayerRef = push(playerRef);
    const playerId = newPlayerRef.key;

    set(newPlayerRef, {
      name: playerName,
      role: "Pending",
      status: "alive"
    }).then(() => {
      setRoomCode(code);
      setMyPlayerId(playerId);
      setIsHost(false);
      setCurrentPage('room-lobby');
      listenToPlayers(code);
    });
  };

  const handleStartGame = () => {
    console.log("Tombol Start diklik oleh Host!");
    // Mengacak role
    const playersWithRoles = distributeRoles(players);
    
    // Update role ke Firebase per player
    playersWithRoles.forEach(p => {
      set(ref(db, `rooms/${roomCode}/players/${p.id}/role`), p.role);
    });

    // Trigger pindah halaman untuk semua pemain
    set(ref(db, `rooms/${roomCode}/status`), "playing");
  };

  const handleKillPlayer = (playerId, currentStatus) => {
    if (!isHost) return;
    const newStatus = currentStatus === 'dead' ? 'alive' : 'dead';
    set(ref(db, `rooms/${roomCode}/players/${playerId}/status`), newStatus);
  };

  const myData = players.find(p => p.id === myPlayerId);

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNext={() => setCurrentPage('introduction')} />;
      case 'introduction':
        return <Introduction onNext={() => setCurrentPage('room-setup')} onBack={() => setCurrentPage('landing')} />;
      case 'room-setup':
        return <Room onCreate={handleCreateRoom} onJoin={handleJoinRoom} onBack={() => setCurrentPage('introduction')} />;
      case 'room-lobby':
        return (
          <Lobby 
            roomCode={roomCode} 
            players={players} 
            isHost={isHost} 
            onStart={handleStartGame} 
          />
        );
      case 'view-role':
        return isHost ? (
          <ModeratorDashboard 
            players={players} 
            roomCode={roomCode} 
            onKill={handleKillPlayer} 
          />
        ) : (
          <ViewRole 
            playerData={myData} 
            roomCode={roomCode} 
            onNext={() => setCurrentPage('mechanics')} 
          />
        );
      case 'mechanics':
        return <Mechanics onBack={() => setCurrentPage('landing')} />;
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