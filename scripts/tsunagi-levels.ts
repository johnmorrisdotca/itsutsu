/**
 * THE TSUNAGI LEVELS, MADE ON A DESK: `node scripts/tsunagi-levels.ts [size…] [--keep <size:level,…>] [--grow <size,…> [--migration <dir>]]`.
 *
 * For each size asked (all six when none is), fills grids with random lines
 * (`randomFilling`), keeps a layout only when the solver proves it has exactly
 * one answer, drops any that is the same board as one already kept under a
 * turn or a mirror, and writes the size's levels, easiest first, into
 * `src/lib/puzzles/tsunagi/levels/size<n>.data.ts`.
 *
 * Seeded, so the same run writes the same files: the data files are the
 * source the site plays, and this is how they were made, kept so they can be
 * made again. Nothing here runs on the site.
 *
 * EVERY BOARD ALREADY PLAYED IS KEPT. The levels in the size's file are read
 * first and all of them stay: somebody's solve, time or half-drawn board is
 * on each. New boards are added to them until the size has `WANTED`, in whole
 * blocks of `TSUNAGI_BLOCK` (16 blocks of 16, John: "16 levels of 16? Does
 * that equal 256?"), or as many whole blocks as the generator can make
 * distinct — 4×4 runs out at under two hundred. The new ones are taken evenly
 * along the pool sorted by solver effort, so they spread from easy to hard.
 *
 * EASY TO HARD. The whole set is then ordered by the measured difficulty
 * (`tsunagi/difficulty.ts`: corners, guessing, cells not forced, the longest
 * line), easiest first, so level 1 is the easiest board and each block of 16
 * harder than the one before; within a block the 15th and 16th are its two
 * hardest, the places a block's twist will take once twists exist.
 *
 * RENUMBERING. A level's number is its place, and places move when boards are
 * added or reordered. Kept runs, races and attempts are stored by number, so
 * every run that moves a board writes the move: `levels/renumbered.data.ts`
 * (old number to new, for a browser's own record of its solves) and, with
 * `--migration <dir>`, a migration that moves the stored rows with it. A
 * solve is kept by its board (`givens`), so it follows without being moved.
 *
 * A SIZE IS NEVER REORDERED UNLESS ASKED. A run keeps the order of the levels
 * it finds, so a board with play on it stays at its number; only `--grow` adds
 * boards (to whole blocks, up to `WANTED`) and reorders the size — only the
 * sizes it names, `--grow 10,11` — and a run that reorders a size with play on
 * it must ship with its migration. What a run may
 * still change is a block's 15th and 16th slot, given a twist where nobody has
 * played it (`tsunagi-twists.ts`, `--keep <size:level,…>` naming the slots
 * with play, read from production first), and the difficulty marks every level
 * shows (`levels/marks.data.ts`).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

import { candidate, symmetryKey, type LinkCandidate } from "../src/lib/puzzles/tsunagi/generate.ts";
import { difficultyScores, measureLevel, orderByDifficulty } from "../src/lib/puzzles/tsunagi/difficulty.ts";
import { withTwists } from "./tsunagi-twists.ts";
import { twistRole } from "../src/lib/puzzles/tsunagi/ladder.ts";
import { TSUNAGI_MARKS, TSUNAGI_ROLES } from "../src/lib/puzzles/tsunagi/levels/marks.data.ts";
import type { TwistRole } from "../src/lib/puzzles/tsunagi/ladder.types.ts";
import { seededRandom } from "../src/lib/puzzles/random.ts";
import { TSUNAGI_BLOCK } from "../src/lib/puzzles/tsunagi/levelBlocks.ts";

/** Levels a size aims for: sixteen blocks of sixteen. */
/**
 * Levels each size aims for: sixteen blocks of sixteen, and fewer at the big
 * sizes, whose boards take the solver longer to prove on every build and the
 * generator far longer to find (2026-09-26: about a thousand distinct 10×10
 * boards in four minutes, seventy 11×11, none at 15×15).
 */
const WANTED: Record<number, number> = { 4: 256, 5: 256, 6: 256, 7: 256, 8: 256, 9: 256, 10: 128, 11: 64 };

/** Per size: the longest a line may be drawn, how many grids to try, and the most solver positions a kept level may take. */
const PLAN: Record<number, { longest: number; tries: number; ceiling: number }> = {
  4: { longest: 16, tries: 400_000, ceiling: 1_000 },
  5: { longest: 15, tries: 40_000, ceiling: 5_000 },
  6: { longest: 18, tries: 40_000, ceiling: 10_000 },
  7: { longest: 21, tries: 60_000, ceiling: 20_000 },
  8: { longest: 24, tries: 80_000, ceiling: 30_000 },
  9: { longest: 27, tries: 120_000, ceiling: 40_000 },
  10: { longest: 30, tries: 400_000, ceiling: 60_000 },
  11: { longest: 33, tries: 2_000_000, ceiling: 80_000 },
};

