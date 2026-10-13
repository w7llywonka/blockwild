import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, BLOCKS, ITEMS, RECIPES } from '../dist/engine.js';

function flatGame(options = {}) {
  const game = new Game({ seed: 'test-world', ...options });
  for (let y = 0; y < 50; y++) {
    for (let x = 140; x <= 180; x++) game.set(x, y, y >= 35 ? BLOCKS.DIRT : BLOCKS.AIR);
  }
  game.player.x = 160.15;
  game.player.y = 33.19;
  game._fallStart = game.player.y;
  game.mobs = [];
  return game;
}

function advance(game, seconds, input = {}) {
  const frames = Math.ceil(seconds * 60);
  for (let i = 0; i < frames; i++) game.step(1 / 60, input);
}

function breakBlock(game, x, y) {
  let result;
  for (let i = 0; i < 50; i++) {
    result = game.mine(x, y, .1);
    if (!result.ok || result.broken) return result;
  }
  return result;
}

test('the same seed makes the same complete world and different seeds differ', () => {
  const a = new Game({ seed: 'island' }), b = new Game({ seed: 'island' }), c = new Game({ seed: 'mountain' });
  assert.deepEqual(a.tiles, b.tiles);
  assert.notDeepEqual(a.tiles, c.tiles);
  for (const id of [BLOCKS.WOOD, BLOCKS.LEAVES, BLOCKS.WATER, BLOCKS.COAL, BLOCKS.IRON, BLOCKS.DIAMOND, BLOCKS.BEDROCK]) assert.ok(a.tiles.includes(id));
  assert.equal(a.tiles.length, 32000);
  assert.equal(a._collides(a.player), false);
  assert.equal(a.inventory.wood_pickaxe || 0, 0);
  assert.deepEqual(Object.keys(a.inventory), [], 'survival begins with empty hands and inventory');
});

test('walking, walls, jumping, landing, and held jump have consistent collision', () => {
  const game = flatGame();
  advance(game, .2);
  assert.ok(game.player.grounded);
  const start = game.player.x;
  advance(game, .5, { right: true });
  assert.ok(game.player.x > start + 2.4);
  for (let y = 31; y < 35; y++) game.set(164, y, BLOCKS.STONE);
  advance(game, .7, { right: true });
  assert.ok(game.player.x + game.player.w <= 164.002);
  const groundedY = game.player.y;
  advance(game, .15, { jump: true });
  assert.ok(game.player.y < groundedY - .7);
  advance(game, 1.5, { jump: true });
  assert.ok(game.player.grounded, 'holding jump must not jump repeatedly');
  assert.ok(Math.abs(game.player.y - groundedY) < .01);
  assert.equal(game._collides(game.player), false);
});

test('survival progression goes from hand mining through all pickaxe tiers and smelting', () => {
  const game = flatGame();
  for (let i = 0; i < 5; i++) {
    game.set(162, 33, BLOCKS.WOOD);
    assert.equal(breakBlock(game, 162, 33).item, 'wood');
    assert.equal(game.craft('planks').ok, true);
  }
  assert.equal(game.inventory.planks, 20);
  assert.equal(game.craft('workbench').ok, true);
  assert.equal(game.craft('stick').ok, true);
  assert.equal(game.craft('wood_pickaxe').ok, false, 'a table must be placed');
  game.select(7);
  assert.equal(game.place(162, 34).ok, true);
  assert.equal(game.nearStation('workbench'), true);
  assert.equal(game.craft('wood_pickaxe').ok, true);
  game.select(0);
  game.set(162, 33, BLOCKS.IRON);
  assert.equal(breakBlock(game, 162, 33).ok, false);
  for (let i = 0; i < 11; i++) {
    game.set(162, 33, BLOCKS.STONE);
    assert.equal(breakBlock(game, 162, 33).item, 'stone');
  }
  assert.equal(game.craft('stone_pickaxe').ok, true);
  assert.equal(game.craft('furnace').ok, true);
  game.assignHotbar(6, 'furnace');
  game.select(6);
  assert.equal(game.place(163, 34).ok, true);
  game.assignHotbar(0, 'stone_pickaxe');
  game.select(0);
  for (let i = 0; i < 3; i++) {
    game.set(162, 33, BLOCKS.IRON);
    assert.equal(breakBlock(game, 162, 33).item, 'iron_ore');
    game.set(162, 33, BLOCKS.COAL);
    assert.equal(breakBlock(game, 162, 33).item, 'coal');
    assert.equal(game.craft('iron_ingot').ok, true);
  }
  assert.equal(game.craft('stick').ok, true);
  assert.equal(game.craft('iron_pickaxe').ok, true);
  game.assignHotbar(0, 'iron_pickaxe');
  for (let i = 0; i < 3; i++) {
    game.set(162, 33, BLOCKS.DIAMOND);
    assert.equal(breakBlock(game, 162, 33).item, 'diamond');
  }
  assert.equal(game.craft('diamond_pickaxe').ok, true);
  assert.equal(game.inventory.diamond_pickaxe, 1);
  assert.equal(game.stats.mined, 25);
  assert.equal(game.inventory.iron_ore, 0);
  assert.equal(game.inventory.coal, 0);
});

test('mining respects reach, selected tool ownership, bedrock and target changes', () => {
  const game = flatGame();
  game.set(163, 33, BLOCKS.STONE);
  assert.equal(game.mine(163, 33, .1).ok, false, 'empty pickaxe hotbar does not count as owning one');
  game.inventory.wood_pickaxe = 1;
  assert.equal(game.mine(163, 33, .1).ok, true);
  assert.ok(game.mining.progress > 0);
  game.set(162, 33, BLOCKS.DIRT);
  assert.equal(game.mine(162, 33, .01).ok, true);
  assert.equal(game.mining.x, 162);
  assert.ok(game.mining.progress < .1);
  game.set(173, 33, BLOCKS.DIRT);
  assert.equal(game.mine(173, 33, .1).ok, false);
  assert.equal(game.mining, null);
  game.set(162, 33, BLOCKS.BEDROCK);
  assert.equal(breakBlock(game, 162, 33).ok, false);
  assert.equal(game.mine(NaN, 2, .1).ok, false);
});

test('building consumes inventory and rejects player overlap and occupied targets', () => {
  const game = flatGame();
  game.inventory.dirt = 3;
  game.select(1);
  assert.equal(game.place(160, 34).ok, false);
  assert.equal(game.place(161, 35).ok, false);
  assert.equal(game.inventory.dirt, 3);
  assert.equal(game.place(163, 34).ok, true);
  assert.equal(game.get(163, 34), BLOCKS.DIRT);
  assert.equal(game.inventory.dirt, 2);
  assert.equal(game.place(173, 34).ok, false);
  assert.equal(game.stats.placed, 1);
});

test('food restores hunger, starvation drops inventory, and the player can recover it', () => {
  const game = flatGame();
  game.inventory.apple = 3;
  game.select(5);
  assert.equal(game.useSelected().ok, false);
  game.player.hunger = 12;
  assert.equal(game.useSelected().ok, true);
  assert.equal(game.player.hunger, 16);
  assert.equal(game.inventory.apple, 2);
  game.player.hunger = 0;
  game.player.health = 1;
  advance(game, 6);
  assert.equal(game.dead, true);
  assert.equal(game.player.health, 0);
  assert.equal(game.inventory.apple || 0, 0);
  assert.equal(game.drops.find(d => d.item === 'apple').count, 2);
  game.respawn();
  assert.equal(game.dead, false);
  assert.equal(game.player.health, 20);
  assert.equal(game.inventory.apple || 0, 0);
  advance(game, 2.3);
  assert.equal(game.inventory.apple, 2);
  assert.equal(game._collides(game.player), false);
});

test('long falls damage survival players while creative mode has no damage or costs', () => {
  const game = flatGame();
  game.player.y = 10;
  game._fallStart = 10;
  advance(game, 2);
  assert.ok(game.player.health < 20);
  const creative = flatGame({ mode: 'creative' });
  creative.player.y = 10;
  creative._fallStart = 10;
  advance(creative, 2);
  assert.equal(creative.player.health, 20);
  assert.equal(creative.dead, false);
  creative.select(1);
  const count = creative.inventory.dirt;
  assert.equal(creative.place(162, 34).ok, true);
  assert.equal(creative.inventory.dirt, count);
  creative.set(163, 34, BLOCKS.DIAMOND);
  assert.equal(creative.mine(163, 34, .001).broken, true);
});

test('combat drops food and zombies damage at night with a cooldown', () => {
  const game = flatGame();
  game.time = .75;
  game.inventory.wood_sword = 1;
  game.select(8);
  game.mobs = [{ id: 99, type: 'sheep', x: 161.2, y: 34.05, w: 1.15, h: .95, vx: 0, vy: 0, health: 6, facing: 1, timer: 10, attackClock: 0 }];
  assert.equal(game.attack(161.5, 34.5).ok, true);
  assert.equal(game.attack(161.5, 34.5).ok, false, 'attack cooldown');
  advance(game, .36);
  const sheep = game.mobs[0];
  assert.equal(game.attack(sheep.x + .5, sheep.y + .5).ok, true);
  assert.equal(game.inventory.raw_mutton, 2);
  assert.equal(game.inventory.wool, 1);
  assert.equal(game.stats.kills, 1);
  game.mobs = [{ id: 100, type: 'zombie', x: game.player.x + .3, y: game.player.y, w: .65, h: 1.75, vx: 0, vy: 0, health: 12, facing: -1, timer: 0, attackClock: 0 }];
  advance(game, .1);
  assert.equal(game.player.health, 18);
  advance(game, .1);
  assert.equal(game.player.health, 18);
});

test('world save round trips player, blocks, progression, hotbar, day and mobs', () => {
  const game = flatGame();
  game.inventory.wood = 7;
  game.inventory.iron_ingot = 4;
  game.set(163, 34, BLOCKS.FURNACE);
  game.stats.mined = 123;
  game.time = .9;
  game.day = 12;
  game.assignHotbar(0, 'iron_pickaxe');
  game.selected = 4;
  const saved = JSON.parse(JSON.stringify(game.serialize()));
  const restored = Game.deserialize(saved);
  assert.deepEqual(restored.serialize(), saved);
  restored.set(163, 34, BLOCKS.AIR);
  assert.equal(game.get(163, 34), BLOCKS.FURNACE, 'restored arrays do not alias source');
});

test('save validation rejects malformed worlds, item injection, non-finite values and unknown versions', () => {
  const game = flatGame();
  const cases = [
    save => { save.version = 9000; },
    save => { save.tiles = [0]; },
    save => { save.tiles[2] = 250; },
    save => { save.player.x = Infinity; },
    save => { save.inventory.wood = -1; },
    save => { save.inventory.injected = 1; },
    save => { save.hotbar[0] = '__proto__'; },
    save => { save.time = 1.1; },
    save => { save.day = 0; },
    save => { save.mobs = [{ type: 'sheep' }]; },
  ];
  for (const change of cases) {
    const save = game.serialize();
    change(save);
    assert.throws(() => Game.deserialize(save), /invalid|unsupported/);
  }
  assert.equal(Game.deserialize(JSON.stringify(game.serialize())).seed, game.seed);
});

test('every recipe refers to existing items and cannot spend ingredients twice', () => {
  const game = flatGame();
  for (const recipe of RECIPES) {
    assert.ok(ITEMS[recipe.output[0]]);
    for (const ingredient of Object.keys(recipe.cost)) assert.ok(ITEMS[ingredient]);
  }
  game.inventory.wood = 1;
  assert.equal(game.craft('planks').ok, true);
  assert.equal(game.craft('planks').ok, false);
  assert.equal(game.inventory.planks, 4);
  assert.equal(game.inventory.wood, 0);
});

test('station crafting and interaction share the same five-tile reach boundary', () => {
  const game = flatGame();
  Object.assign(game.player, { x: 160.2, y: 33.2 });
  Object.assign(game.inventory, { iron_ore: 1, coal: 1, planks: 3, stick: 2 });
  game.set(165, 34, BLOCKS.FURNACE);
  assert.equal(game.interact(165, 34).action, 'furnace');
  assert.equal(game.nearStation('furnace'), true);
  assert.equal(game.canCraft('iron_ingot'), true);
  game.set(165, 34, BLOCKS.WORKBENCH);
  assert.equal(game.interact(165, 34).action, 'crafting');
  assert.equal(game.nearStation('workbench'), true);
  assert.equal(game.canCraft('wood_pickaxe'), true);
  game.player.x = 160.15;
  assert.equal(game.interact(165, 34).ok, false);
  assert.equal(game.nearStation('workbench'), false);
  assert.equal(game.canCraft('wood_pickaxe'), false);
});

test('doors place atomically, toggle both halves, block collisions and drop once', () => {
  const game = flatGame();
  game.inventory.door = 2;
  game.assignHotbar(0, 'door');
  game.set(162, 33, BLOCKS.STONE);
  assert.equal(game.place(162, 34).ok, false);
  assert.equal(game.get(162, 34), BLOCKS.AIR);
  assert.equal(game.inventory.door, 2);
  game.set(162, 33, BLOCKS.AIR);
  assert.equal(game.place(162, 34).ok, true);
  assert.equal(game.get(162, 33), BLOCKS.DOOR_TOP);
  assert.equal(game.isSolid(162, 34), true);
  assert.equal(game.interact(162, 33).ok, true);
  assert.equal(game.get(162, 34), BLOCKS.DOOR_OPEN_BOTTOM);
  assert.equal(game.isSolid(162, 33), false);
  game.player.x = 162.1;
  assert.equal(game.interact(162, 34).ok, false, 'cannot close on a player');
  game.player.x = 160.15;
  assert.equal(game.interact(162, 34).ok, true);
  assert.equal(breakBlock(game, 162, 33).item, 'door');
  assert.equal(game.get(162, 34), BLOCKS.AIR);
  assert.equal(game.get(162, 33), BLOCKS.AIR);
  assert.equal(game.inventory.door, 2, 'mining either half only drops one door');
});

test('two-block beds set spawn in daylight, sleep at night, respawn safely and drop once', () => {
  const game = flatGame();
  game.inventory.bed = 1;
  game.assignHotbar(0, 'bed');
  assert.equal(game.place(162, 34).ok, true);
  assert.equal(game.get(163, 34), BLOCKS.BED_HEAD);
  assert.equal(game.interact(163, 34).ok, false, 'no sleeping in daylight');
  assert.deepEqual(game.spawnPoint, { x: 162, y: 34 });
  game.time = .75;
  const day = game.day;
  assert.equal(game.interact(162, 34).action, 'sleep');
  assert.equal(game.time, .03);
  assert.equal(game.day, day + 1);
  game.player.x = 170;
  game.respawn();
  assert.ok(Math.abs(game.player.x - 162) < 1);
  assert.equal(game._collides(game.player), false);
  game.player.x = 160.15;
  assert.equal(breakBlock(game, 163, 34).item, 'bed');
  assert.equal(game.get(162, 34), BLOCKS.AIR);
  assert.equal(game.inventory.bed, 1);
  assert.equal(game.spawnPoint, null);
});

test('chests conserve items, reject invalid transfers, and return contents when broken', () => {
  const game = flatGame();
  game.inventory.chest = 1;
  game.inventory.wood = 9;
  game.inventory.wood_pickaxe = 1;
  game.durability.wood_pickaxe = 12;
  game.assignHotbar(1, 'chest');
  game.select(1);
  assert.equal(game.place(162, 34).ok, true);
  assert.equal(game.interact(162, 34).action, 'chest');
  assert.equal(game.transferChest(162, 34, 'wood', 7, 'deposit').ok, true);
  assert.equal(game.inventory.wood, 2);
  assert.equal(game.chests['162,34'].wood, 7);
  assert.equal(game.transferChest(162, 34, 'wood', 3, 'deposit').ok, false);
  assert.equal(game.transferChest(162, 34, 'wood', -1, 'withdraw').ok, false);
  assert.equal(game.transferChest(162, 34, 'wood', 2, 'withdraw').ok, true);
  assert.equal(game.inventory.wood, 4);
  assert.equal(game.chests['162,34'].wood, 5);
  assert.equal(game.transferChest(162, 34, 'wood_pickaxe', 1, 'deposit').ok, true);
  assert.equal(game.transferChest(162, 34, 'wood_pickaxe', 1, 'withdraw').ok, true);
  assert.equal(game.getDurability('wood_pickaxe').current, 12, 'storage cannot repair tools');
  assert.equal(breakBlock(game, 162, 34).item, 'chest');
  assert.equal(game.inventory.wood, 9);
  assert.equal(game.inventory.chest, 1);
  assert.equal(game.chests['162,34'], undefined);
});

test('hoes till soil, seeds grow faster near water, ripe harvest yields wheat and seeds', () => {
  const game = flatGame();
  game.inventory.wood_hoe = 1;
  game.inventory.seeds = 2;
  game.assignHotbar(0, 'wood_hoe');
  assert.equal(game.interact(162, 35).action, 'till');
  assert.equal(game.interact(157, 35).action, 'till');
  assert.equal(game.getDurability('wood_hoe').current, 57);
  game.assignHotbar(0, 'seeds');
  assert.equal(game.interact(162, 35).action, 'plant');
  assert.equal(game.interact(157, 34).action, 'plant');
  assert.equal(game.inventory.seeds, 0);
  assert.equal(game.interact(163, 35).ok, false);
  game.set(166, 35, BLOCKS.WATER);
  advance(game, 92);
  assert.equal(game.get(162, 34), BLOCKS.WHEAT_RIPE);
  assert.equal(game.get(157, 34), BLOCKS.WHEAT);
  assert.equal(breakBlock(game, 162, 34).item, 'wheat');
  assert.equal(game.inventory.wheat, 1);
  assert.equal(game.inventory.seeds, 2);
  assert.equal(breakBlock(game, 157, 34).item, 'seeds');
  assert.equal(game.inventory.seeds, 3);
  assert.deepEqual(Object.keys(game.cropGrowth), []);
});

test('tools wear down on their actions, break, and start the next tool at full durability', () => {
  const game = flatGame();
  game.inventory.wood_pickaxe = 2;
  game.durability.wood_pickaxe = 1;
  game.set(162, 33, BLOCKS.STONE);
  assert.equal(breakBlock(game, 162, 33).broken, true);
  assert.equal(game.inventory.wood_pickaxe, 1);
  assert.deepEqual(game.getDurability('wood_pickaxe'), { current: 59, max: 59 });
  game.durability.wood_pickaxe = 1;
  game.set(162, 33, BLOCKS.STONE);
  assert.equal(breakBlock(game, 162, 33).broken, true);
  assert.equal(game.inventory.wood_pickaxe, 0);
  assert.equal(game.getDurability('wood_pickaxe'), null);
  game.set(162, 33, BLOCKS.STONE);
  assert.equal(game.mine(162, 33, .1).ok, false);
  const creative = flatGame({ mode: 'creative' });
  creative.set(162, 33, BLOCKS.STONE);
  creative.mine(162, 33, .1);
  assert.equal(creative.getDurability('wood_pickaxe').current, 59);
});

test('timed furnaces consume once, survive saves, finish after heating and collect once', () => {
  let game = flatGame();
  game.set(162, 34, BLOCKS.FURNACE);
  game.inventory.iron_ore = 2;
  game.inventory.coal = 2;
  assert.equal(game.startSmelt(162, 34, 'iron_ingot').ok, true);
  assert.equal(game.inventory.iron_ore, 1);
  assert.equal(game.inventory.coal, 1);
  assert.equal(game.startSmelt(162, 34, 'iron_ingot').ok, false);
  assert.equal(game.collectFurnace(162, 34).ok, false);
  advance(game, 5);
  game = Game.deserialize(game.serialize());
  assert.ok(game.furnaces['162,34'].remaining > 4.9 && game.furnaces['162,34'].remaining < 5.1);
  advance(game, 5.1);
  assert.equal(game.inventory.iron_ingot || 0, 0, 'finished output remains inside furnace');
  assert.equal(game.collectFurnace(162, 34).ok, true);
  assert.equal(game.inventory.iron_ingot, 1);
  assert.equal(game.collectFurnace(162, 34).ok, false);
  assert.equal(game.startSmelt(162, 34, 'iron_ingot').ok, true);
  game.inventory.wood_pickaxe = 1;
  assert.equal(breakBlock(game, 162, 34).broken, true);
  assert.equal(game.inventory.iron_ore, 1, 'unfinished input is recovered when furnace breaks');
  assert.equal(game.inventory.coal, 1);
  assert.equal(game.furnaces['162,34'], undefined);
});

