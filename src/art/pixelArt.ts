import Phaser from 'phaser';
import { PALETTE } from './palette';
export { seeded, px, ellipse, poly } from './draw';
import { CELL_H, CELL_W, FONT_CHARS, GLYPH_H, GLYPH_W, glyphRows } from './fontData';

export type { Grid } from './gridTypes';
import type { Grid } from './gridTypes';

/** Draw a pixel grid onto a 2D context at an offset. */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  ox = 0,
  oy = 0,
  legend: Record<string, string> = {},
): void {
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = legend[ch] ?? PALETTE[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

/** Snap alpha to fully opaque / fully transparent so canvas shapes read as pixel art. */
export function hardenAlpha(ctx: CanvasRenderingContext2D, w: number, h: number, cut = 110): void {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= cut ? 255 : 0;
  ctx.putImageData(img, 0, 0);
}

/** Register a horizontal sprite sheet built from grid frames (all the same size). */
export function addGridSheet(
  scene: Phaser.Scene,
  key: string,
  frames: Grid[],
  legend: Record<string, string> = {},
): void {
  const fw = frames[0][0].length;
  const fh = frames[0].length;
  const [c, ctx] = makeCanvas(fw * frames.length, fh);
  frames.forEach((f, i) => drawGrid(ctx, f, i * fw, 0, legend));
  const tex = scene.textures.addCanvas(key, c)!;
  frames.forEach((_, i) => tex.add(i, 0, i * fw, 0, fw, fh));
}

/**
 * Paint a texture with canvas primitives. `frames` frames of w x h are laid
 * out horizontally; the painter is called once per frame with a translated context.
 */
export function paintTexture(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  painter: (ctx: CanvasRenderingContext2D, frame: number) => void,
  frames = 1,
  harden = true,
): void {
  const [c, ctx] = makeCanvas(w * frames, h);
  for (let f = 0; f < frames; f++) {
    ctx.save();
    ctx.translate(f * w, 0);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    painter(ctx, f);
    ctx.restore();
  }
  if (harden) hardenAlpha(ctx, w * frames, h);
  const tex = scene.textures.addCanvas(key, c)!;
  for (let f = 0; f < frames; f++) tex.add(f, 0, f * w, 0, w, h);
}

export const FONT_KEY = 'pixfont';
const FONT_PER_ROW = 32;

/** Builds the bitmap font texture and registers it as a RetroFont. */
export function buildFont(scene: Phaser.Scene): void {
  const rows = Math.ceil(FONT_CHARS.length / FONT_PER_ROW);
  const [c, ctx] = makeCanvas(FONT_PER_ROW * CELL_W, rows * CELL_H);
  ctx.fillStyle = '#ffffff';
  [...FONT_CHARS].forEach((ch, i) => {
    const gx = (i % FONT_PER_ROW) * CELL_W;
    const gy = Math.floor(i / FONT_PER_ROW) * CELL_H;
    const g = glyphRows(ch);
    for (let y = 0; y < GLYPH_H; y++)
      for (let x = 0; x < GLYPH_W; x++) if (g[y][x]) ctx.fillRect(gx + x, gy + y, 1, 1);
  });
  scene.textures.addCanvas(FONT_KEY, c);
  const entry = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: FONT_KEY,
    width: CELL_W,
    height: CELL_H,
    chars: FONT_CHARS,
    charsPerRow: FONT_PER_ROW,
    offset: { x: 0, y: 0 },
    spacing: { x: 0, y: 0 },
    lineSpacing: 2,
  } as unknown as Phaser.Types.GameObjects.BitmapText.RetroFontConfig);
  // Parse returns the full cache entry ({ data, texture, frame }).
  scene.cache.bitmapFont.add(FONT_KEY, entry);

  // Vertical digit strip (0-9 then 0 again) for odometer meters.
  const [dc, dctx] = makeCanvas(CELL_W, CELL_H * 11);
  dctx.fillStyle = '#ffffff';
  for (let d = 0; d <= 10; d++) {
    const g = glyphRows(String(d % 10));
    for (let y = 0; y < GLYPH_H; y++)
      for (let x = 0; x < GLYPH_W; x++) if (g[y][x]) dctx.fillRect(x, d * CELL_H + y, 1, 1);
  }
  scene.textures.addCanvas('digits', dc);
}

/** Soft, ordered-dithered light blob used to cut holes in the darkness layer. */
export function buildLightTexture(scene: Phaser.Scene, key: string, radius: number): void {
  const size = radius * 2;
  const [c, ctx] = makeCanvas(size, size);
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  ctx.fillStyle = '#ffffff';
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = x - radius + 0.5;
      const dy = y - radius + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy) / radius;
      const intensity = 1 - dist; // 1 at center
      const threshold = (bayer[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
      if (intensity * 1.6 > threshold) ctx.fillRect(x, y, 1, 1);
    }
  scene.textures.addCanvas(key, c);
}
