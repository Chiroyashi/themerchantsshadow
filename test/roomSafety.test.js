import test from 'node:test';
import assert from 'node:assert';
import { DAY_MS, isRoomAbandoned, normalizeMembers, pickNextHostUid } from '../src/utils/roomSafety.js';
import { buildModeratorToggleUpdates } from '../src/utils/actionPayloads.js';

test('pickNextHostUid chooses the first alive non-moderator member', () => {
  const members = { uid_a: 'p_c', uid_b: 'p_a', uid_host: 'p_mod' };
  const players = {
    p_mod: { role: 'Moderator', status: 'alive' },
    p_a: { role: 'Seer', status: 'alive' },
    p_b: { role: 'Guard', status: 'dead' },
    p_c: { role: 'Hunter', status: 'alive' }
  };

  assert.strictEqual(pickNextHostUid(members, players), 'uid_b');
});

test('pickNextHostUid falls back to player authUid on old rooms', () => {
  const players = {
    p_old: { role: 'Pedagang', status: 'alive', authUid: 'uid_old' }
  };

  assert.strictEqual(normalizeMembers(null, players).uid_old, 'p_old');
  assert.strictEqual(pickNextHostUid(null, players), 'uid_old');
});

test('buildModeratorToggleUpdates uses host player id after transfer', () => {
  const updates = buildModeratorToggleUpdates({
    roomCode: 'ROOM1',
    playerId: 'p_successor',
    playerName: 'Host Baru',
    isEnabled: true
  });

  assert.strictEqual(updates['rooms/ROOM1/roleSettings/Moderator'], true);
  assert.strictEqual(updates['rooms/ROOM1/players/p_successor/role'], 'Moderator');
  assert.strictEqual(updates['rooms/ROOM1/players/p_successor/name'], 'Host Baru (Moderator)');
});

test('isRoomAbandoned needs both old creation and stale activity', () => {
  const now = Date.now();
  const old = now - 8 * DAY_MS;
  const fresh = now - 1000;

  assert.strictEqual(isRoomAbandoned({ createdAt: old, lastActivityAt: fresh }, now), false);
  assert.strictEqual(isRoomAbandoned({ createdAt: old, lastActivityAt: old }, now), true);
  assert.strictEqual(isRoomAbandoned({}, now), false);
});
