import { distanceHome } from "@/lib/gomoku/rules/noProgress";
import type { GameState, Point } from "@/lib/gomoku/gomoku.types";

import { STALL_MARGIN, STALL_ROUND_TO } from "./stallMeasure.constants";
import type { CapRecommendation, LongestStall, MeasuredGame, RaceLedger } from "./stallMeasure.types";

/**
 * Measuring the racing no-progress rule over games that were really played.
 *
 * The rule (`racingStalled` in rules/noProgress.ts) calls a race off when, over
 * the last `plies` moves, neither side stands any nearer home than it did at the
 * start of them. It is a WINDOW, not a count since some event, so "how long did
 * this game go without progress" has no single running number to read — and it
 * is not even monotonic: a window of 300 can show progress where a window of 400
 * ending on the same ply does not. So nothing here assumes a shorter cap is the
 * safer one; every cap is checked against every game.
 *
 * The arithmetic is the rule's own: a race has no captures, so how much nearer a
 * side stands than it did a window ago is the sum of how far each of its steps in
 * that window went. Summed once per game as running totals, any window is two
 * subtractions.
 *
 * Pure, so it is unit tested against the rule itself rather than trusted.
 */

const PROBE: Point = { row: 0, col: 0 };

/**
 * Each colour's running change in distance home, ply by ply, or null for a board
 * whose camps the rule cannot read.
 *
 * NULL, NOT A LEDGER OF ZEROS — the same answer `distanceHome` gives, for the
 * same reason. A ledger of zeros would read as a game in which nobody ever got
 * anywhere, and every cap would appear to fire on it.
 */
export function raceLedger(state: GameState): RaceLedger | null {
  const { size } = state.settings;
  if (distanceHome(size, "black", PROBE) === null || distanceHome(size, "white", PROBE) === null) return null;

  const black = [0];
  const white = [0];
  const unsteps = [0];
  for (const move of state.moves) {
    let b = black[black.length - 1];
    let w = white[white.length - 1];
    let u = unsteps[unsteps.length - 1];
    if (move.from === undefined) {
      u += 1;
    } else {
      // Negative is nearer: the step ended closer to the camp than it started.
      const gained = (distanceHome(size, move.stone, move) as number) - (distanceHome(size, move.stone, move.from) as number);
      if (move.stone === "black") b += gained;
      else w += gained;
    }
    black.push(b);
    white.push(w);
    unsteps.push(u);
  }
  return { black, white, unsteps };
}

/** Whether the rule with this window would have drawn the game on the ply that made it `end` moves long. */
export function firesAt(ledger: RaceLedger, window: number, end: number): boolean {
  if (window < 1 || end < window || end >= ledger.black.length) return false;
  const start = end - window;
  return (
    ledger.unsteps[end] === ledger.unsteps[start] &&
    ledger.black[end] - ledger.black[start] >= 0 &&
    ledger.white[end] - ledger.white[start] >= 0
  );
}

/** The move count at which a cap of `window` would first have drawn this game, or null if it never would. */
export function firstFiring(ledger: RaceLedger, window: number): number | null {
  for (let end = window; end < ledger.black.length; end += 1) {
    if (firesAt(ledger, window, end)) return end;
  }
  return null;
}

/**
 * The longest window over which the rule would have fired anywhere in this game,
 * or null when no window of any length would have.
 *
 * Longest first, so the first length that fires is the answer. Quadratic in the
 * game's length, which is fine for a report over a few thousand plies and would
 * not be fine in the engine — this is never asked there.
 */
export function longestStall(ledger: RaceLedger): LongestStall | null {
  for (let window = ledger.black.length - 1; window >= 1; window -= 1) {
    const end = firstFiring(ledger, window);
    if (end !== null) return { plies: window, endsAt: end };
  }
  return null;
}

/** The nearest-rank quantile of an ascending list, or null for an empty one. */
export function nearestRank(sorted: readonly number[], q: number): number | null {
  if (sorted.length === 0) return null;
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil(q * sorted.length)));
  return sorted[rank - 1];
}

/**
 * What the won games say about the cap in force.
 *
 * Only WON games calibrate it. A game that reached the runner's ceiling is the
 * kind of game the cap exists to end, so it cannot also be evidence that the cap
 * is too tight; the report lists those separately.
 */
export function recommendCap(currentCap: number, won: readonly MeasuredGame[], margin: number = STALL_MARGIN): CapRecommendation {
  const base = { currentCap, wonGames: won.length, margin };
  if (won.length === 0) {
    return {
      ...base,
      verdict: "unmeasured",
      longest: null,
      wonGamesEnded: 0,
      suggested: null,
      why: "No game was won, so there is nothing to calibrate the cap on. Play more games, or stronger pairings.",
    };
  }

  const longest = Math.max(...won.map((game) => game.longest));
  const wonGamesEnded = won.filter((game) => game.endedByCurrentCap).length;
  const suggested = Math.max(STALL_ROUND_TO, Math.ceil((longest * margin) / STALL_ROUND_TO) * STALL_ROUND_TO);

  if (wonGamesEnded > 0) {
    return {
      ...base,
      verdict: "raise",
      longest,
      wonGamesEnded,
      suggested,
      why:
        `${wonGamesEnded} of ${won.length} won games would have been called off by the cap of ${currentCap} before they were won. ` +
        `The longest stall in a won game was ${longest} plies; ${margin}× that is ${suggested}.`,
    };
  }

  if (longest === 0 || currentCap >= longest * margin) {
    return {
      ...base,
      verdict: "keep",
      longest,
      wonGamesEnded,
      suggested: null,
      why:
        longest === 0
          ? `No won game went a single window without one side getting nearer home, so ${currentCap} ends none of them.`
          : `No won game would have been called off. The longest stall in a won game was ${longest} plies, and ${currentCap} is ` +
            `${(currentCap / longest).toFixed(1)}× that, at or above the ${margin}× margin the other race games carry.`,
    };
  }

  return {
    ...base,
    verdict: "thin",
    longest,
    wonGamesEnded,
    suggested,
    why:
      `No won game would have been called off, but the longest stall in a won game was ${longest} plies and ${currentCap} is only ` +
      `${(currentCap / longest).toFixed(1)}× that, under the ${margin}× margin the other race games carry; ${suggested} would carry it.`,
  };
}
