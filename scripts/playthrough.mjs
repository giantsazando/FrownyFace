// Automated story playthrough (uses debug teleports to skip walking).
//   node scripts/playthrough.mjs
import { createRequire } from 'node:module';
import { createServer } from 'vite';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const server = await createServer({ server: { port: 5198, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const wait = (ms) => page.waitForTimeout(ms);
const press = async (k, n = 1, gap = 150) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await wait(gap); } };
const ev = (fn, arg) => page.evaluate(fn, arg);
const flags = () => ev(() => window.__SWAMP.session.gs.data.flags);
const activeScenes = () => ev(() => window.__GAME.scene.getScenes(true).map((s) => s.scene.key));
const log = (...a) => console.log('[playthrough]', ...a);

async function mashUntil(cond, max = 400, key = 'z', gap = 120) {
  for (let i = 0; i < max; i++) {
    if (await cond()) return true;
    await page.keyboard.press(key);
    await wait(gap);
  }
  return false;
}

async function teleport(x, y, facing) {
  await ev(([x, y, facing]) => {
    const s = window.__SWAMP.scene;
    s.player.setPosition(x * 16 + 8, y * 16 + 15);
    s.facing = facing;
    s.grace = 3;
  }, [x, y, facing]);
  await wait(100);
}

const camZoom = () => ev(() => window.__GAME.scene.getScene('Overworld').cameras.main.zoom);
async function assertZoom(label) {
  await wait(800);
  const z = await camZoom();
  log(`camera zoom after ${label}:`, z);
  if (z !== 1) errors.push(`Camera zoom is ${z} after ${label} (expected 1)`);
}

const notBusy = () => ev(() => { const s = window.__GAME.scene.getScene('Overworld'); return s.sys.isActive() && !s.busy; });

await page.goto('http://localhost:5198/');
await wait(1200);
await press('z');
await wait(300);
await press('z'); // New Game
await wait(1200);
await mashUntil(async () => (await flags()).intro && (await notBusy()));
log('intro done', await flags());

// Payphone at (22,12); stand below it facing up.
await teleport(22, 13, 'up');
await press('z');
await mashUntil(async () => (await flags()).answeredPhone && (await notBusy()), 200);
log('phone answered');

// Fight a town enemy by walking into it.
await ev(() => { const s = window.__SWAMP.scene; const e = s.entities.find((x) => x.def.kind === 'enemy'); s.player.setPosition(e.x + 4, e.y); s.grace = 0; });
await mashUntil(async () => (await activeScenes()).includes('Battle'), 40, 'ArrowLeft', 100);
log('battle started:', await activeScenes());
await mashUntil(async () => !(await activeScenes()).includes('Battle'), 600, 'z', 150);
log('battle over. scenes:', await activeScenes(), 'party:', JSON.stringify(await ev(() => window.__SWAMP.session.gs.data.party)));
await assertZoom('town battle');
await page.screenshot({ path: (process.argv[2] ?? 'playthrough-end.png').replace(/\.png$/, '') + '-after-battle.png' });

// Enter the plaza through the door at (32,12).
await teleport(32, 13, 'up');
await page.keyboard.down('ArrowUp'); await wait(400); await page.keyboard.up('ArrowUp');
await wait(1200);
log('map:', await ev(() => window.__SWAMP.session.gs.data.mapId));
await mashUntil(async () => (await flags()).plazaEntered && (await notBusy()), 100);

// Recruit Brother Ibis at (3,9) from (4,9) facing left.
await teleport(4, 9, 'left');
await press('z');
await mashUntil(async () => (await flags()).ibisJoined && (await notBusy()), 200);
log('ibis joined:', (await ev(() => window.__SWAMP.session.gs.data.party.map((m) => m.id))).join(','));

// Escalator up at (25,1) -> plaza2, then staff door (3,1) -> plaza3.
await teleport(25, 2, 'up');
await page.keyboard.down('ArrowUp'); await wait(500); await page.keyboard.up('ArrowUp');
await wait(1200);
log('map:', await ev(() => window.__SWAMP.session.gs.data.mapId));
await mashUntil(async () => (await flags()).dollarEntered && (await notBusy()), 100);
// buff the party for the boss so the test is deterministic-ish
await ev(() => { const gs = window.__SWAMP.session.gs; gs.gainXp(900, ['okee', 'ibis']); gs.healAll(); gs.addItem('keylime', 5); });
await teleport(3, 2, 'up');
await page.keyboard.down('ArrowUp'); await wait(400); await page.keyboard.up('ArrowUp');
await wait(1200);
log('map:', await ev(() => window.__SWAMP.session.gs.data.mapId));
await mashUntil(async () => (await flags()).anchorEntered && (await notBusy()), 100);

// Talk to the boss at (11,4) from directly below it.
await teleport(11, 5, 'up');
await press('z');
await mashUntil(async () => (await flags()).bossDefeated || (await activeScenes()).includes('GameOver'), 1500, 'z', 120);
const won = !!(await flags()).bossDefeated;
if ((await activeScenes()).includes('Overworld')) await assertZoom('boss battle');
log('boss result flags:', JSON.stringify(await flags()), 'scenes', await activeScenes(), won);
await mashUntil(async () => (await activeScenes()).includes('Ending'), 200, 'z', 150);
log('scenes:', await activeScenes());
await page.screenshot({ path: process.argv[2] ?? 'playthrough-end.png' });

await browser.close();
await server.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No console errors.');
process.exit(errors.length || !(await Promise.resolve(won)) ? 1 : 0);
