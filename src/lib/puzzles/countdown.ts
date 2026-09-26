/**
 * A COUNTDOWN ON ANY PUZZLE, chosen at set-up: the Tortoise's five minutes,
 * the Fox's three, the Rabbit's one, or none, which is the default. The
 * ticket, 2026-09-26: "a countdown option on every puzzle — tortoise 5 min,
 * fox 3 min, rabbit 1 min … off by default. When time runs out the puzzle
 * ends unsolved and is kept in My games."
 *
 * The clock it counts against is the puzzle's own (`useSolve`): it starts
 * with the first entry, stops while paused (the grid is covered then, so
 * nothing is gained by it), and is the browser's word, as every solo time
 * here is. The address names a countdown by its animal (`countdown=fox`); a
 * kept run and a kept solve by its length in milliseconds (`countdownMs`),
 * which is what the server checks a time's-up against.
 */
export const COUNTDOWNS = {
  tortoise: { ms: 5 * 60_000, label: "Tortoise", kanji: "亀", minutes: 5 },
  fox: { ms: 3 * 60_000, label: "Fox", kanji: "狐", minutes: 3 },
  rabbit: { ms: 60_000, label: "Rabbit", kanji: "兎", minutes: 1 },
} as const;

export type CountdownKey = keyof typeof COUNTDOWNS;

/** Slowest first, as the set-up screen offers them after None. */
export const COUNTDOWN_LIST: readonly CountdownKey[] = ["tortoise", "fox", "rabbit"];

export function isCountdownKey(value: unknown): value is CountdownKey {
  return typeof value === "string" && Object.hasOwn(COUNTDOWNS, value);
}

/** The countdown of this length, or null for a length that is none of them (and for none). */
export function countdownOfMs(ms: number | null | undefined): CountdownKey | null {
  return COUNTDOWN_LIST.find((key) => COUNTDOWNS[key].ms === ms) ?? null;
}

/** How long is left, never below nought. */
export function timeLeft(countdownMs: number, elapsedMs: number): number {
  return Math.max(0, countdownMs - elapsedMs);
}

/**
 * How far past its countdown a time's-up may be sent and still be taken as
 * one: the browser checks once a tick, and a tab in the background ticks
 * seldom, so a little over is honest. Never under: a puzzle ended before its
 * time is not a puzzle whose time ran out.
 */
export const TIME_UP_SLACK_MS = 60_000;

/** Whether a time's-up handed in is one: the countdown is one of ours and the clock reached it. */
export function isTimeUp(countdownMs: number, elapsedMs: number): boolean {
  return countdownOfMs(countdownMs) !== null && elapsedMs >= countdownMs;
}

/** The line under the chips on the set-up screen. */
export function countdownBlurb(key: CountdownKey | null): string {
  if (key === null) return "No countdown: take as long as you like.";
  const { label, minutes } = COUNTDOWNS[key];
  return `The ${label}: ${minutes} ${minutes === 1 ? "minute" : "minutes"} from your first move. When it runs out the puzzle ends unsolved, and is kept in My games.`;
}

/**
 * Whether a kept solve ended because its countdown ran out: unsolved, played
 * against one, and kept at its full length. A word that ran out of guesses
 * under a countdown ended sooner than that, and says "Not found" as ever.
 */
export function ranOutOfTime(solve: { solved: boolean; countdownMs?: number | null; elapsedMs: number }): boolean {
  return !solve.solved && solve.countdownMs != null && solve.elapsedMs >= solve.countdownMs;
}

/** How an unsolved kept puzzle ended, in the words a list prints. */
export function unsolvedWords(solve: { solved: boolean; countdownMs?: number | null; elapsedMs: number }): string {
  return ranOutOfTime(solve) ? "Time's up" : "Not found";
}

/** The line on every puzzle's rules page, in the Play section (`puzzleRulesPage.ts`). */
export const COUNTDOWN_RULE =
  "A countdown, if you want one, is chosen at set-up: the Tortoise 亀 gives you five minutes, the Fox 狐 three and the Rabbit 兎 one, from your first move. Pausing stops it, and covers the grid. When it runs out the puzzle ends unsolved, as it stood, and is kept in My games marked Time's up. None is the default.";
