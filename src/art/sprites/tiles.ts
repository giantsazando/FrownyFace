import { PALETTE } from '../palette';
import { seeded } from '../draw';

type Ctx = CanvasRenderingContext2D;
const T = 16;

function fill(ctx: Ctx, col: string, x = 0, y = 0, w = T, h = T) {
  ctx.fillStyle = PALETTE[col] ?? col;
  ctx.fillRect(x, y, w, h);
}
function speckle(ctx: Ctx, rnd: () => number, col: string, n: number, w = 1, h = 1) {
  for (let i = 0; i < n; i++) fill(ctx, col, Math.floor(rnd() * T), Math.floor(rnd() * T), w, h);
}

export const TILE_PAINTERS: Record<string, (ctx: Ctx, rnd: () => number) => void> = {
  grass0: (c, r) => { fill(c, '#2a4a2e'); speckle(c, r, '#355e37', 18); speckle(c, r, '#1f3823', 10); },
  grass1: (c, r) => { fill(c, '#2a4a2e'); speckle(c, r, '#355e37', 14); speckle(c, r, '#4a6b3a', 4, 1, 2); },
  grass2: (c, r) => { fill(c, '#2a4a2e'); speckle(c, r, '#1f3823', 16); fill(c, '#6b3f8f', 5, 6); fill(c, '#6b3f8f', 11, 12); },
  weeds: (c, r) => {
    fill(c, '#3a4a2a');
    for (let i = 0; i < 9; i++) { const x = Math.floor(r() * 15), y = 4 + Math.floor(r() * 10); fill(c, '#6b7a3a', x, y, 1, 3); fill(c, '#8a8a4a', x, y, 1, 1); }
  },
  water0: (c, r) => { fill(c, '#14303a'); speckle(c, r, '#1d4552', 10, 3, 1); speckle(c, r, '#3fb8af', 2); },
  water1: (c, r) => { fill(c, '#14303a'); speckle(c, r, '#1d4552', 8, 4, 1); speckle(c, r, '#0b1e26', 6, 2, 1); },
  reeds: (c, r) => {
    fill(c, '#1d3a33');
    for (let i = 0; i < 6; i++) { const x = 1 + Math.floor(r() * 14); fill(c, '#5a7a3a', x, 3, 1, 12); fill(c, '#4a2c1a', x, 2, 1, 3); }
  },
  road: (c, r) => { fill(c, '#2b2632'); speckle(c, r, '#3a3442', 20); speckle(c, r, '#1d1a22', 8); },
  roadLine: (c, r) => { fill(c, '#2b2632'); speckle(c, r, '#3a3442', 16); fill(c, '#b8862a', 0, 7, 6, 2); fill(c, '#b8862a', 10, 7, 6, 2); },
  sidewalk: (c, r) => { fill(c, '#7d7484'); fill(c, '#6b6372', 0, 15, 16, 1); fill(c, '#6b6372', 15, 0, 1, 16); speckle(c, r, '#8a8292', 6); },
  dirt: (c, r) => { fill(c, '#5a3f2a'); speckle(c, r, '#6b4b32', 14); speckle(c, r, '#4a2c1a', 8); },
  houseWall: (c, r) => { fill(c, '#c9b8a0'); for (let y = 3; y < 16; y += 4) fill(c, '#a8987f', 0, y, 16, 1); speckle(c, r, '#b0a088', 5); },
  houseWin: (c) => { fill(c, '#c9b8a0'); fill(c, '#4a2c1a', 3, 3, 10, 10); fill(c, '#f2c14e', 4, 4, 8, 8); fill(c, '#e8833a', 4, 8, 8, 1); fill(c, '#e8833a', 8, 4, 1, 8); },
  roof: (c, r) => { fill(c, '#7a3a4a'); for (let y = 1; y < 16; y += 3) fill(c, '#5e2a38', 0, y, 16, 1); speckle(c, r, '#8a4a5a', 6, 2, 1); },
  door: (c) => { fill(c, '#c9b8a0'); fill(c, '#4a2c1a', 3, 2, 10, 14); fill(c, '#7a4b2a', 4, 3, 8, 13); fill(c, '#f2c14e', 10, 9); },
  fence: (c) => { fill(c, '#2a4a2e'); for (let x = 1; x < 16; x += 4) fill(c, '#a8987f', x, 2, 2, 13); fill(c, '#7a6a5a', 0, 5, 16, 2); fill(c, '#7a6a5a', 0, 11, 16, 2); },
  bush: (c, r) => { fill(c, '#2a4a2e'); c.fillStyle = '#1f5a2a'; c.beginPath(); c.arc(8, 9, 7, 0, 7); c.fill(); speckle(c, r, '#2f7a3a', 14); speckle(c, r, '#c23b4a', 2); },
  parking: (c, r) => { fill(c, '#33303a'); speckle(c, r, '#3d3a45', 14); speckle(c, r, '#26232c', 8, 2, 1); },
  parkingLine: (c, r) => { fill(c, '#33303a'); speckle(c, r, '#3d3a45', 12); fill(c, '#c9c2b8', 7, 0, 2, 16); },
  storeWall: (c, r) => { fill(c, '#d8a8b8'); fill(c, '#a8486e', 0, 0, 16, 3); speckle(c, r, '#c898a8', 8); fill(c, '#7a5a6a', 0, 15, 16, 1); },
  glass: (c) => { fill(c, '#d8a8b8'); fill(c, '#1d2a3a', 1, 3, 14, 13); fill(c, '#3fb8af', 2, 4, 3, 1); fill(c, '#3b5dc9', 2, 5, 1, 4); fill(c, '#4a6a7a', 9, 9, 4, 1); },
  chain: (c) => { fill(c, '#33303a'); c.fillStyle = '#8a8292'; for (let i = -16; i < 16; i += 4) { for (let k = 0; k < 16; k++) { c.fillRect(i + k, k, 1, 1); c.fillRect(i + 16 - k, k, 1, 1); } } fill(c, '#a8a0b0', 0, 0, 16, 1); },
  floor0: (c, r) => { fill(c, '#b8b0a0'); fill(c, '#a8a090', 0, 0, 8, 8); fill(c, '#a8a090', 8, 8, 8, 8); speckle(c, r, '#8a8070', 5); },
  floor1: (c, r) => { fill(c, '#b8b0a0'); fill(c, '#a8a090', 0, 0, 8, 8); fill(c, '#a8a090', 8, 8, 8, 8); speckle(c, r, '#7a6a50', 9); fill(c, '#6a5a40', 3, 11, 3, 2); },
  floorCrack: (c, r) => {
    fill(c, '#b8b0a0'); fill(c, '#a8a090', 0, 0, 8, 8); fill(c, '#a8a090', 8, 8, 8, 8);
    let x = 2, y = 0; c.fillStyle = '#4a4352'; while (y < 16) { c.fillRect(x, y, 1, 1); x += r() < 0.5 ? 1 : -1; x = Math.max(0, Math.min(15, x)); y++; }
    speckle(c, r, '#2c4a24', 3);
  },
  wallIn: (c, r) => { fill(c, '#8a7a90'); fill(c, '#6a5a70', 0, 12, 16, 4); fill(c, '#a8486e', 0, 11, 16, 1); speckle(c, r, '#7a6a80', 6); },
  wallTop: (c) => { fill(c, '#241a2e'); fill(c, '#3a2a4a', 0, 0, 16, 1); },
  counter: (c) => { fill(c, '#5a3f2a'); fill(c, '#c9c2b8', 0, 0, 16, 5); fill(c, '#a8a0b0', 0, 5, 16, 1); fill(c, '#4a2c1a', 0, 12, 16, 4); },
  shelf: (c, r) => {
    fill(c, '#3a3442'); fill(c, '#6a5a70', 0, 0, 16, 2); fill(c, '#6a5a70', 0, 7, 16, 2); fill(c, '#6a5a70', 0, 14, 16, 2);
    const cols = ['#c23b4a', '#f2c14e', '#3fb8af', '#f07aa8', '#b6d84b', '#f4efe1'];
    for (let x = 1; x < 15; x += 3) { if (r() < 0.6) fill(c, cols[Math.floor(r() * cols.length)], x, 3, 2, 4); if (r() < 0.5) fill(c, cols[Math.floor(r() * cols.length)], x, 10, 2, 4); }
  },
  garbage: (c, r) => {
    fill(c, '#b8b0a0');
    const cols = ['#241a2e', '#4a4352', '#f4efe1', '#c23b4a', '#3b5dc9', '#7a4b2a', '#b6d84b'];
    for (let i = 0; i < 22; i++) { const s = 2 + Math.floor(r() * 4); fill(c, cols[Math.floor(r() * cols.length)], Math.floor(r() * (17 - s)), 2 + Math.floor(r() * (15 - s)), s, s - 1); }
    if (r() < 0.4) { fill(c, '#fff27a', 6, 7); fill(c, '#fff27a', 9, 7); }
  },
  carpet: (c, r) => { fill(c, '#5e2a38'); for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 0 : 2; x < 16; x += 4) fill(c, '#7a3a4a', x, y, 2, 2); speckle(c, r, '#3a1a24', 6); },
  puddle: (c, r) => { TILE_PAINTERS.floor0(c, r); c.fillStyle = '#4a6a5a'; c.beginPath(); c.ellipse(8, 9, 6, 4, 0, 0, 7); c.fill(); fill(c, '#b6d84b', 5, 8, 2, 1); },
  neon: (c) => { fill(c, '#241a2e'); fill(c, '#f07aa8', 1, 5, 14, 1); fill(c, '#f07aa8', 1, 10, 14, 1); fill(c, '#3fb8af', 3, 7, 2, 2); fill(c, '#3fb8af', 7, 7, 2, 2); fill(c, '#3fb8af', 11, 7, 2, 2); },
  void: (c) => { fill(c, '#0b0710'); },
  vines: (c, r) => {
    fill(c, '#241a2e');
    for (let i = 0; i < 5; i++) { let x = Math.floor(r() * 16); for (let y = 0; y < 16; y++) { fill(c, i % 2 ? '#2c4a24' : '#4a2c1a', x, y, 2, 1); x += Math.floor(r() * 3) - 1; } }
    speckle(c, r, '#b6d84b', 3);
  },
  escalator: (c) => { fill(c, '#4a4352'); for (let y = 0; y < 16; y += 3) fill(c, '#7d7484', 1, y, 14, 1); fill(c, '#241a2e', 0, 0, 1, 16); fill(c, '#241a2e', 15, 0, 1, 16); },
  doorway: (c) => { fill(c, '#0b0710'); fill(c, '#f07aa8', 0, 0, 1, 16); fill(c, '#f07aa8', 15, 0, 1, 16); fill(c, '#f07aa8', 0, 0, 16, 1); fill(c, '#241a2e', 1, 12, 14, 4); },
  meat: (c, r) => { fill(c, '#5e2a38'); speckle(c, r, '#a8486e', 18, 2, 1); speckle(c, r, '#c23b4a', 6); speckle(c, r, '#f07aa8', 3); },
};

export function paintTileset(names: string[]): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = names.length * T;
  c.height = T;
  const ctx = c.getContext('2d')!;
  names.forEach((n, i) => {
    ctx.save();
    ctx.translate(i * T, 0);
    ctx.beginPath();
    ctx.rect(0, 0, T, T);
    ctx.clip();
    const painter = TILE_PAINTERS[n];
    if (!painter) throw new Error(`No tile painter for ${n}`);
    painter(ctx, seeded(i * 977 + 13));
    ctx.restore();
  });
  // Tiles are opaque: snap any anti-aliased alpha.
  const img = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
  ctx.putImageData(img, 0, 0);
  return c;
}
