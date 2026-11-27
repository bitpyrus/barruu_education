/**
 * Safe mathematical expression engine.
 *
 * Parses expressions such as `a*x^2 + b*x + c`, `2sin(x)` or `sqrt(g/L)` into
 * an AST and evaluates them WITHOUT `eval` / `new Function`. This matters
 * because Barruu evaluates expressions that come from AI generation, imported
 * `.bipy` files and learner input, none of which can be trusted as code.
 *
 * It also provides deterministic answer checking: `areEquivalent` compares
 * two expressions by evaluating both at many sample points, which is how the
 * assessment engine accepts `2(x+1)` when the expected answer is `2x+2`.
 */

export type Expr =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: string }
  | { kind: 'unary'; op: '-' | '+'; arg: Expr }
  | { kind: 'binary'; op: '+' | '-' | '*' | '/' | '^'; left: Expr; right: Expr }
  | { kind: 'call'; fn: string; args: Expr[] };

export class ExprError extends Error {}

const FUNCTIONS: Record<string, { arity: number | [number, number]; fn: (...a: number[]) => number }> = {
  sin: { arity: 1, fn: Math.sin }, cos: { arity: 1, fn: Math.cos }, tan: { arity: 1, fn: Math.tan },
  asin: { arity: 1, fn: Math.asin }, acos: { arity: 1, fn: Math.acos }, atan: { arity: 1, fn: Math.atan },
  sinh: { arity: 1, fn: Math.sinh }, cosh: { arity: 1, fn: Math.cosh }, tanh: { arity: 1, fn: Math.tanh },
  sqrt: { arity: 1, fn: Math.sqrt }, abs: { arity: 1, fn: Math.abs }, exp: { arity: 1, fn: Math.exp },
  ln: { arity: 1, fn: Math.log }, log: { arity: [1, 2], fn: (a, b) => (b === undefined ? Math.log10(a) : Math.log(b) / Math.log(a)) },
  floor: { arity: 1, fn: Math.floor }, ceil: { arity: 1, fn: Math.ceil }, round: { arity: 1, fn: Math.round },
  sign: { arity: 1, fn: Math.sign }, min: { arity: [2, 2], fn: Math.min }, max: { arity: [2, 2], fn: Math.max },
};

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI };

type Token =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: '('; } | { t: ')'; } | { t: ','; };

const MAX_LENGTH = 500;

function tokenize(src: string): Token[] {
  if (src.length > MAX_LENGTH) throw new ExprError('Expression is too long');
  const s = src.replace(/\*\*/g, '^').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/π/g, 'pi');
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(s.slice(i));
      if (!m) throw new ExprError(`Invalid number at position ${i}`);
      out.push({ t: 'num', v: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      const m = /^[a-zA-Z_][a-zA-Z_0-9]*/.exec(s.slice(i))!;
      out.push({ t: 'id', v: m[0] });
      i += m[0].length;
      continue;
    }
    if ('+-*/^'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    if (c === '(' || c === '[') { out.push({ t: '(' }); i++; continue; }
    if (c === ')' || c === ']') { out.push({ t: ')' }); i++; continue; }
    if (c === ',') { out.push({ t: ',' }); i++; continue; }
    throw new ExprError(`Unexpected character "${c}"`);
  }
  return out;
}

/**
 * Splits identifiers like `ax` into `a*x` when every letter is a known variable,
 * so learners can type `2ax` naturally. Function names and constants are kept.
 */
function splitIdentifier(id: string, knownVars?: Set<string>): string[] {
  if (id in FUNCTIONS || id in CONSTANTS || !knownVars || knownVars.has(id)) return [id];
  const letters = id.split('');
  if (letters.every((l) => knownVars.has(l) || l in CONSTANTS)) return letters;
  return [id];
}

class Parser {
  private pos = 0;
  private tokens: Token[];
  constructor(tokens: Token[]) { this.tokens = tokens; }

