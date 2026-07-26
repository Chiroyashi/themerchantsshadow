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
  const { currentPage, navigate, players, isHost, roomCode, myData } = useGameContext();
  const { phase } = useTimerContext();
  const [showBoard, setShowBoard] = useState(false);
  const dismissedDayRef = useRef(null);
  const prevPhaseRef = useRef(null);

  // Background Audio Refs
  const morningAudioRef = useRef(null);
  const nightAudioRef = useRef(null);

  // Initialize Audios once
  useEffect(() => {
    morningAudioRef.current = new Audio(`${import.meta.env.BASE_URL}sounds/opening_after_introfable.mp3`);
    morningAudioRef.current.loop = true;
    morningAudioRef.current.volume = 0.25;

    nightAudioRef.current = new Audio(`${import.meta.env.BASE_URL}sounds/Nightphase_looping_till_nextphase.mp3`);
    nightAudioRef.current.loop = true;
    nightAudioRef.current.volume = 0.25;

    return () => {
      if (morningAudioRef.current) {
        morningAudioRef.current.pause();
        morningAudioRef.current = null;
      }
      if (nightAudioRef.current) {
        nightAudioRef.current.pause();
        nightAudioRef.current = null;
      }
    };
  }, []);

  // Sync background music with currentPage and phase
  useEffect(() => {
    const isGameActive = ['view-role', 'view-mod'].includes(currentPage);

    if (!isGameActive) {
      if (morningAudioRef.current) morningAudioRef.current.pause();
      if (nightAudioRef.current) nightAudioRef.current.pause();
      return;
    }

    const isNightPhase = phase?.toLowerCase().includes('malam');

    if (isNightPhase) {
      if (morningAudioRef.current) morningAudioRef.current.pause();
      if (nightAudioRef.current) {
        if (nightAudioRef.current.paused) {
          nightAudioRef.current.currentTime = 0;
          nightAudioRef.current.play().catch(() => {});
        }
      }
    } else {
      if (nightAudioRef.current) nightAudioRef.current.pause();
      if (morningAudioRef.current) {
        if (morningAudioRef.current.paused) {
          morningAudioRef.current.play().catch(() => {});
        }
      }
    }
  }, [currentPage, phase]);

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
