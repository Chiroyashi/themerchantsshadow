import test from 'node:test';
import assert from 'node:assert';
import { buildDiagnosticRoom, buildDevTakeoverUpdates, devSlotId, DEV_ROLES, isDevPasswordValid } from '../src/utils/devDiagnostics.js';

test('buildDiagnosticRoom mendaftarkan 10 user sesuai role', () => {
  const now = 1_700_000_000_000;
  const { roomData, updates, moderatorSlotId } = buildDiagnosticRoom({
    uid: 'dev-uid',
    matchId: 'dev_match',
    now
  });

  assert.strictEqual(roomData.hostId, 'dev-uid');
  assert.strictEqual(roomData.gameMatchId, 'dev_match');
  assert.strictEqual(roomData.host, 'Moderator');
  assert.deepStrictEqual(roomData.roleSettings, { Moderator: true });
  assert.deepStrictEqual(roomData.members, { 'dev-uid': 'dev_moderator' });
  assert.strictEqual(moderatorSlotId, 'dev_moderator');
  assert.strictEqual(Object.keys(roomData.players).length, 10);

  DEV_ROLES.forEach((role) => {
    const slot = roomData.players[devSlotId(role)];
    assert.strictEqual(slot.name, role);
    assert.strictEqual(slot.role, role);
    assert.strictEqual(slot.authUid, role === 'Moderator' ? 'dev-uid' : `dev_auth_${role.toLowerCase()}`);
  });

  assert.ok(roomData.timer.isActive);
  assert.strictEqual(roomData.timer.phase, 'Pagi (Diskusi)');
  assert.strictEqual(roomData.timer.day, 1);
  assert.strictEqual(roomData.timer.seconds, 60);
  assert.strictEqual(roomData.timer.endsAt, now + 60_000);

  assert.strictEqual(updates.status, 'playing');
  assert.deepStrictEqual(updates.introFinished, { dev_moderator: true });
});

test('buildDiagnosticRoom tanpa Moderator menaruh host di slot Werewolf', () => {
  const now = 1_700_000_000_000;
  const { roomData, updates, hostSlotId, hostRole } = buildDiagnosticRoom({
    uid: 'dev-uid',
    matchId: 'dev_match',
    moderatorEnabled: false,
    now
  });

  assert.strictEqual(hostRole, 'Werewolf');
  assert.strictEqual(hostSlotId, 'dev_werewolf');
  assert.strictEqual(roomData.host, 'Werewolf');
  assert.deepStrictEqual(roomData.roleSettings, { Moderator: false });
  assert.deepStrictEqual(roomData.members, { 'dev-uid': 'dev_werewolf' });
  assert.strictEqual(roomData.players.dev_werewolf.authUid, 'dev-uid');
  assert.strictEqual(roomData.players.dev_moderator.authUid, 'dev_auth_moderator');
  assert.strictEqual(Object.keys(roomData.players).length, 10);
  assert.deepStrictEqual(updates.introFinished, { dev_werewolf: true });
});

test('buildDevTakeoverUpdates menolak role di luar whitelist', () => {
  assert.strictEqual(buildDevTakeoverUpdates({
    roomCode: 'ABC123',
    uid: 'dev-uid',
    role: 'Unknown',
    previousRole: 'Moderator'
  }), null);
  assert.strictEqual(DEV_ROLES.length, 10);
});

test('buildDevTakeoverUpdates memindahkan kendali ke slot role baru', () => {
  const updates = buildDevTakeoverUpdates({
    roomCode: 'ABC123',
    uid: 'dev-uid',
    role: 'Warlock',
    previousRole: 'Moderator'
  });

  assert.strictEqual(updates['rooms/ABC123/members/dev-uid'], 'dev_warlock');
  assert.strictEqual(updates['rooms/ABC123/players/dev_warlock/authUid'], 'dev-uid');
  assert.strictEqual(updates['rooms/ABC123/players/dev_moderator/authUid'], 'dev_auth_moderator');
  assert.strictEqual(updates['rooms/ABC123/roleSettings/Moderator'], false);
  assert.strictEqual(updates['rooms/ABC123/players/dev_warlock/currentAction'], undefined);
  assert.strictEqual(updates['rooms/ABC123/voteResult'], undefined);
});

test('buildDevTakeoverUpdates tidak mereset authUid saat role sama', () => {
  const updates = buildDevTakeoverUpdates({
    roomCode: 'ABC123',
    uid: 'dev-uid',
    role: 'Moderator',
    previousRole: 'Moderator'
  });

  assert.strictEqual(updates['rooms/ABC123/members/dev-uid'], 'dev_moderator');
  assert.strictEqual(updates['rooms/ABC123/players/dev_moderator/authUid'], 'dev-uid');
  assert.strictEqual(updates['rooms/ABC123/roleSettings/Moderator'], true);
  assert.strictEqual(Object.keys(updates).length, 3);
});

test('isDevPasswordValid hanya menerima PW persis', () => {
  assert.strictEqual(isDevPasswordValid('3NT0T'), true);
  assert.strictEqual(isDevPasswordValid('3nt0t'), false);
  assert.strictEqual(isDevPasswordValid('3NT0'), false);
  assert.strictEqual(isDevPasswordValid(' 3NT0T '), false);
  assert.strictEqual(isDevPasswordValid(''), false);
});
