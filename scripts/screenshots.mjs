// Smoke test + screenshots against the Vite dev server. Usage:
//   node scripts/screenshots.mjs [outDir]   (needs Playwright + Chromium)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'screenshots';
mkdirSync(out, { recursive: true });

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const base = 'http://localhost:5199/';

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

const wait = (ms) => page.waitForTimeout(ms);
const key = async (k, n = 1, gap = 120) => {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press(k);
    await wait(gap);
  }
};
const shot = (name) => page.screenshot({ path: `${out}/${name}.png` });

async function hold(k, ms) {
  await page.keyboard.down(k);
  await wait(ms);
  await page.keyboard.up(k);
}

// Title
await page.goto(base);
await wait(1500);
await shot('01-title');
await key('z');
await wait(400);
await shot('02-title-menu');
await key('z'); // New Game
await wait(1500);
await shot('03-intro');
await key('z', 14, 300);
await wait(500);
await shot('04-town');
// walk toward the payphone (east then north)
await hold('ArrowRight', 1400);
await hold('ArrowUp', 1500);
await shot('05-town-walk');

// Battle debug
await page.goto(base + '?debug=battle:tourist2&lvl=2');
await wait(2600);
await shot('06-battle-intro');
await key('z', 3, 500);
await wait(800);
await shot('07-battle-menu');
await key('z'); // Chomp
await wait(300);
await shot('08-battle-target');
await key('z');
await wait(1500);
await shot('09-battle-action');

// Boss battle
await page.goto(base + '?debug=battle:boss&lvl=7&ibis=1');
await wait(2600);
await shot('10-boss');

// Plaza maps
await page.goto(base + '?debug=map:plaza1:14:16&ibis=1&flags=intro,answeredPhone,plazaEntered');
await wait(1800);
await shot('11-plaza1');
await page.goto(base + '?debug=map:plaza2:24:18&ibis=1&flags=intro,answeredPhone,plazaEntered,dollarEntered');
await wait(1800);
await shot('12-plaza2');
await page.goto(base + '?debug=map:plaza3:11:12&ibis=1&flags=intro,answeredPhone,anchorEntered');
await wait(1800);
await shot('13-plaza3');
await page.goto(base + '?debug=map:town:30:20&ibis=1&flags=intro,answeredPhone');
await wait(1800);
await shot('14-town-lot');
await key('x');
await wait(300);
await key('ArrowDown');
await key('z');
await wait(300);
await shot('15-status');
await page.goto(base + '?debug=ending');
await wait(6000);
await shot('16-ending');

await browser.close();
await server.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No console errors.');
process.exit(errors.length ? 1 : 0);
