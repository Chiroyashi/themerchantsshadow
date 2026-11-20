import React, { useState, useEffect, useRef } from 'react';
import { update, set, ref, onValue } from "firebase/database";
import { db, authReady } from "./lib/firebase";
import { NotificationProvider } from './contexts/NotificationContext';
import { GameProvider, useGameContext } from './contexts/GameContext';
import { TimerProvider, useTimerContext } from './contexts/TimerContext';
import { Z_LAYER } from './constants/zIndex';
import { DEV_ROLES } from './constants/roles';
import { isSiang } from './constants/phases';
import { eventKey, hasSeenEvent, markEventSeen } from './utils/eventSeen';
import { canShowLoversOverlay, LOVERS_OVERLAY_DELAY_MS, shouldShowLoversWave } from './utils/uiVisibility';

const IN_MATCH_PAGES = new Set(['room-lobby', 'intro-fable', 'view-role', 'view-mod']);

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
import LoversWaveOverlay from './components/LoversWaveOverlay';
import { playClickSound } from './utils/audio';

function AppContent() {
  const { currentPage, navigate, players, isHost, moderatorEnabled, roomCode, myData, myPlayerId, roomStatus, gameWinner, handleLeaveGame, devMode, exitDevMode, takeoverDevSlot } = useGameContext();
  const { phase, day, allVoted, seconds } = useTimerContext();
  const [showBoard, setShowBoard] = useState(false);
  const [activeDeathAnimation, setActiveDeathAnimation] = useState(null);
  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const prevPhaseRef = useRef(null);
  const gunshotTimerRef = useRef(null);
  const devMenuRef = useRef(null);

  const inMatch = !!roomCode && IN_MATCH_PAGES.has(currentPage);
  const isDevMenuOpen = devMode && devMenuOpen;

  useEffect(() => {
    if (!isDevMenuOpen) return;
    const onDown = (e) => {
      if (devMenuRef.current && !devMenuRef.current.contains(e.target)) {
        setDevMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isDevMenuOpen]);

  // Global overlays
  const [voteResult, setVoteResult] = useState(null);
  const [showVoteResult, setShowVoteResult] = useState(false);
  const [deadToday, setDeadToday] = useState({ names: [], day: 1, details: {} });
  const [showDeathPopUp, setShowDeathPopUp] = useState(false);
  const [showGunshotEffect, setShowGunshotEffect] = useState(false);
  const [activeLoversBind, setActiveLoversBind] = useState(null);
  const [showLoversOverlay, setShowLoversOverlay] = useState(false);

  // Reset overlay tiap room ganti atau game mulai (menggunakan render phase state adjustment untuk efisiensi & kepatuhan React 19)
  const [prevRoomCode, setPrevRoomCode] = useState(roomCode);
  const [prevPlayerId, setPrevPlayerId] = useState(myPlayerId);
  if (roomCode !== prevRoomCode) {
    setPrevPlayerId(myPlayerId);
    setPrevRoomCode(roomCode);
    setShowVoteResult(false);
    setShowDeathPopUp(false);
    setDeadToday({ names: [], day: 1, details: {} });
    setVoteResult(null);
    setActiveLoversBind(null);
    setShowLoversOverlay(false);
    setShowGunshotEffect(false);
    setActiveDeathAnimation(null);
    setShowBoard(false);
  }
  if (myPlayerId !== prevPlayerId) {
    setPrevPlayerId(myPlayerId);
    setShowBoard(false);
  }

  // Update refs di useEffect saat roomCode berubah (kepatuhan React 19: ref hanya boleh dimodifikasi di effect/handler)
  useEffect(() => {
    prevPhaseRef.current = null;
    if (gunshotTimerRef.current) clearTimeout(gunshotTimerRef.current);
    return () => {
      if (gunshotTimerRef.current) clearTimeout(gunshotTimerRef.current);
    };
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
      if (!data?.timestamp) return;
      const key = eventKey('vote', data.timestamp);
      if (hasSeenEvent(localStorage, roomCode, key)) return;
      markEventSeen(localStorage, roomCode, key);
      setVoteResult(data);
      setShowVoteResult(true);
    });
    return () => {
      unsub();
    };
  }, [roomCode, currentPage]);

  // Listen deadToday langsung — muncul pas ada data (ditulis processNightResults saat Malam→Pagi)
  useEffect(() => {
    if (!roomCode || currentPage === 'landing' || (isHost && moderatorEnabled)) return;
    const deadRef = ref(db, `rooms/${roomCode}/deadToday`);
    const unsub = onValue(deadRef, snap => {
      const data = snap.val();
      if (!data?.names?.length || !myData?.id) return;
      const key = eventKey('dead', data.timestamp);
      if (hasSeenEvent(localStorage, roomCode, key)) return;
      markEventSeen(localStorage, roomCode, key);
      setDeadToday({ names: data.names, day: data.day, details: data.details || {} });

      const myNameStr = myData.name;
      if (data.names.includes(myNameStr)) {
        const cause = data.details?.[myNameStr] || "general";
        if (["hunter", "hunter_backfire", "werewolf", "poison", "hakim"].includes(cause)) {
          setActiveDeathAnimation(cause);
        } else {
          setShowDeathPopUp(true);
        }
      } else {
        setShowDeathPopUp(true);
      }
    });
    return () => unsub();
  }, [roomCode, currentPage, isHost, moderatorEnabled, myData]);

  // Listen gunshotEvent untuk guncangan layar & kilatan merah
  useEffect(() => {
    if (!roomCode || currentPage === 'landing') return;
    const gunshotRef = ref(db, `rooms/${roomCode}/gunshotEvent`);
    const unsub = onValue(gunshotRef, snap => {
      const data = snap.val();
      if (!data?.timestamp) return;
      const key = eventKey('gunshot', data.timestamp);
      if (hasSeenEvent(localStorage, roomCode, key)) return;
      markEventSeen(localStorage, roomCode, key);
      if (data.timestamp <= Date.now() - 4000) return;
      setShowGunshotEffect(true);
      if (gunshotTimerRef.current) clearTimeout(gunshotTimerRef.current);
      gunshotTimerRef.current = setTimeout(() => {
        setShowGunshotEffect(false);
      }, 1200);
    });
    return () => unsub();
  }, [roomCode, currentPage]);

  // Listen loversBindEvent untuk gelombang ganda U saat action Lovers dipilih
  useEffect(() => {
    if (!roomCode || currentPage === 'landing') return;
    const loversRef = ref(db, `rooms/${roomCode}/loversBindEvent`);
    const unsub = onValue(loversRef, snap => {
      const data = snap.val();
      if (!data?.timestamp || !myData?.id) return;
      const myId = myData.id;
      if (!shouldShowLoversWave(myId, data)) return;
      const key = eventKey('lovers', data.timestamp);
      if (hasSeenEvent(localStorage, roomCode, key)) return;
      markEventSeen(localStorage, roomCode, key);
      const partnerName = myId === data.loverId ? data.partnerName : data.loverName;
      setActiveLoversBind({ partnerName, timestamp: data.timestamp });
    });
    return () => unsub();
  }, [roomCode, currentPage, myData?.id]);

  const isGamePage = ['intro-fable', 'view-role', 'view-mod'].includes(currentPage);
  const loversOverlayReady = canShowLoversOverlay(activeLoversBind, isGamePage);
  const loversReadyKey = loversOverlayReady ? activeLoversBind.timestamp : null;
  const [prevLoversReadyKey, setPrevLoversReadyKey] = useState(loversReadyKey);
  if (loversReadyKey !== prevLoversReadyKey) {
    setPrevLoversReadyKey(loversReadyKey);
    if (showLoversOverlay) setShowLoversOverlay(false);
  }

  useEffect(() => {
    if (!loversReadyKey || showLoversOverlay) return;
    const timer = setTimeout(() => setShowLoversOverlay(true), LOVERS_OVERLAY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loversReadyKey, showLoversOverlay]);

  const loversOverlayVisible = Boolean(showLoversOverlay && activeLoversBind && isGamePage);

  const renderPlayerView = () => (
    <div className="fixed inset-0" key={`${myData?.id || 'me'}-${myData?.role || 'none'}`}>
      {showBoard ? (
        <GameBoard onBack={() => setShowBoard(false)} />
      ) : (
        <ViewRole onNext={() => setShowBoard(true)} />
      )}
    </div>
  );

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
        return <Lobby />;
      case 'intro-fable':
        return (
          <IntroFable
            players={players}
            roomCode={roomCode}
            playerData={myData}
            onFinish={async () => {
              if (isHost && moderatorEnabled) {
                await update(ref(db, `rooms/${roomCode}`), { status: "playing", "timer/isActive": true });
              } else {
                // Catat intro selesai biar ViewRole gak ngulang
                await set(ref(db, `rooms/${roomCode}/introFinished/${myData?.id}`), true);
                localStorage.setItem(`intro_${roomCode}`, 'true');
              }
              navigate(isHost && moderatorEnabled ? 'view-mod' : 'view-role');
            }}
          />
        );
      case 'view-mod':
        return (moderatorEnabled || devMode) ? <ModeratorDashboard /> : renderPlayerView();
      case 'view-role':
        return renderPlayerView();
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

      {devMode && (
        <div ref={devMenuRef} className="fixed top-4 right-4 flex flex-col items-end gap-2" style={{ zIndex: Z_LAYER.DEV_BADGE }}>
          <button
            onClick={() => setDevMenuOpen((v) => !v)}
            className="w-10 h-10 rounded-full bg-amber-400 text-slate-900 border-2 border-amber-200 shadow-lg shadow-amber-500/30 flex items-center justify-center text-[10px] font-black lowercase tracking-tight"
            title="Developer mode"
          >
            dev.
          </button>
          {isDevMenuOpen && (
            <div className="w-44 max-h-[70vh] overflow-y-auto rounded-2xl border border-amber-400/30 bg-slate-900/95 backdrop-blur-md shadow-2xl p-2 space-y-1" style={{ zIndex: Z_LAYER.DEV_MENU }}>
              {inMatch && (
                <>
                  <button
                    onClick={() => {
                      setDevMenuOpen(false);
                      navigate('view-mod');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide text-amber-300 hover:bg-amber-500/20 transition-colors border-b border-white/5 mb-1 pb-2"
                  >
                    Dashboard
                  </button>
                  {DEV_ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={async () => {
                        setDevMenuOpen(false);
                        await takeoverDevSlot(role);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-colors ${myData?.role === role ? 'bg-amber-500/20 text-amber-300' : 'text-slate-200 hover:bg-amber-500/20 hover:text-amber-300'}`}
                    >
                      {role}
                    </button>
                  ))}
                </>
              )}
              <button
                onClick={() => {
                  setDevMenuOpen(false);
                  exitDevMode();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide text-red-400 hover:bg-red-500/20 transition-colors border-t border-white/5 mt-1 pt-2"
              >
                Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Red Gunshot Flash Overlay */}
      {showGunshotEffect && (
        <div className="fixed inset-0 bg-red-600/35 pointer-events-none animate-pulse" style={{ zIndex: Z_LAYER.EFFECT_FLASH }} />
      )}

      {/* GLOBAL: Vote Result Overlay — in-game only */}
      {showVoteResult && voteResult && isGamePage && currentPage !== 'view-mod' && !loversOverlayVisible && (
        <VoteAnnouncement
          names={voteResult.names}
          day={voteResult.day}
          isJoker={voteResult.isJoker}
          onClose={() => setShowVoteResult(false)}
        />
      )}

      {/* GLOBAL: Death Announcement — in-game only */}
      {showDeathPopUp && isGamePage && currentPage !== 'view-mod' && !loversOverlayVisible && (
        <DeathAnnouncement
          deadPlayers={deadToday.names}
          deadDetails={deadToday.details}
          day={deadToday.day}
          onClose={() => setShowDeathPopUp(false)}
        />
      )}

      {/* GLOBAL: Lovers Double Wave Overlay saat aksi Lovers dipilih */}
      {showLoversOverlay && activeLoversBind && isGamePage && (
        <LoversWaveOverlay
          partnerName={activeLoversBind.partnerName}
          onFinish={() => {
            setActiveLoversBind(null);
            setShowLoversOverlay(false);
          }}
        />
      )}

      {/* GLOBAL: Personal Death Animation Overlay (1-4) */}
      {activeDeathAnimation && isGamePage && currentPage !== 'view-mod' && !loversOverlayVisible && (
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
      {allVoted && isSiang(phase) && isGamePage && currentPage !== 'view-mod' && !loversOverlayVisible && (
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
  const [authLoaded, setAuthLoaded] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    authReady.then((user) => {
      if (!user) setAuthError(true);
      setAuthLoaded(true);
    });
  }, []);

  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
          Menyambungkan...
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">
          Gagal menyambungkan ke server. Periksa koneksi lalu coba lagi.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

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
