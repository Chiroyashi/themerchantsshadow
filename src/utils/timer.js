export const getRemainingSeconds = (endsAt, now = Date.now()) => {
  if (!endsAt) return null;
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
};
