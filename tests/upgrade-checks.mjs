import assert from 'node:assert/strict';
import path from 'node:path';

/** Exercise expanded survival features through actual UI interactions.
 * Checkpoints provide controlled starting conditions through the public import
 * flow; tests never call engine mutation methods from the browser.
 */
export async function runUpgradeChecks({ page, template, check, output }) {
  const fixture = async (name, inventory, customize = () => {}) => {
    const data = structuredClone(template), world = data.world;
    world.seed = `QA-${name}`;
    world.mode = 'survival'; world.time = .15; world.day = 1; world.dead = false;
    world.inventory = inventory; world.selected = 0;
    world.hotbar = ['wood_pickaxe', 'dirt', 'wood', 'planks', 'torch', 'apple', 'stone', 'workbench', 'wood_sword'];
    Object.assign(world.player, { x: 160.18, y: 28.2, vx: 0, vy: 0, grounded: true, health: 20, hunger: 20 });
    world.mobs = []; world.drops = []; world.durability = {}; world.chests = {};
    world.furnaces = {}; world.cropGrowth = {}; world.spawnPoint = null;
    world.stats = { mined: 0, placed: 0, crafted: 0, kills: 0 };
    const set = (x, y, id) => { world.tiles[y * world.width + x] = id; };
    for (let x = 145; x <= 180; x++) {
      world.surface[x] = 30;
      for (let y = 0; y <= 33; y++) set(x, y, y < 30 ? 0 : y === 30 ? 1 : 2);
    }
    customize(world, set);
    const openModal = page.locator('.modal[open] .close-modal');
    if (await openModal.count()) await openModal.click();
    await page.locator('#settings-button').click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#import-file').setInputFiles({ name: `${name}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
    await page.waitForFunction(seed => window.__blockwild.game.seed === seed, world.seed);
    await page.waitForTimeout(80);
  };
  const point = (x, y) => page.evaluate(({ x, y }) => window.__blockwild.renderer.worldToScreen(x + .5, y + .5), { x, y });
  const rightClick = async (x, y) => { const p = await point(x, y); await page.mouse.click(p.x, p.y, { button: 'right' }); };
  const mine = async (x, y) => {
    const p = await point(x, y); await page.mouse.move(p.x, p.y); await page.mouse.down();
    await page.waitForFunction(({ x, y }) => window.__blockwild.game.get(x, y) === 0, { x, y }, { timeout: 4000 });
    await page.mouse.up();
  };
  const equip = async id => {
    await page.keyboard.press('e');
    await page.locator(`#inventory-grid .inventory-item[data-item="${id}"]`).click();
    await page.keyboard.press('e');
  };

  await fixture('manual-crafting', { planks: 8, stick: 2 }, (_world, set) => set(158, 29, 3));
  await page.keyboard.press('e');
  check('Hand crafting presents a 2 by 2 grid', await page.locator('#crafting-grid .craft-cell').count() === 4);
  await page.locator('#inventory-grid .inventory-item[data-item="planks"]').click();
  for (const cell of [0, 1, 2, 3]) await page.locator(`.craft-cell[data-cell="${cell}"]`).click();
  check('Manual square pattern creates a crafting-table result', /Crafting table/i.test(await page.locator('#craft-output').getAttribute('aria-label')));
  await page.locator('#craft-output').click();
  check('Taking a manual crafting result consumes its ingredients', await page.evaluate(() => window.__blockwild.game.inventory.workbench === 1 && window.__blockwild.game.inventory.planks === 4));
  await page.keyboard.press('e');
  await page.keyboard.press('8');
  await rightClick(162, 29);
  await rightClick(162, 29);
  await page.locator('#inventory-modal').waitFor({ state: 'visible' });
  check('Interacting with a crafting table opens a 3 by 3 grid', await page.locator('#crafting-grid .craft-cell').count() === 9);
  await page.locator('#inventory-grid .inventory-item[data-item="planks"]').click();
  for (const cell of [0, 1, 2]) await page.locator(`.craft-cell[data-cell="${cell}"]`).click();
  await page.locator('#inventory-grid .inventory-item[data-item="stick"]').click();
  for (const cell of [4, 7]) await page.locator(`.craft-cell[data-cell="${cell}"]`).click();
  check('Manual pickaxe shape produces the correct result', /Wood pickaxe/i.test(await page.locator('#craft-output').getAttribute('aria-label')));
  await page.screenshot({ path: path.join(output, 'manual-crafting.png'), fullPage: true });
  await page.locator('#craft-output').click();
  await page.keyboard.press('e');
  await page.keyboard.press('1');
  await equip('wood_pickaxe');
  await mine(158, 29);
  check('Mining wears the crafted tool', await page.evaluate(() => window.__blockwild.game.getDurability('wood_pickaxe').current === 58 && window.__blockwild.game.inventory.stone === 1));
  check('Used tools show a durability bar in the hotbar', await page.locator('#hotbar .slot[data-slot="0"] .durability-bar').isVisible());

  await fixture('doors', { door: 1 });
  await equip('door');
  await rightClick(162, 29);
  check('Door placement creates both halves', await page.evaluate(() => window.__blockwild.game.get(162, 29) === 17 && window.__blockwild.game.get(162, 28) === 18 && window.__blockwild.game.inventory.door === 0));
  await rightClick(162, 29);
  check('Right click opens a door', await page.evaluate(() => window.__blockwild.game.get(162, 29) === 19 && window.__blockwild.game.get(162, 28) === 20));
  await rightClick(162, 29);
  check('Right click closes a door', await page.evaluate(() => window.__blockwild.game.get(162, 29) === 17));

  await fixture('chest', { chest: 1, planks: 70 });
  await equip('chest');
  await rightClick(162, 29);
  await rightClick(162, 29);
  await page.locator('#chest-modal').waitFor({ state: 'visible' });
  await page.locator('.chest-item[data-item="planks"][data-direction="deposit"]').click();
  check('Chest click deposits one item', await page.evaluate(() => window.__blockwild.game.chests['162,29'].planks === 1 && window.__blockwild.game.inventory.planks === 69));
  await page.locator('.chest-item[data-item="planks"][data-direction="deposit"]').click({ modifiers: ['Shift'] });
  check('Chest Shift-click deposits a stack of 64', await page.evaluate(() => window.__blockwild.game.chests['162,29'].planks === 65 && window.__blockwild.game.inventory.planks === 5));
  await page.screenshot({ path: path.join(output, 'chest-storage.png'), fullPage: true });
  await page.locator('.chest-item[data-item="planks"][data-direction="withdraw"]').click({ modifiers: ['Shift'] });
  await page.locator('.chest-item[data-item="planks"][data-direction="withdraw"]').click();
  check('Chest withdrawal restores the stored inventory', await page.evaluate(() => window.__blockwild.game.chests['162,29'].planks === 0 && window.__blockwild.game.inventory.planks === 70));

  await fixture('farming', { wood_hoe: 1, seeds: 2 }, (_world, set) => { set(158, 30, 22); set(158, 29, 24); });
  await equip('wood_hoe');
  await rightClick(162, 30);
  check('A hoe tills soil and loses durability', await page.evaluate(() => window.__blockwild.game.get(162, 30) === 22 && window.__blockwild.game.getDurability('wood_hoe').current === 58));
  await equip('seeds');
  await rightClick(162, 30);
  check('Seeds plant a growing wheat crop', await page.evaluate(() => window.__blockwild.game.get(162, 29) === 23 && window.__blockwild.game.inventory.seeds === 1 && Object.hasOwn(window.__blockwild.game.cropGrowth, '162,29')));
  await mine(158, 29);
  check('Harvesting ripe wheat returns wheat and seeds', await page.evaluate(() => window.__blockwild.game.inventory.wheat === 1 && window.__blockwild.game.inventory.seeds >= 2));

  await fixture('furnace', { furnace: 1, iron_ore: 1, coal: 1 });
  await equip('furnace');
  await rightClick(162, 29);
  await rightClick(162, 29);
  await page.locator('#furnace-modal').waitFor({ state: 'visible' });
  await page.locator('#furnace-recipes [data-recipe="iron_ingot"] button').click();
  check('Furnace consumes ore and coal when smelting starts', await page.evaluate(() => window.__blockwild.game.inventory.iron_ore === 0 && window.__blockwild.game.inventory.coal === 0 && window.__blockwild.game.furnaces['162,29'].remaining > 9));
  await page.waitForTimeout(1100);
  check('Smelting advances while the furnace screen stays open', await page.evaluate(() => window.__blockwild.game.furnaces['162,29'].remaining < 9.5 && !window.__blockwild.game.inventory.iron_ingot));
  await page.screenshot({ path: path.join(output, 'furnace-burning.png'), fullPage: true });
  await page.locator('#collect-furnace').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#collect-furnace').click();
  check('Finished smelting yields one iron ingot', await page.evaluate(() => window.__blockwild.game.inventory.iron_ingot === 1 && !window.__blockwild.game.furnaces['162,29']));

  await fixture('bed', { bed: 1 }, world => { world.time = .75; });
  await equip('bed');
  await rightClick(162, 29);
  check('Bed placement creates foot and head blocks', await page.evaluate(() => window.__blockwild.game.get(162, 29) === 16 && window.__blockwild.game.get(163, 29) === 25));
  await rightClick(162, 29);
  check('Using a bed sleeps to morning and sets the respawn point', await page.evaluate(() => window.__blockwild.game.time < .1 && window.__blockwild.game.day === 2 && window.__blockwild.game.spawnPoint.x === 162));
  await page.screenshot({ path: path.join(output, 'survival-upgrade.png'), fullPage: true });

  await fixture('death-recovery', { wood_pickaxe: 1, planks: 7 }, (world, set) => {
    set(162, 29, 16); set(163, 29, 25); world.spawnPoint = { x: 162, y: 29 };
    world.durability.wood_pickaxe = 40; world.player.health = 2; world.player.hunger = 15; world.time = .75;
    world.mobs = [{ id: 999, type: 'zombie', x: 160.2, y: 28.25, w: .65, h: 1.75, vx: 0, vy: 0, health: 12, facing: -1, grounded: true, timer: 1, attackClock: 0 }];
  });
  await page.locator('#death-screen').waitFor({ state: 'visible', timeout: 5000 });
  check('Death drops carried items and empties the inventory', await page.evaluate(() => window.__blockwild.game.dead && !window.__blockwild.game.inventory.planks && window.__blockwild.game.drops.some(drop => drop.item === 'planks' && drop.count === 7)));
  await page.locator('#respawn-button').click();
  check('Respawn returns the player to the bed', await page.evaluate(() => !window.__blockwild.game.dead && Math.abs(window.__blockwild.game.player.x - 162.18) < .1 && window.__blockwild.game.player.health === 20));
  await page.keyboard.down('a');
  await page.waitForTimeout(330);
  await page.keyboard.up('a');
  await page.waitForFunction(() => window.__blockwild.game.inventory.planks === 7, null, { timeout: 4000 });
  check('Walking to dropped items recovers inventory and tool wear', await page.evaluate(() => window.__blockwild.game.inventory.wood_pickaxe === 1 && window.__blockwild.game.getDurability('wood_pickaxe').current === 40 && window.__blockwild.game.drops.length === 0));
  assert.equal(await page.evaluate(() => window.__blockwild.game.dead), false);
}
