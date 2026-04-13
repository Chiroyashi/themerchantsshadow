import React, { useState } from 'react';
import { Plus, Users, ArrowRight, ChevronLeft, UserCircle, ScrollText, BadgeCheck, GripVertical } from 'lucide-react';

const Room = ({ onCreate, onJoin, onBack }) => {
  const [inputCode, setInputCode] = useState('');
  const [tempName, setTempName] = useState("");

  const isNameEmpty = tempName.trim().length < 3;
  const nameLength = tempName.trim().length;

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

        <div className="relative">
          {/* Player Identity Card - Always on top */}
          <div className={`p-6 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-700 z-20
            ${nameLength >= 3 
              ? 'bg-gradient-to-br from-emerald-950/80 to-emerald-900/30 border-2 border-emerald-600/50' 
              : 'bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800'
            }`}>
            {/* Decorative */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl transition-all duration-500 ${nameLength >= 3 ? 'bg-emerald-600/20' : 'bg-red-600/5'}`} />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${nameLength >= 3 ? 'bg-emerald-600/30' : 'bg-blue-600/20'}`}>
                  <BadgeCheck size={24} className={nameLength >= 3 ? 'text-emerald-400' : 'text-blue-500'} />
                </div>
                <div className="pl-2">
                  <h3 className={`font-black text-2xl transition-colors duration-300 ${nameLength >= 3 ? 'text-emerald-300' : 'text-white'}`}>NAMA PEMAIN</h3>
                </div>
              </div>
              <GripVertical size={20} className={nameLength >= 3 ? 'text-emerald-700' : 'text-slate-700'} />
            </div>

            {/* Input Field - Tetap Gelap */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                <UserCircle size={20} />
              </div>
                <input 
                type="text" 
                placeholder={nameLength >= 3 ? "" : "Ketik nama Anda di sini..."}
                value={tempName}
                maxLength={20}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full bg-slate-950/60 border-2 border-slate-800 rounded-2xl pl-12 pr-4 py-4 font-bold text-base tracking-wide focus:outline-none focus:border-emerald-600 transition-all text-center placeholder:text-slate-700 text-white"
              />
            </div>

            {/* Character Counter */}
            <div className="flex justify-between items-center mt-3 px-1">
              <p className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${nameLength >= 3 ? 'text-emerald-600' : 'text-slate-600'}`}>
                {nameLength < 3 ? `${nameLength}/3 karakter` : '✓ Siap bermain'}
              </p>
              {nameLength > 0 && (
                <p className={`text-[9px] font-black uppercase ${nameLength >= 3 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {nameLength} huruf
                </p>
              )}
            </div>


          </div>

          {/* Action Cards - Fade in from behind when name is filled */}
          <div className={`space-y-4 mt-4 ml-2 mr-6 transition-all duration-700 ease-out
            ${nameLength >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
            
            {/* Create Room Button */}
            <button 
              onClick={() => onCreate(tempName)}
              disabled={isNameEmpty}
              className={`w-full group p-6 border rounded-3xl transition-all text-left space-y-2 relative overflow-hidden
                bg-slate-900 border-slate-800 hover:border-red-600 shadow-xl hover:shadow-red-900/10`}
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/0 group-hover:bg-red-600/10 rounded-full blur-3xl transition-all duration-500" />
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-red-600 text-white group-hover:scale-110 transition-transform relative z-10`}>
                <Plus size={26} />
              </div>
              <div className="relative z-10">
                <h3 className="font-black uppercase tracking-tight text-lg text-white">Buat Sesi Baru</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-widest font-bold mt-1">Menjadi Moderator • Pemimpin Cerita</p>
              </div>
            </button>

            {/* Join Room */}
            <div className="p-6 border rounded-3xl space-y-4 bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/0 rounded-full blur-3xl" />
              
              <div className="flex items-center gap-3 font-black uppercase text-[10px] tracking-[0.2em] relative z-10 text-blue-500">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600/20">
                  <Users size={20} />
                </div>
                <span className="text-sm">Gabung Room</span>
              </div>
              
              <div className="flex gap-3 relative z-10">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="KODE ROOM" 
                    value={inputCode}
                    maxLength={6}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950/80 border-2 border-slate-800 rounded-2xl px-4 py-4 text-center font-mono font-black tracking-[0.2em] focus:border-blue-600 focus:outline-none transition-all text-sm"
                  />
                </div>
                <button 
                  onClick={() => onJoin(inputCode, tempName)}
                  disabled={inputCode.length < 4}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 px-6 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-900/20 font-bold"
                >
                  <ArrowRight size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;