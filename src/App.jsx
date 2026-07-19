import React, { useState, useEffect, useRef } from 'react';
import { update, set, ref, onValue } from "firebase/database";
import { db } from "./lib/firebase";
import { NotificationProvider } from './contexts/NotificationContext';
import { GameProvider, useGameContext } from './contexts/GameContext';
import { TimerProvider, useTimerContext } from './contexts/TimerContext';

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
import DeathAnnouncement from './components/DeathAnnouncement';
import VoteAnnouncement from './components/VoteAnnouncement';

function AppContent() {
  const { currentPage, navigate, players, isHost, roomCode, myData, playerName } = useGameContext();
  const [showBoard, setShowBoard] = useState(false);
  const dismissedDayRef = useRef(null);
  const prevPhaseRef = useRef(null);

  // Global overlays
  const [voteResult, setVoteResult] = useState(null);
  const [showVoteResult, setShowVoteResult] = useState(false);
  const [deadToday, setDeadToday] = useState({ names: [], day: 1 });
  const [showDeathPopUp, setShowDeathPopUp] = useState(false);

  // Reset overlay tiap room ganti atau game mulai
  useEffect(() => {
    setShowVoteResult(false);
    setShowDeathPopUp(false);
    setDeadToday({ names: [], day: 1 });
    setVoteResult(null);
    prevPhaseRef.current = null;
    dismissedDayRef.current = null;
    // State lokal sudah di-reset di atas.
    // Tidak perlu hapus data Firebase — itu mengganggu pemain lain yang sedang lihat overlay.
  }, [roomCode]);

  // Listener voteResult
  useEffect(() => {
    if (!roomCode || currentPage === 'landing') return;
    const ref_ = ref(db, `rooms/${roomCode}/voteResult`);
    const unsub = onValue(ref_, snap => {
      const data = snap.val();
      if (data && data.timestamp) {
        setVoteResult(data);
        setShowVoteResult(true);
      }
    });
    return () => {
      unsub();
    };
  }, [roomCode, currentPage]);

  // Listen deadToday langsung — muncul pas ada data (ditulis processNightResults saat Malam→Pagi)
  useEffect(() => {
    if (!roomCode || currentPage === 'landing' || isHost) return;
    const deadRef = ref(db, `rooms/${roomCode}/deadToday`);
    const unsub = onValue(deadRef, snap => {
      const data = snap.val();
      if (data && data.names && data.names.length > 0) {
        if (dismissedDayRef.current === data.day) return;
        setDeadToday({ names: data.names, day: data.day });
        setShowDeathPopUp(true);
      }
    });
    return () => unsub();
  }, [roomCode, currentPage, isHost]);

  const isGamePage = ['intro-fable', 'view-role', 'view-mod'].includes(currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNext={() => navigate('introduction')} onCredits={() => navigate('credits')} />;
      case 'credits':
        return <Credits onBack={() => navigate('landing')} />;
      case 'introduction':
        return <Introduction onNext={() => navigate('room-setup')} onBack={() => navigate('landing')} />;
      case 'room-setup':
        return <Room onBack={() => navigate('introduction')} />;
      case 'room-lobby':
        return <Lobby onBack={() => navigate('room-setup')} />;
      case 'intro-fable':
        return (
          <IntroFable
            players={players}
            roomCode={roomCode}
            playerData={myData}
            onFinish={async () => {
              if (isHost) {
                await update(ref(db, `rooms/${roomCode}`), { status: "playing", "timer/isActive": true });
              } else {
                // Catat intro selesai biar ViewRole gak ngulang
                await set(ref(db, `rooms/${roomCode}/introFinished/${myData?.id}`), true);
                localStorage.setItem(`intro_${roomCode}`, 'true');
              }
              navigate(isHost ? 'view-mod' : 'view-role');
            }}
          />
        );
      case 'view-mod':
        return <ModeratorDashboard />;
      case 'view-role':
        return (
          <div className="fixed inset-0">
            {showBoard ? (
              <GameBoard onBack={() => setShowBoard(false)} />
            ) : (
              <ViewRole onNext={() => setShowBoard(true)} />
            )}
          </div>
        );
      default:
        return <LandingPage onNext={() => navigate('introduction')} />;
    }
  };

  return (
    <div className="antialiased selection:bg-red-500/30">
      {renderPage()}

      {/* GLOBAL: Vote Result Overlay — in-game only */}
      {showVoteResult && voteResult && isGamePage && currentPage !== 'view-mod' && (
        <VoteAnnouncement
          names={voteResult.names}
          day={voteResult.day}
          onClose={() => setShowVoteResult(false)}
        />
      )}

      {/* GLOBAL: Death Announcement — in-game only */}
      {showDeathPopUp && isGamePage && currentPage !== 'view-mod' && (
        <DeathAnnouncement deadPlayers={deadToday.names} day={deadToday.day} onClose={() => {
          dismissedDayRef.current = deadToday.day;
          setShowDeathPopUp(false);
        }} />
      )}
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <GameProvider>
        <TimerProvider>
          <AppContent />
        </TimerProvider>
      </GameProvider>
    </NotificationProvider>
  );
}

export default App;
