// Blockwild's deterministic world and simulation. Distances are measured in tiles.
export const BLOCKS = Object.freeze({
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5,
  COAL: 6, IRON: 7, DIAMOND: 8, SAND: 9, WATER: 10,
  PLANKS: 11, WORKBENCH: 12, FURNACE: 13, TORCH: 14, BEDROCK: 15,
  BED: 16, DOOR_BOTTOM: 17, DOOR_TOP: 18, DOOR_OPEN_BOTTOM: 19,
  DOOR_OPEN_TOP: 20, CHEST: 21, FARMLAND: 22, WHEAT: 23,
  WHEAT_RIPE: 24, BED_HEAD: 25, GLASS: 26,
});

export const ITEMS = Object.freeze({
  dirt: { name: 'Dirt', color: '#946340', block: BLOCKS.DIRT, kind: 'block' },
  grass: { name: 'Grass', color: '#76ac49', block: BLOCKS.GRASS, kind: 'block' },
  stone: { name: 'Cobblestone', color: '#92959c', block: BLOCKS.STONE, kind: 'block' },
  wood: { name: 'Wood', color: '#98643c', block: BLOCKS.WOOD, kind: 'block' },
  leaves: { name: 'Leaves', color: '#538844', block: BLOCKS.LEAVES, kind: 'block' },
  sand: { name: 'Sand', color: '#d9c48c', block: BLOCKS.SAND, kind: 'block' },
  planks: { name: 'Wood planks', color: '#c59759', block: BLOCKS.PLANKS, kind: 'block' },
  workbench: { name: 'Crafting table', color: '#b47a42', block: BLOCKS.WORKBENCH, kind: 'block' },
  furnace: { name: 'Furnace', color: '#797e87', block: BLOCKS.FURNACE, kind: 'block' },
  torch: { name: 'Torch', color: '#ffc963', block: BLOCKS.TORCH, kind: 'block' },
  bed: { name: 'Bed', color: '#c83e38', block: BLOCKS.BED, kind: 'block' },
  door: { name: 'Oak door', color: '#b88946', block: BLOCKS.DOOR_BOTTOM, kind: 'block' },
  chest: { name: 'Chest', color: '#b77c36', block: BLOCKS.CHEST, kind: 'block' },
  glass: { name: 'Glass', color: '#b8e7ee', block: BLOCKS.GLASS, kind: 'block' },
  seeds: { name: 'Wheat seeds', color: '#7aab38', kind: 'seed' },
  wheat: { name: 'Wheat', color: '#d6b752', kind: 'material' },
  wool: { name: 'White wool', color: '#eee9db', kind: 'material' },
  bread: { name: 'Bread', color: '#bf8139', kind: 'food', food: 5 },
  coal: { name: 'Coal', color: '#42434c', kind: 'material' },
  iron_ore: { name: 'Iron ore', color: '#b39783', kind: 'material' },
  iron_ingot: { name: 'Iron ingot', color: '#d7d7de', kind: 'material' },
  diamond: { name: 'Diamond', color: '#6ce0dd', kind: 'material' },
  stick: { name: 'Stick', color: '#ab7b4c', kind: 'material' },
  apple: { name: 'Apple', color: '#e86155', kind: 'food', food: 4 },
  raw_mutton: { name: 'Raw mutton', color: '#c46b78', kind: 'food', food: 2 },
  cooked_mutton: { name: 'Cooked mutton', color: '#bb7b48', kind: 'food', food: 6 },
  ...Object.fromEntries(['wood', 'stone', 'iron', 'diamond'].flatMap((material, i) => {
    const kinds = ['pickaxe', 'sword', 'axe', 'hoe'];
    return kinds.map(kind => [`${material}_${kind}`, {
      name: `${material[0].toUpperCase()}${material.slice(1)} ${kind}`,
      color: ['#bc935d', '#a0a4ac', '#dce0e8', '#67dfd9'][i],
      kind, tier: i + 1, maxDurability: [59, 131, 250, 1561][i],
    }]);
  })),
});

export const RECIPES = [
  { id: 'planks', name: 'Wood planks', output: ['planks', 4], cost: { wood: 1 }, category: 'building' },
  { id: 'stick', name: 'Sticks', output: ['stick', 4], cost: { planks: 2 }, category: 'tools' },
  { id: 'workbench', name: 'Crafting table', output: ['workbench', 1], cost: { planks: 4 }, category: 'building' },
  { id: 'torch', name: 'Torches', output: ['torch', 4], cost: { coal: 1, stick: 1 }, category: 'building' },
  { id: 'bed', name: 'Bed', output: ['bed', 1], cost: { wool: 3, planks: 3 }, station: 'workbench', category: 'building' },
  { id: 'door', name: 'Oak doors', output: ['door', 3], cost: { planks: 6 }, station: 'workbench', category: 'building' },
  { id: 'chest', name: 'Chest', output: ['chest', 1], cost: { planks: 8 }, station: 'workbench', category: 'building' },
  ...['wood', 'stone', 'iron', 'diamond'].flatMap(material => {
    const item = { wood: 'planks', stone: 'stone', iron: 'iron_ingot', diamond: 'diamond' }[material];
    return ['hoe', 'axe'].map(kind => ({ id: `${material}_${kind}`, name: ITEMS[`${material}_${kind}`].name, output: [`${material}_${kind}`, 1], cost: { [item]: kind === 'hoe' ? 2 : 3, stick: 2 }, station: 'workbench', category: 'tools' }));
  }),
  ...['wood', 'stone', 'iron', 'diamond'].flatMap((material) => {
    const item = { wood: 'planks', stone: 'stone', iron: 'iron_ingot', diamond: 'diamond' }[material];
    return [
      { id: `${material}_pickaxe`, name: ITEMS[`${material}_pickaxe`].name, output: [`${material}_pickaxe`, 1], cost: { [item]: 3, stick: 2 }, station: 'workbench', category: 'tools' },
      { id: `${material}_sword`, name: ITEMS[`${material}_sword`].name, output: [`${material}_sword`, 1], cost: { [item]: 2, stick: 1 }, station: 'workbench', category: 'tools' },
    ];
  }),
  { id: 'furnace', name: 'Furnace', output: ['furnace', 1], cost: { stone: 8 }, station: 'workbench', category: 'building' },
  { id: 'iron_ingot', name: 'Smelt iron', output: ['iron_ingot', 1], cost: { iron_ore: 1, coal: 1 }, station: 'furnace', category: 'tools' },
  { id: 'cooked_mutton', name: 'Cook mutton', output: ['cooked_mutton', 1], cost: { raw_mutton: 1, coal: 1 }, station: 'furnace', category: 'food' },
  { id: 'bread', name: 'Bread', output: ['bread', 1], cost: { wheat: 3 }, station: 'workbench', category: 'food' },
  { id: 'glass', name: 'Smelt glass', output: ['glass', 1], cost: { sand: 1, coal: 1 }, station: 'furnace', category: 'building' },
];

