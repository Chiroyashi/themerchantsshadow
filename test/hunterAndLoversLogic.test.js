import test from 'node:test';
import assert from 'node:assert';
import { getPlayerTeam } from '../src/utils/roleActions.js';

// Simulation function representing the fixed Hunter logic from TimerContext.jsx
function simulateHunterNightAction(players, huntAction) {
  const deadIds = new Set();
  const deathCauses = {};
  const logs = [];

  const target = players.find(p => p.id === huntAction.targetId);
  if (!target) return { deadIds, deathCauses, logs };

  const isSerigala = target.role === 'Werewolf' || target.role === 'Warlock' || (target.role === 'Lovers' && target.loversTeam === 'SERIGALA');

  if (!isSerigala) {
    deadIds.add(huntAction.targetId);
    deathCauses[huntAction.targetId] = "hunter";
    deadIds.add(huntAction.playerId);
    deathCauses[huntAction.playerId] = "hunter_backfire";
    const targetDesc = target.role === 'Joker' ? 'Joker' : 'Warga';
    logs.push(`Hunter ${huntAction.name} menembak ${targetDesc} ${huntAction.targetName} → Keduanya MATI!`);
  } else {
    deadIds.add(huntAction.targetId);
    deathCauses[huntAction.targetId] = "hunter";
    logs.push(`Hunter ${huntAction.name} menembak Serigala ${huntAction.targetName} → Hunter SELAMAT!`);
  }

  return {
    deadIds: Array.from(deadIds),
    deathCauses,
    logs,
    isCorrect: isSerigala
  };
}

// Simulation function representing the fixed Lovers chain death logic from TimerContext.jsx
function simulateLoversChainDeaths(players, newBinds, initialDeadIds) {
  const deadIds = new Set(initialDeadIds);
  const deathCauses = {};
  const logs = [];

  const partnerMap = {};
  players.forEach(p => {
    if (p.partnerId) {
      partnerMap[p.id] = p.partnerId;
    }
  });

  for (const bind of newBinds) {
    if (bind.targetId) {
      partnerMap[bind.playerId] = bind.targetId;
      partnerMap[bind.targetId] = bind.playerId;
    }
  }

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
            deathCauses[partnerId] = "lovers";
            logs.push(`Lovers: ${partner.name} gugur patah hati karena pasangannya (${p.name}) tewas.`);
            loverDied = true;
          }
        }
      }
    });
  }

  return { deadIds: Array.from(deadIds), deathCauses, logs };
}

test('Hunter shooting Werewolf: Hunter lives, Werewolf dies', () => {
  const players = [
    { id: 'hunter1', name: 'Pak Hunter', role: 'Hunter', status: 'alive' },
    { id: 'ww1', name: 'Serigala Malam', role: 'Werewolf', status: 'alive' }
  ];

  const result = simulateHunterNightAction(players, {
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

  const result = simulateHunterNightAction(players, {
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

  const result = simulateHunterNightAction(players, {
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

  const result = simulateLoversChainDeaths(players, newBinds, initialDeadIds);

  // Both Juliet (initial) and Romeo (broken heart) must be dead
  assert.ok(result.deadIds.includes('target1'));
  assert.ok(result.deadIds.includes('lover1'));
  assert.strictEqual(result.deathCauses['lover1'], 'lovers');
  assert.ok(result.logs[0].includes('Romeo gugur patah hati'));
});
