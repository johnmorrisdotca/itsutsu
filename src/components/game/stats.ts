import type { Point } from "@/lib/gomoku/gomoku.types";
import type { GameStats, SeatStats } from "./game.types";

export function emptySeatStats(): SeatStats {
  return {
    moves: 0,
    thinkingMs: 0,
    slowestMoveMs: 0,
    blunders: 0,
    missedThreats: 0,
    hintsUsed: 0,
  };
}

/** `now` is passed in rather than read, so this stays pure. */
export function emptyStats(now = 0): GameStats {
  return {
    startedAt: now,
    bySeat: { one: emptySeatStats(), two: emptySeatStats() },
  };
}

/**
 * Whether a move ignored a threat that was on the board.
 *
 * `forcedPoints` are the intersections that answer the threat, so playing
 * anywhere else is a missed answer. This is deliberately narrow: it counts
 * only positions the analysis had already called forcing, not every move that
 * could have been better.
 */
export function missedThreat(forcedPoints: Point[], played: Point): boolean {
  if (forcedPoints.length === 0) return false;
  return !forcedPoints.some(
    (point) => point.row === played.row && point.col === played.col,
  );
}

/** Folds one completed move into a seat's running totals. */
export function recordMove(
  stats: GameStats,
  seat: keyof GameStats["bySeat"],
  change: { thinkingMs: number; missed: boolean; blunder: boolean },
): GameStats {
  const current = stats.bySeat[seat];
  return {
    ...stats,
    bySeat: {
      ...stats.bySeat,
      [seat]: {
        ...current,
        moves: current.moves + 1,
        thinkingMs: current.thinkingMs + change.thinkingMs,
        slowestMoveMs: Math.max(current.slowestMoveMs, change.thinkingMs),
        missedThreats: current.missedThreats + (change.missed ? 1 : 0),
        blunders: current.blunders + (change.blunder ? 1 : 0),
      },
    },
  };
}

/** Adds one to a seat's hint tally. */
export function recordHint(
  stats: GameStats,
  seat: keyof GameStats["bySeat"],
): GameStats {
  return {
    ...stats,
    bySeat: {
      ...stats.bySeat,
      [seat]: {
        ...stats.bySeat[seat],
        hintsUsed: stats.bySeat[seat].hintsUsed + 1,
      },
    },
  };
}
