// ASHENREACH — server/src/rules/character.test.js
// CharacterEngine.buildCharacter for the four launch archetypes at level 1:
// HP = max hit die + CON mod, AC present, spell slots for casters.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildCharacter, levelUp, awardExperience, xpForLevel, buildCombatProfile, toggleEquipment, shortRest, longRest } from './CharacterEngine.js';

const ABIL = { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 8 };

test('fighter (via "warden" archetype alias): d10 hit die + CON, AC, attacks', () => {
  const s = buildCharacter({
    name: 'Vael of the Ash', race: 'Human', class: 'warden', level: 1,
    background: 'Soldier', abilities: ABIL
  });

  assert.equal(s.class, 'Fighter');                    // alias resolved
  assert.equal(s.level, 1);
  // Human +1 all → CON 16 → +3; level 1 HP = 10 + 3
  assert.equal(s.abilities.con, 16);
  assert.equal(s.hp.max, 13);
  assert.equal(s.hp.current, 13);
  assert.equal(typeof s.ac, 'number');
  assert.ok(s.ac >= 15, `fighter AC should reflect starting chain mail + shield, got ${s.ac}`);
  assert.ok(s.attacks.length >= 1, 'fighter should start with weapon attacks');
  assert.ok(s.attacks.every(a => a.attackBonus >= 0));
  assert.equal(s.spellcasting, null);                  // non-caster
  assert.equal(s.sneakAttackDice, null);
  // Soldier background grants its two skills
  assert.equal(s.skills.athletics.proficient, true);
  assert.equal(s.skills.intimidation.proficient, true);
});

test('rogue (via "shadowdancer"): d8 hit die, sneak attack dice, no casting', () => {
  const s = buildCharacter({
    name: 'Nix', race: 'Halfling', class: 'shadowdancer', level: 1,
    abilities: { str: 10, dex: 17, con: 14, int: 12, wis: 12, cha: 10 }
  });
  assert.equal(s.class, 'Rogue');
  // Halfling +2 DEX → 19 → +4; CON 14 → +2; HP = 8 + 2
  assert.equal(s.hp.max, 10);
  assert.equal(s.sneakAttackDice, '1d6');
  assert.equal(s.spellcasting, null);
  assert.equal(s.initiative, 4);                       // dex mod
});

test('wizard: d6 hit die, level-1 slots, cantrips, save DC', () => {
  const s = buildCharacter({
    name: 'Ilyra', race: 'Elf', class: 'Wizard', level: 1,
    abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }
  });
  // Elf +2 DEX; High Elf auto-subrace; CON 14 → +2 → HP = 6 + 2
  assert.equal(s.hp.max, 8);
  assert.ok(s.spellcasting, 'wizard must be a caster');
  assert.equal(s.spellcasting.ability, 'INT');
  assert.equal(s.spellcasting.slots[1].total, 2);      // two level-1 slots at clvl 1
  assert.equal(s.spellcasting.slots[1].used, 0);
  assert.ok(s.spellcasting.cantrips.includes('Fire Bolt'));
  // save DC = 8 + prof(2) + INT mod(+3, int 16+... elf gives no INT) = 13
  assert.equal(s.spellcasting.saveDC, 13);
  assert.equal(s.spellcasting.attackBonus, 5);
});

test('short rest spends Hit Dice for capped healing without restoring ordinary spell slots', () => {
  const sheet = buildCharacter({ name: 'Ilyra', race: 'Human', class: 'Wizard', level: 2,
    abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 } });
  sheet.hp.current = 2;
  sheet.spellcasting.slots[1].used = 1;
  const result = shortRest(sheet, 2, () => 0.99);
  assert.equal(result.ok, true);
  assert.equal(result.rolls.length, 2);
  assert.equal(result.hpGained, sheet.hp.max - 2);
  assert.equal(sheet.hitDice.remaining, 0);
  assert.equal(sheet.hp.hitDiceSpent, 2);
  assert.equal(sheet.spellcasting.slots[1].used, 1);
});

