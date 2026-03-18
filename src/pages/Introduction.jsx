import React from 'react';
import { TEAM_SERIGALA, TEAM_WARGA } from '../constants/roles';
import { Skull, Users, ChevronRight, ChevronLeft } from 'lucide-react';

const RoleCard = ({ role, color }) => (
  <div className={`p-4 rounded-lg bg-slate-900 border-l-4 ${color} hover:bg-slate-800 transition-all duration-300 shadow-xl`}>
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-bold text-lg tracking-tight">{role.name}</h4>
      <span className="text-xs bg-slate-800 px-2 py-1 rounded-md text-slate-400 font-mono">
        x{role.count}
      </span>
    </div>
    <p className="text-sm text-slate-400 leading-relaxed font-light">
      {role.desc}
    </p>
  </div>
);

const Introduction = ({ onNext, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase italic">The Roles</h1>
          </div>
          <div className="flex gap-3">
             <button onClick={onBack} className="p-3 border border-slate-800 rounded-full hover:bg-slate-900 transition-colors">
                <ChevronLeft className="w-5 h-5" />
             </button>
             <button onClick={onNext} className="flex items-center gap-2 bg-red-700 hover:bg-red-600 px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-red-900/20">
                Next: Mekanisme <ChevronRight className="w-5 h-5" />
             </button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-12">
          
          {/* Tim Serigala */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-red-900/50 pb-4">
              <Skull className="text-red-600 w-6 h-6" />
              <h3 className="text-2xl font-bold tracking-tighter uppercase text-red-500">Tim Serigala</h3>
            </div>
            <div className="grid gap-4">
              {TEAM_SERIGALA.map((role) => (
                <RoleCard key={role.name} role={role} color="border-red-600" />
              ))}
            </div>
            <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-md">
                <p className="text-xs text-red-400 italic font-light">
                  *Antagonis harus berkoordinasi secara rahasia via WhatsApp/DM tanpa diketahui warga di dunia nyata.
                </p>
            </div>
          </section>

          {/* Tim Warga */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-blue-900/50 pb-4">
              <Users className="text-blue-500 w-6 h-6" />
              <h3 className="text-2xl font-bold tracking-tighter uppercase text-blue-400">Tim Warga</h3>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
              {TEAM_WARGA.map((role) => (
                <RoleCard key={role.name} role={role} color={role.type === "Special" ? "border-blue-500" : "border-slate-500"} />
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Introduction;