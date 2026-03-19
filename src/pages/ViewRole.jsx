// Tambahkan seconds, phase, isActive ke dalam parameter props
const ViewRole = ({ playerData, roomCode, phase, seconds, isActive, onNext, onLeave }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);

  const isDead = playerData?.status === 'dead';

  // ... (Logika theme tetap sama) ...
  const theme = (() => {
    const role = playerData?.role?.toLowerCase() || "";
    if (isDead) return { color: "text-slate-500", bg: "bg-slate-900/50", border: "border-slate-800", icon: Ghost };
    if (role.includes('werewolf') || role.includes('warlock')) 
      return { color: "text-red-500", bg: "bg-red-950/20", border: "border-red-600", icon: Skull };
    if (role.includes('moderator')) 
      return { color: "text-amber-500", bg: "bg-amber-950/20", border: "border-amber-600", icon: Shield };
    return { color: "text-blue-500", bg: "bg-blue-950/20", border: "border-blue-600", icon: Shield };
  })();
  const RoleIcon = theme.icon;

  return (
    <div className={`min-h-screen transition-colors duration-1000 p-6 flex flex-col items-center justify-center font-sans ${isDead ? 'bg-black' : 'bg-slate-950'}`}>
      
      {/* UPDATE: Kirim props timer ke SharedTimer */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 scale-90 md:scale-100">
        <SharedTimer seconds={seconds} phase={phase} isActive={isActive} />
      </div>

      <RoleModal role={playerData?.role} isOpen={showMechanics} onClose={() => setShowMechanics(false)} />

      {/* ... sisa UI ViewRole tetap sama ... */}
      <div className="max-w-md w-full space-y-6 text-center pt-10">
         {/* ... (Konten Kartu) ... */}
         <div className={`relative aspect-[3/4] ...`}>
            {/* ... */}
         </div>

         <div className="space-y-4 w-full">
            {/* Tombol Intip, Papan Game, dll */}
            <button 
                onMouseDown={() => setIsRevealed(true)}
                onMouseUp={() => setIsRevealed(false)}
                onTouchStart={() => setIsRevealed(true)}
                onTouchEnd={() => setIsRevealed(false)}
                className={`w-full py-5 rounded-2xl ...`}
            >
                <span className="text-xs">{isRevealed ? "LEPASKAN" : "TAHAN UNTUK INTIP"}</span>
            </button>
            {/* ... */}
         </div>
      </div>

      <NightOverlay phase={phase} isDead={isDead} />
    </div>
  );
};

export default ViewRole;