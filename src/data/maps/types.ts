import type { Facing } from '../../systems/state/GameState';

export interface Cond {
  requires?: string;
  unless?: string;
}

export type Entity =
  | ({ kind: 'npc'; id: string; x: number; y: number; sprite: string; script: string; wander?: boolean; flip?: boolean } & Cond)
  | ({ kind: 'warp'; x: number; y: number; w?: number; h?: number; to: string; tx: number; ty: number; facing: Facing; blocked?: string } & Cond)
  | ({ kind: 'enemy'; id: string; x: number; y: number; group: string; sprite: string } & Cond)
  | ({ kind: 'cooler'; id: string; x: number; y: number; item?: string; money?: number } & Cond)
  | ({ kind: 'payphone'; x: number; y: number } & Cond)
  | ({ kind: 'sign'; x: number; y: number; script: string; sprite?: string } & Cond);

export interface MapDef {
  id: string;
  name: string;
  tiles: string[];
  music: string;
  darkness: number; // 0..1 overlay alpha
  tint: number; // darkness colour
  onEnter?: { script: string } & Cond;
  entities: Entity[];
}
