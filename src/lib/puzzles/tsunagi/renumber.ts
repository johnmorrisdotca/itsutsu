import { TSUNAGI_RENUMBERED } from "./levels/renumbered.data";

/**
 * A RECORD KEPT BY LEVEL NUMBER, MOVED TO THE NUMBERS THE LEVELS HAVE NOW.
 * Tsunagi's levels were renumbered on 2026-09-26 (`renumbered.data.ts`): the
 * same boards, more of them, easiest first. Anything that says "level 10" and
 * was written before then means the board that was level 10, so it is moved
 * to where that board is now — never left on the number, where it would be
 * somebody's time on a different board. A number the old order never had is
 * dropped: it names no board.
 *
 * The server's rows are moved by a migration; this is for what a browser kept
 * of its own (`tsunagiKept.ts`).
 */
export function renumberedRecord(size: number, old: Readonly<Record<number, number>>, moves: Readonly<Record<number, readonly number[]>> = TSUNAGI_RENUMBERED): Record<number, number> {
  const to = moves[size];
  const out: Record<number, number> = {};
  if (to === undefined) return out;
  for (const [level, value] of Object.entries(old)) {
    const now = to[Number(level) - 1];
    if (now !== undefined) out[now] = value;
  }
  return out;
}
