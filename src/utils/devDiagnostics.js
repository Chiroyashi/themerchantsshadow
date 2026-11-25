import { DEV_ROLES } from '../constants/roles.js';
import { PHASE } from '../constants/phases.js';
import { getPhaseDuration } from './timer.js';

export { DEV_ROLES };

export const DEV_PASSWORD = '3NT0T';
export const isDevPasswordValid = (value) => value === DEV_PASSWORD;

export const devSlotId = (role) => `dev_${role.toLowerCase()}`;

const devDummyAuth = (role) => `dev_auth_${role.toLowerCase()}`;
const MODERATOR_SLOT_ID = devSlotId('Moderator');

export function buildDiagnosticRoom({ uid, matchId, moderatorEnabled = true, now = Date.now() }) {
  const hostRole = moderatorEnabled ? 'Moderator' : DEV_ROLES.find(role => role !== 'Moderator');
  const hostSlotIdValue = devSlotId(hostRole);
  const players = {};
  DEV_ROLES.forEach((role) => {
    players[devSlotId(role)] = {
      name: role,
      role,
      status: 'alive',
      authUid: role === hostRole ? uid : devDummyAuth(role),
      joinedAt: now
    };
  });

  const duration = getPhaseDuration(PHASE.PAGI, 1);
  return {
    roomData: {
      gameMatchId: matchId,
      hostId: uid,
      status: 'waiting',
      host: hostRole,
      roleSettings: { Moderator: moderatorEnabled },
      createdAt: now,
      lastActivityAt: now,
      members: { [uid]: hostSlotIdValue },
      timer: {
        phase: PHASE.PAGI,
        day: 1,
        seconds: duration,
        isActive: true,
        endsAt: now + duration * 1000,
        allVoted: false
      },
      players
    },
    updates: {
      status: 'playing',
      introStartedAt: now,
      introFinished: { [hostSlotIdValue]: true },
      lastActivityAt: now
    },
    moderatorSlotId: MODERATOR_SLOT_ID,
    hostSlotId: hostSlotIdValue,
    hostRole,
    playersWithRoles: DEV_ROLES
  };
}

export function buildDevTakeoverUpdates({ roomCode, uid, role, previousRole }) {
  if (!DEV_ROLES.includes(role)) return null;
  const updates = {
    [`rooms/${roomCode}/members/${uid}`]: devSlotId(role),
    [`rooms/${roomCode}/players/${devSlotId(role)}/authUid`]: uid,
    [`rooms/${roomCode}/roleSettings/Moderator`]: role === 'Moderator'
  };
  if (previousRole && DEV_ROLES.includes(previousRole) && previousRole !== role) {
    updates[`rooms/${roomCode}/players/${devSlotId(previousRole)}/authUid`] = devDummyAuth(previousRole);
  }
  return updates;
}
