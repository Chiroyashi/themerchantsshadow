import { isRoleActive } from './gameLogic.js';

export const calculateRoles = (playerCount, roleSettings) => {
  const count = parseInt(playerCount);

  // Proteksi minimal: Jika di bawah 5, game tidak balance (sesuai distributeRoles)
  if (count < 5) {
    return {
      antagonists: { werewolf: 0, warlock: 0 },
      protagonists: { seer: 0, guard: 0, hakim: 0, hunter: 0, pedagang: 0 },
      total: { antagonistsCount: 0, protagonistsCount: 0 }
    };
  }

  // 1. Hitung Antagonis (Rasio ~1/3.5)
  // Sesuai logika distributeRoles: totalAntagonists = Math.max(1, Math.floor(numPlayers / 3.5))
  const antagonistsCount = Math.max(1, Math.floor(count / 3.5));

  // Distribusi Antagonis: Warlock muncul jika pemain >= 7
  const warlock = isRoleActive('Warlock', roleSettings, count) ? 1 : 0;
  const werewolf = antagonistsCount - warlock;

  // 2. Tentukan Power Roles (Protagonis Spesial)
  // Sesuai prioritas di distributeRoles: Hakim selalu wajib (1)
  const isSeerEnabled = isRoleActive('Seer', roleSettings, count);
  const isGuardEnabled = isRoleActive('Guard', roleSettings, count);
  const isHunterEnabled = isRoleActive('Hunter', roleSettings, count);
  const isLoversEnabled = isRoleActive('Lovers', roleSettings, count);
  const isJokerEnabled = isRoleActive('Joker', roleSettings, count);

  const specialProtagonists = {
    hakim: 1, // Poros utama, selalu ada jika count >= 5
    seer: isSeerEnabled ? 1 : 0,
    guard: isGuardEnabled ? 1 : 0,
    hunter: isHunterEnabled ? 1 : 0,
    lovers: isLoversEnabled ? 1 : 0,
    joker: isJokerEnabled ? 1 : 0,
  };

  const totalSpecial = Object.values(specialProtagonists).reduce((a, b) => a + b, 0);
  const protagonistsCount = count - antagonistsCount;

  // 3. Sisanya adalah Pedagang (Mayoritas); pastikan minimal 1 Pedagang — drop role opsional jika perlu
  let pedagang = protagonistsCount - totalSpecial;
  if (pedagang < 1) {
    for (const key of ['joker', 'lovers', 'hunter']) {
      if (pedagang >= 1) break;
      if (specialProtagonists[key] > 0) {
        specialProtagonists[key] = 0;
        pedagang++;
      }
    }
  }

  return {
    antagonists: { werewolf, warlock },
    protagonists: { ...specialProtagonists, pedagang },
    total: { antagonistsCount, protagonistsCount }
  };
};