export const LOVERS_WAVE_WINDOW_MS = 6000;

export const shouldShowLoversWave = (myId, bindEvent, now = Date.now()) => {
  if (!bindEvent?.timestamp) return false;
  if (bindEvent.timestamp <= now - LOVERS_WAVE_WINDOW_MS) return false;
  return myId === bindEvent.loverId || myId === bindEvent.partnerId;
};

export const shouldShowJujurBadge = (isUnderTruth, isSystemTruth, isSystemGunshot) =>
  Boolean(isUnderTruth && !isSystemTruth && !isSystemGunshot);

export const shouldShowExclamationMark = (isUnderTruth, senderId, myId) =>
  Boolean(isUnderTruth && senderId !== myId);
