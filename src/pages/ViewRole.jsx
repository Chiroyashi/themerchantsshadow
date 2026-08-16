import React, { useState, useEffect, useRef } from 'react';
import { ref, set, onValue, update, push } from "firebase/database";
import { db } from "../lib/firebase";
import {
  Eye, EyeOff, Shield, Skull, HelpCircle, BookOpen, X, Ghost,
  LayoutGrid, MessageSquare, Send, Zap, Search, Crosshair,
  ShoppingCart, ChevronUp, User, UserCheck, Info, Clock, Gavel, ShoppingBag
} from 'lucide-react';
import SharedTimer from '../components/SharedTimer';
import RoleModal from '../components/RoleModal';
import ChatRoom from '../components/ChatRoom';
import IntroFable from '../components/IntroFable';
import GameOverScreen from '../components/GameOverScreen';
import { useGameContext } from '../contexts/GameContext';
import { useTimerContext } from '../contexts/TimerContext';
import { playNotificationChime } from '../utils/audio';
import { useNotification } from '../contexts/NotificationContext';
import { checkWinCondition } from '../utils/winCondition';
import { getRoleActionConfig } from '../utils/roleActions';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import { isSiang, isMalam, isPagi } from '../constants/phases';

const getTimestamp = () => Date.now();

const CrackedOverlay = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 100 100" preserveAspectRatio="none">
    {/* Core heavy fracture */}
    <path
      d="M15,0 L30,30 L20,55 L45,75 L35,100"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className="text-slate-600/85"
    />
    {/* Secondary cracks */}
    <path
      d="M30,30 L60,35 L75,15 L100,20 M20,55 L0,65 M45,75 L75,80 L100,60 M75,80 L80,100 M60,35 L65,0"
      stroke="currentColor"
      strokeWidth="1.0"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className="text-slate-600/50"
    />
  </svg>
);

