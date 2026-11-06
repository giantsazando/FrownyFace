import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/data/maps';
import { TILE_DEFS, TILE_NAMES } from '../src/data/tiles';
import { SCRIPTS, type Step } from '../src/data/dialogue/scripts';
import { ENCOUNTER_GROUPS, ENEMIES } from '../src/data/enemies';
import { ITEMS, SHOPS } from '../src/data/items';
import { ENEMY_MAP_SPRITES, NPC_SPRITES } from '../src/art/sprites/characters';
import { DECOR } from '../src/art/sprites/decor';
import { TILE_PAINTERS } from '../src/art/sprites/tiles';
import { BATTLERS } from '../src/art/sprites/battlers';
import { START_MAP, START_POS } from '../src/systems/state/GameState';

const spriteExists = (key: string) => {
  const [kind, name] = key.split(/_(.+)/);
  if (kind === 'npc') return !!NPC_SPRITES[name];
  if (kind === 'enemy') return !!ENEMY_MAP_SPRITES[name];
  if (kind === 'decor') return !!DECOR[name];
  return false;
};

function solidAt(mapId: string, x: number, y: number) {
  const ch = MAPS[mapId].tiles[y]?.[x];
  return ch === undefined || TILE_DEFS[ch].solid;
}

function walkSteps(steps: Step[], fn: (s: Step) => void) {
  for (const s of steps) {
    fn(s);
    if (typeof s === 'object' && 'then' in s) {
      if ('choice' in s) s.then.forEach((b) => walkSteps(b, fn));
      else {
        walkSteps(s.then, fn);
        if (s.else) walkSteps(s.else, fn);
      }
    }
  }
}

describe('maps', () => {
  it('every tile painter exists', () => {
    for (const n of TILE_NAMES) expect(TILE_PAINTERS[n], n).toBeDefined();
  });

  for (const map of Object.values(MAPS)) {
    describe(map.id, () => {
      it('has rectangular rows of known tiles', () => {
        const w = map.tiles[0].length;
        map.tiles.forEach((row, y) => {
          expect(row.length, `${map.id} row ${y}`).toBe(w);
          for (const ch of row) expect(TILE_DEFS[ch], `${map.id} unknown tile '${ch}' row ${y}`).toBeDefined();
        });
      });

      it('entities are valid', () => {
        for (const e of map.entities) {
          const where = `${map.id} ${e.kind} @${e.x},${e.y}`;
          expect(map.tiles[e.y]?.[e.x], where).toBeDefined();
          if (e.kind === 'npc' || e.kind === 'enemy' || e.kind === 'cooler' || e.kind === 'payphone') {
            expect(solidAt(map.id, e.x, e.y), `${where} on solid tile`).toBe(false);
          }
          if (e.kind === 'npc') {
            expect(SCRIPTS[e.script], `${where} script ${e.script}`).toBeDefined();
            expect(spriteExists(e.sprite), `${where} sprite ${e.sprite}`).toBe(true);
          }
          if (e.kind === 'sign') {
            expect(SCRIPTS[e.script], where).toBeDefined();
            if (e.sprite) expect(spriteExists(e.sprite), `${where} sprite`).toBe(true);
          }
          if (e.kind === 'enemy') {
            expect(ENCOUNTER_GROUPS[e.group], where).toBeDefined();
            expect(spriteExists(e.sprite), `${where} sprite ${e.sprite}`).toBe(true);
          }
          if (e.kind === 'cooler' && e.item) expect(ITEMS[e.item], where).toBeDefined();
          if (e.kind === 'warp') {
            expect(MAPS[e.to], where).toBeDefined();
            expect(solidAt(e.to, e.tx, e.ty), `${where} warp target solid`).toBe(false);
            if (e.blocked) expect(SCRIPTS[e.blocked]).toBeDefined();
          }
        }
        for (const e of map.onEnter ?? []) expect(SCRIPTS[e.script], e.script).toBeDefined();
      });
    });
  }

  it('start position is walkable', () => {
    expect(solidAt(START_MAP, START_POS.x, START_POS.y)).toBe(false);
  });
});

describe('content references', () => {
  it('scripts reference valid items, shops, groups', () => {
    for (const [name, steps] of Object.entries(SCRIPTS)) {
      walkSteps(steps, (s) => {
        if (typeof s !== 'object') return;
        if ('give' in s) expect(ITEMS[s.give], name).toBeDefined();
        if ('shop' in s) {
          expect(SHOPS[s.shop], name).toBeDefined();
          SHOPS[s.shop].items.forEach((i) => expect(ITEMS[i]).toBeDefined());
        }
        if ('battle' in s) expect(ENCOUNTER_GROUPS[s.battle], name).toBeDefined();
        if ('warp' in s) {
          expect(MAPS[s.warp], name).toBeDefined();
          expect(solidAt(s.warp, s.x, s.y), `${name} warp target solid`).toBe(false);
        }
      });
    }
  });
  it('enemies have battle art and valid groups', () => {
    for (const e of Object.values(ENEMIES)) {
      expect(BATTLERS[e.art], e.id).toBeDefined();
      expect(spriteExists(e.mapSprite), e.id).toBe(true);
      if (e.drop) expect(ITEMS[e.drop.item]).toBeDefined();
    }
    for (const g of Object.values(ENCOUNTER_GROUPS)) g.forEach((id) => expect(ENEMIES[id], id).toBeDefined());
  });
});
