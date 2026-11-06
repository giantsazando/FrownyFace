import type { StatusId } from './skills';

export interface EnemyMove {
  weight: number;
  kind: 'attack' | 'attackAll' | 'nothing' | 'status' | 'statusAll' | 'heal';
  text: string; // {user} {target}
  power?: number;
  status?: { id: StatusId; turns: number };
  heal?: number;
}

export interface BattleBg {
  colors: [string, string, string];
  mode: number; // 0 stripes, 1 rings, 2 plasma, 3 checker-melt
  speed: number;
  freq: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  level: number;
  hp: number;
  off: number;
  def: number;
  spd: number;
  xp: number;
  money: number;
  art: string; // battler art key
  mapSprite: string;
  intro: string;
  defeat: string;
  moves: EnemyMove[];
  bg: BattleBg;
  drop?: { item: string; chance: number };
  boss?: boolean;
}

export const ENEMIES: Record<string, EnemyDef> = {
  tourist: {
    id: 'tourist', name: 'Sunburnt Tourist', level: 1, hp: 22, off: 7, def: 2, spd: 4, xp: 5, money: 7,
    art: 'tourist', mapSprite: 'npc_tourist',
    intro: 'A Sunburnt Tourist lumbers out of the heat haze!',
    defeat: 'The Sunburnt Tourist peeled away.',
    moves: [
      { weight: 3, kind: 'attack', power: 1, text: '{user} swings a selfie stick at {target}!' },
      { weight: 2, kind: 'status', status: { id: 'sunburn', turns: 3 }, text: '{user} radiates an SPF 0 aura. {target} is burning!' },
      { weight: 1, kind: 'nothing', text: '{user} complains about the humidity.' },
      { weight: 1, kind: 'nothing', text: '{user} asks where the "real Florida" is. Nobody answers.' },
    ],
    bg: { colors: ['#f07aa8', '#f2c14e', '#e8833a'], mode: 0, speed: 1, freq: 1 },
    drop: { item: 'sunscreen', chance: 0.25 },
  },
  snowbird: {
    id: 'snowbird', name: 'Lost Snowbird', level: 2, hp: 28, off: 8, def: 3, spd: 3, xp: 7, money: 10,
    art: 'snowbird', mapSprite: 'npc_snowbird',
    intro: 'A Lost Snowbird migrates directly into you!',
    defeat: 'The Lost Snowbird flew north. It is November. It will be back.',
    moves: [
      { weight: 3, kind: 'attack', power: 1, text: '{user} pecks {target} with an expired coupon!' },
      { weight: 1, kind: 'heal', heal: 12, text: '{user} orders the Early Bird Special. It is 3:40 PM forever.' },
      { weight: 1, kind: 'nothing', text: '{user} asks for directions to 1987.' },
      { weight: 1, kind: 'nothing', text: '{user} mentions their grandson in Ohio. You do not ask.' },
    ],
    bg: { colors: ['#3b5dc9', '#f4efe1', '#a77bd1'], mode: 1, speed: 0.7, freq: 0.8 },
    drop: { item: 'peanuts', chance: 0.3 },
  },
  takeout: {
    id: 'takeout', name: 'Sentient Takeout Bag', level: 3, hp: 32, off: 10, def: 4, spd: 7, xp: 10, money: 4,
    art: 'takeout', mapSprite: 'enemy_takeout',
    intro: 'A Sentient Takeout Bag rustles awake. THANK YOU. THANK YOU. THANK YOU.',
    defeat: 'The Sentient Takeout Bag deflated. Somewhere, a fortune cookie cracks.',
    moves: [
      { weight: 3, kind: 'attack', power: 1, text: '{user} leaks mysteriously on {target}!' },
      { weight: 2, kind: 'attackAll', power: 0.65, text: '{user} sprays soy sauce in every direction!' },
      { weight: 1, kind: 'nothing', text: '{user} rustles in a language older than plastic.' },
    ],
    bg: { colors: ['#c23b4a', '#f4efe1', '#241a2e'], mode: 2, speed: 1.2, freq: 1.3 },
    drop: { item: 'peanuts', chance: 0.2 },
  },
  cart: {
    id: 'cart', name: 'Feral Shopping Cart', level: 4, hp: 42, off: 12, def: 8, spd: 9, xp: 14, money: 9,
    art: 'cart', mapSprite: 'enemy_cart',
    intro: 'A Feral Shopping Cart squeaks toward you. Only one wheel works. It is enough.',
    defeat: 'The Feral Shopping Cart rolled into the corral of the afterlife.',
    moves: [
      { weight: 3, kind: 'attack', power: 1.25, text: '{user} rams {target} at full squeak!' },
      { weight: 1, kind: 'status', status: { id: 'slow', turns: 3 }, text: '{user} pins {target} against a pillar. {target} is slowed!' },
      { weight: 1, kind: 'nothing', text: '{user} squeaks one wheel. Forever.' },
      { weight: 1, kind: 'nothing', text: '{user} remembers being returned. Once.' },
    ],
    bg: { colors: ['#7d7484', '#3fb8af', '#241a2e'], mode: 3, speed: 1.4, freq: 1 },
    drop: { item: 'coffee', chance: 0.25 },
  },
  iguana: {
    id: 'iguana', name: 'Cold-Stunned Iguana', level: 5, hp: 38, off: 15, def: 6, spd: 2, xp: 16, money: 5,
    art: 'iguana', mapSprite: 'enemy_iguana',
    intro: 'A Cold-Stunned Iguana falls from the ceiling tiles!',
    defeat: 'The Cold-Stunned Iguana thawed and wandered off, embarrassed.',
    moves: [
      { weight: 2, kind: 'attack', power: 1.5, text: '{user} falls on {target} from somewhere above!' },
      { weight: 2, kind: 'attack', power: 0.9, text: '{user} whips {target} with a frozen tail!' },
      { weight: 2, kind: 'nothing', text: '{user} is still cold.' },
    ],
    bg: { colors: ['#b6d84b', '#3fb8af', '#f4efe1'], mode: 1, speed: 0.5, freq: 1.4 },
    drop: { item: 'keylime', chance: 0.1 },
  },
  python: {
    id: 'python', name: 'Burmese Python', level: 6, hp: 62, off: 15, def: 7, spd: 5, xp: 22, money: 12,
    art: 'python', mapSprite: 'enemy_python',
    intro: 'A Burmese Python uncoils from the clearance rack. It is very long. It keeps going.',
    defeat: 'The Burmese Python slithered back into the ductwork.',
    moves: [
      { weight: 3, kind: 'attack', power: 1.2, text: '{user} constricts {target}!' },
      { weight: 1, kind: 'status', status: { id: 'slow', turns: 2 }, text: '{user} stares. {target} forgets how to hurry.' },
      { weight: 1, kind: 'nothing', text: '{user} was released by someone who could not care for it anymore.' },
    ],
    bg: { colors: ['#7a4b2a', '#d8d08a', '#2c4a24'], mode: 0, speed: 0.6, freq: 0.7 },
    drop: { item: 'keylime', chance: 0.15 },
  },
  lovebugs: {
    id: 'lovebugs', name: 'Lovebug Swarm', level: 5, hp: 30, off: 9, def: 3, spd: 14, xp: 15, money: 3,
    art: 'lovebugs', mapSprite: 'decor_lovebugsMap',
    intro: 'A Lovebug Swarm drifts in, joined at the abdomen, in love, everywhere.',
    defeat: 'The Lovebug Swarm dispersed. Some of them are in your teeth.',
    moves: [
      { weight: 3, kind: 'attackAll', power: 0.6, text: '{user} splatters on everything!' },
      { weight: 1, kind: 'nothing', text: '{user} gets everywhere.' },
      { weight: 1, kind: 'statusAll', status: { id: 'weak', turns: 2 }, text: "{user} gets in everyone's eyes. The party feels weak!" },
    ],
    bg: { colors: ['#f07aa8', '#241a2e', '#c23b4a'], mode: 2, speed: 2, freq: 1.8 },
  },
  boss: {
    id: 'boss', name: 'The Anchor Tenant', level: 9, hp: 420, off: 19, def: 10, spd: 6, xp: 160, money: 250,
    art: 'boss', mapSprite: 'decor_bossMap', boss: true,
    intro: 'The Anchor Tenant rises from the clearance bins. EVERYTHING MUST GO.',
    defeat: 'The Anchor Tenant closes for the last time.',
    moves: [
      { weight: 3, kind: 'attack', power: 1.25, text: '{user} REMAINS OPEN on {target}!' },
      { weight: 2, kind: 'attackAll', power: 0.85, text: '{user} announces a CLEARANCE EVENT!' },
      { weight: 1, kind: 'statusAll', status: { id: 'weak', turns: 2 }, text: '{user} plays the muzak of a store that closed in 2009. The party feels weak.' },
      { weight: 1, kind: 'heal', heal: 30, text: '{user} pulls a shopping bag over its wounds.' },
      { weight: 1, kind: 'nothing', text: 'A mannequin arm points at {target}. Nothing happens. Yet.' },
    ],
    bg: { colors: ['#f07aa8', '#3fb8af', '#0b0710'], mode: 3, speed: 1.8, freq: 1.6 },
  },
};


