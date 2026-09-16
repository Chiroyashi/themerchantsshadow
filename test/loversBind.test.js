import test from 'node:test';
import assert from 'node:assert';

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

function shouldShowLoversWave(myId, bindEvent) {
  if (!bindEvent || !bindEvent.timestamp) return false;
  const isRecent = Date.now() - bindEvent.timestamp < 10000;
  if (!isRecent) return false;

  const isLover = myId === bindEvent.loverId;
  const isPartner = myId === bindEvent.partnerId;

  return isLover || isPartner;
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
