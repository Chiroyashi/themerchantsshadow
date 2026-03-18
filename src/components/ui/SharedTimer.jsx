import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from "firebase/database";
import { db } from "../lib/firebase";
import { Timer as TimerIcon } from 'lucide-react';

const SharedTimer = ({ roomCode, isHost }) => {
  const [timerData, setTimerData] = useState({ seconds: 300, isActive: false });

  useEffect(() => {
    if (!roomCode) return;
    const timerRef = ref(db, `rooms/${roomCode}/timer`);
    
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setTimerData(data);
    });

    return () => unsubscribe();
  }, [roomCode]);

  // Logic pengurangan detik (Hanya Host yang menghitung agar tidak bentrok)
  useEffect(() => {
    let interval = null;
    if (isHost && timerData.isActive && timerData.seconds > 0) {
      interval = setInterval(() => {
        set(ref(db, `rooms/${roomCode}/timer/seconds`), timerData.seconds - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isHost, timerData.isActive, timerData.seconds, roomCode]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full shadow-lg">
      <TimerIcon size={16} className={timerData.isActive ? "text-red-500 animate-pulse" : "text-slate-500"} />
      <span className={`font-mono font-bold text-lg ${timerData.seconds < 60 && timerData.isActive ? "text-red-500 animate-pulse" : "text-white"}`}>
        {formatTime(timerData.seconds)}
      </span>
    </div>
  );
};

export default SharedTimer;