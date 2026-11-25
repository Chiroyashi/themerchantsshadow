import test from 'node:test';
import assert from 'node:assert';
import { buildMerchantClue, clueDismissKey, pickSystemClueRecipient } from '../src/utils/merchantClue.js';

const players = () => [
  { id: 'w', name: 'Warloc', role: 'Warlock', status: 'alive' },
  { id: 'a', name: 'Ana', role: 'Pedagang', status: 'alive' },
  { id: 'b', name: 'Budi', role: 'Hakim', status: 'alive' },
  { id: 'c', name: 'Cici', role: 'Seer', status: 'alive' },
  { id: 'd', name: 'Dedi', role: 'Werewolf', status: 'dead' },
  { id: 'm', name: 'Moderator', role: 'Moderator', status: 'alive' }
];

test('clue berisi Warlock plus dua tersangka hidup lain tanpa duplikat', () => {
  const clue = buildMerchantClue(players(), () => 0);
  assert.strictEqual(clue.suspects.length, 3);
  assert.strictEqual(new Set(clue.suspects).size, 3);
  assert.ok(clue.suspects.includes('Warloc'));
  assert.ok(!clue.suspects.includes('Dedi'));
  assert.ok(!clue.suspects.includes('Moderator'));
  assert.match(clue.message, /Salah satu dari/);
});

test('helper sistem hanya memilih Pedagang hidup yang belum punya clue', () => {
  const pool = [
    { id: 'p1', name: 'Ana', role: 'Pedagang', status: 'alive' },
    { id: 'p2', name: 'Budi', role: 'Pedagang', status: 'alive' },
    { id: 'p3', name: 'Cici', role: 'Pedagang', status: 'dead' },
    { id: 'w', name: 'Warloc', role: 'Warlock', status: 'alive' }
  ];

  assert.strictEqual(pickSystemClueRecipient(pool, { p1: { day: 1 } }, () => 0).id, 'p2');
});

test('helper sistem null saat semua Pedagang hidup sudah punya clue', () => {
  const pool = [
    { id: 'p1', name: 'Ana', role: 'Pedagang', status: 'alive' },
    { id: 'p2', name: 'Budi', role: 'Pedagang', status: 'alive' },
    { id: 'p3', name: 'Cici', role: 'Pedagang', status: 'dead' }
  ];

  assert.strictEqual(pickSystemClueRecipient(pool, { p1: {}, p2: {} }), null);
});

test('clueDismissKey membedakan clue berdasarkan transactionKey', () => {
  const first = clueDismissKey('ROOM1', { transactionKey: 'tx1', day: 2 });
  const second = clueDismissKey('ROOM1', { transactionKey: 'tx2', day: 2 });

  assert.notStrictEqual(first, second);
  assert.strictEqual(clueDismissKey('ROOM1', { transactionKey: 'tx1' }), first);
});

test('clueDismissKey fallback ke timestamp lalu day', () => {
  assert.strictEqual(clueDismissKey('ROOM1', { timestamp: 99, day: 3 }), 'dismissed_clue_ROOM1_99');
  assert.strictEqual(clueDismissKey('ROOM1', { day: 3 }), 'dismissed_clue_ROOM1_3');
});

test('clue mengembalikan null jika tidak ada Warlock hidup', () => {
  const noWarlock = players().map(p => p.id === 'w' ? { ...p, status: 'dead' } : p);
  assert.strictEqual(buildMerchantClue(noWarlock), null);
});
