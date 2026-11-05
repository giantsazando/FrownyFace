import { ellipse, poly, px, seeded } from '../draw';

type Ctx = CanvasRenderingContext2D;

export interface DecorArt {
  w: number;
  h: number;
  frames: number;
  paint: (ctx: Ctx, f: number) => void;
}

export const DECOR: Record<string, DecorArt> = {
  palm: {
    w: 32, h: 48, frames: 1,
    paint: (c) => {
      // trunk curving
      for (let y = 14; y < 48; y++) {
        const x = 14 + Math.round(Math.sin(y / 14) * 3);
        px(c, x, y, y % 3 ? 'n' : 'N', 4, 1);
      }
      const fronds: number[][] = [[16, 14, 2, 22], [16, 14, 30, 22], [16, 14, 4, 6], [16, 14, 28, 6], [16, 14, 16, 2], [16, 14, 8, 26], [16, 14, 24, 26]];
      for (const [x1, y1, x2, y2] of fronds) {
        const dx = x2 - x1, dy = y2 - y1;
        for (let t = 0; t <= 1; t += 0.05) {
          const x = x1 + dx * t, y = y1 + dy * t + Math.sin(t * 3) * 3;
          px(c, x, y, t > 0.7 ? '#1f3823' : '#2f6a33', 2, 2);
          if (t > 0.2) px(c, x + 1, y + 2, '#1f5a2a');
        }
      }
      ellipse(c, 16, 15, 3, 3, 'n');
    },
  },
  deadpalm: {
    w: 32, h: 48, frames: 1,
    paint: (c) => {
      for (let y = 12; y < 48; y++) px(c, 15 + (y > 30 ? 0 : Math.round((30 - y) / 8)), y, y % 3 ? 'm' : 'd', 3, 1);
      for (const [x2, y2] of [[4, 24], [28, 24], [10, 30], [24, 30]]) {
        for (let t = 0; t <= 1; t += 0.06) px(c, 17 + (x2 - 17) * t, 12 + (y2 - 12) * t, '#5a4a3a', 2, 1);
      }
    },
  },
  lamp: {
    w: 16, h: 40, frames: 1,
    paint: (c) => {
      px(c, 7, 6, 'd', 2, 32);
      px(c, 6, 37, 'K', 4, 3);
      px(c, 3, 3, 'd', 10, 3);
      px(c, 4, 6, 'e', 8, 2);
      px(c, 5, 2, 'm', 6, 1);
    },
  },
  flourescent: {
    w: 16, h: 16, frames: 2,
    paint: (c, f) => {
      px(c, 1, 0, 'W', 14, 3);
      px(c, 2, 1, f ? 'm' : 'w', 12, 1);
    },
  },
  okeeShadow: {
    w: 12, h: 4, frames: 1,
    paint: (c) => ellipse(c, 6, 2, 6, 2, 'k'),
  },
  bossMap: {
    w: 40, h: 40, frames: 2,
    paint: (c, f) => {
      const r = seeded(5);
      const cols = ['K', 'd', 'w', 'r', 'B', 'n', 'W'];
      for (let i = 0; i < 40; i++) ellipse(c, 6 + r() * 28, 22 + r() * 16, 2 + r() * 3, 2 + r() * 2, cols[Math.floor(r() * cols.length)]);
      poly(c, [14, 12, 26, 12, 25, 26, 15, 26], 'W');
      ellipse(c, 20, 8, 5, 6, 'W');
      px(c, 17, 7, f ? 'r' : 'e', 2, 1); px(c, 21, 7, f ? 'r' : 'e', 2, 1);
      poly(c, [14, 14, 2 + f * 2, 6, 4, 10, 15, 18], 'W');
      poly(c, [26, 14, 38 - f * 2, 6, 36, 10, 25, 18], 'W');
    },
  },
  lovebugsMap: {
    w: 16, h: 16, frames: 2,
    paint: (c, f) => {
      const r = seeded(3 + f * 7);
      for (let i = 0; i < 7; i++) { const x = 2 + r() * 11, y = 3 + r() * 10; px(c, x, y, 'k', 2, 1); px(c, x + 2, y, 'r'); }
    },
  },
  sign: {
    w: 16, h: 16, frames: 1,
    paint: (c) => { px(c, 7, 8, 'N', 2, 8); px(c, 1, 2, 'n', 14, 7); px(c, 2, 3, 'b', 12, 5); px(c, 3, 4, 'N', 6, 1); px(c, 3, 6, 'N', 9, 1); },
  },
  trashwall: {
    w: 16, h: 20, frames: 2,
    paint: (c, f) => {
      const r = seeded(11);
      const cols = ['K', 'd', 'w', 'r', 'B', 'n', 'l', 'W'];
      for (let i = 0; i < 30; i++) ellipse(c, 2 + r() * 12, 4 + r() * 15, 1 + r() * 3, 1 + r() * 2, cols[Math.floor(r() * cols.length)]);
      px(c, 4, 9 + f, 'e'); px(c, 10, 9 + f, 'e');
    },
  },
  vending: {
    w: 16, h: 24, frames: 1,
    paint: (c) => {
      px(c, 1, 0, 'r', 14, 24); px(c, 2, 2, 'k', 9, 16); px(c, 12, 4, 'W', 2, 6); px(c, 12, 12, 'k', 2, 3);
      const cols = ['y', 'l', 'p', 'c', 'w', 'o'];
      for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) px(c, 3 + x * 3, 3 + y * 4, cols[(x + y * 2) % cols.length], 2, 3);
      px(c, 2, 20, 'k', 9, 2); px(c, 1, 0, 'p', 14, 1);
    },
  },
  sparkle: {
    w: 8, h: 8, frames: 1,
    paint: (c) => { px(c, 3, 0, 'w', 2, 8); px(c, 0, 3, 'w', 8, 2); px(c, 3, 3, 'e', 2, 2); },
  },
};
