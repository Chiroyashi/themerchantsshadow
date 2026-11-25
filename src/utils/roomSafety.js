export const DAY_MS = 24 * 60 * 60 * 1000;
export const CLEANUP_DAYS = 7;

export function normalizeMembers(members, players = {}) {
  if (members && Object.keys(members).length > 0) return members;

  return Object.entries(players).reduce((acc, [playerId, player]) => {
    if (player && player.authUid) acc[player.authUid] = playerId;
    return acc;
  }, {});
}

export function pickNextHostUid(members, players = {}) {
  const normalized = normalizeMembers(members, players);

  return Object.entries(normalized)
    .map(([uid, playerId]) => ({ uid, playerId }))
    .filter(({ playerId }) => {
      const player = players[playerId];
      return player && player.status !== 'dead' && player.role !== 'Moderator';
    })
    .sort((a, b) => String(a.playerId).localeCompare(String(b.playerId)))[0]?.uid || null;
}

export function isRoomAbandoned(room, now = Date.now()) {
  const createdAt = room?.createdAt || room?.introStartedAt || 0;
  if (!createdAt) return false;

  const lastActivityAt = room?.lastActivityAt || createdAt;
  return now - createdAt > CLEANUP_DAYS * DAY_MS && now - lastActivityAt > DAY_MS;
}

export function canCleanupRoom(room, uid, now = Date.now()) {
  return Boolean(uid) && room?.hostId === uid && isRoomAbandoned(room, now);
}
