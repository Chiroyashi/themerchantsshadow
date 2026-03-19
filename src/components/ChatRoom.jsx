import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ref, push, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { Send, MessageSquare, ChevronDown, ChevronUp, Globe, User } from 'lucide-react';

const ChatRoom = ({ roomCode, myId, myName, players, isHost }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [targetId, setTargetId] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [showTargetMenu, setShowTargetMenu] = useState(false); // State untuk Drop-up
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!roomCode) return;
    const chatRef = ref(db, `rooms/${roomCode}/chats`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        const visibleMessages = list.filter(m => 
          m.target === "all" || m.senderId === myId || m.target === myId || isHost
        );
        setMessages(visibleMessages.sort((a, b) => a.timestamp - b.timestamp));
      }
    });
    return () => unsubscribe();
  }, [roomCode, myId, isHost]);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const chatRef = ref(db, `rooms/${roomCode}/chats`);
    push(chatRef, {
      senderId: myId,
      senderName: myName,
      text: input,
      target: targetId,
      timestamp: Date.now()
    });
    setInput("");
  };

  const getTargetName = () => {
    if (targetId === "all") return "Publik";
    const p = players.find(player => player.id === targetId);
    return p ? p.name.split(' ')[0] : "User";
  };

  const chatUI = (
    <div className="game-chat-system font-sans">
      {/* BACKDROP */}
      <div 
        className={`fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-all duration-500 z-[9998] 
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => {
          setIsOpen(false);
          setShowTargetMenu(false);
        }}
      />

      {/* CHAT CONTAINER */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-[9999]">
        
        {/* LOG PESAN */}
        <div className={`absolute bottom-full left-0 right-0 mb-4 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] origin-bottom
          ${isOpen ? 'h-[60vh] opacity-100 translate-y-0 scale-100' : 'h-0 opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
          
          <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Communication Link</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500">
              <ChevronDown size={22} />
            </button>
          </div>

          <div className="h-[calc(100%-70px)] overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {messages.map((m) => {
              const isMe = m.senderId === myId;
              const isPrivate = m.target !== "all";
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className="flex items-center gap-2 mb-1 px-1 text-[8px] font-black uppercase tracking-tighter text-slate-500">
                    {isPrivate && <span className="text-purple-500">[RAHASIA]</span>}
                    {isMe ? 'Anda' : m.senderName}
                  </div>
                  <div className={`p-4 rounded-[1.8rem] text-sm font-bold leading-relaxed shadow-lg ${
                    isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* INPUT BAR DENGAN DROP-UP TARGET */}
        <div className={`relative flex items-center gap-2 p-2 bg-slate-900 border transition-all duration-300 rounded-full shadow-2xl ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-white/10'}`}>
          
          {/* DROP-UP MENU */}
          <div className="relative">
             <div className={`absolute bottom-full left-0 mb-4 w-48 bg-slate-800 border border-white/10 rounded-3xl shadow-2xl transition-all duration-300 origin-bottom-left overflow-hidden
                ${showTargetMenu ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="p-3 border-b border-white/5 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">Kirim Ke:</div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  <button 
                    onClick={() => { setTargetId("all"); setShowTargetMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors hover:bg-white/5 ${targetId === 'all' ? 'text-blue-400 bg-blue-400/5' : 'text-slate-300'}`}
                  >
                    <Globe size={14} /> Publik
                  </button>
                  {players.filter(p => p.id !== myId).map(p => (
                    <button 
                      key={p.id}
                      onClick={() => { setTargetId(p.id); setShowTargetMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors hover:bg-white/5 ${targetId === p.id ? 'text-purple-400 bg-purple-400/5' : 'text-slate-300'}`}
                    >
                      <User size={14} /> {p.name}
                    </button>
                  ))}
                </div>
             </div>

             {/* TOMBOL TOGGLE TARGET */}
             <button 
               onClick={() => setShowTargetMenu(!showTargetMenu)}
               className={`flex items-center gap-2 pl-4 pr-3 py-2 rounded-full transition-all border ${targetId === 'all' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-purple-500/30 bg-purple-500/10 text-purple-400'}`}
             >
                {targetId === 'all' ? <Globe size={16} /> : <User size={16} />}
                <span className="text-[10px] font-black uppercase truncate max-w-[60px]">{getTargetName()}</span>
                <ChevronUp size={14} className={`transition-transform duration-300 ${showTargetMenu ? 'rotate-180' : ''}`} />
             </button>
          </div>
          
          <form onSubmit={sendMessage} className="flex-1 flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan..."
              className="flex-1 bg-transparent py-4 text-sm font-bold text-white outline-none placeholder:text-slate-600"
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className={`p-3.5 rounded-full transition-all duration-300 flex-shrink-0 ${input.trim() ? 'bg-blue-600 text-white scale-100 shadow-lg shadow-blue-600/40' : 'bg-slate-800 text-slate-600 scale-90'}`}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(chatUI, document.body);
};

export default ChatRoom;