// --- Under the Pond (optional dungeon) -------------------------------------
Object.assign(ENEMIES, {
  catfish: {
    id: 'catfish', name: 'Walking Catfish', level: 7, hp: 58, off: 17, def: 9, spd: 8, xp: 26, money: 11,
    art: 'catfish', mapSprite: 'enemy_catfish',
    intro: 'A Walking Catfish drags itself out of the dark on its fins. It should not be able to do that.',
    defeat: 'The Walking Catfish walked away. It will not stop walking.',
    moves: [
      { weight: 3, kind: 'attack', power: 1.1, text: '{user} slaps {target} with a wet whisker!' },
      { weight: 1, kind: 'status', status: { id: 'slow', turns: 2 }, text: "{user} wraps a whisker around {target}'s ankle. {target} is slowed!" },
      { weight: 1, kind: 'nothing', text: '{user} breathes air. Loudly. Wetly.' },
      { weight: 1, kind: 'nothing', text: '{user} takes one more step toward you than it did a moment ago.' },
    ],
    bg: { colors: ['#1d3a33', '#4a6b3a', '#0b0710'], mode: 0, speed: 0.5, freq: 0.9 },
    drop: { item: 'peanuts', chance: 0.3 },
  },
  snail: {
    id: 'snail', name: 'Apple Snail Brood', level: 7, hp: 48, off: 15, def: 12, spd: 4, xp: 24, money: 6,
    art: 'snail', mapSprite: 'enemy_snail',
    intro: 'An Apple Snail Brood oozes into view. Its eggs are bright pink. They are all looking at you.',
    defeat: 'The Apple Snail Brood withdrew into its shell. The eggs keep looking.',
    moves: [
      { weight: 2, kind: 'attackAll', power: 0.6, text: '{user} bursts a cluster of pink eggs!' },
      { weight: 1, kind: 'status', status: { id: 'weak', turns: 2 }, text: '{target} hears the eggs counting. {target} feels weak.' },
      { weight: 1, kind: 'heal', heal: 18, text: '{user} retreats into its shell and comes out a little bigger.' },
      { weight: 1, kind: 'nothing', text: '{user} lays more eggs. They are already watching.' },
    ],
    bg: { colors: ['#f07aa8', '#4a2c1a', '#a8486e'], mode: 2, speed: 0.8, freq: 1.5 },
    drop: { item: 'coffee', chance: 0.25 },
  },
  doll: {
    id: 'doll', name: 'Waterlogged Doll', level: 8, hp: 52, off: 18, def: 7, spd: 11, xp: 30, money: 3,
    art: 'doll', mapSprite: 'enemy_doll',
    intro: 'A Waterlogged Doll sits up in the shallows. Its one eye opens with a click.',
    defeat: 'The Waterlogged Doll lay back down. Its eye stayed open.',
    moves: [
      { weight: 3, kind: 'attack', power: 1.2, text: "{user} asks {target} to play. It isn't a question." },
      { weight: 1, kind: 'status', status: { id: 'weak', turns: 2 }, text: "{user} whispers {target}'s name. {target} never told it. {target} feels weak." },
      { weight: 1, kind: 'nothing', text: "{user}'s eye rolls back into its head. Then forward. Then back." },
      { weight: 1, kind: 'nothing', text: '{user} hums the plaza muzak, slightly too slow.' },
    ],
    bg: { colors: ['#3fb8af', '#f4efe1', '#0b1e26'], mode: 1, speed: 0.35, freq: 1.2 },
    drop: { item: 'sunscreen', chance: 0.3 },
  },
  lionfish: {
    id: 'lionfish', name: 'The Lionfish', level: 10, hp: 520, off: 20, def: 10, spd: 9, xp: 220, money: 300,
    art: 'lionfish', mapSprite: 'decor_lionfishMap', boss: true,
    intro: 'The Lionfish unfurls. Every fin is a fan of needles. Every needle is wet.',
    defeat: 'The Lionfish sinks into the gravel, aquarium-sized again.',
    moves: [
      { weight: 3, kind: 'attack', power: 1.3, status: { id: 'venom', turns: 3 }, text: '{user} gores {target} with a venomous spine!' },
      { weight: 2, kind: 'attackAll', power: 0.85, text: '{user} flares every fin at once. The water fills with spines!' },
      { weight: 1, kind: 'statusAll', status: { id: 'venom', turns: 2 }, text: '{user} exhales a red cloud. Everyone tastes copper.' },
      { weight: 1, kind: 'heal', heal: 45, text: '{user} swallows something native, whole. It looks healthier.' },
      { weight: 1, kind: 'nothing', text: '{user} presses its face against the dark like aquarium glass. Tap. Tap. Tap.' },
      { weight: 1, kind: 'nothing', text: '{user} opens its mouth. There are human teeth in it. Some of them are fillings.' },
    ],
    bg: { colors: ['#c23b4a', '#f4efe1', '#0b0710'], mode: 1, speed: 1.6, freq: 1.8 },
  },
} satisfies Record<string, EnemyDef>);

export const ENCOUNTER_GROUPS: Record<string, string[]> = {
  tourist1: ['tourist'],
  tourist2: ['tourist', 'tourist'],
  snowbird1: ['snowbird'],
  mixedTown: ['tourist', 'snowbird'],
  takeout1: ['takeout'],
  takeout2: ['takeout', 'takeout'],
  cart1: ['cart'],
  cartBag: ['takeout', 'cart'],
  iguana1: ['iguana'],
  iguanaPair: ['iguana', 'lovebugs'],
  python1: ['python'],
  lovebugs1: ['lovebugs', 'lovebugs'],
  pythonBag: ['takeout', 'python'],
  boss: ['boss'],
  catfish1: ['catfish'],
  snails: ['snail', 'snail'],
  doll1: ['doll'],
  dollCat: ['doll', 'catfish'],
  brood: ['snail', 'catfish'],
  dolls: ['doll', 'doll'],
  lionfish: ['lionfish'],
};
