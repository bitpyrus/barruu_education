/**
 * Instrumented sorting algorithms. Each produces a full execution trace so the
 * learner can step forwards/backwards and the tutor can describe exactly what
 * happened at any step ("on step 7 we compared 5 and 3 and swapped them").
 */

export type SortAlgorithm = 'bubble' | 'insertion' | 'selection';

export interface SortFrame {
  array: number[];
  /** Indices being compared in this frame. */
  compare: [number, number] | null;
  /** Whether this frame performed a swap / shift. */
  swapped: boolean;
  /** Indices known to be in final position. */
  sorted: number[];
  note: string;
  comparisons: number;
  swaps: number;
}

export interface SortTrace { algorithm: SortAlgorithm; frames: SortFrame[]; comparisons: number; swaps: number; }

export function traceSort(input: number[], algorithm: SortAlgorithm): SortTrace {
  const a = [...input];
  const frames: SortFrame[] = [];
  let comparisons = 0, swaps = 0;
  const sorted = new Set<number>();
  const push = (compare: [number, number] | null, swapped: boolean, note: string) =>
    frames.push({ array: [...a], compare, swapped, sorted: [...sorted].sort((x, y) => x - y), note, comparisons, swaps });

  push(null, false, 'Start');
  const n = a.length;

  if (algorithm === 'bubble') {
    for (let end = n - 1; end > 0; end--) {
      let any = false;
      for (let i = 0; i < end; i++) {
        comparisons++;
        if (a[i] > a[i + 1]) {
          [a[i], a[i + 1]] = [a[i + 1], a[i]]; swaps++; any = true;
          push([i, i + 1], true, `${a[i + 1]} > ${a[i]}, so swap them`);
        } else push([i, i + 1], false, `${a[i]} ≤ ${a[i + 1]}, leave them`);
      }
      sorted.add(end);
      if (!any) { for (let k = 0; k <= end; k++) sorted.add(k); push(null, false, 'No swaps in this pass — the array is sorted'); break; }
    }
    sorted.add(0);
  } else if (algorithm === 'insertion') {
    sorted.add(0);
    for (let i = 1; i < n; i++) {
      let j = i;
      while (j > 0) {
        comparisons++;
        if (a[j - 1] > a[j]) {
          [a[j - 1], a[j]] = [a[j], a[j - 1]]; swaps++;
          push([j - 1, j], true, `${a[j]} > ${a[j - 1]}, shift ${a[j]} right`);
          j--;
        } else { push([j - 1, j], false, `${a[j - 1]} ≤ ${a[j]}, ${a[j]} is in place`); break; }
      }
      for (let k = 0; k <= i; k++) sorted.add(k);
    }
  } else {
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      for (let j = i + 1; j < n; j++) {
        comparisons++;
        push([min, j], false, `Is ${a[j]} smaller than current minimum ${a[min]}?`);
        if (a[j] < a[min]) min = j;
      }
      if (min !== i) { [a[i], a[min]] = [a[min], a[i]]; swaps++; }
      sorted.add(i);
      push(null, min !== i, `Place minimum ${a[i]} at position ${i}`);
    }
    sorted.add(n - 1);
  }
  for (let k = 0; k < n; k++) sorted.add(k);
  push(null, false, `Done: ${comparisons} comparisons, ${swaps} swaps`);
  return { algorithm, frames, comparisons, swaps };
}
