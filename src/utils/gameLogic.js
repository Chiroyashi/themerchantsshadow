import { TEAM_SERIGALA, TEAM_WARGA } from '../constants/roles';

export const distributeRoles = (playerList) => {
  // 1. Kumpulkan semua role yang tersedia dalam satu array
  let availableRoles = [];
  TEAM_SERIGALA.forEach(r => {
    for(let i=0; i<r.count; i++) availableRoles.push(r.name);
  });
  TEAM_WARGA.forEach(r => {
    for(let i=0; i<r.count; i++) availableRoles.push(r.name);
  });

  // 2. Acak urutan role (Fisher-Yates Shuffle)
  for (let i = availableRoles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableRoles[i], availableRoles[j]] = [availableRoles[j], availableRoles[i]];
  }

  // 3. Pasangkan ke pemain (Kecuali Moderator jika Akbar ingin jadi penonton saja)
  return playerList.map((player, index) => ({
    ...player,
    role: availableRoles[index] || "Warga Sipil" // Fallback jika pemain > 18
  }));
};