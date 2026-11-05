# SWAMPLIGHT

An Earthbound-inspired, surreal-and-creepy RPG set in modern-day Florida.

You play **Okee**, an alligator in a yellow raincoat who lives in the retention
pond behind the cul-de-sac. The town of Palmetto Hollow thinks she's an urban
legend. She protects it anyway. Tonight, a payphone that hasn't rung since 2003
is ringing, and the dead strip mall across the road has started to *grow*.

## Play

```bash
npm install
npm run dev        # open the printed localhost URL
```

| Key | Action |
| --- | --- |
| Arrows / WASD | Move, menu cursor |
| Z / Enter / Space | Talk, confirm, advance text |
| X / Esc | Cancel, open menu (Goods / Status) |

## The MVP slice

- **Palmetto Hollow** (town hub): talk to the HOA patrol, Pastor Dale preaching to an empty
  parking lot, a kid with a blurry photo of you, a talking mailbox, a man in a manatee
  costume. Shop at Bait & Vape. Payphones heal and save.
- **Everglow Plaza** (dungeon, 3 floors): Food Court → Dollar Paradise → Bellweather's.
  Recruit **Brother Ibis**, a white ibis who eats garbage and therefore hears it.
- **Enemies**: Sunburnt Tourist, Lost Snowbird, Sentient Takeout Bag, Feral Shopping Cart,
  Cold-Stunned Iguana, Burmese Python, Lovebug Swarm, and the boss, **The Anchor Tenant**.
- **Combat**: first-person, turn-based, over psychedelic shader backgrounds.
  HP is a **rolling odometer**: damage drains it over time, so heal (or win) before it hits 0.
  Touch enemies from behind for a first strike; out-level them by 5 and they flee instantly.

Everything is generated in code: pixel font, sprites, tiles, enemy art, music and SFX.
No asset files.

## Project layout

```
src/
  art/         palette, pixel font, sprite grids & procedural painters
  data/        party, skills, items, enemies, maps, dialogue scripts (pure data)
  systems/     battle engine + rolling meter (pure TS), game state, save/load, input, audio
  scenes/      Boot, Title, Overworld, Battle, GameOver, Ending, Debug
  ui/          windows, typewriter text box, menus, odometer
tests/         Vitest: battle math, meters, leveling, save/load, map/content validation
scripts/       Playwright smoke screenshots + automated story playthrough
```

Content is data-driven: add an enemy in `src/data/enemies.ts` (plus art in
`src/art/sprites/battlers.ts`), a map in `src/data/maps/`, or dialogue in
`src/data/dialogue/scripts.ts`. `npm test` validates that maps are rectangular,
entities stand on walkable tiles, and every script/item/sprite reference resolves.

## Scripts

```bash
npm test                         # unit + content validation
npm run typecheck
npm run build                    # production build in dist/
node scripts/screenshots.mjs     # screenshots of key screens (needs Playwright + Chromium)
node scripts/playthrough.mjs     # automated run: intro → payphone → plaza → Ibis → boss → ending
```

### Debug entry points

- `?debug=map:plaza1:14:16&ibis=1&flags=intro,answeredPhone`: jump to a map position
- `?debug=battle:boss&lvl=8&ibis=1`: start a battle (groups in `src/data/enemies.ts`)
- `?debug=ending`: roll credits
