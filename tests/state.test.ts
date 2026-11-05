import { describe, expect, it } from 'vitest';
import { GameState, newGame } from '../src/systems/state/GameState';
import { loadGame, saveGame, type StorageLike } from '../src/systems/state/SaveLoad';
import { xpForLevel } from '../src/data/party';

class MemStore implements StorageLike {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('GameState', () => {
  it('levels up and learns skills', () => {
    const gs = new GameState();
    const msgs = gs.gainXp(xpForLevel(2), ['okee']);
    expect(gs.member('okee')!.level).toBe(2);
    expect(msgs.join(' ')).toContain('learned Bask');
  });
  it('xp curve is increasing', () => {
    for (let l = 2; l < 20; l++) expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
  });
  it('items add/remove/use', () => {
    const gs = new GameState();
    gs.member('okee')!.hp = 5;
    gs.addItem('peanuts', 1);
    expect(gs.data.inventory.peanuts).toBe(3);
    const msg = gs.useFieldItem('peanuts', 'okee');
    expect(msg).toContain('recovered');
    expect(gs.member('okee')!.hp).toBe(40);
    expect(gs.data.inventory.peanuts).toBe(2);
  });
  it('companion joins at okee level', () => {
    const gs = new GameState();
    gs.gainXp(xpForLevel(3), ['okee']);
    gs.addMember('ibis');
    expect(gs.member('ibis')!.level).toBe(3);
  });
});

describe('SaveLoad', () => {
  it('round trips', () => {
    const s = new MemStore();
    const d = newGame();
    d.flags.test = true;
    expect(saveGame(d, s)).toBe(true);
    expect(loadGame(s)!.flags.test).toBe(true);
  });
  it('rejects junk', () => {
    const s = new MemStore();
    s.setItem('swamplight-save-v1', '{nope');
    expect(loadGame(s)).toBeNull();
    expect(loadGame(null)).toBeNull();
  });
});
