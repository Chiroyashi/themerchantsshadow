import test from 'node:test';
import assert from 'node:assert';
import { isStaleAuthError } from '../src/utils/authRecovery.js';

test('isStaleAuthError only matches persisted credential failures', () => {
  assert.strictEqual(isStaleAuthError({ code: 'auth/user-not-found' }), true);
  assert.strictEqual(isStaleAuthError({ code: 'auth/invalid-user-token' }), true);
  assert.strictEqual(isStaleAuthError({ code: 'auth/user-token-expired' }), true);
  assert.strictEqual(isStaleAuthError({ code: 'auth/requires-recent-login' }), true);
  assert.strictEqual(isStaleAuthError({ code: 'auth/operation-not-allowed' }), false);
  assert.strictEqual(isStaleAuthError({ code: 'auth/network-request-failed' }), false);
  assert.strictEqual(isStaleAuthError(null), false);
});
