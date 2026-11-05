// Overworld character / object sprites as pixel grids (16x16 unless noted).
// Pure data so it can be validated in tests.
import type { Grid } from '../gridTypes';

const okeeDownBody: Grid = [
  '......GGGG......',
  '.....GggggG.....',
  '....GgeggegG....',
  '....GggggggG....',
  '....GgbbbbgG....',
  '.....GbbbbG.....',
  '.....GkbbkG.....',
  '....YyyyyyyY....',
  '...YyyyyyyyyY...',
  '...gYyyyyyyYg...',
  '...gYyyKyyyYg...',
  '....YyyyyyyY....',
  '....YyyKyyyY....',
];
const okeeUpBody: Grid = [
  '......GGGG......',
  '.....GgGGgG.....',
  '....GggGGggG....',
  '....GggGGggG....',
  '....GggggggG....',
  '.....GggggG.....',
  '.....YyyyyY.....',
  '....YyyyyyyY....',
  '...YyyyyyyyyY...',
  '...gYyyyyyyYg...',
  '...gYyyYyyyYg...',
  '....YyyyyyyY....',
  '....YyyYyyyY....',
];
const okeeSideBody: Grid = [
  '................',
  '......GGGGG.....',
  '.....GgggggGGG..',
  '.....GggeggggggG',
  '.....GggggggbbbG',
  '......GbbbbbbbG.',
  '.......GGGGGGG..',
  '.....YyyyyY.....',
  '....YyyyyyyY....',
  '....YyyyyygY....',
  '..GGYyyyyygY....',
  '.GgGYyyyyyyY....',
  'Gg..YyyyyyyY....',
];

export const OKEE_FRAMES: Grid[] = [
  // 0,1: down
  [...okeeDownBody, '.....GG..GG.....', '.....Gg..gG.....', '....GGG..GGG....'],
  [...okeeDownBody, '.....GG..GG.....', '.....Gg...GG....', '....GGG...GGG...'],
  // 2,3: up
  [...okeeUpBody, '.....GGggGG.....', '.....Gg.g.gG....', '....GGG.g.GGG...'],
  [...okeeUpBody, '.....GGggGG.....', '.....Gg.g..GG...', '....GGG..g.GGG..'],
  // 4,5: side (facing right)
  [...okeeSideBody, 'G.....GG.GG.....', '......Gg.Gg.....', '.....GGG.GGG....'],
  [...okeeSideBody, 'G.....GG..GG....', '.....Gg....gG...', '....GGG.....GGG.'],
];

const ibisBody: Grid = [
  '................',
  '......www.......',
  '.....wrkww......',
  '.....rrwwppp....',
  '......ww...pp...',
  '......ww.....p..',
  '.....wwww.......',
  '....wwwwwy......',
  '...wwwwwwwy.....',
  '..kwwwwwwwww....',
  '.kkwwwwwwwwW....',
  '..kkWwwwwwW.....',
];
export const IBIS_FRAMES: Grid[] = [
  [...ibisBody, '......p.p.......', '......p..p......', '.....p...p......', '....pp...pp.....'],
  [...ibisBody, '......pp........', '......p.p.......', '......p..p......', '.....pp..pp.....'],
];

// Generic person template. H=hair S=skin T=shirt L=legs F=feet E=eyes
const PERSON: Grid = [
  '......HHHH......',
  '.....HHHHHH.....',
  '.....HSSSSH.....',
  '.....SESSES.....',
  '.....SSSSSS.....',
  '......SSSS......',
  '....TTTTTTTT....',
  '...TTTTTTTTTT...',
  '...STTTTTTTTS...',
  '...STTTTTTTTS...',
  '....TTTTTTTT....',
  '....LLLLLLLL....',
  '....LLL..LLL....',
  '....LLL..LLL....',
  '....SSS..SSS....',
  '....FFF..FFF....',
];

export interface PersonSpec {
  H: string;
  S: string;
  T: string;
  L: string;
  F?: string;
  E?: string;
  overlay?: Grid;
}

/** Bakes a person template into a concrete palette grid. */
export function person(spec: PersonSpec): Grid {
  const map: Record<string, string> = {
    H: spec.H,
    S: spec.S,
    T: spec.T,
    L: spec.L,
    F: spec.F ?? 'k',
    E: spec.E ?? 'k',
  };
  return PERSON.map((row, y) =>
    [...row]
      .map((ch, x) => {
        const o = spec.overlay?.[y]?.[x];
        if (o && o !== '.') return o;
        return map[ch] ?? ch;
      })
      .join(''),
  );
}

