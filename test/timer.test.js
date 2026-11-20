import test from 'node:test';
import assert from 'node:assert';
import { getRemainingSeconds, getPhaseDuration } from '../src/utils/timer.js';

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

test('getPhaseDuration memakai durasi hari pertama untuk Pagi', () => {
  assert.strictEqual(getPhaseDuration('Pagi', 1), 60);
  assert.strictEqual(getPhaseDuration('Pagi', 2), 90);
  assert.strictEqual(getPhaseDuration('Siang', 3), 120);
  assert.strictEqual(getPhaseDuration('Malam', 3), 90);
  assert.strictEqual(getPhaseDuration(undefined, 3), 120);
});
