import React from 'react';
import { Skull, User } from 'lucide-react';

const GameBoard = ({ players }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h2 className="text-center text-slate-500 uppercase tracking-[0.3em] text-[10px] mb-6">Informasi Kota</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {players.map((p) => (
          <div key={p.id} className={`p-3 rounded-lg flex items-center gap-3 border ${p.status === 'dead' ? 'bg-slate-900/20 border-red-900/20 grayscale' : 'bg-slate-900 border-slate-800'}`}>
            <div className={`p-2 rounded-md ${p.status === 'dead' ? 'bg-red-950/30 text-red-700' : 'bg-slate-800 text-blue-500'}`}>
              {p.status === 'dead' ? <Skull size={16} /> : <User size={16} />}
            </div>
            <div className="overflow-hidden">
              <p className={`text-xs font-bold truncate ${p.status === 'dead' ? 'text-slate-600' : 'text-slate-200'}`}>
                {p.name}
              </p>
              <p className="text-[8px] uppercase tracking-widest text-slate-600">
                {p.status === 'dead' ? 'Gugur' : 'Aktif'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;