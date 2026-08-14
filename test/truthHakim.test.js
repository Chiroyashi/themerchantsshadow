import test from 'node:test';
import assert from 'node:assert';

// Simulating Hakim Truth Action and Processing Logic
function simulateHakimAction(roomCode, hakimId, targetId, targetName, currentTruthUsedCount) {
  const updates = {};

  // Simulated logic from ViewRole.jsx (lines 494-505)
  updates[`rooms/${roomCode}/players/${hakimId}/currentAction`] = {
    role: "Hakim",
    action: "truth",
    actionType: "truth",
    targetId: targetId,
    targetName: targetName,
    timestamp: Date.now()
  };
  updates[`rooms/${roomCode}/players/${hakimId}/truthActed`] = true;
  updates[`rooms/${roomCode}/players/${hakimId}/truthUsedCount`] = (currentTruthUsedCount || 0) + 1;

  return updates;
}

function simulateProcessNightResults(roomCode, players, nightActions) {
  const updates = {};
  const logs = [];
  const truthTargets = {};

  // Simulated logic from TimerContext.jsx (lines 400-406 & lines 414-416)
  for (const truth of nightActions.filter(a => a.role === 'Hakim')) {
    if (!truth.targetId) continue;
    truthTargets[truth.targetId] = true;
    logs.push(`Hakim ${truth.name} menggunakan Truth pada ${truth.targetName}`);
  }

  Object.keys(truthTargets).forEach(id => {
    updates[`rooms/${roomCode}/players/${id}/underTruth`] = true;
  });

  return { updates, logs };
}

// Chatroom Badge and Exclamation Mark Predicates
function shouldShowJujurBadge(isUnderTruth, isSystemTruth, isSystemGunshot) {
  return isUnderTruth && !isSystemTruth && !isSystemGunshot;
}

function shouldShowExclamationMark(isUnderTruth, senderId, myId) {
  return isUnderTruth && senderId !== myId;
}

// ============================================================================
// TEST SUITE
// ============================================================================

test("Hakim Action Submission Updates object", () => {
  const roomCode = "TESTROOM";
  const hakimId = "player_hakim";
  const targetId = "player_target";
  const targetName = "Target Player";
  const currentTruthUsedCount = 0;

  const updates = simulateHakimAction(roomCode, hakimId, targetId, targetName, currentTruthUsedCount);

  assert.deepStrictEqual(updates[`rooms/${roomCode}/players/${hakimId}/currentAction`], {
    role: "Hakim",
    action: "truth",
    actionType: "truth",
    targetId: targetId,
    targetName: targetName,
    timestamp: updates[`rooms/${roomCode}/players/${hakimId}/currentAction`].timestamp
  });

  assert.strictEqual(updates[`rooms/${roomCode}/players/${hakimId}/truthActed`], true);
  assert.strictEqual(updates[`rooms/${roomCode}/players/${hakimId}/truthUsedCount`], 1);
});

test("Night Action Processing Updates underTruth in Database", () => {
  const roomCode = "TESTROOM";
  const players = [
    { id: "player_hakim", name: "Pak Hakim", role: "Hakim", status: "alive" },
    { id: "player_sus", name: "Pemain Sus", role: "Werewolf", status: "alive" }
  ];

  const nightActions = [
    {
      playerId: "player_hakim",
      role: "Hakim",
      name: "Pak Hakim",
      targetId: "player_sus",
      targetName: "Pemain Sus"
    }
  ];

  const { updates, logs } = simulateProcessNightResults(roomCode, players, nightActions);

  // Verify that the player underTruth is set to true
  assert.strictEqual(updates[`rooms/${roomCode}/players/player_sus/underTruth`], true);
  assert.strictEqual(logs.length, 1);
  assert.ok(logs[0].includes("Hakim Pak Hakim menggunakan Truth pada Pemain Sus"));
});

test("Chatroom: [JUJUR] badge visibility logic", () => {
  // Case 1: Player is underTruth, normal chat
  assert.strictEqual(shouldShowJujurBadge(true, false, false), true);

  // Case 2: Player is not underTruth
  assert.strictEqual(shouldShowJujurBadge(false, false, false), false);

  // Case 3: System Truth announcement message
  assert.strictEqual(shouldShowJujurBadge(true, true, false), false);

  // Case 4: System Gunshot announcement message
  assert.strictEqual(shouldShowJujurBadge(true, false, true), false);
});

test("Chatroom: Exclamation mark (!) visibility logic", () => {
  const underTruthPlayer = "player_truth";
  const otherPlayer = "player_other";

  // Case 1: Other player views underTruth player's message (Should show !)
  assert.strictEqual(
    shouldShowExclamationMark(true, underTruthPlayer, otherPlayer),
    true
  );

  // Case 2: underTruth player views their own message (Should NOT show !)
  assert.strictEqual(
    shouldShowExclamationMark(true, underTruthPlayer, underTruthPlayer),
    false
  );

  // Case 3: Player is not underTruth, other player views it (Should NOT show !)
  assert.strictEqual(
    shouldShowExclamationMark(false, otherPlayer, underTruthPlayer),
    false
  );
});
