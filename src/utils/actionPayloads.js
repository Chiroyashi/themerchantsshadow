export const buildLoversBindUpdates = ({ roomCode, lover, partner, timestamp = Date.now() }) => ({
  [`rooms/${roomCode}/players/${lover.id}/currentAction`]: {
    role: 'Lovers',
    action: 'bind',
    targetId: partner.id,
    targetName: partner.name,
    timestamp
  },
  [`rooms/${roomCode}/loversBindEvent`]: {
    loverId: lover.id,
    loverName: lover.name,
    partnerId: partner.id,
    partnerName: partner.name,
    timestamp
  }
});

export const buildHakimTruthUpdates = ({
  roomCode,
  playerId,
  targetId,
  targetName,
  truthUsedCount = 0,
  timestamp = Date.now()
}) => ({
  [`rooms/${roomCode}/players/${playerId}/currentAction`]: {
    role: 'Hakim',
    action: 'truth',
    actionType: 'truth',
    targetId,
    targetName,
    timestamp
  },
  [`rooms/${roomCode}/players/${playerId}/truthActed`]: true,
  [`rooms/${roomCode}/players/${playerId}/truthUsedCount`]: truthUsedCount + 1
});

export const buildHakimSkipUpdates = ({ roomCode, playerId, timestamp = Date.now() }) => ({
  [`rooms/${roomCode}/players/${playerId}/currentAction`]: {
    role: 'Hakim',
    action: 'skip',
    actionType: 'truth',
    timestamp
  },
  [`rooms/${roomCode}/players/${playerId}/truthActed`]: true
});

export const buildModeratorToggleUpdates = ({ roomCode, playerId, playerName, isEnabled }) => ({
  [`rooms/${roomCode}/roleSettings/Moderator`]: isEnabled,
  [`rooms/${roomCode}/players/${playerId}/role`]: isEnabled ? 'Moderator' : 'Pending',
  [`rooms/${roomCode}/players/${playerId}/name`]: isEnabled ? `${playerName} (Moderator)` : playerName
});
