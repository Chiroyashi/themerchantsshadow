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

  // Gunakan Ref untuk menyimpan angka detik yang paling akurat tanpa trigger loop
  const secondsRef = useRef(300);

  // 1. Listen data timer & phase langsung dari Firebase
  useEffect(() => {
    if (!roomCode) return;

    const timerRef = ref(db, `rooms/${roomCode}/timer`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTimerData(data);
        // Sinkronkan Ref dengan data terbaru dari Firebase
        secondsRef.current = data.seconds;
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  // 2. Hitung mundur lokal yang "Disiplin"
  useEffect(() => {
    let interval = null;

    // Hanya menghitung secara lokal jika Firebase bilang isActive: true
    if (timerData.isActive && timerData.seconds > 0) {
      interval = setInterval(() => {
        if (secondsRef.current > 0) {
          secondsRef.current -= 1;
          // Update tampilan state agar UI berubah halus (4:59 -> 4:58)
          setTimerData(prev => ({ ...prev, seconds: secondsRef.current }));
        }
      }, 1000);
    } else {
      // Jika isActive: false (PAUSE), bersihkan interval agar detik berhenti total
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerData.isActive]); // Hanya trigger ulang jika status aktif berubah dari Firebase

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
    <div className={`flex flex-col items-center gap-1 px-6 py-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl transition-all duration-500 ${timerData.isActive ? 'border-red-900/40 ring-1 ring-red-500/10' : 'opacity-80'}`}>
      
      {/* Badge Nama Fase */}
      <div className="flex items-center gap-2 mb-0.5">
        {getPhaseIcon()}
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
          {timerData.phase || "Menunggu"}
        </span>
      </div>

      {/* Tampilan Waktu */}
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

      {/* Indikator Status */}
      {!timerData.isActive && timerData.seconds > 0 && (
        <span className="text-[7px] font-bold text-amber-500/50 uppercase tracking-widest animate-pulse mt-1">
          Paused by Moderator
        </span>
      )}
    </div>
  );
};

export default SharedTimer;