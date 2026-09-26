import { decodeLayout, layoutCells, layoutNeighbours, PAIR_LETTERS } from "./code.ts";
import { turnsIn } from "./generate.ts";
import { countSolutions } from "./solve.ts";

/**
 * HOW HARD A TSUNAGI LEVEL IS, MEASURED. John, 2026-09-26, on 4×4 level 10 —
 * two straight rows and two empty pairs: "literally the easiest map we have…
 * it cannot be number 10, that would have to be number one". The levels were
 * ordered by solver effort alone, which a person does not feel: a board the
 * solver settles in a few positions can still wind, and one it must search
 * can be all straight lines.
 *
 * So a level is measured four ways, each a thing a person meets:
 *
 *  - CORNERS (35%): the turns in the answer's lines, per cell. Straight lines
 *    are seen at a glance; a line that bends five times has to be found.
 *  - GUESSING (30%): the positions where the solver had to try more than one
 *    way on (`branches`), and then how many positions it looked at (`nodes`).
 *    Where it never branched every step was forced, and all such boards count
 *    as no guessing alike: the positions it looked at then say only how big
 *    the board is, and at 4×4 twelve against thirteen put John's four straight
 *    rows ninth.
 *  - NOT FORCED (25%): the share of the empty cells a person cannot fill by
 *    the one move a line's end has left, repeated until none is left. A board
 *    that fills itself that way is easy whatever else it is.
 *  - LONGEST LINE (10%): the longest line in the answer, in cells. One long
 *    snake is harder to see than several short ones.
 *
 * Each is turned into a percentile among the levels of one size, and the four
 * are blended by those weights into a score from 0 to 100: a level's place
 * among its own size's levels, not a number that means anything across sizes.
 * Measured by itsutsu-19 on the six hundred levels of 2026-09-26 and shown to
 * John before it was used; made here a module the level-making script
 * (`scripts/tsunagi-levels.ts`) orders the levels by. Nothing on the site
 * runs it.
 */

/** What is measured of one level. */
export type LevelMeasure = {
  pairs: number;
  /** Turns over every line of the answer. */
  turns: number;
  /** The longest line, in cells. */
  longest: number;
  /** Cells with no marble on them. */
  empties: number;
  /** The share of empty cells the forced moves alone fill, 0 to 1. */
  forcedShare: number;
  /** Positions the solver looked at to prove the one answer. */
  nodes: number;
  /** Positions where it had to try more than one way. */
  branches: number;
};

/** The weights of the four measures in the score. */
export const DIFFICULTY_WEIGHTS = { corners: 0.35, guessing: 0.3, notForced: 0.25, longest: 0.1 } as const;

/**
 * The share of a layout's empty cells filled by forced moves alone: each
 * line's two ends are grown while one of them has exactly one empty neighbour
 * to go to, until a pair's ends meet or no end has only one way on. What a
 * person does before they have to think.
 */
export function forcedShare(code: string, size: number): number {
  const decoded = decodeLayout(code, size);
  if (decoded === null) return 0;
  // Across open edges only; a bridge is not a cell a forced move fills (it is crossed, not taken).
  const around = layoutNeighbours(decoded);
  // A waypoint is an empty cell to a forced move: which line takes it is the solver's to say.
  const layout = layoutCells(code).replace(/[a-p]/g, ".");
  const letters = [...new Set([...layout].filter((char) => PAIR_LETTERS.includes(char)))];
  const owner = [...layout].map((char) => (PAIR_LETTERS.includes(char) ? letters.indexOf(char) : char === "." ? -1 : -2));
  const heads = letters.map((letter) => layout.indexOf(letter));
  const goals = letters.map((letter) => layout.lastIndexOf(letter));
  const done = letters.map(() => false);
  let forced = 0;
  for (let moved = true; moved; ) {
    moved = false;
    for (let pair = 0; pair < letters.length; pair += 1) {
      if (done[pair]) continue;
      for (const end of ["head", "goal"] as const) {
        const at = end === "head" ? heads[pair]! : goals[pair]!;
        const other = end === "head" ? goals[pair]! : heads[pair]!;
        if (around[at]!.includes(other)) {
          done[pair] = true;
          break;
        }
        const open = around[at]!.filter((next) => owner[next] === -1);
        if (open.length !== 1) continue;
        owner[open[0]!] = pair;
        if (end === "head") heads[pair] = open[0]!;
        else goals[pair] = open[0]!;
        forced += 1;
        moved = true;
      }
    }
  }
  const empties = [...layout].filter((char) => char === ".").length;
  return empties === 0 ? 1 : forced / empties;
}

/** Every measure of one level, from its layout and answer; null for a layout that does not read as one of this size. */
export function measureLevel(layout: string, answer: string, size: number): LevelMeasure | null {
  const decoded = decodeLayout(layout, size);
  if (decoded === null) return null;
  return measureSolved(layout, answer, size, countSolutions(decoded, 2));
}

/**
 * The same measures from a solve already made — how many positions and
 * branches the solver took — so a caller that has just proved a level (the
 * level tests) does not solve it a second time to measure it.
 */
export function measureSolved(layout: string, answer: string, size: number, solved: { nodes: number; branches: number }): LevelMeasure | null {
  const decoded = decodeLayout(layout, size);
  if (decoded === null) return null;
  const lengths = decoded.ends.map((_, pair) => [...answer].filter((char) => char === PAIR_LETTERS[pair]).length);
  return {
    pairs: decoded.ends.length,
    turns: turnsIn(answer, decoded),
    longest: Math.max(...lengths),
    empties: [...layoutCells(layout)].filter((char) => char === "." || (char >= "a" && char <= "p")).length,
    forcedShare: forcedShare(layout, size),
    nodes: solved.nodes,
    branches: solved.branches,
  };
}

/**
 * Each level's score, 0 (easiest) to 100 (hardest), as the blend of its four
 * percentiles among `measures` — one size's levels. A percentile is the share
 * of the other levels strictly below it, so ties share a place and the score
 * of a set of one is 0.
 */
export function difficultyScores(measures: readonly LevelMeasure[], size: number): number[] {
  const cells = size * size;
  const percentile = (value: (measure: LevelMeasure) => number) => {
    const all = measures.map(value);
    const others = Math.max(1, measures.length - 1);
    return (measure: LevelMeasure) => all.filter((each) => each < value(measure)).length / others;
  };
  const corners = percentile((measure) => measure.turns / cells);
  const guessing = percentile((measure) => (measure.branches === 0 ? 0 : measure.branches * 1_000_000 + measure.nodes));
  const notForced = percentile((measure) => 1 - measure.forcedShare);
  const longest = percentile((measure) => measure.longest);
  const w = DIFFICULTY_WEIGHTS;
  return measures.map((measure) =>
    Math.round(100 * (w.corners * corners(measure) + w.guessing * guessing(measure) + w.notForced * notForced(measure) + w.longest * longest(measure))),
  );
}

/**
 * The order to play a size's levels in: easiest first, by score, and among
 * equal scores by their order in `levels` so the ranking is the same every
 * time it is made. Returns indexes into `levels`.
 */
export function orderByDifficulty(levels: readonly (readonly [string, string])[], size: number): number[] {
  const measures = levels.map(([layout, answer]) => {
    const measured = measureLevel(layout, answer, size);
    if (measured === null) throw new Error(`Not a ${size}×${size} layout: ${layout}`);
    return measured;
  });
  const scores = difficultyScores(measures, size);
  return levels.map((_, at) => at).sort((a, b) => scores[a]! - scores[b]! || a - b);
}
