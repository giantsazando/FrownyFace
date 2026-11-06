// Automated run of the optional pond dungeon: lake hint -> dive -> 3 floors ->
// Lionfish -> Dolores joins -> back in town.   node scripts/lake-playthrough.mjs [shotDir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { createServer } from 'vite';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const out = process.argv[2] ?? 'screenshots';
mkdirSync(out, { recursive: true });
const server = await createServer({ server: { port: 5196, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const wait = (ms) => page.waitForTimeout(ms);
const ev = (fn, arg) => page.evaluate(fn, arg);
const log = (...a) => console.log('[lake]', ...a);
const flags = () => ev(() => window.__SWAMP.session.gs.data.flags);
const mapId = () => ev(() => window.__SWAMP.session.gs.data.mapId);
const scenes = () => ev(() => window.__GAME.scene.getScenes(true).map((s) => s.scene.key));
const notBusy = () => ev(() => { const s = window.__GAME.scene.getScene('Overworld'); return s.sys.isActive() && !s.busy; });
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
async function mashUntil(cond, max = 400, key = 'z', gap = 120) {
  for (let i = 0; i < max; i++) {
    if (await cond()) return true;
    await page.keyboard.press(key);
    await wait(gap);
  }
  return false;
}
async function teleport(x, y, facing) {
  await ev(([x, y, facing]) => { const s = window.__SWAMP.scene; s.player.setPosition(x * 16 + 8, y * 16 + 15); s.facing = facing; s.grace = 5; s.lastTile = ''; }, [x, y, facing]);
  await wait(150);
}
async function walk(key, ms) { await page.keyboard.down(key); await wait(ms); await page.keyboard.up(key); await wait(1200); }
let ok = true;
const expect = (c, msg) => { if (!c) { ok = false; errors.push('EXPECT FAILED: ' + msg); } };

await page.goto('http://localhost:5196/?debug=map:town:9:22&ibis=1&lvl=16&flags=intro,answeredPhone,plazaEntered');
await wait(1500);
await shot('lake-01-hint');
await mashUntil(async () => (await flags()).lakeHint && (await notBusy()), 100);
log('hint seen:', (await flags()).lakeHint);
await teleport(9, 22, 'left');
await wait(300);
await shot('lake-02-whirlpool');
await page.keyboard.press('z');
await mashUntil(async () => (await scenes()).includes('Overworld') && (await mapId()) === 'drain1', 30, 'z', 300);
await wait(1200);
await shot('lake-03-drain1');
expect((await mapId()) === 'drain1', 'dove into drain1');
await mashUntil(async () => (await flags()).drainEntered && (await notBusy()), 100);

// Fight one drain enemy by hand
await ev(() => { const s = window.__SWAMP.scene; const e = s.entities.find((x) => x.def.kind === 'enemy'); s.player.setPosition(e.x + 4, e.y); s.grace = 0; });
await mashUntil(async () => (await scenes()).includes('Battle'), 40, 'ArrowLeft', 100);
await wait(2200);
await shot('lake-04-battle');
await mashUntil(async () => !(await scenes()).includes('Battle'), 600, 'z', 150);
log('drain battle done; party HP', JSON.stringify(await ev(() => window.__SWAMP.session.gs.data.party.map((m) => [m.id, m.level, m.hp]))));

await teleport(24, 17, 'right');
await walk('ArrowRight', 500);
log('map:', await mapId());
expect((await mapId()) === 'drain2', 'reached drain2');
await mashUntil(async () => (await flags()).spawnEntered && (await notBusy()), 100);
await shot('lake-05-drain2');
await ev(() => { const gs = window.__SWAMP.session.gs; gs.healAll(); gs.addItem('keylime', 6); });
await teleport(13, 16, 'down');
await walk('ArrowDown', 500);
log('map:', await mapId());
expect((await mapId()) === 'drain3', 'reached drain3');
await mashUntil(async () => (await flags()).larderEntered && (await notBusy()), 100);
await teleport(11, 6, 'up');
await shot('lake-06-larder');
await teleport(11, 5, 'up');
await page.keyboard.press('z');
await mashUntil(async () => (await scenes()).includes('Battle'), 80, 'z', 200);
await wait(2500);
await shot('lake-07-lionfish');
const won = await mashUntil(async () => (await flags()).lakeCleared || (await scenes()).includes('GameOver'), 2500, 'z', 120);
log('lake cleared:', !!(await flags()).lakeCleared, 'scenes', await scenes());
expect((await flags()).lakeCleared, 'lionfish defeated');
await mashUntil(async () => (await mapId()) === 'town' && (await notBusy()), 100, 'z', 200);
await wait(1000);
const party = await ev(() => window.__SWAMP.session.gs.data.party.map((m) => m.id));
log('back in', await mapId(), 'party:', party.join(','));
expect(party.includes('dolores'), 'Dolores joined');
expect((await ev(() => window.__GAME.scene.getScene('Overworld').cameras.main.zoom)) === 1, 'camera zoom 1');
await walk('ArrowRight', 600);
await shot('lake-08-home-with-dolores');

await browser.close();
await server.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No console errors.');
process.exit(errors.length || !ok || !won ? 1 : 0);
