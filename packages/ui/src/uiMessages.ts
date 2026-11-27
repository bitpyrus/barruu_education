/**
 * English defaults for every learner-visible string rendered by @barruu/ui.
 * Apps provide their own translator through <UiTextProvider>; these defaults are
 * used when none is provided. Every key here must also exist (with identical
 * English text) in packages/i18n/src/messages/en.json — a test enforces this.
 *
 * `onChange` event strings (e.g. "set a to 2") are NOT here on purpose: they are
 * context for the tutor/logs, not text shown to learners.
 */
export const UI_DEFAULTS: Record<string, string> = {
  'ui.goal': 'Goal:',
  'ui.loadError': "This interactive couldn't be loaded",
  'ui.noRenderer': 'No renderer for “{kind}”.',
  'ui.assumptions': 'Educational model — assumptions & limits',
  'ui.assumption.pendulumLab.0': 'Point mass on a massless, rigid rod',
  'ui.assumption.pendulumLab.1': 'Uniform gravitational field (constant g)',
  'ui.assumption.pendulumLab.2': 'No air resistance except the optional linear damping term',
  'ui.assumption.pendulumLab.3': 'Motion in a single plane',

  'ui.grid.aria': 'Grid board, {cols} by {rows} squares',
  'ui.grid.handle': '{shape} corner at {x}, {y}. Use the arrow keys to move it.',
  'ui.grid.shape': 'Shape',
  'ui.grid.area': 'area {value}',
  'ui.grid.perimeter': 'perimeter {value}',
  'ui.grid.showTiles': 'Show unit squares',
  'ui.grid.hideTiles': 'Hide unit squares',

  'ui.fx.aria': 'Graph of f(x) = {expression}.',
  'ui.fx.roots': 'roots: {values}',
  'ui.fx.noRoots': 'no roots in view',
  'ui.fx.turning': 'turning points: {values}',
  'ui.fx.noTurning': 'no turning points',
  'ui.fx.yIntercept': 'y-intercept: {value}',
  'ui.fx.reference': 'reference: {expression}',
  'ui.fx.showDerivative': 'Show derivative f′(x)',
  'ui.fx.reset': 'Reset',

  'ui.pend.aria': 'Pendulum: length {length} m, gravity {gravity} m/s², angle {angle}°.',
  'ui.pend.length': 'Length',
  'ui.pend.gravity': 'Gravity',
  'ui.pend.amplitudeDeg': 'Release angle',
  'ui.pend.damping': 'Damping',
  'ui.pend.formula': 'Formula 2π√(L/g)',
  'ui.pend.fullModel': 'Full model',
  'ui.pend.measured': 'Measured',
  'ui.pend.timing': 'timing…',
  'ui.pend.release': 'Release',
  'ui.pend.resume': 'Resume',
  'ui.pend.pause': 'Pause',
  'ui.pend.reset': 'Reset pendulum',
  'ui.pend.trace': 'angle over time',
  'ui.pend.scaled': 'scaled to fit · {length} m rod',
  'ui.pend.presets': 'Gravity presets',
  'ui.pend.reducedMotion': 'Reduced motion is on — the periods above are still computed exactly.',
  'ui.planet.Moon': 'Moon',
  'ui.planet.Mars': 'Mars',
  'ui.planet.Earth': 'Earth',
  'ui.planet.Jupiter': 'Jupiter',

  'ui.sort.algorithm': 'Algorithm',
  'ui.sort.bubble': 'Bubble',
  'ui.sort.insertion': 'Insertion',
  'ui.sort.selection': 'Selection',
  'ui.sort.title.bubble': 'Bubble sort',
  'ui.sort.title.insertion': 'Insertion sort',
  'ui.sort.title.selection': 'Selection sort',
  'ui.sort.comparisons': 'comparisons {n}',
  'ui.sort.swaps': 'swaps {n}',
  'ui.sort.play': 'Play',
  'ui.sort.pause': 'Pause',
  'ui.sort.restart': 'Restart',
  'ui.sort.back': 'Step back',
  'ui.sort.forward': 'Step forward',
  'ui.sort.shuffle': 'Shuffle',
  'ui.sort.step': 'step {i} / {n}',
  'ui.sort.aria': 'Array {values}. {note}',
  'sort.start': 'Start',
  'sort.swap': '{a} > {b}, so swap them',
  'sort.keep': '{a} ≤ {b}, so leave them',
  'sort.noSwaps': 'No swaps in this pass — the array is sorted',
  'sort.shift': '{a} > {b}, so shift {a} right',
  'sort.inPlace': '{a} ≤ {b}, so {b} is in place',
  'sort.isSmaller': 'Is {a} smaller than the current minimum {min}?',
  'sort.place': 'Place the minimum {value} at position {position}',
  'sort.done': 'Done: {comparisons} comparisons, {swaps} swaps',
};

export type UiTranslate = (key: string, params?: Record<string, string | number>) => string;

/** Minimal `{name}` interpolation for the English defaults. */
export const defaultUiTranslate: UiTranslate = (key, params = {}) =>
  (UI_DEFAULTS[key] ?? key).replace(/\{(\w+)\}/g, (m, k: string) => (params[k] !== undefined ? String(params[k]) : m));
