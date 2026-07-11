/**
 * src/utils/roleActions.js
 * Role Action Handlers untuk The Merchant's Shadow
 * Mengatur availability dan logika action per role per malam
 */

export const getPlayerTeam = (role) => {
  const SERIGALA = ['Werewolf', 'Warlock'];
  const WARGA = ['Seer', 'Guard', 'Hakim', 'Hunter', 'Pedagang'];

  if (SERIGALA.includes(role)) return 'SERIGALA';
  if (WARGA.includes(role)) return 'WARGA';
  return 'INDEPENDEN';
};

export const isTargetSameTeam = (attackerRole, targetRole) => {
  return getPlayerTeam(attackerRole) === getPlayerTeam(targetRole);
};

export const getRoleActionConfig = (role, currentDay, totalPlayers, roleState = {}) => {
  const hasActed = roleState.hasActed || false;
  const isHakim = role === 'Hakim';

  const config = {
    canAct: false,
    actionType: null,
    reason: "",
    maxUses: Infinity,
    skillName: null,
    phaseType: 'night',
    isConfirmed: hasActed && !isHakim
  };

  const isNight1 = currentDay === 1;
  const isNight2OrMore = currentDay >= 2;

  switch (role) {
    case 'Pedagang':
      config.canAct = false;
      config.actionType = null;
      config.reason = "Pedagang tidak memiliki action.";
      config.maxUses = 0;
      break;

    case 'Seer':
      if (isNight1) {
        config.canAct = !hasActed;
        config.actionType = 'reveal';
        config.reason = hasActed ? "Action sudah dilakukan." : "Malam pertama! Pilih target untuk melihat role aslinya.";
        config.maxUses = 1;
        config.skillName = 'Reveal';
      } else {
        config.canAct = !hasActed;
        config.actionType = 'reveal';
        config.reason = hasActed ? "Action sudah dilakukan." : "Pilih target untuk melihat role aslinya.";
        config.skillName = 'Reveal';
      }
      break;

    case 'Guard':
      // Guard aktif malam 1, lalu cooldown 1 malam (aktif setiap 2 malam: 1, 3, 5, ...)
      // Proteksi bertahan 2 malam
      if (isNight1) {
        config.canAct = !hasActed;
        config.actionType = 'protect';
        config.reason = hasActed ? "Action sudah dilakukan." : "Malam pertama! Pilih 1 pemain untuk dilindungi.";
        config.maxUses = 1;
        config.skillName = 'Protect';
      } else if ((currentDay - 1) % 2 === 0) {
        // Malam ganjil (3, 5, 7) — bisa protek
        config.canAct = !hasActed;
        config.actionType = 'protect';
        config.reason = hasActed ? "Action sudah dilakukan." : "Malam ini Protection aktif! Pilih 1 pemain.";
        config.maxUses = 1;
        config.skillName = 'Protect';
      } else {
        // Malam genap (2, 4, 6) — cooldown
        config.canAct = false;
        config.actionType = null;
        config.reason = `Guard cooldown. Protection aktif malam ${currentDay + 1}.`;
      }
      break;

    case 'Werewolf':
      if (isNight1) {
        config.canAct = false;
        config.actionType = null;
        config.reason = "Werewolf belum dapat action. Malam pertama tidak ada pembunuhan.";
      } else if (hasActed) {
        config.canAct = false;
        config.actionType = 'kill';
        config.reason = "Action sudah dilakukan.";
        config.skillName = 'Kill';
      } else {
        config.canAct = true;
        config.actionType = 'kill';
        config.reason = "Pilih target untuk dibunuh malam ini.";
        config.maxUses = Infinity;
        config.skillName = 'Kill';
      }
      break;

    case 'Hakim':
      // Hakim punya 2 skill: Truth (malam) + Pistol (siang)
      const isDay = roleState.currentPhase?.toLowerCase().includes("pagi") ||
                    roleState.currentPhase?.toLowerCase().includes("siang") ||
                    roleState.currentPhase?.toLowerCase().includes("diskusi");

      if (isDay) {
        // SIANG: Pistol — 2 peluru sepanjang game
        const pistolUsed = roleState.pistolUsedCount || 0;
        const pistolRemaining = Math.max(0, 2 - pistolUsed);

        if (pistolRemaining <= 0) {
          config.canAct = false;
          config.actionType = null;
          config.reason = "Pistol sudah habis digunakan.";
          config.skillName = 'Pistol';
        } else if (roleState.pistolActed) {
          config.canAct = false;
          config.actionType = 'pistol';
          config.reason = "Pistol sudah digunakan hari ini.";
          config.skillName = 'Pistol';
        } else {
          config.canAct = true;
          config.actionType = 'pistol';
          config.reason = `SIANG HARI: Gunakan Pistol (${pistolRemaining} peluru tersisa).`;
          config.maxUses = pistolRemaining;
          config.skillName = 'Pistol';
          config.phaseType = 'day';
        }
      } else {
        // MALAM: Truth — 1x per malam
        if (roleState.truthActed) {
          config.canAct = false;
          config.actionType = 'truth';
          config.reason = "Truth sudah digunakan malam ini.";
          config.skillName = 'Truth';
        } else {
          config.canAct = true;
          config.actionType = 'truth';
          config.reason = "MALAM: Pilih target untuk dibocorkan chat pribadinya (Truth).";
          config.maxUses = 1;
          config.skillName = 'Truth';
          config.phaseType = 'night';
        }
      }
      config.isConfirmed = false;
      break;

    case 'Hunter':
      if (isNight1) {
        config.canAct = false;
        config.actionType = null;
        config.reason = "Hunter belum dapat action. Mulai malam ke-2.";
      } else if (hasActed || roleState.hunterActed) {
        config.canAct = false;
        config.actionType = 'hunt';
        config.reason = "Hunter sudah menggunakan skill.";
        config.skillName = 'Hunt';
      } else {
        config.canAct = true;
        config.actionType = 'hunt';
        config.reason = "Pilih target: Jika Warga→kamu Juga Mati, Jika Serigala→kamu Selamat.";
        config.maxUses = 1;
        config.skillName = 'Hunt';
      }
      break;

    case 'Warlock':
      const warlockItem = roleState.warlockInventory;
      const hasSkipped = roleState.warlockSkipped;
      const itemUsedThisNight = roleState.warlockItemUsed;
      const phase = roleState.currentPhase;
      // warlockActed = sudah action malam ini (baik beli maupun pakai)
      const warlockActed = roleState.warlockActed;

      if (phase === 'Malam (Eksekusi)' || phase?.includes('Malam')) {
        if (hasSkipped) {
          config.canAct = false;
          config.actionType = null;
          config.reason = "Warlock sudah Skip. Action tertutup selamanya.";
          config.skillName = 'Warlock';
        } else if (warlockActed) {
          config.canAct = false;
          config.actionType = 'warlock';
          config.reason = "Action sudah dilakukan malam ini.";
          config.skillName = 'Warlock';
        } else if (isNight1) {
          // Malam 1: WAJIB Beli item (Vision/Poison) atau Skip
          config.canAct = true;
          config.actionType = 'warlock-buy';
          config.reason = "MALAM PERTAMA: BELI Vision/Poison atau SKIP.";
          config.maxUses = 1;
          config.skillName = 'Warlock';
        } else if (warlockItem && !itemUsedThisNight) {
          // Ada item yang BELUM dipakai → ACTION
          config.canAct = true;
          config.actionType = 'warlock-use';
          config.reason = `GUNAKAN ${warlockItem.toUpperCase()} (1x pakai).`;
          config.maxUses = 1;
          config.skillName = 'Warlock';
        } else if (itemUsedThisNight) {
          // Sudah pakai item malam ini → BELI item baru (zigzag)
          config.canAct = true;
          config.actionType = 'warlock-buy';
          config.reason = "Item sudah dipakai. BELI item baru.";
          config.maxUses = 1;
          config.skillName = 'Warlock';
        } else if (warlockItem && itemUsedThisNight) {
          // Punya item tapi sudah dipakai → beli baru
          config.canAct = true;
          config.actionType = 'warlock-buy';
          config.reason = "Item sudah dipakai malam sebelumnya. BELI item baru.";
          config.maxUses = 1;
          config.skillName = 'Warlock';
        } else {
          // Tidak punya item (setelah skip atau baru) → BELI
          config.canAct = true;
          config.actionType = 'warlock-buy';
          config.reason = "BELI Vision atau Poison.";
          config.maxUses = 1;
          config.skillName = 'Warlock';
        }
      } else {
        config.canAct = false;
        config.reason = "Warlock action hanya di malam.";
      }
      break;

    case 'Moderator':
      config.canAct = false;
      config.actionType = null;
      config.reason = "Moderator tidak memiliki action malam.";
      config.maxUses = 0;
      break;

    default:
      config.canAct = false;
      config.reason = "Role tidak dikenal.";
  }

  return config;
};

