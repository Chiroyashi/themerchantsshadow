import React, { useState, useEffect } from 'react';
import { Sunrise, Sunset, Moon, Loader2 } from 'lucide-react';

const PhaseTransition = ({ fromPhase, toPhase, day, onComplete }) => {
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanDismiss(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (canDismiss) {
      const dismissTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
      return () => clearTimeout(dismissTimer);
    }
  }, [canDismiss, onComplete]);

  const getPhaseInfo = () => {
    const isGoingToPagi = toPhase?.toLowerCase().includes("pagi");
    const isGoingToSiang = toPhase?.toLowerCase().includes("siang");
    const isGoingToMalam = toPhase?.toLowerCase().includes("malam");

    if (isGoingToPagi) {
      return {
        icon: Sunrise,
        title: 'Fajar Menyingsing',
        subtitle: `Hari ${day} Dimulai`,
        bgGradient: 'from-amber-600/20 via-orange-600/10 to-slate-950',
        borderColor: 'border-amber-500',
        iconColor: 'text-amber-400',
        glowColor: 'bg-amber-600/20',
        shadowColor: 'shadow-amber-600/30',
        accentColor: 'text-amber-500'
      };
    } else if (isGoingToSiang) {
      return {
        icon: Sunrise,
        title: 'Siang',
        subtitle: 'Waktu Voting Dimulai',
        bgGradient: 'from-orange-600/20 via-orange-500/10 to-slate-950',
        borderColor: 'border-orange-500',
        iconColor: 'text-orange-400',
        glowColor: 'bg-orange-600/20',
        shadowColor: 'shadow-orange-600/30',
        accentColor: 'text-orange-500'
      };
    } else if (isGoingToMalam) {
      return {
        icon: Moon,
        title: 'Malam Turun',
        subtitle: 'Segala tindakan dilakukan',
        bgGradient: 'from-purple-900/30 via-purple-800/10 to-slate-950',
        borderColor: 'border-purple-500',
        iconColor: 'text-purple-400',
        glowColor: 'bg-purple-600/20',
        shadowColor: 'shadow-purple-600/30',
        accentColor: 'text-purple-500'
      };
    }
    return {
      icon: Sunrise,
      title: 'Fase Baru',
      subtitle: toPhase || '',
      bgGradient: 'from-blue-600/20 to-slate-950',
      borderColor: 'border-blue-500',
      iconColor: 'text-blue-400',
      glowColor: 'bg-blue-600/20',
      shadowColor: 'shadow-blue-600/30',
      accentColor: 'text-blue-500'
    };
  };

  const info = getPhaseInfo();
  const Icon = info.icon;

  return (
    <div className={`fixed inset-0 z-[120] flex items-center justify-center bg-gradient-to-b ${info.bgGradient} backdrop-blur-xl transition-opacity duration-500 ${canDismiss ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`absolute inset-0 ${info.glowColor} blur-3xl`} />
      
      <div className={`relative max-w-sm w-full bg-slate-950/90 border-2 ${info.borderColor} ${info.shadowColor} rounded-[2.5rem] p-10 text-center space-y-8 animate-in zoom-in duration-500`}>
        <div className={`absolute -top-16 -right-16 w-40 h-40 ${info.glowColor} rounded-full blur-3xl opacity-60`} />
        <div className={`absolute -bottom-16 -left-16 w-40 h-40 ${info.glowColor} rounded-full blur-3xl opacity-40`} />
        
        <div className="relative">
          <div className={`absolute inset-0 ${info.glowColor} blur-3xl scale-150 animate-pulse rounded-full`} />
          <div className={`relative p-6 ${info.glowColor} rounded-full w-fit mx-auto animate-bounce`}>
            <Icon size={64} className={info.iconColor} />
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <p className={`${info.accentColor} text-[10px] font-black uppercase tracking-[0.3em]`}>
            Transisi Fase
          </p>
          <h1 className="text-white text-2xl font-black italic uppercase leading-none tracking-tighter">
            {info.title}
          </h1>
          <h2 className="text-slate-400 text-sm font-semibold">
            {info.subtitle}
          </h2>
        </div>

        <div className="relative z-10">
          <div className={`flex items-center justify-center gap-3 ${info.iconColor} opacity-50`}>
            <Loader2 className="animate-spin" size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest animate-pulse font-mono">Memuat...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseTransition;
