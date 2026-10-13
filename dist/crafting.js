import { RECIPES } from './engine.js';

// Empty cells are significant: recipes may move within the grid, but ingredients
// must keep their familiar shape. Each filled cell consumes one item.
const patterns = {
  planks: [['wood']],
  stick: [['planks'], ['planks']],
  workbench: [['planks', 'planks'], ['planks', 'planks']],
  torch: [['coal'], ['stick']],
  furnace: [['stone', 'stone', 'stone'], ['stone', null, 'stone'], ['stone', 'stone', 'stone']],
  chest: [['planks', 'planks', 'planks'], ['planks', null, 'planks'], ['planks', 'planks', 'planks']],
  bed: [['wool', 'wool', 'wool'], ['planks', 'planks', 'planks']],
  door: [['planks', 'planks'], ['planks', 'planks'], ['planks', 'planks']],
  bread: [['wheat', 'wheat', 'wheat']],
};

for (const [material, item] of Object.entries({ wood: 'planks', stone: 'stone', iron: 'iron_ingot', diamond: 'diamond' })) {
  patterns[`${material}_pickaxe`] = [[item, item, item], [null, 'stick', null], [null, 'stick', null]];
  patterns[`${material}_sword`] = [[item], [item], ['stick']];
  patterns[`${material}_axe`] = [[item, item], [item, 'stick'], [null, 'stick']];
  patterns[`${material}_hoe`] = [[item, item], [null, 'stick'], [null, 'stick']];
}

export const PATTERNS = Object.freeze(Object.fromEntries(
  Object.entries(patterns).map(([id, rows]) => [id, Object.freeze(rows.map(row => Object.freeze(row)))])
));

const validSize = size => size === 2 || size === 3;
const recipesById = new Map(RECIPES.filter(recipe => recipe.station !== 'furnace').map(recipe => [recipe.id, recipe]));

/** Find the original engine recipe, allowing translation and horizontal mirrors. */
export function recipeForGrid(grid, size) {
  if (!validSize(size) || !Array.isArray(grid) || grid.length !== size * size) return null;
  let left = size, right = -1, top = size, bottom = -1;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === null) continue;
    if (typeof grid[i] !== 'string' || grid[i].length === 0) return null;
    const x = i % size, y = Math.floor(i / size);
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right === -1) return null;
  const width = right - left + 1, height = bottom - top + 1;
  for (const [id, pattern] of Object.entries(PATTERNS)) {
    const recipe = recipesById.get(id);
    if (!recipe || (size === 2 && recipe.station === 'workbench')) continue;
    if (pattern.length !== height || pattern[0].length !== width) continue;
    for (const mirrored of [false, true]) {
      let matches = true;
      for (let y = 0; y < height && matches; y++) {
        for (let x = 0; x < width; x++) {
          if (grid[(top + y) * size + left + x] !== pattern[y][mirrored ? width - 1 - x : x]) {
            matches = false;
            break;
          }
        }
      }
      if (matches) return recipe;
    }
  }
  return null;
}

/** Fill a fresh grid at its upper-left corner; unsupported recipes return null. */
export function fillRecipeGrid(recipeId, size) {
  if (!validSize(size) || typeof recipeId !== 'string' || !Object.hasOwn(PATTERNS, recipeId)) return null;
  const recipe = recipesById.get(recipeId), pattern = PATTERNS[recipeId];
  if (!recipe || (size === 2 && recipe.station === 'workbench') || pattern.length > size || pattern[0].length > size) return null;
  const grid = Array(size * size).fill(null);
  for (let y = 0; y < pattern.length; y++) {
    for (let x = 0; x < pattern[y].length; x++) grid[y * size + x] = pattern[y][x];
  }
  return grid;
}
