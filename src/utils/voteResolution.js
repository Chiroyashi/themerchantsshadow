export const buildJokerVoteUpdates = ({ roomCode, players = [], executedId, day, timestamp = Date.now() }) => {
  if (!roomCode || !executedId || !Array.isArray(players)) return {};

  const executed = players.find((player) => player.id === executedId);
  if (!executed || executed.role !== 'Joker') return {};

  const survivors = new Set([executedId]);
  if (executed.partnerId) survivors.add(executed.partnerId);

  const updates = {
    [`rooms/${roomCode}/voteResult`]: {
      day,
      names: [executed.name],
      executedId,
      isJoker: true,
      timestamp
    },
    [`rooms/${roomCode}/status`]: 'ended',
    [`rooms/${roomCode}/winner`]: 'JOKER',
    [`rooms/${roomCode}/endedAt`]: timestamp
  };

  players.forEach((player) => {
    if (player.role === 'Moderator') return;
    updates[`rooms/${roomCode}/players/${player.id}/status`] = survivors.has(player.id) ? 'alive' : 'dead';
  });

  return updates;
};