/** Per size, for the twist boards: grids to try for each kind, the longest line, and the solver's budget. */
const PLAN_TWISTS: Record<number, { tries: number; longest: number; budget: number }> = {
  4: { tries: 20_000, longest: 12, budget: 1_000 },
  5: { tries: 8_000, longest: 15, budget: 5_000 },
  6: { tries: 8_000, longest: 18, budget: 10_000 },
  7: { tries: 8_000, longest: 21, budget: 20_000 },
  8: { tries: 12_000, longest: 24, budget: 30_000 },
  9: { tries: 12_000, longest: 27, budget: 40_000 },
  10: { tries: 6_000, longest: 30, budget: 60_000 },
  11: { tries: 30_000, longest: 33, budget: 80_000 },
};

/** The most pairs a level may have: as many colours as the stones come in (`TSUNAGI_COLOURS`). */
const MOST_PAIRS = 12;

type Level = readonly [string, string];

async function levelsNow(size: number): Promise<readonly Level[]> {
  // A size with no file yet has no levels: the first run to grow it writes one.
  if (!existsSync(`src/lib/puzzles/tsunagi/levels/size${size}.data.ts`)) return [];
  const file = (await import(`../src/lib/puzzles/tsunagi/levels/size${size}.data.ts`)) as Record<string, readonly Level[]>;
  return file[`TSUNAGI_${size}`]!;
}

/** The size's boards: every one it has now, and new ones to whole blocks of `TSUNAGI_BLOCK`, up to `WANTED`. */
function grown(size: number, now: readonly Level[]): Level[] {
  const plan = PLAN[size]!;
  const random = seededRandom(20260926 + size);
  const have = new Set(now.map(([layout]) => symmetryKey(layout, size)));
  const fresh = new Map<string, LinkCandidate>();
  for (let each = 0; each < plan.tries; each += 1) {
    const made = candidate(size, random, plan.longest, plan.ceiling);
    if (made === null || made.pairs > MOST_PAIRS || have.has(made.key) || fresh.has(made.key)) continue;
    fresh.set(made.key, made);
  }
  const pool = [...fresh.values()].sort((a, b) => a.branches - b.branches || a.nodes - b.nodes || a.turns - b.turns || (a.key < b.key ? -1 : 1));
  const target = Math.min(WANTED[size]!, Math.floor((now.length + pool.length) / TSUNAGI_BLOCK) * TSUNAGI_BLOCK);
  const need = Math.max(0, target - now.length);
  const picked: Level[] = [];
  for (let at = 0; at < need; at += 1) {
    const made = pool[need === 1 ? 0 : Math.round((at * (pool.length - 1)) / (need - 1))]!;
    picked.push([made.layout, made.answer]);
  }
  return [...now, ...picked];
}

function fileFor(size: number, levels: readonly Level[]): string {
  const lines = levels.map(([layout, answer]) => `  ["${layout}", "${answer}"],`);
  return [
    "/**",
    ` * TSUNAGI AT ${size}×${size}: ${levels.length} levels in blocks of 16, easiest first by the measured difficulty (\`difficulty.ts\`), each block's 15th and 16th its twist where one could be placed.`,
    " *",
    " * WRITTEN BY `node scripts/tsunagi-levels.ts`, NEVER BY HAND. Each line is",
    " * one level: its layout (a letter for each pair's two stones, `.` for an empty",
    " * cell) and its one answer (the letter of the line through every cell). Every",
    " * level is proved to have exactly one answer by `levels.test.ts`, no two",
    " * are the same board under a turn or a mirror, and `difficulty.test.ts` holds",
    " * the order to the measure.",
    " */",
    `export const TSUNAGI_${size}: readonly (readonly [string, string])[] = [`,
    ...lines,
    "];",
    "",
  ].join("\n");
}

/** A level's band, the third of its size it sits in, as `tsunagiBand` reads it once the size has `count` levels. */
function bandOf(level: number, count: number): "easy" | "medium" | "hard" {
  const third = (level - 1) / count;
  return third < 1 / 3 ? "easy" : third < 2 / 3 ? "medium" : "hard";
}

type Moved = { size: number; from: number; to: number; layout: string; band: string };

