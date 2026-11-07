import { describe, expect, it } from 'vitest';
import { SCRIPTS } from '../src/data/dialogue/scripts';
import { ENEMIES } from '../src/data/enemies';
import { ITEMS } from '../src/data/items';
import { SKILLS } from '../src/data/skills';

// The game is clean except for exactly one hidden swear word (Manatee Man, post-pond).
describe('hidden swear', () => {
  const allText = JSON.stringify([SCRIPTS, ENEMIES, ITEMS, SKILLS]);
  it('appears exactly once', () => {
    expect(allText.match(/\bshit\b/gi)?.length ?? 0).toBe(1);
  });
  it('is the only profanity', () => {
    const others = allText.match(/\b(fuck\w*|damn\w*|hell|crap|bitch\w*|bastard\w*|piss\w*|ass|asshole)\b/gi) ?? [];
    expect(others).toEqual([]);
  });
});