test('short rest restores Warlock pact slots; long rest restores HP, slots, and half spent Hit Dice', () => {
  const warlock = buildCharacter({ name: 'Morrow', race: 'Human', class: 'Warlock', level: 4,
    abilities: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 16 } });
  warlock.spellcasting.slots[2].used = 2;
  const short = shortRest(warlock, 0);
  assert.equal(short.ok, true);
  assert.equal(short.slotsRecovered, 2);
  assert.equal(warlock.spellcasting.slots[2].used, 0);

  warlock.hp.current = 1;
  warlock.hitDice.remaining = 1;
  warlock.spellcasting.slots[2].used = 1;
  const long = longRest(warlock);
  assert.equal(warlock.hp.current, warlock.hp.max);
  assert.equal(long.hitDiceRegained, 2);
  assert.equal(warlock.hitDice.remaining, 3);
  assert.equal(warlock.spellcasting.slots[2].used, 0);
});

test('cleric: d8 hit die, level-1 slots, sacred flame cantrip', () => {
  const s = buildCharacter({
    name: 'Mourn', race: 'Dwarf', class: 'Cleric', level: 1,
    abilities: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 }
  });
  // Dwarf +2 CON → 16 → +3 → HP = 8 + 3 (Hill Dwarf adds WIS, not HP in this build)
  assert.equal(s.hp.max, 11);
  assert.ok(s.spellcasting);
  assert.equal(s.spellcasting.ability, 'WIS');
  assert.equal(s.spellcasting.slots[1].total, 2);
  assert.ok(s.spellcasting.cantrips.includes('Sacred Flame'));
});

// ── subclass consumption (FIX 6 — wave 2, Task 5-b) ─────────────────────────
// The creation wizard sends `subclass` for the level-1 chooser classes
// (Cleric domain / Warlock patron / Sorcerer origin); the server must resolve
// it onto the sheet (acceptance: "Dwarf Cleric with Life Domain — the sheet
// shows the domain feature").

test('subclass: Dwarf Cleric + Life Domain → sheet.subclass + Disciple of Life', () => {
  const s = buildCharacter({
    name: 'Mourn', race: 'Dwarf', class: 'Cleric', subclass: 'Life Domain', level: 1,
    abilities: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 }
  });
  assert.equal(s.subclass, 'Life Domain');
  const disciple = s.features.find(f => f.name === 'Disciple of Life');
  assert.ok(disciple, 'Disciple of Life feature present');
  assert.equal(disciple.source, 'subclass');
  assert.equal(disciple.level, 1);
  // Life Domain's other level-1 feature rides along too
  assert.ok(s.features.some(f => f.name === 'Bonus Proficiency' && f.source === 'subclass'));
  // level-gated: no level-2+ subclass features leak onto a level-1 sheet
  assert.ok(!s.features.some(f => f.name === 'Channel Divinity: Preserve Life'));
  // base math untouched by the subclass
  assert.equal(s.hp.max, 11);
});

test('subclass: ids / slugs / article-stripped names normalize to the SRD key', () => {
  for (const id of ['Life Domain', 'life domain', 'LIFE DOMAIN', 'life_domain', 'life', 'The Life Domain']) {
    assert.equal(buildCharacter({ class: 'Cleric', subclass: id }).subclass, 'Life Domain', `id "${id}"`);
  }
  for (const id of ['The Fiend', 'fiend', 'the fiend', 'the_fiend']) {
    assert.equal(buildCharacter({ class: 'Warlock', subclass: id }).subclass, 'The Fiend', `id "${id}"`);
  }
  assert.equal(buildCharacter({ class: 'Sorcerer', subclass: 'draconic' }).subclass, 'Draconic Bloodline');
});

test('subclass: Tiefling Warlock + The Fiend patron → Dark One\'s Blessing', () => {
  const s = buildCharacter({
    name: 'Vex', race: 'Tiefling', class: 'Warlock', subclass: 'The Fiend', level: 1,
    abilities: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 16 }
  });
  assert.equal(s.subclass, 'The Fiend');
  const blessing = s.features.find(f => f.name === "Dark One's Blessing");
  assert.ok(blessing, "Dark One's Blessing feature present");
  assert.equal(blessing.source, 'subclass');
});

