import { ref, get, update } from "firebase/database";
import { db } from "../lib/firebase";

/**
 * Cek kondisi kemenangan setiap kali ada pemain mati.
 *
 * WARGA menang → semua Werewolf + Warlock mati
 * SERIGALA menang → jumlah Werewolf + Warlock >= warga tersisa
 *
 * Baca langsung dari Firebase (data fresh), tidak bergantung state client.
 */
export const checkWinCondition = async (roomCode) => {
  if (!roomCode) return null;

  const snap = await get(ref(db, `rooms/${roomCode}/players`));
  if (!snap.exists()) return null;

  const players = Object.values(snap.val());
  // Moderator tidak dihitung sebagai pemain
  const alive = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator');

  const getPlayerFaksi = (p) => {
    if (p.role === 'Lovers') {
      return p.loversTeam || 'WARGA';
    }
    if (p.role === 'Joker') {
      return 'JOKER';
    }
    const antagonistRoles = ['Werewolf', 'Warlock'];
    return antagonistRoles.includes(p.role) ? 'SERIGALA' : 'WARGA';
  };

  const antagonists = alive.filter(p => getPlayerFaksi(p) === 'SERIGALA');
  const protagonists = alive.filter(p => getPlayerFaksi(p) === 'WARGA');

  let winner = null;
  if (antagonists.length === 0) {
    winner = 'WARGA';
  } else if (antagonists.length >= protagonists.length) {
    winner = 'SERIGALA';
  }

  if (winner) {
    await update(ref(db), {
      [`rooms/${roomCode}/status`]: 'ended',
      [`rooms/${roomCode}/winner`]: winner,
      [`rooms/${roomCode}/endedAt`]: Date.now()
    });
  }

  return winner;
};
