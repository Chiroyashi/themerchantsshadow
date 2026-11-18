import test from 'node:test';
import assert from 'node:assert';
import { getRemainingSeconds } from '../src/utils/timer.js';

test('getRemainingSeconds menghitung sisa waktu dari endsAt absolut', () => {
  assert.strictEqual(getRemainingSeconds(30_000, 0), 30);
  assert.strictEqual(getRemainingSeconds(30_000, 10_000), 20);
  assert.strictEqual(getRemainingSeconds(30_000, 30_000), 0);
  assert.strictEqual(getRemainingSeconds(30_000, 40_000), 0);
});

test('getRemainingSeconds mengabaikan endsAt kosong', () => {
  assert.strictEqual(getRemainingSeconds(null, 0), null);
  assert.strictEqual(getRemainingSeconds(undefined, 0), null);
});
