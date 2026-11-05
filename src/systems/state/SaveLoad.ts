import type { SaveData } from './GameState';

const KEY = 'swamplight-save-v1';

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function saveGame(data: SaveData, storage = defaultStorage()): boolean {
  try {
    if (!storage) return false;
    storage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(storage = defaultStorage()): SaveData | null {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as SaveData;
    if (d.version !== 1 || !Array.isArray(d.party) || typeof d.mapId !== 'string') return null;
    return d;
  } catch {
    return null;
  }
}

export function hasSave(storage = defaultStorage()): boolean {
  return loadGame(storage) !== null;
}
