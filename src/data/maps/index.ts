import { PLAZA1, PLAZA2, PLAZA3 } from './plaza';
import { TOWN } from './town';
import type { MapDef } from './types';

export const MAPS: Record<string, MapDef> = {
  town: TOWN,
  plaza1: PLAZA1,
  plaza2: PLAZA2,
  plaza3: PLAZA3,
};

export type { MapDef, Entity, Cond } from './types';
