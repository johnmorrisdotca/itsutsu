/**
 * The generator, and the ways to start one.
 *
 * A `Random` is a function that returns a number in [0, 1), exactly like
 * `Math.random`, so anything written against `Math.random` takes one without a
 * change. The difference is that a seed fixes the stream: the same seed gives
 * the same numbers in every browser, on every server, forever.
 *
 * The generator is mulberry32 (Tommy Ettinger, 2017): one 32-bit word of state,
 * a few multiplies a draw, and it passes the statistical batteries a game needs.
 * It is not cryptographic. Never use it for a password, a token or anything a
 * stranger must not be able to guess.
 */

/** A number in [0, 1), like `Math.random`, from a stream a seed fixes. */
export type Random = () => number;

/** One draw and the state after it, for code that keeps the state itself (in a database row, say). */
export type Step = { readonly value: number; readonly state: number };

const GOLDEN = 0x6d2b79f5;
const TWO_32 = 4_294_967_296;

/**
 * One step of mulberry32 as a pure function: the number drawn and the state to
 * keep for the next one. `step(seed)` gives the same first number as
 * `mulberry32(seed)()`, so a stream can be stored between requests as one
 * integer and picked up exactly where it stopped.
 */
export function step(state: number): Step {
  const next = (state + GOLDEN) >>> 0;
  let t = Math.imul(next ^ (next >>> 15), next | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / TWO_32, state: next };
}

/**
 * A seeded stream: `mulberry32(42)` returns the same numbers every time it is
 * made. The seed is read as an unsigned 32-bit integer, so any integer works
 * and 2^32 + 1 is the same seed as 1.
 */
export function mulberry32(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + GOLDEN) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / TWO_32;
  };
}

/** A seeded stream. The name to reach for; `mulberry32` is the same function, for anyone who wants to say which. */
export const seededRandom = mulberry32;

/** MurmurHash3's finaliser: spreads every input bit over every output bit. */
function mix32(value: number): number {
  let h = value >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * A seed from any text: `hashSeed("room-7")` is the same unsigned 32-bit
 * integer everywhere. FNV-1a over the UTF-16 code units, then MurmurHash3's
 * finaliser, so "a" and "b" land far apart. Use it to seed from a name, a
 * room code or a date string.
 */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return mix32(h);
}

/**
 * A seed of its own for one part of something seeded: `deriveSeed(game, "deck")`
 * and `deriveSeed(game, "dice")` are two unrelated streams from one game's
 * seed, and adding a third part later moves neither. Labels may be text or
 * integers and are read in order, so `deriveSeed(s, "round", 3)` is round 3's.
 * Returns an unsigned 32-bit integer.
 */
export function deriveSeed(seed: number, ...labels: readonly (string | number)[]): number {
  let h = mix32(seed);
  for (const label of labels) {
    h = mix32((h ^ hashSeed(typeof label === "number" ? `#${label}` : label)) + 0x9e3779b9);
  }
  return h;
}

/**
 * A new, independent stream split off another: it takes one draw from
 * `random` and seeds a fresh generator from it. Use it to hand a part of the
 * work its own stream, so drawing more there never shifts what comes after.
 * For a sub-stream named by a label rather than by order, use `deriveSeed`.
 */
export function fork(random: Random): Random {
  return mulberry32(mix32(Math.floor(random() * TWO_32)));
}