export const checkRoleCanUseSkill = (role, skillUsed, currentDay, totalPlayers) => {
  const config = getRoleActionConfig(role, currentDay, totalPlayers);
  return config.canAct;
};

export const checkNightOneRestriction = (currentDay) => {
  return currentDay === 1;
};

export const getHakimTruthCount = (totalPlayers) => {
  return 1; // 1x per malam (unlimited malam)
};

export const selectRandomPedagang = (players) => {
  const alivePedagang = players.filter(p => p.role === 'Pedagang' && p.status !== 'dead');
  if (alivePedagang.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * alivePedagang.length);
  return alivePedagang[randomIndex];
};

export const canRoleActTonight = (role, currentDay, playerState = {}) => {
  const hasActed = playerState.hasActed || false;
  const isNight1 = currentDay === 1;
  const isNight2OrMore = currentDay >= 2;

  switch (role) {
    case 'Pedagang':
      return false;
    case 'Seer':
      return !hasActed;
    case 'Guard':
      if (isNight1) return !hasActed;
      return (currentDay - 1) % 2 === 0 && !hasActed;
    case 'Werewolf':
      return isNight2OrMore && !hasActed;
    case 'Hakim':
      // Hakim selalu bisa — tergantung phase (Truth malam / Pistol siang)
      return true;
    case 'Hunter':
      return isNight2OrMore && !playerState.hunterActed && !hasActed;
    case 'Warlock':
      if (playerState.warlockSkipped) return false;
      return !hasActed;
    default:
      return false;
  }
};