test('subclass ignored for non-chooser classes and unknown values (never throws)', () => {
  // Fighter picks its path at level 3 — a rogue subclass id must be dropped
  const s = buildCharacter({
    name: 'Vael', race: 'Human', class: 'Fighter', subclass: 'Assassin', level: 1,
    abilities: ABIL
  });
  assert.equal(s.subclass, null);
  assert.ok(!s.features.some(f => f.source === 'subclass'));
  // unknown / malformed values on a chooser class: ignored, no throw
  // (note: an ARRAY like ['Life Domain'] stringifies to 'Life Domain' and so
  // resolves — defensive coercion, same never-throw contract as race/class)
  for (const bad of ['Nonsense Domain 9000', '', 42, null, undefined, { nope: true }]) {
    const s2 = buildCharacter({ class: 'Cleric', subclass: bad });
    assert.equal(s2.subclass, null, `subclass ${JSON.stringify(bad)} should resolve to null`);
    assert.ok(!s2.features.some(f => f.source === 'subclass'));
  }
  // a Cleric subclass id on a Warlock (wrong class) is ignored too
  assert.equal(buildCharacter({ class: 'Warlock', subclass: 'Life Domain' }).subclass, null);
});

test('levelUp keeps subclass features on the sheet', () => {
  const s = buildCharacter({ name: 'Mourn', race: 'Dwarf', class: 'Cleric', subclass: 'life', level: 1 });
  levelUp(s);
  assert.equal(s.subclass, 'Life Domain');
  assert.ok(s.features.some(f => f.name === 'Disciple of Life' && f.source === 'subclass'));
  // level 2 unlocks the level-2 domain feature
  assert.ok(s.features.some(f => f.name === 'Channel Divinity: Preserve Life' && f.source === 'subclass'));
});

test('buildCharacter is defensive: empty def builds a default fighter', () => {
  const s = buildCharacter({});
  assert.equal(s.class, 'Fighter');
  assert.equal(s.race, 'Human');
  assert.equal(s.level, 1);
  assert.equal(s.hp.max, 10);                         // d10 + CON 0 (Human +1 → 11 → mod 0)
  assert.ok(s.ac >= 15, `default fighter kit includes chain mail + shield, got AC ${s.ac}`);
  assert.ok(s.attacks.length >= 1);
});

test('levelUp: gains average HP, refreshes slots and features', () => {
  const s = buildCharacter({ name: 'Ilyra', race: 'Elf', class: 'Wizard', level: 1, abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 } });
  const before = s.hp.max;
  levelUp(s);
  assert.equal(s.level, 2);
  // avg per level = floor(6/2)+1 + CON(+2) = 6
  assert.equal(s.hp.max, before + 6);
  assert.equal(s.hp.current, s.hp.max);
  assert.equal(s.spellcasting.slots[1].total, 3);      // level 2 wizard
  assert.equal(s.xp, xpForLevel(2));
});

test('xpForLevel matches the 5E XP table', () => {
  assert.equal(xpForLevel(1), 0);
  assert.equal(xpForLevel(2), 300);
  assert.equal(xpForLevel(5), 6500);
  assert.equal(xpForLevel(20), 355000);
});

test('awarded XP can cross multiple level thresholds without losing the XP total', () => {
  const s = buildCharacter({ name: 'Ilyra', race: 'Elf', class: 'Wizard', level: 1, abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 } });
  const result = awardExperience(s, 6500);
  assert.deepEqual(result, { gained: 6500, levelsGained: 4, level: 5 });
  assert.equal(s.xp, 6500);
  assert.equal(s.proficiencyBonus, 3);
  assert.equal(s.spellcasting.saveDC, 14);
  assert.equal(s.spellcasting.attackBonus, 6);
});

