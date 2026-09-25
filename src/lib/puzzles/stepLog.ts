/**
 * THE STEPS OF A KEPT PUZZLE, written down so the scrubber has them when the
 * puzzle is picked up again. John, 2026-09-25: "the Black and White scrollbar
 * didn't work at all even though there were moves made" — a kept run carried
 * only the grid as it was left, so a puzzle continued from My games opened
 * with one step and nothing to scrub.
 *
 * Every step is a grid in its kind's progress code (one character a cell,
 * `puzzleProgress.ts`). The first is written whole; each after it as the
 * cells that changed, a cell's place in base 36 (two characters) and its new
 * character, the steps parted by "~", which no progress code uses. A long
 * game's log is a few hundred characters, not a grid per step.
 *
 * Only the newest `STEPS_KEPT` are written, so the log has a ceiling however
 * long the puzzle is played; the scrubber then starts at the oldest kept.
 */
export const STEPS_KEPT = 400;
const PARTED = "~";

export function encodeStepLog(codes: readonly string[]): string {
  const kept = codes.slice(-STEPS_KEPT);
  if (kept.length === 0) return "";
  const parts = [kept[0]!];
  for (let at = 1; at < kept.length; at += 1) {
    const before = kept[at - 1]!;
    const after = kept[at]!;
    let changed = "";
    for (let cell = 0; cell < after.length; cell += 1) {
      if (after[cell] !== before[cell]) changed += cell.toString(36).padStart(2, "0") + after[cell];
    }
    parts.push(changed);
  }
  return parts.join(PARTED);
}

/** The grids a log holds, each `cells` long, or null for a log that does not read as one. */
export function decodeStepLog(log: string, cells: number): string[] | null {
  if (log === "") return null;
  const [first, ...changes] = log.split(PARTED);
  if (first === undefined || first.length !== cells || changes.length >= STEPS_KEPT) return null;
  const codes = [first];
  for (const change of changes) {
    if (change.length % 3 !== 0) return null;
    const grid = [...codes.at(-1)!];
    for (let at = 0; at < change.length; at += 3) {
      const cell = parseInt(change.slice(at, at + 2), 36);
      if (!Number.isInteger(cell) || cell < 0 || cell >= cells) return null;
      grid[cell] = change[at + 2]!;
    }
    codes.push(grid.join(""));
  }
  return codes;
}

/**
 * The grids a kept run opens with, read with its kind's decoder, or null when
 * it kept no steps or they do not end on the grid it was kept with — then the
 * puzzle opens with the one step it has, as before steps were kept.
 */
export function openingSteps<T>(log: string | null | undefined, progress: string, size: number, decode: (code: string, size: number) => T | null): T[] | null {
  if (log === null || log === undefined) return null;
  const codes = decodeStepLog(log, progress.length);
  if (codes === null || codes.at(-1) !== progress) return null;
  const grids = codes.map((code) => decode(code, size));
  return grids.every((grid) => grid !== null) ? (grids as T[]) : null;
}
