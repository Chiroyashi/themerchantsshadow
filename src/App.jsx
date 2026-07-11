import React from 'react';
import { update, ref } from "firebase/database";
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

function AppContent() {
  const { currentPage, navigate, players, isHost, roomCode, myData, playerName } = useGameContext();

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
            onFinish={() => isHost && update(ref(db, `rooms/${roomCode}`), { status: "playing" })}
          />
        );
      case 'view-mod':
        return <ModeratorDashboard />;
      case 'view-role':
        return (
          <div className="fixed inset-0">
            <div
              className="scroll-container flex h-full w-[200vw] overflow-x-auto overflow-y-hidden"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="w-screen h-full flex-shrink-0">
                <ViewRole
                  onNext={() => {
                    const container = document.querySelector('.scroll-container');
                    if (container) container.scrollLeft = container.clientWidth;
                  }}
                />
              </div>
              <div className="w-screen h-full flex-shrink-0">
                <GameBoard
                  onBack={() => {
                    const container = document.querySelector('.scroll-container');
                    if (container) container.scrollLeft = 0;
                  }}
                />
              </div>
            </div>
          </div>
        );
      default:
        return <LandingPage onNext={() => navigate('introduction')} />;
    }
  };

  return (
    <div className="antialiased selection:bg-red-500/30">
      {renderPage()}
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