  parse(): Expr {
    if (this.tokens.length === 0) throw new ExprError('Empty expression');
    const e = this.expr();
    if (this.pos < this.tokens.length) throw new ExprError('Unexpected input after expression');
    return e;
  }

  private peek(): Token | undefined { return this.tokens[this.pos]; }
  private next(): Token { const t = this.tokens[this.pos++]; if (!t) throw new ExprError('Unexpected end of expression'); return t; }

  private expr(): Expr {
    let left = this.term();
    for (let t = this.peek(); t && t.t === 'op' && (t.v === '+' || t.v === '-'); t = this.peek()) {
      this.pos++;
      left = { kind: 'binary', op: t.v as '+' | '-', left, right: this.term() };
    }
    return left;
  }

  private startsFactor(t: Token | undefined): boolean {
    return !!t && (t.t === 'num' || t.t === 'id' || t.t === '(');
  }

  private term(): Expr {
    let left = this.unary();
    for (;;) {
      const t = this.peek();
      if (t && t.t === 'op' && (t.v === '*' || t.v === '/')) {
        this.pos++;
        left = { kind: 'binary', op: t.v as '*' | '/', left, right: this.unary() };
      } else if (this.startsFactor(t)) {
        // implicit multiplication: 2x, 3(x+1), (x+1)(x-1), 2sin(x)
        left = { kind: 'binary', op: '*', left, right: this.power() };
      } else break;
    }
    return left;
  }

  private unary(): Expr {
    const t = this.peek();
    if (t && t.t === 'op' && (t.v === '-' || t.v === '+')) {
      this.pos++;
      return { kind: 'unary', op: t.v as '-' | '+', arg: this.unary() };
    }
    return this.power();
  }

  private power(): Expr {
    const base = this.atom();
    const t = this.peek();
    if (t && t.t === 'op' && t.v === '^') {
      this.pos++;
      // right-associative; allow unary minus in exponent: x^-1
      return { kind: 'binary', op: '^', left: base, right: this.unary() };
    }
    return base;
  }

  private atom(): Expr {
    const t = this.next();
    if (t.t === 'num') return { kind: 'num', value: t.v };
    if (t.t === '(') {
      const e = this.expr();
      if (this.next().t !== ')') throw new ExprError('Missing closing parenthesis');
      return e;
    }
    if (t.t === 'id') {
      if (t.v in FUNCTIONS && this.peek()?.t === '(') {
        this.pos++;
        const args: Expr[] = [];
        if (this.peek()?.t !== ')') {
          args.push(this.expr());
          while (this.peek()?.t === ',') { this.pos++; args.push(this.expr()); }
        }
        if (this.next().t !== ')') throw new ExprError(`Missing ")" after ${t.v}(`);
        const { arity } = FUNCTIONS[t.v];
        const [lo, hi] = Array.isArray(arity) ? arity : [arity, arity];
        if (args.length < lo || args.length > hi) throw new ExprError(`${t.v} expects ${lo === hi ? lo : `${lo}–${hi}`} argument(s)`);
        return { kind: 'call', fn: t.v, args };
      }
      if (t.v in FUNCTIONS) {
        // `sin x` → sin(x) (binds to the next power-level factor)
        return { kind: 'call', fn: t.v, args: [this.power()] };
      }
      return { kind: 'var', name: t.v };
    }
    throw new ExprError('Unexpected token');
  }
}

/**
 * Parse an expression into an AST.
 * @param knownVars optional variable names; enables splitting `ax` into `a*x`.
 */
export function parseExpr(src: string, knownVars?: string[]): Expr {
  const known = knownVars ? new Set(knownVars) : undefined;
  const raw = tokenize(src);
  const tokens: Token[] = [];
  for (const tok of raw) {
    if (tok.t === 'id') {
      const parts = splitIdentifier(tok.v, known);
      parts.forEach((p, idx) => {
        if (idx > 0) tokens.push({ t: 'op', v: '*' });
        tokens.push({ t: 'id', v: p });
      });
    } else tokens.push(tok);
  }
  return new Parser(tokens).parse();
}

