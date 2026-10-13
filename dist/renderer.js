import { BLOCKS } from './engine.js';

const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const noise = (x, y = 0) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const mix = (a, b, t) => a.map((n, i) => Math.round(n + (b[i] - n) * t));
const color = (v) => `rgb(${v.join(',')})`;
const PALETTES = {
  [BLOCKS.DIRT]: ['#745342', '#805d46', '#90684b', '#634737'],
  [BLOCKS.STONE]: ['#637171', '#70807d', '#7b8984', '#526364'],
  [BLOCKS.WOOD]: ['#765035', '#966338', '#aa7541', '#563d31'],
  [BLOCKS.LEAVES]: ['#366b44', '#467e4c', '#559454', '#295c3e'],
  [BLOCKS.SAND]: ['#caba84', '#d6c898', '#e0d3a4', '#b8a879'],
  [BLOCKS.PLANKS]: ['#aa794b', '#c39259', '#d2a16a', '#86613e'],
  [BLOCKS.BEDROCK]: ['#39474a', '#465456', '#586363', '#293b41'],
};

function makeTexture(id) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const x = c.getContext('2d');
  const base = id === BLOCKS.GRASS ? BLOCKS.DIRT : [BLOCKS.COAL, BLOCKS.IRON, BLOCKS.DIAMOND].includes(id) ? BLOCKS.STONE : id;
  const p = PALETTES[base] || PALETTES[BLOCKS.STONE];
  x.fillStyle = p[0]; x.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 29; i++) {
    x.fillStyle = p[1 + Math.floor(noise(i, id) * 3)];
    x.fillRect(Math.floor(noise(i + 80, id) * 15), Math.floor(noise(i + 40, id) * 16), 1 + Math.floor(noise(i + 20, id) * 4), 1 + Math.floor(noise(i + 60, id) * 2));
  }
  if (id === BLOCKS.GRASS) {
    x.fillStyle = '#44743d'; x.fillRect(0, 0, 16, 5);
    x.fillStyle = '#78a850'; x.fillRect(0, 0, 16, 2);
    x.fillStyle = '#5b9346'; x.fillRect(0, 2, 16, 2);
    x.fillStyle = '#44743d';
    for (let i = 0; i < 16; i += 2) x.fillRect(i, 4, 2, 1 + noise(i, 49) * 3);
    x.fillStyle = '#97b965'; x.fillRect(1, 0, 4, 1); x.fillRect(9, 0, 3, 1);
  }
  if (id === BLOCKS.WOOD) {
    x.fillStyle = '#5f422e'; x.fillRect(0, 0, 2, 16); x.fillRect(13, 0, 3, 16);
    x.fillStyle = '#bc8250'; x.fillRect(3, 0, 2, 16);
    x.fillStyle = '#64432f'; x.fillRect(7, 2, 1, 7); x.fillRect(9, 9, 2, 6); x.fillRect(4, 11, 1, 4);
    x.fillStyle = '#97693d'; x.fillRect(10, 0, 2, 8);
  }
  if (id === BLOCKS.LEAVES) {
    x.clearRect(0, 0, 16, 16);
    x.fillStyle = '#32643e'; x.fillRect(1, 1, 14, 14); x.fillRect(0, 4, 16, 7); x.fillRect(4, 0, 8, 16);
    for (let i = 0; i < 23; i++) {
      x.fillStyle = ['#3a7044', '#4f8449', '#629a50', '#2b5e3d'][i % 4];
      x.fillRect(Math.floor(noise(i, 1) * 14), Math.floor(noise(i, 2) * 14), 2 + i % 3, 2);
    }
  }
  if ([BLOCKS.COAL, BLOCKS.IRON, BLOCKS.DIAMOND].includes(id)) {
    const ores = { [BLOCKS.COAL]: ['#303f42', '#263439', '#455254'], [BLOCKS.IRON]: ['#c49977', '#9c7359', '#e0b68c'], [BLOCKS.DIAMOND]: ['#5ed3cf', '#258f9c', '#a1f6df'] };
    const op = ores[id];
    [[2, 3], [9, 2], [6, 9], [12, 12], [1, 12]].forEach(([a, b], i) => {
      x.fillStyle = op[1]; x.fillRect(a, b, 3, 3);
      x.fillStyle = op[0]; x.fillRect(a, b, 2, 2);
      x.fillStyle = op[2]; x.fillRect(a, b, 1, 1);
    });
  }
  if (id === BLOCKS.PLANKS || id === BLOCKS.WORKBENCH) {
    x.fillStyle = '#b7804d'; x.fillRect(0, 0, 16, 16);
    for (let j = 0; j < 4; j++) {
      x.fillStyle = '#795337'; x.fillRect(0, j * 4 + 3, 16, 1); x.fillRect(j % 2 ? 10 : 4, j * 4, 1, 4);
      x.fillStyle = '#d39b60'; x.fillRect(0, j * 4, 16, 1);
    }
    if (id === BLOCKS.WORKBENCH) {
      x.fillStyle = '#654832'; x.fillRect(0, 0, 16, 4); x.fillRect(2, 4, 2, 12); x.fillRect(12, 4, 2, 12);
      x.fillStyle = '#d2a071'; x.fillRect(1, 0, 14, 2);
      x.fillStyle = '#8c653f'; x.fillRect(4, 0, 1, 3); x.fillRect(10, 0, 1, 3);
      x.fillStyle = '#4e3b2c'; x.fillRect(5, 7, 5, 5);
      x.fillStyle = '#b8b9a0'; x.fillRect(6, 7, 1, 4); x.fillRect(7, 7, 3, 1);
    }
  }
  if (id === BLOCKS.FURNACE) {
    x.fillStyle = '#58686b'; x.fillRect(0, 0, 16, 16);
    x.fillStyle = '#849290'; x.fillRect(0, 0, 16, 2); x.fillRect(0, 0, 2, 16);
    x.fillStyle = '#384a50'; x.fillRect(14, 0, 2, 16); x.fillRect(0, 14, 16, 2);
    x.fillStyle = '#263d44'; x.fillRect(4, 4, 8, 3); x.fillRect(3, 9, 10, 5);
    x.fillStyle = '#a96235'; x.fillRect(5, 11, 6, 2);
    x.fillStyle = '#f2b253'; x.fillRect(6, 11, 2, 2); x.fillRect(9, 10, 1, 3);
  }
  return c;
}

