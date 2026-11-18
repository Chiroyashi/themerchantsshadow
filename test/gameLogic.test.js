import test from 'node:test';
import assert from 'node:assert';
import { distributeRoles, isRoleActive } from '../src/utils/gameLogic.js';
import { calculateRoles } from '../src/utils/roleBalancer.js';

const mkPlayers = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, role: 'Pending' }));

test('distributeRoles selalu memberi minimal 1 Pedagang dan tidak ada role undefined (5-10 pemain)', () => {
  for (let n = 5; n <= 10; n++) {
    const roles = distributeRoles(mkPlayers(n), {}).map(p => p.role);
    assert.ok(roles.every(r => r !== undefined), `n=${n}: ada role undefined`);
    const pedagang = roles.filter(r => r === 'Pedagang').length;
    assert.ok(pedagang >= 1, `n=${n}: Pedagang=${pedagang}`);
  }
});

test('jumlah Pedagang hasil distributeRoles konsisten dengan preview calculateRoles', () => {
  for (let n = 5; n <= 10; n++) {
    const expected = calculateRoles(n, {}).protagonists.pedagang;
    const actual = distributeRoles(mkPlayers(n), {}).filter(p => p.role === 'Pedagang').length;
    assert.strictEqual(actual, expected, `n=${n}`);
  }
  for (let n = 5; n <= 10; n++) {
    const settings = { Joker: false, Lovers: false };
    const expected = calculateRoles(n, settings).protagonists.pedagang;
    const actual = distributeRoles(mkPlayers(n), settings).filter(p => p.role === 'Pedagang').length;
    assert.strictEqual(actual, expected, `n=${n} (Joker+Lovers off)`);
  }
});

test('isRoleActive menegakkan minimum pemain walau setting diaktifkan', () => {
  assert.strictEqual(isRoleActive('Joker', { Joker: true }, 5), false);
  assert.strictEqual(isRoleActive('Joker', { Joker: true }, 6), true);
  assert.strictEqual(isRoleActive('Guard', { Guard: true }, 5), false);
  assert.strictEqual(isRoleActive('Guard', { Guard: true }, 6), true);
  assert.strictEqual(isRoleActive('Seer', {}, 5), true);
});