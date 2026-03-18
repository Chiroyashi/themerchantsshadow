export const calculateRoles = (playerCount) => {
    const count = parseInt(playerCount);
    
    // Rasio Dasar: ~25-30% adalah Antagonis (Werewolf & Warlock)
    let antagonistsCount = Math.floor(count / 3.5) || 1;
    let protagonistsCount = count - antagonistsCount;
  
    // Distribusi Antagonis
    // Jika antagonis lebih dari 1, salah satunya bisa jadi Warlock
    const warlock = antagonistsCount > 1 ? 1 : 0;
    const werewolf = antagonistsCount - warlock;
  
    // Distribusi Protagonis Spesial (Power Roles)
    // Role spesial muncul bertahap sesuai jumlah pemain
    const specialRoles = {
      seer: count >= 5 ? 1 : 0,
      guard: count >= 7 ? 1 : 0,
      hakim: count >= 10 ? 1 : 0,
      hunter: count >= 12 ? 1 : 0,
    };
  
    const totalSpecial = Object.values(specialRoles).reduce((a, b) => a + b, 0);
    const pedagang = protagonistsCount - totalSpecial;
  
    return {
      antagonists: { werewolf, warlock },
      protagonists: { ...specialRoles, pedagang },
      total: { antagonistsCount, protagonistsCount }
    };
  };