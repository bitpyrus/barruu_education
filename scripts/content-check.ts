/**
 * Content check — run before every commit that touches content (CI runs it too).
 *
 *  1. Every course parses against the schema (done at import time).
 *  2. Every lesson passes semantic lint: constructions solvable, starting boards
 *     not already solved, choice questions have a correct answer, …
 *  3. Course skill tags exist in the curriculum; the skill graph is valid.
 *  4. Translation coverage per locale: missing / stale / orphaned strings.
 *     Missing translations are reported (not fatal); stale and orphaned are fatal
 *     for `reviewed` overlays, warnings for machine drafts.
 */
import { COURSES, OVERLAYS, overlayFor } from '@barruu/content';
import { lintCourse } from '@barruu/engine';
import { getSkill, validateSkillGraph, ITEMS } from '@barruu/curriculum';
import { LOCALES, SOURCE_LOCALE, translationCoverage } from '@barruu/i18n';

let errors = 0;
const err = (m: string) => { errors++; console.error(`  ✗ ${m}`); };
const warn = (m: string) => console.warn(`  ! ${m}`);

console.log('Curriculum');
for (const p of validateSkillGraph()) err(p);
console.log(`  ${ITEMS.length} placement items`);

console.log('Courses');
for (const c of COURSES) {
  const issues = lintCourse(c);
  issues.forEach((i) => err(`${c.id}/${i.lesson}/${i.step}: ${i.message}`));
  for (const s of c.skills) if (!getSkill(s)) err(`${c.id}: unknown curriculum skill "${s}"`);
  if (!c.grades) warn(`${c.id}: no grade band`);
  console.log(`  ${issues.length ? '✗' : '✓'} ${c.id} (${c.chapters.reduce((n, ch) => n + ch.lessons.length, 0)} lessons)`);
}

console.log('Translations');
for (const o of OVERLAYS) if (!COURSES.some((c) => c.id === o.contentId)) err(`overlay ${o.locale}/${o.contentId}: no such course`);
for (const l of LOCALES) {
  if (l.code === SOURCE_LOCALE) continue;
  for (const c of COURSES) {
    const overlay = overlayFor(l.code, c.id);
    const cov = translationCoverage(c, overlay);
    const pct = Math.round((cov.translated / cov.total) * 100);
    const line = `${l.code} ${c.id}: ${cov.translated}/${cov.total} (${pct}%)${overlay ? ` [${overlay.status}]` : ''}`;
    const fatal = overlay?.status === 'reviewed';
    if (cov.stale.length) (fatal ? err : warn)(`${line} — ${cov.stale.length} stale: ${cov.stale.slice(0, 3).join(', ')}`);
    if (cov.orphaned.length) (fatal ? err : warn)(`${line} — ${cov.orphaned.length} orphaned: ${cov.orphaned.slice(0, 3).join(', ')}`);
    if (!cov.stale.length && !cov.orphaned.length) console.log(`  ${pct === 100 ? '✓' : '·'} ${line}`);
  }
}

if (errors) { console.error(`\n${errors} error(s)`); process.exit(1); }
console.log('\nContent OK');
