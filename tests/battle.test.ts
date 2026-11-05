import { describe, expect, it } from 'vitest';
import { BattleEngine, type PartyInput } from '../src/systems/battle/BattleEngine';
import { RollingMeter } from '../src/systems/battle/RollingMeter';
import { statsAt } from '../src/data/party';

function seq(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

function okee(level = 1, hp?: number): PartyInput {
  const s = statsAt('okee', level);
  return { id: 'okee', level, hp: hp ?? s.maxHp, murk: s.maxMurk, ...s };
}

describe('RollingMeter', () => {
  it('rolls down over time instead of instantly', () => {
    const m = new RollingMeter(50, 50, 10, 100);
    m.damage(20);
    expect(m.value).toBe(50);
    m.update(1);
    expect(m.value).toBe(40);
    m.update(5);
    expect(m.value).toBe(30);
  });
  it('healing during the roll saves you', () => {
    const m = new RollingMeter(10, 50, 10, 100);
    m.damage(30); // mortal
    m.update(0.5);
    m.heal(25);
    m.update(5);
    expect(m.empty).toBe(false);
    expect(m.value).toBeGreaterThan(0);
  });
  it('freeze keeps displayed value', () => {
    const m = new RollingMeter(10, 50, 10, 100);
    m.damage(30);
    m.update(0.35);
    m.freeze();
    m.update(10);
    expect(m.value).toBe(7);
  });
});

describe('BattleEngine', () => {
  it('damage formula follows 2*off - def with variance', () => {
    const eng = new BattleEngine([okee()], ['tourist'], seq([0.5]));
    const [p] = eng.party;
    const [e] = eng.enemies;
    const r = eng.calcDamage(p, e, 1, false, false);
    // off 9, def 2 => 16 * (0.8 + 0.5*0.4 = 1.0)
    expect(r.amount).toBe(16);
  });

  it('guarding halves damage', () => {
    const eng = new BattleEngine([okee()], ['tourist'], seq([0.5]));
    const [p] = eng.party;
    const [e] = eng.enemies;
    const normal = eng.calcDamage(e, p, 1, false, false).amount;
    p.guarding = true;
    expect(eng.calcDamage(e, p, 1, false, false).amount).toBe(Math.round(normal * 0.5));
  });

  it('can win a fight by attacking', () => {
    const eng = new BattleEngine([okee(5)], ['tourist'], seq([0.3, 0.6, 0.9, 0.2]));
    let guard = 0;
    while (!eng.outcome() && guard++ < 50) {
      eng.beginRound([{ actor: 'okee', kind: 'attack', target: 'e0' }]);
      while (eng.next()) eng.tick(0.2);
      eng.endRound();
    }
    expect(eng.outcome()).toBe('win');
    expect(eng.rewards().xp).toBe(5);
  });

  it('knocks out party only when meter reaches zero', () => {
    const eng = new BattleEngine([okee(1, 5)], ['boss'], seq([0.5]));
    eng.party[0].hp.damage(50);
    expect(eng.party[0].ko).toBe(false);
    const ko = eng.tick(10);
    expect(ko.length).toBe(1);
    expect(eng.outcome()).toBe('lose');
  });

  it('skills consume murk and items emit consume events', () => {
    const eng = new BattleEngine([okee(2)], ['boss'], seq([0.5]));
    const before = eng.party[0].murk;
    eng.beginRound([{ actor: 'okee', kind: 'skill', skill: 'deathroll', target: 'e0' }], 'party');
    eng.next();
    expect(eng.party[0].murk).toBe(before - 4);
    eng.beginRound([{ actor: 'okee', kind: 'item', item: 'peanuts', target: 'okee' }], 'party');
    const ev = eng.next()!;
    expect(ev.some((e) => e.t === 'consume' && e.item === 'peanuts')).toBe(true);
  });

  it('cannot flee from the boss', () => {
    const eng = new BattleEngine([okee()], ['boss'], seq([0.01]));
    expect(eng.canFlee()).toBe(false);
    eng.beginRound([{ actor: 'okee', kind: 'run' }], 'party');
    eng.next();
    expect(eng.outcome()).toBe(null);
  });

  it('pushover check for high level party', () => {
    expect(new BattleEngine([okee(8)], ['tourist']).isPushover()).toBe(true);
    expect(new BattleEngine([okee(2)], ['tourist']).isPushover()).toBe(false);
    expect(new BattleEngine([okee(30)], ['boss']).isPushover()).toBe(false);
  });

  it('names duplicate enemies with letters', () => {
    const eng = new BattleEngine([okee()], ['tourist', 'tourist']);
    expect(eng.enemies.map((e) => e.name)).toEqual(['Sunburnt Tourist A', 'Sunburnt Tourist B']);
  });
});