const SOLID = new Set([1, 2, 3, 6, 7, 8, 9, 11, 12, 13, 15, 17, 18, 21, 22, 26]);
const DROPS = { 1: 'dirt', 2: 'dirt', 3: 'stone', 4: 'wood', 5: 'leaves', 6: 'coal', 7: 'iron_ore', 8: 'diamond', 9: 'sand', 11: 'planks', 12: 'workbench', 13: 'furnace', 14: 'torch', 16: 'bed', 17: 'door', 18: 'door', 19: 'door', 20: 'door', 21: 'chest', 22: 'dirt', 23: 'seeds', 24: 'wheat', 25: 'bed' };
const HARDNESS = { 1: .3, 2: .3, 3: .9, 4: .65, 5: .15, 6: 1.0, 7: 1.35, 8: 1.65, 9: .25, 11: .55, 12: .75, 13: 1.3, 14: .1, 16: .35, 17: .65, 18: .65, 19: .65, 20: .65, 21: .75, 22: .3, 23: .1, 24: .1, 25: .35, 26: .25 };
const WOODEN_BLOCKS = new Set([4, 11, 12, 16, 17, 18, 19, 20, 21, 25]);
const DOOR_BLOCKS = new Set([17, 18, 19, 20]);
const TIERS = { 3: 1, 6: 1, 7: 2, 8: 3, 13: 1 };
const HOTBAR = ['wood_pickaxe', 'dirt', 'wood', 'planks', 'torch', 'apple', 'stone', 'workbench', 'wood_sword'];
const SAVE_VERSION = 1;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const finite = (n) => typeof n === 'number' && Number.isFinite(n);
const knownItem = (id) => typeof id === 'string' && Object.hasOwn(ITEMS, id);
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
function noise(x, y, seed) {
  let h = Math.imul(x + 374761393, 668265263) ^ Math.imul(y + 1274126177, 1597334677) ^ seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function smoothNoise(x, y, scale, seed) {
  const ix = Math.floor(x / scale), iy = Math.floor(y / scale);
  let fx = x / scale - ix, fy = y / scale - iy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = noise(ix, iy, seed), b = noise(ix + 1, iy, seed);
  const c = noise(ix, iy + 1, seed), d = noise(ix + 1, iy + 1, seed);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

export class Game {
  constructor({ seed = 'BLOCKWILD', mode = 'survival' } = {}) {
    this.seed = String(seed).slice(0, 80) || 'BLOCKWILD';
    this.mode = mode === 'creative' ? 'creative' : 'survival';
    this.width = 320;
    this.height = 100;
    this.tiles = new Uint8Array(this.width * this.height);
    this.surface = new Array(this.width);
    this._seed = hashString(this.seed);
    this._randomState = this._seed || 1;
    this.inventory = Object.create(null);
    this.durability = Object.create(null);
    this.chests = Object.create(null);
    this.furnaces = Object.create(null);
    this.cropGrowth = Object.create(null);
    this.drops = [];
    this.spawnPoint = null;
    this._cropClock = 0;
    this.hotbar = [...HOTBAR];
    this.selected = 0;
    this.time = .15;
    this.day = 1;
    this.mobs = [];
    this.particles = [];
    this.mining = null;
    this.stats = { mined: 0, placed: 0, crafted: 0, kills: 0 };
    this.dead = false;
    this.message = '';
    this._hungerClock = 0;
    this._regenClock = 0;
    this._mobClock = 0;
    this._attackCooldown = 0;
    this._jumpLatch = false;
    this._nextMobId = 1;
    this._generate();
    const spawn = this._spawnPoint();
    this.player = { ...spawn, w: .65, h: 1.8, vx: 0, vy: 0, facing: 1, grounded: false, health: 20, maxHealth: 20, hunger: 20, maxHunger: 20 };
    this._fallStart = this.player.y;
    if (this.mode === 'creative') for (const id of Object.keys(ITEMS)) this.inventory[id] = 999;
    for (const x of [135, 142, 171, 178, 195, 210]) this._spawnMob('sheep', x);
  }

  _random() {
    let x = this._randomState;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this._randomState = x >>> 0;
    return this._randomState / 4294967296;
  }

  _generate() {
    for (let x = 0; x < this.width; x++) {
      const rolling = smoothNoise(x, 0, 22, this._seed) * 9 + smoothNoise(x, 0, 9, this._seed + 4) * 3;
      const meadow = clamp(1 - Math.abs(x - 160) / 20, 0, 1);
      const top = Math.round((25 + rolling) * (1 - meadow) + 30 * meadow);
      this.surface[x] = top;
      for (let y = top; y < this.height; y++) {
        let id = y === top ? BLOCKS.GRASS : y < top + 4 ? BLOCKS.DIRT : BLOCKS.STONE;
        if (y >= this.height - 2) id = BLOCKS.BEDROCK;
        else if (y > top + 7) {
          const cave = smoothNoise(x, y, 8, this._seed + 40);
          const tunnel = smoothNoise(x, y, 15, this._seed + 72);
          if (cave > .63 || (Math.abs(tunnel - .50) < .042 && y > 48)) id = BLOCKS.AIR;
          else {
            const ore = noise(x, y, this._seed + 28);
            if (y > 69 && ore > .976) id = BLOCKS.DIAMOND;
            else if (y > 45 && ore > .947) id = BLOCKS.IRON;
            else if (ore > .91) id = BLOCKS.COAL;
          }
        }
        this.tiles[y * this.width + x] = id;
      }
    }
    // Small lakes away from the starting meadow.
    for (const center of [41, 92, 245, 284]) {
      const top = Math.min(...this.surface.slice(center - 5, center + 6));
      for (let dx = -5; dx <= 5; dx++) {
        const x = center + dx, depth = 1 + Math.floor((5 - Math.abs(dx)) / 2);
        for (let y = top; y < top + depth; y++) this.set(x, y, BLOCKS.WATER);
        this.set(x, top + depth, BLOCKS.SAND);
        this.surface[x] = top;
        for (let y = top - 4; y < top; y++) this.set(x, y, BLOCKS.AIR);
      }
    }
    for (let x = 6; x < this.width - 6; x += 6 + Math.floor(noise(x, 0, this._seed) * 6)) {
      if (Math.abs(x - 160) < 5 || this.get(x, this.surface[x]) !== BLOCKS.GRASS) continue;
      const top = this.surface[x], trunk = 4 + Math.floor(noise(x, 3, this._seed) * 3);
      for (let y = top - trunk - 2; y <= top - trunk + 1; y++) {
        const radius = y === top - trunk - 2 ? 1 : 2;
        for (let dx = -radius; dx <= radius; dx++) if (this.get(x + dx, y) === BLOCKS.AIR) this.set(x + dx, y, BLOCKS.LEAVES);
      }
      for (let y = top - trunk; y < top; y++) this.set(x, y, BLOCKS.WOOD);
    }
    // An exposed coal seam gives a readable route into the mining loop.
    for (const [dx, dy] of [[0, 4], [1, 5], [0, 6]]) this.set(174 + dx, this.surface[174 + dx] + dy, BLOCKS.COAL);
  }

  _spawnPoint() {
    if (this.spawnPoint && this.get(this.spawnPoint.x, this.spawnPoint.y) === BLOCKS.BED) {
      const bed = this.spawnPoint;
      for (const dx of [0, 1, -1, 2, -2, 3]) {
        const point = { x: bed.x + dx + .18, y: bed.y + 1 - 1.81, w: .65, h: 1.8 };
        if (!this._collides(point) && this.isSolid(point.x + .3, point.y + 1.82)) return { x: point.x, y: point.y };
      }
    }
    const x = 160;
    // Respawn in the open even if the player built over the original meadow.
    let y = this.surface[x] - 1.81;
    for (let tries = 0; tries < 40 && this._collides({ x: x + .18, y, w: .65, h: 1.8 }); tries++) y--;
    return { x: x + .18, y };
  }

  get(x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || x >= this.width || y >= this.height) return BLOCKS.BEDROCK;
    if (y < 0) return BLOCKS.AIR;
    return this.tiles[y * this.width + x];
  }

  set(x, y, id) {
    if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(id) || id < 0 || id > 26 || x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    this.tiles[y * this.width + x] = id;
    return true;
  }

  isSolid(x, y) { return SOLID.has(this.get(x, y)); }

  _collides(body) {
    for (let y = Math.floor(body.y + .001); y <= Math.floor(body.y + body.h - .001); y++) {
      for (let x = Math.floor(body.x + .001); x <= Math.floor(body.x + body.w - .001); x++) {
        if (this.isSolid(x, y)) return true;
      }
    }
    return false;
  }

  _move(body, dt) {
    const oldX = body.x, oldY = body.y, fallingSpeed = body.vy;
    body.x += body.vx * dt;
    if (this._collides(body)) {
      body.x = oldX;
      // A small binary search reaches the tile edge without leaking through it.
      let lo = 0, hi = 1;
      for (let i = 0; i < 9; i++) {
        const t = (lo + hi) / 2;
        body.x = oldX + body.vx * dt * t;
        if (this._collides(body)) hi = t; else lo = t;
      }
      body.x = oldX + body.vx * dt * lo;
      body.vx = 0;
    }
    body.y += body.vy * dt;
    body.grounded = false;
    if (this._collides(body)) {
      body.y = oldY;
      let lo = 0, hi = 1;
      for (let i = 0; i < 9; i++) {
        const t = (lo + hi) / 2;
        body.y = oldY + body.vy * dt * t;
        if (this._collides(body)) hi = t; else lo = t;
      }
      body.y = oldY + body.vy * dt * lo;
      body.grounded = fallingSpeed >= 0;
      body.vy = 0;
    }
    body.x = clamp(body.x, .001, this.width - body.w - .001);
    return fallingSpeed;
  }

  step(dt, input = {}) {
    if (!finite(dt) || dt <= 0 || this.dead) return;
    dt = Math.min(dt, .25);
    // Substeps prevent crossing a block at terminal velocity.
    const steps = Math.ceil(dt / .0167), slice = dt / steps;
    for (let i = 0; i < steps; i++) this._step(slice, input);
    this._jumpLatch = !!input.jump;
  }

  _step(dt, input) {
    if (this.dead) return;
    const p = this.player;
    this.time += dt / 1200;
    if (this.time >= 1) { this.time %= 1; this.day++; }
    this._attackCooldown = Math.max(0, this._attackCooldown - dt);
    const submerged = this.get(p.x + p.w / 2, p.y + p.h * .6) === BLOCKS.WATER;
    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const speed = submerged ? 2.5 : input.sprint && p.hunger > 5 ? 7.5 : 5;
    p.vx = direction * speed;
    if (direction) p.facing = direction;
    if (input.jump && (submerged || (!this._jumpLatch && p.grounded))) {
      p.vy = submerged ? -5 : -10.2;
      p.grounded = false;
      this._jumpLatch = true;
    }
    p.vy = Math.min(p.vy + (submerged ? 9 : 27) * dt, submerged ? 4 : 22);
    if (p.vy <= 0 || p.grounded || submerged) this._fallStart = p.y;
    const landingSpeed = this._move(p, dt);
    if (p.grounded) {
      const distance = p.y - this._fallStart;
      if (distance > 7 && landingSpeed > 15 && !submerged) this._damage(Math.floor(distance - 5));
      this._fallStart = p.y;
    }
    if (p.y > this.height) this._damage(20);
    if (this.mode !== 'creative') {
      this._hungerClock += dt * (input.sprint && direction ? 1.7 : 1);
      if (this._hungerClock >= 35) {
        this._hungerClock = 0;
        p.hunger = Math.max(0, p.hunger - 1);
      }
      this._regenClock += dt;
      if (this._regenClock >= 5) {
        this._regenClock = 0;
        if (p.hunger >= 16 && p.health < p.maxHealth) p.health = Math.min(p.maxHealth, p.health + 1);
        else if (p.hunger === 0) this._damage(1);
      }
    }
    this._stepMobs(dt);
    for (const job of Object.values(this.furnaces)) {
      if (!job.output) {
        job.remaining = Math.max(0, job.remaining - dt);
        if (job.remaining === 0) job.output = [...RECIPES.find(r => r.id === job.recipeId).output];
      }
    }
    this.drops = this.drops.filter(drop => {
      drop.age += dt;
      if (drop.age >= 300) return false;
      if (!this.dead && drop.age >= 2 && Math.hypot(drop.x - p.x - p.w / 2, drop.y - p.y - p.h / 2) < 1.3) {
        const old = this.getDurability(drop.item);
        this._add(drop.item, drop.count);
        if (drop.durability !== undefined) this.durability[drop.item] = Math.min(old?.current ?? drop.durability, drop.durability);
        this.message = `Picked up ${drop.count} ${ITEMS[drop.item].name}`;
        return false;
      }
      return true;
    });
    this._cropClock += dt;
    if (this._cropClock >= 1) {
      this._growCrops(this._cropClock);
      this._cropClock = 0;
    }
    this._mobClock += dt;
    if (this._mobClock > 7) {
      this._mobClock = 0;
      const night = this.time > .54 && this.time < .96;
      if (night && this.mode !== 'creative' && this.mobs.filter(m => m.type === 'zombie').length < 7) {
        const x = Math.round(clamp(p.x + (this._random() > .5 ? 1 : -1) * (22 + this._random() * 14), 3, this.width - 4));
        this._spawnMob('zombie', x);
      }
      if (this.mobs.filter(m => m.type === 'sheep').length < 4 && this._random() < .3) {
        const x = Math.round(clamp(p.x + (this._random() > .5 ? 1 : -1) * 32, 3, this.width - 4));
        this._spawnMob('sheep', x);
      }
    }
  }

  _damage(amount) {
    if (this.mode === 'creative' || this.dead) return;
    this.player.health = Math.max(0, this.player.health - amount);
    if (this.player.health === 0) {
      this.dead = true;
      for (const [item, count] of Object.entries(this.inventory)) {
        if (count <= 0) continue;
        const drop = { x: this.player.x + this.player.w / 2, y: this.player.y + this.player.h / 2, item, count, age: 0 };
        const durability = this.getDurability(item);
        if (durability) drop.durability = durability.current;
        this.drops.push(drop);
      }
      this.inventory = Object.create(null);
      // Stored tools keep their wear even when the player dies with empty pockets.
      this.durability = Object.assign(Object.create(null), Object.fromEntries(Object.entries(this.durability).filter(([id]) => Object.values(this.chests).some(chest => chest[id] > 0))));
      this.cancelMining();
      this.message = 'You died. Your items are where you fell. Recover them before they disappear.';
    }
  }

  _spawnMob(type, x) {
    const sheep = type === 'sheep';
    const mob = { id: this._nextMobId++, type, x, y: this.surface[Math.floor(x)] - (sheep ? .95 : 1.75) - .02, w: sheep ? 1.15 : .65, h: sheep ? .95 : 1.75, vx: 0, vy: 0, health: sheep ? 6 : 12, facing: this._random() > .5 ? 1 : -1, grounded: false, timer: this._random() * 4, attackClock: 0 };
    for (let i = 0; i < 10 && this._collides(mob); i++) mob.y--;
    this.mobs.push(mob);
  }

  _stepMobs(dt) {
    const p = this.player, day = this.time > .03 && this.time < .47;
    for (const mob of this.mobs) {
      mob.timer -= dt;
      mob.attackClock = Math.max(0, mob.attackClock - dt);
      const dx = p.x - mob.x;
      if (mob.type === 'zombie') {
        if (day && mob.y < this.surface[clamp(Math.floor(mob.x), 0, this.width - 1)] + 1) mob.health -= dt * 2;
        if (Math.abs(dx) < 38) { mob.facing = Math.sign(dx) || 1; mob.vx = mob.facing * 1.55; }
        else mob.vx = 0;
        if (this.mode !== 'creative' && overlaps(p, { ...mob, x: mob.x - .12, w: mob.w + .24 }) && mob.attackClock <= 0) {
          this._damage(2);
          mob.attackClock = 1.1;
        }
      } else {
        if (mob.timer <= 0) { mob.timer = 2 + this._random() * 4; mob.facing = this._random() > .5 ? 1 : -1; mob.vx = this._random() > .3 ? mob.facing * .65 : 0; }
      }
      const ahead = mob.facing > 0 ? mob.x + mob.w + .13 : mob.x - .13;
      if (mob.grounded && mob.vx && this.isSolid(ahead, mob.y + mob.h - .4)) mob.vy = -9;
      mob.vy = Math.min(mob.vy + 27 * dt, 22);
      this._move(mob, dt);
    }
    this.mobs = this.mobs.filter(m => m.health > 0 && m.y < this.height);
  }

  _inRange(x, y, reach = 5) {
    const p = this.player;
    return Math.hypot(x + .5 - (p.x + p.w / 2), y + .5 - (p.y + p.h / 2)) <= reach;
  }

  _held() {
    const id = this.hotbar[this.selected];
    return this.inventory[id] > 0 ? ITEMS[id] : null;
  }

  getDurability(id) {
    const item = ITEMS[id];
    if (!item?.maxDurability || !(this.inventory[id] > 0)) return null;
    return { current: this.durability[id] ?? item.maxDurability, max: item.maxDurability };
  }

  _wear(id, amount = 1) {
    if (this.mode === 'creative' || !ITEMS[id]?.maxDurability || !(this.inventory[id] > 0)) return false;
    this.durability[id] = (this.durability[id] ?? ITEMS[id].maxDurability) - amount;
    if (this.durability[id] > 0) return false;
    this.inventory[id]--;
    if (this.inventory[id] > 0) this.durability[id] = ITEMS[id].maxDurability;
    else delete this.durability[id];
    return true;
  }

  _add(id, count = 1) {
    if (this.durability[id] === undefined && ITEMS[id]?.maxDurability) this.durability[id] = ITEMS[id].maxDurability;
    this.inventory[id] = (this.inventory[id] || 0) + count;
  }
  _consume(id, count = 1) { if (this.mode !== 'creative') this.inventory[id] = Math.max(0, (this.inventory[id] || 0) - count); }
  _fail(message) { this.message = message; return { ok: false, message }; }

  _growCrops(dt) {
    for (const key of Object.keys(this.cropGrowth)) {
      const [x, y] = key.split(',').map(Number);
      if (this.get(x, y) !== BLOCKS.WHEAT) { delete this.cropGrowth[key]; continue; }
      if (this.get(x, y + 1) !== BLOCKS.FARMLAND) {
        this.set(x, y, BLOCKS.AIR);
        this._add('seeds');
        delete this.cropGrowth[key];
        continue;
      }
      let hydrated = false;
      for (let dx = -4; dx <= 4 && !hydrated; dx++) {
        for (let dy = -2; dy <= 2; dy++) if (this.get(x + dx, y + 1 + dy) === BLOCKS.WATER) { hydrated = true; break; }
      }
      this.cropGrowth[key] = Math.min(180, this.cropGrowth[key] + dt * (hydrated ? 2 : 1));
      if (this.cropGrowth[key] >= 180) { this.set(x, y, BLOCKS.WHEAT_RIPE); delete this.cropGrowth[key]; }
    }
  }

  _removeBlock(x, y, block) {
    if (DOOR_BLOCKS.has(block)) {
      const otherY = y + ([BLOCKS.DOOR_TOP, BLOCKS.DOOR_OPEN_TOP].includes(block) ? 1 : -1);
      if (DOOR_BLOCKS.has(this.get(x, otherY))) this.set(x, otherY, BLOCKS.AIR);
    }
    if (block === BLOCKS.BED || block === BLOCKS.BED_HEAD) {
      const footX = x - (block === BLOCKS.BED_HEAD ? 1 : 0);
      const otherX = block === BLOCKS.BED_HEAD ? x - 1 : x + 1;
      if ([BLOCKS.BED, BLOCKS.BED_HEAD].includes(this.get(otherX, y))) this.set(otherX, y, BLOCKS.AIR);
      if (this.spawnPoint?.x === footX && this.spawnPoint?.y === y) this.spawnPoint = null;
    }
    const key = `${x},${y}`;
    if (block === BLOCKS.CHEST) {
      for (const [id, n] of Object.entries(this.chests[key] || {})) this._add(id, n);
      delete this.chests[key];
    }
    if (block === BLOCKS.FURNACE && this.furnaces[key]) {
      const job = this.furnaces[key];
      if (job.output) this._add(...job.output);
      else for (const [id, count] of Object.entries(RECIPES.find(r => r.id === job.recipeId).cost)) this._add(id, count);
      delete this.furnaces[key];
    }
    if (block === BLOCKS.WHEAT_RIPE) this._add('seeds', 2);
    if (block === BLOCKS.GRASS && this._random() < .35) this._add('seeds');
    delete this.cropGrowth[key];
    if (block === BLOCKS.FARMLAND && [BLOCKS.WHEAT, BLOCKS.WHEAT_RIPE].includes(this.get(x, y - 1))) {
      const crop = this.get(x, y - 1);
      this._removeBlock(x, y - 1, crop);
      this._add(DROPS[crop]);
    }
    this.set(x, y, BLOCKS.AIR);
  }

  mine(x, y, dt = .0167) {
    if (this.dead) return this._fail('Respawn to keep exploring.');
    if (!finite(x) || !finite(y) || !finite(dt) || dt <= 0) return this._fail('Invalid mining target.');
    x = Math.floor(x); y = Math.floor(y);
    if (!this._inRange(x, y)) { this.cancelMining(); return this._fail('Move a little closer.'); }
    const block = this.get(x, y);
    if (block === BLOCKS.AIR || block === BLOCKS.WATER) { this.cancelMining(); return { ok: false }; }
    if (block === BLOCKS.BEDROCK) { this.cancelMining(); return this._fail('Bedrock cannot be broken.'); }
    const held = this._held(), tier = held?.kind === 'pickaxe' ? held.tier : 0;
    if (this.mode !== 'creative' && (TIERS[block] || 0) > tier) {
      this.cancelMining();
      return this._fail(`${TIERS[block] === 3 ? 'An iron' : TIERS[block] === 2 ? 'A stone' : 'A wood'} pickaxe or better is needed.`);
    }
    if (!this.mining || this.mining.x !== x || this.mining.y !== y) this.mining = { x, y, progress: 0 };
    const speed = held?.kind === 'axe' && WOODEN_BLOCKS.has(block) ? 2 + held.tier : tier && TIERS[block] ? 1 + tier * .35 : 1;
    this.mining.progress += this.mode === 'creative' ? 1 : Math.min(dt, .25) * speed / (HARDNESS[block] || 1);
    if (this.mining.progress < 1) return { ok: true, broken: false };
    this._removeBlock(x, y, block);
    const item = block === BLOCKS.GLASS && this.mode === 'creative' ? 'glass' : DROPS[block];
    if (item) this._add(item);
    if (block === BLOCKS.LEAVES && this._random() < .18) this._add('apple');
    this.stats.mined++;
    const toolBroke = held?.maxDurability && held.kind !== 'hoe' && this._wear(this.hotbar[this.selected], held.kind === 'sword' ? 2 : 1);
    this.cancelMining();
    this.message = `${item ? `+1 ${ITEMS[item].name}` : 'Block broken'}${toolBroke ? ` · ${held.name} broke!` : ''}`;
    return { ok: true, broken: true, item, toolBroke: !!toolBroke };
  }

  cancelMining() { this.mining = null; }

  place(x, y) {
    if (this.dead) return this._fail('Respawn to keep exploring.');
    if (!finite(x) || !finite(y)) return this._fail('Invalid building target.');
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height || !this._inRange(x, y)) return this._fail('Move a little closer.');
    const id = this.hotbar[this.selected], item = this._held();
    if (!item || item.block === undefined) return this._fail('Select a block in your hotbar to build.');
    const cells = [{ x, y, block: item.block }];
    if (item.block === BLOCKS.BED) cells.push({ x: x + 1, y, block: BLOCKS.BED_HEAD });
    if (item.block === BLOCKS.DOOR_BOTTOM) cells.push({ x, y: y - 1, block: BLOCKS.DOOR_TOP });
    for (const cell of cells) {
      if (cell.x < 0 || cell.x >= this.width || cell.y < 0 || cell.y >= this.height || !this._inRange(cell.x, cell.y)) return this._fail('Move closer to leave room for the whole block.');
      if (![BLOCKS.AIR, BLOCKS.WATER].includes(this.get(cell.x, cell.y))) return this._fail('That space is already occupied.');
      if (overlaps(this.player, { ...cell, w: 1, h: 1 })) return this._fail('Leave some room for yourself.');
      if (SOLID.has(cell.block) && this.mobs.some(m => overlaps(m, { ...cell, w: 1, h: 1 }))) return this._fail('There is a creature in the way.');
    }
    if ((item.block === BLOCKS.BED && !cells.every(cell => this.isSolid(cell.x, y + 1))) || (item.block === BLOCKS.DOOR_BOTTOM && !this.isSolid(x, y + 1))) return this._fail('Place this on solid ground.');
    for (const cell of cells) this.set(cell.x, cell.y, cell.block);
    if (item.block === BLOCKS.CHEST) this.chests[`${x},${y}`] = Object.create(null);
    this._consume(id);
    this.stats.placed++;
    this.message = `${item.name} placed`;
    return { ok: true };
  }

  interact(x, y) {
    if (this.dead) return this._fail('Respawn to keep exploring.');
    if (!finite(x) || !finite(y)) return this._fail('Invalid interaction target.');
    x = Math.floor(x); y = Math.floor(y);
    if (!this._inRange(x, y)) return this._fail('Move a little closer.');
    const block = this.get(x, y), held = this._held();
    if (DOOR_BLOCKS.has(block)) {
      const bottomY = y + ([BLOCKS.DOOR_TOP, BLOCKS.DOOR_OPEN_TOP].includes(block) ? 1 : 0);
      const open = [BLOCKS.DOOR_OPEN_BOTTOM, BLOCKS.DOOR_OPEN_TOP].includes(block);
      if (!DOOR_BLOCKS.has(this.get(x, bottomY - 1)) || !DOOR_BLOCKS.has(this.get(x, bottomY))) return this._fail('This door is incomplete.');
      if (open && [this.player, ...this.mobs].some(body => overlaps(body, { x, y: bottomY - 1, w: 1, h: 2 }))) return this._fail('There is someone in the doorway.');
      this.set(x, bottomY, open ? BLOCKS.DOOR_BOTTOM : BLOCKS.DOOR_OPEN_BOTTOM);
      this.set(x, bottomY - 1, open ? BLOCKS.DOOR_TOP : BLOCKS.DOOR_OPEN_TOP);
      this.message = open ? 'Door closed' : 'Door opened';
      return { ok: true, action: 'door', message: this.message };
    }
    if (block === BLOCKS.BED || block === BLOCKS.BED_HEAD) {
      this.spawnPoint = { x: x - (block === BLOCKS.BED_HEAD ? 1 : 0), y };
      if (this.time <= .54 || this.time >= .96) return this._fail('Respawn point set. You can sleep at night.');
      if (this.mobs.some(m => m.type === 'zombie' && Math.hypot(m.x - x, m.y - y) < 8)) return this._fail('Respawn point set. Monsters are too close to sleep.');
      this.time = .03;
      this.day++;
      this.message = 'Good morning! Respawn point set.';
      return { ok: true, action: 'sleep', message: this.message };
    }
    if (block === BLOCKS.CHEST) {
      this.chests[`${x},${y}`] ||= Object.create(null);
      return { ok: true, action: 'chest', x, y };
    }
    if (block === BLOCKS.WORKBENCH) return { ok: true, action: 'crafting', x, y };
    if (block === BLOCKS.FURNACE) return { ok: true, action: 'furnace', x, y };
    if (held?.kind === 'hoe' && [BLOCKS.GRASS, BLOCKS.DIRT].includes(block)) {
      if (this.get(x, y - 1) !== BLOCKS.AIR) return this._fail('Clear the space above the soil first.');
      this.set(x, y, BLOCKS.FARMLAND);
      const broke = this._wear(this.hotbar[this.selected]);
      this.message = `Soil tilled. Plant wheat seeds here.${broke ? ` ${held.name} broke!` : ''}`;
      return { ok: true, action: 'till', message: this.message };
    }
    if (held?.kind === 'seed') {
      const soilY = block === BLOCKS.FARMLAND ? y : y + 1;
      if (this.get(x, soilY) !== BLOCKS.FARMLAND || this.get(x, soilY - 1) !== BLOCKS.AIR) return this._fail('Plant seeds on empty tilled soil.');
      this.set(x, soilY - 1, BLOCKS.WHEAT);
      this.cropGrowth[`${x},${soilY - 1}`] = 0;
      this._consume('seeds');
      this.message = 'Wheat planted. Nearby water helps it grow faster.';
      return { ok: true, action: 'plant', message: this.message };
    }
    return this._fail('Use a crafting table, furnace, chest, door, bed, hoe, or seeds here.');
  }

  transferChest(x, y, itemId, count = 1, direction = 'deposit') {
    if (this.dead || !Number.isInteger(x) || !Number.isInteger(y) || !this._inRange(x, y) || this.get(x, y) !== BLOCKS.CHEST) return this._fail('Move closer to a chest.');
    if (!knownItem(itemId) || !Number.isInteger(count) || count <= 0 || count > 1000000 || !['deposit', 'withdraw'].includes(direction)) return this._fail('Invalid chest transfer.');
    const chest = this.chests[`${x},${y}`] ||= Object.create(null);
    const from = direction === 'deposit' ? this.inventory : chest;
    const to = direction === 'deposit' ? chest : this.inventory;
    if ((from[itemId] || 0) < count) return this._fail('There are not enough items to transfer.');
    if ((to[itemId] || 0) + count > 1000000) return this._fail('That stack is full.');
    from[itemId] -= count;
    if (direction === 'withdraw') this._add(itemId, count);
    else to[itemId] = (to[itemId] || 0) + count;
    this.message = `${direction === 'deposit' ? 'Stored' : 'Took'} ${count} ${ITEMS[itemId].name}`;
    return { ok: true, message: this.message };
  }

  startSmelt(x, y, recipeId) {
    if (this.dead || !Number.isInteger(x) || !Number.isInteger(y) || !this._inRange(x, y) || this.get(x, y) !== BLOCKS.FURNACE) return this._fail('Move closer to a furnace.');
    const recipe = RECIPES.find(r => r.id === recipeId && r.station === 'furnace');
    if (!recipe) return this._fail('This item cannot be smelted.');
    const key = `${x},${y}`;
    if (this.furnaces[key]) return this._fail(this.furnaces[key].output ? 'Collect the finished item first.' : 'This furnace is already burning.');
    if (this.mode !== 'creative' && Object.entries(recipe.cost).some(([id, n]) => (this.inventory[id] || 0) < n)) return this._fail('Gather the ingredients and coal first.');
    for (const [id, n] of Object.entries(recipe.cost)) this._consume(id, n);
    this.furnaces[key] = { recipeId, remaining: 10, output: null };
    this.message = 'Furnace lit. Ready in 10 seconds.';
    return { ok: true, message: this.message };
  }

  collectFurnace(x, y) {
    if (this.dead || !Number.isInteger(x) || !Number.isInteger(y) || !this._inRange(x, y) || this.get(x, y) !== BLOCKS.FURNACE) return this._fail('Move closer to a furnace.');
    const job = this.furnaces[`${x},${y}`];
    if (!job?.output) return this._fail(job ? 'The furnace is still burning.' : 'The furnace is empty.');
    this._add(...job.output);
    this.stats.crafted++;
    this.message = `Collected ${job.output[1]} ${ITEMS[job.output[0]].name}`;
    delete this.furnaces[`${x},${y}`];
    return { ok: true, message: this.message };
  }

  attack(x, y) {
    if (this.dead || !finite(x) || !finite(y) || this._attackCooldown > 0) return { ok: false };
    const p = this.player;
    const mob = this.mobs.find(m => x >= m.x - .25 && x <= m.x + m.w + .25 && y >= m.y - .25 && y <= m.y + m.h + .25 && Math.hypot(m.x + m.w / 2 - p.x - p.w / 2, m.y + m.h / 2 - p.y - p.h / 2) <= 3.1);
    if (!mob) return { ok: false };
    const held = this._held();
    const damage = this.mode === 'creative' ? 100 : held?.kind === 'sword' ? 2 + held.tier * 2 : held?.kind === 'axe' ? 3 + held.tier : held?.kind === 'pickaxe' ? 2 : 1;
    mob.health -= damage;
    mob.facing = Math.sign(mob.x - p.x) || 1;
    mob.vx = mob.facing * 4;
    mob.vy = -3;
    mob.timer = 1;
    this._attackCooldown = .35;
    const toolBroke = held?.maxDurability && this._wear(this.hotbar[this.selected], held.kind === 'sword' ? 1 : 2);
    this.message = `${held?.kind === 'sword' ? 'Hit' : 'Bonk'}!`;
    if (mob.health <= 0) {
      this.mobs = this.mobs.filter(m => m.id !== mob.id);
      this.stats.kills++;
      if (mob.type === 'sheep') { this._add('raw_mutton', 2); this._add('wool', 1); this.message = '+2 Raw mutton · +1 Wool'; }
      else { this._add('coal', 1); this.message = '+1 Coal'; }
    }
    if (toolBroke) this.message += ` · ${held.name} broke!`;
    return { ok: true, message: this.message };
  }

  useSelected() {
    if (this.dead) return this._fail('Respawn to keep exploring.');
    const id = this.hotbar[this.selected], item = this._held();
    if (!item || item.kind !== 'food') return this._fail('Select food in your hotbar to eat.');
    if (this.player.hunger >= this.player.maxHunger) return this._fail('You are already full.');
    this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + item.food);
    this._consume(id);
    this.message = `Ate ${item.name.toLowerCase()}`;
    return { ok: true, message: this.message };
  }

  select(index) {
    if (!Number.isInteger(index)) return false;
    this.selected = ((index % 9) + 9) % 9;
    this.cancelMining();
    return true;
  }

  assignHotbar(index, itemId) {
    if (!Number.isInteger(index) || index < 0 || index > 8 || !knownItem(itemId)) return false;
    this.hotbar[index] = itemId;
    this.cancelMining();
    return true;
  }

  nearStation(station) {
    const id = station === 'workbench' ? BLOCKS.WORKBENCH : station === 'furnace' ? BLOCKS.FURNACE : null;
    if (id === null) return false;
    const p = this.player, cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    for (let y = Math.floor(cy - 5); y <= Math.ceil(cy + 5); y++) {
      for (let x = Math.floor(cx - 5); x <= Math.ceil(cx + 5); x++) {
        if (this.get(x, y) === id && Math.hypot(x + .5 - cx, y + .5 - cy) <= 5) return true;
      }
    }
    return false;
  }

  canCraft(recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe || this.dead) return false;
    if (this.mode === 'creative') return true;
    return (!recipe.station || this.nearStation(recipe.station)) && Object.entries(recipe.cost).every(([id, n]) => (this.inventory[id] || 0) >= n);
  }

  craft(recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return this._fail('Unknown recipe.');
    if (this.dead) return this._fail('Respawn to keep exploring.');
    if (this.mode !== 'creative' && recipe.station && !this.nearStation(recipe.station)) return this._fail(`Place a ${recipe.station === 'workbench' ? 'crafting table' : 'furnace'} nearby first.`);
    if (!this.canCraft(recipeId)) return this._fail('Gather the ingredients first.');
    for (const [id, n] of Object.entries(recipe.cost)) this._consume(id, n);
    this._add(...recipe.output);
    this.stats.crafted++;
    this.message = `Crafted ${recipe.output[1]} ${ITEMS[recipe.output[0]].name}`;
    return { ok: true, message: this.message };
  }

  respawn() {
    const spawn = this._spawnPoint();
    Object.assign(this.player, spawn, { vx: 0, vy: 0, grounded: false, health: 20, hunger: 20 });
    this._fallStart = spawn.y;
    this.dead = false;
    this._hungerClock = 0;
    this._regenClock = 0;
    this._attackCooldown = 0;
    this._jumpLatch = false;
    this.cancelMining();
    this.mobs = this.mobs.filter(m => m.type !== 'zombie' || Math.abs(m.x - spawn.x) > 12);
    this.message = 'A fresh start. Recover your dropped items before they disappear.';
  }

  serialize() {
    return {
      version: SAVE_VERSION, seed: this.seed, mode: this.mode, width: this.width, height: this.height,
      tiles: Array.from(this.tiles), surface: [...this.surface], player: { ...this.player },
      inventory: { ...this.inventory }, hotbar: [...this.hotbar], selected: this.selected,
      time: this.time, day: this.day, mobs: this.mobs.map(m => ({ ...m })),
      stats: { ...this.stats }, dead: this.dead, randomState: this._randomState,
      durability: { ...this.durability },
      chests: Object.fromEntries(Object.entries(this.chests).map(([key, items]) => [key, { ...items }])),
      furnaces: Object.fromEntries(Object.entries(this.furnaces).map(([key, job]) => [key, { ...job, output: job.output ? [...job.output] : null }])),
      cropGrowth: { ...this.cropGrowth }, spawnPoint: this.spawnPoint ? { ...this.spawnPoint } : null,
      drops: this.drops.map(drop => ({ ...drop })),
    };
  }

  static deserialize(data) {
    if (typeof data === 'string') {
      if (data.length > 1500000) throw new Error('Save file is too large.');
      data = JSON.parse(data);
    }
    const fail = () => { throw new Error('This world save is invalid or uses an unsupported version.'); };
    if (!data || typeof data !== 'object' || data.version !== SAVE_VERSION || data.width !== 320 || data.height !== 100) fail();
    if (typeof data.seed !== 'string' || data.seed.length > 80 || !['survival', 'creative'].includes(data.mode)) fail();
    if (!Array.isArray(data.tiles) || data.tiles.length !== 32000 || !data.tiles.every(n => Number.isInteger(n) && n >= 0 && n <= 26)) fail();
    if (!Array.isArray(data.surface) || data.surface.length !== 320 || !data.surface.every(n => Number.isInteger(n) && n > 0 && n < 100)) fail();
    const p = data.player;
    if (!p || !['x', 'y', 'vx', 'vy', 'health', 'hunger'].every(key => finite(p[key]))) fail();
    if (p.x < 0 || p.x > 319.35 || p.y < -100 || p.y > 100 || p.health < 0 || p.health > 20 || p.hunger < 0 || p.hunger > 20 || Math.abs(p.vx) > 50 || Math.abs(p.vy) > 50) fail();
    if (!data.inventory || typeof data.inventory !== 'object' || Array.isArray(data.inventory) || Object.entries(data.inventory).some(([id, n]) => !knownItem(id) || !Number.isInteger(n) || n < 0 || n > 1000000)) fail();
    if (!Array.isArray(data.hotbar) || data.hotbar.length !== 9 || !data.hotbar.every(knownItem) || !Number.isInteger(data.selected) || data.selected < 0 || data.selected > 8) fail();
    if (!finite(data.time) || data.time < 0 || data.time >= 1 || !Number.isInteger(data.day) || data.day < 1 || data.day > 1000000 || typeof data.dead !== 'boolean') fail();
    if (!data.stats || !['mined', 'placed', 'crafted', 'kills'].every(k => Number.isInteger(data.stats[k]) && data.stats[k] >= 0 && data.stats[k] < 100000000)) fail();
    if (!Array.isArray(data.mobs) || data.mobs.length > 100 || data.mobs.some(m => !m || !['sheep', 'zombie'].includes(m.type) || !Number.isInteger(m.id) || m.id < 1 || !['x', 'y', 'vx', 'vy', 'health'].every(k => finite(m[k])) || m.x < 0 || m.x > 320 || m.y < -100 || m.y > 100 || m.health <= 0 || m.health > 20 || Math.abs(m.vx) > 50 || Math.abs(m.vy) > 50)) fail();
    const record = value => value && typeof value === 'object' && !Array.isArray(value);
    const validKey = key => {
      if (!/^(0|[1-9]\d{0,2}),(0|[1-9]\d?)$/.test(key)) return false;
      const [x, y] = key.split(',').map(Number);
      return x < 320 && y < 100;
    };
    const savedBlock = key => { const [x, y] = key.split(',').map(Number); return data.tiles[y * 320 + x]; };
    const validItems = value => record(value) && Object.entries(value).every(([id, n]) => knownItem(id) && Number.isInteger(n) && n >= 0 && n <= 1000000);
    if (data.durability !== undefined && (!record(data.durability) || Object.entries(data.durability).some(([id, n]) => !knownItem(id) || !ITEMS[id].maxDurability || !Number.isInteger(n) || n < 1 || n > ITEMS[id].maxDurability))) fail();
    if (data.chests !== undefined && (!record(data.chests) || Object.entries(data.chests).some(([key, items]) => !validKey(key) || savedBlock(key) !== BLOCKS.CHEST || !validItems(items)))) fail();
    if (data.cropGrowth !== undefined && (!record(data.cropGrowth) || Object.entries(data.cropGrowth).some(([key, seconds]) => !validKey(key) || savedBlock(key) !== BLOCKS.WHEAT || !finite(seconds) || seconds < 0 || seconds > 180))) fail();
    if (data.spawnPoint !== undefined && data.spawnPoint !== null && (!record(data.spawnPoint) || !validKey(`${data.spawnPoint.x},${data.spawnPoint.y}`) || savedBlock(`${data.spawnPoint.x},${data.spawnPoint.y}`) !== BLOCKS.BED)) fail();
    if (data.furnaces !== undefined && (!record(data.furnaces) || Object.entries(data.furnaces).some(([key, job]) => {
      if (!validKey(key) || savedBlock(key) !== BLOCKS.FURNACE || !record(job) || !finite(job.remaining) || job.remaining < 0 || job.remaining > 10) return true;
      const recipe = RECIPES.find(r => r.id === job.recipeId && r.station === 'furnace');
      return !recipe || (job.output !== null && (!Array.isArray(job.output) || job.output.length !== 2 || job.output[0] !== recipe.output[0] || job.output[1] !== recipe.output[1] || job.remaining !== 0));
    }))) fail();
    if (data.drops !== undefined && (!Array.isArray(data.drops) || data.drops.length > 1000 || data.drops.some(drop => !record(drop) || !knownItem(drop.item) || !Number.isInteger(drop.count) || drop.count < 1 || drop.count > 1000000 || !finite(drop.x) || drop.x < 0 || drop.x > 320 || !finite(drop.y) || drop.y < -100 || drop.y > 102 || !finite(drop.age) || drop.age < 0 || drop.age > 300 || (drop.durability !== undefined && (!ITEMS[drop.item].maxDurability || !Number.isInteger(drop.durability) || drop.durability < 1 || drop.durability > ITEMS[drop.item].maxDurability))))) fail();
    const game = new Game({ seed: data.seed, mode: data.mode });
    game.tiles = Uint8Array.from(data.tiles);
    game.surface = [...data.surface];
    Object.assign(game.player, { x: p.x, y: p.y, vx: p.vx, vy: p.vy, health: p.health, hunger: p.hunger, facing: p.facing === -1 ? -1 : 1, grounded: !!p.grounded });
    game.inventory = Object.assign(Object.create(null), data.inventory);
    game.hotbar = [...data.hotbar];
    game.selected = data.selected;
    game.time = data.time;
    game.day = data.day;
    game.stats = { mined: data.stats.mined, placed: data.stats.placed, crafted: data.stats.crafted, kills: data.stats.kills };
    game.dead = data.dead || p.health === 0;
    game.mobs = data.mobs.map(m => ({ id: m.id, type: m.type, x: m.x, y: m.y, vx: m.vx, vy: m.vy, health: m.health, w: m.type === 'sheep' ? 1.15 : .65, h: m.type === 'sheep' ? .95 : 1.75, facing: m.facing === -1 ? -1 : 1, grounded: !!m.grounded, timer: clamp(finite(m.timer) ? m.timer : 0, 0, 10), attackClock: clamp(finite(m.attackClock) ? m.attackClock : 0, 0, 2) }));
    game._nextMobId = Math.max(0, ...game.mobs.map(m => m.id)) + 1;
    game._randomState = Number.isInteger(data.randomState) ? data.randomState >>> 0 || 1 : game._randomState;
    game.durability = Object.assign(Object.create(null), data.durability || {});
    game.chests = Object.assign(Object.create(null), Object.fromEntries(Object.entries(data.chests || {}).map(([key, items]) => [key, Object.assign(Object.create(null), items)])));
    game.furnaces = Object.assign(Object.create(null), Object.fromEntries(Object.entries(data.furnaces || {}).map(([key, job]) => [key, { recipeId: job.recipeId, remaining: job.remaining, output: job.output ? [...job.output] : null }])));
    game.cropGrowth = Object.assign(Object.create(null), data.cropGrowth || {});
    game.spawnPoint = data.spawnPoint ? { x: data.spawnPoint.x, y: data.spawnPoint.y } : null;
    game.drops = (data.drops || []).map(drop => ({ x: drop.x, y: drop.y, item: drop.item, count: drop.count, age: drop.age, ...(drop.durability === undefined ? {} : { durability: drop.durability }) }));
    game._fallStart = game.player.y;
    // A modified save or collapsed world should never trap the player in a solid tile.
    if (game._collides(game.player)) Object.assign(game.player, game._spawnPoint(), { vx: 0, vy: 0, grounded: false });
    return game;
  }
}
