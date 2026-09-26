/**
 * TSUNAGI'S TWISTS INTO THE LADDER, for `scripts/tsunagi-levels.ts`.
 *
 * John, 2026-09-26: "the ninth one has something simple of an obstacle and a
 * 10th one is much harder… little challenges per block", then sixteen to a
 * block. So the fifteenth and sixteenth levels of a block are its twist: the
 * 15th teaches it gently, the 16th tests it. Bridges come first, as he asked,
 * then walls (with blocked cells), waypoints and wrap; then each again in turn,
 * harder as the ladder climbs, bridges and walls tested together.
 *
 * NEVER A BOARD WITH PLAY ON IT. A slot is only given a twist when its board
 * has none: the slots named in `keep` (read from production before the run:
 * solves, kept runs, attempts and races) keep their plain board, and so does
 * the rest of that block, because a lesson needs both its levels. A block that
 * already holds its planned lesson keeps it, so running this again moves
 * nothing. Levels 1 to 14 of every block are never touched.
 */
import { orderByDifficulty } from "../src/lib/puzzles/tsunagi/difficulty.ts";
import { bridgeAndWallCandidate, bridgeCandidate, wallCandidate, waypointCandidate, wrapCandidate, type TwistCandidate } from "../src/lib/puzzles/tsunagi/twists.ts";
import { symmetryKey } from "../src/lib/puzzles/tsunagi/generate.ts";
import { TSUNAGI_BLOCK } from "../src/lib/puzzles/tsunagi/levelBlocks.ts";
import { challengesOf, type Challenge } from "../src/lib/puzzles/tsunagi/ladder.ts";
import { seededRandom } from "../src/lib/puzzles/random.ts";

type Level = readonly [string, string];

type Kind = "bridge" | "bridges" | "walls" | "wallsAndBlocked" | "bridgeAndWalls" | "waypoints" | "wrap";

const KINDS: readonly Kind[] = ["bridge", "bridges", "walls", "wallsAndBlocked", "bridgeAndWalls", "waypoints", "wrap"];

/** One kind's candidate, from its own random stream. */
function candidateOf(kind: Kind, size: number, random: () => number, longest: number, budget: number): TwistCandidate | null {
  if (kind === "bridge") return bridgeCandidate(size, random, longest, budget, 1);
  if (kind === "bridges") return bridgeCandidate(size, random, longest, budget, 2);
  if (kind === "walls") return wallCandidate(size, random, longest, budget, 0, 6);
  if (kind === "wallsAndBlocked") return wallCandidate(size, random, longest, budget, 2, 6);
  if (kind === "bridgeAndWalls") return bridgeAndWallCandidate(size, random, longest, budget, 1, 6);
  if (kind === "waypoints") return waypointCandidate(size, random, longest, budget, 4);
  return wrapCandidate(size, random, longest, budget);
}

/**
 * Each kind's pool, easiest first by the measured difficulty among its own
 * kind. Every kind draws from a random stream of its own, so adding a kind
 * never changes the boards another kind makes.
 */
function pools(size: number, tries: number, longest: number, budget: number): Record<Kind, TwistCandidate[]> {
  const out = {} as Record<Kind, TwistCandidate[]>;
  KINDS.forEach((kind, index) => {
    const random = seededRandom(20260927 + size * 100 + index);
    const found = new Map<string, TwistCandidate>();
    for (let each = 0; each < tries; each += 1) {
      const made = candidateOf(kind, size, random, longest, budget);
      if (made !== null && !found.has(made.key)) found.set(made.key, made);
    }
    const list = [...found.values()];
    out[kind] = list.length === 0 ? [] : orderByDifficulty(list.map((made) => [made.layout, made.answer] as const), size).map((at) => list[at]!);
  });
  return out;
}

/** A lesson: its twist, the kinds to try for its 15th and for its 16th (first that has a board), and how far up each pool (0 easiest, 1 hardest). */
type Lesson = { twist: Challenge; teach: Kind[]; test: Kind[]; teachAt: number; testAt: number };

