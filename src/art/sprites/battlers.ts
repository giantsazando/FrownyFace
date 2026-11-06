// Procedural battle sprites for enemies. Each painter draws one frame into a
// clipped canvas region; alpha is hardened afterwards so the result reads as pixel art.
import { ellipse, poly, px, seeded } from '../draw';
import { glyphRows } from '../fontData';

type Ctx = CanvasRenderingContext2D;

export interface BattlerArt {
  w: number;
  h: number;
  frames: number;
  paint: (ctx: Ctx, f: number) => void;
}

function text(ctx: Ctx, s: string, x: number, y: number, col: string) {
  [...s].forEach((ch, i) => {
    const g = glyphRows(ch);
    g.forEach((row, gy) => row.forEach((on, gx) => on && px(ctx, x + i * 6 + gx, y + gy, col)));
  });
}

function flower(ctx: Ctx, x: number, y: number, col: string) {
  px(ctx, x, y - 1, col); px(ctx, x - 1, y, col); px(ctx, x + 1, y, col); px(ctx, x, y + 1, col); px(ctx, x, y, 'y');
}

export const BATTLERS: Record<string, BattlerArt> = {
  tourist: {
    w: 56, h: 76, frames: 2,
    paint: (c, f) => {
      const b = f; // bob
      // legs + shorts
      px(c, 18, 58, 'S', 6, 14); px(c, 32, 58, 'S', 6, 14);
      px(c, 16, 70, 'w', 9, 4); px(c, 31, 70, 'w', 9, 4);
      px(c, 15, 50 + b, 'c', 26, 10);
      // shirt
      ellipse(c, 28, 42 + b, 17, 14, 'p');
      const r = seeded(4);
      for (let i = 0; i < 9; i++) flower(c, 16 + r() * 24, 32 + r() * 18 + b, i % 2 ? 'c' : 'w');
      // arms
      px(c, 8, 32 + b, 'S', 6, 16); px(c, 42, 32 + b - f * 4, 'S', 6, 14);
      // camera
      px(c, 40, 24 + b - f * 4, 'k', 12, 9); ellipse(c, 46, 28 + b - f * 4, 3, 3, 'd'); px(c, 45, 27 + b - f * 4, 'w');
      // head
      ellipse(c, 27, 18 + b, 12, 12, 'S');
      px(c, 25, 16 + b, 'w', 3, 6); // zinc nose
      px(c, 17, 13 + b, 'k', 9, 4); px(c, 29, 13 + b, 'k', 9, 4); px(c, 26, 14 + b, 'k', 3, 1);
      px(c, 18, 14 + b, 'c', 2, 1); px(c, 30, 14 + b, 'c', 2, 1);
      px(c, 22, 24 + b, 'r', 10, 2); // grimace
      // bucket hat
      poly(c, [14, 9 + b, 40, 9 + b, 36, 1 + b, 18, 1 + b], 'c'); px(c, 11, 9 + b, 'C', 32, 2);
    },
  },
  snowbird: {
    w: 56, h: 76, frames: 2,
    paint: (c, f) => {
      const b = f;
      px(c, 19, 58, 'W', 6, 12); px(c, 31, 58, 'W', 6, 12);
      px(c, 17, 70, 'n', 9, 4); px(c, 30, 70, 'n', 9, 4);
      ellipse(c, 28, 44 + b, 16, 16, 'r');
      for (let x = 14; x < 42; x += 4) px(c, x, 38 + b, 'w', 2, 2);
      for (let x = 16; x < 40; x += 4) px(c, x, 48 + b, 'w', 2, 2);
      // wings instead of arms
      poly(c, [12, 34 + b, 2, 52 + b - f * 4, 14, 48 + b], 'W');
      poly(c, [44, 34 + b, 54, 52 + b - f * 4, 42, 48 + b], 'W');
      // coupon
      px(c, 46, 44 + b - f * 4, 'w', 8, 5); px(c, 47, 45 + b - f * 4, 'r', 3, 1);
      // head
      ellipse(c, 28, 18 + b, 11, 12, 's');
      ellipse(c, 19, 12 + b, 5, 4, 'w'); ellipse(c, 37, 12 + b, 5, 4, 'w');
      // beak
      poly(c, [24, 20 + b, 32, 20 + b, 28, 30 + b], 'o');
      px(c, 19, 15 + b, 'k', 8, 4); px(c, 30, 15 + b, 'k', 8, 4);
      px(c, 20, 16 + b, 'U', 2, 1); px(c, 31, 16 + b, 'U', 2, 1);
      // visor
      px(c, 15, 7 + b, 'B', 26, 3); px(c, 13, 9 + b, 'B', 18, 2);
    },
  },
  takeout: {
    w: 52, h: 60, frames: 2,
    paint: (c, f) => {
      const s = f ? 1 : 0;
      // handles
      ellipse(c, 15, 10 - s, 6, 9, 'W'); ellipse(c, 15, 10 - s, 3, 6, 'K');
      ellipse(c, 37, 10 + s, 6, 9, 'W'); ellipse(c, 37, 10 + s, 3, 6, 'K');
      c.globalCompositeOperation = 'destination-out';
      ellipse(c, 15, 10 - s, 3, 6, 'K'); ellipse(c, 37, 10 + s, 3, 6, 'K');
      c.globalCompositeOperation = 'source-over';
      poly(c, [8, 16, 44, 16, 48 + s, 52, 26, 58, 4 - s, 52], 'w');
      poly(c, [8, 16, 14, 16, 12, 54, 4 - s, 52], 'W');
      // THANK YOU smile
      text(c, 'THANK', 11, 22, 'r');
      ellipse(c, 26, 41, 9, 6, 'r'); ellipse(c, 26, 39, 9, 5, 'w');
      // eyes - too many
      const eyes = f ? [[17, 34], [35, 34], [26, 48], [40, 46]] : [[17, 34], [35, 34], [12, 44], [26, 48]];
      for (const [x, y] of eyes) { ellipse(c, x, y, 3, 3, 'k'); px(c, x, y - 1, 'e'); }
      // drip
      px(c, 30, 56, 'n', 2, 3 + f * 2); px(c, 22, 57, 'N', 1, 2);
    },
  },
  cart: {
    w: 68, h: 60, frames: 2,
    paint: (c, f) => {
      const b = f;
      // basket
      poly(c, [6, 10 + b, 60, 10 + b, 54, 38 + b, 14, 38 + b], 'K');
      c.fillStyle = '#a8a0b0';
      for (let x = 6; x <= 60; x += 6) c.fillRect(x - Math.floor((x - 6) / 9), 10 + b, 1, 28);
      for (let y = 10; y <= 38; y += 5) c.fillRect(6 + (y - 10) / 4, y + b, 54 - (y - 10) / 2, 1);
      // handle
      px(c, 58, 4 + b, 'r', 8, 3); px(c, 60, 4 + b, 'm', 1, 8);
      // chassis
      px(c, 14, 44 + b, 'm', 42, 2); px(c, 16, 38 + b, 'm', 1, 8); px(c, 52, 38 + b, 'm', 1, 8);
      // wheels with eyes
      for (const x of [16, 52]) { ellipse(c, x, 52, 5, 5, 'k'); ellipse(c, x, 52, 2, 2, f ? 'r' : 'e'); }
      // one eye in the child seat
      ellipse(c, 44, 18 + b, 7, 6, 'w'); ellipse(c, 44 + f * 2, 18 + b, 3, 4, 'k'); px(c, 45 + f * 2, 16 + b, 'w');
      // bags trailing
      poly(c, [6, 14 + b, 0, 24 + b - f * 3, 4, 30 + b], 'w');
      px(c, 24, 20 + b, 'y', 6, 8); px(c, 32, 26 + b, 'c', 5, 6);
    },
  },
  iguana: {
    w: 76, h: 52, frames: 2,
    paint: (c, f) => {
      // stiff body, slightly rotated per frame (falling)
      c.translate(38, 26); c.rotate(f ? 0.12 : -0.06); c.translate(-38, -26);
      ellipse(c, 34, 28, 22, 9, 'g');
      ellipse(c, 34, 32, 18, 5, 'l');
      // tail with bands
      for (let i = 0; i < 6; i++) ellipse(c, 12 - i * 2, 30 + i, 5 - i * 0.6, 3, i % 2 ? 'g' : 'G');
      // head
      ellipse(c, 60, 24, 11, 8, 'g');
      poly(c, [54, 30, 62, 30, 58, 40], 'o'); // dewlap
      ellipse(c, 62, 22, 3, 3, 'w'); px(c, 62, 22, 'k'); px(c, 61, 21, 'k'); px(c, 63, 23, 'k');
      // spines
      for (let x = 18; x < 58; x += 4) poly(c, [x, 20, x + 2, 13, x + 4, 20], 'o');
      // stiff legs sticking out
      px(c, 22, 36, 'G', 3, 10); px(c, 44, 36, 'G', 3, 10); px(c, 26, 14, 'G', 3, 8);
      // frost
      const r = seeded(9 + f);
      for (let i = 0; i < 10; i++) px(c, 14 + r() * 50, 14 + r() * 24, 'w');
    },
  },
  python: {
    w: 80, h: 68, frames: 2,
    paint: (c, f) => {
      const r = seeded(21);
      // coils
      for (let i = 0; i < 3; i++) {
        ellipse(c, 40, 54 - i * 9, 32 - i * 6, 8, 'n');
        for (let k = 0; k < 7; k++) ellipse(c, 14 + r() * 52 - i * 2, 54 - i * 9 + (r() - 0.5) * 6, 3, 2, 'N');
      }
      // neck
      const hx = 52 + f * 3;
      poly(c, [34, 34, 42, 34, hx + 4, 12, hx - 4, 10], 'n');
      ellipse(c, hx + 2, 10, 10, 6, 'n');
      ellipse(c, hx + 2, 13, 8, 3, 'b');
      ellipse(c, hx + 6, 8, 2, 2, 'e'); px(c, hx + 6, 8, 'k');
      // tongue
      px(c, hx + 12, 12, 'r', 6, 1); px(c, hx + 18, 11, 'r'); px(c, hx + 18, 13, 'r');
      for (let k = 0; k < 4; k++) ellipse(c, 40 + k * 4, 28 - k * 5, 2, 2, 'N');
    },
  },
  lovebugs: {
    w: 72, h: 56, frames: 2,
    paint: (c, f) => {
      const r = seeded(33 + f * 101);
      for (let i = 0; i < 26; i++) {
        const x = 6 + r() * 58, y = 6 + r() * 42;
        const horiz = r() < 0.5;
        px(c, x, y, 'k', 3, 2); px(c, x + 1, y, 'r');
        if (horiz) { px(c, x + 3, y, 'k', 3, 2); px(c, x + 4, y, 'r'); } else { px(c, x, y + 2, 'k', 3, 2); px(c, x + 1, y + 3, 'r'); }
        px(c, x - 1, y - 1, 'W');
      }
      // a pale heart shape formed by the swarm
      ellipse(c, 30, 24, 3, 3, 'p'); ellipse(c, 38, 24, 3, 3, 'p'); poly(c, [27, 25, 41, 25, 34, 33], 'p');
    },
  },
  boss: {
    w: 120, h: 116, frames: 2,
    paint: (c, f) => {
      const r = seeded(77);
      // heap
      const cols = ['K', 'd', 'w', 'r', 'B', 'n', 'l', 'm', 'W', 'p', 'y'];
      for (let i = 0; i < 140; i++) {
        const x = 8 + r() * 104, y = 62 + r() * 50;
        const yy = y - (60 - Math.abs(x - 60)) * 0.25;
        ellipse(c, x, yy, 3 + r() * 6, 2 + r() * 5, cols[Math.floor(r() * cols.length)]);
      }
      // mannequin torso
      poly(c, [42, 40, 78, 40, 74, 76, 46, 76], 'W');
      ellipse(c, 60, 46, 18, 8, 'W');
      // arms reaching
      const a = f * 4;
      poly(c, [44, 44, 10, 20 - a, 6, 26 - a, 42, 54], 'W');
      poly(c, [76, 44, 112, 26 + a, 114, 32 + a, 78, 54], 'W');
      px(c, 4, 18 - a, 'W', 6, 6); px(c, 110, 24 + a, 'W', 6, 6);
      // head, featureless with slit eyes
      ellipse(c, 60, 24, 12, 15, 'W');
      px(c, 52, 22, f ? 'r' : 'e', 6, 2); px(c, 63, 22, f ? 'r' : 'e', 6, 2);
      px(c, 60, 39, 'm', 1, 3);
      // neon sign fragment
      px(c, 30, 80, 'K', 60, 12);
      text(c, 'SALE', 36, 82, f ? 'p' : 'c');
      px(c, 62, 84, 'p', 2, 6); text(c, '%', 68, 82, 'y');
      // price tags
      px(c, 24, 64, 'w', 6, 4); px(c, 92, 70, 'w', 6, 4); px(c, 25, 65, 'r', 2, 1);
      // eyes in the trash
      for (const [x, y] of [[20, 98], [96, 96], [58, 104], [80, 88]]) { ellipse(c, x, y, 2, 2, 'e'); px(c, x, y, 'k'); }
    },
  },
  catfish: {
    w: 76, h: 52, frames: 2,
    paint: (c, f) => {
      // body
      ellipse(c, 36, 24, 26, 11, '#4a3f2a');
      ellipse(c, 36, 29, 22, 5, '#8a7a5a');
      for (let i = 0; i < 9; i++) ellipse(c, 16 + i * 5, 20 + (i % 2) * 3, 2, 1.5, '#2c2418');
      // tail
      poly(c, [10, 24, 0, 14, 2, 24, 0, 34], '#3a3020');
      // head + eye
      ellipse(c, 60, 23, 10, 9, '#4a3f2a');
      ellipse(c, 64, 19, 2, 2, 'e'); px(c, 64, 19, 'k');
      px(c, 66, 27, 'k', 6, 1);
      // whiskers
      for (const [dy, len] of [[-2, 14], [2, 16], [5, 12]]) for (let i = 0; i < len; i++) px(c, 68 + i * 0.5, 26 + dy + Math.sin(i / 3 + f) * 2, 'W');
      // fins it walks on
      const step = f ? 3 : -3;
      poly(c, [24, 32, 20 + step, 46, 28 + step, 46], '#3a3020');
      poly(c, [46, 32, 44 - step, 46, 52 - step, 46], '#3a3020');
      px(c, 16 + step, 46, 'k', 40, 1);
      // slime drips
      px(c, 30, 35, 'l', 1, 4 + f * 2); px(c, 52, 34, 'l', 1, 3);
    },
  },
  snail: {
    w: 64, h: 60, frames: 2,
    paint: (c, f) => {
      // foot
      ellipse(c, 32, 50, 28, 6, '#c8b888');
      ellipse(c, 56, 44, 6, 5, '#c8b888');
      px(c, 58, 34, 'b', 1, 8); px(c, 61, 35, 'b', 1, 7);
      ellipse(c, 58, 34, 1.5, 1.5, 'k'); ellipse(c, 61, 35, 1.5, 1.5, 'k');
      // shell spiral
      ellipse(c, 28, 34, 20, 17, 'n');
      ellipse(c, 30, 33, 14, 12, 'N');
      ellipse(c, 31, 33, 9, 8, 'n');
      ellipse(c, 32, 33, 4, 4, 'N');
      // egg clusters, pulsing
      const r = seeded(51);
      for (let i = 0; i < 26; i++) {
        const x = 8 + r() * 36, y = 6 + r() * 22;
        const sz = 2 + r() * 1.5 + (f && i % 3 === 0 ? 0.8 : 0);
        ellipse(c, x, y, sz, sz, i % 4 ? 'p' : 'P');
        if (i % 5 === 0) px(c, x, y, 'k');
      }
    },
  },
  doll: {
    w: 48, h: 70, frames: 2,
    paint: (c, f) => {
      // dress
      poly(c, [10, 34, 38, 34, 44, 60, 4, 60], '#d88aa8');
      for (let x = 8; x < 42; x += 6) px(c, x, 44, 'P', 2, 2);
      // arms
      px(c, 4, 34 + f * 2, 'W', 5, 16); px(c, 39, 34, 'W', 5, 16);
      // legs
      px(c, 14, 60, 'W', 6, 9); px(c, 28, 60, 'W', 6, 9 - f * 2);
      // head
      ellipse(c, 24, 20, 14, 15, '#e8e0d8');
      // seaweed hair
      for (let i = 0; i < 9; i++) {
        const x0 = 11 + i * 3;
        for (let y = 4; y < 14 + (i % 3) * 8; y++) px(c, x0 + Math.sin(y / 3 + i) * 1.5, y, i % 2 ? 'G' : 'g');
      }
      // one eye open, one socket
      ellipse(c, 18 + f * 12, 20, 3.5, 3.5, 'w'); ellipse(c, 18 + f * 12, 20, 1.6, 1.6, 'B'); px(c, 18 + f * 12, 20, 'k');
      ellipse(c, 30 - f * 12, 20, 3, 3, 'k');
      // cracked smile, water stains
      px(c, 19, 28, 'r', 10, 1); px(c, 21, 29, 'r', 1, 2); px(c, 26, 29, 'r', 1, 2);
      px(c, 33, 12, 'm', 1, 6); px(c, 34, 18, 'm', 1, 4);
      px(c, 6, 66, 'C', 36, 2);
    },
  },
  lionfish: {
    w: 150, h: 116, frames: 2,
    paint: (c, f) => {
      const cx = 70, cy = 60;
      // dorsal spines: long, striped, venom-tipped
      for (let i = 0; i < 15; i++) {
        const a = -Math.PI * 0.95 + (i / 14) * Math.PI * 0.85 + (f ? 0.03 : -0.02);
        const len = 44 + (i % 3) * 8;
        for (let r = 14; r < len; r++) {
          const col = r > len - 4 ? '#5e1020' : Math.floor(r / 5) % 2 ? 'w' : 'r';
          px(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, col, 2, 2);
        }
      }
      // pectoral fins: huge fans below
      for (let i = 0; i < 11; i++) {
        const a = Math.PI * 0.2 + (i / 10) * Math.PI * 0.6 + (f ? -0.05 : 0.05);
        const len = 38 + (i % 2) * 8;
        for (let r = 10; r < len; r++) px(c, cx - 8 + Math.cos(a) * r, cy + 4 + Math.sin(a) * r, Math.floor(r / 4) % 2 ? 'P' : 'W', 2, 1);
      }
      // tail fan
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 0.8 + (i / 6) * Math.PI * 0.4;
        for (let r = 30; r < 52; r++) px(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.floor(r / 4) % 2 ? 'r' : 'w', 2, 1);
      }
      // body with stripes
      ellipse(c, cx, cy, 34, 22, 'r');
      c.save();
      c.beginPath();
      c.ellipse(cx, cy, 34, 22, 0, 0, Math.PI * 2);
      c.clip();
      for (let x = cx - 34; x < cx + 34; x += 7) px(c, x, cy - 24, 'w', 3, 48);
      c.restore();
      // too many eyes along the flank
      for (const [x, y] of [[cx - 16, cy - 6], [cx - 4, cy + 8], [cx + 6, cy - 10]]) {
        ellipse(c, x, y, 2.5, 2.5, 'e');
        px(c, x, y, 'k');
      }
      // head
      ellipse(c, cx + 34, cy + 2, 16, 15, '#a82a3a');
      ellipse(c, cx + 38, cy - 6, 6, 6, 'e');
      ellipse(c, cx + 39, cy - 6, 2, 4, 'k');
      // mouth with human teeth
      ellipse(c, cx + 44, cy + 9, 7, 4 + f * 2, 'k');
      for (let i = 0; i < 5; i++) px(c, cx + 39 + i * 2.4, cy + 6, i === 3 ? 'y' : 'w', 2, 2);
      for (let i = 0; i < 4; i++) px(c, cx + 40 + i * 2.4, cy + 11 + f * 2, 'w', 2, 2);
      // venom drip
      px(c, cx + 46, cy + 14 + f * 2, '#5e1020', 1, 4 + f * 3);
    },
  },
};
