/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, push, set, update, get } from "firebase/database";
import { db } from "../lib/firebase";
import { distributeRoles } from '../utils/gameLogic';
import { cleanupOldRooms, deleteRoom } from '../utils/dbCleanup';
import { useNotification } from './NotificationContext';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { showNotif } = useNotification();

  // --- Room State ---
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('room_code') || '');
  const [myPlayerId, setMyPlayerId] = useState(() => localStorage.getItem('my_player_id') || null);
  const [isHost, setIsHost] = useState(() => {
    const local = localStorage.getItem('is_host') === 'true';
    const id = localStorage.getItem('my_player_id');
    return local || (id && id.startsWith("host_")) || false;
  });
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('player_name') || '');
  const [players, setPlayers] = useState([]);
  const [isJoining, setIsJoining] = useState(false);

  // Sync isHost dengan format myPlayerId
  useEffect(() => {
    if (myPlayerId) {
      const isHostId = myPlayerId.startsWith("host_");
      setIsHost(isHostId);
      localStorage.setItem('is_host', isHostId ? 'true' : 'false');
    }
  }, [myPlayerId]);

  // --- Game State ---
  const [gameWinner, setGameWinner] = useState(null);
  const [roomStatus, setRoomStatus] = useState(null);

  // --- Navigation State ---
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || localStorage.getItem('last_page') || 'landing';
  });

  // --- Refs untuk menghindari stale closures ---
  const hasShownDestroyedRef = useRef(false);
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;
  const myPlayerIdRef = useRef(myPlayerId);
  myPlayerIdRef.current = myPlayerId;

  const myData = players.find(p => p.id === myPlayerId);

  // --- Sync ke localStorage & hash ---
  useEffect(() => {
    if (window.location.hash !== `#${currentPage}`) {
      window.history.pushState(null, '', `#${currentPage}`);
    }
    localStorage.setItem('last_page', currentPage);
    localStorage.setItem('room_code', roomCode);
    localStorage.setItem('is_host', isHost);
    localStorage.setItem('player_name', playerName);
    if (myPlayerId) {
      localStorage.setItem('my_player_id', myPlayerId);
    }
  }, [currentPage, roomCode, isHost, myPlayerId, playerName]);

  // --- Popstate Handler ---
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '') || 'landing';
      setCurrentPage(hash);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- Firebase Listener untuk rooms/{roomCode} ---
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      const curPage = currentPageRef.current;
      const curIsHost = isHostRef.current;
      const curMyId = myPlayerIdRef.current;

      // --- Room Destroyed ---
      if (!data || data.status === "destroyed") {
        if (!hasShownDestroyedRef.current) {
          hasShownDestroyedRef.current = true;
          showNotif("Room Dibubarkan", "Moderator telah menutup permainan ini.", "error");
          setTimeout(() => {
            localStorage.clear();
            setRoomCode('');
            setMyPlayerId(null);
            setCurrentPage('landing');
          }, 3000);
        }
        return;
      }

      // --- Deteksi Kick ---
      if (!curIsHost && curMyId && data.players && !data.players[curMyId]) {
        if (curPage !== 'landing') {
          showNotif("Dikeluarkan", "Kamu telah dikeluarkan oleh Host.", "error");
          localStorage.clear();
          setRoomCode('');
          setMyPlayerId(null);
          setCurrentPage('landing');
          return;
        }
      }

      // --- Game Winner ---
      if (data.status === 'ended') setGameWinner(data.winner);
      else setGameWinner(null);

      // --- Players ---
      if (data.players) {
        setPlayers(Object.entries(data.players).map(([id, val]) => ({ id, ...val })));
      }

      // --- Room Status ---
      setRoomStatus(data.status);

      // --- Navigasi Otomatis ---
      if (data.status === "intro" && curPage === "room-lobby") {
        setCurrentPage('intro-fable');
      }
      if (data.status === "playing" && curPage === "room-lobby") {
        setCurrentPage(curIsHost ? 'view-mod' : 'view-role');
      }
    });

    return () => unsubscribe();
  }, [roomCode, showNotif]);

  // --- Actions ---

  const navigate = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleCreateRoom = useCallback(async (name) => {
    await cleanupOldRooms();
    const finalName = name || "Moderator";
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hostId = "host_" + Date.now();
    const roomData = {
      status: "waiting",
      host: finalName,
      createdAt: Date.now(),
      timer: { isActive: false, seconds: 120, phase: "Pagi (Diskusi)", day: 1 },
      players: {
        [hostId]: { name: finalName + " (Moderator)", role: "Moderator", status: "alive" }
      }
    };
    await set(ref(db, "rooms/" + newCode), roomData);
    setRoomCode(newCode);
    setMyPlayerId(hostId);
    setIsHost(true);
    setPlayerName(finalName);
    setCurrentPage('room-lobby');
  }, []);

  const handleJoinRoom = useCallback(async (code, inputName) => {
    if (isJoining) return;
    setIsJoining(true);
    await cleanupOldRooms();
    const finalName = inputName || "Player";
    try {
      const snapshot = await get(ref(db, `rooms/${code}`));
      if (!snapshot.exists()) {
        setIsJoining(false);
        showNotif("Gagal", "Room tidak ditemukan.", "error");
        return;
      }
      if (snapshot.val().status !== "waiting") {
        setIsJoining(false);
        showNotif("Ditolak", "Game sedang berjalan.", "error");
        return;
      }
      const newPlayerRef = push(ref(db, `rooms/${code}/players`));
      await set(newPlayerRef, { name: finalName, role: "Pending", status: "alive", joinedAt: Date.now() });
      setRoomCode(code);
      setMyPlayerId(newPlayerRef.key);
      setIsHost(false);
      setPlayerName(finalName);
      setCurrentPage('room-lobby');
    } catch {
      showNotif("Error", "Gagal masuk ke room.", "error");
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, showNotif]);

  const handleKickPlayer = useCallback(async (targetId) => {
    if (isHost) {
      await set(ref(db, "rooms/" + roomCode + "/players/" + targetId), null);
    }
  }, [isHost, roomCode]);

  const handleStartGame = useCallback(async () => {
    if (players.length < 6) {
      showNotif("Gagal", "Minimal 6 pemain!", "error");
      return;
    }
    const playersWithRoles = distributeRoles(players);
    const updates = {};
    playersWithRoles.forEach(p => {
      updates["players/" + p.id + "/role"] = p.role;
      updates["players/" + p.id + "/status"] = "alive";
    });
    updates["introStartedAt"] = Date.now();
    updates["status"] = "intro";
    await update(ref(db, "rooms/" + roomCode), updates);
  }, [players, roomCode, showNotif]);

  const handleKillPlayer = useCallback(async (id, status) => {
    if (isHost) {
      try {
        await update(ref(db, "rooms/" + roomCode + "/players/" + id), {
          status: status === 'dead' ? 'alive' : 'dead'
        });
      } catch (e) {
        console.error("Gagal toggle status player:", e);
      }
    }
  }, [isHost, roomCode]);

  const handleEndGame = useCallback(async (winner) => {
    if (!isHost) return;
    await update(ref(db, "rooms/" + roomCode), { status: "ended", winner, endedAt: Date.now() });
    setGameWinner(winner);
  }, [isHost, roomCode]);

  const handleDestroyRoom = useCallback(async () => {
    if (!isHost) return;
    await deleteRoom(roomCode);
    localStorage.clear();
    setRoomCode('');
    setMyPlayerId(null);
    setCurrentPage('landing');
  }, [isHost, roomCode]);

  const handleLeaveGame = useCallback(async (hasWinner) => {
    if (hasWinner && isHost) {
      await deleteRoom(roomCode);
    } else if (!hasWinner) {
      update(ref(db, `rooms/${roomCode}/players/${myPlayerId}`), { status: "dead" });
    }
    localStorage.clear();
    setRoomCode('');
    setMyPlayerId(null);
    setCurrentPage('landing');
  }, [isHost, roomCode, myPlayerId]);

  const value = {
    // State
    roomCode, myPlayerId, isHost, playerName, players, myData,
    gameWinner, roomStatus, isJoining,
    currentPage, setHasShownDestroyed: () => { hasShownDestroyedRef.current = true; },
    // Actions
    navigate, handleCreateRoom, handleJoinRoom, handleKickPlayer,
    handleStartGame, handleKillPlayer, handleEndGame,
    handleDestroyRoom, handleLeaveGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}
