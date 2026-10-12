import { awardExperience } from './CharacterEngine.js';

const XP_BY_CR = new Map([
  [0, 10], [0.125, 25], [0.25, 50], [0.5, 100], [1, 200], [2, 450],
  [3, 700], [4, 1100], [5, 1800], [6, 2300], [7, 2900], [8, 3900],
  [9, 5000], [10, 5900], [11, 7200], [12, 8400], [13, 10000], [14, 11500],
  [15, 13000], [16, 15000], [17, 18000], [18, 20000], [19, 22000],
  [20, 25000], [21, 33000], [22, 41000], [23, 50000], [24, 62000],
  [25, 75000], [26, 90000], [27, 105000], [28, 120000], [29, 135000],
  [30, 155000],
]);

const HEALING_POTION = { name: 'Potion of Healing', kind: 'gear', weight: 0.5 };

export function experienceForCr(cr) {
  const n = Number(cr);
  return Number.isFinite(n) ? XP_BY_CR.get(n) || 0 : 0;
}

function addHealingPotion(sheet) {
  if (!Array.isArray(sheet.inventory)) sheet.inventory = [];
  if (!Array.isArray(sheet.equipment)) sheet.equipment = [];

  let item = sheet.inventory.find(i => String(i.name).toLowerCase() === HEALING_POTION.name.toLowerCase());
  if (item) item.qty = Math.max(1, Number(item.qty) || 1) + 1;
  else {
    item = { ...HEALING_POTION, qty: 1, equipped: false };
    sheet.inventory.push(item);
  }

  let equipment = sheet.equipment.find(i => String(i.name).toLowerCase() === HEALING_POTION.name.toLowerCase());
  if (equipment) equipment.qty = Math.max(1, Number(equipment.qty) || 1) + 1;
  else sheet.equipment.push({ name: HEALING_POTION.name, qty: 1, kind: HEALING_POTION.kind });

  if (sheet.carrying) {
    sheet.carrying.weight = (Number(sheet.carrying.weight) || 0) + HEALING_POTION.weight;
    sheet.carrying.encumbered = sheet.carrying.weight > (Number(sheet.carrying.capacity) || 0);
  }
}

export function awardVictoryRewards(defeatedMonsters, participants) {
  const monsters = Array.isArray(defeatedMonsters) ? defeatedMonsters.filter(Boolean) : [];
  const players = [...new Map((Array.isArray(participants) ? participants : [])
    .filter(t => t?.kind === 'player' && t.sheet && t.id)
    .map(t => [t.id, t])).values()];
  const totalXp = monsters.reduce((sum, m) => sum + (Number(m.xp) > 0 ? Math.floor(Number(m.xp)) : experienceForCr(m.cr)), 0);
  if (!players.length || !monsters.length) return { totalXp, awards: [] };

  const base = Math.floor(totalXp / players.length);
  let remainder = totalXp % players.length;
  const awards = players.map(token => {
    const xp = base + (remainder-- > 0 ? 1 : 0);
    const sheet = token.sheet;
    if (sheet.hp) {
      sheet.hp.current = Math.max(0, Number(token.hp) || 0);
      sheet.hp.max = Number(token.hpMax) || sheet.hp.max;
    }
    const progression = awardExperience(sheet, xp);
    token.hp = sheet.hp?.current ?? token.hp;
    token.hpMax = sheet.hp?.max ?? token.hpMax;
    token.ac = sheet.ac ?? token.ac;
    token.speedFt = sheet.speedFt ?? token.speedFt;
    token.dexMod = sheet.mods?.dex ?? token.dexMod;
    addHealingPotion(sheet);
    return {
      tokenId: token.id,
      name: token.name,
      xp,
      levelsGained: progression.levelsGained,
      item: HEALING_POTION.name,
    };
  });

  return { totalXp, awards };
}
