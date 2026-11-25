/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, push, set, update, get, onDisconnect } from "firebase/database";
import { db, auth, authReady } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { distributeRoles } from '../utils/gameLogic';
import { cleanupOldRooms, deleteRoom } from '../utils/dbCleanup';
import { checkWinCondition } from '../utils/winCondition';
import { buildDiagnosticRoom, buildDevTakeoverUpdates, devSlotId } from '../utils/devDiagnostics';
import { useNotification } from './NotificationContext';
import { pickNextHostUid } from '../utils/roomSafety';
import { PHASE } from '../constants/phases';
import { getPhaseDuration } from '../utils/timer';
import { buildModeratorToggleUpdates } from '../utils/actionPayloads';

const GameContext = createContext(null);

const MAX_PLAYERS = 20;
const SESSION_KEYS = ['room_code', 'my_player_id', 'game_match_id', 'last_page'];
const DEV_MODE_KEY = 'dev_mode';
const clearSession = () => {
  SESSION_KEYS.forEach(k => localStorage.removeItem(k));
};

const writeWithRetry = async (write) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await write();
    } catch (e) {
      if (e?.code !== 'permission-denied' || attempt === 1) throw e;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
};

export function GameProvider({ children }) {
  const { showNotif } = useNotification();

  // --- Room State ---
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('room_code') || '');
  const [myPlayerId, setMyPlayerId] = useState(() => localStorage.getItem('my_player_id') || null);
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('player_name') || '');
  const [gameMatchId, setGameMatchId] = useState(() => localStorage.getItem('game_match_id') || '');
  const [players, setPlayers] = useState([]);
  const [isJoining, setIsJoining] = useState(false);
  const [devMode, setDevMode] = useState(() => localStorage.getItem(DEV_MODE_KEY) === 'true');

  // --- Auth UID (from anonymous auth) ---
  const [authUid, setAuthUid] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthUid(user ? user.uid : null);
    });
  }, []);

  // --- Game State ---
  const [gameWinner, setGameWinner] = useState(null);
  const [roomStatus, setRoomStatus] = useState(null);
  const [roleSettings, setRoleSettings] = useState({});
  const moderatorEnabled = roleSettings.Moderator !== false;

  // --- Navigation State ---
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#', '').split('?')[0];
    return hash || localStorage.getItem('last_page') || 'landing';
  });
  const [inviteCode, setInviteCode] = useState(() => {
    const invite = new URLSearchParams(window.location.hash.split('?')[1] || '').get('invite');
    return invite ? invite.toUpperCase().substring(0, 6) : '';
  });

  // --- Refs untuk menghindari stale closures ---
  const notifiedDestroyedRoomRef = useRef(null);
  const destroyRedirectRef = useRef(null);
  const lastPlayerStateRef = useRef('');
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;
  const isJoiningRef = useRef(false);
  const myPlayerIdRef = useRef(myPlayerId);
  myPlayerIdRef.current = myPlayerId;
  const roomStatusRef = useRef(roomStatus);
  roomStatusRef.current = roomStatus;
  const authUidRef = useRef(authUid);
  authUidRef.current = authUid;
  const gameMatchIdRef = useRef(gameMatchId);
  gameMatchIdRef.current = gameMatchId;
  const moderatorEnabledRef = useRef(moderatorEnabled);
  moderatorEnabledRef.current = moderatorEnabled;

  const myData = players.find(p => p.id === myPlayerId);

  // --- Sync ke localStorage & hash ---
  useEffect(() => {
    if (window.location.hash !== `#${currentPage}`) {
      window.history.pushState(null, '', `#${currentPage}`);
    }
    localStorage.setItem('last_page', currentPage);
    localStorage.setItem('room_code', roomCode);
    localStorage.setItem('player_name', playerName);
    localStorage.setItem('game_match_id', gameMatchId);
    if (myPlayerId) {
      localStorage.setItem('my_player_id', myPlayerId);
    }
  }, [currentPage, roomCode, myPlayerId, playerName, gameMatchId]);

  // --- Popstate Handler ---
  useEffect(() => {
    const handlePopState = () => {
      const rawHash = window.location.hash.replace('#', '');
      const [hash, query] = rawHash.split('?');
      setCurrentPage(hash || 'landing');
      const invite = new URLSearchParams(query || '').get('invite');
      if (invite) setInviteCode(invite.toUpperCase().substring(0, 6));
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
        if (notifiedDestroyedRoomRef.current !== roomCode) {
          notifiedDestroyedRoomRef.current = roomCode;
          if (!curIsHost) {
            if (roomStatusRef.current === "ended") {
              showNotif("Permainan Selesai", "Room telah ditutup karena permainan telah selesai.", "info");
            } else {
              showNotif("Room Dibubarkan", "Moderator telah menutup permainan ini.", "error");
            }
          }
          destroyRedirectRef.current = setTimeout(() => {
            clearSession();
            setRoomCode('');
            setMyPlayerId(null);
            setGameMatchId('');
            setCurrentPage('landing');
          }, curIsHost ? 0 : 3000);
        }
        return;
      }

      // --- Validasi gameMatchId ---
      if (data.gameMatchId) {
        const localMatchId = gameMatchIdRef.current;
        if (localMatchId && data.gameMatchId !== localMatchId) {
          clearSession();
          setRoomCode('');
          setMyPlayerId(null);
          setGameMatchId('');
          setCurrentPage('landing');
          return;
        }
        gameMatchIdRef.current = data.gameMatchId;
        setGameMatchId(data.gameMatchId);
      }

      // --- Deteksi Kick ---
      if (!curIsHost && curMyId && data.players && !data.players[curMyId]) {
        if (curPage !== 'landing') {
          showNotif("Dikeluarkan", "Kamu telah dikeluarkan oleh Host.", "error");
          clearSession();
          setRoomCode('');
          setMyPlayerId(null);
          setCurrentPage('landing');
          return;
        }
      }

      // --- Host Detection (from room hostId) ---
      if (data.hostId && authUidRef.current) {
        const isHostNow = data.hostId === authUidRef.current;
        if (isHostNow !== isHostRef.current) {
          setIsHost(isHostNow);
        }
      } else if (!data.hostId && data.status !== 'ended') {
        const nextHostUid = pickNextHostUid(data.members, data.players);
        if (nextHostUid && nextHostUid === authUidRef.current) {
          set(ref(db, `rooms/${roomCode}/hostId`), authUidRef.current).catch(() => {});
        }
      }

      // --- Game Winner ---
      if (data.status === 'ended') setGameWinner(data.winner);
      else setGameWinner(null);

      // --- Players ---
      if (data.players) {
        setPlayers(Object.entries(data.players).map(([id, val]) => ({ id, ...val })));
      }

      if (curIsHost && data.status === 'playing' && data.players) {
        const pistolEntry = Object.entries(data.players).find(([, p]) =>
          p && p.role === 'Hakim' && p.pistolTargetId && !p.pistolResolved
        );
        if (pistolEntry) {
          const [hakimId, hakimData] = pistolEntry;
          const updates = {
            [`rooms/${roomCode}/players/${hakimId}/pistolResolved`]: true,
            [`rooms/${roomCode}/players/${hakimData.pistolTargetId}/status`]: 'dead',
            [`rooms/${roomCode}/deadToday`]: {
              day: data.timer?.day || 1,
              names: hakimData.pistolDeadNames || [],
              details: hakimData.pistolDeadDetails || {},
              timestamp: Date.now()
            }
          };
          if (hakimData.pistolPartnerTargetId) {
            updates[`rooms/${roomCode}/players/${hakimData.pistolPartnerTargetId}/status`] = 'dead';
          }
          update(ref(db), updates).catch(() => {});
        }
      }

      if (curIsHost && data.status === 'playing') {
        const playerStateKey = Object.entries(data.players || {})
          .map(([id, p]) => `${id}:${p.status}`)
          .join('|');
        if (playerStateKey !== lastPlayerStateRef.current) {
          lastPlayerStateRef.current = playerStateKey;
          checkWinCondition(roomCode).catch(() => {});
        }
      }

      // --- Room Status ---
      setRoomStatus(data.status);

      // --- Role Settings ---
      setRoleSettings(data.roleSettings || {});

      // --- Navigasi Otomatis ---
      if (data.status === "intro" && curPage === "room-lobby") {
        setCurrentPage('intro-fable');
      }
      if (data.status === "playing" && ['room-lobby', 'intro-fable'].includes(curPage)) {
        setCurrentPage(moderatorEnabledRef.current && curIsHost ? 'view-mod' : 'view-role');
      }
    }, (error) => {
      if (error?.code !== 'permission_denied') return;
      if (currentPageRef.current === 'landing') return;
      showNotif("Akses Ditolak", "Kamu sudah tidak memiliki akses ke room ini.", "error");
      clearSession();
      setRoomCode('');
      setMyPlayerId(null);
      setGameMatchId('');
      setCurrentPage('landing');
    });

    return () => {
      unsubscribe();
      if (destroyRedirectRef.current) clearTimeout(destroyRedirectRef.current);
    };
  }, [roomCode, showNotif]);

  // --- Actions ---

  const navigate = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const clearInviteCode = useCallback(() => setInviteCode(''), []);

  const activateDevMode = useCallback(() => {
    localStorage.setItem(DEV_MODE_KEY, 'true');
    setDevMode(true);
  }, []);

  const exitDevMode = useCallback(async () => {
    if (roomCode && gameMatchIdRef.current.startsWith('dev_')) {
      notifiedDestroyedRoomRef.current = roomCode;
      try {
        await deleteRoom(roomCode);
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.removeItem(DEV_MODE_KEY);
    clearSession();
    clearTimeout(destroyRedirectRef.current);
    destroyRedirectRef.current = null;
    notifiedDestroyedRoomRef.current = null;
    lastPlayerStateRef.current = '';
    setDevMode(false);
    setRoomCode('');
    setMyPlayerId(null);
    setGameMatchId('');
    gameMatchIdRef.current = '';
    setIsHost(false);
    setPlayers([]);
    setGameWinner(null);
    setRoomStatus(null);
    setRoleSettings({});
    setIsJoining(false);
    isJoiningRef.current = false;
    setInviteCode('');
    setCurrentPage('landing');
  }, [roomCode]);

  const startDiagnostic = useCallback(async ({ moderatorEnabled = true } = {}) => {
    if (isJoiningRef.current) return;
    let uid = authUidRef.current || auth.currentUser?.uid || null;
    if (!uid) {
      try { await authReady; } catch { /* ignore */ }
      uid = authUidRef.current || auth.currentUser?.uid || null;
    }
    if (!uid) {
      showNotif("Error", "Auth belum siap. Coba lagi.", "error");
      return;
    }
    isJoiningRef.current = true;
    setIsJoining(true);
    let step = 'createRoom';
    try {
      await cleanupOldRooms();
      await auth.currentUser?.getIdToken?.();
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newMatchId = "dev_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      const now = Date.now();
      const { roomData, updates: roomUpdates, hostSlotId: newHostSlotId, hostRole } = buildDiagnosticRoom({
        uid,
        matchId: newMatchId,
        moderatorEnabled,
        now
      });
      await writeWithRetry(() => set(ref(db, "rooms/" + newCode), roomData));
      step = 'onDisconnect';
      await onDisconnect(ref(db, `rooms/${newCode}/members/${uid}`)).remove().catch(() => {});

      step = 'seedState';
      const updates = {};
      Object.entries(roomUpdates).forEach(([path, value]) => {
        updates[`rooms/${newCode}/${path}`] = value;
      });
      await writeWithRetry(() => update(ref(db), updates));

      setRoomCode(newCode);
      setMyPlayerId(newHostSlotId);
      setGameMatchId(newMatchId);
      gameMatchIdRef.current = newMatchId;
      notifiedDestroyedRoomRef.current = null;
      lastPlayerStateRef.current = '';
      setIsHost(true);
      setPlayerName(hostRole);
      setCurrentPage(hostRole === 'Moderator' ? 'view-mod' : 'view-role');
    } catch (e) {
      console.error(e);
      const detail = e?.code || e?.message || "unknown";
      showNotif("Error", `Gagal memulai diagnostic [${step}]: ${detail}`, "error");
    } finally {
      isJoiningRef.current = false;
      setIsJoining(false);
    }
  }, [showNotif]);

  const takeoverDevSlot = useCallback(async (nextRole) => {
    if (!devMode || !roomCode || !isHostRef.current) return;
    if (roomStatusRef.current === 'ended') return;
    const uid = authUidRef.current || auth.currentUser?.uid;
    if (!uid) return;

    const updates = buildDevTakeoverUpdates({
      roomCode,
      uid,
      role: nextRole,
      previousRole: playerName
    });
    if (!updates) return;

    if (roomStatusRef.current === 'intro') {
      const targetSlotId = devSlotId(nextRole);
      updates[`rooms/${roomCode}/status`] = 'playing';
      updates[`rooms/${roomCode}/introFinished/${targetSlotId}`] = true;
      updates[`rooms/${roomCode}/timer/isActive`] = true;
      updates[`rooms/${roomCode}/timer/endsAt`] = Date.now() + getPhaseDuration(PHASE.PAGI, 1) * 1000;
    }

    try {
      await writeWithRetry(() => update(ref(db), updates));
      setMyPlayerId(devSlotId(nextRole));
      setPlayerName(nextRole);
      localStorage.setItem(`intro_${roomCode}`, 'true');
      navigate(nextRole === 'Moderator' ? 'view-mod' : 'view-role');
    } catch (e) {
      console.error(e);
      showNotif("Error", `Gagal mengambil alih slot dev: ${e?.code || e?.message || "unknown"}`, "error");
    }
  }, [devMode, roomCode, playerName, navigate, showNotif]);

  const handleCreateRoom = useCallback(async (name) => {
    await cleanupOldRooms();
    const finalName = name || "Moderator";
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hostId = authUidRef.current;
    if (!hostId) {
      showNotif("Error", "Auth belum siap. Coba lagi.", "error");
      return;
    }
    const newMatchId = "match_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    const roomData = {
      gameMatchId: newMatchId,
      hostId: hostId,
      status: "waiting",
      host: finalName,
      roleSettings: { Moderator: true },
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      members: { [hostId]: hostId },
      timer: { isActive: false, seconds: 60, phase: "Pagi (Diskusi)", day: 1 },
      players: {
        [hostId]: { name: finalName + " (Moderator)", role: "Moderator", status: "alive", authUid: hostId }
      }
    };
    await set(ref(db, "rooms/" + newCode), roomData);
    await onDisconnect(ref(db, `rooms/${newCode}/members/${hostId}`)).remove().catch(() => {});
    setRoomCode(newCode);
    setMyPlayerId(hostId);
    setGameMatchId(newMatchId);
    gameMatchIdRef.current = newMatchId;
    notifiedDestroyedRoomRef.current = null;
    lastPlayerStateRef.current = '';
    setIsHost(true);
    setPlayerName(finalName);
    setCurrentPage('room-lobby');
  }, [showNotif]);

  const handleJoinRoom = useCallback(async (code, inputName) => {
    if (isJoining) return;
    const uid = authUidRef.current;
    if (!uid) {
      showNotif("Error", "Auth belum siap. Coba lagi.", "error");
      return;
    }
    setIsJoining(true);
    const finalName = inputName || "Player";
    try {
      const snapshot = await get(ref(db, `rooms/${code}`));
      if (!snapshot.exists()) {
        setIsJoining(false);
        showNotif("Gagal", "Room tidak ditemukan.", "error");
        return;
      }
      const roomVal = snapshot.val();

      // Restore session jika sudah jadi anggota (host via hostId, player via authUid) — hindari duplikat
      const existing = (() => {
        if (roomVal.hostId === uid) return { id: roomVal.hostId, isHost: true, name: roomVal.host || finalName };
        for (const [id, p] of Object.entries(roomVal.players || {})) {
          if (p && p.authUid === uid && !p.leftAt) return { id, isHost: false, name: p.name || finalName };
        }
        return null;
      })();
      if (existing) {
        setRoomCode(code);
        setMyPlayerId(existing.id);
        setGameMatchId(roomVal.gameMatchId || '');
        gameMatchIdRef.current = roomVal.gameMatchId || '';
        notifiedDestroyedRoomRef.current = null;
        lastPlayerStateRef.current = '';
        setIsHost(existing.isHost);
        setPlayerName(existing.name);
        setCurrentPage('room-lobby');
        setIsJoining(false);
        return;
      }

      if (roomVal.status !== "waiting") {
        setIsJoining(false);
        const msg = roomVal.status === "ended"
          ? "Permainan telah selesai. Minta link room baru dari moderator."
          : "Game sedang berlangsung. Tunggu room baru dari moderator.";
        showNotif("Ditolak", msg, "error");
        return;
      }
      const moderatorOn = roomVal.roleSettings?.Moderator !== false;
      const participantCount = Object.values(roomVal.players || {}).filter(p => p && !p.leftAt && (!moderatorOn || p.role !== 'Moderator')).length;
      if (participantCount >= MAX_PLAYERS) {
        setIsJoining(false);
        showNotif("Penuh", `Room sudah mencapai ${MAX_PLAYERS} pemain.`, "error");
        return;
      }
      const newPlayerRef = push(ref(db, `rooms/${code}/players`));
      await update(ref(db), {
        [`rooms/${code}/players/${newPlayerRef.key}`]: {
          name: finalName,
          role: "Pending",
          status: "alive",
          joinedAt: Date.now(),
          authUid: uid
        },
        [`rooms/${code}/members/${uid}`]: newPlayerRef.key
      });
      setRoomCode(code);
      setMyPlayerId(newPlayerRef.key);
      setGameMatchId(roomVal.gameMatchId || '');
      gameMatchIdRef.current = roomVal.gameMatchId || '';
      notifiedDestroyedRoomRef.current = null;
        lastPlayerStateRef.current = '';
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
    if (!isHost) return;
    const target = players.find(p => p.id === targetId);
    const updates = { [`rooms/${roomCode}/players/${targetId}`]: null };
    if (target && target.authUid) {
      updates[`rooms/${roomCode}/members/${target.authUid}`] = null;
    }
    await update(ref(db), updates);
  }, [isHost, players, roomCode]);

  const handleStartGame = useCallback(async () => {
    const activePlayers = players.filter(p => p.status !== 'dead');
    const hostId = authUidRef.current;
    const startPlayers = moderatorEnabled
      ? activePlayers
      : activePlayers.map(p => p.id === hostId
        ? { ...p, role: 'Pending', name: (p.name || '').replace(/ \(Moderator\)$/, '') }
        : p);
    const participants = startPlayers.filter(p => p.role !== 'Moderator');
    if (participants.length < 5) {
      showNotif("Gagal", "Minimal 5 pemain (di luar Moderator)!", "error");
      return;
    }
    const playersWithRoles = distributeRoles(startPlayers, roleSettings);
    const updates = {};
    playersWithRoles.forEach(p => {
      updates["players/" + p.id + "/role"] = p.role;
      updates["players/" + p.id + "/status"] = "alive";
      updates["players/" + p.id + "/name"] = p.name;
    });
    updates["introStartedAt"] = Date.now();
    updates["lastActivityAt"] = Date.now();
    updates["status"] = "intro";
    await update(ref(db, "rooms/" + roomCode), updates);

    if (!moderatorEnabled) {
      const successor = playersWithRoles.find(p => p.id !== hostId);
      await onDisconnect(ref(db, `rooms/${roomCode}/hostId`)).cancel().catch(() => {});
      await onDisconnect(ref(db, `rooms/${roomCode}/hostId`)).set(successor?.authUid || null).catch(() => {});
    }
  }, [players, roomCode, roleSettings, moderatorEnabled, showNotif]);

  const handleKillPlayer = useCallback(async (id, status) => {
    if (isHost) {
      try {
        await update(ref(db, "rooms/" + roomCode + "/players/" + id), {
          status: status === 'dead' ? 'alive' : 'dead'
        });
        await checkWinCondition(roomCode);
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
    try {
      await deleteRoom(roomCode);
    } catch {
      showNotif("Gagal", "Room gagal dihapus. Coba lagi.", "error");
      return;
    }
    clearSession();
    setRoomCode('');
    setMyPlayerId(null);
    setGameMatchId('');
    setCurrentPage('room-setup');
  }, [isHost, roomCode, showNotif]);

  const handleLeaveGame = useCallback(async (hasWinner, redirectPage = 'landing') => {
    try {
      if (hasWinner && isHost) {
        await deleteRoom(roomCode);
      } else if (!hasWinner && myPlayerId) {
        const updates = {
          [`rooms/${roomCode}/players/${myPlayerId}/status`]: 'dead',
          [`rooms/${roomCode}/players/${myPlayerId}/leftAt`]: Date.now()
        };
        if (isHost && !moderatorEnabled) {
          const successor = players.find(p => p.id !== myPlayerId && p.status !== 'dead');
          updates[`rooms/${roomCode}/hostId`] = successor?.authUid || null;
        }
        if (authUidRef.current) {
          updates[`rooms/${roomCode}/members/${authUidRef.current}`] = null;
        }
        await update(ref(db), updates);
      }
    } catch {
      showNotif("Gagal", "Gagal keluar dari room. Coba lagi.", "error");
      return;
    }
    clearSession();
    setRoomCode('');
    setMyPlayerId(null);
    setGameMatchId('');
    setCurrentPage(redirectPage);
  }, [roomCode, myPlayerId, isHost, moderatorEnabled, players, showNotif]);

  const handleLeaveLobby = useCallback(async () => {
    try {
      if (isHost) {
        await deleteRoom(roomCode);
      } else if (myPlayerId) {
        const updates = { [`rooms/${roomCode}/players/${myPlayerId}`]: null };
        if (authUidRef.current) {
          updates[`rooms/${roomCode}/members/${authUidRef.current}`] = null;
        }
        await update(ref(db), updates);
      }
    } catch {
      showNotif("Gagal", "Gagal keluar dari room. Coba lagi.", "error");
      return;
    }
    clearSession();
    setRoomCode('');
    setMyPlayerId(null);
    setGameMatchId('');
    setCurrentPage('room-setup');
  }, [isHost, roomCode, myPlayerId, showNotif]);

  const handleToggleRole = useCallback(async (roleName, isEnabled) => {
    if (!isHost || !roomCode || !myPlayerId) return;
    if (roleName === 'Moderator') {
      await update(ref(db), buildModeratorToggleUpdates({
        roomCode,
        playerId: myPlayerId,
        playerName,
        isEnabled
      }));
      return;
    }
    await set(ref(db, `rooms/${roomCode}/roleSettings/${roleName}`), isEnabled);
  }, [isHost, roomCode, myPlayerId, playerName]);

  const handleRename = useCallback(async (name) => {
    if (!roomCode || !myPlayerId || !name.trim()) return;
    const clean = name.trim();
    if (isHost) {
      await update(ref(db, `rooms/${roomCode}`), { host: clean });
      await update(ref(db, `rooms/${roomCode}/players/${myPlayerId}`),
        { name: moderatorEnabled ? clean + " (Moderator)" : clean });
    } else {
      await update(ref(db, `rooms/${roomCode}/players/${myPlayerId}`), { name: clean });
    }
    setPlayerName(clean);
  }, [roomCode, myPlayerId, isHost, moderatorEnabled]);

  const value = {
    // State
    roomCode, myPlayerId, isHost, playerName, players, myData,
    gameWinner, roomStatus, isJoining, roleSettings, moderatorEnabled, authUid,
    currentPage, inviteCode, devMode,
    // Actions
    navigate, clearInviteCode, handleCreateRoom, handleJoinRoom, handleKickPlayer,
    handleStartGame, handleKillPlayer, handleEndGame,
    handleDestroyRoom, handleLeaveGame, handleToggleRole, handleLeaveLobby, handleRename,
    activateDevMode, exitDevMode, startDiagnostic, takeoverDevSlot,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}
