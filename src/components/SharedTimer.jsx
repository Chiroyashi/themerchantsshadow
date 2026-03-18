import React, { useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { Timer as TimerIcon } from 'lucide-react';

const SharedTimer = ({ roomCode }) => {
  const [timerData, setTimerData] = useState({ seconds: 300, isActive: false });

  useEffect(() => {
    if (!roomCode) return;

    // Listen data timer langsung dari Firebase
    const timerRef = ref(db, `rooms/${roomCode}/timer`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTimerData(data);
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Hitung mundur lokal agar pergerakan detik halus di layar
  useEffect(() => {
    let interval = null;
    if (timerData.isActive && timerData.seconds > 0) {
      interval = setInterval(() => {
        setTimerData(prev => ({ ...prev, seconds: prev.seconds - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerData.isActive]);

  return (
    <div className={`flex items-center gap-3 px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl transition-all duration-500 ${timerData.isActive ? 'border-red-900/50 ring-1 ring-red-500/20' : ''}`}>
      <TimerIcon 
        size={20} 
        className={`${timerData.isActive ? "text-red-500 animate-pulse" : "text-slate-600"}`} 
      />
      <span className={`font-mono text-2xl font-black tracking-tighter ${
        timerData.seconds < 60 && timerData.isActive ? "text-red-500 animate-pulse" : "text-white"
      }`}>
        {formatTime(timerData.seconds)}
      </span>
    </div>
  );
};

export default SharedTimer;