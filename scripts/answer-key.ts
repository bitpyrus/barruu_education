/** Prints the placement answer key as JSON (used by browser checks). */
import { ITEMS } from '@barruu/curriculum';
const key = Object.fromEntries(ITEMS.map((i) => {
  const q = i.question;
  if (q.kind === 'numeric') return [i.id, { kind: 'numeric', value: String(q.answer) }];
  if (q.kind === 'choice') return [i.id, { kind: 'choice', index: q.options.findIndex((o) => o.correct) }];
  return [i.id, { kind: 'skip' }];
}));
process.stdout.write(JSON.stringify(key));
