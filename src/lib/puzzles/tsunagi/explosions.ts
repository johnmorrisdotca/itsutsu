import { CELL_BRIDGE, layoutNeighbours, type LinkLayout } from "./code";
import type { Lines } from "./lines";

/**
 * EXPLOSIONS: every so many strokes, a drawn line is broken. John's row: "a
 * drawn line broken or removed every so many moves", with a warning beat
 * before it and "which line is deterministic from the level seed and the
 * moves made", so two players making the same strokes on the same level meet
 * the same explosions, and nothing is left to a coin in the browser.
 *
 * A stroke is a line let go having changed the board (`TsunagiSolve`'s lift).
 * After the `every`-th stroke, and every `every` after it, one line with
 * something drawn is chosen by a hash of the board and the stroke's number:
 *
 *  - `boom<N>`: that line is cut back to half its length.
 *  - `blast<N>`: that line is wiped, and one line touching it is cut back to
 *    half as well.
 *
 * A stroke that solves the level sets nothing off: the level is done first.
 * Pure, like the rest of the drawing rules: new lines, the old ones untouched.
 */

export type Explosion = { lines: Lines; hit: number[]; cells: number[] };

/** Strokes left before the next explosion: 1 means the next stroke sets one off. Null on a board without them. */
export function strokesToExplosion(layout: LinkLayout, strokes: number): number | null {
  if (layout.explosions === null) return null;
  const every = layout.explosions.every;
  return every - (strokes % every);
}

/** A number from the board and the stroke, the same in every browser: FNV-1a over both. */
function pick(givens: string, stroke: number, salt: string, among: number): number {
  let hash = 0x811c9dc5;
  for (const char of `${givens}#${stroke}#${salt}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % among;
}

/** A line cut back to half its cells, never ending on a bridge; a line left as only its stone is no line. */
function halved(layout: LinkLayout, line: readonly number[]): number[] {
  let kept = line.slice(0, Math.floor(line.length / 2));
  while (kept.length > 0 && layout.cells[kept[kept.length - 1]!] === CELL_BRIDGE) kept = kept.slice(0, -1);
  return kept.length < 2 ? [] : kept;
}

/**
 * What the `stroke`-th stroke sets off, from the lines as it left them; null when
 * it sets nothing off: a board without explosions, a stroke between them, or no
 * line drawn to break. `givens` is the level's layout code, the "seed".
 */
export function explosionAfter(layout: LinkLayout, givens: string, lines: Lines, stroke: number): Explosion | null {
  const rule = layout.explosions;
  if (rule === null || stroke <= 0 || stroke % rule.every !== 0) return null;
  const drawn = lines.flatMap((line, pair) => (line.length >= 2 ? [pair] : []));
  if (drawn.length === 0) return null;
  const target = drawn[pick(givens, stroke, "target", drawn.length)]!;
  const next = lines.map((line) => [...line]);
  const hit = [target];
  next[target] = rule.blast ? [] : halved(layout, lines[target]!);
  if (rule.blast) {
    // The line beside it: any other drawn line with a cell next to one of the wiped line's.
    const around = layoutNeighbours(layout);
    const near = new Set(lines[target]!.flatMap((cell) => around[cell]!));
    const touching = drawn.filter((pair) => pair !== target && lines[pair]!.some((cell) => near.has(cell)));
    if (touching.length > 0) {
      const second = touching[pick(givens, stroke, "beside", touching.length)]!;
      next[second] = halved(layout, lines[second]!);
      hit.push(second);
    }
  }
  const cells = hit.flatMap((pair) => lines[pair]!.filter((cell) => !next[pair]!.includes(cell)));
  return { lines: next, hit, cells };
}
