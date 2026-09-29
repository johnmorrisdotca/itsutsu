import { PUZZLE_CLOCK_DISPLAY, PUZZLE_CLOCK_LIST, offersClock } from "./puzzles.constants";
import type { PuzzleClock, PuzzleKind } from "./puzzles.types";

/**
 * A PUZZLE'S COUNTDOWN, worked out from the time taken so far.
 *
 * The countdown is not a second clock. It is the one clock every solve already
 * keeps (`useSolve`: started on the first entry, stopped by a pause, carried
 * in when a kept run is opened again), read the other way round: what is left
 * is the allowance less the time taken. So a pause stops it exactly as it
 * stops the clock, and a run opened again from My games opens with what it
 * had left. Pure, so the solve screen and its tests read one definition.
 */

/** A clock this site offers, and no other word: what an address or a request may name. */
export function isPuzzleClock(value: unknown): value is PuzzleClock {
  return PUZZLE_CLOCK_LIST.includes(value as PuzzleClock);
}

/** The clock a puzzle is played on: none for a puzzle that offers none, whatever was asked. */
export function clockFor(kind: PuzzleKind, asked: unknown): PuzzleClock {
  return offersClock(kind) && isPuzzleClock(asked) ? asked : "none";
}

/** The time a clock allows, or null for none: nothing runs out. */
export function clockLimitMs(clock: PuzzleClock): number | null {
  return PUZZLE_CLOCK_DISPLAY[clock].ms;
}

/** The time left, never below nought; null where there is no countdown. */
export function timeLeftMs(clock: PuzzleClock, elapsedMs: number): number | null {
  const limit = clockLimitMs(clock);
  return limit === null ? null : Math.max(0, limit - elapsedMs);
}

/** Whether the time taken has used the whole allowance. Never, with no clock. */
export function isOutOfTime(clock: PuzzleClock, elapsedMs: number): boolean {
  const limit = clockLimitMs(clock);
  return limit !== null && elapsedMs >= limit;
}

/**
 * The time left as a countdown shows it, in whole seconds rounded UP: it reads
 * 1:00 until a whole second has gone and 0:00 only when nothing is left, as a
 * kitchen timer does. Rounded down, it would read 0:59 the moment it started.
 */
export function countdownSeconds(leftMs: number): number {
  return Math.ceil(Math.max(0, leftMs) / 1000);
}

/** The last seconds, drawn urgent (and said so, not only coloured): ten of them. */
export const COUNTDOWN_URGENT_MS = 10_000;

export function isUrgent(leftMs: number | null): boolean {
  return leftMs !== null && leftMs > 0 && leftMs <= COUNTDOWN_URGENT_MS;
}

/**
 * WHAT A SCREEN READER IS TOLD, AND WHEN: the minute marks, and the last ten
 * seconds — never every second, which would be a voice counting over the
 * puzzle. The words change only at a mark ("4 minutes left" from the moment the
 * clock reads 4:00 until it reads 3:00), so a polite live region holding them
 * speaks once a minute. The full allowance says nothing: the set-up said it.
 */
export function countdownSaying(clock: PuzzleClock, leftMs: number | null): string {
  const limit = clockLimitMs(clock);
  if (limit === null || leftMs === null) return "";
  if (leftMs <= 0) return "Time is up.";
  if (leftMs <= COUNTDOWN_URGENT_MS) return "Ten seconds left.";
  const minutes = Math.ceil(leftMs / 60_000);
  if (minutes * 60_000 >= limit) return "";
  return minutes === 1 ? "One minute left." : `${minutes} minutes left.`;
}

/** A clock as a line of a list says it, "rabbit"; empty for none, which a list does not mention. */
export function clockWord(clock: string): string {
  return isPuzzleClock(clock) && clock !== "none" ? PUZZLE_CLOCK_DISPLAY[clock].label.toLowerCase() : "";
}
