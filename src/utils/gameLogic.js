/**
 * src/utils/gameLogic.js
 * Logika pembagian peran "The Merchant's Shadow" - Versi Balanced
 * Fokus: Hakim, Werewolf, dan Pedagang sebagai pilar utama.
 */

export const isRoleActive = (roleName, settings, count) => {
  const userSetting = settings?.[roleName];
  if (userSetting !== undefined) return userSetting;

  if (roleName === 'Seer') return count >= 5;
  if (roleName === 'Guard') return count >= 6;
  if (roleName === 'Hunter') return count >= 8;
  if (roleName === 'Warlock') return count >= 7;
  if (roleName === 'Lovers') return count >= 5;
  if (roleName === 'Joker') return count >= 6;
  return true;
};

export const distributeRoles = (players, roleSettings) => {
  // 1. Filter Moderator (Moderator tidak ikut mendapatkan peran permainan)
  let participants = players.filter(p => p.role !== 'Moderator');
  const numPlayers = participants.length;

  // Proteksi minimal pemain agar mekanisme "The Merchant's Shadow" berjalan
  if (numPlayers < 5) return players;

  // 2. Tentukan Jumlah Antagonis (Rasio ~1/3.5 dari total pemain)
  const totalAntagonists = Math.max(1, Math.floor(numPlayers / 3.5));
  const isWarlockEnabled = isRoleActive('Warlock', roleSettings, numPlayers);
  const warlockCount = (numPlayers >= 7 && isWarlockEnabled) ? 1 : 0;
  const werewolfCount = totalAntagonists - warlockCount;

  let rolePool = [];

  // Tambahkan Antagonis
  for (let i = 0; i < werewolfCount; i++) {
    rolePool.push('Werewolf');
  }
  for (let i = 0; i < warlockCount; i++) {
    rolePool.push('Warlock');
  }

  // Tambahkan Peran Spesial Protagonis
  rolePool.push('Hakim'); // Selalu wajib ada
  if (isRoleActive('Seer', roleSettings, numPlayers)) {
    rolePool.push('Seer');
  }
  if (numPlayers >= 6 && isRoleActive('Guard', roleSettings, numPlayers)) {
    rolePool.push('Guard');
  }
  if (numPlayers >= 8 && isRoleActive('Hunter', roleSettings, numPlayers)) {
    rolePool.push('Hunter');
  }
  if (isRoleActive('Lovers', roleSettings, numPlayers)) {
    rolePool.push('Lovers');
  }
  if (numPlayers >= 6 && isRoleActive('Joker', roleSettings, numPlayers)) {
    rolePool.push('Joker');
  }

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
    underTruth: false, // Reset state untuk Kuasa Hakim
    partnerId: null,
    partnerName: null,
    loversTeam: null
  }));
};