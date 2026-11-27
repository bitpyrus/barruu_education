/**
 * Offline check for apps/web (Playwright + Chromium). Needs the production build:
 *   npm run build && npm run preview   # serves on :4173 (or set BASE_URL)
 *   node scripts/e2e/offline-check.cjs
 * 1. Negative control: a browser that never visited the site cannot load it offline.
 * 2. One online visit precaches the whole app (public/sw.js + offline-manifest.json).
 * 3. Offline: reload, deep-link into a lesson, answer a step, reload — progress persists,
 *    and no request fails (every asset, font included, comes from the cache).
 */
const { chromium } = require('playwright');
const B = process.env.BASE_URL || 'http://localhost:4173';
const OUT = process.env.SHOTS_DIR ? process.env.SHOTS_DIR + '/' : null;
const LESSON = '/courses/mathematical-thinking/what-is-area';
const fail = (msg) => { throw new Error(msg); };

(async () => {
  const b = await chromium.launch();

  // 1. Negative control: offline from the start, nothing cached → must NOT load.
  {
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    await ctx.setOffline(true);
    const loaded = await p.goto(B + LESSON, { timeout: 8000 })
      .then(() => p.getByRole('heading', { name: 'Two gardens' }).isVisible())
      .catch(() => false);
    console.log('control (never visited, offline): lesson loaded =', loaded);
    if (loaded) fail('negative control loaded offline — the test would prove nothing');
    await ctx.close();
  }

  // 2. One online visit installs the service worker and precaches everything.
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, locale: 'en-US' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await p.evaluate(() => navigator.serviceWorker.ready);
  const manifest = await p.evaluate(async () => (await fetch('/offline-manifest.json')).json());
  const cached = await p.evaluate(async () => {
    const name = (await caches.keys()).find((k) => k.startsWith('barruu-app-') && !k.endsWith('-staging'));
    return name ? { name, entries: (await (await caches.open(name)).keys()).length } : null;
  });
  console.log('precache:', cached, '| manifest files:', manifest.files.length, '+ shell');
  if (!cached || cached.name !== 'barruu-app-' + manifest.buildId) fail('build cache missing or wrong build id');
  if (cached.entries !== manifest.files.length + 1) fail('precache incomplete');

  // 3. Offline.
  await ctx.setOffline(true);
  const failed = [];
  p.on('requestfailed', (r) => { if (!/\/sw\.js$/.test(r.url())) failed.push(r.url()); });
  await p.reload({ waitUntil: 'load' });
  await p.getByRole('heading', { level: 1 }).waitFor({ timeout: 10000 });
  console.log('offline reload of home: OK —', await p.getByRole('heading', { level: 1 }).innerText());

  await p.goto(B + LESSON, { waitUntil: 'load' });
  await p.getByRole('heading', { name: 'Two gardens' }).waitFor({ timeout: 10000 });
  console.log('offline deep link into lesson: OK');
  await p.getByRole('radio', { name: /same amount/ }).click();
  await p.getByRole('button', { name: 'Lock in' }).click();
  await p.getByRole('button', { name: /Continue/ }).click();
  await p.getByRole('heading', { name: 'Cover them with squares' }).waitFor();
  if (OUT) await p.screenshot({ path: OUT + 'o1-offline-lesson.png' });

  await p.reload({ waitUntil: 'load' });
  await p.getByRole('heading', { name: 'Cover them with squares' }).waitFor({ timeout: 10000 });
  console.log('offline reload keeps lesson progress: OK');

  const fontsOk = await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'error').length === 0; });
  console.log('failed requests offline:', failed.length ? failed : 'none', '| font load errors:', fontsOk ? 'none' : 'yes');
  if (failed.length || !fontsOk) fail('some files were not available offline');
  console.log('page errors:', errs.length ? errs : 'none');
  await b.close();
  if (errs.length) process.exit(1);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
