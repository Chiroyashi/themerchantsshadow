import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ref, push, onValue, set } from "firebase/database";
import { db } from "../lib/firebase";
import { Send, MessageSquare, ChevronDown, Globe, User, ShieldAlert, Ghost, Skull } from 'lucide-react';
import { Z_LAYER } from '../constants/zIndex';
import { useTimerContext } from '../contexts/TimerContext';
import { isMalam } from '../constants/phases';

const getTimestamp = () => Date.now();

const ChatRoom = ({ roomCode, myId, myName, players, isHost, isOpenExternal, onToggleExternal, onUnreadChange }) => {
  const { phase } = useTimerContext();
  const isNightTime = isMalam(phase);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [targetId, setTargetId] = useState("all");
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isOpenExternal !== undefined ? isOpenExternal : isOpenInternal;
  const toggleOpen = isOpenExternal !== undefined ? onToggleExternal : () => {
    setIsOpenInternal(!isOpenInternal);
  };
  const [showTargetMenu, setShowTargetMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [channel, setChannel] = useState('public'); // 'public' | 'ww' | 'graveyard'
  const scrollRef = useRef(null);
  const lastSeenRef = useRef(getTimestamp());
  const inputRef = useRef(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setUnreadCount(0);
    }
  }

  // Update lastSeenRef di useEffect saat isOpen berubah (kepatuhan React 19: ref hanya boleh dimodifikasi di effect/handler)
  useEffect(() => {
    if (isOpen) {
      lastSeenRef.current = getTimestamp();
    }
  }, [isOpen]);

  const myDataFromList = players?.find(p => p.id === myId);
  const myRole = myDataFromList?.role;
  const myStatus = myDataFromList?.status;
  const isWW = myRole === 'Werewolf';
  const isDead = myStatus === 'dead';
  const canAccessWW = isWW || isHost;
  const canAccessGraveyard = isDead || isHost;

  // Reset channel ke 'public' saat mati/hidup berubah jika tidak memiliki akses lagi (render phase state adjustment)
  if (channel === 'graveyard' && !canAccessGraveyard) {
    setChannel('public');
  }
  if (channel === 'ww' && !canAccessWW) {
    setChannel('public');
  }

  // Sync unreadCount ke parent jika dikontrol eksternal
  useEffect(() => {
    if (isOpenExternal !== undefined && onUnreadChange) {
      onUnreadChange(unreadCount);
    }
  }, [unreadCount, isOpenExternal, onUnreadChange]);

  useEffect(() => {
    if (!roomCode) return;
    const chatRef = ref(db, `rooms/${roomCode}/chats`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        // Filter: channel ww hanya untuk WW & Host, graveyard hanya untuk dead & Host, private whisper sesuai target
        const visible = list.filter(m => {
          if (m.channel === 'ww' && !isWW && !isHost) return false;
          if (m.channel === 'graveyard' && !isDead && !isHost) return false;
          if (m.target !== "all" && m.target !== myId && m.senderId !== myId && !isHost) return false;
          return true;
        });
        const sorted = visible.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sorted);

        if (!isOpen) {
          const newCount = sorted.filter(m => m.timestamp > lastSeenRef.current && m.senderId !== myId).length;
          if (newCount > 0) setUnreadCount(prev => prev + newCount);
        }
      }
    });
    return () => unsubscribe();
  }, [roomCode, myId, isHost, isOpen, isWW, isDead]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [messages, isOpen]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const chatRef = ref(db, `rooms/${roomCode}/chats`);

    if (channel === 'graveyard') {
      // Graveyard — tanpa truth leak
      push(chatRef, {
        senderId: myId,
        senderName: myName,
        text: input,
        target: "all",
        channel: "graveyard",
        timestamp: Date.now()
      });
    } else if (channel === 'ww') {
      // Kirim ke channel Markas
      push(chatRef, {
        senderId: myId,
        senderName: myName,
        text: input,
        target: "all",
        channel: "ww",
        timestamp: Date.now()
      });

      // Truth leak: jika WW kena Truth, chat Markas bocor ke publik
      if (myDataFromList?.underTruth) {
        set(ref(db, `rooms/${roomCode}/truthActivity`), {
          msg: `${myName} membocorkan rahasia Werewolf!`,
          timestamp: Date.now()
        });

        push(chatRef, {
          senderId: myId,
          senderName: myName,
          text: input,
          target: "all",
          channel: "public",
          timestamp: Date.now() + 1
        });
      }
    } else {
      // Channel public (perilaku seperti sekarang)
      const isPrivate = targetId !== "all";

      if (isPrivate && myDataFromList?.underTruth) {
        set(ref(db, `rooms/${roomCode}/truthActivity`), {
          msg: `${myName} membocorkan bisikan rahasia!`,
          timestamp: Date.now()
        });

        push(chatRef, {
          senderId: myId,
          senderName: myName,
          text: input,
          target: "all",
          channel: "public",
          timestamp: Date.now()
        });
      } else {
        push(chatRef, {
          senderId: myId,
          senderName: myName,
          text: input,
          target: targetId,
          channel: "public",
          timestamp: Date.now()
        });
      }
    }

    setInput("");
  };

  const getTargetName = () => {
    if (targetId === "all") return "Publik";
    const p = players.find(p => p.id === targetId);
    return p ? p.name.split(' ')[0] : "User";
  };

  const isPrivate = targetId !== "all";
  const isWWChannel = channel === 'ww';
  const isGraveyard = channel === 'graveyard';

  const channelBorder = isWWChannel ? 'border-red-500/30' : isGraveyard ? 'border-slate-600/50' : 'border-white/10';

  const chatUI = (
    <div className="game-chat-system font-sans">
      {/* BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-all duration-300"
          style={{ zIndex: Z_LAYER.CHAT_BACKDROP }}
          onClick={toggleOpen}
        />
      )}

      {/* FLOATING BUTTON */}
      {!isOpen && isOpenExternal === undefined && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-slate-900 border border-blue-500/30 shadow-2xl shadow-blue-900/20 flex items-center justify-center hover:bg-slate-800 hover:border-blue-400/50 active:scale-90 transition-all duration-200"
          style={{ zIndex: Z_LAYER.CHAT_PANEL }}
        >
          <MessageSquare size={22} className="text-blue-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center px-1 shadow-lg animate-in zoom-in duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* CHAT PANEL */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 animate-in slide-in-from-bottom-4 duration-300" style={{ zIndex: Z_LAYER.CHAT_PANEL }}>
          <div className="max-w-lg mx-auto px-3 pb-3">
            <div className={`bg-slate-900/95 backdrop-blur-xl border rounded-[1.8rem] shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden ${channelBorder}`}>

              {/* HEADER */}
              <div className="px-5 py-4 border-b border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)] ${isWWChannel ? 'bg-red-500' : isGraveyard ? 'bg-slate-500' : 'bg-emerald-500'}`} />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">CHAT</p>
                      <p className="text-xs font-bold text-white">
                        {isWWChannel ? '🐺 Markas Werewolf' : isGraveyard ? '💀 Arwah Penasaran' : isPrivate ? `→ ${getTargetName()}` : 'Komunikasi Publik'}
                      </p>
                    </div>
                  </div>
                  <button onClick={toggleOpen} className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-slate-600 hover:text-slate-300">
                    <ChevronDown size={18} />
                  </button>
                </div>

                {/* TAB: Umum | Markas | Arwah */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setChannel('public')}
                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      channel === 'public'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-950/40 text-slate-600 border border-transparent'
                    }`}
                  >
                    💬 Umum
                  </button>
                  {canAccessWW && (
                    <button
                      onClick={() => { setChannel('ww'); setTargetId('all'); }}
                      className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        channel === 'ww'
                          ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                          : 'bg-slate-950/40 text-slate-600 border border-transparent'
                      }`}
                    >
                      🐺 Markas
                    </button>
                  )}
                  {canAccessGraveyard && (
                    <button
                      onClick={() => { setChannel('graveyard'); setTargetId('all'); }}
                      className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        channel === 'graveyard'
                          ? 'bg-slate-600/30 text-slate-300 border border-slate-500/30'
                          : 'bg-slate-950/40 text-slate-600 border border-transparent'
                      }`}
                    >
                      💀 Arwah
                    </button>
                  )}
                </div>
              </div>

              {/* MESSAGES */}
              <div className="h-[45vh] overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,116,139,0.3) transparent' }}>
                {messages.length === 0 && (
                  <div className="text-center py-10">
                    <MessageSquare size={32} className="mx-auto text-slate-700 mb-3" />
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Belum ada pesan</p>
                    <p className="text-[8px] text-slate-700 mt-1 italic">
                      {isGraveyard ? 'Bisikan dari alam baka...' : isWWChannel ? 'Gorok mereka dalam keheningan...' : 'Mulai diskusi dengan pemain lain'}
                    </p>
                  </div>
                )}
                {messages.map((m) => {
                  const isMeMsg = m.senderId === myId;
                  const isPrivateMsg = m.target !== "all";
                  const isSystemTruth = m.senderId === "SYSTEM_TRUTH";
                  const isSystemGunshot = m.senderId === "SYSTEM_GUNSHOT";
                  const isWWMsg = m.channel === 'ww';
                  const isGraveyardMsg = m.channel === 'graveyard';
                  const isUnderTruth = players?.find(p => p.id === m.senderId)?.underTruth;

                  return (
                    <div key={m.id} className={`flex flex-col ${isMeMsg ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}>
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        {isPrivateMsg ? (
                          <span className="text-[7px] font-black uppercase tracking-tight text-purple-400 flex items-center gap-1">
                            <span>{isMeMsg ? 'Anda' : m.senderName}</span>
                            <span className="text-[8px] text-purple-500 font-bold">➔</span>
                            <span>{m.target === myId ? 'Anda' : (players?.find(p => p.id === m.target)?.name || 'User')}</span>
                            <span className="text-[6px] text-purple-500/80 lowercase italic font-normal ml-0.5">(whisper)</span>
                          </span>
                        ) : (
                          <span className={`text-[7px] font-black uppercase tracking-tight ${
                            isGraveyardMsg ? 'text-slate-500/80 italic' : 'text-slate-600'
                          }`}>
                            {isMeMsg ? 'Anda' : m.senderName}
                          </span>
                        )}
                        {isWWMsg && !isMeMsg && <Ghost size={9} className="text-red-500" />}
                        {isGraveyardMsg && <Ghost size={9} className="text-slate-500/70 animate-pulse" />}
                        {isSystemTruth && <ShieldAlert size={9} className="text-amber-500" />}
                        {isSystemGunshot && <ShieldAlert size={9} className="text-red-500 animate-pulse" />}
                      </div>
                      <div className="flex items-center gap-2 max-w-[85%]">
                        <div className={`px-4 py-2.5 text-sm font-medium leading-relaxed shadow-lg ${
                          isSystemTruth
                            ? 'bg-amber-950/30 text-amber-400 border border-amber-500/20 rounded-2xl'
                            : isSystemGunshot
                              ? 'bg-red-950/30 text-red-400 border border-red-500/20 rounded-2xl'
                              : isGraveyardMsg
                                ? isMeMsg
                                  ? 'bg-slate-800/80 text-slate-300 border border-slate-700/30 rounded-2xl rounded-br-sm shadow-[0_0_10px_rgba(148,163,184,0.05)]'
                                  : 'bg-slate-900/40 text-slate-400 border border-slate-800/50 rounded-2xl rounded-bl-sm italic'
                                : isWWMsg
                                  ? isMeMsg
                                    ? 'bg-red-600 text-white rounded-2xl rounded-br-sm'
                                    : 'bg-red-950/40 text-red-200 rounded-2xl rounded-bl-sm border border-red-500/30'
                                  : isMeMsg
                                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                                    : 'bg-slate-800 text-slate-200 rounded-2xl rounded-bl-sm border border-white/5'
                        }`}>
                          {isWWMsg && !isSystemTruth && !isSystemGunshot && <span className="text-[9px] mr-1">🐺</span>}
                          {isGraveyardMsg && <span className="text-[9px] mr-1">👻</span>}
                          {m.text}
                        </div>
                        {isUnderTruth && (
                          <span className="text-amber-500 font-extrabold text-base animate-pulse flex-shrink-0 select-none" title="Kebenaran Hakim">
                            !
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* INPUT BAR */}
              <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02]">
                <form onSubmit={sendMessage} className={`flex items-center gap-2 bg-slate-950/60 border rounded-2xl px-2 py-1.5 transition-all duration-200 ${
                  isWWChannel ? 'border-red-700/50 focus-within:border-red-500/40' :
                  isGraveyard ? 'border-slate-700/50 focus-within:border-slate-500/40' :
                  'border-slate-700/50 focus-within:border-blue-500/40 focus-within:ring-2 focus-within:ring-blue-500/10'
                }`}>

                  {/* PUBLIC CHANNEL: target selector */}
                  {channel === 'public' && !isDead && (
                    <div className="relative">
                      <div className={`absolute bottom-full left-0 mb-2 w-48 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl transition-all duration-200 origin-bottom-left overflow-hidden
                        ${showTargetMenu ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'}`}>
                        <div className="p-2.5 border-b border-white/5 text-[8px] font-black uppercase text-slate-500 tracking-widest text-center">Kirim Ke:</div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                          {(!isNightTime || isHost) && (
                            <button
                              onClick={() => { setTargetId("all"); setShowTargetMenu(false); }}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors hover:bg-white/5 ${targetId === 'all' ? 'text-blue-400 bg-blue-400/5' : 'text-slate-300'}`}
                            >
                              <Globe size={14} /> Publik
                            </button>
                          )}
                          {players.filter(p => p.id !== myId && p.role !== 'Moderator' && (isHost || p.status !== 'dead')).map(p => (
                            <button
                              key={p.id}
                              onClick={() => { setTargetId(p.id); setShowTargetMenu(false); }}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors hover:bg-white/5 ${targetId === p.id ? 'text-purple-400 bg-purple-400/5' : 'text-slate-300'}`}
                            >
                              <User size={14} /> {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTargetMenu(!showTargetMenu)}
                        className={`flex items-center gap-1.5 pl-2.5 pr-2 py-2 rounded-full transition-all text-[9px] font-black uppercase tracking-wide ${isPrivate ? 'bg-purple-500/15 text-purple-400' : 'text-blue-400'}`}
                      >
                        {isPrivate ? <User size={14} /> : <Globe size={14} />}
                        <span className="max-w-[56px] truncate">{getTargetName()}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${showTargetMenu ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  )}

                  {/* CHANNEL LABELS */}
                  {isWWChannel && isHost && (
                    <div className="flex items-center gap-2 pl-3 pr-2 py-2 text-[9px] font-black uppercase tracking-wide text-slate-500">
                      <ShieldAlert size={14} className="text-amber-500" /> Read Only
                    </div>
                  )}
                  {isWWChannel && !isHost && (
                    <div className="flex items-center gap-2 pl-3 pr-2 py-2 text-[9px] font-black uppercase tracking-wide text-red-500">
                      <Ghost size={14} /> Markas
                    </div>
                  )}
                  {isGraveyard && (
                    <div className="flex items-center gap-2 pl-3 pr-2 py-2 text-[9px] font-black uppercase tracking-wide text-slate-400">
                      <Skull size={14} /> Arwah
                    </div>
                  )}

                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isDead && channel === 'public'
                        ? "Anda telah gugur (Read-Only)..."
                        : isHost && isWWChannel
                          ? "Monitor mode..."
                          : isWWChannel
                            ? "Ketik pesan ke Markas..."
                            : isGraveyard
                              ? "Ketik pesan ke para arwah..."
                              : isPrivate
                                ? `Whisper ke ${getTargetName()}...`
                                : isNightTime && !isHost
                                  ? "Malam hari: Pilih pemain untuk bisikan..."
                                  : "Ketik pesan..."
                    }
                    disabled={
                      (isDead && channel === 'public') ||
                      (isHost && isWWChannel) ||
                      (isNightTime && !isHost && channel === 'public' && targetId === 'all')
                    }
                    className="flex-1 min-w-0 bg-transparent py-2.5 text-sm font-medium text-white outline-none placeholder:text-slate-600 disabled:opacity-40"
                  />
                  <button
                    type="submit"
                    disabled={
                      !input.trim() ||
                      (isDead && channel === 'public') ||
                      (isHost && isWWChannel) ||
                      (isNightTime && !isHost && channel === 'public' && targetId === 'all')
                    }
                    className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 ${
                      input.trim() &&
                      !(isDead && channel === 'public') &&
                      !(isHost && isWWChannel) &&
                      !(isNightTime && !isHost && channel === 'public' && targetId === 'all')
                        ? isWWChannel
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-90'
                          : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-90'
                        : 'bg-slate-800 text-slate-600'
                    }`}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(chatUI, document.body);
};

export default ChatRoom;
