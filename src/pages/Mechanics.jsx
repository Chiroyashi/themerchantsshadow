import React from 'react';
import { Compass, Moon, Sun, AlertTriangle, ArrowRight, ChevronLeft } from 'lucide-react';

const Step = ({ number, title, desc, icon: Icon }) => (
  <div className="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-red-500 font-bold border border-slate-700">
      {Icon ? <Icon size={18} /> : number}
    </div>
    <div>
      <h4 className="font-bold text-slate-200 uppercase tracking-wide text-sm">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed mt-1">{desc}</p>
    </div>
  </div>
);

const Mechanics = ({ onNext, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="space-y-2 relative">
          <button onClick={onBack} className="absolute -top-10 left-0 flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors text-sm uppercase tracking-widest font-bold">
            <ChevronLeft size={16} /> Back
          </button>
          <h2 className="text-amber-500 font-bold tracking-widest text-sm uppercase">TUTORIAL</h2>
          <h1 className="text-4xl font-black italic uppercase">Jejak Mata Angin</h1>
        </header>

        {/* Visualisasi Kompas */}
        <section className="grid md:grid-cols-2 gap-8 items-center bg-slate-900/30 p-8 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="relative aspect-square flex items-center justify-center border-2 border-dashed border-slate-800 rounded-full">
            <Compass className="w-32 h-32 text-slate-800 absolute opacity-20" />
            
            {/* Titik Tengah (Pedagang) */}
            <div className="z-10 bg-amber-600 w-4 h-4 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.5)] flex items-center justify-center group">
               <span className="absolute -top-8 text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Pedagang</span>
            </div>

            {/* Garis Arah (Barat Daya) */}
            <div className="absolute w-[2px] h-32 bg-gradient-to-t from-red-600 to-transparent rotate-[225deg] origin-bottom bottom-1/2">
                <div className="absolute top-0 -left-1 w-3 h-3 bg-red-600 rounded-full animate-ping" />
            </div>

            {/* Label Mata Angin */}
            <span className="absolute top-4 font-bold text-slate-700">U</span>
            <span className="absolute bottom-4 font-bold text-slate-700">S</span>
            <span className="absolute right-4 font-bold text-slate-700">T</span>
            <span className="absolute left-4 font-bold text-slate-700">B</span>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-950/30 border border-red-900/50 text-red-400 text-[10px] font-bold uppercase">
              <AlertTriangle size={12} /> Info Transaksi
            </div>
            <p className="text-slate-300 leading-relaxed font-light text-sm">
              Setiap kali <span className="text-red-500 font-bold italic underline decoration-red-900">Warlock</span> membeli item, Moderator mengumumkan arah transaksi berdasarkan posisi duduk.
            </p>
            <div className="bg-slate-950 p-4 rounded border-l-2 border-amber-600 italic text-xs text-slate-400">
              "Telah terdeteksi aktivitas gelap! Jejak mengarah ke <span className="text-amber-500 font-bold uppercase">Barat Daya</span> dari posisi duduk [Nama Pedagang]."
            </div>
          </div>
        </section>

        {/* Prosedur Permainan */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold uppercase tracking-tighter italic">Prosedur Permainan</h3>
            <div className="flex-1 h-[1px] bg-slate-800"></div>
          </div>

          <div className="grid gap-4">
            <Step 
              number="1" 
              title="Siklus Malam (Silent Mode)" 
              icon={Moon}
              desc="Moderator mengontak Warlock, Seer, Werewolf, dan Guard via WhatsApp. Semua pemain menunduk dan mode silent." 
            />
            <Step 
              number="2" 
              title="Siklus Siang (Laporan)" 
              icon={Sun}
              desc="Pengumuman kematian dan laporan jejak mata angin. Warga mulai berdiskusi selama 5-7 menit." 
            />
            <Step 
              number="3" 
              title="Aksi Mendadak" 
              icon={AlertTriangle}
              desc="Hunter dan Hakim bisa menggunakan skill tembak/interogasi secara tiba-tiba sebelum voting dimulai." 
            />
            <Step 
              number="4" 
              title="Voting & Eksekusi" 
              icon={ArrowRight}
              desc="Pemain dengan suara terbanyak dikeluarkan. Jika Serigala mati semua, Warga Menang!" 
            />
          </div>
        </section>

        {/* Victory Conditions */}
        <section className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold uppercase text-slate-500 italic">Kondisi Kemenangan</h4>
                <p className="text-xs text-slate-400">Pastikan Moderator selalu memantau jumlah pemain yang tersisa.</p>
            </div>
            <div className="flex gap-4">
                <div className="text-center px-4 py-2 border border-blue-900/50 rounded bg-blue-950/20 text-[10px] font-bold uppercase text-blue-400">Warga: Habisi Serigala</div>
                <div className="text-center px-4 py-2 border border-red-900/50 rounded bg-red-950/20 text-[10px] font-bold uppercase text-red-400">Serigala: Seimbangkan Jumlah</div>
            </div>
        </section>

      </div>
    </div>
  );
};

export default Mechanics;