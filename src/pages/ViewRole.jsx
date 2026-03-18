import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Skull, HelpCircle, BookOpen, X, Zap, Info } from 'lucide-react';
import SharedTimer from '../components/SharedTimer';

// --- Komponen Pop-up Mechanics Internal ---
const RoleModal = ({ role, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getRoleDetail = (roleName) => {
    const r = roleName?.toLowerCase() || "";
    if (r.includes('werewolf')) return {
      title: "The Werewolf",
      icon: <Skull className="text-red-500" size={40} />,
      desc: "Kamu adalah predator malam. Misimu adalah menghabisi seluruh warga tanpa ketahuan.",
      powers: ["Membunuh 1 warga setiap malam.", "Bekerjasama dengan Werewolf lain.", "Menyamar sebagai warga di siang hari."]
    };
    if (r.includes('warlock')) return {
      title: "The Warlock",
      icon: <Zap className="text-purple-500" size={40} />,
      desc: "Penyihir kegelapan yang membantu Werewolf. Kamu punya ilmu hitam untuk mengacaukan kota.",
      powers: ["Mengetahui siapa Werewolf.", "Mampu memberikan kutukan atau tanda.", "Membantu voting untuk membuang warga."]
    };
    if (r.includes('moderator')) return {
      title: "The Moderator",
      icon: <Info className="text-amber-500" size={40} />,
      desc: "Kamu adalah hakim tertinggi. Kamu mengontrol alur cerita dan waktu.",
      powers: ["Mengatur fase malam dan siang.", "Menentukan kematian pemain.", "Menjaga kejujuran permainan."]
    };
    return {
      title: "The Merchant (Warga)",
      icon: <Shield className="text-blue-500" size={40} />,
      desc: "Kamu adalah warga biasa yang mencoba bertahan hidup dari teror malam.",
      powers: ["Berdiskusi di siang hari.", "Voting untuk membuang tersangka.", "Mencari tahu siapa penghianat."]
    };
  };

  const detail = getRoleDetail(role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={24} />
        </button>
        <div className="text-center space-y-6">
          <div className="flex justify-center">{detail.icon}</div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{detail.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{detail.desc}</p>
          <div className="space-y-3 text-left bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><Zap size={12} /> Kemampuan:</p>
            {detail.powers.map((p, i) => (
              <div key={i} className="flex gap-2 items-start text-xs text-slate-300">
                <span className="text-red-600">•</span><span>{p}</span>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="w-full py-4 bg-slate-100 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all">SAYA MENGERTI</button>
        </div>
      </div>
    </div>
  );
};

const ViewRole = ({ playerData, roomCode, onNext, onLeave }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);

  const theme = (() => {
    const role = playerData?.role?.toLowerCase() || "";
    if (role.includes('werewolf') || role.includes('warlock')) 
      return { color: "text-red-500", bg: "bg-red-950/20", border: "border-red-600", icon: Skull };
    if (role.includes('moderator')) 
      return { color: "text-amber-500", bg: "bg-amber-950/20", border: "border-amber-600", icon: Shield };
    return { color: "text-blue-500", bg: "bg-blue-950/20", border: "border-blue-600", icon: Shield };
  })();

  const RoleIcon = theme.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center font-sans">
      
      {/* Timer Sinkron */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 scale-90 md:scale-100">
        <SharedTimer roomCode={roomCode} isHost={false} />
      </div>

      {/* Pop-up Mechanics */}
      <RoleModal 
        role={playerData?.role} 
        isOpen={showMechanics} 
        onClose={() => setShowMechanics(false)} 
      />

      <div className="max-w-md w-full space-y-8 text-center pt-12">
        <div className="space-y-1">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Identity Assigned</p>
          <h2 className="text-xl font-bold italic">{playerData?.name || "Pemain"}</h2>
          <p className="text-slate-600 text-xs font-mono uppercase tracking-widest">Room: {roomCode}</p>
        </div>

        {/* Card Section */}
        <div className={`relative aspect-[3/4] w-full rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden
            ${isRevealed ? `${theme.bg} ${theme.border} shadow-[0_0_30px_rgba(220,38,38,0.2)]` : 'bg-slate-900 border-slate-800'}`}>
          {!isRevealed ? (
            <div className="space-y-4 animate-pulse">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                <HelpCircle className="text-slate-600 w-10 h-10" />
              </div>
              <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Ketuk tombol di bawah <br/> untuk melihat peran</p>
            </div>
          ) : (
            <div className="space-y-6 z-10 animate-in fade-in zoom-in duration-300 text-center">
              <RoleIcon className={`${theme.color} w-24 h-24 mx-auto drop-shadow-lg`} />
              <div className="space-y-2">
                <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme.color}`}>
                  {playerData?.role}
                </h3>
                <div className="h-[1px] w-12 bg-slate-700 mx-auto"></div>
                <p className="text-slate-400 text-xs leading-relaxed max-w-[200px] mx-auto italic">
                  "Rahasiakan peranmu, atau kegelapan akan menjemputmu lebih cepat."
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-6">
          <button 
            onMouseDown={() => setIsRevealed(true)}
            onMouseUp={() => setIsRevealed(false)}
            onTouchStart={() => setIsRevealed(true)}
            onTouchEnd={() => setIsRevealed(false)}
            className={`w-full py-5 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 select-none
              ${isRevealed ? 'bg-slate-100 text-slate-950 shadow-inner' : 'bg-red-700 hover:bg-red-600 shadow-lg shadow-red-900/20'}`}>
            {isRevealed ? <EyeOff size={20} /> : <Eye size={20} />}
            {isRevealed ? "LEPASKAN UNTUK SEMBUNYI" : "TAHAN UNTUK INTIP ROLE"}
          </button>

          <div className="flex flex-col gap-6 items-center">
            {isRevealed && (
              <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button 
                  onClick={() => setShowMechanics(true)}
                  className="flex items-center justify-center gap-2 text-amber-500 hover:text-amber-400 text-[10px] uppercase font-black tracking-[0.2em]"
                >
                  <BookOpen size={14} /> Panduan Peran ({playerData?.role})
                </button>
                
                <button 
                  onClick={onNext}
                  className="w-full py-4 border border-slate-800 text-slate-500 hover:text-white rounded-xl text-[10px] uppercase font-bold tracking-[0.2em] transition-all"
                >
                  Lanjut ke Daftar Pemain
                </button>
              </div>
            )}

            {/* Tombol Keluar Manual */}
            <button 
              onClick={onLeave}
              className="text-[9px] text-slate-700 hover:text-red-500 font-bold uppercase tracking-[0.3em] transition-colors flex items-center gap-2 border-t border-slate-900 pt-4 w-full justify-center"
            >
              <X size={12} /> Keluar & Menyerah
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewRole;