import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, RECIPES } from '../dist/engine.js';
import { PATTERNS, recipeForGrid, fillRecipeGrid } from '../dist/crafting.js';

const recipe = id => RECIPES.find(entry => entry.id === id);
const grid = rows => rows.flat();

test('inventory recipes work at every valid translation and preserve recipe identity', () => {
  for (const size of [2, 3]) {
    for (let i = 0; i < size * size; i++) {
      const cells = Array(size * size).fill(null);
      cells[i] = 'wood';
      assert.equal(recipeForGrid(cells, size), recipe('planks'));
    }
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size - 1; y++) {
        const cells = Array(size * size).fill(null);
        cells[y * size + x] = 'planks';
        cells[(y + 1) * size + x] = 'planks';
        assert.equal(recipeForGrid(cells, size), recipe('stick'));
      }
    }
  }
  assert.equal(recipeForGrid(['coal', null, 'stick', null], 2), recipe('torch'));
  assert.equal(recipeForGrid(['planks', 'planks', 'planks', 'planks'], 2), recipe('workbench'));
});

test('orientation and empty cells matter; extras and rotations do not craft', () => {
  for (const cells of [
    ['planks', 'planks', null, null],
    ['stick', null, 'coal', null],
    ['wood', null, null, 'wood'],
    ['wood', null, null, 'dirt'],
    ['planks', null, null, 'planks'],
  ]) assert.equal(recipeForGrid(cells, 2), null);
  const furnace = fillRecipeGrid('furnace', 3);
  furnace[4] = 'stone';
  assert.equal(recipeForGrid(furnace, 3), null);
  assert.equal(recipeForGrid(grid([
    ['planks', 'planks', 'planks'],
    ['stick', null, null],
    ['stick', null, null],
  ]), 3), null);
});

test('table tools support their familiar shapes, horizontal mirrors, and translations', () => {
  for (const material of ['wood', 'stone', 'iron']) {
    for (const tool of ['pickaxe', 'sword', 'axe', 'hoe']) {
      const id = `${material}_${tool}`;
      assert.ok(recipe(id), `missing ${id}`);
      const cells = fillRecipeGrid(id, 3);
      assert.equal(recipeForGrid(cells, 3), recipe(id));
      const mirror = [cells.slice(0, 3).reverse(), cells.slice(3, 6).reverse(), cells.slice(6, 9).reverse()].flat();
      assert.equal(recipeForGrid(mirror, 3), recipe(id));
      if (PATTERNS[id][0].length < 3) {
        const shifted = Array(9).fill(null);
        PATTERNS[id].forEach((row, y) => row.forEach((item, x) => { shifted[y * 3 + x + 1] = item; }));
        assert.equal(recipeForGrid(shifted, 3), recipe(id));
      }
    }
  }
});

test('bed, door, chest, and bread use vanilla arrangements and exact recipe costs', () => {
  assert.equal(recipeForGrid(grid([
    ['wool', 'wool', 'wool'],
    ['planks', 'planks', 'planks'],
    [null, null, null],
  ]), 3), recipe('bed'));
  assert.equal(recipeForGrid(grid([
    [null, 'planks', 'planks'],
    [null, 'planks', 'planks'],
    [null, 'planks', 'planks'],
  ]), 3), recipe('door'));
  assert.equal(recipeForGrid(grid([
    [null, null, null],
    [null, null, null],
    ['wheat', 'wheat', 'wheat'],
  ]), 3), recipe('bread'));
  for (const id of ['bed', 'door', 'chest', 'bread']) {
    assert.ok(recipe(id), `missing ${id}`);
    assert.equal(recipeForGrid(fillRecipeGrid(id, 3), 3), recipe(id));
  }
});

test('all grid recipes use known items, consume exact ingredient counts, and round-trip', () => {
  for (const entry of RECIPES.filter(entry => entry.station !== 'furnace')) {
    assert.ok(PATTERNS[entry.id], `missing pattern ${entry.id}`);
    const counts = {};
    for (const item of PATTERNS[entry.id].flat().filter(Boolean)) {
      assert.ok(ITEMS[item], `unknown ingredient ${item}`);
      counts[item] = (counts[item] || 0) + 1;
    }
    assert.deepEqual(counts, entry.cost, `${entry.id} ingredients`);
    const cells = fillRecipeGrid(entry.id, 3);
    const before = [...cells];
    assert.equal(recipeForGrid(cells, 3), entry);
    assert.deepEqual(cells, before, 'matching never mutates the input');
  }
});

test('inventory crafting excludes table recipes and all grids exclude furnace recipes', () => {
  for (const id of ['wood_pickaxe', 'wood_sword', 'wood_axe', 'wood_hoe', 'furnace', 'bed', 'door', 'chest', 'bread']) {
    assert.equal(fillRecipeGrid(id, 2), null, id);
  }
  for (const id of ['iron_ingot', 'glass', 'cooked_mutton']) {
    assert.equal(fillRecipeGrid(id, 2), null);
    assert.equal(fillRecipeGrid(id, 3), null);
  }
  assert.equal(recipeForGrid(['iron_ore', null, 'coal', null], 2), null);
  assert.equal(recipeForGrid(['sand', null, 'coal', null], 2), null);
});

test('invalid grids and recipe IDs are rejected without exceptions', () => {
  for (const cells of [null, {}, [], Array(9).fill(null), [null, null, null, undefined], ['', null, null, null], [42, null, null, null]]) {
    assert.equal(recipeForGrid(cells, 2), null);
  }
  assert.equal(recipeForGrid(Array(9).fill(null), 3), null);
  for (const size of [0, 1, 4, '2', undefined]) {
    assert.equal(recipeForGrid(['wood', null, null, null], size), null);
    assert.equal(fillRecipeGrid('planks', size), null);
  }
  for (const id of ['missing', '__proto__', 'constructor', null]) assert.equal(fillRecipeGrid(id, 3), null);
  const first = fillRecipeGrid('planks', 2), second = fillRecipeGrid('planks', 2);
  first[0] = 'dirt';
  assert.equal(second[0], 'wood');
  assert.equal(PATTERNS.planks[0][0], 'wood');
});
