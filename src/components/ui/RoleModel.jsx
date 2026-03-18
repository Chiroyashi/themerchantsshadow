import React from 'react';
import { X, Shield, Skull, Eye, Zap, Info } from 'lucide-react';

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
    // Default: Pedagang / Warga
    return {
      title: "The Merchant (Warga)",
      icon: <Shield className="text-blue-500" size={40} />,
      desc: "Kamu adalah warga biasa yang mencoba bertahan hidup dari teror malam.",
      powers: ["Berdiskusi di siang hari.", "Memberikan voting untuk membuang tersangka.", "Mencari tahu siapa penghianat di antara kalian."]
    };
  };

  const detail = getRoleDetail(role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={24} />
        </button>

        <div className="text-center space-y-6">
          <div className="flex justify-center">{detail.icon}</div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{detail.title}</h2>
            <div className="h-1 w-12 bg-slate-700 mx-auto mt-2"></div>
          </div>
          
          <p className="text-slate-400 text-sm leading-relaxed">{detail.desc}</p>

          <div className="space-y-3 text-left bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Zap size={12} /> Kemampuan Khusus:
            </p>
            {detail.powers.map((p, i) => (
              <div key={i} className="flex gap-2 items-start text-xs text-slate-300">
                <span className="text-red-600">•</span>
                <span>{p}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-100 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all"
          >
            SAYA MENGERTI
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;