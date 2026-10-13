import assert from 'node:assert/strict';
import { access, mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const output = path.join(projectRoot, 'test-results');
await mkdir(output, { recursive: true });

let playwright;
try {
  playwright = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
} catch {
  playwright = await import('/opt/codex/cua_node/lib/node_modules/playwright/index.mjs');
}

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4179';
const server = process.env.BASE_URL ? null : spawn('python3', [
  '-m', 'http.server', '4179', '--bind', '127.0.0.1', '--directory', path.join(projectRoot, 'dist'),
], { stdio: 'ignore' });

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(baseURL)).ok) return;
    } catch { /* Wait for the local test server. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Local server did not start at ${baseURL}`);
}

let executablePath = process.env.CHROMIUM_PATH;
if (!executablePath) {
  try { await access('/usr/bin/chromium'); executablePath = '/usr/bin/chromium'; } catch { /* Use Playwright's browser. */ }
}

const errors = [];
const checks = [];
const check = (name, value, message = name) => {
  assert.ok(value, message);
  checks.push(name);
  console.log(`PASS ${name}`);
};
let browser;
try {
  await waitForServer();
  browser = await playwright.chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.locator('#play-button').waitFor({ state: 'visible' });
  check('Landing screen is visible', await page.locator('#play-button').isVisible());
  await page.screenshot({ path: path.join(output, 'desktop-landing.png'), fullPage: true });

  await page.locator('#seed-input').fill('BLOCKWILD');
  await page.locator('#play-button').click();
  await page.locator('#intro').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => window.__blockwild?.game?.player.grounded);
  const initial = await page.evaluate(() => ({ ...window.__blockwild.game.player }));
  await page.keyboard.down('d');
  await page.waitForTimeout(350);
  await page.keyboard.up('d');
  check('Keyboard walking moves the player', await page.evaluate(x => window.__blockwild.game.player.x > x + .5, initial.x));
  await page.keyboard.down(' ');
  await page.waitForTimeout(180);
  await page.keyboard.up(' ');
  check('Space jumps above the ground', await page.evaluate(y => window.__blockwild.game.player.y < y - .3, initial.y));
  await page.waitForFunction(() => window.__blockwild.game.player.grounded);

  await page.keyboard.press('Escape');
  await page.locator('#pause-modal').waitFor({ state: 'visible' });
  const paused = await page.evaluate(() => ({ x: window.__blockwild.game.player.x, time: window.__blockwild.game.time }));
  await page.keyboard.down('d');
  await page.waitForTimeout(250);
  await page.keyboard.up('d');
  check('Pause freezes movement and world time', await page.evaluate(before => {
    const { game } = window.__blockwild;
    return game.player.x === before.x && game.time === before.time;
  }, paused));
  await page.locator('#resume-button').click();

  const tree = await page.evaluate(() => {
    const { game } = window.__blockwild;
    const trees = [];
    for (let x = 5; x < game.width - 5; x++) {
      const y = game.surface[x] - 1;
      if (game.get(x, y) === 4) trees.push({ x, y });
    }
    return trees.sort((a, b) => Math.abs(a.x - game.player.x) - Math.abs(b.x - game.player.x))[0];
  });
  check('World contains harvestable trees', Boolean(tree));
  // Walk and jump toward a real tree without changing simulation state.
  for (let attempt = 0; attempt < 18; attempt++) {
    const x = await page.evaluate(() => window.__blockwild.game.player.x);
    if (Math.abs(x - tree.x) < 2.9) break;
    const direction = x < tree.x ? 'd' : 'a';
    await page.keyboard.down(direction);
    await page.keyboard.down(' ');
    await page.waitForTimeout(280);
    await page.keyboard.up(' ');
    await page.keyboard.up(direction);
    await page.waitForTimeout(250);
  }
  await page.waitForFunction(() => window.__blockwild.game.player.grounded);
  await page.waitForTimeout(400);
  check('Tree is within mining reach after walking', await page.evaluate(target => window.__blockwild.game._inRange(target.x, target.y - 2), tree));
  const targetPoint = (target) => page.evaluate(({ x, y }) => window.__blockwild.renderer.worldToScreen(x + .5, y + .5), target);
  for (let offset = 0; offset < 3; offset++) {
    const target = { x: tree.x, y: tree.y - offset };
    const point = await targetPoint(target);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.waitForFunction(({ x, y }) => window.__blockwild.game.get(x, y) === 0, target, { timeout: 4000 });
    await page.mouse.up();
  }
  check('Holding the mouse harvests three logs', await page.evaluate(() => window.__blockwild.game.inventory.wood === 3 && window.__blockwild.game.stats.mined === 3));

  await page.keyboard.press('e');
  await page.locator('#inventory-modal').waitFor({ state: 'visible' });
  check('Inventory displays gathered wood', await page.locator('.inventory-item[data-item="wood"]').isVisible());
  const craft = async id => {
    const button = page.locator(`.recipe-card[data-recipe="${id}"] button`);
    await button.click();
  };
  for (let i = 0; i < 3; i++) await craft('planks');
  await craft('stick');
  await craft('workbench');
  check('Recipes consume wood and make useful items', await page.evaluate(() => {
    const { inventory } = window.__blockwild.game;
    return inventory.wood === 0 && inventory.planks === 6 && inventory.stick === 4 && inventory.workbench === 1;
  }));
  await page.screenshot({ path: path.join(output, 'desktop-crafting.png'), fullPage: true });
  await page.keyboard.press('e');
  await page.locator('#inventory-modal').waitFor({ state: 'hidden' });
  await page.keyboard.press('8');
  const benchPoint = await targetPoint(tree);
  await page.mouse.click(benchPoint.x, benchPoint.y, { button: 'right' });
  await page.waitForFunction(target => window.__blockwild.game.get(target.x, target.y) === 12, tree);
  check('Right click builds a crafting table and uses inventory', await page.evaluate(() => window.__blockwild.game.inventory.workbench === 0 && window.__blockwild.game.stats.placed === 1));

  await page.keyboard.press('e');
  await craft('wood_pickaxe');
  check('A nearby workbench unlocks tool crafting', await page.evaluate(() => window.__blockwild.game.inventory.wood_pickaxe === 1 && window.__blockwild.game.inventory.stick === 2));
  await page.keyboard.press('e');
  await page.keyboard.press('1');
  check('Number keys select hotbar items', await page.evaluate(() => window.__blockwild.game.selected === 0 && window.__blockwild.game.hotbar[0] === 'wood_pickaxe'));
  await page.screenshot({ path: path.join(output, 'desktop-gameplay.png'), fullPage: true });

  await page.keyboard.press('Escape');
  await page.locator('#save-button').click();
  const saved = await page.evaluate(() => {
    const { game } = window.__blockwild;
    return { seed: game.seed, inventory: { ...game.inventory }, stats: { ...game.stats } };
  });
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#export-button').click();
  const backupPath = path.join(output, 'world-backup.json');
  await (await downloadEvent).saveAs(backupPath);
  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
  check('Export downloads a valid world backup', backup.format === 'blockwild' && backup.world.seed === saved.seed && backup.world.inventory.wood_pickaxe === 1);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#continue-button').click();
  await page.locator('#intro').waitFor({ state: 'hidden' });
  const loaded = await page.evaluate(() => {
    const { game } = window.__blockwild;
    return { seed: game.seed, inventory: { ...game.inventory }, stats: { ...game.stats } };
  });
  assert.deepEqual(loaded, saved);
  check('Save and reload preserve inventory and progress', true);
  check('Placed crafting table persists after reload', await page.evaluate(target => window.__blockwild.game.get(target.x, target.y) === 12, tree));

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mobile = await mobileContext.newPage();
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(baseURL, { waitUntil: 'networkidle' });
  check('Mobile landing fits the viewport', await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.screenshot({ path: path.join(output, 'mobile-landing.png'), fullPage: true });
  await mobile.locator('#play-button').tap();
  await mobile.locator('#intro').waitFor({ state: 'hidden' });
  await mobile.waitForFunction(() => window.__blockwild?.game?.player.grounded);
  const mobileStartX = await mobile.evaluate(() => window.__blockwild.game.player.x);
  const right = await mobile.getByRole('button', { name: 'Move right', exact: true }).boundingBox();
  check('Mobile touch movement controls are visible', Boolean(right));
  const touch = await mobileContext.newCDPSession(mobile);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: right.x + right.width / 2, y: right.y + right.height / 2 }] });
  await mobile.waitForTimeout(350);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  check('Touch control moves the player', await mobile.evaluate(x => window.__blockwild.game.player.x > x + .5, mobileStartX));
  await mobile.locator('#touch-mode').tap();
  check('Touch mode can switch to building', /build/i.test(await mobile.locator('#touch-mode').textContent()));
  await mobile.screenshot({ path: path.join(output, 'mobile-gameplay.png'), fullPage: true });
  await mobile.locator('#inventory-button').tap();
  await mobile.locator('#inventory-modal').waitFor({ state: 'visible' });
  check('Mobile inventory fits the viewport', await mobile.evaluate(() => {
    const rect = document.querySelector('#inventory-modal').getBoundingClientRect();
    return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight;
  }));
  await mobile.screenshot({ path: path.join(output, 'mobile-inventory.png'), fullPage: true });
  await mobile.getByRole('button', { name: 'Close inventory', exact: true }).tap();
  await mobile.setViewportSize({ width: 360, height: 740 });
  check('Narrow mobile layout has no horizontal overflow', await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobileContext.close();

  const creativeContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const creative = await creativeContext.newPage();
  creative.on('pageerror', error => errors.push(error.message));
  await creative.goto(baseURL, { waitUntil: 'networkidle' });
  await creative.locator('.mode-picker label').filter({ hasText: 'Creative' }).click();
  await creative.locator('#play-button').click();
  await creative.locator('#intro').waitFor({ state: 'hidden' });
  await creative.waitForFunction(() => window.__blockwild.game.player.grounded);
  check('Creative mode supplies all materials', await creative.evaluate(() => window.__blockwild.game.mode === 'creative' && window.__blockwild.game.inventory.diamond_pickaxe === 999));
  await creative.keyboard.press('2');
  const creativeTarget = await creative.evaluate(() => {
    const { game, renderer } = window.__blockwild;
    const target = { x: Math.floor(game.player.x) + 2, y: Math.floor(game.player.y) - 1 };
    return { ...target, screen: renderer.worldToScreen(target.x + .5, target.y + .5) };
  });
  await creative.mouse.click(creativeTarget.screen.x, creativeTarget.screen.y, { button: 'right' });
  check('Creative building keeps an unlimited supply', await creative.evaluate(({ x, y }) => window.__blockwild.game.get(x, y) === 2 && window.__blockwild.game.inventory.dirt === 999, creativeTarget));
  await creative.keyboard.press('Escape');
  creative.once('dialog', dialog => dialog.accept());
  await creative.locator('#import-file').setInputFiles(backupPath);
  await creative.waitForFunction(() => window.__blockwild.game.mode === 'survival' && window.__blockwild.game.seed === 'BLOCKWILD');
  const imported = await creative.evaluate(() => {
    const { game } = window.__blockwild;
    return { seed: game.seed, inventory: { ...game.inventory }, stats: { ...game.stats } };
  });
  assert.deepEqual(imported, saved);
  check('Import restores the exported survival world', true);

  // Import a valid night checkpoint to exercise combat at fractional tile
  // coordinates and food use without waiting through a full day cycle.
  const combatBackup = structuredClone(backup);
  const zombieX = Math.floor(combatBackup.world.player.x) + 1.4;
  combatBackup.world.time = .75;
  combatBackup.world.player.hunger = 15;
  combatBackup.world.mobs = [{ id: 999, type: 'zombie', x: zombieX,
    y: combatBackup.world.surface[Math.floor(zombieX)] - 1.75,
    w: .65, h: 1.75, vx: 0, vy: 0, health: 12, facing: -1,
    grounded: true, timer: 1, attackClock: 0 }];
  await creative.keyboard.press('Escape');
  creative.once('dialog', dialog => dialog.accept());
  await creative.locator('#import-file').setInputFiles({ name: 'night-checkpoint.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(combatBackup)) });
  await creative.waitForFunction(() => window.__blockwild.game.mobs.some(mob => mob.id === 999));
  await creative.waitForTimeout(100);
  const zombiePoint = await creative.evaluate(() => {
    const { game, renderer } = window.__blockwild;
    const mob = game.mobs.find(m => m.id === 999);
    return renderer.worldToScreen(mob.x + mob.w / 2, mob.y + mob.h / 2);
  });
  await creative.mouse.click(zombiePoint.x, zombiePoint.y);
  check('Clicking a creature center hits at fractional tile coordinates', await creative.evaluate(() => window.__blockwild.game.mobs.find(m => m.id === 999)?.health < 12));
  await creative.keyboard.press('6');
  await creative.keyboard.press('q');
  check('Eating restores hunger and consumes an apple', await creative.evaluate(() => window.__blockwild.game.player.hunger === 20 && window.__blockwild.game.inventory.apple === 2));
  await creativeContext.close();

  check('No uncaught browser errors', errors.length === 0, errors.join('\n'));
  console.log(`\n${checks.length} browser checks passed. Screenshots: ${output}`);
  await context.close();
} catch (error) {
  const pages = browser?.contexts().flatMap(context => context.pages()) || [];
  for (const [index, page] of pages.entries()) {
    await page.screenshot({ path: path.join(output, `failure-${index}.png`), fullPage: true }).catch(() => {});
  }
  if (errors.length) console.error('Browser errors:', errors);
  throw error;
} finally {
  await browser?.close();
  server?.kill();
}
