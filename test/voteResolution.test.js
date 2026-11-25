import test from 'node:test';
import assert from 'node:assert';
import { buildJokerVoteUpdates } from '../src/utils/voteResolution.js';

test('buildJokerVoteUpdates keeps Joker and partner alive, kills other players', () => {
  const timestamp = 123456789;
  const players = [
    { id: 'joker', role: 'Joker', name: 'Si Joker', status: 'alive', partnerId: 'lover' },
    { id: 'lover', role: 'Lovers', name: 'Si Kekasih', status: 'alive', partnerId: 'joker', loversTeam: 'JOKER' },
    { id: 'ww', role: 'Werewolf', name: 'Serigala', status: 'alive' },
    { id: 'warga', role: 'Seer', name: 'Warga', status: 'alive' },
    { id: 'mod', role: 'Moderator', name: 'Moderator', status: 'alive' }
  ];

  const updates = buildJokerVoteUpdates({
    roomCode: 'ROOM1',
    players,
    executedId: 'joker',
    day: 3,
    timestamp
  });

  assert.strictEqual(updates['rooms/ROOM1/players/joker/status'], 'alive');
  assert.strictEqual(updates['rooms/ROOM1/players/lover/status'], 'alive');
  assert.strictEqual(updates['rooms/ROOM1/players/ww/status'], 'dead');
  assert.strictEqual(updates['rooms/ROOM1/players/warga/status'], 'dead');
  assert.strictEqual(updates['rooms/ROOM1/players/mod/status'], undefined);
  assert.deepStrictEqual(updates['rooms/ROOM1/voteResult'], {
    day: 3,
    names: ['Si Joker'],
    executedId: 'joker',
    isJoker: true,
    timestamp
  });
  assert.strictEqual(updates['rooms/ROOM1/status'], 'ended');
  assert.strictEqual(updates['rooms/ROOM1/winner'], 'JOKER');
  assert.strictEqual(updates['rooms/ROOM1/endedAt'], timestamp);
});

test('buildJokerVoteUpdates ignores non-Joker executions and missing rooms', () => {
  const players = [{ id: 'ww', role: 'Werewolf', name: 'Serigala', status: 'alive' }];

  assert.deepStrictEqual(buildJokerVoteUpdates({ roomCode: 'ROOM1', players, executedId: 'ww' }), {});
  assert.deepStrictEqual(buildJokerVoteUpdates({ executedId: 'joker', players }), {});
});