const ICON_COLORS = {
  dirt: '#916746', stone: '#80918b', wood: '#b57a45', planks: '#cea16c', sand: '#d4c78f', leaves: '#5d914d',
  iron_ore: '#c19b79', iron_ingot: '#ced8d2', coal: '#41504d', diamond: '#65ddd0', apple: '#d66447',
};

/** Pixel-art item icons; x/y are the icon's top-left corner. */
export function drawItem(ctx, id, x, y, size = 32) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(size / 16, size / 16); ctx.imageSmoothingEnabled = false;
  const rect = (color, a, b, w, h) => { ctx.fillStyle = color; ctx.fillRect(a, b, w, h); };
  if (id?.includes('pickaxe') || id?.includes('sword')) {
    const c = id.startsWith('diamond') ? '#65d9d0' : id.startsWith('iron') ? '#d6dfce' : id.startsWith('stone') ? '#91a4a0' : '#c6985c';
    if (id.includes('pickaxe')) {
      rect('#433c2f', 3, 12, 3, 3); rect('#b88650', 4, 11, 2, 3); rect('#b88650', 6, 9, 2, 3); rect('#b88650', 8, 7, 2, 3);
      rect('#33483f', 3, 2, 9, 3); rect('#33483f', 10, 4, 4, 5); rect(c, 3, 2, 8, 2); rect(c, 9, 3, 3, 2); rect(c, 11, 5, 2, 4);
      rect('#f0e9ba', 4, 2, 4, 1);
    } else {
      rect('#564235', 3, 12, 2, 3); rect('#b28c51', 4, 10, 2, 3); rect('#d7b66b', 3, 9, 5, 2); rect('#d7b66b', 6, 10, 2, 3);
      for (let i = 0; i < 7; i++) { rect('#3d594e', 6 + i, 8 - i, 3, 3); rect(c, 7 + i, 8 - i, 2, 2); }
      rect('#eff4d5', 12, 2, 2, 1);
    }
  } else if (id === 'torch') {
    rect('#6c4d32', 7, 7, 3, 8); rect('#c49d5d', 7, 7, 1, 8); rect('#d57e3b', 6, 3, 5, 6); rect('#ffd971', 7, 2, 3, 6); rect('#fff4bd', 8, 4, 1, 3);
  } else if (id === 'stick') {
    for (let i = 0; i < 9; i++) { rect('#805d38', 3 + i, 12 - i, 2, 2); rect('#bf9159', 3 + i, 12 - i, 1, 1); }
  } else if (id === 'apple') {
    rect('#5a643b', 8, 1, 1, 3); rect('#81a758', 9, 1, 3, 2); rect('#aa4339', 3, 5, 10, 7); rect('#d75e46', 4, 4, 8, 9); rect('#e87c55', 4, 5, 3, 4); rect('#ffb882', 5, 5, 1, 2); rect('#9e463b', 6, 12, 5, 1);
  } else if (['raw_meat', 'cooked_meat', 'raw_mutton', 'cooked_mutton'].includes(id)) {
    rect('#e3d5b0', 2, 11, 5, 2); rect('#f2e2b5', 2, 10, 2, 4);
    rect('#5c4637', 6, 4, 7, 8); rect(id.startsWith('raw') ? '#c87966' : '#a77848', 5, 4, 8, 6); rect(id.startsWith('raw') ? '#e59d87' : '#d9a666', 7, 3, 5, 5); rect('#edc99b', 8, 4, 3, 1);
  } else if (id === 'diamond') {
    rect('#257e81', 3, 4, 10, 6); rect('#56cabe', 4, 3, 8, 8); rect('#7ae3cd', 5, 2, 6, 10); rect('#b9f9de', 5, 3, 3, 3); rect('#3ca9a7', 7, 11, 3, 2); rect('#dbffe9', 6, 3, 2, 1);
  } else if (id === 'coal') {
    rect('#293b3b', 3, 5, 10, 7); rect('#3e504d', 4, 3, 8, 9); rect('#5b6b5c', 5, 4, 4, 2); rect('#233333', 5, 11, 6, 2);
  } else if (id === 'iron_ingot') {
    rect('#6b8680', 2, 7, 12, 5); rect('#a0b6a7', 3, 5, 10, 6); rect('#d0dcc1', 4, 4, 8, 5); rect('#eef0d6', 4, 4, 8, 1); rect('#6c8881', 11, 8, 2, 3);
  } else {
    const c = ICON_COLORS[id] || '#b68a58';
    rect('#31493e', 2, 4, 12, 10); rect(c, 3, 3, 10, 10);
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = .22; ctx.fillRect(3, 3, 10, 2); ctx.fillRect(3, 3, 2, 10); ctx.globalAlpha = 1;
    ctx.fillStyle = '#132d2c'; ctx.globalAlpha = .22; ctx.fillRect(11, 5, 2, 8); ctx.fillRect(5, 11, 8, 2); ctx.globalAlpha = 1;
    if (id === 'wood') { rect('#63462e', 6, 4, 1, 7); rect('#d6a263', 8, 4, 1, 8); rect('#78502f', 10, 6, 1, 6); }
    else if (id === 'planks') { rect('#805c3c', 3, 6, 10, 1); rect('#805c3c', 3, 9, 10, 1); rect('#805c3c', 7, 3, 1, 3); rect('#805c3c', 9, 7, 1, 2); }
    else if (id === 'workbench') { rect('#d3a570', 2, 3, 12, 3); rect('#775339', 3, 6, 2, 7); rect('#775339', 11, 6, 2, 7); rect('#483f31', 6, 7, 4, 4); rect('#ccbc86', 7, 8, 2, 1); }
    else if (id === 'furnace') { rect('#8b9e92', 2, 3, 12, 11); rect('#394d49', 4, 5, 8, 2); rect('#394d49', 4, 9, 8, 4); rect('#f5b45d', 6, 10, 4, 2); }
    else if (id === 'iron_ore') { rect('#d1b18b', 4, 6, 3, 2); rect('#d1b18b', 8, 9, 2, 2); rect('#e2c4a0', 9, 4, 2, 2); }
    else { rect('#ffffff22', 5, 7, 3, 1); rect('#243e372b', 8, 9, 2, 2); rect('#ffffff22', 9, 5, 2, 1); }
  }
  ctx.restore();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.camera = { x: 0, y: 0 };
    this.textures = new Map(); this.elapsed = 0; this.started = false; this.tile = 36; this.TILE = 36; this.debris = [];
    this.resize();
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, r.width || window.innerWidth); this.height = Math.max(1, r.height || window.innerHeight);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); this.canvas.width = Math.round(this.width * this.dpr); this.canvas.height = Math.round(this.height * this.dpr);
    this.tile = this.width < 650 ? 30 : this.width > 1500 ? 40 : 36; this.TILE = this.tile;
    this.ctx.imageSmoothingEnabled = false;
  }
  screenToWorld(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: Math.floor((clientX - r.left) / this.tile + this.camera.x), y: Math.floor((clientY - r.top) / this.tile + this.camera.y) };
  }
  worldToScreen(x, y) {
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + (x - this.camera.x) * this.tile, y: r.top + (y - this.camera.y) * this.tile };
  }
  drawItem(...args) { drawItem(...args); }
  texture(id) { if (!this.textures.has(id)) this.textures.set(id, makeTexture(id)); return this.textures.get(id); }
  render(game, dt = 1 / 60, options = {}) {
    if (!game?.player) return;
    const c = this.ctx, t = this.tile, w = this.width, h = this.height;
    this.elapsed += Math.min(dt, .1);
    if (this.lastMine && (!game.mining || game.mining.x !== this.lastMine.x || game.mining.y !== this.lastMine.y) && game.get(this.lastMine.x, this.lastMine.y) === BLOCKS.AIR) {
      const b = this.lastMine;
      const palette = PALETTES[b.id] || (b.id === BLOCKS.GRASS ? PALETTES[BLOCKS.DIRT] : PALETTES[BLOCKS.STONE]);
      for (let i = 0; i < 10; i++) this.debris.push({ x: b.x + .15 + noise(i, this.elapsed) * .7, y: b.y + .15 + noise(i, 97) * .7, vx: (noise(i, 87) - .5) * 4, vy: -1 - noise(i, 7) * 3, life: .55, color: palette[i % 4], size: 2 + i % 3 });
    }
    this.lastMine = game.mining ? { x: game.mining.x, y: game.mining.y, id: game.get(game.mining.x, game.mining.y) } : null;
    for (const bit of this.debris) { bit.life -= Math.min(dt, .1); bit.x += bit.vx * dt; bit.y += bit.vy * dt; bit.vy += 12 * dt; }
    this.debris = this.debris.filter(bit => bit.life > 0);
    const p = game.player;
    const cx = clamp(p.x + (p.w || .65) / 2 - w / t / 2, 0, Math.max(0, game.width - w / t));
    const cy = clamp(p.y + (p.h || 1.8) / 2 - h / t * .57, 0, Math.max(0, game.height - h / t));
    const ease = this.started ? 1 - Math.exp(-Math.max(.001, dt) * 9) : 1;
    this.camera.x += (cx - this.camera.x) * ease; this.camera.y += (cy - this.camera.y) * ease; this.started = true;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.imageSmoothingEnabled = false;
    const daylight = clamp(Math.sin((game.time ?? .15) * TAU) * 1.5 + .12, 0, 1);
    this.background(daylight, game);
    const left = Math.max(0, Math.floor(this.camera.x) - 1), right = Math.min(game.width - 1, Math.ceil(this.camera.x + w / t) + 1);
    const top = Math.max(0, Math.floor(this.camera.y) - 1), bottom = Math.min(game.height - 1, Math.ceil(this.camera.y + h / t) + 1);
    c.save(); c.translate(-Math.round(this.camera.x * t), -Math.round(this.camera.y * t));
    this.underground(game, left, right, bottom);
    const torches = [];
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const id = game.get ? game.get(x, y) : game.tiles[y * game.width + x];
      if (!id) continue;
      if (id === BLOCKS.TORCH) { torches.push({ x, y }); continue; }
      if (id === BLOCKS.WATER) { this.water(x, y, game); continue; }
      c.drawImage(this.texture(id), x * t, y * t, t, t);
      if (id !== BLOCKS.LEAVES && id !== BLOCKS.WOOD) {
        const above = game.get ? game.get(x, y - 1) : game.tiles[(y - 1) * game.width + x];
        if (!above) { c.fillStyle = '#e4edc919'; c.fillRect(x * t, y * t, t, 2); }
        const below = game.get ? game.get(x, y + 1) : game.tiles[(y + 1) * game.width + x];
        if (!below) { c.fillStyle = '#0d282955'; c.fillRect(x * t, (y + 1) * t - 3, t, 3); }
        const nx = game.get ? game.get(x - 1, y) : game.tiles[y * game.width + x - 1];
        if (!nx) { c.fillStyle = '#122d2b25'; c.fillRect(x * t, y * t, 3, t); }
        if (id === BLOCKS.GRASS && !above) this.grass(x, y);
      }
    }
    for (const m of game.mobs || []) if (m.x >= left - 2 && m.x <= right + 2 && m.health > 0) this.mob(m);
    this.player(p, game);
    for (const bit of [...(game.particles || []), ...this.debris]) {
      if (bit.life !== undefined && bit.life <= 0) continue;
      c.globalAlpha = Math.min(1, (bit.life ?? 1) * 3); c.fillStyle = bit.color || '#b9a773';
      const size = bit.size ? (bit.size < 1 ? bit.size * t : bit.size) : 3;
      c.fillRect(Math.round(bit.x * t), Math.round(bit.y * t), size, size);
    }
    c.globalAlpha = 1;
    for (const torch of torches) this.torch(torch.x, torch.y);
    c.restore();
    if (daylight < .95) { c.fillStyle = `rgba(10,26,48,${(1 - daylight) * .43})`; c.fillRect(0, 0, w, h); }
    const depth = clamp((p.y - (game.surface?.[Math.floor(p.x)] ?? 30) - 2) / 10, 0, 1);
    if (depth > 0) {
      const px = (p.x + (p.w || .65) / 2 - this.camera.x) * t, py = (p.y + .8 - this.camera.y) * t;
      const shadow = c.createRadialGradient(px, py, t * 1.5, px, py, Math.max(w, h) * .64);
      shadow.addColorStop(0, `rgba(4,17,24,${depth * .06})`); shadow.addColorStop(.38, `rgba(4,17,24,${depth * .45})`); shadow.addColorStop(1, `rgba(4,17,24,${depth * .87})`);
      c.fillStyle = shadow; c.fillRect(0, 0, w, h);
    }
    // Pools of lamplight remain warm after the cool night wash.
    for (const torch of torches) {
      const x = (torch.x + .5 - this.camera.x) * t, y = (torch.y + .38 - this.camera.y) * t;
      c.save(); c.globalCompositeOperation = 'screen';
      const glow = c.createRadialGradient(x, y, 3, x, y, t * 3.1);
      glow.addColorStop(0, '#ffaa494a'); glow.addColorStop(.35, '#e58d2820'); glow.addColorStop(1, '#b2751500');
      c.fillStyle = glow; c.fillRect(x - t * 3.1, y - t * 3.1, t * 6.2, t * 6.2); c.restore();
    }
    const target = options.target;
    if (target && options.showTarget !== false) this.target(game, target);
    const vignette = c.createRadialGradient(w * .5, h * .4, Math.min(w, h) * .25, w * .5, h * .5, Math.max(w, h) * .7);
    vignette.addColorStop(0, '#081d2500'); vignette.addColorStop(1, '#071c2545'); c.fillStyle = vignette; c.fillRect(0, 0, w, h);
  }
  background(day, game) {
    const c = this.ctx, w = this.width, h = this.height, t = this.tile;
    const gradient = c.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color(mix([16, 31, 48], [79, 142, 158], day)));
    gradient.addColorStop(.7, color(mix([36, 58, 68], [174, 210, 190], day)));
    gradient.addColorStop(1, color(mix([50, 77, 75], [207, 216, 174], day)));
    c.fillStyle = gradient; c.fillRect(0, 0, w, h);
    if (day < .7) {
      for (let i = 0; i < 80; i++) {
        c.globalAlpha = (1 - day) * (.4 + noise(i, 4) * .6) * (.85 + Math.sin(this.elapsed + i) * .15);
        c.fillStyle = '#dcead0'; const sx = noise(i, 8) * w, sy = noise(i, 9) * h * .62;
        c.fillRect(sx | 0, sy | 0, i % 9 ? 2 : 3, i % 9 ? 2 : 3);
      }
      c.globalAlpha = 1;
    }
    const sunX = w * .78 - this.camera.x * t * .025, sunY = h * .17 + Math.sin((game.time ?? .28) * TAU) * h * .015;
    const sunSize = Math.max(29, t * 1.12);
    const halo = c.createRadialGradient(sunX, sunY, 8, sunX, sunY, sunSize * 4);
    halo.addColorStop(0, day > .3 ? '#fff1ad35' : '#d2e7ce20'); halo.addColorStop(1, '#fff1ad00');
    c.fillStyle = halo; c.fillRect(sunX - sunSize * 4, sunY - sunSize * 4, sunSize * 8, sunSize * 8);
    c.fillStyle = day > .3 ? '#f3ecc0' : '#d0e0c9'; c.fillRect(Math.round(sunX), Math.round(sunY), sunSize, sunSize);
    c.fillStyle = day > .3 ? '#fff6d0' : '#e3edd6'; c.fillRect(Math.round(sunX + 4), Math.round(sunY + 4), sunSize - 8, sunSize - 8);
    if (day <= .3) { c.fillStyle = '#9dbbb255'; c.fillRect(sunX + 7, sunY + 10, 7, 6); c.fillRect(sunX + 22, sunY + 24, 5, 4); }
    c.globalAlpha = .34 + day * .2;
    for (let i = 0; i < 7; i++) {
      const scale = .7 + noise(i, 82) * .85, cw = 124 * scale;
      const x = ((i * 269 - this.camera.x * t * .09 + this.elapsed * 1.3) % (w + 350) + w + 350) % (w + 350) - 170;
      const y = h * (.13 + noise(i, 50) * .26);
      c.fillStyle = day > .3 ? '#e0ecda' : '#769391';
      c.fillRect(Math.round(x), Math.round(y), cw, 11 * scale); c.fillRect(Math.round(x + 22 * scale), Math.round(y - 10 * scale), cw * .56, 10 * scale);
      c.fillRect(Math.round(x + 47 * scale), Math.round(y - 17 * scale), cw * .29, 7 * scale);
      c.fillStyle = day > .3 ? '#adcabd' : '#5a777d'; c.fillRect(Math.round(x + 9 * scale), Math.round(y + 11 * scale), cw * .75, 5 * scale);
    }
    c.globalAlpha = 1;
    // Slow camera parallax gives every ridge its own depth.
    const groundLine = ((game.surface?.[Math.floor(game.player.x)] ?? 30) - this.camera.y) * t;
    const horizon = groundLine - h * .09;
    const layers = [
      { color: color(mix([36, 63, 75], [119, 161, 156], day)), y: horizon - h * .16, amp: h * .19, speed: .08, seed: 14 },
      { color: color(mix([28, 56, 65], [87, 136, 137], day)), y: horizon - h * .02, amp: h * .22, speed: .16, seed: 71 },
      { color: color(mix([23, 49, 54], [56, 112, 113], day)), y: horizon + h * .12, amp: h * .17, speed: .26, seed: 39 },
    ];
    for (const layer of layers) {
      c.fillStyle = layer.color; c.beginPath(); c.moveTo(0, h);
      for (let x = -12; x <= w + 12; x += 6) {
        const xx = x + this.camera.x * t * layer.speed;
        const y = layer.y - (Math.sin(xx * .004 + layer.seed) * .5 + Math.sin(xx * .009 + layer.seed) * .24 + Math.sin(xx * .017 + layer.seed) * .12) * layer.amp;
        c.lineTo(x, Math.floor(y / 4) * 4);
      }
      c.lineTo(w, h); c.closePath(); c.fill();
    }
    // A pine treeline just beyond the playable ground.
    for (let layer = 0; layer < 2; layer++) {
      const spacing = layer ? 59 : 43, speed = layer ? .43 : .32;
      const offset = this.camera.x * t * speed;
      const start = Math.floor(offset / spacing) - 2;
      c.fillStyle = color(mix(layer ? [17, 44, 44] : [25, 56, 57], layer ? [40, 85, 77] : [52, 106, 101], day));
      for (let i = start; i < start + w / spacing + 5; i++) {
        const x = i * spacing - offset;
        const y = horizon + h * (layer ? .13 : .08) + Math.sin(i * .39) * 18;
        const size = (layer ? 50 : 37) + noise(i, 39) * (layer ? 100 : 64);
        this.pine(x, y, size, .36 + noise(i, 63) * .13);
      }
    }
    // A few distant birds, each just a handful of pixels.
    if (day > .45) {
      c.fillStyle = '#3d72796b';
      for (let i = 0; i < 3; i++) {
        const x = ((w * .38 + i * 24 + this.elapsed * 5 - this.camera.x * t * .12) % (w + 50) + w + 50) % (w + 50);
        const y = h * .29 + i * 8 + Math.sin(this.elapsed * 1.7 + i) * 2;
        c.fillRect(x, y, 3, 2); c.fillRect(x - 3, y - 2, 3, 2); c.fillRect(x + 3, y - 2, 3, 2);
      }
    }
  }
  pine(x, y, size, width) {
    const c = this.ctx, step = 4;
    x = Math.round(x / step) * step; y = Math.round(y / step) * step;
    c.fillRect(x - 2, y - size * .25, 4, size * .25);
    for (let i = 0; i < 4; i++) {
      const top = y - size + i * size * .18, bottom = top + size * .39;
      const full = size * width * (.45 + i * .18);
      for (let yy = top; yy < bottom; yy += step) {
        const half = Math.round(((yy - top) / (bottom - top) * full) / step) * step;
        c.fillRect(x - half, Math.round(yy / step) * step, half * 2 + step, step);
      }
    }
  }
  underground(game, left, right, bottom) {
    const c = this.ctx, t = this.tile;
    c.beginPath(); c.moveTo(left * t, (bottom + 2) * t);
    for (let x = left; x <= right + 1; x++) {
      const y = (game.surface?.[Math.min(x, game.width - 1)] ?? 30) + .28;
      c.lineTo(x * t, y * t); c.lineTo((x + 1) * t, y * t);
    }
    c.lineTo((right + 2) * t, (bottom + 2) * t); c.closePath();
    const g = c.createLinearGradient(0, 29 * t, 0, 62 * t);
    g.addColorStop(0, '#465446'); g.addColorStop(.18, '#2d4140'); g.addColorStop(.6, '#203538'); g.addColorStop(1, '#132a31'); c.fillStyle = g; c.fill();
    c.save(); c.clip();
    for (let y = Math.max(0, Math.floor(this.camera.y)); y <= bottom; y++) for (let x = left; x <= right; x++) {
      if (noise(x, y) > .77) { c.fillStyle = '#b3bba60b'; c.fillRect((x + .15) * t, (y + .28) * t, 4, 2); c.fillRect((x + .62) * t, (y + .8) * t, 2, 2); }
    }
    c.restore();
  }
  grass(x, y) {
    const c = this.ctx, t = this.tile, n = noise(x, y);
    if (n > .3) {
      const sway = Math.sin(this.elapsed * 1.6 + x * .8) > .2 ? 1 : 0;
      c.fillStyle = '#729a4e'; c.fillRect((x + .22) * t, y * t - 5, 2, 5); c.fillRect((x + .7) * t, y * t - 7, 2, 7);
      c.fillStyle = '#91b363'; c.fillRect((x + .22) * t - 2 + sway, y * t - 7, 2, 3); c.fillRect((x + .7) * t + 2 - sway, y * t - 9, 2, 4);
    }
    if (n > .83) {
      const xx = Math.round((x + .49) * t), yy = Math.round(y * t - 9 - noise(x, 7) * 5);
      c.fillStyle = '#4f7c44'; c.fillRect(xx, yy + 3, 2, y * t - yy - 3); c.fillRect(xx + 2, yy + 6, 3, 2);
      c.fillStyle = n > .92 ? '#e8dca5' : '#d99472'; c.fillRect(xx - 2, yy, 6, 4); c.fillRect(xx, yy - 2, 2, 8);
      c.fillStyle = '#f3ce6b'; c.fillRect(xx, yy, 2, 2);
    }
  }
  water(x, y, game) {
    const c = this.ctx, t = this.tile, above = game.get ? game.get(x, y - 1) : game.tiles[(y - 1) * game.width + x];
    const offset = above !== BLOCKS.WATER ? t * .12 : 0;
    c.fillStyle = '#3e929bd4'; c.fillRect(x * t, y * t + offset, t, t - offset);
    c.fillStyle = '#8dcfc477';
    if (above !== BLOCKS.WATER) c.fillRect(x * t, y * t + t * .12, t, 2);
    const shift = Math.sin(this.elapsed * 1.3 + x * 2 + y) * 4;
    c.fillRect(x * t + 7 + shift, y * t + t * .35, t * .3, 2); c.fillStyle = '#205f792c'; c.fillRect(x * t + 16 - shift, y * t + t * .77, t * .25, 2);
  }
  player(p, game) {
    const c = this.ctx, t = this.tile, scale = t / 16, w = p.w || .65, h = p.h || 1.8;
    const x = Math.round((p.x + w / 2) * t), y = Math.round((p.y + h) * t), walking = Math.abs(p.vx || 0) > .2 && p.grounded;
    const walk = walking ? Math.sin(this.elapsed * 12) * 2 : 0;
    if (p.grounded) { c.fillStyle = '#172d3050'; c.fillRect(x - t * .36, y - 2, t * .72, 3); }
    c.save(); c.translate(x, y); c.scale((p.facing || 1) * scale, scale);
    if (p.invulnerable > 0 && Math.floor(this.elapsed * 15) % 2) c.globalAlpha = .55;
    const r = (col, xx, yy, ww, hh) => { c.fillStyle = col; c.fillRect(Math.round(xx), Math.round(yy), ww, hh); };
    // Backpack, boots and rolled sleeves give the tiny explorer a readable silhouette.
    r('#304447', -6, -19, 4, 10); r('#a5804f', -6, -18, 3, 7); r('#c0a570', -6, -17, 3, 2);
    r('#344e5a', -4, -10, 4, 8 + walk); r('#2a424d', 1, -10, 4, 8 - walk);
    r('#293e42', -5, -3 + walk, 5, 3); r('#293e42', 1, -3 - walk, 5, 3); r('#916c46', -5, -3 + walk, 5, 1); r('#916c46', 1, -3 - walk, 5, 1);
    r('#476f72', -4, -20, 9, 11); r('#6f9990', -3, -20, 7, 3); r('#37565c', -4, -11, 9, 2);
    r('#d0ad70', -3, -12, 8, 1); r('#ebc78e', 0, -12, 2, 2);
    const swinging = game.mining?.progress > 0;
    const armAngle = swinging ? -.75 + Math.sin(this.elapsed * 17) * .75 : walking ? walk * .13 : -.08;
    c.save(); c.translate(3, -19); c.rotate(armAngle);
    r('#73998e', -1, 0, 4, 5); r('#d9b17b', 0, 4, 3, 5); r('#edc38c', 0, 4, 2, 2);
    const held = game.hotbar?.[game.selected];
    if (held && game.inventory?.[held] > 0 && (held.includes('pickaxe') || held.includes('sword') || held === 'torch')) drawItem(c, held, 0, 4, 13);
    c.restore();
    r('#503b2e', -4, -28, 9, 8); r('#c89d69', -3, -25, 8, 7); r('#ebc28a', -2, -25, 7, 5); r('#f1ce96', -2, -24, 2, 3);
    r('#493e30', 3, -24, 1, 2); r('#ab784e', 4, -20, 2, 1); r('#483c2e', -4, -27, 3, 6);
    r('#487b79', -5, -29, 10, 3); r('#78a49a', -4, -29, 8, 1); r('#2f605f', -5, -27, 13, 2); r('#c7b177', -2, -28, 7, 1);
    c.restore();
  }
  mob(m) {
    const c = this.ctx, t = this.tile, s = t / 16, x = Math.round((m.x + (m.w || .8) / 2) * t), y = Math.round((m.y + (m.h || 1)) * t);
    const walk = Math.abs(m.vx || 0) > .08 ? Math.sin(this.elapsed * 9 + m.x) * 2 : 0;
    c.fillStyle = '#17332d35'; c.fillRect(x - t * .4, y - 1, t * .8, 3);
    c.save(); c.translate(x, y); c.scale((m.facing || 1) * s, s);
    const r = (co, xx, yy, ww, hh) => { c.fillStyle = co; c.fillRect(Math.round(xx), Math.round(yy), ww, hh); };
    if (m.type === 'sheep') {
      r('#7f7861', -6, -6, 3, 6 + walk); r('#6b6b59', 4, -6, 3, 6 - walk); r('#dedcc1', -9, -14, 16, 10); r('#f1ecd1', -8, -16, 14, 10);
      r('#fff3d6', -6, -16, 5, 2); r('#cdcdb5', -8, -5, 13, 2); r('#ece7c9', -10, -12, 2, 6);
      r('#b6ae90', 5, -13, 6, 7); r('#d7cdb1', 6, -14, 5, 6); r('#8c8973', 5, -14, 2, 3); r('#3c5048', 9, -12, 1, 2); r('#9a8b71', 10, -8, 2, 1);
    } else {
      r('#394853', -4, -11, 4, 11 + walk); r('#30404b', 1, -11, 4, 11 - walk); r('#294341', -4, -2 + walk, 5, 2); r('#294341', 1, -2 - walk, 5, 2);
      r('#466e68', -5, -22, 10, 13); r('#4f8273', -4, -22, 8, 4); r('#758550', 3, -20, 9, 3); r('#86965c', 3, -20, 8, 1);
      r('#759455', -4, -30, 10, 9); r('#93ab67', -3, -29, 8, 6); r('#34473c', 3, -27, 2, 2); r('#bcbb75', 3, -26, 1, 1); r('#526848', 2, -23, 4, 1);
    }
    c.restore();
  }
  torch(x, y) {
    const c = this.ctx, t = this.tile, px = Math.round((x + .5) * t), py = Math.round((y + .45) * t), f = Math.floor(this.elapsed * 8) % 3;
    c.fillStyle = '#684c30'; c.fillRect(px - 2, py, 5, t * .45); c.fillStyle = '#c29859'; c.fillRect(px - 2, py, 2, t * .45);
    c.fillStyle = '#e89337'; c.fillRect(px - 4, py - 8, 8, 10); c.fillStyle = '#ffd276'; c.fillRect(px - 2, py - 10 - f, 4, 11); c.fillStyle = '#fff1b2'; c.fillRect(px - 1, py - 6, 2, 6);
  }
  target(game, target) {
    const c = this.ctx, t = this.tile, x = Math.floor((target.x - this.camera.x) * t), y = Math.floor((target.y - this.camera.y) * t);
    const p = game.player, reach = Math.hypot(target.x + .5 - p.x - (p.w || .65) / 2, target.y + .5 - p.y - (p.h || 1.8) / 2) < 5.5;
    c.save(); c.strokeStyle = reach ? '#f4f0c9bd' : '#e69a7770'; c.lineWidth = 2; c.fillStyle = '#f5eed51a'; c.fillRect(x, y, t, t);
    const corner = 7;
    c.beginPath();
    c.moveTo(x + corner, y + 1); c.lineTo(x + 1, y + 1); c.lineTo(x + 1, y + corner);
    c.moveTo(x + t - corner, y + 1); c.lineTo(x + t - 1, y + 1); c.lineTo(x + t - 1, y + corner);
    c.moveTo(x + 1, y + t - corner); c.lineTo(x + 1, y + t - 1); c.lineTo(x + corner, y + t - 1);
    c.moveTo(x + t - corner, y + t - 1); c.lineTo(x + t - 1, y + t - 1); c.lineTo(x + t - 1, y + t - corner); c.stroke();
    const mine = game.mining;
    if (mine && mine.x === target.x && mine.y === target.y && mine.progress > 0) {
      c.strokeStyle = '#102d2aba'; c.lineWidth = 2;
      const progress = clamp(mine.progress, 0, 1);
      c.beginPath(); c.moveTo(x + t * .52, y + t * .47); c.lineTo(x + t * .4, y + t * .31); c.lineTo(x + t * .42, y + t * .1);
      if (progress > .25) { c.moveTo(x + t * .52, y + t * .47); c.lineTo(x + t * .75, y + t * .53); c.lineTo(x + t * .92, y + t * .4); }
      if (progress > .5) { c.moveTo(x + t * .52, y + t * .47); c.lineTo(x + t * .42, y + t * .72); c.lineTo(x + t * .25, y + t * .88); c.moveTo(x + t * .42, y + t * .72); c.lineTo(x + t * .61, y + t * .94); }
      if (progress > .75) { c.moveTo(x + t * .4, y + t * .31); c.lineTo(x + t * .2, y + t * .4); c.lineTo(x + t * .02, y + t * .33); }
      c.stroke(); c.fillStyle = '#1b302cbf'; c.fillRect(x + 4, y + t - 6, t - 8, 3); c.fillStyle = '#dfedab'; c.fillRect(x + 4, y + t - 6, (t - 8) * progress, 3);
    }
    c.restore();
  }
}
