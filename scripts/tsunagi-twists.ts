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
 * EXPLOSIONS are the fifth lesson and every fifth after it. They change no
 * cell, so their lesson is the board already in the slot with an explosion
 * added (`explosive`): a boom that goes off about once on a clean solve at the
 * 15th, and at the 16th a blast (a boom every two strokes where there are too
 * few pairs for a blast to be fair). The other lessons keep the places they
 * had before explosions came, so adding them moved no other lesson.
 *
 * HEXAGONS are the seventh lesson and every fifth after it (the twelfth), at
 * the odd sizes only, the ones a hexagon of hexagons fits (`hexCandidate`):
 * whole new boards, the easy end of the kind's pool to teach and further up
 * it to test.
 *
 * A STROKE LIMIT is the sixth lesson and the fourteenth: like explosions it
 * changes no cell, so it is the slot's own board with a limit added — the
 * fewest strokes the board can be solved in and three to spare at the 15th,
 * the fewest exactly at the 16th. SPARSE BOARDS (few, long lines, `sparse.ts`)
 * are the eighth and the sixteenth, at 5×5 to 9×9: a 4×4 has too few cells for
 * a sparse board with one answer, and 10×10 and 11×11 too few blocks to reach.
 *
 * NEVER A BOARD WITH PLAY ON IT. A slot is only given a twist when its board
 * has none: the slots named in `keep` (read from production before the run:
 * solves, kept runs, attempts and races) keep their plain board, and so does
 * the rest of that block, because a lesson needs both its levels. A block that
 * already holds its planned lesson keeps it, so running this again moves
 * nothing. Levels 1 to 14 of every block are never touched.
 */
import { orderByDifficulty } from "../src/lib/puzzles/tsunagi/difficulty.ts";
import { bridgeAndWallCandidate, bridgeCandidate, hexCandidate, wallCandidate, waypointCandidate, wrapCandidate, type TwistCandidate } from "../src/lib/puzzles/tsunagi/twists.ts";
import { symmetryKey } from "../src/lib/puzzles/tsunagi/generate.ts";
import { TSUNAGI_BLOCK } from "../src/lib/puzzles/tsunagi/levelBlocks.ts";
import { challengesOf, isTwist, type Challenge } from "../src/lib/puzzles/tsunagi/ladder.ts";
import { decodeLayout, stepBetween, wrappedStep } from "../src/lib/puzzles/tsunagi/code.ts";
import { sparseCandidate } from "../src/lib/puzzles/tsunagi/sparse.ts";
import { seededRandom } from "../src/lib/puzzles/random.ts";

type Level = readonly [string, string];

type Kind = "bridge" | "bridges" | "walls" | "wallsAndBlocked" | "bridgeAndWalls" | "waypoints" | "wrap" | "boom" | "blast" | "hexagon" | "sparse" | "strokes";

// A new kind goes on the end: each kind's stream is seeded by its place here, so the others keep making the boards they made.
const KINDS: readonly Kind[] = ["bridge", "bridges", "walls", "wallsAndBlocked", "bridgeAndWalls", "waypoints", "wrap", "hexagon", "sparse"];

/** How many times a kind's tries a sparse pool gets: few fillings join down to a sparse board with one answer. */
const SPARSE_TRIES = 5;

/** One kind's candidate, from its own random stream. */
function candidateOf(kind: Kind, size: number, random: () => number, longest: number, budget: number): TwistCandidate | null {
  if (kind === "bridge") return bridgeCandidate(size, random, longest, budget, 1);
  if (kind === "bridges") return bridgeCandidate(size, random, longest, budget, 2);
  if (kind === "walls") return wallCandidate(size, random, longest, budget, 0, 6);
  if (kind === "wallsAndBlocked") return wallCandidate(size, random, longest, budget, 2, 6);
  if (kind === "bridgeAndWalls") return bridgeAndWallCandidate(size, random, longest, budget, 1, 6);
  if (kind === "waypoints") return waypointCandidate(size, random, longest, budget, 4);
  if (kind === "hexagon") return hexCandidate(size, random, longest, budget);
  if (kind === "sparse") {
    const made = sparseCandidate(size, random, budget);
    return made === null ? null : { ...made, bridges: 0, walls: 0, blocked: 0 };
  }
  return wrapCandidate(size, random, longest, budget);
}

/**
 * Each kind's pool, easiest first by the measured difficulty among its own
 * kind. Every kind draws from a random stream of its own, so adding a kind
 * never changes the boards another kind makes.
 */
