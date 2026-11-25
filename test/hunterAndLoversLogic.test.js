import test from 'node:test';
import assert from 'node:assert';
import {
  resolveHunterShot,
  resolveLoversBinds,
  resolveLoversChain
} from '../src/utils/nightResolution.js';

const resolveChain = (players, newBinds, initialDeadIds) => {
  const { partnerMap } = resolveLoversBinds({ players, binds: newBinds, roomCode: 'TEST' });
  return resolveLoversChain(players, partnerMap, initialDeadIds);
};

test('Hunter shooting Werewolf: Hunter lives, Werewolf dies', () => {
  const players = [
    { id: 'hunter1', name: 'Pak Hunter', role: 'Hunter', status: 'alive' },
    { id: 'ww1', name: 'Serigala Malam', role: 'Werewolf', status: 'alive' }
  ];

  const result = resolveHunterShot(players, {
    playerId: 'hunter1',
    name: 'Pak Hunter',
    targetId: 'ww1',
    targetName: 'Serigala Malam'
  });

  assert.deepStrictEqual(result.deadIds, ['ww1']);
  assert.strictEqual(result.deathCauses['ww1'], 'hunter');
  assert.strictEqual(result.isCorrect, true);
  assert.ok(result.logs[0].includes('Hunter SELAMAT!'));
});

test('Hunter shooting Warga: both Hunter and target die', () => {
  const players = [
    { id: 'hunter1', name: 'Pak Hunter', role: 'Hunter', status: 'alive' },
    { id: 'pedagang1', name: 'Pak Pedagang', role: 'Pedagang', status: 'alive' }
  ];

  const result = resolveHunterShot(players, {
    playerId: 'hunter1',
    name: 'Pak Hunter',
    targetId: 'pedagang1',
    targetName: 'Pak Pedagang'
  });

  assert.ok(result.deadIds.includes('hunter1'));
  assert.ok(result.deadIds.includes('pedagang1'));
  assert.strictEqual(result.deathCauses['hunter1'], 'hunter_backfire');
  assert.strictEqual(result.isCorrect, false);
  assert.ok(result.logs[0].includes('Keduanya MATI!'));
});

test('Hunter shooting Joker: both die (Joker is not treated as Serigala)', () => {
  const players = [
    { id: 'hunter1', name: 'Pak Hunter', role: 'Hunter', status: 'alive' },
    { id: 'joker1', name: 'Si Joker', role: 'Joker', status: 'alive' }
  ];

  const result = resolveHunterShot(players, {
    playerId: 'hunter1',
    name: 'Pak Hunter',
    targetId: 'joker1',
    targetName: 'Si Joker'
  });

  assert.ok(result.deadIds.includes('hunter1'));
  assert.ok(result.deadIds.includes('joker1'));
  assert.strictEqual(result.isCorrect, false);
  assert.ok(result.logs[0].includes('Joker'));
});

test('Lovers broken heart: partner dies on the same night they are bound', () => {
  const players = [
    { id: 'lover1', name: 'Romeo', role: 'Lovers', status: 'alive', partnerId: null },
    { id: 'target1', name: 'Juliet', role: 'Pedagang', status: 'alive', partnerId: null }
  ];

  // Romeo binds with Juliet tonight
  const newBinds = [
    { playerId: 'lover1', name: 'Romeo', targetId: 'target1' }
  ];

  // Juliet was killed by Werewolf tonight
  const initialDeadIds = ['target1'];

  const result = resolveChain(players, newBinds, initialDeadIds);

  // Both Juliet (initial) and Romeo (broken heart) must be dead
  assert.ok(result.deadIds.includes('target1'));
  assert.ok(result.deadIds.includes('lover1'));
  assert.strictEqual(result.deathCauses['lover1'], 'lovers');
  assert.ok(result.logs[0].includes('Romeo gugur patah hati'));
});

test('Hunter yang sudah mati tidak menembak', () => {
  const players = [
    { id: 'hunter1', name: 'Pak Hunter', role: 'Hunter', status: 'dead' },
    { id: 'ww1', name: 'Serigala Malam', role: 'Werewolf', status: 'alive' }
  ];

  const result = resolveHunterShot(players, {
    playerId: 'hunter1',
    name: 'Pak Hunter',
    targetId: 'ww1',
    targetName: 'Serigala Malam'
  });

  assert.deepStrictEqual(result.deadIds, []);
  assert.strictEqual(result.hunterResult, null);
});

test('Target yang sudah mati tidak ditembak ulang', () => {
  const players = [
    { id: 'hunter1', name: 'Pak Hunter', role: 'Hunter', status: 'alive' },
    { id: 'ww1', name: 'Serigala Malam', role: 'Werewolf', status: 'dead' }
  ];

  const result = resolveHunterShot(players, {
    playerId: 'hunter1',
    name: 'Pak Hunter',
    targetId: 'ww1',
    targetName: 'Serigala Malam'
  });

  assert.deepStrictEqual(result.deadIds, []);
  assert.strictEqual(result.hunterResult, null);
});
