export type SkillTarget = 'enemy' | 'allEnemies' | 'ally' | 'allAllies' | 'self';

export interface SkillDef {
  id: string;
  name: string;
  cost: number;
  target: SkillTarget;
  desc: string;
  /** damage multiplier on a normal attack */
  power?: number;
  ignoreDef?: boolean;
  heal?: number; // fraction of target max HP
  healFlat?: number;
  status?: { id: StatusId; turns: number };
  cure?: boolean;
  revive?: boolean;
  text: string; // {user} {target}
}

export type StatusId = 'sunburn' | 'venom' | 'weak' | 'guarded' | 'slow';

export const SKILLS: Record<string, SkillDef> = {
  deathroll: {
    id: 'deathroll', name: 'Death Roll', cost: 4, target: 'enemy', power: 1.8,
    desc: 'Spin. Drag. Heavy damage.', text: '{user} grabs {target} and rolls into the dark!',
  },
  bask: {
    id: 'bask', name: 'Bask', cost: 5, target: 'self', heal: 0.45,
    desc: 'Soak up a streetlight. Heals self.', text: '{user} basks under a sodium streetlight that is not there.',
  },
  swampgas: {
    id: 'swampgas', name: 'Swamp Gas', cost: 7, target: 'allEnemies', power: 1.0,
    desc: 'Hits all enemies.', text: '{user} exhales something older than the state of Florida.',
  },
  coldblood: {
    id: 'coldblood', name: 'Cold Blood', cost: 4, target: 'self', status: { id: 'guarded', turns: 3 },
    desc: 'Defense up for 3 turns.', text: "{user}'s heart slows to one beat per minute.",
  },
  prophesy: {
    id: 'prophesy', name: 'Prophesy', cost: 3, target: 'ally', healFlat: 34, cure: true,
    desc: 'Heal one ally, cure burns and venom.', text: '{user} foretells that {target} will be fine. It comes true.',
  },
  hymn: {
    id: 'hymn', name: 'Garbage Hymn', cost: 5, target: 'allEnemies', status: { id: 'weak', turns: 3 },
    desc: 'Weakens all enemies.', text: '{user} sings the hymn that garbage sings to itself.',
  },
  paleomen: {
    id: 'paleomen', name: 'Pale Omen', cost: 5, target: 'enemy', power: 1.4, ignoreDef: true,
    desc: 'Ignores defense.', text: '{user} shows {target} how it ends.',
  },
  communion: {
    id: 'communion', name: 'Communion', cost: 10, target: 'allAllies', heal: 0.5, revive: true,
    desc: 'Heal and revive all.', text: '{user} breaks a stale dinner roll and shares it.',
  },
  seagrass: {
    id: 'seagrass', name: 'Seagrass', cost: 6, target: 'allAllies', heal: 0.25,
    desc: 'Heals the whole party a little.', text: '{user} shares a mouthful of seagrass. It is mostly seagrass.',
  },
  undertow: {
    id: 'undertow', name: 'Undertow', cost: 7, target: 'allEnemies', power: 1.1,
    desc: 'Hits all enemies.', text: '{user} rolls over. The current goes with her.',
  },
  scarshield: {
    id: 'scarshield', name: 'Scar Shield', cost: 5, target: 'allAllies', status: { id: 'guarded', turns: 2 },
    desc: 'Party defense up for 2 turns.', text: '{user} shows everyone her propeller scars. Everyone feels tougher, somehow.',
  },
  deepcall: {
    id: 'deepcall', name: 'Deep Call', cost: 9, target: 'enemy', power: 2.1,
    desc: 'A low song. Massive damage.', text: '{user} sings the low song. {target} hears it in its bones.',
  },
};
