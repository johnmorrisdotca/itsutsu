import { isBotId } from "@/lib/bots/bots";
import { speaker, type Speaker } from "@/lib/i18n/i18n";
import { MOVE_TIME_OPTIONS } from "./moveTime.constants";

/**
 * Per-move deadlines for shared games. The server owns the clock: it stamps
 * each move and decides whether a claim is due; the client only reads the
 * same numbers back to show a "must move by".
 */

/** When the colour to move must have moved by, or null without a clock. */
export function deadlineFor(game: {
  moveTimeMs: number | null;
  lastMoveAt: Date | string | null;
  deadlineAt?: Date | string | null;
  /** The seat still posted for anyone to take, or null once somebody has sat down. */
  openSeat?: string | null;
  /** When this game was proposed to somebody, while they have yet to answer. */
  offeredAt?: Date | string | null;
  /** Who holds each seat, so a computer's turn can be told from a person's. */
  blackMemberId?: string | null;
  whiteMemberId?: string | null;
  /** The colour to move, where the caller knows it. See the computer rule below. */
  toPlay?: "black" | "white" | null;
}): Date | null {
  if (game.moveTimeMs === null) return null;
  /*
   * A computer is never late.
   *
   * It used to be enough to say WHY in one line — it answers inside the request
   * that provoked it, so a clock against its seat could only ever be a bug. That
   * reason is going away: the same chooser now runs in the player's own browser
   * (`botWorker.ts`), where a move may take seconds and the person may close the
   * tab in the middle of one. The move then arrives late, or on the next visit,
   * or not until some later request asks the server to play it.
   *
   * So this rule matters MORE than it did, not less, and it is not a shortcut
   * that a faster path made unnecessary. Without it, moving the thinking off the
   * server would quietly introduce a way for a computer to LOSE ON TIME because
   * somebody shut their laptop — a program forfeiting a game it was winning, for
   * something its opponent did to their own browser. Nobody would report that as
   * a clock bug; it would read as the computer resigning at random.
   *
   * The check is on who HOLDS the seat and never on how fast anything is, which
   * is why it keeps working now that the timing has changed underneath it.
   *
   * Only while it is the computer's turn, though — not for the whole game, the
   * way a posted seat is. The person on the other side plays under the clock
   * they agreed to, and a game against the computer with no clock at all is
   * not what anybody asked for.
   *
   * Here rather than in the timeout route, and here rather than in the board:
   * this is the one function both of them go through, and a rule stated twice
   * is a rule that ends up disagreeing with itself — the board saying
   * "overdue" while the claim quietly refuses.
   */
  if (game.toPlay !== undefined && game.toPlay !== null) {
    const mover = game.toPlay === "black" ? game.blackMemberId : game.whiteMemberId;
    if (isBotId(mover)) return null;
  }
  /*
   * A seat nobody is sitting in cannot be late. While a game is still posted
   * for somebody to take, there is no opponent to be waiting on and no clock
   * running against them — the board would otherwise say "White must move by"
   * of a white who does not exist yet, and offer to claim a turn from them.
   */
  if (game.openSeat !== undefined && game.openSeat !== null) return null;
  /*
   * AND THE SAME IS TRUE OF A GAME NOBODY HAS AGREED TO PLAY. An offer waits
   * on an answer, not on a move: a clock running against it would count down
   * somebody's first period while they had yet to decide whether to sit down
   * at all, and the board would offer to claim a turn from a player who has
   * never been in this game. `acceptOffer` stamps the first deadline at the
   * moment there is somebody to play against.
   *
   * Beside the posted-seat rule rather than in the timeout route, for the
   * reason stated above it: this is the one function the board and the claim
   * both go through, and a rule stated twice is a rule that ends up
   * disagreeing with itself — the board saying "overdue" while the claim
   * quietly refuses.
   */
  if (game.offeredAt !== undefined && game.offeredAt !== null) return null;
  if (game.deadlineAt !== undefined && game.deadlineAt !== null) {
    return typeof game.deadlineAt === "string" ? new Date(game.deadlineAt) : game.deadlineAt;
  }
  if (game.lastMoveAt === null) return null;
  const since = typeof game.lastMoveAt === "string" ? new Date(game.lastMoveAt) : game.lastMoveAt;
  return new Date(since.getTime() + game.moveTimeMs);
}

export type ClockMode = "move" | "game";
export const CLOCK_MODES: readonly ClockMode[] = ["move", "game"];

/** The clock in words, for either mode. */
export function describeClock(mode: string, moveTimeMs: number | null, say: Speaker = speaker("en")): string {
  if (moveTimeMs === null) return say.say("played.noClock");
  if (mode === "game") return say.say("played.perGame", { time: durationWords(moveTimeMs, say) });
  return describeMoveTime(moveTimeMs, say);
}

/**
 * Courtesy time, when one side gives the other more: a whole extra period
 * under the per-move clock, a tenth of the budget (five minutes at least)
 * under the whole-game clock.
 */
export function courtesyMs(mode: string, moveTimeMs: number): number {
  if (mode === "game") return Math.max(5 * 60_000, Math.round(moveTimeMs / 10));
  return moveTimeMs;
}

/** The deadline for the colour to move, from the clock's shape and what that colour has left. */
export function nextDeadline(
  game: { clockMode: string; moveTimeMs: number | null; blackTimeMs: number | null; whiteTimeMs: number | null },
  toPlay: "black" | "white",
  now: Date,
): Date | null {
  if (game.moveTimeMs === null) return null;
  if (game.clockMode === "game") {
    const left = toPlay === "black" ? game.blackTimeMs : game.whiteTimeMs;
    return new Date(now.getTime() + Math.max(0, left ?? game.moveTimeMs));
  }
  return new Date(now.getTime() + game.moveTimeMs);
}

/** Whether the deadline has passed at `now`. */
export function isOverdue(deadline: Date | null, now = new Date()): boolean {
  return deadline !== null && now.getTime() >= deadline.getTime();
}

/** A per-move limit in words: "5 minutes", "1 hour", "3 days". Null is "no clock". */
export function describeMoveTime(moveTimeMs: number | null, say: Speaker = speaker("en")): string {
  if (moveTimeMs === null) return say.say("played.noClock");
  return say.say("played.perMove", { time: durationWords(moveTimeMs, say) });
}

/** "5 minutes", "1 hour", "3 days" in the reader's language, in the largest unit that reads as a whole number. */
function durationWords(ms: number, say: Speaker): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return say.count("played.minutes", minutes);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return say.count("played.hours", hours);
  return say.count("played.days", Math.round(hours / 24));
}

/** Time left in words, for a countdown: "2h 05m", "45s", or "overdue". */
export function describeRemaining(deadline: Date, now = new Date(), say: Speaker = speaker("en")): string {
  const left = deadline.getTime() - now.getTime();
  if (left <= 0) return say.say("played.overdue");
  const seconds = Math.floor(left / 1000);
  if (seconds < 60) return say.say("played.leftSeconds", { seconds: String(seconds) });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return say.say("played.leftMinutes", { minutes: String(minutes), seconds: String(seconds % 60).padStart(2, "0") });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return say.say("played.leftHours", { hours: String(hours), minutes: String(minutes % 60).padStart(2, "0") });
  const days = Math.floor(hours / 24);
  return say.say("played.leftDays", { days: String(days), hours: String(hours % 24) });
}

export { MOVE_TIME_OPTIONS };
