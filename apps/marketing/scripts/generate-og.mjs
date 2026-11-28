/**
 * Generates public/og.png (1200 x 630), the social share card, from
 * scripts/og.html. It renders in a real browser (Playwright's Chromium)
 * because the card uses the brand's Google Fonts, which sharp can't load.
 *
 * Re-run with:
 *   node scripts/generate-og.mjs
 *
 * Playwright isn't a dependency of this app. If it isn't installed, point
 * PLAYWRIGHT_MODULE at any installed copy, e.g.
 *   PLAYWRIGHT_MODULE=../../../Newdryve/node_modules/playwright node scripts/generate-og.mjs
 * and make sure a browser is installed (npx playwright install chromium).
 */
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let playwright;
try {
  playwright = require(process.env.PLAYWRIGHT_MODULE ? resolve(process.env.PLAYWRIGHT_MODULE) : 'playwright');
} catch {
  console.error('Playwright not found. Install it, or set PLAYWRIGHT_MODULE (see the comment at the top).');
  process.exit(1);
}

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(join(here, 'og.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(here, '..', 'public', 'og.png') });
await browser.close();

console.log('Wrote public/og.png (1200x630)');
