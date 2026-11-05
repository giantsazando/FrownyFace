// Phaser-free canvas drawing helpers used by procedural painters.
import { PALETTE } from './palette';

/** Deterministic PRNG for procedural textures. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/** Pixel helpers for painters. */
export function px(ctx: CanvasRenderingContext2D, x: number, y: number, col: string, w = 1, h = 1): void {
  ctx.fillStyle = PALETTE[col] ?? col;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

export function ellipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  col: string,
): void {
  ctx.fillStyle = PALETTE[col] ?? col;
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  ctx.fill();
}

export function poly(ctx: CanvasRenderingContext2D, pts: number[], col: string): void {
  ctx.fillStyle = PALETTE[col] ?? col;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fill();
}