function pools(size: number, tries: number, longest: number, budget: number, wanted: ReadonlySet<Kind>): Record<Kind, TwistCandidate[]> {
  const out = {} as Record<Kind, TwistCandidate[]>;
  KINDS.forEach((kind, index) => {
    // Only the kinds a lesson still to be made can use: a big board's pool takes minutes a kind.
    if (!wanted.has(kind)) {
      out[kind] = [];
      return;
    }
    const random = seededRandom(20260927 + size * 100 + index);
    const found = new Map<string, TwistCandidate>();
    for (let each = 0; each < (kind === "sparse" ? tries * SPARSE_TRIES : tries); each += 1) {
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

/**
 * A board with an explosion added: at the 15th a boom every one stroke fewer than
 * it has pairs, so a clean solve meets it once; at the 16th a blast every half
 * its pairs (never under three, or a blast breaks lines faster than they are
 * drawn), or a boom every two strokes on a board of fewer than five pairs.
 */
export function explosive(layout: string, size: number, role: "teach" | "test"): { layout: string; kind: Kind } {
  const pairs = decodeLayout(layout, size)!.ends.length;
  if (role === "teach") return { layout: `${layout}|boom${Math.max(2, pairs - 1)}`, kind: "boom" };
  if (pairs < 5) return { layout: `${layout}|boom2`, kind: "boom" };
  return { layout: `${layout}|blast${Math.max(3, Math.ceil(pairs / 2))}`, kind: "blast" };
}

/** The kinds each twist is taught and tested with once it has had its own lesson: harder, and mixed. Explosions are made from the slot's own board instead. */
const LATER: Record<Exclude<Challenge, "explosions">, { teach: Kind[]; test: Kind[] }> = {
  bridges: { teach: ["bridge", "bridges"], test: ["bridgeAndWalls", "bridges", "bridge"] },
  walls: { teach: ["wallsAndBlocked", "walls"], test: ["bridgeAndWalls", "wallsAndBlocked"] },
  waypoints: { teach: ["waypoints"], test: ["waypoints"] },
  wrap: { teach: ["wrap"], test: ["wrap"] },
  hexagon: { teach: ["hexagon"], test: ["hexagon"] },
  sparse: { teach: ["sparse"], test: ["sparse"] },
  strokes: { teach: [], test: [] },
};

/**
 * A board with a stroke limit added: the fewest strokes it can be solved in —
 * one a line, and one more for every time a line crosses the join of a board
 * that wraps, where it is let go and taken up on the far side — with three to
 * spare at the 15th and none at the 16th.
 */
export function limited(layout: string, answer: string, size: number, role: "teach" | "test"): { layout: string; kind: Kind } {
  const decoded = decodeLayout(layout, size)!;
  let least = decoded.ends.length;
  if (decoded.wrap) {
    for (let at = 0; at < size * size; at += 1) {
      for (const by of [1, size]) {
        const next = wrappedStep(size, at, by);
        if (stepBetween(size, at, next, false) === 0 && /[A-P]/.test(answer[at]!) && answer[at] === answer[next]) least += 1;
      }
    }
  }
  return { layout: `${layout}|strokes${role === "teach" ? least + 3 : least}`, kind: "strokes" };
}

/** The lessons, in the order the ladder meets them: bridges, walls, waypoints, wrap, explosions, then each again, climbing, explosions every fifth. */
function lessons(count: number, size: number): Lesson[] {
  const out: Lesson[] = [
    { twist: "bridges", teach: ["bridge"], test: ["bridges", "bridge", "bridgeAndWalls"], teachAt: 0, testAt: 0.5 },
    { twist: "walls", teach: ["walls", "wallsAndBlocked"], test: ["wallsAndBlocked", "walls"], teachAt: 0, testAt: 0.5 },
    { twist: "waypoints", teach: ["waypoints"], test: ["waypoints"], teachAt: 0, testAt: 0.5 },
    { twist: "wrap", teach: ["wrap"], test: ["wrap"], teachAt: 0, testAt: 0.5 },
  ];
  const cycle = ["bridges", "walls", "waypoints", "wrap"] as const;
  for (let each = out.length; each < count; each += 1) {
    if ((each - 4) % 5 === 0) {
      out.push({ twist: "explosions", teach: [], test: [], teachAt: 0, testAt: 0 });
      continue;
    }
    if (each === 5 || each === 13) {
      out.push({ twist: "strokes", teach: [], test: [], teachAt: 0, testAt: 0 });
      continue;
    }
    if ((each === 7 || each === 15) && size >= 5 && size <= 9) {
      const climb = each === 7 ? 0 : 1;
      out.push({ twist: "sparse", ...LATER.sparse, teachAt: 0.4 * climb, testAt: 0.5 + 0.5 * climb });
      continue;
    }
    if (size % 2 === 1 && each >= 6 && (each - 6) % 5 === 0) {
      const climb = count <= 7 ? 0 : (each - 6) / (count - 7);
      out.push({ twist: "hexagon", ...LATER.hexagon, teachAt: 0.6 * climb, testAt: 0.5 + 0.5 * climb });
      continue;
    }
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
 *
 * A played block that already holds a lesson keeps its place in the lesson
 * order, untouched: play arriving on a shipped lesson must not deal every later
 * lesson of the size one block along. A played block left plain has no place.
 */
export function withTwists(size: number, levels: readonly Level[], keep: ReadonlySet<number>, plan: { tries: number; longest: number; budget: number }): TwistPlan {
  const out = [...levels];
  const blocks = Math.floor(levels.length / TSUNAGI_BLOCK);
  const placed: TwistPlan["placed"] = [];
  const kept: number[] = [];
  // The blocks in the lesson order: every free block, and every played one that already holds a lesson (`frozen`).
  const free: number[] = [];
  const frozen = new Set<number>();
  for (let block = 1; block <= blocks; block += 1) {
    if (!keep.has(block * TSUNAGI_BLOCK - 1) && !keep.has(block * TSUNAGI_BLOCK)) {
      free.push(block);
      continue;
    }
    if (isTwist(levels[block * TSUNAGI_BLOCK - 2]![0]) && isTwist(levels[block * TSUNAGI_BLOCK - 1]![0])) {
      free.push(block);
      frozen.add(block);
    } else kept.push(block);
  }
  const planned = lessons(free.length, size);
  // What each lesson may use: its own twist and every twist taught before it, never one still to come.
  const allowed = planned.map((_, at) => new Set(planned.slice(0, at + 1).map((lesson) => lesson.twist)));
  const fits = (layout: string, at: number) => {
    const on = challengesOf(layout);
    return on.includes(planned[at]!.twist) && on.every((twist) => allowed[at]!.has(twist));
  };
  // Which free blocks already hold their lesson, and which need boards made.
  const needed = free.filter((block, at) => !frozen.has(block) && !(fits(levels[block * TSUNAGI_BLOCK - 2]![0], at) && fits(levels[block * TSUNAGI_BLOCK - 1]![0], at)));
  if (needed.length === 0) return { levels: out, placed, kept };
  // Explosions change no cell: their lesson is the slot's own board with one added. The rest need boards made.
  const madeNeeded = needed.some((block) => !["explosions", "strokes"].includes(planned[free.indexOf(block)]!.twist));
  const wanted = new Set(needed.flatMap((block) => { const lesson = planned[free.indexOf(block)]!; return [...lesson.teach, ...lesson.test]; }));
  const pool = madeNeeded ? pools(size, plan.tries, plan.longest, plan.budget, wanted) : ({} as Record<Kind, TwistCandidate[]>);
  const used = new Set<string>(levels.map(([layout]) => symmetryKey(layout, size)));
  const take = (kinds: Kind[], at: number, lesson: number): { made: TwistCandidate; kind: Kind } | null => {
    for (const kind of kinds) {
      const list = pool[kind].filter((made) => !used.has(made.key) && fits(made.layout, lesson));
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
    if (lesson.twist === "explosions") {
      for (const [slot, role] of [
        [block * TSUNAGI_BLOCK - 1, "teach"],
        [block * TSUNAGI_BLOCK, "test"],
      ] as const) {
        const [layout, answer] = out[slot - 1]!;
        const made = explosive(layout, size, role);
        placed.push({ level: slot, kind: made.kind, replaced: layout });
        out[slot - 1] = [made.layout, answer];
      }
      return;
    }
    if (lesson.twist === "strokes") {
      for (const [slot, role] of [
        [block * TSUNAGI_BLOCK - 1, "teach"],
        [block * TSUNAGI_BLOCK, "test"],
      ] as const) {
        const [layout, answer] = out[slot - 1]!;
        const made = limited(layout, answer, size, role);
        placed.push({ level: slot, kind: made.kind, replaced: layout });
        out[slot - 1] = [made.layout, answer];
      }
      return;
    }
    const teach = take(lesson.teach, lesson.teachAt, at);
    const test = take(lesson.test, lesson.testAt, at);
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
