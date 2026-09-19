export const isPlayerWinner = (player, winner) => {
  if (!player || !winner) return false;
  const roleLower = player.role?.toLowerCase() || "";

  if (winner === 'JOKER') {
    return roleLower === 'joker';
  }
  if (roleLower === 'joker') {
    return false;
  }
  if (roleLower === 'lovers') {
    const loversTeam = player.loversTeam;
    if (!loversTeam) return false;
    return winner === loversTeam;
  }

  const isAntagonist = roleLower.includes('werewolf') || roleLower.includes('warlock');
  return winner === 'WARGA' ? !isAntagonist : (winner === 'SERIGALA' ? isAntagonist : false);
};