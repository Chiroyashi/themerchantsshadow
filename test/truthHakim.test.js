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

// Import game logic and balancer to test role distribution with toggles
import { distributeRoles } from '../src/utils/gameLogic.js';
import { calculateRoles } from '../src/utils/roleBalancer.js';

test("distributeRoles respects disabled optional roles", () => {
  const players = [
    { id: "mod", name: "Host", role: "Moderator" },
    { id: "p1", name: "Player 1", role: "Pending" },
    { id: "p2", name: "Player 2", role: "Pending" },
    { id: "p3", name: "Player 3", role: "Pending" },
    { id: "p4", name: "Player 4", role: "Pending" },
    { id: "p5", name: "Player 5", role: "Pending" },
    { id: "p6", name: "Player 6", role: "Pending" },
    { id: "p7", name: "Player 7", role: "Pending" },
    { id: "p8", name: "Player 8", role: "Pending" }
  ];

  // Disable Seer, Guard, Hunter, Warlock
  const roleSettings = { Seer: false, Guard: false, Hunter: false, Warlock: false };
  const assigned = distributeRoles(players, roleSettings);

  // Expect no Seer, Guard, Hunter, or Warlock to be assigned
  const roles = assigned.filter(p => p.role !== 'Moderator').map(p => p.role);
  assert.ok(!roles.includes("Seer"), "Should not contain Seer");
  assert.ok(!roles.includes("Guard"), "Should not contain Guard");
  assert.ok(!roles.includes("Hunter"), "Should not contain Hunter");
  assert.ok(!roles.includes("Warlock"), "Should not contain Warlock");

  // Warlock is disabled, so antagonists should all be Werewolf
  const werewolfCount = roles.filter(r => r === 'Werewolf').length;
  assert.strictEqual(werewolfCount, 2, "Should have 2 Werewolves when Warlock is disabled");

  // Hakim is required, should exist
  assert.ok(roles.includes("Hakim"), "Should contain Hakim");
});

test("calculateRoles respects disabled optional roles", () => {
  const count = 8;
  const roleSettings = { Seer: false, Guard: false, Hunter: false, Warlock: false };

  const config = calculateRoles(count, roleSettings);
  assert.strictEqual(config.antagonists.warlock, 0, "Warlock should be 0");
  assert.strictEqual(config.antagonists.werewolf, 2, "Werewolves should be 2");
  assert.strictEqual(config.protagonists.seer, 0, "Seer should be 0");
  assert.strictEqual(config.protagonists.guard, 0, "Guard should be 0");
  assert.strictEqual(config.protagonists.hunter, 0, "Hunter should be 0");
  assert.strictEqual(config.protagonists.hakim, 1, "Hakim should be 1");
});

test("distributeRoles assigns Lovers and Joker when enabled", () => {
  const players = [
    { id: "mod", name: "Host", role: "Moderator" },
    { id: "p1", name: "Player 1", role: "Pending" },
    { id: "p2", name: "Player 2", role: "Pending" },
    { id: "p3", name: "Player 3", role: "Pending" },
    { id: "p4", name: "Player 4", role: "Pending" },
    { id: "p5", name: "Player 5", role: "Pending" },
    { id: "p6", name: "Player 6", role: "Pending" },
    { id: "p7", name: "Player 7", role: "Pending" },
    { id: "p8", name: "Player 8", role: "Pending" }
  ];

  const roleSettings = { Seer: true, Guard: true, Hunter: true, Warlock: true, Lovers: true, Joker: true };
  const assigned = distributeRoles(players, roleSettings);
  const roles = assigned.filter(p => p.role !== 'Moderator').map(p => p.role);

  assert.ok(roles.includes("Lovers"), "Should assign Lovers");
  assert.ok(roles.includes("Joker"), "Should assign Joker");
});