function renumberedFile(moves: Record<number, number[]>): string {
  return [
    "/**",
    " * WHERE EACH TSUNAGI LEVEL WENT when the levels were last renumbered: for each",
    " * size, the new number of every old level, old level 1 first. Written by",
    " * `node scripts/tsunagi-levels.ts` beside the migration that moves the stored",
    " * runs, races and attempts the same way; a browser reads it to move its own",
    " * record of solves and attempts (`tsunagiKept.ts`).",
    " *",
    " * 2026-09-26: a hundred a size ordered by solver effort became 256 (192 at",
    " * 4×4) ordered by the measured difficulty.",
    " */",
    `export const TSUNAGI_RENUMBERED_AT = "2026-09-26";`,
    "",
    "export const TSUNAGI_RENUMBERED: Readonly<Record<number, readonly number[]>> = {",
    ...Object.entries(moves).map(([size, to]) => `  ${size}: [${to.join(", ")}],`),
    "};",
    "",
  ].join("\n");
}

function migrationFor(moved: readonly Moved[], bands: readonly { size: number; layout: string; band: string }[]): string {
  const values = (rows: string[]) => rows.join(",\n");
  return [
    "-- Tsunagi's levels renumbered: 256 a size (192 at 4x4), easiest first by the",
    "-- measured difficulty. Written by `node scripts/tsunagi-levels.ts --migration`.",
    "-- Every stored row keeps the board it was played on: kept runs, races and",
    "-- attempts move to their board's new number, and every row's band (the third",
    "-- of the size its level sits in) is its board's new one. A solve is kept by",
    "-- its board (givens), so only its band moves.",
    'CREATE TEMP TABLE "tsunagi_renumber" ("size" INTEGER NOT NULL, "from" INTEGER NOT NULL, "to" INTEGER NOT NULL, "band" TEXT NOT NULL) ON COMMIT DROP;',
    'INSERT INTO "tsunagi_renumber" ("size", "from", "to", "band") VALUES',
    values(moved.map((move) => `(${move.size}, ${move.from}, ${move.to}, '${move.band}')`)) + ";",
    'CREATE TEMP TABLE "tsunagi_band" ("size" INTEGER NOT NULL, "layout" TEXT NOT NULL, "band" TEXT NOT NULL) ON COMMIT DROP;',
    'INSERT INTO "tsunagi_band" ("size", "layout", "band") VALUES',
    values(bands.map((row) => `(${row.size}, '${row.layout}', '${row.band}')`)) + ";",
    "",
    "-- Through negative numbers first, so no row lands on another's key on the way.",
    'UPDATE "PuzzleRun" AS r SET "seed" = -m."to", "level" = m."band" FROM "tsunagi_renumber" AS m WHERE r."kind" = \'tsunagi\' AND r."size" = m."size" AND r."seed" = m."from";',
    'UPDATE "PuzzleRun" SET "seed" = -"seed" WHERE "kind" = \'tsunagi\' AND "seed" < 0;',
    'UPDATE "PuzzleRace" AS r SET "seed" = m."to", "level" = m."band" FROM "tsunagi_renumber" AS m WHERE r."kind" = \'tsunagi\' AND r."size" = m."size" AND r."seed" = m."from";',
    'UPDATE "TsunagiAttempt" AS a SET "level" = -m."to" FROM "tsunagi_renumber" AS m WHERE a."size" = m."size" AND a."level" = m."from";',
    'UPDATE "TsunagiAttempt" SET "level" = -"level" WHERE "level" < 0;',
    'UPDATE "PuzzleSolve" AS s SET "level" = b."band" FROM "tsunagi_band" AS b WHERE s."kind" = \'tsunagi\' AND s."size" = b."size" AND s."givens" = b."layout";',
    "",
  ].join("\n");
}

/** A level's difficulty marks, 1 to 5, from its score among every level of its size. */
function marksOf(levels: readonly Level[], size: number): string {
  const scores = difficultyScores(
    levels.map(([layout, answer]) => measureLevel(layout, answer, size)!),
    size,
  );
  return scores.map((score) => String(Math.min(5, 1 + Math.floor(score / 20)))).join("");
}

function marksFile(marks: Record<number, string>, roles: Record<number, Record<number, TwistRole>>): string {
  return [
    "/**",
    " * EVERY TSUNAGI LEVEL'S DIFFICULTY, 1 TO 5: one digit a level, level 1 first,",
    " * from its measured score (`difficulty.ts`) among every level of its size —",
    " * the marks the row under a board shows. And each twist level's part in its",
    " * block's lesson (`twistRole`), so the board of levels and the row can say it",
    " * without loading a size's boards. Written by `node scripts/tsunagi-levels.ts`,",
    " * never by hand; `difficulty.test.ts` and `ladder.test.ts` hold both to the levels.",
    " */",
    'import type { TwistRole } from "../ladder.types.ts";',
    "",
    "export const TSUNAGI_MARKS: Readonly<Record<number, string>> = {",
    ...Object.entries(marks).map(([size, digits]) => `  ${size}: "${digits}",`),
    "};",
    "",
    "export const TSUNAGI_ROLES: Readonly<Record<number, Readonly<Record<number, TwistRole>>>> = {",
    ...Object.entries(roles).map(([size, bySize]) => `  ${size}: ${JSON.stringify(bySize)},`),
    "};",
    "",
  ].join("\n");
}

