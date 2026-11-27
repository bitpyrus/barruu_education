/**
 * @barruu/engine — the platform-independent learning engine.
 *
 * Content model, safe expressions, deterministic assessment, geometry and
 * construction goals, interactive registry, learner model, placement-ready
 * mastery, validation, simulations and the tutor's context/action contracts.
 * No DOM, no React, no network: every Barruu runtime (web, desktop, a future
 * native app) must produce identical results from these functions.
 */
export * from './schema';
export * from './expr';
export * from './assessment';
export * from './geometry';
export * from './registry';
export * from './validate';
export * from './learnerModel';
export * from './conceptGraph';
export * from './recommend';
export * from './progress';
export * from './sim/pendulum';
export * from './sim/sorting';
export * from './tutor/context';
export * from './tutor/actions';
export * from './tutor/prompt';
