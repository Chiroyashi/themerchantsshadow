/**
 * src/utils/roleActions.js
 * Role Action Handlers untuk The Merchant's Shadow
 * Mengatur availability dan logika action per role per malam
 */

import { isPagi, isSiang } from '../constants/phases';

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
      // Guard: usage-based cooldown — pakai → cooldown 2 malam → siap lagi
      // Proteksi bertahan 2 malam
      const lastGuardDay = roleState.lastProtectedDay || 0;
      const isGuardCooldown = lastGuardDay > 0 && currentDay < lastGuardDay + 3;

      if (!isGuardCooldown && !hasActed) {
        config.canAct = true;
        config.actionType = 'protect';
        config.reason = hasActed ? "Action sudah dilakukan." : "Pilih 1 pemain untuk dilindungi.";
        config.maxUses = 1;
        config.skillName = 'Protect';
      } else if (isGuardCooldown) {
        const siapMalam = lastGuardDay + 3;
        config.canAct = false;
        config.actionType = null;
        config.reason = `Guard cooldown. Protection aktif kembali malam ${siapMalam}.`;
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
      const isDay = isPagi(roleState.currentPhase) || isSiang(roleState.currentPhase);

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
      const warlockActed = roleState.warlockActed;

      if (!phase?.includes('Malam')) {
        config.canAct = false;
        config.reason = "Warlock action hanya di malam.";
        break;
      }

      if (hasSkipped) {
        config.canAct = false;
        config.reason = "Warlock sudah Skip. Action tertutup selamanya.";
        config.skillName = 'Warlock';
        break;
      }

      if (warlockActed) {
        config.canAct = false;
        config.reason = "Action sudah dilakukan malam ini.";
        config.skillName = 'Warlock';
        break;
      }

      if (isNight1) {
        // Malam 1: WAJIB Beli (Vision/Poison) atau Skip
        config.canAct = true;
        config.actionType = 'warlock-buy';
        config.reason = "MALAM PERTAMA: BELI Vision/Poison atau SKIP.";
        config.maxUses = 1;
        config.skillName = 'Warlock';
        break;
      }

      // Malam 2+:
      if (warlockItem && !itemUsedThisNight) {
        // Punya item yang belum dipakai → WAJIB Use
        config.canAct = true;
        config.actionType = 'warlock-use';
        config.reason = `GUNAKAN ${warlockItem.toUpperCase()} (1x pakai).`;
        config.maxUses = 1;
        config.skillName = 'Warlock';
        break;
      }

      // Tidak punya item, atau item sudah dipakai → BELI
      config.canAct = true;
      config.actionType = 'warlock-buy';
      config.reason = warlockItem
        ? "Item sudah dipakai. BELI item baru."
        : "BELI Vision atau Poison.";
      config.maxUses = 1;
      config.skillName = 'Warlock';
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
      const lastGuard = playerState.lastProtectedDay || 0;
      return lastGuard === 0 || currentDay >= lastGuard + 3;
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
