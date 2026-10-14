// server/src/rules/srd.test.js
// Unit tests for the deterministic SRD database query engine
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  list_top_level, keys, get, count, slice, search, filter,
  get_race, get_class, get_class_features, get_spell_slots,
  get_spell_list, get_spell, get_equipment_stats, get_feat, get_background
} from './srd.js';

test('SRD: list_top_level returns all expected core sections', () => {
  const top = list_top_level();
  assert.ok(Array.isArray(top));
  const expected = [
    'meta', 'ability_scores', 'skills', 'alignments', 'conditions',
    'languages', 'proficiency_bonus', 'races', 'classes', 'backgrounds',
    'feats', 'equipment', 'spells'
  ];
  for (const exp of expected) {
    assert.ok(top.includes(exp), `Missing section: ${exp}`);
  }
});

test('SRD: keys and get navigate exact JSON paths', () => {
  const classKeys = keys('/classes');
  assert.ok(classKeys.includes('Fighter'));
  assert.ok(classKeys.includes('Wizard'));
  assert.ok(classKeys.includes('Cleric'));

  const hitDie = get('/classes/Fighter/hit_die');
  assert.equal(hitDie, 10);

  const wizardSubclasses = keys('/classes/Wizard/subclasses');
  assert.ok(Array.isArray(wizardSubclasses));
  assert.ok(wizardSubclasses.length > 0);
});

test('SRD: count and slice work for arrays and objects', () => {
  const raceCount = count('/races');
  assert.ok(raceCount >= 9);

  const firstTwoRaces = slice('/races', 0, 2);
  assert.equal(Object.keys(firstTwoRaces).length, 2);
});

test('SRD: get_race returns canonical data with subrace folding', () => {
  const dwarf = get_race('Dwarf');
  assert.ok(dwarf);
  assert.equal(dwarf.name, 'Dwarf');
  assert.equal(dwarf.ability_score_increase.CON, 2);
  assert.equal(dwarf.darkvision, 60);

  const hillDwarf = get_race('Dwarf', 'Hill Dwarf');
  assert.ok(hillDwarf);
  assert.equal(hillDwarf.ability_score_increase.CON, 2);
  assert.equal(hillDwarf.ability_score_increase.WIS, 1);
  assert.equal(hillDwarf.chosen_subrace, 'Hill Dwarf');

  const elf = get_race('Elf', 'Wood Elf');
  assert.ok(elf);
  assert.equal(elf.ability_score_increase.DEX, 2);
  assert.equal(elf.ability_score_increase.WIS, 1);
});

test('SRD: get_class resolves class stats, features, and level-indexed spellcasting', () => {
  const fighter = get_class('Fighter', null, 5);
  assert.ok(fighter);
  assert.equal(fighter.name, 'Fighter');
  assert.equal(fighter.hit_die, 10);
  assert.deepEqual(fighter.saving_throws, ['STR', 'CON']);
  assert.ok(fighter.features.some((f) => f.name === 'Action Surge'));

  // Caster class level tables
  const wizard = get_class('Wizard', null, 5);
  assert.ok(wizard);
  assert.ok(wizard.spellcasting);
  assert.equal(wizard.spellcasting.ability, 'INT');
  // At level 5: 1st: 4, 2nd: 3, 3rd: 2
  assert.equal(wizard.spellcasting.slots['1'], 4);
  assert.equal(wizard.spellcasting.slots['2'], 3);
  assert.equal(wizard.spellcasting.slots['3'], 3);
});

test('SRD: get_spell_slots returns exact slot table for level', () => {
  const slots3 = get_spell_slots('Cleric', 3);
  assert.equal(slots3['1'], 4);
  assert.equal(slots3['2'], 2);
});

test('SRD: get_spell_list retrieves spells filtered by class and level', () => {
  const cantrips = get_spell_list('Wizard', 0);
  assert.ok(cantrips.length > 0);
  for (const s of cantrips) {
    assert.equal(s.level, 0);
  }
});

test('SRD: get_spell retrieves Fireball with components and damage', () => {
  const fireball = get_spell('Fireball');
  assert.ok(fireball);
  assert.equal(fireball.level, 3);
  assert.equal(fireball.school, 'Evocation');
  assert.ok(fireball.range);
  assert.ok(fireball.components);
});

test('SRD: get_equipment_stats finds weapons and armor case-insensitively with trimmed keys', () => {
  const chainMail = get_equipment_stats('Chain Mail');
  assert.ok(chainMail);
  assert.equal(chainMail.ac, 16);
  assert.equal(chainMail.type, 'armor');
  assert.equal(chainMail.category, 'heavy');

  const dagger = get_equipment_stats('dagger');
  assert.ok(dagger);
  assert.equal(dagger.type, 'weapon');
  assert.ok(dagger.damage);

  const pack = get_equipment_stats("Explorer's Pack");
  assert.ok(pack);
  assert.equal(pack.type, 'pack');
});

test('SRD: get_feat and get_background retrieve lore and mechanics', () => {
  const alert = get_feat('Alert');
  assert.ok(alert);
  assert.equal(alert.prerequisite, 'None');

  const acolyte = get_background('Acolyte');
  assert.ok(acolyte);
  assert.ok(acolyte.skill_proficiencies.includes('Insight'));
  assert.ok(acolyte.skill_proficiencies.includes('Religion'));
});
