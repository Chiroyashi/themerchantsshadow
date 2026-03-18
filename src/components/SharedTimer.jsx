import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { Timer as TimerIcon, Sun, Sunset, Moon } from 'lucide-react';

const SharedTimer = ({ roomCode }) => {
  const [timerData, setTimerData] = useState({ 
    seconds: 300, 
    isActive: false, 
    phase: "Persiapan" 
  });

  // KUNCI: Gunakan Ref untuk menyimpan nilai detik agar tidak terpengaruh re-render
  const secondsRef = useRef(300);
  const intervalRef = useRef(null);

  // 1. Sinkronisasi Tunggal dengan Firebase
  useEffect(() => {
    if (!roomCode) return;

    const timerRef = ref(db, `rooms/${roomCode}/timer`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Update state utama
        setTimerData(data);
        
        // Update nilai referensi detik
        secondsRef.current = data.seconds;

        // LOGIKA PAUSE/PLAY:
        if (!data.isActive) {
          // Jika Firebase bilang PAUSE, langsung bunuh interval lokal tanpa ampun
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          // Jika Firebase bilang PLAY dan interval belum jalan, mulai hitung mundur
          if (!intervalRef.current && data.seconds > 0) {
            intervalRef.current = setInterval(() => {
              if (secondsRef.current > 0) {
                secondsRef.current -= 1;
                // Update UI secara halus
                setTimerData(prev => ({ ...prev, seconds: secondsRef.current }));
              } else {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }, 1000);
          }
        }
      }
    });

    return () => {
      unsubscribe();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [roomCode]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getPhaseIcon = () => {
    const p = timerData.phase?.toLowerCase() || "";
    if (p.includes("pagi")) return <Sun size={14} className="text-amber-500" />;
    if (p.includes("siang")) return <Sunset size={14} className="text-orange-500" />;
    if (p.includes("malam")) return <Moon size={14} className="text-purple-500" />;
    return <TimerIcon size={14} className="text-slate-500" />;
  };

  return (
    <div className={`flex flex-col items-center gap-1 px-6 py-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl transition-all duration-500 ${timerData.isActive ? 'border-red-900/40 ring-1 ring-red-500/10' : 'opacity-70 shadow-none'}`}>
      
      <div className="flex items-center gap-2 mb-0.5">
        {getPhaseIcon()}
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
          {timerData.phase || "Menunggu"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <TimerIcon 
          size={18} 
          className={`${timerData.isActive ? "text-red-500 animate-pulse" : "text-slate-700"}`} 
        />
        <span className={`font-mono text-2xl font-black tracking-tighter leading-none ${
          timerData.seconds < 60 && timerData.isActive ? "text-red-500 animate-pulse" : "text-white"
        }`}>
          {formatTime(timerData.seconds)}
        </span>
      </div>

      {!timerData.isActive && timerData.seconds > 0 && (
        <span className="text-[7px] font-bold text-amber-500/50 uppercase tracking-widest animate-pulse mt-1">
          Waktu Terhenti
        </span>
      )}
    </div>
  );
};

export default SharedTimer;