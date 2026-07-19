export const PHASE = {
  PAGI: 'Pagi (Diskusi)',
  SIANG: 'Siang (Voting)',
  MALAM: 'Malam (Eksekusi)',
};

export function isPhase(phaseName, target) {
  if (!phaseName || !target) return false;
  return phaseName.toLowerCase().includes(target.toLowerCase());
}

export function isPagi(phase) { return isPhase(phase, 'pagi'); }
export function isSiang(phase) { return isPhase(phase, 'siang'); }
export function isMalam(phase) { return isPhase(phase, 'malam'); }