const blank = (): string[] => Array.from({ length: 16 }, () => '................');
function overlay(rows: Record<number, string>): Grid {
  const g = blank();
  for (const [k, v] of Object.entries(rows)) g[Number(k)] = v.padEnd(16, '.');
  return g;
}

export const NPC_SPRITES: Record<string, Grid> = {
  retiree: person({
    H: 'W', S: 's', T: 'p', L: 'b', F: 'w',
    overlay: overlay({ 0: '....cccccccc....', 1: '...cccccccccc...', 7: '...TcTTTcTTcT...'.replace(/T/g, '.'), 9: '.....c....c.....' }),
  }),
  hoa: person({
    H: 'U', S: 's', T: 'u', L: 'K', E: 'e',
    overlay: overlay({ 0: '.....UUUUUU.....', 8: '..nnn...........', 9: '..nwn...........', 10: '..nnn...........' }),
  }),
  pastor: person({ H: 'N', S: 't', T: 'k', L: 'k', overlay: overlay({ 6: '.......ww.......' }) }),
  kid: person({
    H: 'o', S: 's', T: 'l', L: 'B', F: 'w',
    overlay: overlay({ 0: '.....rrrrrr.....', 1: '.....rrrrrrrr...', 8: '............KS..', 9: '............K...' }),
  }),
  clerk: person({ H: 'u', S: 't', T: 'C', L: 'd', E: 'e', overlay: overlay({ 7: '.....c....c.....' }) }),
  tourist: person({
    H: 'y', S: 'S', T: 'p', L: 'c', F: 'w',
    overlay: overlay({ 3: '.....kkSSkk.....', 7: '...p.c.ccc.c....', 8: '......kkk.......', 9: '......kwk.......' }),
  }),
  snowbird: person({ H: 'W', S: 's', T: 'r', L: 'W', F: 'n', overlay: overlay({ 0: '.....BBBBBB.....', 1: '.....BBBBBBBB...', 7: '...rwrwrwrwrw...' }) }),
  mannequin: person({ H: 'W', S: 'W', T: 'W', L: 'W', F: 'W', E: 'W', overlay: overlay({ 5: '......mmmm......' }) }),
  manatee: [
    '................',
    '.....mmmmmm.....',
    '....mmmmmmmm....',
    '...mmkmmmmkmm...',
    '...mmmmmmmmmm...',
    '...mmWWWWWWmm...',
    '...mmWkWWkWmm...',
    '..mmmmWWWWmmmm..',
    '.mmmmmKKKKmmmmm.',
    '.mmmmKsEsEKmmmm.'.replace(/E/g, 'k'),
    '..mmmKssssKmmm..',
    '...mmmKKKKmmm...',
    '...mmmmmmmmmm...',
    '....mmmmmmmm....',
    '....mmm..mmm....',
    '...dddd..dddd...',
  ],
  mailbox: [
    '................',
    '................',
    '....uuuuuuuu....',
    '...uuuuuuuuuu.r.',
    '...ukkkkkkkku.rr',
    '...ukekkkkeku.r.',
    '...ukkkkkkkku.r.',
    '...ukkpppkkku.r.',
    '...uuuuuuuuuu...',
    '.......nn.......',
    '.......nn.......',
    '.......nn.......',
    '.......nn.......',
    '.......nn.......',
    '......nnnn......',
    '.....,,,,,,.....'.replace(/,/g, 'G'),
  ],
  ibisStatic: [...ibisBody, '......p.p.......', '......p..p......', '.....p...p......', '....pp...pp.....'],
};

export const OBJECT_SPRITES: Record<string, Grid[]> = {
  payphone: [
    [
      '....mmmmmmmm....',
      '....mBBBBBBm....',
      '....mBwwwwBm....',
      '....mmmmmmmm....',
      '....mdWWWWdm....',
      '....mdWkkWdm....',
      '...kmdWWWWdm....',
      '...kmdkWkWdm....',
      '...kmdWkWkdm....',
      '...kmdkWkWdm....',
      '...kmddddddm....',
      '...k.mmmmmm.....',
      '...kk..mm.......',
      '.......mm.......',
      '......mmmm......',
      '.....dddddd.....',
    ],
  ],
  cooler: [
    [
      '................',
      '................',
      '................',
      '................',
      '................',
      '..wwwwwwwwwwww..',
      '..wWWWWWWWWWWw..',
      '..wwwwwwwwwwww..',
      '..wwwwwwwwwwww..',
      '..wwwBBBBBBwww..',
      '..wwwwwwwwwwww..',
      '..wwwwwwwwwwww..',
      '..WwwwwwwwwwwW..',
      '...WWWWWWWWWW...',
      '................',
      '................',
    ],
    [
      '................',
      '................',
      '..wwwwwwwwwwww..',
      '..wWWWWWWWWWWw..',
      '................',
      '..wWWWWWWWWWWw..',
      '..wKKKKKKKKKKw..',
      '..wKKKKKKKKKKw..',
      '..wwwwwwwwwwww..',
      '..wwwBBBBBBwww..',
      '..wwwwwwwwwwww..',
      '..wwwwwwwwwwww..',
      '..WwwwwwwwwwwW..',
      '...WWWWWWWWWW...',
      '................',
      '................',
    ],
  ],
};

