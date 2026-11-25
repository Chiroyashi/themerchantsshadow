export function pickSystemClueRecipient(players, merchantClues = {}, random = Math.random) {
  const received = merchantClues || {};
  const recipients = players.filter(p =>
    p.role === 'Pedagang' && p.status !== 'dead' && !received[p.id]
  );
  if (recipients.length === 0) return null;

  const index = Math.min(recipients.length - 1, Math.floor(random() * recipients.length));
  return recipients[index];
}

export function buildMerchantClue(players, random = Math.random) {
  const candidates = players.filter(p => p.status !== 'dead' && p.role !== 'Moderator');
  const warlock = candidates.find(p => p.role === 'Warlock');
  if (!warlock) return null;

  const pool = candidates.filter(p => p.id !== warlock.id);
  const picks = [warlock];
  while (picks.length < 3 && pool.length > 0) {
    const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
    picks.push(pool.splice(index, 1)[0]);
  }

  const shuffled = [...picks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const suspects = shuffled.map(p => p.name);
  return {
    suspects,
    message: `Transaksi gelap terdeteksi. Salah satu dari ${suspects.join(', ')} adalah Warlock.`
  };
}

export const clueDismissKey = (roomCode, clue = {}) =>
  `dismissed_clue_${roomCode}_${clue.transactionKey ?? clue.timestamp ?? clue.day ?? 'latest'}`;
