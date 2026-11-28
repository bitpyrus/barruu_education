/**
 * Browser check for apps/web (Playwright + Chromium).
 *   npm run build && npm run preview   # serves on :4173 (or set BASE_URL)
 *   node scripts/e2e/web-check.cjs
 * Covers: placement (weak vs strong learner), language switching incl. RTL,
 * localized lesson content, a construction answer, the number line, the circuit builder (incl. a short circuit), mobile layout.
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

  // Number line: place a point by keyboard, get fraction feedback, fix it.
  await p.goto(B + '/courses/numbers-on-the-line/where-does-three-quarters-live', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /Continue/ }).click();
  await p.getByRole('radio', { name: /Closer to 0/ }).click();
  await p.getByRole('button', { name: 'Lock in' }).click();
  for (let i = 0; i < 3; i++) await p.getByRole('button', { name: /Continue/ }).click();
  await p.locator('[data-point=P]').focus();
  for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowRight'); // 0 → 2/4
  await p.getByRole('button', { name: 'Check' }).click();
  const nlFb = await p.getByRole('status').first().innerText();
  if (!/P is at 2\/4, but it needs to be at 3\/4/.test(nlFb)) throw new Error('expected number-line feedback, got: ' + nlFb);
  await p.getByRole('button', { name: 'Try again' }).click();
  await p.locator('[data-point=P]').focus();
  await p.keyboard.press('ArrowRight');
  await p.getByRole('button', { name: 'Check' }).click();
  await p.getByText('Three jumps of a quarter.').waitFor();
  console.log('number line: keyboard placement + fraction feedback OK');

  // Circuit builder: complete a loop, flip a switch, fall into (and out of) a short circuit.
  await p.goto(B + '/courses/electric-circuits/complete-the-loop', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /Continue/ }).click();
  await p.getByRole('radio', { name: /path back/ }).click();
  await p.getByRole('button', { name: 'Lock in' }).click();
  await p.getByRole('button', { name: /Continue/ }).click();
  for (const n of ['1', '2', '3']) await p.getByRole('button', { name: new RegExp(`Gap ${n}:`) }).click();
  if (!/Bulbs lit: 1/.test(await p.getByRole('status').first().innerText())) throw new Error('closed loop should light the bulb');
  await p.getByRole('button', { name: /Continue/ }).click();
  await p.getByRole('button', { name: /Continue/ }).click();
  await p.getByRole('button', { name: /^Gap:/ }).click();
  await p.getByRole('button', { name: /^Switch is open/ }).press('Enter'); // keyboard
  await p.getByRole('button', { name: 'Check' }).click();
  await p.getByText(/A closed switch completes the loop/).waitFor();
  await p.getByRole('button', { name: /Continue/ }).click();
  for (const n of ['1', '2', '3']) await p.getByRole('button', { name: new RegExp(`Gap ${n}:`) }).click();
  await p.getByRole('button', { name: 'Check' }).click();
  const shortFb = await p.getByText(/Short circuit! The battery's two ends/).last().innerText();
  console.log('circuit short-circuit feedback:', shortFb.slice(0, 70));
  await shot(p, 'w-circuit-short', true);
  await p.getByRole('button', { name: 'Try again' }).click();
  await p.getByRole('button', { name: /Gap 2:/ }).click(); // remove the shortcut
  await p.getByRole('button', { name: 'Check' }).click();
  await p.getByText(/Gap 2 had to stay empty/).waitFor();
  console.log('circuit trap solved');

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
  await p.getByRole('button', { name: /en 3, 3/ }).focus(); // Spanish aria label: "Esquina de la figura en 3, 3…"
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowUp');
  // First a wrong size (4×2 = 8) to see localized engine feedback, then the right one (4×3 = 12).
  await p.keyboard.press('ArrowDown');
  await p.getByRole('button', { name: 'Comprobar' }).click();
  const wrongFb = await p.getByRole('status').first().innerText();
  console.log('es wrong-construction feedback:', wrongFb.replace(/\s+/g, ' ').slice(0, 90));
  if (!/Su área es 8, pero debe ser exactamente 12/.test(wrongFb)) throw new Error('expected localized goal feedback');
  await p.getByRole('button', { name: 'Intentar de nuevo' }).click();
  await p.getByRole('button', { name: /en 5, 3/ }).focus();
  await p.keyboard.press('ArrowUp');
  await p.getByRole('button', { name: 'Comprobar' }).click();
  const fb = await p.getByRole('status').first().innerText();
  console.log('es construction feedback:', fb.replace(/\s+/g, ' ').slice(0, 90));
  if (!/Exactamente 12/.test(fb)) throw new Error('expected Spanish success feedback');
  await shot(p, 'w4-lesson-es');
  await p.goto(B + '/courses/numbers-on-the-line', { waitUntil: 'networkidle' });
  await p.getByRole('heading', { level: 1, name: 'Números en la recta' }).waitFor();
  console.log('es number-line course title OK');

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
  await m.goto(B + '/courses/electric-circuits/series-and-parallel', { waitUntil: 'networkidle' });
  await m.getByRole('button', { name: /Continue/ }).click();
  await m.getByRole('radio', { name: /dimmer/ }).click();
  await m.getByRole('button', { name: 'Lock in' }).click();
  await m.getByRole('button', { name: /Continue/ }).click();
  await m.getByRole('button', { name: /Gap B:/ }).tap();
  await m.waitForTimeout(500);
  if (!/Bulbs lit: 2/.test(await m.getByRole('status').first().innerText())) throw new Error('mobile: tapping the gap should add bulb B');
  await shot(m, 'w8-mobile-circuit', true);

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
  await b.close();
  if (errs.length) process.exit(1);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
