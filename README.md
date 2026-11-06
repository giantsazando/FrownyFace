# SWAMPLIGHT

An Earthbound-inspired, surreal-and-creepy RPG set in modern-day Florida.

You play **Okee**, an alligator in a yellow raincoat who lives in the retention
pond behind the cul-de-sac. The town of Palmetto Hollow thinks she's an urban
legend. She protects it anyway. Tonight, a payphone that hasn't rung since 2003
is ringing, and the dead strip mall across the road has started to *grow*.

## Download & play (Windows)

1. Open the repository's **Releases** page on GitHub.
2. Download `SWAMPLIGHT-<version>-portable.exe` from the latest release.
3. Double-click it. Nothing is installed; the game opens in its own window.

The .exe isn't code-signed, so Windows SmartScreen may say "Windows protected your PC".
Click **More info**, then **Run anyway**. Saves are kept between launches.

| Key | Action |
| --- | --- |
| Arrows / WASD | Move, menu cursor |
| Z / Enter / Space | Talk, confirm, advance text |
| X / Esc | Cancel, open menu (Goods / Status) |
| F11 | Toggle fullscreen (desktop app) |

## The MVP slice

- **Palmetto Hollow** (town hub): talk to the HOA patrol, Pastor Dale preaching to an empty
  parking lot, a kid with a blurry photo of you, a talking mailbox, a man in a manatee
  costume. Shop at Bait & Vape. Payphones heal and save.
- **Everglow Plaza** (dungeon, 3 floors): Food Court → Dollar Paradise → Bellweather's.
  Recruit **Brother Ibis**, a white ibis who eats garbage and therefore hears it.
- **Under the Pond** (optional dungeon, opens after Brother Ibis joins): dive into the whirlpool
  in Okee's own pond. Three pitch-dark drain floors with Walking Catfish, Apple Snail Broods and
  Waterlogged Dolls, an underwater payphone, and venom. At the bottom: **The Lionfish**, somebody's
  flushed pet that never stopped growing. Beat it to free **Dolores**, a scarred manatee who joins
  as a tanky third party member (Seagrass heals, Undertow, Scar Shield, Deep Call).
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

## For developers

```bash
npm install
npm run dev                      # play in the browser with hot reload
npm run desktop                  # play in the Electron desktop window
npm test                         # unit + content validation
npm run typecheck
npm run build                    # static web build in dist/
npm run dist:win                 # Windows portable .exe in release/ (run on Windows)
node scripts/screenshots.mjs     # screenshots of key screens (needs Playwright + Chromium)
node scripts/playthrough.mjs     # automated run: intro → payphone → plaza → Ibis → boss → ending
node scripts/lake-playthrough.mjs  # automated run of the pond dungeon → Lionfish → Dolores joins
```

### Releasing a new .exe

The **Build Windows exe** GitHub Actions workflow (`.github/workflows/release.yml`) runs on a
Windows runner, runs the tests, and builds the portable .exe with electron-builder.

- Push a version tag to publish a GitHub Release with the .exe attached:
  bump `version` in `package.json`, then `git tag v0.1.0 && git push origin v0.1.0`.
- Or run the workflow manually from the Actions tab; the .exe is attached to that run as an
  artifact (no public release).

The app icon (`build/icon.png`) is generated from Okee's sprite: `npm run icon`.

### Debug entry points

- `?debug=map:plaza1:14:16&ibis=1&flags=intro,answeredPhone`: jump to a map position
- `?debug=battle:boss&lvl=8&ibis=1`: start a battle (groups in `src/data/enemies.ts`)
- `?debug=map:drain1:5:2&ibis=1&lvl=9&flags=intro,answeredPhone,lakeHint`: jump into the pond dungeon
- `&dolores=1`: start with Dolores in the party
- `?debug=ending`: roll credits