const ViewRole = ({ onNext }) => {
  const {
    players, roomCode, myData,
    isHost, gameWinner, handleLeaveGame
  } = useGameContext();
  const totalPlayers = players.filter(p => p.role !== 'Moderator').length;
  const { seconds, phase, isActive, day } = useTimerContext();
  const { showNotif } = useNotification();
  const playerData = myData;
  const winner = gameWinner;
  const onLeave = () => handleLeaveGame(!!gameWinner, 'room-setup');
  // --- 1. DEKLARASI SEMUA HOOKS (WAJIB DI ATAS) ---
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);
  const [actionTarget, setActionTarget] = useState("");
  const [showTargetList, setShowTargetList] = useState(false);
  const [myClues, setMyClues] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  const [showCluePopup, setShowCluePopup] = useState(false);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [actionPopupData, setActionPopupData] = useState(null);
  const prevPhaseRef = useRef(phase);

  const isDead = playerData?.status === 'dead';
  const isNight = isMalam(phase);
  const role = playerData?.role?.toLowerCase() || "";

  const [optimisticActed, setOptimisticActed] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  // Warlock-specific state
  const [warlockChoice, setWarlockChoice] = useState(null); // 'buy' or 'skip'
  const [warlockItem, setWarlockItem] = useState(null); // 'poison' or 'vision'

  // Reset local states on day/phase transition (render phase state adjustment)
  const [prevDayPhase, setPrevDayPhase] = useState({ day, phase });
  if (day !== prevDayPhase.day || phase !== prevDayPhase.phase) {
    setPrevDayPhase({ day, phase });
    setOptimisticActed(false);
    setActionStatus(null);
    setWarlockChoice(null);
    setWarlockItem(null);
  }

  // Derive acted status from Firebase data + local optimistic updates
  const actedFromDb = (() => {
    if (!playerData) return false;
    const roleLower = role.toLowerCase();
    if (roleLower.includes('warlock')) {
      return !!playerData.warlockActed;
    } else if (roleLower.includes('hakim')) {
      return isNight ? !!playerData.truthActed : !!playerData.pistolActed;
    } else {
      return !!playerData.currentAction;
    }
  })();
  const hasActedThisNight = optimisticActed || actedFromDb;

  const getWerewolfVoteCount = (targetPlayerId) => {
    if (!role.includes("werewolf")) return 0;
    return (players || []).filter(p =>
      p.role === 'Werewolf' &&
      p.status !== 'dead' &&
      p.currentAction &&
      p.currentAction.role === 'Werewolf' &&
      p.currentAction.action === 'kill' &&
      p.currentAction.targetId === targetPlayerId
    ).length;
  };

  const getWerewolfSkipVotesCount = () => {
    if (!role.includes("werewolf")) return 0;
    return (players || []).filter(p =>
      p.role === 'Werewolf' &&
      p.status !== 'dead' &&
      p.currentAction &&
      p.currentAction.role === 'Werewolf' &&
      p.currentAction.action === 'kill' &&
      p.currentAction.targetId === 'skip'
    ).length;
  };

  // ── Gunakan getRoleActionConfig dari roleActions.js ──
  const roleState = {
    hasActed: hasActedThisNight,
    pistolUsedCount: playerData?.pistolUsedCount || 0,
    pistolActed: playerData?.pistolActed || false,
    truthActed: playerData?.truthActed || false,
    hunterActed: playerData?.hunterActed || false,
    lastProtectedDay: playerData?.lastProtectedDay || 0,
    warlockInventory: playerData?.warlockInventory,
    warlockSkipped: playerData?.warlockSkipped,
    warlockItemUsed: playerData?.warlockItemUsed,
    warlockActed: playerData?.warlockActed,
    currentPhase: phase,
    alivePedagangCount: players.filter(p => p.role === 'Pedagang' && p.status !== 'dead').length,
  };
  const actionConfig = getRoleActionConfig(playerData?.role || '', day, totalPlayers, roleState);

  // Auto-redirect ke GameBoard saat Siang
  useEffect(() => {
    if (!phase || isDead || isHost) return;
    const isSiangPhase = isSiang(phase);
    const wasNotSiang = !isSiang(prevPhaseRef.current);
    if (isSiangPhase && wasNotSiang) {
      onNext();
    }
    prevPhaseRef.current = phase;
  }, [phase, isDead, isHost, onNext]);

  useEffect(() => {
    const checkIntro = async () => {
      // Jika sudah ada di localStorage atau bukan hari 1 phase Pagi, skip
      if (localStorage.getItem(`intro_${roomCode}`)) return;
      // Hanya tampilkan intro jika day = 1 dan phase ada dan contains "Pagi"
      if (day !== 1 || !phase || !isPagi(phase) || winner) return;

      // Cek Firebase apakah intro sudah selesai untuk player ini
      const introFinishedRef = ref(db, `rooms/${roomCode}/introFinished/${playerData?.id}`);
      const snapshot = await new Promise((resolve) => {
        onValue(introFinishedRef, (s) => resolve(s), { onlyOnce: true });
      });

      if (!snapshot.val()) {
        setShowIntro(true);
      } else {
        localStorage.setItem(`intro_${roomCode}`, 'true');
      }
    };

    if (day && phase) {
      checkIntro();
    }
  }, [day, phase, roomCode, winner, playerData?.id]);

  // Hakim pistol tracking
  const pistolUsedCount = playerData?.pistolUsedCount || 0;
  const pistolRemaining = Math.max(0, 2 - pistolUsedCount);

  // Guard constraint: usage-based — tidak bisa melindungi pemain sama 2x berturut-turut
  const guardLastProtected = playerData?.lastProtectedTarget || null;

  // Guard constraint: maksimal 1x lindungi diri sendiri
  const guardSelfProtected = playerData?.selfProtectedCount || 0;
  const canGuardSelf = guardSelfProtected < 1;

  // --- 2. SEMUA USE EFFECTS ---
  useEffect(() => {
    if (!roomCode || !role.includes("hakim")) return;
    const activityRef = ref(db, `rooms/${roomCode}/truthActivity`);
    const unsubscribe = onValue(activityRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.timestamp > (Date.now() - 3000)) {
        playNotificationChime();
        setActionStatus({ type: 'success', msg: `AKTIVITAS TERDETEKSI: ${data.msg}` });
        setTimeout(() => setActionStatus(null), 4000);
      }
    });
    return () => unsubscribe();
  }, [roomCode, role]);

  useEffect(() => {
    if (role.includes("pedagang") && playerData?.id) {
      const clueRef = ref(db, `rooms/${roomCode}/merchantClues/${playerData.id}`);
      const unsubscribe = onValue(clueRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.message) {
          setMyClues(data);
          const isDismissed = localStorage.getItem(`dismissed_clue_${roomCode}_${day}`) === 'true';
          if (!isDismissed) {
            setShowCluePopup(true);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [roomCode, playerData?.id, role, day]);

  // ── Morning popup: 1 generic listener untuk semua role ──
  useEffect(() => {
    if (!roomCode || !playerData?.id) return;

    const POPUP_CONFIGS = [
      {
        role: 'seer',
        path: `rooms/${roomCode}/seerResult/${playerData.id}`,
        validate: (d) => d && d.role,
        map: (d) => ({
          icon: '👁️', title: 'Hasil Pengintaian',
          desc: `Kamu memeriksa ${d.name}`,
          targetName: d.name, targetRole: d.role,
        }),
      },
      {
        role: 'hunter',
        path: `rooms/${roomCode}/hunterResult/${playerData.id}`,
        validate: (d) => d && d.targetName,
        map: (d) => {
          const isMiss = !d.isCorrect;
          return {
            icon: '🎯', title: isMiss ? 'Salah Tembak!' : 'Tembakan Tepat!',
            desc: `Kamu menembak ${d.targetName}`,
            targetName: d.targetName, targetRole: d.targetRole,
            isHunterResult: true, isMiss,
          };
        },
      },
      {
        role: 'werewolf',
        path: `rooms/${roomCode}/werewolfResult/${playerData.id}`,
        validate: (d) => d && d.targetName,
        map: (d) => ({
          icon: '🐺', title: d.blocked ? 'Diblokir!' : 'Eksekusi Berhasil',
          desc: d.blocked ? `${d.targetName} dilindungi!` : `Kamu membunuh ${d.targetName}`,
        }),
      },
      {
        role: 'warlock',
        path: `rooms/${roomCode}/warlockResult/${playerData.id}`,
        validate: (d) => d && d.targetName,
        map: (d) => {
          if (d.item === 'vision') {
            return {
              icon: '👁️',
              title: 'Hasil Penerawangan',
              desc: `Kamu menerawang ${d.targetName}`,
              targetName: d.targetName,
              targetRole: d.targetRole,
            };
          }
          const label = d.item === 'poison' ? '☠️ Poison' : '👁️ Vision';
          return {
            icon: label,
            title: 'Hasil Aksi',
            desc: `${label} pada ${d.targetName}${d.dead ? ' — Target mati!' : ' — Target selamat'}`,
          };
        },
      },
    ];

    const unsubs = POPUP_CONFIGS
      .filter(cfg => role.includes(cfg.role))
      .map(cfg => {
        const ref_ = ref(db, cfg.path);
        return onValue(ref_, (snap) => {
          const data = snap.val();
          if (cfg.validate(data)) {
            const isDismissed = localStorage.getItem(`dismissed_action_${roomCode}_${day}_${phase}`) === 'true';
            setActionPopupData(cfg.map(data));
            if (!isDismissed) {
              setShowActionPopup(true);
            }
          }
        });
      });

    return () => unsubs.forEach(u => u());
  }, [roomCode, playerData?.id, role, day, phase]);

  // Scroll lock for popups
  useEffect(() => {
    if (showActionPopup) { lockScroll(); return () => unlockScroll(); }
  }, [showActionPopup]);
  useEffect(() => {
    if (showCluePopup) { lockScroll(); return () => unlockScroll(); }
  }, [showCluePopup]);

  // --- 3. HELPER FUNCTIONS ---
  const handleIntroFinish = () => {
    setShowIntro(false);
    localStorage.setItem(`intro_${roomCode}`, 'true');
    if (!isHost && onNext) onNext();
  };

  const handleWarlockUse = async () => {
    if (!actionTarget || hasActedThisNight) return;
    const targetPlayer = players.find(p => p.id === actionTarget);
    const item = playerData?.warlockInventory;
    if (!item) return;

    const folder = `malam_${day}`;

    if (item === 'poison') {
      setActionPopupData({
        icon: '☠️',
        title: `Menggunakan POISON`,
        desc: `Kamu menggunakan poison pada ${targetPlayer?.name}`
      });
      setShowActionPopup(true);
    }
    setOptimisticActed(true);

    const updates = {};
    updates[`rooms/${roomCode}/players/${playerData.id}/currentAction`] = {
      role: "Warlock", action: "use", warlockAction: "use",
      purchasedItem: item,
      targetId: actionTarget, targetName: targetPlayer?.name || "Unknown",
      timestamp: getTimestamp()
    };
    updates[`rooms/${roomCode}/players/${playerData.id}/warlockItemUsed`] = true;
    updates[`rooms/${roomCode}/players/${playerData.id}/warlockInventory`] = null;
    updates[`rooms/${roomCode}/players/${playerData.id}/warlockActed`] = true;
    updates[`rooms/${roomCode}/nightHistory/${folder}/${playerData.id}`] = {
      senderName: playerData.name, role: "Warlock",
      action: item.toUpperCase(),
      targetId: actionTarget, targetName: targetPlayer?.name,
      timestamp: getTimestamp()
    };

    if (item === 'vision') {
      updates[`rooms/${roomCode}/warlockResult/${playerData.id}`] = {
        item: 'vision',
        targetName: targetPlayer?.name || "Unknown",
        targetRole: targetPlayer?.role || "Unknown",
        timestamp: getTimestamp()
      };
    }

    try {
      await update(ref(db), updates);
      await checkWinCondition(roomCode);
    } catch {
      setOptimisticActed(false);
    }
  };

  const handleNightAction = (type) => {
    // ACTION: block jika sudah acted, kecuali skip (skip juga diblok)
    if (hasActedThisNight) return;

    // Handle Warlock 2-stage action
    if (role.includes('warlock') && isNight) {
      if (!warlockChoice) {
        setWarlockChoice(type);
        if (type === 'skip') {
          setOptimisticActed(true);
          sendWarlockAction('skip', null, null);
        }
        return;
      } else if (warlockChoice === 'buy' && !warlockItem && type !== 'skip') {
        setWarlockItem(type);
        return;
      }
    }

    // Jika tidak ada target dan bukan skip, tolak
    if (!actionTarget && type !== 'skip') return;

    const targetPlayer = players.find(p => p.id === actionTarget);
    const folder = isNight ? `malam_${day}` : `hari_${day}`;

    const actionLabel = role.includes('warlock') && warlockItem
      ? `${warlockItem.toUpperCase()}`
      : type;

    const isSelfProtection = role.includes("guard") && actionTarget === playerData?.id;
    const isHakim = role.includes("hakim");
    const isPistol = type === 'pistol';

    // Tentukan popup berdasarkan role dan jenis aksi (regular vs skip)
    let popupInfo = null;
    const isSkip = type === 'skip';

    if (role.includes("werewolf")) {
      if (isSkip) {
        popupInfo = { icon: "🐺", title: "Aksi Dilewati", desc: "Kamu memilih untuk melewati malam ini tanpa menyerang siapa pun." };
      } else {
        popupInfo = { icon: "🐺", title: "Target Dikunci", desc: `Kamu memilih untuk menyerang ${targetPlayer?.name || "Target"}. Hasil eksekusi akan terungkap besok pagi.` };
      }
    } else if (role.includes("guard")) {
      if (isSkip) {
        popupInfo = { icon: "🛡️", title: "Aksi Dilewati", desc: "Kamu memilih untuk tidak melindungi siapa pun malam ini." };
      } else {
        popupInfo = { icon: "🛡️", title: "Proteksi", desc: `Kamu melindungi ${targetPlayer?.name || "Target"} selama 2 malam`, target: targetPlayer };
      }
    } else if (role.includes("hunter")) {
      if (isSkip) {
        popupInfo = { icon: "🎯", title: "Aksi Dilewati", desc: "Kamu memilih untuk tidak berburu malam ini." };
      } else {
        popupInfo = { icon: "🎯", title: "Berburu", desc: `Tembakan diarahkan kepada ${targetPlayer?.name || "Target"}. Hasil tembakan akan terungkap besok pagi.`, target: targetPlayer };
      }
    } else if (role.includes("hakim") && !isPistol) {
      if (isSkip) {
        popupInfo = { icon: "👁️", title: "Aksi Dilewati", desc: "Kamu memilih untuk tidak menggunakan Truth malam ini." };
      } else {
        popupInfo = { icon: "👁️", title: "Interogasi", desc: `Kamu Truth target ${targetPlayer?.name || "Target"}` };
      }
    }
    if (popupInfo) {
      setActionPopupData(popupInfo);
      setShowActionPopup(true);
    }

    // OPTIMISTIC: set state segera, tanpa nunggu Firebase
    setOptimisticActed(true);

    const updates = {};

    // Write to nightHistory for logging
    const logAction = isHakim ? (isPistol ? 'Pistol' : 'Truth') : actionLabel;
    updates[`rooms/${roomCode}/nightHistory/${folder}/${playerData.id}`] = {
      senderName: playerData.name,
      role: playerData.role,
      action: logAction,
      targetId: actionTarget || "none",
      targetName: targetPlayer?.name || "Unknown",
      timestamp: getTimestamp()
    };

    // Hakim Pistol (siang) — INSTANT KILL: langsung set status dead
    if (isHakim && isPistol && actionTarget) {
      updates[`rooms/${roomCode}/players/${actionTarget}/status`] = 'dead';
      updates[`rooms/${roomCode}/players/${playerData.id}/pistolActed`] = true;
      updates[`rooms/${roomCode}/players/${playerData.id}/pistolUsedCount`] = pistolUsedCount + 1;

      // Kirim gunshotEvent untuk efek guncang layar & kilatan merah
      updates[`rooms/${roomCode}/gunshotEvent`] = {
        targetName: targetPlayer?.name || "Unknown",
        timestamp: getTimestamp()
      };

      // Piring pesan sistem ke chat room
      const chatRef = ref(db, `rooms/${roomCode}/chats`);
      const newChatRef = push(chatRef);
      updates[`rooms/${roomCode}/chats/${newChatRef.key}`] = {
        senderId: "SYSTEM_GUNSHOT",
        senderName: "PENGUMUMAN",
        text: `BARRR! Suara tembakan terdengar! Hakim telah menembak ${targetPlayer?.name || "Unknown"}!`,
        target: "all",
        channel: "public",
        timestamp: getTimestamp()
      };

      // Langsung kirim notif kematian ke target
      updates[`rooms/${roomCode}/deadToday`] = {
        day,
        names: [targetPlayer?.name || "Unknown"],
        details: {
          [targetPlayer?.name || "Unknown"]: "hakim"
        },
        timestamp: getTimestamp()
      };
    }

    // Hakim Truth (malam)
    if (isHakim && !isPistol && actionTarget && type !== 'skip') {
      updates[`rooms/${roomCode}/players/${playerData.id}/currentAction`] = {
        role: "Hakim",
        action: "truth",
        actionType: "truth",
        targetId: actionTarget,
        targetName: targetPlayer?.name || "Unknown",
        timestamp: getTimestamp()
      };
      updates[`rooms/${roomCode}/players/${playerData.id}/truthActed`] = true;
      updates[`rooms/${roomCode}/players/${playerData.id}/truthUsedCount`] = (playerData?.truthUsedCount || 0) + 1;
    }

    // Guard logic
    if (role.includes("guard") && actionTarget && type !== 'skip') {
      updates[`rooms/${roomCode}/players/${playerData.id}/lastProtectedTarget`] = actionTarget;
      updates[`rooms/${roomCode}/players/${playerData.id}/lastProtectedDay`] = day;
      if (isSelfProtection) {
        updates[`rooms/${roomCode}/players/${playerData.id}/selfProtectedCount`] = (playerData.selfProtectedCount || 0) + 1;
      }
      updates[`rooms/${roomCode}/players/${playerData.id}/currentAction`] = {
        role: "Guard",
        action: "protect",
        targetId: actionTarget,
        targetName: targetPlayer?.name || "Unknown",
        timestamp: getTimestamp()
      };
    }

    // Werewolf
    if (role.includes("werewolf")) {
      if (type === 'skip') {
        updates[`rooms/${roomCode}/players/${playerData.id}/currentAction`] = {
          role: "Werewolf",
          action: "kill",
          targetId: "skip",
          targetName: "Skip",
          timestamp: getTimestamp()
        };
      } else if (actionTarget) {
        updates[`rooms/${roomCode}/players/${playerData.id}/currentAction`] = {
          role: "Werewolf",
          action: "kill",
          targetId: actionTarget,
          targetName: targetPlayer?.name || "Unknown",
          timestamp: getTimestamp()
        };
      }
    }

    // Seer
    if (role.includes("seer") && actionTarget && type !== 'skip') {
      const targetRole = targetPlayer?.role || "Unknown";
      updates[`rooms/${roomCode}/players/${playerData.id}/currentAction`] = {
        role: "Seer",
        action: "reveal",
        targetId: actionTarget,
        targetName: targetPlayer?.name || "Unknown",
        timestamp: getTimestamp()
      };
      updates[`rooms/${roomCode}/seerReveal/${playerData.id}`] = {
        name: targetPlayer?.name || "Unknown",
        role: targetRole,
        timestamp: getTimestamp()
      };
      updates[`rooms/${roomCode}/seerResult/${playerData.id}`] = {
        name: targetPlayer?.name || "Unknown",
        role: targetRole,
        timestamp: getTimestamp()
      };
    }

    // Hunter
    if (role.includes("hunter") && actionTarget && type !== 'skip') {
      updates[`rooms/${roomCode}/players/${playerData.id}/currentAction`] = {
        role: "Hunter",
        action: "hunt",
        targetId: actionTarget,
        targetName: targetPlayer?.name || "Unknown",
        timestamp: getTimestamp()
      };
      updates[`rooms/${roomCode}/players/${playerData.id}/hunterActed`] = true;
    }

    update(ref(db), updates).then(async () => {
      // Auto check win condition setelah Pistol kill
      if (isHakim && isPistol && actionTarget) {
        await checkWinCondition(roomCode);
      }
    }).catch(() => {
      // Jika gagal, reset agar user bisa coba lagi
      setOptimisticActed(false);
    });
  };

  const sendWarlockAction = async (choice, item, targetId) => {
    if (playerData?.warlockActed || hasActedThisNight) return;
    const folder = `malam_${day}`;
    const targetPlayer = players.find(p => p.id === targetId);

    let popupInfo = null;
    if (choice === 'skip') {
      popupInfo = { icon: "⏭️", title: "Transaksi", desc: "Kamu Skip transaksi malam ini" };
    } else if (item === 'poison') {
      popupInfo = { icon: "☠️", title: "Pembelian Gelap", desc: targetPlayer ? `Kamu membeli POISON, incar ${targetPlayer.name}` : "Kamu membeli POISON" };
    } else if (item === 'vision') {
      popupInfo = { icon: "👁️", title: "Pembelian Gelap", desc: targetPlayer ? `Kamu membeli VISION, incar ${targetPlayer.name}` : "Kamu membeli VISION" };
    }
    if (popupInfo) {
      setActionPopupData(popupInfo);
      setShowActionPopup(true);
    }

    await set(ref(db, `rooms/${roomCode}/nightHistory/${folder}/${playerData.id}`), {
      senderName: playerData.name,
      role: playerData.role,
      choice: choice, // 'buy' or 'skip'
      item: item, // 'poison', 'vision', or null
      targetId: targetId || "none",
      targetName: targetPlayer?.name || "None",
      timestamp: getTimestamp()
    });

    // State warlock ke Firebase
    const warlockUpdates = {};
    if (choice === 'skip') {
      warlockUpdates[`rooms/${roomCode}/players/${playerData.id}/warlockSkipped`] = true;
      warlockUpdates[`rooms/${roomCode}/players/${playerData.id}/warlockActed`] = true;
    } else if (choice === 'buy' && item) {
      warlockUpdates[`rooms/${roomCode}/players/${playerData.id}/warlockInventory`] = item;
      warlockUpdates[`rooms/${roomCode}/players/${playerData.id}/warlockItemUsed`] = false;
      warlockUpdates[`rooms/${roomCode}/players/${playerData.id}/warlockActed`] = true;

      // Catat transaksi ke merchantTransaksi — untuk clue popup moderator
      const pedagangList = players.filter(p => p.role === 'Pedagang' && p.status !== 'dead');
      const randomPedagang = pedagangList.length > 0
        ? pedagangList[Math.floor(Math.random() * pedagangList.length)]
        : null;
      const transaksiRef = ref(db, `rooms/${roomCode}/merchantTransaksi/${folder}`);
      await push(transaksiRef, {
        warlock: playerData.name,
        item: item,
        targetId: targetId || "none",
        targetName: targetPlayer?.name || "None",
        merchantId: randomPedagang?.id || "system",
        merchantName: randomPedagang?.name || "System",
        timestamp: getTimestamp()
      });
    }
    if (Object.keys(warlockUpdates).length > 0) {
      await update(ref(db), warlockUpdates);
    }

    setOptimisticActed(true);
    setWarlockChoice(null);
    setWarlockItem(null);
    setActionTarget("");
    setShowTargetList(false);
  };

  // --- 4. CONDITIONAL RENDER (HANYA BOLEH SETELAH SEMUA HOOKS) ---

  // --- 5. THEME & UI CALCULATION ---
  const theme = (() => {
    if (isDead) return { color: "text-slate-500", bg: "bg-slate-900/50", border: "border-slate-800", icon: Ghost };
    if (role.includes('werewolf') || role.includes('warlock')) 
      return { color: "text-red-500", bg: "bg-red-950/20", border: "border-red-600", icon: Skull };
    if (role.includes('hakim')) 
      return { color: "text-amber-500", bg: "bg-amber-950/20", border: "border-amber-600", icon: Gavel };
    return { color: "text-blue-500", bg: "bg-blue-950/20", border: "border-blue-600", icon: Shield };
  })();

  const RoleIcon = theme.icon;
  const getTargetName = () => {
    if (!actionTarget) return "Pilih Target...";
    if (actionTarget === playerData?.id) return "Diri Sendiri";
    const p = players.find(p => p.id === actionTarget);
    return p ? p.name : "Pilih Target...";
  };

  return (
    <div
      className={`h-screen overflow-y-auto transition-colors duration-1000 font-sans ${isDead ? 'bg-black' : 'bg-slate-950'} animate-in fade-in duration-500 relative`}
    >
      <style>{`
        .animate-shimmer { animation: shimmer 1s ease-out; }
        .view-role-scroll { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,0.3) transparent; }
      `}</style>

      {/* Ambient Glow Transition Layer */}
      {!isDead && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className={`absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-full blur-[120px] transition-all duration-1000 ${
              isNight
                ? 'bg-purple-600/10 opacity-100'
                : 'bg-amber-600/10 opacity-100'
            }`}
          />
        </div>
      )}

      {showIntro && <IntroFable players={players} playerData={playerData} onFinish={handleIntroFinish} />}

      <>
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-[280px] sm:max-w-xs px-2">
          <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
        </div>

        <div className="max-w-md w-full mx-auto p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 text-center pt-28 sm:pt-32 pb-32 md:pb-32">
          <div className="space-y-1">
            <p className="text-slate-300 text-[8px] md:text-[10px] uppercase tracking-[0.3em]">{isNight ? 'Malam' : 'Hari'} ke-{day} • Waranasura</p>
            <h2 className={`text-base sm:text-lg md:text-xl font-bold italic transition-colors ${isDead ? 'text-slate-600' : 'text-blue-400'}`}>{playerData?.name} {playerData?.underTruth && "🔍"}</h2>
          </div>

            <div
            onMouseDown={() => setIsRevealed(true)}
            onMouseUp={() => setIsRevealed(false)}
            onMouseLeave={() => setIsRevealed(false)}
            onTouchStart={() => setIsRevealed(true)}
            onTouchEnd={() => setIsRevealed(false)}
            className={`relative aspect-[3/4] sm:aspect-[4/5] w-full max-w-xs sm:max-w-sm mx-auto rounded-2xl border-2 cursor-pointer overflow-hidden transition-all duration-500 select-none ${
              isDead
                ? (isRevealed
                    ? 'bg-slate-900/30 border-slate-700/60 border-dashed'
                    : 'bg-slate-950/40 border-slate-800/80 border-dashed active:border-slate-700')
                : (isRevealed
                    ? 'bg-blue-950/20 border-blue-600'
                    : 'bg-slate-900 border-slate-800 active:border-slate-600')
            }`}
          >
            {!isRevealed ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl border flex items-center justify-center mb-4 shadow-2xl transition-all duration-500 ${
                  isDead
                    ? 'bg-gradient-to-br from-slate-800/30 to-slate-950 border-slate-800/50'
                    : 'bg-gradient-to-br from-blue-900/50 to-slate-900 border-blue-700/50'
                }`}>
                  <div className={`w-14 h-20 md:w-16 md:h-24 rounded-lg border transition-all duration-500 ${
                    isDead
                      ? 'bg-gradient-to-r from-slate-900 to-slate-950 border-slate-800/30'
                      : 'bg-gradient-to-r from-blue-950 to-slate-800 border-blue-700/50'
                  }`} />
                </div>
                <p className={`font-bold tracking-widest uppercase text-[8px] md:text-[10px] transition-colors duration-500 ${
                  isDead ? 'text-slate-500' : 'text-blue-500'
                }`}>
                  Tahan untuk lihat peran
                </p>
              </div>
            ) : (
              <div className={`absolute inset-0 flex flex-col items-center justify-center animate-in fade-in duration-500 ${
                isDead ? 'bg-slate-950/40' : 'bg-blue-950/20'
              }`}>
                <div className={`p-4 sm:p-6 md:p-8 rounded-full mb-4 transition-colors duration-500 ${
                  isDead ? 'text-slate-500 bg-slate-900/40' : 'text-blue-500 bg-blue-950/30'
                }`}>
                  <RoleIcon className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 ${
                    isDead ? 'text-slate-500' : 'text-blue-500'
                  }`} />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className={`text-3xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tighter transition-colors duration-500 ${
                    isDead ? 'text-slate-500' : 'text-blue-500'
                  }`}>
                    {playerData?.role}
                  </h3>
                  <p className="text-slate-400 text-[8px] md:text-[10px]">
                    {isDead ? 'Kamu telah gugur dalam permainan ini.' : 'Rahasiakan peranmu dari mata-mata.'}
                  </p>
                </div>
              </div>
            )}
            {isDead && <CrackedOverlay />}
          </div>

          {/* === ACTION UI — HIDE jika tidak ada action === */}
          {(() => {
            // Tentukan apakah role ini punya action yang available — via getRoleActionConfig
            const isHakimSiang = actionConfig.phaseType === 'day' && actionConfig.canAct;
            const isHakimMalam = isNight && actionConfig.canAct && actionConfig.actionType === 'truth';
            const isWarlockMalam = role.includes("warlock") && isNight;
            const isSeerMalam = isNight && actionConfig.canAct;
            const isGuardMalam = isNight && actionConfig.canAct;
            const isHunterMalam = isNight && actionConfig.canAct;
            const isWerewolfMalam = isNight && actionConfig.canAct;
            const isDayForHakimPistol = actionConfig.phaseType === 'day' && actionConfig.canAct;

            const hasAction = isHakimSiang || isHakimMalam || isWarlockMalam || isSeerMalam || isGuardMalam || isHunterMalam || isWerewolfMalam || isDayForHakimPistol;

            if (!hasAction || isDead) return null;

            // Jika sudah action, tampilkan status saja (no buttons)
            if (hasActedThisNight) {
              return (
              <div className="p-3 md:p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">✓ Aksi Terkirim</span>
                </div>
                <p className="text-[8px] text-emerald-300/70 italic text-center">
                  {role.includes("hakim")
                    ? (isNight ? "Truth akan aktif malam ini" : "Pistol telah ditembakkan ke target!")
                    : "Keputusan sudah dicatat. Silakan tunggu fase selanjutnya."}
                </p>
              </div>
              );
            }

            return (
            <div className="p-3 md:p-4 bg-slate-900 border border-blue-500/30 rounded-2xl space-y-3">
               {actionStatus && <div className="text-[8px] md:text-[9px] font-black text-blue-400 uppercase animate-pulse">{actionStatus.msg}</div>}

               {/* ===== WARLOCK ZIGZAG ===== */}
               {isWarlockMalam && (
                 <div className="space-y-3 md:space-y-4">

                   {/* ── USE MODE: punya inventory → pilih target ── */}
                   {actionConfig.actionType === 'warlock-use' && !hasActedThisNight && (
                     <div className="space-y-3 md:space-y-4">
                       <div className="flex items-center gap-2 border-b border-purple-500/20 pb-2">
                         <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">
                           {playerData?.warlockInventory === 'poison' ? '☠️' : '👁️'} GUNAKAN {(playerData?.warlockInventory || '').toUpperCase()}
                         </span>
                       </div>
                       <p className="text-[8px] text-slate-500">Pilih target untuk menggunakan item-mu.</p>
                       <button onClick={() => setShowTargetList(!showTargetList)} className="w-full p-3 md:p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold flex justify-between items-center text-white">
                         <span className="truncate">{getTargetName()}</span>
                         <ChevronUp size={16} className={showTargetList ? "rotate-180 transition-transform" : ""} />
                       </button>
                       {showTargetList && (
                         <div className="mt-2 grid gap-1 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
                           {players.filter(p=>p.id!==playerData.id && p.status!=='dead' && p.role!=='Moderator').map(p=>(
                             <button key={p.id} onClick={()=>{setActionTarget(p.id); setShowTargetList(false);}} className="p-2 md:p-3 bg-slate-800 hover:bg-purple-600 rounded-lg text-xs text-left text-white transition-colors">{p.name}</button>
                           ))}
                         </div>
                       )}
                       <button onClick={handleWarlockUse} disabled={!actionTarget} className="w-full py-3 bg-purple-600 disabled:bg-slate-800 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">🔫 Konfirmasi</button>
                     </div>
                   )}

                   {/* ── BUY MODE: tidak punya inventory → beli/skip ── */}
                   {actionConfig.actionType === 'warlock-buy' && !hasActedThisNight && (
                   <div className="space-y-3 md:space-y-4">
                     {!warlockChoice ? (
                       <div className="space-y-2 md:space-y-3">
                         <p className="text-[8px] md:text-[9px] font-black text-purple-400 uppercase text-center">Pilih Tindakan</p>
                         <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => setWarlockChoice('buy')} className="py-2 md:py-3 bg-purple-600 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">Beli</button>
                           <button onClick={() => { setWarlockChoice('skip'); handleNightAction('skip'); }} className="py-2 md:py-3 bg-slate-800 text-slate-500 rounded-xl text-[8px] md:text-[10px] font-black uppercase active:scale-95">Skip</button>
                         </div>
                       </div>
                     ) : warlockChoice === 'buy' && !warlockItem ? (
                       <div className="space-y-2 md:space-y-3">
                         <p className="text-[8px] md:text-[9px] font-black text-purple-400 uppercase text-center">Pilih Item</p>
                         <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => sendWarlockAction('buy', 'poison', null)} className="py-2 md:py-3 bg-red-600 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">☠️ Poison</button>
                           <button onClick={() => sendWarlockAction('buy', 'vision', null)} className="py-2 md:py-3 bg-indigo-600 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95">👁️ Vision</button>
                         </div>
                         <button onClick={() => { setWarlockChoice(null); setWarlockItem(null); }} className="text-[7px] md:text-[8px] text-slate-500 underline">Kembali</button>
                       </div>
                     ) : null}
                   </div>
                   )}
                 </div>
               )}

               {/* ===== HAKIM SIANG: PISTOL ===== */}
               {isHakimSiang && (
                 <>
                   <div className="flex items-center gap-2 border-b border-red-500/20 pb-2">
                     <span className="text-[8px] font-black uppercase tracking-widest text-red-500">🔫 Pistol — Siang Hari</span>
                   </div>
                   <p className="text-[8px] text-slate-500">
                     Tembak target dengan Pistol ({pistolRemaining} peluru tersisa)
                   </p>
                   <button onClick={() => setShowTargetList(!showTargetList)} className="w-full p-3 md:p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold flex justify-between items-center text-white">
                     <span className="truncate">{getTargetName()}</span>
                     <ChevronUp size={16} className={showTargetList ? "rotate-180 transition-transform" : ""} />
                   </button>
                   {showTargetList && (
                     <div className="mt-2 grid gap-1 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
                       {players.filter(p=>p.id!==playerData.id && p.status!=='dead' && p.role!=='Moderator').map(p=>(
                         <button key={p.id} onClick={()=>{setActionTarget(p.id); setShowTargetList(false);}} className="p-2 md:p-3 bg-slate-800 hover:bg-red-600 rounded-lg text-xs text-left text-white transition-colors">{p.name}</button>
                       ))}
                     </div>
                   )}
                   <div className="grid grid-cols-2 gap-2 mt-3 md:mt-4">
                     <button onClick={() => handleNightAction("pistol")} disabled={!actionTarget} className="py-2 md:py-3 bg-red-600 disabled:bg-slate-800 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">🔫 Tembak!</button>
                     <button onClick={() => { setActionTarget(""); handleNightAction("skip"); }} className="py-2 md:py-3 bg-slate-800 text-slate-500 rounded-xl text-[8px] md:text-[10px] font-black uppercase active:scale-95 transition-all">Skip</button>
                   </div>
                 </>
               )}

               {/* ===== HAKIM MALAM: TRUTH ===== */}
               {isHakimMalam && (
                 <>
                   <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
                     <span className="text-[8px] font-black uppercase tracking-widest text-amber-500">👁️ Truth — Malam</span>
                   </div>
                   <p className="text-[8px] text-slate-500">Pilih target untuk bocorkan chat pribadinya ke publik.</p>
                   <button onClick={() => setShowTargetList(!showTargetList)} className="w-full p-3 md:p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold flex justify-between items-center text-white">
                     <span className="truncate">{getTargetName()}</span>
                     <ChevronUp size={16} className={showTargetList ? "rotate-180 transition-transform" : ""} />
                   </button>
                   {showTargetList && (
                     <div className="mt-2 grid gap-1 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
                       {players.filter(p=>p.id!==playerData.id && p.status!=='dead' && p.role!=='Moderator').map(p=>(
                         <button key={p.id} onClick={()=>{setActionTarget(p.id); setShowTargetList(false);}} className="p-2 md:p-3 bg-slate-800 hover:bg-amber-600 rounded-lg text-xs text-left text-white transition-colors">{p.name}</button>
                       ))}
                     </div>
                   )}
                   <div className="grid grid-cols-2 gap-2 mt-3 md:mt-4">
                     <button onClick={() => handleNightAction("Truth")} disabled={!actionTarget} className="py-2 md:py-3 bg-amber-600 disabled:bg-slate-800 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">👁️ Truth</button>
                     <button onClick={() => { setActionTarget(""); handleNightAction("skip"); }} className="py-2 md:py-3 bg-slate-800 text-slate-500 rounded-xl text-[8px] md:text-[10px] font-black uppercase active:scale-95 transition-all">Skip</button>
                   </div>
                 </>
               )}

               {/* ===== OTHER ROLES (Seer, Guard, Hunter, Werewolf) ===== */}
               {!role.includes("warlock") && !role.includes("hakim") && (
                 <>
                   {/* Guard constraint info */}
                   {role.includes("guard") && (
                     <div className="text-[7px] md:text-[8px] text-slate-500 uppercase text-center">
                       <span className="text-slate-500">Tidak bisa lindungi target sama berturut-turut • </span>
                       {!canGuardSelf && <span className="text-amber-500"> sudah lindungi diri </span>}
                     </div>
                   )}
                   <button onClick={() => setShowTargetList(!showTargetList)} className="w-full p-3 md:p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold flex justify-between items-center text-white">
                     <span className="truncate">{getTargetName()}</span>
                     <ChevronUp size={16} className={showTargetList ? "rotate-180 transition-transform" : ""} />
                   </button>
                   {showTargetList && (
                     <div className="mt-2 grid gap-1 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
                       {players.filter(p=>p.id!==playerData.id && p.status!=='dead' && p.role!=='Moderator').map(p=>{
                         const isSameTargetAsLastNight = role.includes("guard") && guardLastProtected === p.id;
                         const isSelfDisabled = role.includes("guard") && p.id === playerData?.id && !canGuardSelf;
                         const isDisabled = isSameTargetAsLastNight || isSelfDisabled;
                         const wwVotes = role.includes("werewolf") ? getWerewolfVoteCount(p.id) : 0;
                         return (
                           <button key={p.id} onClick={()=>{setActionTarget(p.id); setShowTargetList(false);}} disabled={isDisabled} className={`p-2 md:p-3 rounded-lg text-xs text-left transition-colors flex justify-between items-center ${isDisabled ? 'bg-slate-900 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-blue-600 text-white'}`}>
                             <span>
                               {p.name}{isSameTargetAsLastNight && <span className="text-[7px] text-red-500 ml-1">↺</span>}{isSelfDisabled && <span className="text-[7px] text-amber-500 ml-1">★</span>}
                             </span>
                             {wwVotes > 0 && (
                               <span className="bg-red-600/35 border border-red-500/50 text-red-300 font-extrabold px-1.5 py-0.5 rounded-md text-[9px] flex items-center gap-0.5">
                                 🐺 {wwVotes}
                               </span>
                             )}
                           </button>
                         );
                       })}
                     </div>
                   )}
                   <div className="grid grid-cols-2 gap-2 mt-3 md:mt-4">
                     <button onClick={() => handleNightAction("Konfirmasi")} disabled={!actionTarget} className="py-2 md:py-3 bg-blue-600 disabled:bg-slate-800 text-white rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">Konfirmasi</button>
                     <button onClick={() => { setActionTarget(""); handleNightAction("skip"); }} className="py-2 md:py-3 bg-slate-800 text-slate-500 rounded-xl text-[8px] md:text-[10px] font-black uppercase active:scale-95 transition-all">
                       Skip {role.includes("werewolf") && getWerewolfSkipVotesCount() > 0 && `(🐺 ${getWerewolfSkipVotesCount()})`}
                     </button>
                   </div>
                 </>
               )}
            </div>
            );
          })()}

            <button onClick={() => setShowMechanics(true)} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-amber-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-colors"><BookOpen size={14} /> Panduan</button>
            
            {/* Pedagang Clue Display - Only show when popup is closed */}
            {role.includes("pedagang") && myClues && !showCluePopup && (
              <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={14} className="text-emerald-500" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Petunjuk Transaksi Gelap</p>
                </div>
                <p className="text-xs text-emerald-400 italic leading-relaxed">{myClues.message}</p>
                <p className="text-[7px] text-slate-500">Hari ke-{myClues.day}</p>
              </div>
            )}
          <button
            onClick={onNext}
            className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl text-blue-400 font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            🗳️ Vote
          </button>
          <button onClick={() => {
            const msg = gameWinner ? "Room akan dihapus dari database. Lanjutkan?" : "Statusmu jadi MATI. Lanjutkan?";
            showNotif("Keluar", msg, "confirm", onLeave);
          }} className="w-full pt-4 text-[9px] text-slate-700 hover:text-red-500 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-colors"><X size={12} /> Keluar & Menyerah</button>
        </div>
        <ChatRoom roomCode={roomCode} myId={playerData?.id} myName={playerData?.name} players={players || []} isHost={false} />
        <RoleModal role={playerData?.role} isOpen={showMechanics} onClose={() => setShowMechanics(false)} />

        {/* ACTION POPUP */}
        {showActionPopup && actionPopupData && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: Z_LAYER.ACTION_MODAL }}>
            <div className={`bg-slate-900 border ${actionPopupData.isMiss ? 'border-red-500' : 'border-blue-500/30'} rounded-[2rem] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden max-h-[95vh] overflow-y-auto custom-scrollbar`}>
              {actionPopupData.isMiss && (
                <>
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-1 h-16 bg-white/20 rotate-45 rounded-full" />
                    <div className="absolute top-1/4 right-1/4 w-1 h-16 bg-white/20 -rotate-45 rounded-full" />
                    <div className="absolute top-1/2 left-1/3 w-1 h-12 bg-white/10 rotate-12 rounded-full" />
                    <div className="absolute top-1/3 right-1/3 w-1 h-14 bg-white/10 -rotate-[30deg] rounded-full" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent animate-pulse" />
                </>
              )}
              <div className="text-6xl mb-2">{actionPopupData.icon}</div>
              <h2 className={`text-xl font-black uppercase italic tracking-tighter ${actionPopupData.isMiss ? 'text-red-500' : 'text-white'}`}>{actionPopupData.title}</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{actionPopupData.desc}</p>
              {actionPopupData.targetName && (
                <div className="bg-slate-950/50 border border-blue-500/20 rounded-xl py-3 px-4 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Target</p>
                  <p className="font-black text-white text-lg">{actionPopupData.targetName}</p>
                  {actionPopupData.targetRole && (
                    <span className="inline-block px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 font-black text-sm">
                      {actionPopupData.targetRole}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  setShowActionPopup(false);
                  localStorage.setItem(`dismissed_action_${roomCode}_${day}_${phase}`, 'true');
                }}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all ${actionPopupData.isMiss ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {showCluePopup && myClues && role.includes("pedagang") && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: Z_LAYER.ACTION_MODAL }}>
            <div className="bg-gradient-to-br from-emerald-800 to-teal-600 rounded-[2rem] p-1 w-full max-w-sm md:max-w-lg shadow-2xl shadow-emerald-900/50 animate-in zoom-in duration-300">
              <div className="bg-slate-900 rounded-[1.8rem] p-4 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-600/20 rounded-full mx-auto flex items-center justify-center">
                    <ShoppingBag size={32} className="text-emerald-400" />
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-emerald-400 uppercase italic">Transaksi Gelap (Clue)</h2>
                  <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest">Kamu mendapat pesan rahasia!</p>
                </div>

                {/* Message */}
                <div className="bg-slate-950/50 border border-emerald-500/30 rounded-xl p-4">
                  <p className="text-sm md:text-base text-emerald-300 italic leading-relaxed text-center">"{myClues.message}"</p>
                </div>

                {/* Info */}
                <div className="text-center">
                  <p className="text-[7px] md:text-[8px] text-slate-600 font-bold uppercase tracking-widest">Hari ke-{myClues.day} • Dari: {myClues.from}</p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowCluePopup(false);
                    localStorage.setItem(`dismissed_clue_${roomCode}_${day}`, 'true');
                  }}
                  className="w-full py-3 bg-emerald-600 rounded-xl font-black uppercase text-xs md:text-sm shadow-lg hover:bg-emerald-500 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default ViewRole;