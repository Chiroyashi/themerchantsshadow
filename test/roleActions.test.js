import test from 'node:test';
import assert from 'node:assert';
import { getRoleActionConfig, getPlayerTeam } from '../src/utils/roleActions.js';

test('getPlayerTeam correctly categorizes all roles', () => {
  assert.strictEqual(getPlayerTeam('Werewolf'), 'SERIGALA');
  assert.strictEqual(getPlayerTeam('Warlock'), 'SERIGALA');
  assert.strictEqual(getPlayerTeam('Hakim'), 'WARGA');
  assert.strictEqual(getPlayerTeam('Seer'), 'WARGA');
  assert.strictEqual(getPlayerTeam('Guard'), 'WARGA');
  assert.strictEqual(getPlayerTeam('Hunter'), 'WARGA');
  assert.strictEqual(getPlayerTeam('Pedagang'), 'WARGA');
  assert.strictEqual(getPlayerTeam('Joker'), 'INDEPENDEN');
  assert.strictEqual(getPlayerTeam('Lovers'), 'INDEPENDEN');
});

test('Werewolf cannot kill on Night 1, but can kill on Night 2+', () => {
  const night1 = getRoleActionConfig('Werewolf', 1, 8, {});
  assert.strictEqual(night1.canAct, false);
  assert.strictEqual(night1.actionType, null);

  const night2 = getRoleActionConfig('Werewolf', 2, 8, {});
  assert.strictEqual(night2.canAct, true);
  assert.strictEqual(night2.actionType, 'kill');

  const night2Acted = getRoleActionConfig('Werewolf', 2, 8, { hasActed: true });
  assert.strictEqual(night2Acted.canAct, false);
});

test('Guard protection and cooldown mechanism (every 2 nights)', () => {
  // Day 1: can act
  const day1 = getRoleActionConfig('Guard', 1, 8, {});
  assert.strictEqual(day1.canAct, true);
  assert.strictEqual(day1.actionType, 'protect');

  // Day 2 (cooldown after acting day 1): cannot act
  const day2 = getRoleActionConfig('Guard', 2, 8, { lastProtectedDay: 1 });
  assert.strictEqual(day2.canAct, false);

  // Day 3 (cooldown ended): can act again
  const day3 = getRoleActionConfig('Guard', 3, 8, { lastProtectedDay: 1 });
  assert.strictEqual(day3.canAct, true);
  assert.strictEqual(day3.actionType, 'protect');
});

test('Hunter cannot act Night 1, can act Night 2+ only once per game', () => {
  const night1 = getRoleActionConfig('Hunter', 1, 8, {});
  assert.strictEqual(night1.canAct, false);

  const night2 = getRoleActionConfig('Hunter', 2, 8, {});
  assert.strictEqual(night2.canAct, true);
  assert.strictEqual(night2.actionType, 'hunt');

  const night3AlreadyActed = getRoleActionConfig('Hunter', 3, 8, { hunterActed: true });
  assert.strictEqual(night3AlreadyActed.canAct, false);
});

test('Hakim Pistol (day) and Truth (night) restrictions', () => {
  // Day: Pistol available
  const dayConfig = getRoleActionConfig('Hakim', 2, 8, { currentPhase: 'Siang (Voting)', pistolUsedCount: 0 });
  assert.strictEqual(dayConfig.canAct, true);
  assert.strictEqual(dayConfig.actionType, 'pistol');
  assert.strictEqual(dayConfig.maxUses, 2);

  // Day: Pistol exhausted after 2 uses
  const dayExhausted = getRoleActionConfig('Hakim', 2, 8, { currentPhase: 'Siang (Voting)', pistolUsedCount: 2 });
  assert.strictEqual(dayExhausted.canAct, false);

  // Night: Truth available
  const nightConfig = getRoleActionConfig('Hakim', 2, 8, { currentPhase: 'Malam (Eksekusi)', truthActed: false });
  assert.strictEqual(nightConfig.canAct, true);
  assert.strictEqual(nightConfig.actionType, 'truth');

  // Night: Truth already used tonight
  const nightAlreadyUsed = getRoleActionConfig('Hakim', 2, 8, { currentPhase: 'Malam (Eksekusi)', truthActed: true });
  assert.strictEqual(nightAlreadyUsed.canAct, false);
});
