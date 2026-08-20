import React, { useState, useEffect, useRef } from 'react';
import { update, set, ref, onValue } from "firebase/database";
import { db } from "./lib/firebase";
import { NotificationProvider } from './contexts/NotificationContext';
import { GameProvider, useGameContext } from './contexts/GameContext';
import { TimerProvider, useTimerContext } from './contexts/TimerContext';
import { Z_LAYER } from './constants/zIndex';
import { isSiang } from './constants/phases';

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
import PersonalDeathAnimation from './components/PersonalDeathAnimation';
import { playClickSound } from './utils/audio';

function AppContent() {
  const { currentPage, navigate, players, isHost, roomCode, myData, roomStatus, gameWinner, handleLeaveGame } = useGameContext();
  const { phase, day, allVoted, seconds } = useTimerContext();
  const [showBoard, setShowBoard] = useState(false);
  const [activeDeathAnimation, setActiveDeathAnimation] = useState(null);
  const dismissedDayRef = useRef(null);
  const prevPhaseRef = useRef(null);

  // Global overlays
  const [voteResult, setVoteResult] = useState(null);
  const [showVoteResult, setShowVoteResult] = useState(false);
  const [deadToday, setDeadToday] = useState({ names: [], day: 1, details: {} });
  const [showDeathPopUp, setShowDeathPopUp] = useState(false);
  const [showGunshotEffect, setShowGunshotEffect] = useState(false);

  // Reset overlay tiap room ganti atau game mulai (menggunakan render phase state adjustment untuk efisiensi & kepatuhan React 19)
  const [prevRoomCode, setPrevRoomCode] = useState(roomCode);
  if (roomCode !== prevRoomCode) {
    setPrevRoomCode(roomCode);
    setShowVoteResult(false);
    setShowDeathPopUp(false);
    setDeadToday({ names: [], day: 1, details: {} });
    setVoteResult(null);
  }

  // Update refs di useEffect saat roomCode berubah (kepatuhan React 19: ref hanya boleh dimodifikasi di effect/handler)
  useEffect(() => {
    prevPhaseRef.current = null;
    dismissedDayRef.current = null;
  }, [roomCode]);

  // Global UI click sound listener
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const target = e.target.closest('button, [role="button"], a');
      if (target && !target.disabled) {
        playClickSound();
      }
    };
    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, []);

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

        // Cek apakah saya termasuk yang mati
        const myNameStr = myData?.name;
        const amIKilled = data.names.includes(myNameStr);
        if (amIKilled) {
          const cause = data.details?.[myNameStr] || "general";
          if (["hunter", "hunter_backfire", "werewolf", "poison", "hakim"].includes(cause)) {
            setActiveDeathAnimation(cause);
          } else {
            setShowDeathPopUp(true);
          }
        } else {
          setShowDeathPopUp(true);
        }
      }
    });
    return () => unsub();
  }, [roomCode, currentPage, isHost, myData]);

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
          isJoker={voteResult.isJoker}
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

      {/* GLOBAL: Personal Death Animation Overlay (1-4) */}
      {activeDeathAnimation && isGamePage && currentPage !== 'view-mod' && (
        <PersonalDeathAnimation
          cause={activeDeathAnimation}
          playerName={myData?.name}
          onFinish={() => {
            setActiveDeathAnimation(null);
            setShowDeathPopUp(true);
          }}
        />
      )}

      {/* GLOBAL: Voting Closed / Transition Overlay */}
      {allVoted && isSiang(phase) && isGamePage && currentPage !== 'view-mod' && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-500"
          style={{ zIndex: Z_LAYER.PHASE_OVERLAY }}
        >
          <div className="max-w-sm w-full bg-slate-900 border-2 border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.15)] rounded-[2.5rem] p-8 text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl bg-orange-600/10" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl bg-orange-600/5" />

            <div className="relative mb-6">
              <div className="absolute inset-0 blur-2xl rounded-full scale-150 animate-pulse bg-orange-600/20" />
              <div className="w-20 h-20 bg-gradient-to-tr from-orange-600 to-yellow-500 rounded-full mx-auto flex items-center justify-center shadow-2xl relative border-4 border-white/20">
                <span className="text-white text-3xl font-black font-mono animate-pulse">{seconds}</span>
              </div>
            </div>

            <div className="space-y-2 mb-8 relative z-10">
              <h2 className="font-black uppercase tracking-[0.4em] text-[10px] text-orange-500">
                Fase Siang Selesai • Hari {day}
              </h2>
              <h1 className="text-white text-2xl font-black italic uppercase leading-none tracking-tighter">
                VOTING DITUTUP
              </h1>
            </div>

            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Semua suara telah terkumpul!
            </p>
            <p className="text-slate-500 text-[10px] leading-relaxed italic px-4 uppercase font-bold tracking-tight">
              "Mempersiapkan tiang gantungan... keputusan hukum akan segera diumumkan."
            </p>
          </div>
        </div>
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
