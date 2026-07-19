import React, { useEffect } from 'react';
import { X, Shield, Skull, Zap, Info, Eye, Target, Scale } from 'lucide-react';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const RoleModal = ({ role, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) { lockScroll(); return () => unlockScroll(); }
  }, [isOpen]);

  if (!isOpen) return null;

  const getRoleDetail = (roleName) => {
    const r = roleName?.toLowerCase() || "";
    
    // --- TEAM ANTAGONIS ---
    if (r.includes('werewolf')) return {
      title: "The Werewolf",
      icon: <Skull className="text-red-500" size={40} />,
      desc: "Kamu adalah predator malam. Misimu adalah menghabisi seluruh warga tanpa ketahuan.",
      powers: ["Membunuh 1 warga setiap malam.", "Bekerjasama dengan Werewolf lain.", "Menyamar sebagai warga di siang hari."],
      accent: "border-red-600/50",
      dot: "bg-red-600"
    };
    
    if (r.includes('warlock')) return {
      title: "The Warlock",
      icon: <Zap className="text-purple-500" size={40} />,
      desc: "Pengedar gelap yang bermain di bayang-bayang. Membantu Werewolf tanpa tahu siapa mereka.",
      powers: ["Membeli 1 item per malam dari Pedagang (Vision/Poison).", "Vision: mengetahui role target.", "Poison: membunuh 1 target.", "Tidak tahu identitas Werewolf — cari sendiri."],
      accent: "border-purple-600/50",
      dot: "bg-purple-600"
    };

    // --- TEAM PROTAGONIS (SPECIAL ROLES) ---
    if (r.includes('seer')) return {
      title: "The Seer",
      icon: <Eye className="text-emerald-500" size={40} />,
      desc: "Penerawang sakti yang bisa melihat kegelapan di hati seseorang.",
      powers: ["Mengetahui role 1 orang tiap malam.", "Memberikan petunjuk saat diskusi siang.", "Target utama yang harus dilindungi."],
      accent: "border-emerald-600/50",
      dot: "bg-emerald-600"
    };

    if (r.includes('guard')) return {
      title: "The Guard",
      icon: <Shield className="text-cyan-500" size={40} />,
      desc: "Pelindung desa yang setia. Tugasmu memastikan nyawa yang berharga tetap aman.",
      powers: ["Proteksi 1 pemain per malam aktif.", "Bisa lindungi diri sendiri maksimal 1x.", "Cooldown 2 malam antar proteksi (aktif malam 1, 4, 7...).", "Proteksi bertahan 2 malam."],
      accent: "border-cyan-600/50",
      dot: "bg-cyan-600"
    };

    if (r.includes('hunter')) return {
      title: "The Hunter",
      icon: <Target className="text-orange-500" size={40} />,
      desc: "Pemburu yang aktif berburu di malam hari. Setiap tembakan adalah taruhan nyawa.",
      powers: ["Pilih 1 target tembak di malam hari.", "Jika target warga → Hunter ikut mati.", "Jika target serigala → target mati, Hunter selamat.", "Keputusan sekali seumur permainan."],
      accent: "border-orange-600/50",
      dot: "bg-orange-600"
    };

    if (r.includes('hakim')) return {
      title: "The Judge",
      icon: <Scale className="text-blue-400" size={40} />,
      desc: "Pengawas keadilan di Waranasura. Kekuasaanmu adalah hukum yang tak terbantahkan.",
      powers: ["Truth malam: bocorkan chat pribadi target ke publik.", "Pistol siang: 2 peluru — instan kill tanpa voting.", "WAHAI RAKYATKU: wajib berkata sebelum vonis."],
      accent: "border-blue-400/50",
      dot: "bg-blue-400"
    };
    
    if (r.includes('moderator')) return {
      title: "The Moderator",
      icon: <Info className="text-amber-500" size={40} />,
      desc: "Kamu adalah hakim tertinggi. Kamu mengontrol alur cerita, waktu, dan keadilan.",
      powers: ["Mengatur fase malam dan siang.", "Menentukan kematian pemain.", "Menjaga kejujuran permainan."],
      accent: "border-amber-600/50",
      dot: "bg-amber-600"
    };

    // --- TEAM PROTAGONIS (WARGA BIASA) ---
    return {
      title: "The Merchant",
      icon: <Shield className="text-slate-400" size={40} />,
      desc: "Kamu adalah warga biasa yang mencoba bertahan hidup dari teror bayangan malam.",
      powers: ["Berdiskusi aktif di siang hari.", "Voting untuk membuang tersangka.", "Mencari tahu pengkhianat di antara kalian."],
      accent: "border-slate-600/50",
      dot: "bg-slate-400"
    };
  };

  const detail = getRoleDetail(role);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" style={{ zIndex: Z_LAYER.ROLE_MODAL }}>
      <div className={`bg-slate-900 border ${detail.accent} w-full max-w-sm rounded-3xl p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.6)] transform animate-in zoom-in-95 duration-300`}>
        
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-6">
          <div className="flex justify-center drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            {detail.icon}
          </div>

          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
              {detail.title}
            </h2>
            <div className="h-[2px] w-12 bg-slate-700 mx-auto mt-2"></div>
          </div>
          
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            {detail.desc}
          </p>

          <div className="space-y-3 text-left bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
              <Zap size={12} className="text-amber-500" /> Kemampuan Khusus:
            </p>
            <div className="space-y-2">
              {detail.powers.map((p, i) => (
                <div key={i} className="flex gap-3 items-start text-[11px] text-slate-300 leading-tight">
                  <div className={`w-1.5 h-1.5 rounded-full ${detail.dot} mt-1 shrink-0`}></div>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>

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