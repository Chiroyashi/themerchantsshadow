import React, { useState } from 'react';
import { Plus, Users, ArrowRight, ChevronLeft, UserCircle, ScrollText } from 'lucide-react';

const Room = ({ onCreate, onJoin, onBack }) => {
  const [inputCode, setInputCode] = useState('');
  const [tempName, setTempName] = useState("");

  const isNameEmpty = tempName.trim().length < 2;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full space-y-8">
        
        <button 
          onClick={onBack} 
          className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] uppercase font-black tracking-widest"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Kembali
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Setup Room</h1>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest flex items-center justify-center gap-2">
            <ScrollText size={14} /> Memasuki Kota Waranasura
          </p>
        </div>

        <div className="grid gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
            <div className="flex items-center gap-3 text-red-500 font-black uppercase text-[10px] tracking-[0.2em]">
              <UserCircle size={16} /> Identitas Pemain
            </div>
            <input 
              type="text" 
              placeholder="Masukkan Nama Anda..." 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 font-bold tracking-widest focus:border-red-600 outline-none transition-all placeholder:text-slate-800 text-center"
            />
          </div>

          <button 
            onClick={() => onCreate(tempName)}
            disabled={isNameEmpty}
            className={`group p-6 border rounded-2xl transition-all text-left space-y-2 relative
              ${isNameEmpty 
                ? 'bg-slate-900/50 border-slate-900 opacity-50 cursor-not-allowed' 
                : 'bg-slate-900 border-slate-800 hover:border-red-600 shadow-xl'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors
              ${isNameEmpty ? 'bg-slate-800 text-slate-600' : 'bg-red-600/20 text-red-500 group-hover:bg-red-600 group-hover:text-white'}`}>
              <Plus size={24} />
            </div>
            <h3 className={`font-black uppercase tracking-tight ${isNameEmpty ? 'text-slate-600' : 'text-white'}`}>Buat Sesi Baru</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-widest font-bold">Menjadi Moderator (Pemimpin Dongeng)</p>
          </button>

          <div className={`p-6 border rounded-2xl space-y-4 transition-all
            ${isNameEmpty ? 'bg-slate-900/50 border-slate-900 opacity-50' : 'bg-slate-900 border-slate-800 shadow-xl'}`}>
            <div className={`flex items-center gap-3 font-black uppercase text-[10px] tracking-[0.2em] ${isNameEmpty ? 'text-slate-700' : 'text-blue-500'}`}>
              <Users size={16} /> Gabung Room
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                disabled={isNameEmpty}
                placeholder="KODE" 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-center font-mono font-black tracking-[0.3em] focus:border-blue-600 outline-none transition-all disabled:placeholder:text-slate-900"
              />
              <button 
                onClick={() => onJoin(inputCode, tempName)}
                disabled={isNameEmpty || inputCode.length < 4}
                className="bg-blue-700 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;