/** The kinds each twist is taught and tested with once it has had its own lesson: harder, and mixed. */
const LATER: Record<Challenge, { teach: Kind[]; test: Kind[] }> = {
  bridges: { teach: ["bridge", "bridges"], test: ["bridgeAndWalls", "bridges", "bridge"] },
  walls: { teach: ["wallsAndBlocked", "walls"], test: ["bridgeAndWalls", "wallsAndBlocked"] },
  waypoints: { teach: ["waypoints"], test: ["waypoints"] },
  wrap: { teach: ["wrap"], test: ["wrap"] },
};

/** The lessons, in the order the ladder meets them: bridges, walls, waypoints, wrap, then each again, climbing. */
function lessons(count: number): Lesson[] {
  const out: Lesson[] = [
    { twist: "bridges", teach: ["bridge"], test: ["bridges", "bridge", "bridgeAndWalls"], teachAt: 0, testAt: 0.5 },
    { twist: "walls", teach: ["walls", "wallsAndBlocked"], test: ["wallsAndBlocked", "walls"], teachAt: 0, testAt: 0.5 },
    { twist: "waypoints", teach: ["waypoints"], test: ["waypoints"], teachAt: 0, testAt: 0.5 },
    { twist: "wrap", teach: ["wrap"], test: ["wrap"], teachAt: 0, testAt: 0.5 },
  ];
  const cycle: Challenge[] = ["bridges", "walls", "waypoints", "wrap"];
  for (let each = out.length; each < count; each += 1) {
    const twist = cycle[(each - 4) % cycle.length]!;
    const climb = count <= 5 ? 1 : (each - 4) / (count - 5);
    out.push({ twist, ...LATER[twist], teachAt: 0.2 + 0.6 * climb, testAt: 0.3 + 0.7 * climb });
  }
  return out.slice(0, count);
}

export type TwistPlan = { levels: Level[]; placed: { level: number; kind: Kind; replaced: string }[]; kept: number[] };

/**
 * The size's levels with a lesson in every block's 15th and 16th that may
 * take one. `keep` is the levels with play on production: their blocks are
 * left as they are. A free block that already holds its planned lesson — the
 * lesson's twist on both its boards — keeps those boards, so running this again
 * changes nothing, and lessons already shipped stay where they are.
 */
export function withTwists(size: number, levels: readonly Level[], keep: ReadonlySet<number>, plan: { tries: number; longest: number; budget: number }): TwistPlan {
  const out = [...levels];
  const blocks = Math.floor(levels.length / TSUNAGI_BLOCK);
  const placed: TwistPlan["placed"] = [];
  const kept: number[] = [];
  const free: number[] = [];
  for (let block = 1; block <= blocks; block += 1) {
    if (keep.has(block * TSUNAGI_BLOCK - 1) || keep.has(block * TSUNAGI_BLOCK)) kept.push(block);
    else free.push(block);
  }
  const planned = lessons(free.length);
  const has = (layout: string, twist: Challenge) => challengesOf(layout).includes(twist);
  // Which free blocks already hold their lesson, and which need boards made.
  const needed = free.filter((block, at) => !(has(levels[block * TSUNAGI_BLOCK - 2]![0], planned[at]!.twist) && has(levels[block * TSUNAGI_BLOCK - 1]![0], planned[at]!.twist)));
  if (needed.length === 0) return { levels: out, placed, kept };
  const pool = pools(size, plan.tries, plan.longest, plan.budget);
  const used = new Set<string>(levels.map(([layout]) => symmetryKey(layout, size)));
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
  free.forEach((block, at) => {
    if (!needed.includes(block)) return;
    const lesson = planned[at]!;
    const teach = take(lesson.teach, lesson.teachAt);
    const test = take(lesson.test, lesson.testAt);
    // A lesson needs both its levels: where either cannot be made, the block keeps what it has.
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
