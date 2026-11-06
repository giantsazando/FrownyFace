// Renders Okee's front-facing sprite to build/icon.png (256x256) for the .exe icon.
//   node scripts/make-icon.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } });
const { OKEE_FRAMES } = await server.ssrLoadModule('/src/art/sprites/characters.ts');
const { PALETTE } = await server.ssrLoadModule('/src/art/palette.ts');
await server.close();

const SIZE = 256;
const SCALE = 14; // 16px * 14 = 224, centered with a margin
const OFF = (SIZE - 16 * SCALE) / 2;
const px = Buffer.alloc(SIZE * SIZE * 4);
const bg = [0x0b, 0x07, 0x10];
const ring = [0x14, 0x30, 0x3a];
for (let y = 0; y < SIZE; y++)
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    const d = Math.hypot(x - 127.5, y - 127.5);
    const inside = d < 126;
    const c = d > 110 ? ring : bg;
    px.set(inside ? [...c, 255] : [0, 0, 0, 0], i);
  }
OKEE_FRAMES[0].forEach((row, gy) =>
  [...row].forEach((ch, gx) => {
    const hex = PALETTE[ch];
    if (!hex) return;
    const n = parseInt(hex.slice(1), 16);
    for (let y = 0; y < SCALE; y++)
      for (let x = 0; x < SCALE; x++) {
        const i = ((OFF + gy * SCALE + y) * SIZE + OFF + gx * SCALE + x) * 4;
        px.set([n >> 16, (n >> 8) & 255, n & 255, 255], i);
      }
  }),
);

// Minimal PNG encoder (RGBA, no interlace).
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr.set([8, 6, 0, 0, 0], 8);
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) px.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);
mkdirSync('build', { recursive: true });
writeFileSync('build/icon.png', png);
console.log('wrote build/icon.png');
