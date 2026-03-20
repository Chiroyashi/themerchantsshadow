/**
 * src/utils/gameLogic.js
 * Logika pembagian peran "The Merchant's Shadow" - Versi Balanced
 * Fokus: Hakim, Werewolf, dan Pedagang sebagai pilar utama.
 */

export const distributeRoles = (players) => {
  // 1. Filter Moderator (Moderator tidak ikut mendapatkan peran permainan)
  let participants = players.filter(p => p.role !== 'Moderator');
  const numPlayers = participants.length;

  // Proteksi minimal pemain agar mekanisme "The Merchant's Shadow" berjalan
  if (numPlayers < 5) return players;

  // 2. Tentukan Tiga Peran Wajib (The Core Trinity)
  // Hakim sebagai poros, Werewolf sebagai ancaman, Pedagang sebagai mayoritas/kamuflase
  let rolePool = ['Hakim', 'Werewolf', 'Pedagang'];

  // 3. Tentukan Jumlah Antagonis (Rasio ~1/3.5 dari total pemain)
  const totalAntagonists = Math.max(1, Math.floor(numPlayers / 3.5));
  
  // Tambahkan Warlock jika pemain cukup banyak (>= 7) agar transaksi berjalan
  if (numPlayers >= 7) {
    rolePool.push('Warlock');
  }

  // Isi sisa slot Antagonis dengan Werewolf tambahan sampai mencapai rasio
  while (rolePool.filter(r => r === 'Werewolf' || r === 'Warlock').length < totalAntagonists) {
    rolePool.push('Werewolf');
  }

  // 4. Tambahkan Peran Spesial Protagonis (Berdasarkan Prioritas)
  const specialProtagonists = ['Seer', 'Guard', 'Hunter'];
  specialProtagonists.forEach(role => {
    if (rolePool.length < numPlayers) {
      rolePool.push(role);
    }
  });

  // 5. Penuhi Sisa Slot dengan Pedagang (Pedagang adalah mayoritas dalam game ini)
  while (rolePool.length < numPlayers) {
    rolePool.push('Pedagang');
  }

  // 6. Acak Daftar Peran (Fisher-Yates Shuffle)
  const shuffledRoles = [...rolePool];
  for (let i = shuffledRoles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
  }

  // 7. Mapping Peran ke Pemain & Inisialisasi State Awal
  return participants.map((player, index) => ({
    ...player,
    role: shuffledRoles[index],
    status: 'alive',
    inventory: null,
    lastActedDay: null,
    underTruth: false // Reset state untuk Kuasa Hakim
  }));
};