test('death drops preserve worn tools, recover once, and expire after five active minutes', () => {
  const game = flatGame();
  game.inventory.wood_pickaxe = 1;
  game.durability.wood_pickaxe = 17;
  game._damage(20);
  assert.equal(game.drops.length, 1);
  assert.equal(game.drops[0].durability, 17);
  assert.equal(game.getDurability('wood_pickaxe'), null);
  const restored = Game.deserialize(game.serialize());
  assert.equal(restored.drops[0].durability, 17);
  restored.respawn();
  advance(restored, 2.3);
  assert.equal(restored.inventory.wood_pickaxe, 1);
  assert.equal(restored.getDurability('wood_pickaxe').current, 17);
  assert.equal(restored.drops.length, 0);
  restored.drops.push({ x: 200, y: 20, item: 'dirt', count: 3, age: 299.9 });
  advance(restored, .2);
  assert.equal(restored.drops.length, 0);
});

test('legacy version-one saves retain their original inventories with new systems defaulted', () => {
  const game = flatGame();
  const legacy = game.serialize();
  for (const key of ['durability', 'chests', 'furnaces', 'cropGrowth', 'spawnPoint', 'drops']) delete legacy[key];
  legacy.inventory = { apple: 3, torch: 8, wood_pickaxe: 1 };
  const restored = Game.deserialize(legacy);
  assert.equal(restored.inventory.apple, 3);
  assert.equal(restored.inventory.torch, 8);
  assert.equal(restored.getDurability('wood_pickaxe').current, 59);
  assert.deepEqual(Object.keys(restored.chests), []);
  assert.deepEqual(restored.drops, []);
  assert.equal(restored.spawnPoint, null);
});

test('shelter, growing crops, stored items, furnace output and tool wear round trip together', () => {
  const game = flatGame();
  game.set(154, 34, BLOCKS.CHEST);
  game.chests['154,34'] = { wood: 9, seeds: 3 };
  game.set(156, 34, BLOCKS.FURNACE);
  game.furnaces['156,34'] = { recipeId: 'glass', remaining: 0, output: ['glass', 1] };
  game.set(162, 34, BLOCKS.BED);
  game.set(163, 34, BLOCKS.BED_HEAD);
  game.spawnPoint = { x: 162, y: 34 };
  game.set(164, 35, BLOCKS.FARMLAND);
  game.set(164, 34, BLOCKS.WHEAT);
  game.cropGrowth['164,34'] = 74.5;
  game.inventory.iron_axe = 1;
  game.durability.iron_axe = 230;
  const save = game.serialize();
  const restored = Game.deserialize(JSON.stringify(save));
  assert.deepEqual(restored.serialize(), save);
  restored.chests['154,34'].wood = 0;
  restored.furnaces['156,34'].output[1] = 2;
  assert.equal(game.chests['154,34'].wood, 9);
  assert.equal(game.furnaces['156,34'].output[1], 1);
});

test('extended save metadata rejects impossible jobs, invalid containers, bad tools and crops', () => {
  const game = flatGame();
  const cases = [
    save => { save.durability = { wood_pickaxe: 60 }; },
    save => { save.chests = { '160,35': { diamond: 10 } }; },
    save => { save.cropGrowth = { '1,1': 50 }; },
    save => { save.spawnPoint = { x: 162, y: 34 }; },
    save => { save.furnaces = { '160,35': { recipeId: 'iron_ingot', remaining: 0, output: ['diamond', 99] } }; },
    save => { save.drops = [{ x: 1, y: 1, item: 'wood_pickaxe', count: 1, age: 0, durability: -1 }]; },
  ];
  for (const change of cases) {
    const save = game.serialize();
    change(save);
    assert.throws(() => Game.deserialize(save), /invalid|unsupported/);
  }
});
