export const isPlayerWinner = (player, winner) => {
  if (!player || !winner) return false;
  const roleLower = player.role?.toLowerCase() || "";

  if (winner === 'JOKER') {
    if (roleLower === 'joker') return true;
    return roleLower === 'lovers' && player.loversTeam === 'JOKER';
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