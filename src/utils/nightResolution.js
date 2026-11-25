import { getPlayerTeam } from './roleActions.js';

const WEREWOLF_ROLES = ['Werewolf', 'Warlock'];

export const isWerewolfTarget = (player) =>
  WEREWOLF_ROLES.includes(player?.role) ||
  (player?.role === 'Lovers' && player.loversTeam === 'SERIGALA');

export const resolveHunterShot = (players, hunt, now = Date.now()) => {
  const result = {
    deadIds: [],
    deathCauses: {},
    logs: [],
    hunterResult: null,
    isCorrect: false
  };
  const target = players.find(p => p.id === hunt?.targetId);
  const hunter = players.find(p => p.id === hunt?.playerId);
  if (!target || !hunter || target.status === 'dead' || hunter.status === 'dead') return result;

  const isSerigala = isWerewolfTarget(target);
  result.isCorrect = isSerigala;

  if (!isSerigala) {
    result.deadIds.push(hunt.targetId, hunt.playerId);
    result.deathCauses[hunt.targetId] = 'hunter';
    result.deathCauses[hunt.playerId] = 'hunter_backfire';
    const targetDesc = target.role === 'Joker' ? 'Joker' : 'Warga';
    result.logs.push(`Hunter ${hunt.name} menembak ${targetDesc} ${hunt.targetName} → Keduanya MATI!`);
  } else {
    result.deadIds.push(hunt.targetId);
    result.deathCauses[hunt.targetId] = 'hunter';
    result.logs.push(`Hunter ${hunt.name} menembak Serigala ${hunt.targetName} → Hunter SELAMAT!`);
  }

  result.hunterResult = {
    targetName: target.name,
    targetRole: target.role,
    isCorrect: isSerigala,
    isHost: false,
    timestamp: now
  };
  return result;
};

export const buildPartnerMap = (players) => {
  const partnerMap = {};
  players.forEach(p => {
    if (p.partnerId) partnerMap[p.id] = p.partnerId;
  });
  return partnerMap;
};

export const resolveLoversTeam = (role) => {
  if (role === 'Lovers') return null;
  const team = getPlayerTeam(role);
  return team === 'INDEPENDEN' ? 'JOKER' : team;
};

export const resolveLoversBinds = ({ players, binds = [], roomCode, deadIds = new Set() }) => {
  const updates = {};
  const logs = [];
  const partnerMap = buildPartnerMap(players);

  for (const bind of binds) {
    if (!bind.targetId || partnerMap[bind.playerId] || partnerMap[bind.targetId]) continue;
    const binderAlive = players.some(p => p.id === bind.playerId && p.status !== 'dead' && !deadIds.has(p.id));
    const target = players.find(p => p.id === bind.targetId && p.status !== 'dead' && !deadIds.has(p.id));
    if (!binderAlive || !target) continue;

    updates[`rooms/${roomCode}/players/${bind.playerId}/partnerId`] = bind.targetId;
    updates[`rooms/${roomCode}/players/${bind.playerId}/partnerName`] = target.name;
    updates[`rooms/${roomCode}/players/${bind.targetId}/partnerId`] = bind.playerId;
    updates[`rooms/${roomCode}/players/${bind.targetId}/partnerName`] = bind.name;

    partnerMap[bind.playerId] = bind.targetId;
    partnerMap[bind.targetId] = bind.playerId;

    const loversTeam = resolveLoversTeam(target.role);
    updates[`rooms/${roomCode}/players/${bind.playerId}/loversTeam`] = loversTeam;
    updates[`rooms/${roomCode}/players/${bind.targetId}/loversTeam`] = loversTeam;

    logs.push(`Lovers ${bind.name} telah mengikat takdir cintanya dengan ${target.name}!`);
  }

  return { updates, logs, partnerMap };
};

export const resolveLoversChain = (players, partnerMap, initialDeadIds = []) => {
  const deadIds = new Set(initialDeadIds);
  const deathCauses = {};
  const logs = [];

  let loverDied = true;
  while (loverDied) {
    loverDied = false;
    players.forEach(p => {
      const partnerId = partnerMap[p.id];
      if (partnerId && (p.status === 'dead' || deadIds.has(p.id))) {
        if (!deadIds.has(partnerId)) {
          const partner = players.find(pl => pl.id === partnerId);
          if (partner && partner.status !== 'dead') {
            deadIds.add(partnerId);
            deathCauses[partnerId] = 'lovers';
            logs.push(`Lovers: ${partner.name} gugur patah hati karena pasangannya (${p.name}) tewas.`);
            loverDied = true;
          }
        }
      }
    });
  }

  return { deadIds: [...deadIds], deathCauses, logs };
};

export const resolveHakimTruth = ({ actions = [], roomCode }) => {
  const updates = {};
  const logs = [];
  const truthTargets = {};

  for (const truth of actions.filter(a => a.role === 'Hakim')) {
    if (!truth.targetId) continue;
    truthTargets[truth.targetId] = true;
    logs.push(`Hakim ${truth.name} menggunakan Truth pada ${truth.targetName}`);
  }

  Object.keys(truthTargets).forEach(id => {
    updates[`rooms/${roomCode}/players/${id}/underTruth`] = true;
  });

  return { updates, logs };
};
