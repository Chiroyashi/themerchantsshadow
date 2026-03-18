import React from 'react';
import { X, Shield, Skull, Zap, Info } from 'lucide-react';

const RoleModal = ({ role, isOpen, onClose }) => {
  // Guard clause agar tidak render apapun jika modal ditutup
  if (!isOpen) return null;

  const getRoleDetail = (roleName) => {
    const r = roleName?.toLowerCase() || "";
    
    if (r.includes('werewolf')) return {
      title: "The Werewolf",
      icon: <Skull className="text-red-500" size={40} />,
      desc: "Kamu adalah predator malam. Misimu adalah menghabisi seluruh warga tanpa ketahuan.",
      powers: ["Membunuh 1 warga setiap malam.", "Bekerjasama dengan Werewolf lain.", "Menyamar sebagai warga di siang hari."],
      accent: "border-red-600/50"
    };
    
    if (r.includes('warlock')) return {
      title: "The Warlock",
      icon: <Zap className="text-purple-500" size={40} />,
      desc: "Penyihir kegelapan yang membantu Werewolf. Kamu punya ilmu hitam untuk mengacaukan kota.",
      powers: ["Mengetahui siapa Werewolf.", "Mampu memberikan kutukan atau tanda.", "Membantu voting untuk membuang warga."],
      accent: "border-purple-600/50"
    };
    
    if (r.includes('moderator')) return {
      title: "The Moderator",
      icon: <Info className="text-amber-500" size={40} />,
      desc: "Kamu adalah hakim tertinggi. Kamu mengontrol alur cerita, waktu, dan keadilan.",
      powers: ["Mengatur fase malam dan siang.", "Menentukan kematian pemain.", "Menjaga kejujuran permainan."],
      accent: "border-amber-600/50"
    };

    // Default: Merchant / Warga
    return {
      title: "The Merchant",
      icon: <Shield className="text-blue-500" size={40} />,
      desc: "Kamu adalah warga biasa yang mencoba bertahan hidup dari teror bayangan malam.",
      powers: ["Berdiskusi di siang hari.", "Memberikan voting untuk membuang tersangka.", "Mencari tahu siapa pengkhianat."],
      accent: "border-blue-600/50"
    };
  };

  const detail = getRoleDetail(role);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`bg-slate-900 border ${detail.accent} w-full max-w-sm rounded-3xl p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.6)] transform animate-in zoom-in-95 duration-300`}>
        
        {/* Tombol Close Pojok Kanan Atas */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-6">
          {/* Icon Role */}
          <div className="flex justify-center drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {detail.icon}
          </div>

          {/* Judul & Garis Dekorasi */}
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
              {detail.title}
            </h2>
            <div className="h-[2px] w-12 bg-slate-700 mx-auto mt-2"></div>
          </div>
          
          {/* Deskripsi */}
          <p className="text-slate-400 text-sm leading-relaxed">
            {detail.desc}
          </p>

          {/* List Kemampuan */}
          <div className="space-y-3 text-left bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
              <Zap size={12} className="text-amber-500" /> Kemampuan Khusus:
            </p>
            <div className="space-y-2">
              {detail.powers.map((p, i) => (
                <div key={i} className="flex gap-3 items-start text-[11px] text-slate-300 leading-tight">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1 shrink-0"></div>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tombol Paham */}
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-100 text-slate-950 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white active:scale-95 transition-all shadow-lg"
          >
            SAYA MENGERTI
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;