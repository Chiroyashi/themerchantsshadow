import test from 'node:test';
import assert from 'node:assert';
import { getPlayerTeam } from '../src/utils/roleActions.js';
import { isPlayerWinner } from '../src/utils/playerResult.js';
import { canShowLoversOverlay, shouldShowLoversWave } from '../src/utils/uiVisibility.js';

function simulateLoversBindAction(roomCode, loverData, targetPlayer) {
  const updates = {};
  const timestamp = Date.now();

  // Current action payload
  updates[`rooms/${roomCode}/players/${loverData.id}/currentAction`] = {
    role: "Lovers",
    action: "bind",
    targetId: targetPlayer.id,
    targetName: targetPlayer.name,
    timestamp
  };

  // Realtime bind event payload
  updates[`rooms/${roomCode}/loversBindEvent`] = {
    loverId: loverData.id,
    loverName: loverData.name,
    partnerId: targetPlayer.id,
    partnerName: targetPlayer.name,
    timestamp
  };

  return updates;
}

test('Lovers bind action creates both currentAction and loversBindEvent', () => {
  const roomCode = 'ROOM12';
  const lover = { id: 'p_lover', name: 'Romeo', role: 'Lovers' };
  const partner = { id: 'p_partner', name: 'Juliet', role: 'Pedagang' };

  const updates = simulateLoversBindAction(roomCode, lover, partner);

  assert.deepStrictEqual(updates[`rooms/${roomCode}/loversBindEvent`], {
    loverId: 'p_lover',
    loverName: 'Romeo',
    partnerId: 'p_partner',
    partnerName: 'Juliet',
    timestamp: updates[`rooms/${roomCode}/loversBindEvent`].timestamp
  });
});

test('Double wave is shown to Lovers and their Partner, but NOT to third parties', () => {
  const bindEvent = {
    loverId: 'p_lover',
    loverName: 'Romeo',
    partnerId: 'p_partner',
    partnerName: 'Juliet',
    timestamp: Date.now()
  };

  // Lovers player sees it
  assert.strictEqual(shouldShowLoversWave('p_lover', bindEvent), true);

  // Partner player sees it
  assert.strictEqual(shouldShowLoversWave('p_partner', bindEvent), true);

  // Third party bystander (e.g. Werewolf or Hakim) does NOT see it
  assert.strictEqual(shouldShowLoversWave('p_other', bindEvent), false);
});

test('Partner yang load telat tetap melihat double wave', () => {
  const bindEvent = { loverId: 'p_lover', partnerId: 'p_partner', timestamp: Date.now() - 60000 };
  assert.strictEqual(shouldShowLoversWave('p_partner', bindEvent), true);
});

test('Lovers overlay ditunda saat overlay penting aktif', () => {
  const pending = { partnerName: 'Juliet', timestamp: Date.now() };
  assert.strictEqual(canShowLoversOverlay(pending, true, true), false);
  assert.strictEqual(canShowLoversOverlay(pending, false, false), false);
  assert.strictEqual(canShowLoversOverlay(pending, false, true), true);
  assert.strictEqual(canShowLoversOverlay(null, false, true), false);
});

function resolveLoversTeam(partnerRole) {
  const team = getPlayerTeam(partnerRole);
  return team === 'INDEPENDEN' ? 'JOKER' : team;
}

test('Lovers bind menulis faksi yang sama ke kedua pemain', () => {
  const lover = { id: 'p_lover', role: 'Lovers' };
  const werewolf = { id: 'p_ww', role: 'Werewolf' };
  const team = resolveLoversTeam(werewolf.role);

  assert.strictEqual(team, 'SERIGALA');
  assert.strictEqual(isPlayerWinner({ ...lover, loversTeam: team }, 'SERIGALA'), true);
  assert.strictEqual(isPlayerWinner({ ...werewolf, loversTeam: team }, 'SERIGALA'), true);
});

test('Lovers yang terikat Joker ikut menang saat Joker menang', () => {
  const joker = { id: 'p_joker', role: 'Joker' };
  const team = resolveLoversTeam(joker.role);
  const lover = { id: 'p_lover', role: 'Lovers', loversTeam: team };

  assert.strictEqual(team, 'JOKER');
  assert.strictEqual(isPlayerWinner(joker, 'JOKER'), true);
  assert.strictEqual(isPlayerWinner(lover, 'JOKER'), true);
});