test('buildCombatProfile projects the sheet into a CombatEngine token shape', () => {
  const s = buildCharacter({ name: 'Vael', race: 'Human', class: 'Fighter', level: 1, abilities: ABIL });
  const p = buildCombatProfile(s);
  assert.equal(p.hp, 13);
  assert.equal(p.hpMax, 13);
  assert.equal(p.ac, s.ac);
  assert.ok(p.attacks.length >= 1);
  assert.equal(p.attacks[0].toHit, s.attacks[0].attackBonus);
  assert.equal(p.dexMod, 2);
  assert.equal(p.sheetId, s.id);
});

test('equipping inventory updates armor class, shield state, and weapon loadout', () => {
  const s = buildCharacter({
    name: 'Vael', race: 'Human', class: 'Fighter', level: 1,
    abilities: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
  });
  assert.equal(s.ac, 18);
  assert.deepEqual(s.equipped, ['Longsword']);

  const shield = toggleEquipment(s, 'Shield');
  assert.equal(shield.ok, true);
  assert.equal(shield.equipped, false);
  assert.equal(s.ac, 16);
  assert.equal(s.shield, false);

  const armor = toggleEquipment(s, 'Chain Mail');
  assert.equal(armor.ok, true);
  assert.equal(armor.equipped, false);
  assert.equal(s.ac, 12);
  assert.equal(s.armor, null);
  assert.equal(toggleEquipment(s, 'Chain Mail').equipped, true);
  assert.equal(s.ac, 16);

  const weapon = toggleEquipment(s, 'Crossbow, Light');
  assert.equal(weapon.ok, true);
  assert.deepEqual(s.equipped, ['Crossbow, Light']);
  assert.equal(s.inventory.find(i => i.name === 'Crossbow, Light').equipped, true);
  assert.equal(toggleEquipment(s, 'Dungeoneer\'s Pack').reason, 'not_equippable');
});

test('subrace selection applies custom ASI and traits', () => {
  const hill = buildCharacter({
    name: 'Durin', race: 'Dwarf', subrace: 'Hill Dwarf', class: 'Fighter',
    abilities: { str: 14, dex: 10, con: 14, int: 10, wis: 14, cha: 10 }
  });
  assert.equal(hill.subrace, 'Hill Dwarf');
  assert.equal(hill.abilities.con, 16); // +2 dwarf
  assert.equal(hill.abilities.wis, 15); // +1 hill dwarf
  assert.equal(hill.abilities.str, 14); // no str bonus

  const mountain = buildCharacter({
    name: 'Balin', race: 'Dwarf', subrace: 'Mountain Dwarf', class: 'Fighter',
    abilities: { str: 14, dex: 10, con: 14, int: 10, wis: 14, cha: 10 }
  });
  assert.equal(mountain.subrace, 'Mountain Dwarf');
  assert.equal(mountain.abilities.con, 16); // +2 dwarf
  assert.equal(mountain.abilities.str, 16); // +2 mountain dwarf
  assert.equal(mountain.abilities.wis, 14); // no wis bonus
  assert.ok(mountain.traits.some(t => t.name === 'Dwarven Armor Training'));
});

test('subclasses can be selected for all classes', () => {
  const champion = buildCharacter({
    name: 'Roland', race: 'Human', class: 'Fighter', subclass: 'Champion', level: 3,
    abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 10 }
  });
  assert.equal(champion.subclass, 'Champion');
  assert.ok(champion.features.some(f => f.name === 'Improved Critical' && f.source === 'subclass'));

  const evoker = buildCharacter({
    name: 'Kael', race: 'Elf', subrace: 'High Elf', class: 'Wizard', subclass: 'School of Evocation', level: 2,
    abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }
  });
  assert.equal(evoker.subrace, 'High Elf');
  assert.equal(evoker.subclass, 'School of Evocation');
  assert.ok(evoker.features.some(f => f.name === 'Evocation Savant' && f.source === 'subclass'));
  assert.ok(evoker.features.some(f => f.name === 'Sculpt Spells' && f.source === 'subclass'));
});
