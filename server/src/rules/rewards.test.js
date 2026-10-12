import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCharacter } from './CharacterEngine.js';
import { awardVictoryRewards, experienceForCr } from './Rewards.js';

const makePlayer = (id, name) => {
  const sheet = buildCharacter({ name, race: 'Human', class: 'Fighter', level: 1 });
  return { id, name, kind: 'player', hp: sheet.hp.current, hpMax: sheet.hp.max, sheet };
};

test('CR XP table maps SRD challenge ratings to 5E experience', () => {
  assert.equal(experienceForCr(0.25), 50);
  assert.equal(experienceForCr(0.5), 100);
  assert.equal(experienceForCr(12), 8400);
  assert.equal(experienceForCr('unknown'), 0);
});

test('victory XP is divided across participants and healing potions are added to inventory', () => {
  const players = [makePlayer('p1', 'Vael'), makePlayer('p2', 'Mourn')];
  const initialWeights = players.map(player => player.sheet.carrying.weight);
  const result = awardVictoryRewards([
    { cr: 0.25 }, { cr: 0.25 }, { cr: 0.5 },
  ], players);

  assert.equal(result.totalXp, 200);
  assert.deepEqual(result.awards.map(a => a.xp), [100, 100]);
  for (const [index, player] of players.entries()) {
    assert.equal(player.sheet.xp, 100);
    assert.equal(player.sheet.inventory.find(i => i.name === 'Potion of Healing').qty, 1);
    assert.equal(player.sheet.equipment.find(i => i.name === 'Potion of Healing').qty, 1);
    assert.equal(player.sheet.carrying.weight, initialWeights[index] + 0.5);
  }
});
