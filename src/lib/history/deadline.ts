import { MOVE_TIME_OPTIONS } from "./gameSettingsSchema";

/**
 * Per-move deadlines for shared games. The server owns the clock: it stamps
 * each move and decides whether a claim is due; the client only reads the
 * same numbers back to show a "must move by".
 */

/** When the colour to move must have moved by, or null without a clock. */
export function deadlineFor(game: {
  moveTimeMs: number | null;
  lastMoveAt: Date | string | null;
}): Date | null {
  if (game.moveTimeMs === null || game.lastMoveAt === null) return null;
  const since = typeof game.lastMoveAt === "string" ? new Date(game.lastMoveAt) : game.lastMoveAt;
  return new Date(since.getTime() + game.moveTimeMs);
}

/** Whether the deadline has passed at `now`. */
export function isOverdue(deadline: Date | null, now = new Date()): boolean {
  return deadline !== null && now.getTime() >= deadline.getTime();
}

/** A per-move limit in words: "5 minutes", "1 hour", "3 days". Null is "no clock". */
export function describeMoveTime(moveTimeMs: number | null): string {
  if (moveTimeMs === null) return "No clock";
  const minutes = Math.round(moveTimeMs / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} a move`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} a move`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} a move`;
}

/** Time left in words, for a countdown: "2h 05m", "45s", or "overdue". */
export function describeRemaining(deadline: Date, now = new Date()): string {
  const left = deadline.getTime() - now.getTime();
  if (left <= 0) return "overdue";
  const seconds = Math.floor(left / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export { MOVE_TIME_OPTIONS };
