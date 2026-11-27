/**
 * Browser check for apps/web (Playwright + Chromium).
 *   npm run build && npm run preview   # serves on :4173 (or set BASE_URL)
 *   node scripts/e2e/web-check.cjs
 * Covers: placement (weak vs strong learner), language switching incl. RTL,
 * localized lesson content, a construction answer, mobile layout.
 */
const { chromium } = require('playwright');
const { execSync } = require('node:child_process');
const B = process.env.BASE_URL || 'http://localhost:4173';
const OUT = process.env.SHOTS_DIR ? process.env.SHOTS_DIR + '/' : null;
const KEY = JSON.parse(execSync('npx tsx scripts/answer-key.ts', { encoding: 'utf8' }));
const shot = async (p, name, full = false) => OUT && p.screenshot({ path: OUT + name + '.png', fullPage: full });

async function runPlacement(p, mode) {
  await p.goto(B + '/placement', { waitUntil: 'networkidle' });
  const retake = p.getByRole('button', { name: /Take it again/ });
  if (await retake.isVisible().catch(() => false)) await retake.click();
  await p.getByRole('button', { name: /^Start/ }).click();
  for (let n = 0; n < 30; n++) {
    if (await p.getByTestId('placement-band').isVisible().catch(() => false)) break;
    const card = p.locator('[data-item-id]');
    await card.waitFor();
    const id = await card.getAttribute('data-item-id');
    const k = KEY[id];
    if (mode === 'weak' || k.kind === 'skip') { await p.getByRole('button', { name: "I don't know yet" }).click(); continue; }
    if (k.kind === 'numeric') await p.getByLabel('Your answer').fill(k.value);
    else await card.locator('[role=radio]').nth(k.index).click();
    await p.getByRole('button', { name: 'Submit' }).click();
  }
  return (await p.getByTestId('placement-band').innerText()).trim();
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1360, height: 880 }, locale: 'en-US' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await shot(p, 'w1-home', true);
  const weak = await runPlacement(p, 'weak');
  console.log('placement (skips everything):', weak);
  const strong = await runPlacement(p, 'strong');
  await shot(p, 'w2-placement-result', true);
  console.log('placement (answers correctly):', strong);
  const rank = (s) => (/Before/.test(s) ? 8 : /Beyond/.test(s) ? 13 : Number(s.match(/\d+/)?.[0]));
  if (!(rank(strong) > rank(weak))) throw new Error(`strong learner should place higher (${strong} vs ${weak})`);

  // Spanish: UI + localized course content + construction
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await p.getByLabel('Language').selectOption('es');
  await p.getByRole('heading', { name: 'Entiéndelo construyéndolo.' }).waitFor();
  console.log('es home heading OK; draft notice:', await p.getByRole('note').innerText());
  await p.goto(B + '/courses/mathematical-thinking', { waitUntil: 'networkidle' });
  console.log('es course title:', await p.getByRole('heading', { level: 1 }).innerText());
  await shot(p, 'w3-course-es', true);
  await p.goto(B + '/courses/mathematical-thinking/what-is-area', { waitUntil: 'networkidle' });
  await p.getByRole('radio', { name: /misma cantidad/ }).click();
  await p.getByRole('button', { name: 'Confirmar' }).click();
  await p.getByRole('button', { name: /Continuar/ }).click();
  await p.getByRole('button', { name: /Continuar/ }).click();
  await p.getByRole('button', { name: /Continuar/ }).click();
  await p.getByLabel('Your answer').fill('8');
  await p.getByRole('button', { name: 'Comprobar' }).click();
  await p.getByRole('button', { name: /Continuar/ }).click();
  await p.getByRole('button', { name: /corner at 3, 3/ }).focus();
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowUp');
  await p.getByRole('button', { name: 'Comprobar' }).click();
  const fb = await p.getByRole('status').first().innerText();
  console.log('es construction feedback:', fb.replace(/\s+/g, ' ').slice(0, 90));
  if (!/Exactamente 12/.test(fb)) throw new Error('expected Spanish success feedback');
  await shot(p, 'w4-lesson-es');

  // Arabic: RTL
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await p.getByLabel(/Idioma|Language/).selectOption('ar');
  await p.waitForFunction(() => document.documentElement.dir === 'rtl');
  console.log('ar: dir =', await p.evaluate(() => document.documentElement.dir), '| heading:', await p.getByRole('heading', { level: 1 }).innerText());
  await shot(p, 'w5-home-ar', true);
  await p.goto(B + '/courses/mathematical-thinking/triangle-area', { waitUntil: 'networkidle' });
  await shot(p, 'w6-lesson-ar');

  const m = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await m.goto(B + '/placement', { waitUntil: 'networkidle' });
  await shot(m, 'w7-mobile-placement', true);

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
  await b.close();
  if (errs.length) process.exit(1);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
