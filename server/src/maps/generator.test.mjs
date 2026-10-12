import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDungeon, validateDungeon } from './generator.mjs';

const SIZES = ['small', 'medium', 'large'];
const SEEDS = [7, 42, 41003];

test('seeded crypt layouts use compatible authored modules and connected boss arenas', () => {
  for (const size of SIZES) for (const seed of SEEDS) {
    const map = generateDungeon({ size, seed });
    const again = generateDungeon({ size, seed });
    assert.deepEqual(map, again, `${size} seed ${seed} should be deterministic`);

    const validation = validateDungeon(map);
    assert.equal(validation.ok, true, `${size} seed ${seed}: ${validation.errors.join('; ')}`);
    assert.equal(map.roomRects[0].module, 'entry_vestibule');
    assert.ok(['warden_arena', 'warden_sanctum'].includes(
      map.roomRects.find((room) => room.id === map.bossRoom)?.module));
    assert.ok(map.corridorLinks.length >= map.roomRects.length - 1);
    assert.ok(map.roomRects.some((room) => room.module === 'ossuary' || room.module === 'burial_chapel' || room.module === 'processional_gallery'));
    assert.equal(map.exits.length, 1);
    assert.equal(map.exits[0].returnToPrevious, true);
    assert.equal(map.exits[0].destinationMapId, undefined);
    assert.equal(map.exits[0].x, map.spawns.party[0][0] + 2);
    assert.equal(map.exits[0].z, map.spawns.party[0][1] + 0.5);

    const boss = map.roomRects.find((room) => room.id === map.bossRoom);
    const bossToken = map.spawns.monsters.find((monster) => monster.monsterId === 'specter');
    assert.equal(Math.floor(bossToken.x), Math.floor((boss.x1 + boss.x2) / 2));
    assert.equal(Math.floor(bossToken.z), Math.floor((boss.z1 + boss.z2) / 2));
  }
});

test('connector metadata only joins matching two-cell module sockets', () => {
  const map = generateDungeon({ size: 'large', seed: 99173 });
  const rooms = new Map(map.roomRects.map((room) => [room.id, room]));
  for (const link of map.corridorLinks) {
    assert.equal(link.connector, 'crypt_arch_2');
    assert.equal(rooms.get(link.from).sockets[link.fromPort], link.connector);
    assert.equal(rooms.get(link.to).sockets[link.toPort], link.connector);
  }
});
