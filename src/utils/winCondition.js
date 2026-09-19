import { ref, get, update } from "firebase/database";
import { db } from "../lib/firebase.js";

/**
 * Kalkulasi kondisi kemenangan murni dari daftar pemain (pure function).
 *
 * WARGA menang → semua Serigala (Werewolf + Warlock + Lovers faksi serigala) mati
 * SERIGALA menang → jumlah Serigala >= pemain non-serigala yang tersisa
 */
export const calculateWinner = (players) => {
  if (!players || !Array.isArray(players)) return null;

  // Moderator tidak dihitung sebagai pemain
  const alive = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator');

  const getPlayerFaksi = (p) => {
    if (p.role === 'Lovers') {
      return p.loversTeam || null;
    }
    if (p.role === 'Joker') {
      return 'JOKER';
    }
    const antagonistRoles = ['Werewolf', 'Warlock'];
    return antagonistRoles.includes(p.role) ? 'SERIGALA' : 'WARGA';
  };

  const antagonists = alive.filter(p => getPlayerFaksi(p) === 'SERIGALA');
  const nonAntagonists = alive.filter(p => {
    const faksi = getPlayerFaksi(p);
    return faksi && faksi !== 'SERIGALA';
  });

  if (antagonists.length === 0) {
    return 'WARGA';
  } else if (antagonists.length >= nonAntagonists.length) {
    return 'SERIGALA';
  }

  return null;
};

/**
 * Cek kondisi kemenangan setiap kali ada pemain mati.
 *
 * Baca langsung dari Firebase (data fresh), tidak bergantung state client.
 */
export const checkWinCondition = async (roomCode) => {
  if (!roomCode) return null;

  const snap = await get(ref(db, `rooms/${roomCode}/players`));
  if (!snap.exists()) return null;

  const players = Object.values(snap.val());
  const winner = calculateWinner(players);

  if (winner) {
    await update(ref(db), {
      [`rooms/${roomCode}/status`]: 'ended',
      [`rooms/${roomCode}/winner`]: winner,
      [`rooms/${roomCode}/endedAt`]: Date.now()
    });
  }

  return winner;
};
