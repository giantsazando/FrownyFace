import { describe, expect, it } from 'vitest';
import { ENEMY_MAP_SPRITES, IBIS_FRAMES, NPC_SPRITES, OBJECT_SPRITES, OKEE_FRAMES } from '../src/art/sprites/characters';
import { PALETTE } from '../src/art/palette';
import { GLYPHS, glyphRows, wrapText } from '../src/art/fontData';

function check(name: string, g: string[]) {
  expect(g.length, `${name} height`).toBe(16);
  g.forEach((row, i) => expect(row.length, `${name} row ${i}: "${row}"`).toBe(16));
  for (const row of g) for (const ch of row) if (ch !== '.') expect(PALETTE[ch], `${name} color '${ch}'`).toBeDefined();
}

describe('sprite grids', () => {
  it('okee/ibis frames are 16x16 with palette colors', () => {
    OKEE_FRAMES.forEach((f, i) => check(`okee${i}`, f));
    IBIS_FRAMES.forEach((f, i) => check(`ibis${i}`, f));
  });
  it('npc + object + enemy sprites are valid', () => {
    for (const [k, g] of Object.entries(NPC_SPRITES)) check(k, g);
    for (const [k, fs] of Object.entries(OBJECT_SPRITES)) fs.forEach((g, i) => check(`${k}${i}`, g));
    for (const [k, fs] of Object.entries(ENEMY_MAP_SPRITES)) fs.forEach((g, i) => check(`${k}${i}`, g));
  });
});

describe('font', () => {
  it('glyph rows are 5 wide', () => {
    for (const [ch, src] of Object.entries(GLYPHS)) {
      if (!src) continue;
      const rows = src.split(' ');
      expect(rows.length, ch).toBeLessThanOrEqual(8);
      rows.forEach((r) => expect(r.length, `glyph ${ch}`).toBe(5));
      expect(glyphRows(ch).length).toBe(8);
    }
  });
  it('wraps text', () => {
    expect(wrapText('the quick brown fox', 9)).toEqual(['the quick', 'brown fox']);
    expect(wrapText('a\nb', 10)).toEqual(['a', 'b']);
  });
});
