import { Game, ITEMS, RECIPES, BLOCKS } from './engine.js';
import { Renderer, drawItem } from './renderer.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const canvas = $('#canvas');
const renderer = new Renderer(canvas);
const SAVE_KEY = 'blockwild-world-v1';
let game = new Game({ seed: 'wildflower' });
let playing = false;
let held = { left: false, right: false, jump: false, sprint: false };
let pointer = { x: 0, y: 0, active: false, down: false, build: false, type: 'mouse' };
let target = null;
let touchBuild = false;
let soundEnabled = false;
let audioContext;
let category = 'all';
let lastUi = '';
let lastToast = '';
let lastToastTime = 0;
let lastFrame = 0;
let uiClock = 0;
let saveClock = 0;
let placeClock = 0;
let toastTimer;
let introSeedTimer;
let questFlags = { wood: false, craft: false, pick: false, build: false };
let saveAvailable = false;

Object.defineProperty(window, '__blockwild', { value: { get game() { return game; }, get renderer() { return renderer; }, get playing() { return playing; } } });

function safeStorageGet() {
  try { return localStorage.getItem(SAVE_KEY); } catch { return null; }
}
try { const raw = safeStorageGet(); if (raw) { Game.deserialize(JSON.parse(raw).world); saveAvailable = true; } } catch { /* Preserve the old save until the player chooses a new world. */ }
$('#continue-button').hidden = !saveAvailable;

