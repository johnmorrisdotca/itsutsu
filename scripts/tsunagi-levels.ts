/**
 * THE TSUNAGI LEVELS, MADE ON A DESK: `node scripts/tsunagi-levels.ts [size…]`.
 *
 * For each size asked (all six when none is), fills grids with random lines
 * (`randomFilling`), keeps a layout only when the solver proves it has exactly
 * one answer, drops any that is the same board as one already kept under a
 * turn or a mirror, and writes the best hundred, easiest first, into
 * `src/lib/puzzles/tsunagi/levels/size<n>.data.ts`.
 *
 * Seeded, so the same run writes the same files: the data files are the
 * source the site plays, and this is how they were made, kept so they can be
 * made again. Nothing here runs on the site.
 *
 * EASY TO HARD. A level's place is its solver effort: the positions the
 * solver had to look at to find the answer and prove it the only one. Few
 * means every step is forced; many means somewhere a line has to be tried and
 * taken back. The hundred are taken evenly along the pool sorted that way, so
 * the ladder climbs from the first level to the last, and at the top of each
 * size only layouts the solver settles inside `CEILING` are kept, so the unit
 * test can prove every level again in a few seconds.
 */
import { writeFileSync } from "node:fs";

import { candidate, type LinkCandidate } from "../src/lib/puzzles/tsunagi/generate.ts";
import { seededRandom } from "../src/lib/puzzles/random.ts";

/** Levels a size aims for, and the fewest it may ship with. */
const WANTED = 100;
const FLOOR = 50;

/** Per size: the longest a line may be drawn, how many grids to try, and the most solver positions a kept level may take. */
const PLAN: Record<number, { longest: number; tries: number; ceiling: number }> = {
  4: { longest: 16, tries: 400_000, ceiling: 1_000 },
  5: { longest: 15, tries: 40_000, ceiling: 5_000 },
  6: { longest: 18, tries: 40_000, ceiling: 10_000 },
  7: { longest: 21, tries: 60_000, ceiling: 20_000 },
  8: { longest: 24, tries: 80_000, ceiling: 30_000 },
  9: { longest: 27, tries: 120_000, ceiling: 40_000 },
};

/** The most pairs a level may have: as many colours as the stones come in (`TSUNAGI_COLOURS`). */
const MOST_PAIRS = 12;

function levelsFor(size: number): LinkCandidate[] {
  const plan = PLAN[size]!;
  const random = seededRandom(20260926 + size);
  const kept = new Map<string, LinkCandidate>();
  for (let each = 0; each < plan.tries; each += 1) {
    const made = candidate(size, random, plan.longest, plan.ceiling);
    if (made === null || made.pairs > MOST_PAIRS || kept.has(made.key)) continue;
    kept.set(made.key, made);
  }
  const pool = [...kept.values()].sort((a, b) => a.nodes - b.nodes || a.turns - b.turns || a.pairs - b.pairs || (a.key < b.key ? -1 : 1));
  if (pool.length < FLOOR) throw new Error(`${size}×${size}: only ${pool.length} distinct levels with one answer, fewer than ${FLOOR}.`);
  if (pool.length <= WANTED) return pool;
  // Evenly along the pool, easiest to hardest.
  const picked: LinkCandidate[] = [];
  for (let at = 0; at < WANTED; at += 1) picked.push(pool[Math.round((at * (pool.length - 1)) / (WANTED - 1))]!);
  return picked;
}

function fileFor(size: number, levels: readonly LinkCandidate[]): string {
  const lines = levels.map((level) => `  ["${level.layout}", "${level.answer}"],`);
  return [
    "/**",
    ` * TSUNAGI AT ${size}×${size}: ${levels.length} levels, easiest first.`,
    " *",
    " * WRITTEN BY `node scripts/tsunagi-levels.ts`, NEVER BY HAND. Each line is",
    " * one level: its layout (a letter for each pair's two stones, `.` for an empty",
    " * cell) and its one answer (the letter of the line through every cell). Every",
    " * level is proved to have exactly one answer by `levels.test.ts`, and no two",
    " * are the same board under a turn or a mirror.",
    " */",
    `export const TSUNAGI_${size}: readonly (readonly [string, string])[] = [`,
    ...lines,
    "];",
    "",
  ].join("\n");
}

const asked = process.argv.slice(2).map(Number).filter((size) => PLAN[size] !== undefined);
for (const size of asked.length > 0 ? asked : Object.keys(PLAN).map(Number)) {
  const started = performance.now();
  const levels = levelsFor(size);
  writeFileSync(`src/lib/puzzles/tsunagi/levels/size${size}.data.ts`, fileFor(size, levels));
  const pairs = levels.map((level) => level.pairs);
  console.log(
    `${size}×${size}: ${levels.length} levels, ${Math.min(...pairs)}–${Math.max(...pairs)} pairs, solver ${levels[0]!.nodes}–${levels.at(-1)!.nodes} positions, ${Math.round((performance.now() - started) / 1000)} s`,
  );
}
