/**
 * TSUNAGI'S TWISTS INTO THE LADDER, for `scripts/tsunagi-levels.ts`.
 *
 * John, 2026-09-26: "the ninth one has something simple of an obstacle and a
 * 10th one is much harder… little challenges per block", then sixteen to a
 * block. So the fifteenth and sixteenth levels of a block are its twist: the
 * 15th teaches it gently, the 16th tests it. Bridges come first, as he asked,
 * then walls (with blocked cells); every block after both are taught mixes
 * them, harder as the ladder climbs, the 16th a board with both.
 *
 * NEVER A BOARD WITH PLAY ON IT. A slot is only given a twist when its board
 * has none: the slots named in `keep` (read from production before the run:
 * solves, kept runs, attempts and races) keep their plain board, and so does
 * the rest of that block, because a lesson needs both its levels. A slot that
 * already holds a twist keeps it, so running this again moves nothing. Levels
 * 1 to 14 of every block are never touched.
 */
import { orderByDifficulty } from "../src/lib/puzzles/tsunagi/difficulty.ts";
import { bridgeAndWallCandidate, bridgeCandidate, wallCandidate, type TwistCandidate } from "../src/lib/puzzles/tsunagi/twists.ts";
import { TSUNAGI_BLOCK } from "../src/lib/puzzles/tsunagi/levelBlocks.ts";
import { isTwist } from "../src/lib/puzzles/tsunagi/ladder.ts";
import { seededRandom } from "../src/lib/puzzles/random.ts";

type Level = readonly [string, string];

type Kind = "bridge" | "bridges" | "walls" | "wallsAndBlocked" | "bridgeAndWalls";

/** Each kind's pool, easiest first by the measured difficulty among its own kind. */
function pools(size: number, tries: number, longest: number, budget: number): Record<Kind, TwistCandidate[]> {
  const random = seededRandom(20260927 + size);
  const found: Record<Kind, Map<string, TwistCandidate>> = { bridge: new Map(), bridges: new Map(), walls: new Map(), wallsAndBlocked: new Map(), bridgeAndWalls: new Map() };
  const keep = (kind: Kind, made: TwistCandidate | null) => made !== null && !found[kind].has(made.key) && found[kind].set(made.key, made);
  for (let each = 0; each < tries; each += 1) {
    keep("bridge", bridgeCandidate(size, random, longest, budget, 1));
    keep("bridges", bridgeCandidate(size, random, longest, budget, 2));
    keep("walls", wallCandidate(size, random, longest, budget, 0, 6));
    keep("wallsAndBlocked", wallCandidate(size, random, longest, budget, 2, 6));
    keep("bridgeAndWalls", bridgeAndWallCandidate(size, random, longest, budget, 1, 6));
  }
  const ordered = (kind: Kind) => {
    const list = [...found[kind].values()];
    return list.length === 0 ? [] : orderByDifficulty(list.map((made) => [made.layout, made.answer] as const), size).map((at) => list[at]!);
  };
  return { bridge: ordered("bridge"), bridges: ordered("bridges"), walls: ordered("walls"), wallsAndBlocked: ordered("wallsAndBlocked"), bridgeAndWalls: ordered("bridgeAndWalls") };
}

/** A lesson: the kinds to try for its 15th and for its 16th, first that has a board, and how far up its pool to take one (0 easiest, 1 hardest). */
type Lesson = { teach: Kind[]; test: Kind[]; teachAt: number; testAt: number };

/** The lessons, in the order the ladder meets them: bridges, walls, then both, climbing. */
function lessons(count: number): Lesson[] {
  const out: Lesson[] = [
    { teach: ["bridge"], test: ["bridges", "bridge", "bridgeAndWalls"], teachAt: 0, testAt: 0.5 },
    { teach: ["walls", "wallsAndBlocked"], test: ["wallsAndBlocked", "walls"], teachAt: 0, testAt: 0.5 },
  ];
  for (let each = 2; each < count; each += 1) {
    const climb = count <= 3 ? 1 : (each - 2) / (count - 3);
    out.push(
      each % 2 === 0
        ? { teach: ["bridge", "bridges"], test: ["bridgeAndWalls", "bridges", "bridge"], teachAt: 0.2 + 0.6 * climb, testAt: 0.3 + 0.7 * climb }
        : { teach: ["wallsAndBlocked", "walls"], test: ["bridgeAndWalls", "wallsAndBlocked"], teachAt: 0.2 + 0.6 * climb, testAt: 0.3 + 0.7 * climb },
    );
  }
  return out;
}

export type TwistPlan = { levels: Level[]; placed: { level: number; kind: Kind; replaced: string }[]; kept: number[] };

/**
 * The size's levels with twists in every 15th and 16th slot that may take one.
 * `keep` is the levels with play on production; `plan` the generator's pool sizes.
 */
export function withTwists(size: number, levels: readonly Level[], keep: ReadonlySet<number>, plan: { tries: number; longest: number; budget: number }): TwistPlan {
  const out = [...levels];
  const blocks = Math.floor(levels.length / TSUNAGI_BLOCK);
  const placed: TwistPlan["placed"] = [];
  const kept: number[] = [];
  // Blocks free for a lesson: both slots unplayed and both still plain.
  const free: number[] = [];
  for (let block = 1; block <= blocks; block += 1) {
    const [teach, test] = [block * TSUNAGI_BLOCK - 1, block * TSUNAGI_BLOCK];
    const already = isTwist(levels[teach - 1]![0]) || isTwist(levels[test - 1]![0]);
    if (keep.has(teach) || keep.has(test) || already) kept.push(block);
    else free.push(block);
  }
  if (free.length === 0) return { levels: out, placed, kept };
  const pool = pools(size, plan.tries, plan.longest, plan.budget);
  const used = new Set<string>();
  const take = (kinds: Kind[], at: number): { made: TwistCandidate; kind: Kind } | null => {
    for (const kind of kinds) {
      const list = pool[kind].filter((made) => !used.has(made.key));
      if (list.length === 0) continue;
      const made = list[Math.round(Math.min(1, Math.max(0, at)) * (list.length - 1))]!;
      used.add(made.key);
      return { made, kind };
    }
    return null;
  };
  lessons(free.length).forEach((lesson, at) => {
    const block = free[at]!;
    const teach = take(lesson.teach, lesson.teachAt);
    const test = take(lesson.test, lesson.testAt);
    // A lesson needs both its levels: where either cannot be made, the block stays plain.
    if (teach === null || test === null) {
      kept.push(block);
      return;
    }
    for (const [slot, pick] of [
      [block * TSUNAGI_BLOCK - 1, teach],
      [block * TSUNAGI_BLOCK, test],
    ] as const) {
      placed.push({ level: slot, kind: pick.kind, replaced: out[slot - 1]![0] });
      out[slot - 1] = [pick.made.layout, pick.made.answer];
    }
  });
  return { levels: out, placed, kept: kept.sort((a, b) => a - b) };
}
