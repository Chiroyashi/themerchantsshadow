export const LOVERS_OVERLAY_DELAY_MS = 0;

export const shouldShowLoversWave = (myId, bindEvent) => {
  if (!bindEvent?.timestamp) return false;
  return myId === bindEvent.loverId || myId === bindEvent.partnerId;
};

export const canShowLoversOverlay = (pendingBind, isGamePage) =>
  Boolean(pendingBind && isGamePage);

export const shouldShowJujurBadge = (isUnderTruth, isSystemTruth, isSystemGunshot) =>
  Boolean(isUnderTruth && !isSystemTruth && !isSystemGunshot);

export const shouldShowExclamationMark = (isUnderTruth, senderId, myId) =>
  Boolean(isUnderTruth && senderId !== myId);
