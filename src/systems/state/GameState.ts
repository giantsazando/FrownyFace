import { ITEMS } from '../../data/items';
import { MAX_LEVEL, MEMBERS, type MemberId, skillsAt, statsAt, xpForLevel } from '../../data/party';
import { SKILLS } from '../../data/skills';

export interface MemberState {
  id: MemberId;
  level: number;
  xp: number;
  hp: number;
  murk: number;
}

export type Facing = 'down' | 'up' | 'left' | 'right';

export interface SaveData {
  version: 1;
  mapId: string;
  x: number;
  y: number;
  facing: Facing;
  party: MemberState[];
  inventory: Record<string, number>;
  money: number;
  flags: Record<string, boolean>;
  playTime: number;
}

export const START_MAP = 'town';
export const START_POS = { x: 10, y: 22 };

export function newGame(): SaveData {
  const s = statsAt('okee', 1);
  return {
    version: 1,
    mapId: START_MAP,
    x: START_POS.x,
    y: START_POS.y,
    facing: 'down',
    party: [{ id: 'okee', level: 1, xp: 0, hp: s.maxHp, murk: s.maxMurk }],
    inventory: { peanuts: 2 },
    money: 20,
    flags: {},
    playTime: 0,
  };
}

export class GameState {
  data: SaveData;

  constructor(data: SaveData = newGame()) {
    this.data = data;
  }

  member(id: MemberId): MemberState | undefined {
    return this.data.party.find((m) => m.id === id);
  }

  stats(id: MemberId) {
    return statsAt(id, this.member(id)!.level);
  }

  flag(name: string): boolean {
    return !!this.data.flags[name];
  }

  setFlag(name: string, v = true): void {
    this.data.flags[name] = v;
  }

  addMember(id: MemberId): void {
    if (this.member(id)) return;
    const level = Math.max(1, this.member('okee')!.level);
    const s = statsAt(id, level);
    this.data.party.push({ id, level, xp: xpForLevel(level), hp: s.maxHp, murk: s.maxMurk });
  }

  healAll(): void {
    for (const m of this.data.party) {
      const s = statsAt(m.id, m.level);
      m.hp = s.maxHp;
      m.murk = s.maxMurk;
    }
  }

  /** Grants XP to every conscious member; returns level-up messages. */
  gainXp(amount: number, conscious: MemberId[]): string[] {
    const msgs: string[] = [];
    for (const m of this.data.party) {
      if (!conscious.includes(m.id)) continue;
      m.xp += amount;
      while (m.level < MAX_LEVEL && m.xp >= xpForLevel(m.level + 1)) {
        const before = statsAt(m.id, m.level);
        const oldSkills = skillsAt(m.id, m.level);
        m.level++;
        const after = statsAt(m.id, m.level);
        m.hp += after.maxHp - before.maxHp;
        m.murk += after.maxMurk - before.maxMurk;
        const name = MEMBERS[m.id].name;
        msgs.push(`${name} reached level ${m.level}!`);
        const parts: string[] = [];
        if (after.off > before.off) parts.push(`Offense +${after.off - before.off}`);
        if (after.def > before.def) parts.push(`Defense +${after.def - before.def}`);
        if (after.spd > before.spd) parts.push(`Speed +${after.spd - before.spd}`);
        parts.push(`Max HP +${after.maxHp - before.maxHp}`);
        msgs.push(parts.join(', ') + '.');
        for (const sk of skillsAt(m.id, m.level)) if (!oldSkills.includes(sk)) msgs.push(`${name} learned ${SKILLS[sk].name}!`);
      }
    }
    return msgs;
  }

  addItem(id: string, n = 1): void {
    this.data.inventory[id] = Math.min(99, (this.data.inventory[id] ?? 0) + n);
  }

  removeItem(id: string, n = 1): boolean {
    const have = this.data.inventory[id] ?? 0;
    if (have < n) return false;
    if (have - n <= 0) delete this.data.inventory[id];
    else this.data.inventory[id] = have - n;
    return true;
  }

  itemList(): { id: string; count: number }[] {
    return Object.entries(this.data.inventory)
      .filter(([id, n]) => n > 0 && ITEMS[id])
      .map(([id, count]) => ({ id, count }));
  }

  /** Use an item outside of battle. Returns a message. */
  useFieldItem(itemId: string, target: MemberId): string {
    const it = ITEMS[itemId];
    const m = this.member(target);
    if (!it || !it.field || !m) return 'Nothing happens.';
    const s = statsAt(m.id, m.level);
    const name = MEMBERS[m.id].name;
    if (m.hp <= 0 && !it.revive) return `It had no effect on ${name}...`;
    if (it.revive && m.hp <= 0) m.hp = 0;
    else if (it.revive && !it.heal) return `${name} is already awake.`;
    this.removeItem(itemId);
    const out: string[] = [];
    if (it.heal) {
      const before = m.hp;
      m.hp = Math.min(s.maxHp, m.hp + it.heal);
      out.push(`${name} recovered ${m.hp - before} HP.`);
    }
    if (it.murk) {
      const before = m.murk;
      m.murk = Math.min(s.maxMurk, m.murk + it.murk);
      out.push(`${name} recovered ${m.murk - before} Murk.`);
    }
    return out.join(' ') || `${name} feels fine.`;
  }
}
