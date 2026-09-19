import test from 'node:test';
import assert from 'node:assert';
import { calculateWinner } from '../src/utils/winCondition.js';
import { isPlayerWinner } from '../src/utils/playerResult.js';

test('isPlayerWinner evaluates Joker win/loss fate accurately', () => {
  const jokerPlayer = { id: 'j1', role: 'Joker' };
  const wargaPlayer = { id: 'w1', role: 'Hakim' };
  const werewolfPlayer = { id: 'ww1', role: 'Werewolf' };

  // 1. When WARGA wins: Joker LOOSES (DEFEAT)
  assert.strictEqual(isPlayerWinner(jokerPlayer, 'WARGA'), false);
  assert.strictEqual(isPlayerWinner(wargaPlayer, 'WARGA'), true);
  assert.strictEqual(isPlayerWinner(werewolfPlayer, 'WARGA'), false);

  // 2. When SERIGALA wins: Joker LOOSES (DEFEAT)
  assert.strictEqual(isPlayerWinner(jokerPlayer, 'SERIGALA'), false);
  assert.strictEqual(isPlayerWinner(wargaPlayer, 'SERIGALA'), false);
  assert.strictEqual(isPlayerWinner(werewolfPlayer, 'SERIGALA'), true);

  // 3. When JOKER wins (Solo Victory): ONLY Joker wins, both Warga and Werewolf lose
  assert.strictEqual(isPlayerWinner(jokerPlayer, 'JOKER'), true);
  assert.strictEqual(isPlayerWinner(wargaPlayer, 'JOKER'), false);
  assert.strictEqual(isPlayerWinner(werewolfPlayer, 'JOKER'), false);
});

test('WARGA wins when all antagonists are dead', () => {
  const players = [
    { id: '1', role: 'Werewolf', status: 'dead' },
    { id: '2', role: 'Warlock', status: 'dead' },
    { id: '3', role: 'Hakim', status: 'alive' },
    { id: '4', role: 'Pedagang', status: 'alive' },
    { id: 'mod', role: 'Moderator', status: 'alive' }
  ];

  assert.strictEqual(calculateWinner(players), 'WARGA');
});

test('SERIGALA wins when antagonists count >= non-antagonists count', () => {
  const players = [
    { id: '1', role: 'Werewolf', status: 'alive' },
    { id: '2', role: 'Warlock', status: 'alive' },
    { id: '3', role: 'Hakim', status: 'alive' },
    { id: '4', role: 'Pedagang', status: 'dead' },
    { id: 'mod', role: 'Moderator', status: 'alive' }
  ];

  assert.strictEqual(calculateWinner(players), 'SERIGALA');
});

test('Game continues when 1 Werewolf, 1 Warga, 1 Joker are alive (Joker prevents premature Serigala win)', () => {
  const players = [
    { id: '1', role: 'Werewolf', status: 'alive' },
    { id: '2', role: 'Pedagang', status: 'alive' },
    { id: '3', role: 'Joker', status: 'alive' },
    { id: 'mod', role: 'Moderator', status: 'alive' }
  ];

  // Werewolf (1) vs Non-antagonists (2: Pedagang + Joker) -> game must NOT end prematurely
  assert.strictEqual(calculateWinner(players), null);
});

test('SERIGALA wins when only 1 Werewolf and 1 Joker are alive', () => {
  const players = [
    { id: '1', role: 'Werewolf', status: 'alive' },
    { id: '2', role: 'Pedagang', status: 'dead' },
    { id: '3', role: 'Joker', status: 'alive' },
    { id: 'mod', role: 'Moderator', status: 'alive' }
  ];

  // Werewolf (1) vs Non-antagonists (1: Joker) -> 1 >= 1 -> SERIGALA
  assert.strictEqual(calculateWinner(players), 'SERIGALA');
});

test('Lovers team adaptation works correctly for win conditions', () => {
  // Lovers partnered with Werewolf -> Lovers counts as SERIGALA
  const playersWithEvilLover = [
    { id: '1', role: 'Werewolf', status: 'dead' },
    { id: '2', role: 'Lovers', loversTeam: 'SERIGALA', status: 'alive' },
    { id: '3', role: 'Pedagang', status: 'alive' }
  ];
  // 1 Serigala vs 1 Warga -> SERIGALA wins
  assert.strictEqual(calculateWinner(playersWithEvilLover), 'SERIGALA');

  // Lovers partnered with Warga -> Lovers counts as WARGA
  const playersWithGoodLover = [
    { id: '1', role: 'Werewolf', status: 'dead' },
    { id: '2', role: 'Lovers', loversTeam: 'WARGA', status: 'alive' },
    { id: '3', role: 'Pedagang', status: 'alive' }
  ];
  // 0 Serigala vs 2 Warga -> WARGA wins
  assert.strictEqual(calculateWinner(playersWithGoodLover), 'WARGA');
});

test('Unbound Lovers (no partner) is excluded from win counts and always loses', () => {
  // Lovers tanpa loversTeam tidak dihitung → WARGA tetap menang tanpa bantuan mereka
  const players = [
    { id: '1', role: 'Werewolf', status: 'dead' },
    { id: '2', role: 'Lovers', status: 'alive' },
    { id: '3', role: 'Pedagang', status: 'alive' }
  ];
  assert.strictEqual(calculateWinner(players), 'WARGA');

  // Unbound Lovers tidak dihitung sebagai non-antagonis → tidak mencegah SERIGALA menang
  const playersSerigala = [
    { id: '1', role: 'Werewolf', status: 'alive' },
    { id: '2', role: 'Lovers', status: 'alive' },
    { id: '3', role: 'Pedagang', status: 'dead' }
  ];
  assert.strictEqual(calculateWinner(playersSerigala), 'SERIGALA');

  // isPlayerWinner: unbound Lovers selalu kalah, apapun winner-nya
  const unboundLover = { id: '2', role: 'Lovers', status: 'alive' };
  assert.strictEqual(isPlayerWinner(unboundLover, 'WARGA'), false);
  assert.strictEqual(isPlayerWinner(unboundLover, 'SERIGALA'), false);
});