export type Scope = Record<string, number>;

export function evaluate(expr: Expr, scope: Scope = {}): number {
  switch (expr.kind) {
    case 'num': return expr.value;
    case 'var': {
      if (expr.name in scope) return scope[expr.name];
      if (expr.name in CONSTANTS) return CONSTANTS[expr.name];
      throw new ExprError(`Unknown variable "${expr.name}"`);
    }
    case 'unary': { const v = evaluate(expr.arg, scope); return expr.op === '-' ? -v : v; }
    case 'binary': {
      const a = evaluate(expr.left, scope);
      const b = evaluate(expr.right, scope);
      switch (expr.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        case '^': return Math.pow(a, b);
      }
      break;
    }
    case 'call': return FUNCTIONS[expr.fn].fn(...expr.args.map((x) => evaluate(x, scope)));
  }
  throw new ExprError('Invalid expression');
}

/** Names of free variables (excluding constants and functions). */
export function freeVariables(expr: Expr, acc = new Set<string>()): Set<string> {
  switch (expr.kind) {
    case 'var': if (!(expr.name in CONSTANTS)) acc.add(expr.name); break;
    case 'unary': freeVariables(expr.arg, acc); break;
    case 'binary': freeVariables(expr.left, acc); freeVariables(expr.right, acc); break;
    case 'call': expr.args.forEach((a) => freeVariables(a, acc)); break;
  }
  return acc;
}

/** Compile once, evaluate many times (for plotting). Returns NaN on any error. */
export function compile(src: string, knownVars?: string[]): (scope: Scope) => number {
  const ast = parseExpr(src, knownVars);
  return (scope) => {
    try { const v = evaluate(ast, scope); return Number.isFinite(v) ? v : NaN; } catch { return NaN; }
  };
}

/** Safe one-shot evaluation. Returns NaN if the expression is invalid. */
export function evalSafe(src: string, scope: Scope = {}): number {
  try { return compile(src, Object.keys(scope))(scope); } catch { return NaN; }
}

/** Deterministic pseudo-random generator so equivalence checks are reproducible. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface EquivalenceOptions {
  variables?: string[];
  samples?: number;
  range?: [number, number];
  relTol?: number;
}

/**
 * Numerical equivalence test for two expressions. Evaluates both at random
 * points; they are equivalent if they agree (within tolerance) wherever both
 * are defined, and are defined at enough common points.
 */
export function areEquivalent(a: string, b: string, opts: EquivalenceOptions = {}): boolean {
  let ea: Expr, eb: Expr;
  try {
    ea = parseExpr(a, opts.variables);
    eb = parseExpr(b, opts.variables);
  } catch { return false; }
  const vars = new Set([...(opts.variables ?? []), ...freeVariables(ea), ...freeVariables(eb)]);
  const names = [...vars];
  const [lo, hi] = opts.range ?? [-5, 5];
  const samples = opts.samples ?? 24;
  const relTol = opts.relTol ?? 1e-6;
  const rand = mulberry32(42);
  let compared = 0;
  for (let i = 0; i < samples * 3 && compared < samples; i++) {
    const scope: Scope = {};
    for (const n of names) scope[n] = lo + (hi - lo) * rand();
    let va: number, vb: number;
    try { va = evaluate(ea, scope); vb = evaluate(eb, scope); } catch { return false; }
    if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
    const scale = Math.max(1, Math.abs(va), Math.abs(vb));
    if (Math.abs(va - vb) > relTol * scale) return false;
    compared++;
  }
  return compared >= Math.min(samples, 6);
}

/** Central-difference numerical derivative of a compiled function. */
export function derivative(f: (x: number) => number, x: number, h = 1e-4): number {
  return (f(x + h) - f(x - h)) / (2 * h);
}
