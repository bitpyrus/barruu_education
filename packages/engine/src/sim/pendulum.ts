/**
 * Simple pendulum model.
 *
 * Model: point mass on a massless, rigid rod; no friction except optional
 * linear damping; uniform gravitational field. Integrates the full nonlinear
 * equation θ'' = −(g/L)·sin θ − b·θ' with RK4, so large-amplitude behaviour
 * (period longer than 2π√(L/g)) is shown honestly rather than hidden by the
 * small-angle approximation.
 */

export interface PendulumParams {
  /** Rod length in metres. */
  length: number;
  /** Gravitational acceleration in m/s². */
  gravity: number;
  /** Initial angle in degrees. */
  amplitudeDeg: number;
  /** Linear damping coefficient in 1/s (0 = none). */
  damping: number;
}

export interface PendulumState { theta: number; omega: number; t: number; }

export const PENDULUM_ASSUMPTIONS = [
  'Point mass on a massless, rigid rod',
  'Uniform gravitational field (constant g)',
  'No air resistance except the optional linear damping term',
  'Motion in a single plane',
];

export function initialState(p: PendulumParams): PendulumState {
  return { theta: (p.amplitudeDeg * Math.PI) / 180, omega: 0, t: 0 };
}

function accel(theta: number, omega: number, p: PendulumParams): number {
  return -(p.gravity / p.length) * Math.sin(theta) - p.damping * omega;
}

/** Advance the state by dt seconds using one RK4 step. */
export function step(s: PendulumState, p: PendulumParams, dt: number): PendulumState {
  const k1t = s.omega, k1w = accel(s.theta, s.omega, p);
  const k2t = s.omega + (dt / 2) * k1w, k2w = accel(s.theta + (dt / 2) * k1t, s.omega + (dt / 2) * k1w, p);
  const k3t = s.omega + (dt / 2) * k2w, k3w = accel(s.theta + (dt / 2) * k2t, s.omega + (dt / 2) * k2w, p);
  const k4t = s.omega + dt * k3w, k4w = accel(s.theta + dt * k3t, s.omega + dt * k3w, p);
  return {
    theta: s.theta + (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t),
    omega: s.omega + (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w),
    t: s.t + dt,
  };
}

/** Small-angle period T₀ = 2π√(L/g). */
export function smallAnglePeriod(p: Pick<PendulumParams, 'length' | 'gravity'>): number {
  return 2 * Math.PI * Math.sqrt(p.length / p.gravity);
}

/**
 * Exact period for an undamped pendulum released from rest at amplitude θ₀:
 * T = 4√(L/g)·K(sin(θ₀/2)) = 2π√(L/g) / AGM(1, cos(θ₀/2)), where K is the
 * complete elliptic integral of the first kind and AGM the arithmetic–geometric mean.
 */
export function exactPeriod(p: Pick<PendulumParams, 'length' | 'gravity' | 'amplitudeDeg'>): number {
  const k = Math.sin(((p.amplitudeDeg * Math.PI) / 180) / 2);
  let a = 1, b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 30 && Math.abs(a - b) > 1e-15; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; }
  return smallAnglePeriod(p) / a;
}

/**
 * Measure the period by simulation: time between successive upward zero
 * crossings of θ. Mirrors what a learner would do with a stopwatch.
 */
export function measurePeriod(p: PendulumParams, dt = 1e-3, maxTime = 60): number {
  let s = initialState(p);
  const crossings: number[] = [];
  while (s.t < maxTime && crossings.length < 3) {
    const next = step(s, p, dt);
    if (s.theta < 0 && next.theta >= 0) {
      const frac = -s.theta / (next.theta - s.theta);
      crossings.push(s.t + frac * dt);
    }
    s = next;
  }
  return crossings.length >= 2 ? crossings[crossings.length - 1] - crossings[crossings.length - 2] : NaN;
}

export const PLANET_GRAVITY: Record<string, number> = {
  Moon: 1.62, Mars: 3.71, Earth: 9.81, Jupiter: 24.79,
};
