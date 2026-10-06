import { meikyuuLevelCount } from "./levelCounts";
import { MEIKYUU_SOLID_KINDS, MEIKYUU_SOLID_STEPS, meikyuuSolidSize } from "./sizes";

/**
 * HOW FAR A PLAYER HAS COME THROUGH A SIZE, which is what Meikyuu offers in place of locks. John, 2026-10-02: "are any
 * levels locked? I like the small levels being all playable I think but encouraging people to finish them all." So every
 * level of every size is open, and what encourages finishing is seeing how many are done: "12 of 256 solved" for each
 * size, and a mark and a line of cheer when a size is whole.
 *
 * Pure: the levels solved are handed in as the numbers a size has (`levels.ts` and the records say which maze is which
 * number; a solved maze that is no level any more is not one of them), the account's and this device's joined without
 * counting a level twice.
 */
export type SolvedLevels = Readonly<Record<number, readonly number[]>>;

/** One size's progress. */
export type SizeProgress = { size: number; solved: number; count: number; complete: boolean };

/** The levels solved at each size, the account's and the device's together: a level solved on both counts once, and a number that is no level of the size counts for nothing. */
export function solvedIn(size: number, ...sources: readonly (SolvedLevels | null | undefined)[]): number {
  const count = meikyuuLevelCount(size);
  const seen = new Set<number>();
  for (const source of sources) for (const level of source?.[size] ?? []) if (Number.isInteger(level) && level >= 1 && level <= count) seen.add(level);
  return seen.size;
}

/** The progress of each size asked about, in the order asked. */
export function progressOf(sizes: readonly number[], ...sources: readonly (SolvedLevels | null | undefined)[]): SizeProgress[] {
  return sizes.map((size) => {
    const count = meikyuuLevelCount(size);
    const solved = solvedIn(size, ...sources);
    return { size, solved, count, complete: count > 0 && solved >= count };
  });
}

/** Whether solving `level` now completes its size: every other level of it is already solved and this one is not. */
export function completesSize(size: number, level: number, ...sources: readonly (SolvedLevels | null | undefined)[]): boolean {
  const count = meikyuuLevelCount(size);
  if (count === 0) return false;
  const solvedNow = solvedIn(size, ...sources);
  const had = solvedIn(size, ...sources, { [size]: [level] });
  return had === count && solvedNow === count - 1;
}

/**
 * The progress of each SOLID, its three sizes together: a row for the cube, the sphere, the octahedron and the icosahedron, "12 of 192", on a front door that
 * would otherwise need twelve rows. The row's `size` is the solid's small size, which names the solid (`progressName`).
 */
export function solidProgressOf(...sources: readonly (SolvedLevels | null | undefined)[]): SizeProgress[] {
  return MEIKYUU_SOLID_KINDS.map((kind) => {
    const sizes = MEIKYUU_SOLID_STEPS.map((step) => meikyuuSolidSize(kind, step));
    const count = sizes.reduce((total, size) => total + meikyuuLevelCount(size), 0);
    const solved = sizes.reduce((total, size) => total + solvedIn(size, ...sources), 0);
    return { size: sizes[0]!, solved, count, complete: count > 0 && solved >= count };
  });
}
