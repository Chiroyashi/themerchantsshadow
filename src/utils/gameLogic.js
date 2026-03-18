// src/utils/gameLogic.js
import { calculateRoles } from './roleBalancer';

export const distributeRoles = (playerList) => {
  // 1. Filter Moderator (Moderator tidak ikut diacak rolenya)
  const playersToAssign = playerList.filter(p => p.role !== 'Moderator');
  const count = playersToAssign.length;

  // 2. Dapatkan komposisi role yang balance berdasarkan jumlah pemain saat ini
  const config = calculateRoles(count);
  
  // 3. Masukkan role yang terpilih ke dalam pool
  let availableRoles = [];
  
  // Antagonis
  for (let i = 0; i < config.antagonists.werewolf; i++) availableRoles.push("Werewolf");
  for (let i = 0; i < config.antagonists.warlock; i++) availableRoles.push("Warlock");
  
  // Protagonis Spesial
  if (config.protagonists.seer) availableRoles.push("Seer");
  if (config.protagonists.guard) availableRoles.push("Guard");
  if (config.protagonists.hakim) availableRoles.push("Hakim");
  if (config.protagonists.hunter) availableRoles.push("Hunter");
  
  // Sisanya isi dengan Pedagang
  const remaining = count - availableRoles.length;
  for (let i = 0; i < remaining; i++) availableRoles.push("Pedagang");

  // 4. Fisher-Yates Shuffle (Logic yang kamu berikan)
  for (let i = availableRoles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableRoles[i], availableRoles[j]] = [availableRoles[j], availableRoles[i]];
  }

  // 5. Pasangkan ke pemain
  return playersToAssign.map((player, index) => ({
    ...player,
    role: availableRoles[index]
  }));
};