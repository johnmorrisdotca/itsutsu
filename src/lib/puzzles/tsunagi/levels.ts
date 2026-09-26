import type { Puzzle, PuzzleLevel } from "../puzzles.types";

/**
 * TSUNAGI'S LEVELS: fixed, the same for everybody, made once on a desk
 * (`scripts/tsunagi-levels.ts`) and read here, a size at a time.
 *
 * A level is not made from a seed as every other puzzle is: level 12 at 7×7 is
 * one board for every player on every day, so a time on it can be compared
 * with anybody's. The address still says `seed`, because that is where every
 * puzzle's address, kept run and race carry which puzzle it is; for Tsunagi
 * the seed IS the level's number, 1 up to the size's count.
 *
 * Each size is its own module, fetched only when a board of that size opens
 * (as the kana Gomoji's word lists are), so a phone playing 5×5 never carries
 * the other five sizes.
 */
export const TSUNAGI_SIZES = [4, 5, 6, 7, 8, 9] as const;

/** How many levels each size has: read without loading the size, for the board of levels. `levels.test.ts` holds it to the files. */
export const TSUNAGI_LEVEL_COUNTS: Record<number, number> = { 4: 100, 5: 100, 6: 100, 7: 100, 8: 100, 9: 100 };

/** Levels open a row of ten at a time: all of one row solved opens the next. */
export const TSUNAGI_ROW = 10;

type LevelRow = readonly [string, string];

const loaded = new Map<number, readonly LevelRow[]>();

async function importSize(size: number): Promise<readonly LevelRow[]> {
  // Named one by one, so the bundler splits each size into its own chunk.
  if (size === 4) return (await import("./levels/size4.data")).TSUNAGI_4;
  if (size === 5) return (await import("./levels/size5.data")).TSUNAGI_5;
  if (size === 6) return (await import("./levels/size6.data")).TSUNAGI_6;
  if (size === 7) return (await import("./levels/size7.data")).TSUNAGI_7;
  if (size === 8) return (await import("./levels/size8.data")).TSUNAGI_8;
  if (size === 9) return (await import("./levels/size9.data")).TSUNAGI_9;
  throw new Error(`No Tsunagi at ${size}×${size}.`);
}

export async function loadTsunagiLevels(size: number): Promise<readonly LevelRow[]> {
  const already = loaded.get(size);
  if (already !== undefined) return already;
  const levels = await importSize(size);
  loaded.set(size, levels);
  return levels;
}

export async function loadEveryTsunagiLevel(): Promise<void> {
  await Promise.all(TSUNAGI_SIZES.map((size) => loadTsunagiLevels(size)));
}

/** A size already loaded, or a refusal: nothing answers for a list it does not have. */
export function tsunagiLevelsOf(size: number): readonly LevelRow[] {
  const levels = loaded.get(size);
  if (levels === undefined) throw new Error(`The ${size}×${size} Tsunagi levels have not been loaded (loadTsunagiLevels).`);
  return levels;
}

/** Whether a number is a level this size has. */
export function isTsunagiLevel(size: number, level: number): boolean {
  const count = TSUNAGI_LEVEL_COUNTS[size];
  return count !== undefined && Number.isInteger(level) && level >= 1 && level <= count;
}

/**
 * Which third of a size a level sits in, as the easy, medium and hard every
 * puzzle is filed under: the lists of solves, the fastest times and the feed
 * all speak in those words, and a level's band is what they say about it.
 */
export function tsunagiBand(size: number, level: number): PuzzleLevel {
  const count = TSUNAGI_LEVEL_COUNTS[size] ?? 100;
  const third = (level - 1) / count;
  return third < 1 / 3 ? "easy" : third < 2 / 3 ? "medium" : "hard";
}

/** Level `level` of a loaded size, as a puzzle; the level number travels as its seed. */
export function tsunagiPuzzle(size: number, level: number): Puzzle {
  const levels = tsunagiLevelsOf(size);
  // An address naming no level is read as the first, never as an error in render.
  const number = isTsunagiLevel(size, level) ? level : 1;
  const [givens, solution] = levels[number - 1]!;
  return { kind: "tsunagi", size, level: tsunagiBand(size, number), seed: number, givens, solution };
}

/** The level a layout is, at a loaded size, or null for a layout no level has. */
export function tsunagiLevelOf(size: number, givens: string): number | null {
  const at = tsunagiLevelsOf(size).findIndex(([layout]) => layout === givens);
  return at === -1 ? null : at + 1;
}

/**
 * The levels that are open, given the ones solved: the first row of ten
 * always, and each row after it once every level of the row before is solved.
 * John, 2026-09-26: "you have to finish 10 before you open up the next 10".
 */
export function openTsunagiLevels(size: number, solved: ReadonlySet<number>): number {
  const count = TSUNAGI_LEVEL_COUNTS[size] ?? 0;
  let open = Math.min(TSUNAGI_ROW, count);
  while (open < count) {
    let rowDone = true;
    for (let level = open - TSUNAGI_ROW + 1; level <= open; level += 1) if (!solved.has(level)) rowDone = false;
    if (!rowDone) break;
    open = Math.min(open + TSUNAGI_ROW, count);
  }
  return open;
}

/** The level to open on: the first open one not yet solved, or the last open one when every open level is solved. */
export function nextTsunagiLevel(size: number, solved: ReadonlySet<number>): number {
  const open = openTsunagiLevels(size, solved);
  for (let level = 1; level <= open; level += 1) if (!solved.has(level)) return level;
  return open;
}