function sound(kind = 'click') {
  if (!soundEnabled) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    const t = audioContext.currentTime;
    const tones = { click: [480, 270, .055], mine: [170, 60, .09], place: [270, 90, .07], craft: [460, 900, .15], hurt: [110, 50, .15], eat: [330, 220, .07] };
    const [start, end, duration] = tones[kind] || tones.click;
    osc.type = kind === 'craft' ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(start, t); osc.frequency.exponentialRampToValueAtTime(end, t + duration);
    gain.gain.setValueAtTime(.025, t); gain.gain.exponentialRampToValueAtTime(.001, t + duration);
    osc.connect(gain); gain.connect(audioContext.destination); osc.start(t); osc.stop(t + duration);
  } catch { /* Sound is optional. */ }
}
function toast(message, force = false) {
  if (!message) return;
  const now = performance.now();
  if (!force && message === lastToast && now - lastToastTime < 2300) return;
  lastToast = message; lastToastTime = now;
  $('#toast').textContent = message; $('#toast').classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
}
function clearInput() {
  held = { left: false, right: false, jump: false, sprint: false };
  pointer.down = false; pointer.build = false; game.cancelMining();
}
function activeModal() { return $('.modal[open]'); }
function focusGame() { if (playing && !activeModal()) canvas.focus({ preventScroll: true }); }
function closeModal(dialog) { dialog.close(); clearInput(); focusGame(); }
function openModal(id) {
  clearInput();
  for (const modal of $$('.modal[open]')) modal.close();
  if (id === 'inventory-modal') renderInventory();
  if (id === 'pause-modal') {
    $('#world-summary').textContent = `${game.mode === 'creative' ? 'Creative' : 'Survival'} · Day ${game.day} · Seed: ${game.seed}\n${game.stats.mined} blocks mined · ${game.stats.placed} blocks placed`;
    $('#reset-confirm').hidden = true;
  }
  $('#' + id).showModal();
}
for (const dialog of $$('.modal')) {
  dialog.querySelector('.close-modal').addEventListener('click', () => closeModal(dialog));
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(dialog); });
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(dialog); } });
}
function startGame(nextGame, flags = null) {
  game = nextGame;
  clearInput();
  playing = true;
  questFlags = flags && typeof flags === 'object' ? { wood: !!flags.wood, craft: !!flags.craft, pick: !!flags.pick, build: !!flags.build } : { wood: false, craft: false, pick: false, build: false };
  $('#intro').hidden = true; $('#game-ui').hidden = false; $('#death-screen').hidden = game.dead;
  for (const modal of $$('.modal[open]')) modal.close();
  if ('resetCamera' in renderer) renderer.resetCamera();
  lastUi = ''; saveClock = 0;
  $('#footer-state').textContent = `Seed: ${game.seed} · Your own corner of the world.`;
  $('#mode-label').textContent = game.mode.toUpperCase();
  updateUi(true); focusGame();
  toast(game.mode === 'creative' ? 'All blocks are yours. Select an item and start building.' : 'Welcome to the wild. Find a tree and hold to gather wood.', true);
}
$('#play-button').addEventListener('click', () => {
  if (saveAvailable && !window.confirm('Start a new adventure? This replaces your browser save. Choose Cancel, then Continue, to export the old world first.')) return;
  startGame(new Game({ seed: $('#seed-input').value.trim() || 'wildflower', mode: $('input[name="mode"]:checked').value }));
  saveWorld(false); sound();
});
$('#continue-button').addEventListener('click', () => {
  try { const data = JSON.parse(safeStorageGet()); startGame(Game.deserialize(data.world), data.quests); sound(); }
  catch { toast('This save could not be loaded. You can start a fresh world.', true); }
});
$('#random-seed').addEventListener('click', () => {
  const adjectives = ['mossy', 'sunlit', 'wild', 'quiet', 'moonlit', 'little'];
  const places = ['meadow', 'valley', 'grove', 'mountain', 'island', 'forest'];
  $('#seed-input').value = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${places[Math.floor(Math.random() * places.length)]}-${Math.floor(Math.random() * 999)}`;
  previewSeed(); sound();
});
function previewSeed() { clearTimeout(introSeedTimer); introSeedTimer = setTimeout(() => { if (!playing) game = new Game({ seed: $('#seed-input').value || 'wildflower' }); }, 200); }
$('#seed-input').addEventListener('input', previewSeed);
$('#help-button').addEventListener('click', () => openModal('help-modal'));
$('#settings-button').addEventListener('click', () => playing ? openModal('pause-modal') : openModal('help-modal'));
$('#inventory-button').addEventListener('click', () => openModal('inventory-modal'));
$('#resume-button').addEventListener('click', () => closeModal($('#pause-modal')));
$('#sound-button').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  $('#sound-button').setAttribute('aria-label', `Turn game sounds ${soundEnabled ? 'off' : 'on'}`);
  $('#sound-button').title = `Turn game sounds ${soundEnabled ? 'off' : 'on'}`;
  $('#sound-button').innerHTML = `<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6l5 4V5Z${soundEnabled ? 'm4 3c3 2 3 6 0 8m3-11c6 4 6 10 0 14' : 'm5 4 5 6m0-6-5 6'}"/></svg>`;
  sound();
});
$('#quest-toggle').addEventListener('click', () => {
  $('#quest-content').hidden = !$('#quest-content').hidden;
  $('#quest-card').classList.toggle('collapsed', $('#quest-content').hidden);
  $('#quest-toggle').textContent = $('#quest-content').hidden ? '+' : '−';
  $('#quest-toggle').setAttribute('aria-label', $('#quest-content').hidden ? 'Expand first day checklist' : 'Minimize first day checklist');
});
function saveWorld(showToast = true) {
  if (!playing) return false;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ format: 'blockwild', version: 1, savedAt: new Date().toISOString(), quests: questFlags, world: game.serialize() }));
    saveAvailable = true;
    $('#save-state').innerHTML = '<span class="live-dot"></span> Saved locally';
    if (showToast) toast('World saved. Right here in this browser.', true);
    return true;
  } catch { $('#save-state').textContent = 'Save unavailable · export a backup'; if (showToast) toast('Browser storage is full or unavailable. Export your world to keep it.', true); return false; }
}
$('#save-button').addEventListener('click', () => saveWorld());
$('#export-button').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ format: 'blockwild', version: 1, savedAt: new Date().toISOString(), quests: questFlags, world: game.serialize() })], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `blockwild-${game.seed.replace(/[^a-z0-9-]/gi, '-').slice(0, 40)}-day-${game.day}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500); toast('Your world backup is ready.', true);
});
$('#import-button').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('This file is too large.');
    const data = JSON.parse(await file.text());
    if (data.format !== 'blockwild' || data.version !== 1) throw new Error('Choose a Blockwild world backup.');
    const next = Game.deserialize(data.world);
    if (!window.confirm('Import this world and replace your browser save? Export your current world first if you want to keep it.')) return;
    startGame(next, data.quests); saveWorld(false); toast('World imported. Welcome back.', true);
  } catch (err) { toast(err instanceof SyntaxError ? 'This file is not a valid world backup.' : `Could not import world: ${err.message}`, true); }
  finally { e.target.value = ''; }
});
$('#new-world-button').addEventListener('click', () => { $('#reset-confirm').hidden = false; });
$('#cancel-reset').addEventListener('click', () => { $('#reset-confirm').hidden = true; });
$('#reset-world-button').addEventListener('click', () => {
  saveWorld(false); playing = false; clearInput(); $('#pause-modal').close();
  $('#game-ui').hidden = true; $('#intro').hidden = false; $('#death-screen').hidden = true;
  $('#continue-button').hidden = !saveAvailable;
  $('#footer-state').textContent = 'Your adventure starts here.';
  $('#seed-input').focus();
});
$('#respawn-button').addEventListener('click', () => { game.respawn(); $('#death-screen').hidden = true; clearInput(); updateUi(true); focusGame(); toast('A fresh start. Your inventory is safe.', true); });

function makeIcon(id, size = 32) {
  const icon = document.createElement('canvas'); icon.width = size * 2; icon.height = size * 2;
  icon.setAttribute('aria-hidden', 'true');
  const ctx = icon.getContext('2d'); ctx.imageSmoothingEnabled = false;
  drawItem(ctx, id, 0, 0, size * 2);
  return icon;
}
function renderHotbar() {
  const bar = $('#hotbar'); bar.replaceChildren();
  game.hotbar.forEach((id, index) => {
    const button = document.createElement('button');
    button.className = `slot${index === game.selected ? ' active' : ''}${!game.inventory[id] ? ' empty' : ''}`;
    button.dataset.slot = index;
    const name = ITEMS[id]?.name || 'Empty slot';
    button.title = `${index + 1} · ${name}${game.inventory[id] ? ` (${game.inventory[id]})` : ' · not collected'}`;
    button.setAttribute('aria-label', button.title); button.setAttribute('aria-pressed', String(index === game.selected));
    const number = document.createElement('span'); number.className = 'slot-key'; number.textContent = index + 1;
    const count = document.createElement('span'); count.className = 'slot-count'; count.textContent = game.inventory[id] ? game.mode === 'creative' ? '∞' : game.inventory[id] : '';
    button.append(number, makeIcon(id), count);
    button.addEventListener('click', () => { game.select(index); game.cancelMining(); updateUi(true); focusGame(); sound(); });
    bar.append(button);
  });
}
function updateUi(force = false) {
  if (!playing) return;
  const p = game.player, selectedId = game.hotbar[game.selected], selected = ITEMS[selectedId];
  const key = JSON.stringify([game.inventory, game.selected, game.hotbar, Math.ceil(p.health), Math.ceil(p.hunger), game.dead]);
  if (force || key !== lastUi) {
    lastUi = key; renderHotbar();
    $('#hearts').innerHTML = Array.from({ length: 10 }, (_, i) => `<span class="${p.health <= i * 2 ? 'vital-off' : p.health < i * 2 + 2 ? 'vital-half' : ''}" aria-hidden="true">♥</span>`).join('');
    $('#hearts').setAttribute('aria-label', `Health ${Math.ceil(p.health)} of 20`);
    $('#hunger').innerHTML = Array.from({ length: 10 }, (_, i) => `<span class="${p.hunger <= i * 2 ? 'vital-off' : p.hunger < i * 2 + 2 ? 'vital-half' : ''}" aria-hidden="true">◆</span>`).join('');
    $('#hunger').setAttribute('aria-label', `Hunger ${Math.ceil(p.hunger)} of 20`);
    $('#selected-name').textContent = game.inventory[selectedId] ? selected?.name || 'Empty hands' : 'Empty hands';
    $('#item-hint').textContent = !game.inventory[selectedId] ? 'Hold to gather' : selected.kind === 'food' ? 'Q to eat' : selected.kind === 'sword' ? 'Click to attack' : selected.kind === 'pickaxe' ? 'Hold to mine' : 'Right-click to place';
    $('#death-screen').hidden = !game.dead;
    if (game.dead) clearInput();
  }
  $('#day-label').textContent = `Day ${game.day}`;
  const t = game.time;
  $('#day-icon').textContent = t < .48 || t > .96 ? '☀' : '☾';
  $('#time-label').textContent = t < .18 ? 'Morning light' : t < .32 ? 'High sun' : t < .44 ? 'Afternoon calm' : t < .52 ? 'Dusk is falling' : t < .93 ? 'After dark' : 'First light';
  const below = Math.floor(p.y + p.h) - (game.surface[Math.max(0, Math.min(game.width - 1, Math.floor(p.x)))] || 30);
  $('#biome-label').textContent = below > 8 ? 'The Underground' : 'The Overworld';
  $('#coordinates').textContent = `X ${Math.floor(p.x)} · Y ${game.height - Math.floor(p.y)}`;
  questFlags.wood ||= (game.inventory.wood || 0) >= 1;
  questFlags.craft ||= (game.inventory.workbench || 0) > 0 || game.nearStation('workbench');
  questFlags.pick ||= (game.inventory.wood_pickaxe || 0) > 0 || (game.inventory.stone_pickaxe || 0) > 0 || (game.inventory.iron_pickaxe || 0) > 0;
  questFlags.build ||= game.stats.placed >= 10;
  for (const li of $$('#quest-list li')) { const done = !!questFlags[li.dataset.quest]; li.classList.toggle('done', done); li.querySelector('span').textContent = done ? '✓' : ''; }
  $('#quest-progress').textContent = `${Object.values(questFlags).filter(Boolean).length} / 4 COMPLETE`;
}
function renderInventory() {
  const grid = $('#inventory-grid'); grid.replaceChildren();
  const entries = Object.entries(game.inventory).filter(([id, count]) => ITEMS[id] && count > 0);
  $('#inventory-count').textContent = `${entries.length} ITEMS`;
  for (const [id, count] of entries) {
    const button = document.createElement('button');
    button.className = `inventory-item${game.hotbar[game.selected] === id ? ' active' : ''}`; button.dataset.item = id;
    button.title = `${ITEMS[id].name} · ${count} · Equip in slot ${game.selected + 1}`; button.setAttribute('aria-label', button.title);
    const n = document.createElement('span'); n.textContent = game.mode === 'creative' ? '∞' : count;
    button.append(makeIcon(id), n);
    button.addEventListener('click', () => { game.assignHotbar(game.selected, id); renderInventory(); updateUi(true); sound(); toast(`${ITEMS[id].name} equipped in slot ${game.selected + 1}`); });
    grid.append(button);
  }
  if (!entries.length) grid.innerHTML = '<p class="empty-inventory">A backpack full of possibility.<br>Gather some wood to get started.</p>';
  const missingSlots = Math.max(0, 15 - entries.length);
  for (let i = 0; i < missingSlots; i++) { const blank = document.createElement('div'); blank.className = 'inventory-item'; blank.setAttribute('aria-hidden', 'true'); grid.append(blank); }
  $('#station-status').replaceChildren();
  for (const [station, name] of [['workbench', 'Crafting table'], ['furnace', 'Furnace']]) {
    const available = game.mode === 'creative' || game.nearStation(station), badge = document.createElement('span');
    badge.className = `station-badge${available ? ' available' : ''}`; badge.textContent = `${available ? '✓' : '◇'} ${name} ${available ? 'nearby' : 'needed'}`;
    $('#station-status').append(badge);
  }
  const list = $('#recipe-list'), scroll = list.scrollTop; list.replaceChildren();
  for (const recipe of RECIPES.filter(r => category === 'all' || r.category === category)) {
    const card = document.createElement('div'); card.className = 'recipe-card'; card.dataset.recipe = recipe.id;
    const icon = document.createElement('div'); icon.className = 'recipe-icon'; icon.append(makeIcon(recipe.output[0]));
    const details = document.createElement('div'); details.className = 'recipe-detail';
    const name = document.createElement('strong'); name.textContent = `${recipe.name}${recipe.output[1] > 1 ? ` ×${recipe.output[1]}` : ''}`;
    const cost = document.createElement('p');
    Object.entries(recipe.cost).forEach(([id, n], i) => {
      if (i) cost.append(' · ');
      const span = document.createElement('span'); span.textContent = `${n} ${ITEMS[id].name.toLowerCase()}`;
      if ((game.inventory[id] || 0) < n && game.mode !== 'creative') span.className = 'missing'; cost.append(span);
    });
    details.append(name, cost);
    if (recipe.station && !game.nearStation(recipe.station) && game.mode !== 'creative') { const station = document.createElement('p'); station.className = 'station-needed'; station.textContent = `Requires a nearby ${recipe.station === 'workbench' ? 'crafting table' : 'furnace'}`; details.append(station); }
    const button = document.createElement('button'); button.className = 'craft-button'; button.textContent = 'Craft'; button.disabled = !game.canCraft(recipe.id); button.setAttribute('aria-label', `Craft ${recipe.name}`);
    button.addEventListener('click', () => { const result = game.craft(recipe.id); if (result.ok) { if (recipe.id === 'workbench') questFlags.craft = true; sound('craft'); } toast(result.message, true); renderInventory(); updateUi(true); });
    card.append(icon, details, button); list.append(card);
  }
  list.scrollTop = scroll;
}
for (const tab of $$('#craft-tabs button')) tab.addEventListener('click', () => { category = tab.dataset.category; for (const t of $$('#craft-tabs button')) t.classList.toggle('active', t === tab); renderInventory(); });

function preciseWorldPoint(x, y) { const rect = canvas.getBoundingClientRect(); return { x: (x - rect.left) / renderer.tile + renderer.camera.x, y: (y - rect.top) / renderer.tile + renderer.camera.y }; }
function point(e) { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; pointer.type = e.pointerType || 'mouse'; target = preciseWorldPoint(pointer.x, pointer.y); }
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointermove', point);
canvas.addEventListener('pointerleave', () => { if (!pointer.down) pointer.active = false; });
canvas.addEventListener('pointerdown', e => {
  if (!playing || activeModal() || game.dead) return;
  e.preventDefault(); focusGame(); point(e);
  try { canvas.setPointerCapture(e.pointerId); } catch { /* Older browsers. */ }
  pointer.down = true; pointer.build = e.button === 2 || e.pointerType === 'touch' && touchBuild; placeClock = 0;
  if (pointer.build) placeAtTarget(); else mineOrAttack(0);
});
canvas.addEventListener('pointerup', e => { pointer.down = false; pointer.build = false; game.cancelMining(); if (e.pointerType === 'touch') pointer.active = false; });
canvas.addEventListener('pointercancel', () => { pointer.down = false; pointer.build = false; game.cancelMining(); });
function placeAtTarget() {
  if (!target) return;
  const result = game.place(Math.floor(target.x), Math.floor(target.y));
  if (result.ok) { sound('place'); updateUi(true); } else toast(result.message);
  placeClock = .22;
}
function mineOrAttack(dt) {
  if (!target) return;
  const mob = game.mobs.find(m => m.health > 0 && target.x >= m.x - .15 && target.x <= m.x + m.w + .15 && target.y >= m.y - .15 && target.y <= m.y + m.h + .15);
  if (mob) { const result = game.attack(target.x, target.y); if (result.ok) { sound('hurt'); if (result.message?.startsWith('+')) toast(result.message); } game.cancelMining(); return; }
  if (dt <= 0) return;
  const result = game.mine(Math.floor(target.x), Math.floor(target.y), dt);
  if (result.broken) { sound('mine'); updateUi(true); if (result.item) toast(`+1 ${ITEMS[result.item]?.name || result.item}`); }
  else if (!result.ok && result.message && game.get(Math.floor(target.x), Math.floor(target.y)) !== BLOCKS.AIR) toast(result.message);
}
canvas.addEventListener('wheel', e => { if (!playing || activeModal()) return; e.preventDefault(); game.select((game.selected + (e.deltaY > 0 ? 1 : 8)) % 9); game.cancelMining(); updateUi(true); }, { passive: false });
const keyMap = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'jump', ArrowUp: 'jump', Space: 'jump', ShiftLeft: 'sprint', ShiftRight: 'sprint' };
window.addEventListener('keydown', e => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'Escape') {
    if (activeModal()) return;
    if (playing) { e.preventDefault(); openModal('pause-modal'); }
    return;
  }
  if (!playing || game.dead) return;
  if (e.code === 'KeyE' && !e.repeat) { e.preventDefault(); if ($('#inventory-modal').open) closeModal($('#inventory-modal')); else if (!activeModal()) openModal('inventory-modal'); return; }
  if (activeModal()) return;
  if (keyMap[e.code]) { e.preventDefault(); held[keyMap[e.code]] = true; }
  if (/^Digit[1-9]$/.test(e.code)) { e.preventDefault(); game.select(Number(e.code.slice(-1)) - 1); game.cancelMining(); updateUi(true); }
  if (e.code === 'KeyQ' && !e.repeat) { e.preventDefault(); const r = game.useSelected(); toast(r.message, true); if (r.ok) sound('eat'); updateUi(true); }
});
window.addEventListener('keyup', e => { if (keyMap[e.code]) held[keyMap[e.code]] = false; });
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); saveWorld(false); } });
window.addEventListener('pagehide', () => saveWorld(false));
for (const button of $$('.touch-move button')) {
  button.addEventListener('pointerdown', e => { e.preventDefault(); if (!playing || activeModal()) return; held[button.dataset.key] = true; button.setPointerCapture(e.pointerId); });
  const release = e => { e.preventDefault(); held[button.dataset.key] = false; };
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
}
$('#touch-mode').addEventListener('click', () => { touchBuild = !touchBuild; $('#touch-mode').textContent = touchBuild ? '▦ Build' : '⛏ Mine'; $('#touch-mode').setAttribute('aria-label', touchBuild ? 'Build mode. Tap to switch to mining.' : 'Mine mode. Tap to switch to building.'); sound(); });
$('#touch-mode').setAttribute('aria-label', 'Mine mode. Tap to switch to building.');
window.addEventListener('resize', () => renderer.resize());
renderer.resize();

function frame(timestamp) {
  const dt = Math.min(.05, Math.max(0, (timestamp - (lastFrame || timestamp)) / 1000)); lastFrame = timestamp;
  const paused = !playing || !!activeModal() || document.hidden || game.dead;
  if (!paused) {
    const oldHealth = game.player.health;
    game.step(dt, held);
    if (game.player.health < oldHealth) sound('hurt');
    if (pointer.active) target = preciseWorldPoint(pointer.x, pointer.y);
    placeClock -= dt;
    if (pointer.down) { if (pointer.build) { if (placeClock <= 0) placeAtTarget(); } else mineOrAttack(dt); }
    else game.cancelMining();
    saveClock += dt;
    if (saveClock >= 20) { saveClock = 0; saveWorld(false); }
  }
  renderer.render(game, dt, { target: pointer.active && playing && !paused && target ? { x: Math.floor(target.x), y: Math.floor(target.y) } : null, showTarget: pointer.active && playing && !paused });
  uiClock += dt;
  if (uiClock >= .15) { uiClock = 0; updateUi(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