// Small overworld enemy sprites (2 frames each).
export const ENEMY_MAP_SPRITES: Record<string, Grid[]> = {
  takeout: [
    [
      '................',
      '....ww....ww....',
      '....w.w..w.w....',
      '.....w.ww.w.....',
      '.....wwwwww.....',
      '....wwwwwwww....',
      '...wwkwwwwkww...',
      '...wwwwwwwwww...',
      '...wwrrwwrrww...',
      '...wwwrrrrwww...',
      '...wwwwwwwwww...',
      '...WwwwwwwwwW...',
      '....WwwwwwwW....',
      '....WWwwwwWW....',
      '.....WWWWWW.....',
      '................',
    ],
    [
      '................',
      '................',
      '...ww......ww...',
      '....w.w..w.w....',
      '.....w.ww.w.....',
      '....wwwwwwww....',
      '...wwkwwwwkww...',
      '...wwwwwwwwww...',
      '...wwrrwwrrww...',
      '...wwwrrrrwww...',
      '...wwwwwwwwww...',
      '..WwwwwwwwwwwW..',
      '...WwwwwwwwwW...',
      '....WWwwwwWW....',
      '.....WWWWWW.....',
      '................',
    ],
  ],
  cart: [
    [
      '................',
      '................',
      '.k..............',
      '.kk.............',
      '..mmmmmmmmmmmm..',
      '..m.m.m.m.m.m...',
      '...mmmmmmmmmmm..',
      '...m.m.m.m.m.m..',
      '....mmmmmmmmmm..',
      '....m.m.m.m.mm..',
      '.....mmmmmmmm...',
      '.....m......m...',
      '....mmmmmmmmmm..',
      '.....m......m...',
      '....kek....kek..',
      '.....k......k...',
    ],
    [
      '................',
      '.k..............',
      '.kk.............',
      '..mmmmmmmmmmmm..',
      '..m.m.m.m.m.m...',
      '...mmmmmmmmmmm..',
      '...m.m.m.m.m.m..',
      '....mmmmmmmmmm..',
      '....m.m.m.m.mm..',
      '.....mmmmmmmm...',
      '.....m......m...',
      '....mmmmmmmmmm..',
      '.....m......m...',
      '.....m......m...',
      '....kek....kek..',
      '.....k......k...',
    ],
  ],
  iguana: [
    [
      '................',
      '................',
      '................',
      '................',
      '..........llll..',
      '.........lgklll.',
      '...o.o.o.lllllo.',
      '..lllllllllll...',
      '.llggllgglll....',
      'llllllllllll....',
      'l..l....l.......',
      '...l....l.......',
      '................',
      '................',
      '................',
      '................',
    ],
    [
      '................',
      '................',
      '................',
      '................',
      '................',
      '..........llll..',
      '...o.o.o.lgklll.',
      '..lllllllllllo..',
      '.llggllgglll....',
      'llllllllllll....',
      '.l..l..l..l.....',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  ],
  python: [
    [
      '................',
      '................',
      '................',
      '.........nnn....',
      '........nNnkn...',
      '........nnnnnr..',
      '.........nn.....',
      '...nnNnnnNnn....',
      '..nNnnnNnnnNn...',
      '.nnnNnnnnNnnnn..',
      '.nNnnnNnnnnNnn..',
      '..nnnNnnnNnnn...',
      '...nnnnnnnnn....',
      '................',
      '................',
      '................',
    ],
    [
      '................',
      '................',
      '..........nnn...',
      '.........nNnkn..',
      '.........nnnnn..',
      '..........nn.r..',
      '.........nn.....',
      '...nnNnnnNnn....',
      '..nNnnnNnnnNn...',
      '.nnnNnnnnNnnnn..',
      '.nNnnnNnnnnNnn..',
      '..nnnNnnnNnnn...',
      '...nnnnnnnnn....',
      '................',
      '................',
      '................',
    ],
  ],
};
