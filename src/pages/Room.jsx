import React, { useState } from 'react';
import { Plus, Users, ArrowRight, ChevronLeft } from 'lucide-react';

const Room = ({ onCreate, onJoin, onBack }) => {
  const [inputCode, setInputCode] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs uppercase font-bold">
          <ChevronLeft size={14} /> Kembali
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Game Lobby</h1>
          <p className="text-slate-500 text-sm">Siapkan meja perdaganganmu atau bergabung dengan yang sudah ada.</p>
        </div>

        <div className="grid gap-6">
          {/* Create Room Card */}
          <button 
            onClick={onCreate}
            className="group p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-red-600 transition-all text-left space-y-2"
          >
            <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Plus size={24} />
            </div>
            <h3 className="font-bold text-lg">Buat Room Baru</h3>
            <p className="text-xs text-slate-500">Anda akan menjadi Moderator (Akbar) dalam sesi ini.</p>
          </button>

          <div className="relative py-4 flex items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-600 text-xs font-bold uppercase">Atau</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Join Room Section */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center gap-3 text-blue-500 font-bold uppercase text-xs tracking-widest">
              <Users size={16} /> Join Room
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="MASUKKAN KODE" 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-center font-mono font-bold tracking-widest focus:border-blue-600 outline-none transition-all"
              />
              <button 
                onClick={() => inputCode.length > 3 && onJoin(inputCode)}
                disabled={inputCode.length < 4}
                className="bg-blue-700 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 px-4 py-3 rounded-lg transition-all"
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