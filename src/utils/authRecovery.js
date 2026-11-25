const STALE_AUTH_CODES = new Set([
  'auth/user-not-found',
  'auth/invalid-user-token',
  'auth/user-token-expired',
  'auth/requires-recent-login'
]);

export function isStaleAuthError(error) {
  return STALE_AUTH_CODES.has(error?.code);
}
