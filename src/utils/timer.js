export const getRemainingSeconds = (endsAt, now = Date.now()) => {
  if (!endsAt) return null;
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
};

export const getPhaseDuration = (phaseName, dayNum) => {
  const pLower = phaseName?.toLowerCase() || '';
  if (pLower.includes('pagi')) return dayNum === 1 ? 60 : 90;
  if (pLower.includes('siang')) return 120;
  if (pLower.includes('malam')) return 90;
  return 120;
};
