// Shared palette: muted-neon Florida night. Single-character keys are used
// by the pixel-grid sprite format ('.' and ' ' are transparent).
export const PALETTE: Record<string, string> = {
  k: '#0b0710', // near black
  K: '#241a2e', // deep purple-black
  d: '#4a4352', // dark gray
  m: '#7d7484', // mid gray
  W: '#c9c2b8', // light gray
  w: '#f4efe1', // off white
  g: '#4f8a3a', // gator green
  G: '#2c4a24', // dark gator green
  l: '#b6d84b', // sickly lime
  b: '#d8d08a', // gator belly
  y: '#f2c14e', // raincoat yellow
  Y: '#b8862a', // raincoat shadow
  o: '#e8833a', // orange
  r: '#c23b4a', // red
  p: '#f07aa8', // flamingo pink
  P: '#a8486e', // dark pink
  B: '#3b5dc9', // blue
  c: '#3fb8af', // teal
  C: '#1f6a6a', // dark teal
  n: '#7a4b2a', // brown
  N: '#4a2c1a', // dark brown
  s: '#e8b08a', // skin
  S: '#f0705a', // sunburn
  t: '#9a6a4a', // tan / darker skin
  u: '#6b3f8f', // purple
  U: '#a77bd1', // lavender
  e: '#fff27a', // glowing eye yellow
};

export function hex(key: string): number {
  return parseInt(PALETTE[key].slice(1), 16);
}

export function hexToNum(h: string): number {
  return parseInt(h.replace('#', ''), 16);
}

export function hexToRgb(h: string): { r: number; g: number; b: number } {
  const n = hexToNum(h);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export const UI = {
  windowBg: '#0b0710',
  windowBorder: '#f4efe1',
  windowInner: '#6b3f8f',
  text: '#f4efe1',
  dim: '#7d7484',
  accent: '#f2c14e',
  danger: '#f07aa8',
};
