export type MemberId = 'okee' | 'ibis' | 'dolores';

export interface Stats {
  maxHp: number;
  maxMurk: number;
  off: number;
  def: number;
  spd: number;
}

export interface MemberDef {
  id: MemberId;
  name: string;
  attackName: string; // battle command label
  skillMenu: string; // label for skill menu
  base: Stats;
  growth: Stats;
  skills: { id: string; level: number }[];
}

export const MEMBERS: Record<MemberId, MemberDef> = {
  okee: {
    id: 'okee',
    name: 'Okee',
    attackName: 'Chomp',
    skillMenu: 'Swamp',
    base: { maxHp: 44, maxMurk: 10, off: 9, def: 5, spd: 6 },
    growth: { maxHp: 9, maxMurk: 3, off: 2.6, def: 1.8, spd: 1.2 },
    skills: [
      { id: 'deathroll', level: 1 },
      { id: 'bask', level: 2 },
      { id: 'swampgas', level: 4 },
      { id: 'coldblood', level: 6 },
    ],
  },
  ibis: {
    id: 'ibis',
    name: 'Br. Ibis',
    attackName: 'Peck',
    skillMenu: 'Omen',
    base: { maxHp: 32, maxMurk: 18, off: 7, def: 3, spd: 9 },
    growth: { maxHp: 6.5, maxMurk: 4, off: 2, def: 1.4, spd: 1.6 },
    skills: [
      { id: 'prophesy', level: 1 },
      { id: 'hymn', level: 1 },
      { id: 'paleomen', level: 4 },
      { id: 'communion', level: 6 },
    ],
  },
  dolores: {
    id: 'dolores',
    name: 'Dolores',
    attackName: 'Bump',
    skillMenu: 'Tide',
    base: { maxHp: 60, maxMurk: 14, off: 8, def: 9, spd: 3 },
    growth: { maxHp: 11, maxMurk: 3, off: 2.2, def: 2.4, spd: 0.8 },
    skills: [
      { id: 'seagrass', level: 1 },
      { id: 'undertow', level: 1 },
      { id: 'scarshield', level: 3 },
      { id: 'deepcall', level: 8 },
    ],
  },
};

export const MAX_LEVEL = 30;

export function statsAt(id: MemberId, level: number): Stats {
  const d = MEMBERS[id];
  const l = level - 1;
  return {
    maxHp: Math.floor(d.base.maxHp + d.growth.maxHp * l),
    maxMurk: Math.floor(d.base.maxMurk + d.growth.maxMurk * l),
    off: Math.floor(d.base.off + d.growth.off * l),
    def: Math.floor(d.base.def + d.growth.def * l),
    spd: Math.floor(d.base.spd + d.growth.spd * l),
  };
}

/** Total XP required to reach a level. */
export function xpForLevel(level: number): number {
  const l = level - 1;
  return Math.round(7 * l * l + 9 * l);
}

export function skillsAt(id: MemberId, level: number): string[] {
  return MEMBERS[id].skills.filter((s) => s.level <= level).map((s) => s.id);
}
