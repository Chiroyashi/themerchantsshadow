import React, { useState } from 'react';
import { Link2, Check } from 'lucide-react';

const buildInviteUrl = (roomCode) => {
  return window.location.origin + window.location.pathname + '#room-setup?invite=' + roomCode;
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
};

const InviteLink = ({ roomCode, onCopied }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyInvite = async () => {
    if (!roomCode) return;
    const ok = await copyToClipboard(buildInviteUrl(roomCode));
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } else if (onCopied) {
      onCopied();
    }
  };

  return (
    <button
      onClick={handleCopyInvite}
      className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 font-black text-[9px] uppercase tracking-[0.2em] hover:border-red-600/40 hover:text-red-500 hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
    >
      {isCopied ? (
        <>
          <Check size={14} className="text-green-500" /> Link Disalin
        </>
      ) : (
        <>
          <Link2 size={14} /> Invite Link
        </>
      )}
    </button>
  );
};

export default InviteLink;