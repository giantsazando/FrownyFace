// Map character legend -> painted tile names. Pure data.
export interface TileDef {
  tiles: string[]; // painted tile variants (chosen by position hash)
  solid: boolean;
  decor?: 'palm' | 'lamp' | 'flourescent' | 'deadpalm';
  light?: boolean;
}

export const TILE_DEFS: Record<string, TileDef> = {
  '.': { tiles: ['grass0', 'grass1', 'grass2', 'grass0'], solid: false },
  ',': { tiles: ['weeds'], solid: false },
  '~': { tiles: ['water0', 'water1'], solid: true },
  r: { tiles: ['reeds'], solid: false },
  '=': { tiles: ['road'], solid: false },
  '-': { tiles: ['roadLine'], solid: false },
  '#': { tiles: ['sidewalk'], solid: false },
  _: { tiles: ['dirt'], solid: false },
  H: { tiles: ['houseWall'], solid: true },
  O: { tiles: ['houseWin'], solid: true, light: true },
  R: { tiles: ['roof'], solid: true },
  D: { tiles: ['door'], solid: true },
  f: { tiles: ['fence'], solid: true },
  b: { tiles: ['bush'], solid: true },
  P: { tiles: ['parking'], solid: false },
  '|': { tiles: ['parkingLine'], solid: false },
  S: { tiles: ['storeWall'], solid: true },
  G: { tiles: ['glass'], solid: true, light: true },
  x: { tiles: ['chain'], solid: true },
  T: { tiles: ['grass0'], solid: true, decor: 'palm' },
  Y: { tiles: ['parking'], solid: true, decor: 'deadpalm' },
  L: { tiles: ['sidewalk'], solid: true, decor: 'lamp', light: true },
  F: { tiles: ['floor0', 'floor1'], solid: false },
  q: { tiles: ['floorCrack'], solid: false },
  l: { tiles: ['floor0'], solid: false, decor: 'flourescent', light: true },
  W: { tiles: ['wallIn'], solid: true },
  w: { tiles: ['wallTop'], solid: true },
  C: { tiles: ['counter'], solid: true },
  B: { tiles: ['shelf'], solid: true },
  g: { tiles: ['garbage'], solid: true },
  c: { tiles: ['carpet'], solid: false },
  p: { tiles: ['puddle'], solid: false },
  n: { tiles: ['neon'], solid: true, light: true },
  ' ': { tiles: ['void'], solid: true },
  v: { tiles: ['vines'], solid: true },
  e: { tiles: ['escalator'], solid: false },
  m: { tiles: ['meat'], solid: false },
  Q: { tiles: ['doorway'], solid: false },
  // Under the Pond
  k: { tiles: ['wetConcrete0', 'wetConcrete1', 'wetConcrete0'], solid: false },
  K: { tiles: ['drainWall'], solid: true },
  u: { tiles: ['murk'], solid: true },
  h: { tiles: ['shallows'], solid: false },
  o: { tiles: ['fungus'], solid: false, light: true },
  j: { tiles: ['grate'], solid: false },
  a: { tiles: ['rubble'], solid: true },
  z: { tiles: ['eggs'], solid: true },
  X: { tiles: ['fleshCoral'], solid: true },
  y: { tiles: ['boneSand0', 'boneSand1', 'boneSand0'], solid: false },
};

/** All painted tile names in a stable order (index = tileset frame). */
export const TILE_NAMES: string[] = [...new Set(Object.values(TILE_DEFS).flatMap((d) => d.tiles))];

export function tileVariant(ch: string, x: number, y: number): string {
  const def = TILE_DEFS[ch] ?? TILE_DEFS[' '];
  const h = ((x * 73856093) ^ (y * 19349663)) >>> 0;
  return def.tiles[h % def.tiles.length];
}
