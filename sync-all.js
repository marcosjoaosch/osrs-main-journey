const wiseSyncBase = window.syncAccount;
window.syncAccount = async function () {
  await wiseSyncBase();
  const username = state.username || 'samurai_jao';
  try {
    const response = await fetch(`https://api.wiseoldman.net/v2/players/${encodeURIComponent(username)}`);
    if (!response.ok) return;
    const data = await response.json(), skills = data.latestSnapshot?.data?.skills;
    const labels = { attack: 'Attack', strength: 'Strength', defence: 'Defence', hitpoints: 'Hitpoints', ranged: 'Ranged', prayer: 'Prayer', magic: 'Magic', cooking: 'Cooking', woodcutting: 'Woodcutting', fletching: 'Fletching', fishing: 'Fishing', firemaking: 'Firemaking', crafting: 'Crafting', smithing: 'Smithing', mining: 'Mining', herblore: 'Herblore', agility: 'Agility', thieving: 'Thieving', slayer: 'Slayer', farming: 'Farming', runecrafting: 'Runecraft', hunter: 'Hunter', construction: 'Construction', sailing: 'Sailing' };
    Object.entries(labels).forEach(([key, label]) => { const level = skills?.[key]?.level; if (!level) return; const current = state.skills.find(skill => skill[0] === label); if (current) current[1] = level; else state.skills.push([label, level, level]); });
    if (skills?.overall?.level) state.total = skills.overall.level;
    state.lastSync = new Date().toLocaleString('pt-BR'); save(); render();
  } catch { /* The manual data remains available when the external service is unavailable. */ }
};
