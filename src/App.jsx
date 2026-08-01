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
import GameOverScreen from './components/GameOverScreen';

function AppContent() {
  const { currentPage, navigate, players, isHost, roomCode, myData, roomStatus, gameWinner, handleLeaveGame } = useGameContext();
  const { phase, day } = useTimerContext();
  const [showBoard, setShowBoard] = useState(false);
  const dismissedDayRef = useRef(null);
  const prevPhaseRef = useRef(null);
  const hasPlayedOpeningRef = useRef(false);
  const hasPlayedEndAudioRef = useRef(false);

  // Background Audio Refs
  const morningAudioRef = useRef(null);
  const nightAudioRef = useRef(null);
  const victoryAudioRef = useRef(null);
  const defeatAudioRef = useRef(null);

  // Initialize Audios once
  useEffect(() => {
    morningAudioRef.current = new Audio(`${import.meta.env.BASE_URL}sounds/opening_after_introfable.mp3`);
    morningAudioRef.current.loop = false;
    morningAudioRef.current.volume = 0.25;

    nightAudioRef.current = new Audio(`${import.meta.env.BASE_URL}sounds/Nightphase_looping_till_nextphase.mp3`);
    nightAudioRef.current.loop = true;
    nightAudioRef.current.volume = 0.25;

    victoryAudioRef.current = new Audio(`${import.meta.env.BASE_URL}sounds/Victory.mp3`);
    victoryAudioRef.current.loop = false;
    victoryAudioRef.current.volume = 0.3;

    defeatAudioRef.current = new Audio(`${import.meta.env.BASE_URL}sounds/defeat.mp3`);
    defeatAudioRef.current.loop = false;
    defeatAudioRef.current.volume = 0.3;

    return () => {
      if (morningAudioRef.current) {
        morningAudioRef.current.pause();
        morningAudioRef.current = null;
      }
      if (nightAudioRef.current) {
        nightAudioRef.current.pause();
        nightAudioRef.current = null;
      }
      if (victoryAudioRef.current) {
        victoryAudioRef.current.pause();
        victoryAudioRef.current = null;
      }
      if (defeatAudioRef.current) {
        defeatAudioRef.current.pause();
        defeatAudioRef.current = null;
      }
    };
  }, []);

  // Sync background music with currentPage and phase
  useEffect(() => {
    const isGameActive = ['view-role', 'view-mod'].includes(currentPage);

    if (!isGameActive) {
      if (morningAudioRef.current) morningAudioRef.current.pause();
      if (nightAudioRef.current) nightAudioRef.current.pause();
      if (victoryAudioRef.current) victoryAudioRef.current.pause();
      if (defeatAudioRef.current) defeatAudioRef.current.pause();
      hasPlayedOpeningRef.current = false;
      hasPlayedEndAudioRef.current = false;
      return;
    }

    // JIKA GAME SELESAI (ENDED)
    if (roomStatus === 'ended') {
      if (morningAudioRef.current) morningAudioRef.current.pause();
      if (nightAudioRef.current) nightAudioRef.current.pause();

      if (!isHost && !hasPlayedEndAudioRef.current) {
        hasPlayedEndAudioRef.current = true;

        const isWargaWinner = gameWinner === 'WARGA';
        const myRole = myData?.role?.toLowerCase() || "";
        const isAntagonist = myRole.includes('werewolf') || myRole.includes('warlock');
        const isIWinner = isWargaWinner ? !isAntagonist : isAntagonist;

        if (isIWinner) {
          if (victoryAudioRef.current) {
            victoryAudioRef.current.currentTime = 0;
            victoryAudioRef.current.play().catch(() => {});
          }
        } else {
          if (defeatAudioRef.current) {
            defeatAudioRef.current.currentTime = 0;
            defeatAudioRef.current.play().catch(() => {});
          }
        }
      }
      return;
    }

    // JIKA GAME MASIH BERJALAN
    if (victoryAudioRef.current) victoryAudioRef.current.pause();
    if (defeatAudioRef.current) defeatAudioRef.current.pause();
    hasPlayedEndAudioRef.current = false;

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
        const isDay1Pagi = day === 1 && phase?.toLowerCase().includes('pagi');
        if (isDay1Pagi && !hasPlayedOpeningRef.current) {
          hasPlayedOpeningRef.current = true;
          morningAudioRef.current.currentTime = 0;
          morningAudioRef.current.play().catch(() => {});
        }
      }
    }
  }, [currentPage, phase, day, roomStatus, gameWinner, isHost, myData]);

  // Global overlays
  const [voteResult, setVoteResult] = useState(null);
  const [showVoteResult, setShowVoteResult] = useState(false);
  const [deadToday, setDeadToday] = useState({ names: [], day: 1, details: {} });
  const [showDeathPopUp, setShowDeathPopUp] = useState(false);
  const [showGunshotEffect, setShowGunshotEffect] = useState(false);

  // Reset overlay tiap room ganti atau game mulai (in-render state adjustment untuk menghindari warning eslint)
  const [prevRoomCode, setPrevRoomCode] = useState(roomCode);
  if (roomCode !== prevRoomCode) {
    setPrevRoomCode(roomCode);
    setShowVoteResult(false);
    setShowDeathPopUp(false);
    setDeadToday({ names: [], day: 1, details: {} });
    setVoteResult(null);
    prevPhaseRef.current = null;
    dismissedDayRef.current = null;
    hasPlayedEndAudioRef.current = false;
  }

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
        setDeadToday({ names: data.names, day: data.day, details: data.details || {} });
        setShowDeathPopUp(true);
      }
    });
    return () => unsub();
  }, [roomCode, currentPage, isHost]);

  // Listen gunshotEvent untuk guncangan layar & kilatan merah
  useEffect(() => {
    if (!roomCode || currentPage === 'landing') return;
    const gunshotRef = ref(db, `rooms/${roomCode}/gunshotEvent`);
    const unsub = onValue(gunshotRef, snap => {
      const data = snap.val();
      if (data && data.timestamp && data.timestamp > (Date.now() - 4000)) {
        setShowGunshotEffect(true);
        const timer = setTimeout(() => {
          setShowGunshotEffect(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    });
    return () => unsub();
  }, [roomCode, currentPage]);

  const isGamePage = ['intro-fable', 'view-role', 'view-mod'].includes(currentPage);

  const renderPage = () => {
    if (isGamePage && roomStatus === 'ended' && gameWinner) {
      return (
        <GameOverScreen
          winner={gameWinner}
          players={players}
          playerData={myData}
          onLeave={() => handleLeaveGame(true, 'room-setup')}
        />
      );
    }

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
    <div className={`antialiased selection:bg-red-500/30 ${showGunshotEffect ? 'animate-shake' : ''}`}>
      <style>{`
        @keyframes screen-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-6px, -6px) rotate(-1deg); }
          20% { transform: translate(6px, 6px) rotate(1deg); }
          30% { transform: translate(-8px, 4px) rotate(-1.5deg); }
          40% { transform: translate(8px, -4px) rotate(1.5deg); }
          50% { transform: translate(-6px, 6px) rotate(-1deg); }
          60% { transform: translate(6px, -6px) rotate(1deg); }
          70% { transform: translate(-3px, -3px) rotate(-0.5deg); }
          80% { transform: translate(3px, 3px) rotate(0.5deg); }
          90% { transform: translate(-1px, 1px) rotate(0deg); }
        }
        .animate-shake {
          animation: screen-shake 0.6s ease-in-out;
        }
      `}</style>

      {renderPage()}

      {/* Red Gunshot Flash Overlay */}
      {showGunshotEffect && (
        <div className="fixed inset-0 bg-red-600/35 pointer-events-none z-[99999] animate-pulse" />
      )}

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
        <DeathAnnouncement
          deadPlayers={deadToday.names}
          deadDetails={deadToday.details}
          day={deadToday.day}
          onClose={() => {
            dismissedDayRef.current = deadToday.day;
            setShowDeathPopUp(false);
          }}
        />
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
