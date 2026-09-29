import type { BridgesBoard } from "./bridges.types";

/**
 * The Bridges solver: what made every puzzle, and what proves it has one answer.
 *
 * A puzzle is worked on as the counts each span may still have, a bitmask of
 * {0, 1, 2} per span (`Options`). The GLANCE is what a person finds by looking,
 * repeated until it finds nothing more:
 *
 *  - An island's count against its spans: if the others can give at most so
 *    many, this one must give the rest; if they already give so many, this one
 *    can give only what is left.
 *  - A span with a bridge on it rules out every span it would cross.
 *  - Joining: a group of islands already joined whose every island is full is
 *    cut off from the rest, which is never allowed — so any bridge that would
 *    make such a group is ruled out (the two 1s that may not be joined, the two
 *    2s that may not take a double). And a group with one way out must take it.
 *
 * Past the glance, a guess: a span's count supposed, glanced at, and taken
 * back if it leads nowhere. `countSolutions` searches every way; `levelOf`
 * measures how a person would go, which is what a level is.
 */

import type { PuzzleLevel } from "../puzzles.types";

/** Bit `1 << n` set when a span may still hold `n` bridges. */
export type Options = Uint8Array;

export const ANY = 0b111;

const LOWEST = [0, 0, 1, 0, 2, 0, 1, 0];
const HIGHEST = [0, 0, 1, 1, 2, 2, 2, 2];

/** The fewest and most bridges a span's options allow. */
export function lowest(options: number): number {
  return LOWEST[options]!;
}
export function highest(options: number): number {
  return HIGHEST[options]!;
}

/** The options between `from` and `to` bridges, inclusive. */
function between(from: number, to: number): number {
  let mask = 0;
  for (let n = Math.max(0, from); n <= Math.min(2, to); n += 1) mask |= 1 << n;
  return mask;
}

/** Every span open, as a puzzle starts. */
export function openOptions(board: BridgesBoard): Options {
  return new Uint8Array(board.spans.length).fill(ANY);
}

/** Whether every span is down to one count. */
export function settled(options: Options): boolean {
  for (const option of options) if (option !== 1 && option !== 2 && option !== 4) return false;
  return true;
}

/** The counts of a settled board, or of a board's lowest options. */
export function countsOf(options: Options): number[] {
  return Array.from(options, lowest);
}

/** Islands joined by the spans that certainly hold a bridge: a find over a parent table. */
function groups(board: BridgesBoard, options: Options): Int32Array {
  const parent = new Int32Array(board.islands.length);
  for (let at = 0; at < parent.length; at += 1) parent[at] = at;
  const find = (at: number): number => {
    while (parent[at] !== at) {
      parent[at] = parent[parent[at]!]!;
      at = parent[at]!;
    }
    return at;
  };
  board.spans.forEach((span, at) => {
    if (lowest(options[at]!) > 0) parent[find(span.a)] = find(span.b);
  });
  for (let at = 0; at < parent.length; at += 1) parent[at] = find(at);
  return parent;
}

/**
 * Everything the glance finds, written into `options`. False when the board
 * cannot be finished from here: an island that can no longer be given its
 * count, two crossing bridges, or a group cut off from the rest. With `joins`
 * off it only counts — each island against its spans, and nothing across a
 * bridge — which is all an easy puzzle asks.
 */
export function glance(board: BridgesBoard, options: Options, joins = true): boolean {
  const { islands, spansOf, spans, crossing } = board;
  const total = islands.length;
  let changed = true;
  const restrict = (span: number, mask: number): boolean => {
    const next = options[span]! & mask;
    if (next === options[span]) return true;
    options[span] = next;
    changed = true;
    return next !== 0;
  };
  while (changed) {
    changed = false;
    // Each island's count against what its spans can give.
    for (let island = 0; island < total; island += 1) {
      const need = islands[island]!.count;
      let least = 0;
      let most = 0;
      for (const span of spansOf[island]!) {
        least += lowest(options[span]!);
        most += highest(options[span]!);
      }
      if (least > need || most < need) return false;
      if (least === most) continue;
      for (const span of spansOf[island]!) {
        const option = options[span]!;
        const mask = between(need - (most - highest(option)), need - (least - lowest(option)));
        if (!restrict(span, mask)) return false;
      }
    }
    // A bridge rules out everything it crosses.
    for (let span = 0; span < spans.length; span += 1) {
      if (lowest(options[span]!) === 0) continue;
      for (const other of crossing[span]!) if (!restrict(other, 1)) return false;
    }
    if (joins && !joining(board, options, restrict)) return false;
  }
  return true;
}

/** The joining rules: no group may close itself off, and a group with one way out takes it. */
function joining(board: BridgesBoard, options: Options, restrict: (span: number, mask: number) => boolean): boolean {
  const { islands, spans, spansOf } = board;
  const total = islands.length;
  const group = groups(board, options);
  const size = new Int32Array(total);
  const open = new Int32Array(total);
  const given = new Int32Array(total);
  for (let island = 0; island < total; island += 1) {
    let least = 0;
    for (const span of spansOf[island]!) least += lowest(options[span]!);
    given[island] = least;
    size[group[island]!]! += 1;
    if (least < islands[island]!.count) open[group[island]!]! += 1;
  }
  for (let island = 0; island < total; island += 1) {
    if (group[island] === island && open[island] === 0 && size[island]! < total) return false;
  }
  const exits = new Int32Array(total);
  const lastExit = new Int32Array(total).fill(-1);
  for (let at = 0; at < spans.length; at += 1) {
    const { a, b } = spans[at]!;
    const ga = group[a]!;
    const gb = group[b]!;
    if (ga === gb || highest(options[at]!) === 0) continue;
    exits[ga]! += 1;
    lastExit[ga] = at;
    exits[gb]! += 1;
    lastExit[gb] = at;
    // Would drawing n here join two groups into one that is full and not everybody?
    if (size[ga]! + size[gb]! >= total) continue;
    let mask = options[at]!;
    for (let n = 1; n <= 2; n += 1) {
      if ((mask & (1 << n)) === 0) continue;
      const fullA = given[a]! + n === islands[a]!.count;
      const fullB = given[b]! + n === islands[b]!.count;
      const stillOpen = open[ga]! - (fullA ? 1 : 0) + open[gb]! - (fullB ? 1 : 0);
      if (stillOpen === 0) mask &= ~(1 << n);
    }
    if (!restrict(at, mask)) return false;
  }
  for (let island = 0; island < total; island += 1) {
    if (group[island] !== island || size[island]! >= total) continue;
    if (exits[island] === 0) return false;
    if (exits[island] === 1 && !restrict(lastExit[island]!, 0b110)) return false;
  }
  return true;
}