const args = process.argv.slice(2);
const migrationAt = args.includes("--migration") ? args[args.indexOf("--migration") + 1] : undefined;
// The slots with play on production, as `size:level`: never given a twist.
const keepList = args.includes("--keep") ? (args[args.indexOf("--keep") + 1] ?? "") : "";
const keep = new Map<number, Set<number>>();
for (const each of keepList.split(",").filter(Boolean)) {
  const [size, level] = each.split(":").map(Number) as [number, number];
  if (!keep.has(size)) keep.set(size, new Set());
  keep.get(size)!.add(level);
}
// The sizes a run may add boards to, named: `--grow 10,11`. Never all of them by default.
const growList = args.includes("--grow") ? (args[args.indexOf("--grow") + 1] ?? "") : "";
const growing = new Set(growList.split(",").filter(Boolean).map(Number));
const asked = args.filter((arg, at) => !["--keep", "--migration", "--grow"].includes(args[at - 1] ?? "")).map(Number).filter((size) => PLAN[size] !== undefined);
// A run over some sizes keeps the marks and roles of the rest as they were.
const marks: Record<number, string> = { ...TSUNAGI_MARKS };
const roles: Record<number, Record<number, TwistRole>> = { ...TSUNAGI_ROLES };
const moves: Record<number, number[]> = {};
const moved: Moved[] = [];
const bands: { size: number; layout: string; band: string }[] = [];
for (const size of asked.length > 0 ? asked : Object.keys(PLAN).map(Number)) {
  const started = performance.now();
  const now = await levelsNow(size);
  // Boards are added only when asked (`--grow`), and adding reorders the size, which needs a migration:
  // a rerun that grew on its own once reordered 149 4×4 boards with play on them.
  const all = growing.has(size) ? grown(size, now) : [...now];
  // Ordered only when boards were added; a full size keeps its order, every board at its number.
  const order = all.length > now.length ? orderByDifficulty(all, size) : all.map((_, at) => at);
  const ordered = order.map((at) => all[at]!);
  const twisted = withTwists(size, ordered, keep.get(size) ?? new Set(), PLAN_TWISTS[size]!);
  const levels = twisted.levels;
  writeFileSync(`src/lib/puzzles/tsunagi/levels/size${size}.data.ts`, fileFor(size, levels));
  marks[size] = marksOf(levels, size);
  const layouts = levels.map(([layout]) => layout);
  roles[size] = Object.fromEntries(layouts.flatMap((_, at) => {
    const role = twistRole(layouts, at + 1);
    return role === null ? [] : [[at + 1, role]];
  }));
  for (const each of twisted.placed) console.log(`  level ${each.level}: ${each.kind}`);
  if (twisted.kept.length > 0) console.log(`  blocks kept plain: ${twisted.kept.join(", ")}`);
  // Where each board that was already here went: its old number is its place in `now`, its new one its place in `order`.
  const to = now.map((_, from) => order.indexOf(from) + 1);
  moves[size] = to;
  to.forEach((level, from) => moved.push({ size, from: from + 1, to: level, layout: now[from]![0], band: bandOf(level, levels.length) }));
  levels.forEach(([layout], at) => bands.push({ size, layout, band: bandOf(at + 1, levels.length) }));
  const stayed = to.filter((level, from) => level === from + 1).length;
  console.log(`${size}×${size}: ${levels.length} levels (${levels.length - now.length} new), ${now.length - stayed} of ${now.length} old ones moved, ${Math.round((performance.now() - started) / 1000)} s`);
}
writeFileSync("src/lib/puzzles/tsunagi/levels/marks.data.ts", marksFile(marks, roles));
if (Object.values(moves).some((to) => to.some((level, from) => level !== from + 1))) {
  writeFileSync("src/lib/puzzles/tsunagi/levels/renumbered.data.ts", renumberedFile(moves));
  if (migrationAt !== undefined) {
    mkdirSync(migrationAt, { recursive: true });
    writeFileSync(`${migrationAt}/migration.sql`, migrationFor(moved, bands));
    console.log(`Migration written to ${migrationAt}/migration.sql`);
  }
} else {
  console.log("No level moved: nothing to renumber.");
}