/** Whether a settled board is an answer: every island full, and every island joined to every other. */
export function isAnswer(board: BridgesBoard, options: Options): boolean {
  if (!settled(options)) return false;
  const group = groups(board, options);
  if (!group.every((root) => root === group[0])) return false;
  return board.islands.every((island, at) => board.spansOf[at]!.reduce((sum, span) => sum + lowest(options[span]!), 0) === island.count);
}

/** The span to guess at: the undecided one with the fewest options, first found. */
function guessSpan(options: Options): number {
  let best = -1;
  let bestCount = 4;
  for (let at = 0; at < options.length; at += 1) {
    const option = options[at]!;
    if (option === 1 || option === 2 || option === 4) continue;
    const count = (option & 1) + ((option >> 1) & 1) + ((option >> 2) & 1);
    if (count < bestCount) {
      best = at;
      bestCount = count;
      if (count === 2) break;
    }
  }
  return best;
}

/**
 * How many answers a board has, counting no further than `limit`: 1 is a
 * puzzle. `pick`, when given, orders each guess's counts (a generator's seed).
 */
export function countSolutions(board: BridgesBoard, start: Options = openOptions(board), limit = 2): number {
  let found = 0;
  const search = (options: Options): void => {
    if (found >= limit || !glance(board, options)) return;
    const span = guessSpan(options);
    if (span === -1) {
      if (isAnswer(board, options)) found += 1;
      return;
    }
    for (let n = 0; n <= 2 && found < limit; n += 1) {
      if ((options[span]! & (1 << n)) === 0) continue;
      const next = options.slice();
      next[span] = 1 << n;
      search(next);
    }
  };
  search(start.slice());
  return found;
}

/** The one answer of a board, as counts per span, or null when it has none or more than one. */
export function solutionOf(board: BridgesBoard): number[] | null {
  let answer: number[] | null = null;
  let found = 0;
  const search = (options: Options): void => {
    if (found >= 2 || !glance(board, options)) return;
    const span = guessSpan(options);
    if (span === -1) {
      if (isAnswer(board, options)) {
        found += 1;
        answer = countsOf(options);
      }
      return;
    }
    for (let n = 0; n <= 2 && found < 2; n += 1) {
      if ((options[span]! & (1 << n)) === 0) continue;
      const next = options.slice();
      next[span] = 1 << n;
      search(next);
    }
  };
  search(openOptions(board));
  return found === 1 ? answer : null;
}

/**
 * How many times a person must try something and see, each time one count on
 * one span supposed and glanced at until it falls apart, so that the other
 * counts are left: 0 when the glance alone finishes it. `Infinity` when a
 * single supposition is never enough somewhere — a guess inside a guess — or
 * past `limit`.
 */
export function trialsNeeded(board: BridgesBoard, limit = Infinity): number {
  const options = openOptions(board);
  let trials = 0;
  for (;;) {
    if (!glance(board, options)) return Infinity;
    if (settled(options)) return isAnswer(board, options) ? trials : Infinity;
    if (trials >= limit) return Infinity;
    const ruledOut = firstFailingTrial(board, options);
    if (ruledOut === null) return Infinity;
    options[ruledOut.span] = options[ruledOut.span]! & ~(1 << ruledOut.count);
    trials += 1;
  }
}

/** The first count on a span that the glance shows cannot be, once supposed; null when every one survives. */
function firstFailingTrial(board: BridgesBoard, options: Options): { span: number; count: number } | null {
  for (let span = 0; span < options.length; span += 1) {
    const option = options[span]!;
    if (option === 1 || option === 2 || option === 4) continue;
    for (let count = 0; count <= 2; count += 1) {
      if ((option & (1 << count)) === 0) continue;
      const supposed = options.slice();
      supposed[span] = 1 << count;
      if (!glance(board, supposed)) return { span, count };
    }
  }
  return null;
}

/** The most trials a hard puzzle may ask: past this it is a search, not a puzzle a person enjoys. */
export const MOST_TRIALS = 8;

/**
 * THE LEVEL A BOARD IS, by what a person needs to finish it, or null when it
 * is not a puzzle here (no answer, more than one, or a guess inside a guess):
 *
 *  - easy: counting alone — every island against what its neighbours can give.
 *  - medium: counting and the joining rule, that no group may close itself off.
 *  - hard: somewhere both run out, and a bridge has to be tried and seen.
 */
export function levelOf(board: BridgesBoard): PuzzleLevel | null {
  if (solutionOf(board) === null) return null;
  const counting = openOptions(board);
  if (glance(board, counting, false) && settled(counting)) return "easy";
  const joining = openOptions(board);
  if (glance(board, joining) && settled(joining)) return "medium";
  return trialsNeeded(board, MOST_TRIALS) === Infinity ? null : "hard";
}
