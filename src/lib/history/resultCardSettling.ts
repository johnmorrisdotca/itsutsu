import { RESULT_CARD_SETTLE_MS } from "./gameResult.constants";

/**
 * Whether a result card that has no XP to say may be early rather than right.
 *
 * The seat that did not make the ending move can draw its card between the game
 * being filed and that seat being paid, and a render is a snapshot: the card would
 * stay without its XP for good. So a member's card with no XP, drawn within
 * `RESULT_CARD_SETTLE_MS` of the last move, says it may be early and the page asks
 * again. Never for a reader who is nobody's member (no ledger to be paid into), for
 * a card that already has its XP, or for a game that ended longer ago than the
 * payment takes — a card with none there is a game that paid nothing.
 *
 * An unreadable time is "not settling", never "settling": a rule that cannot
 * measure must not fire.
 */
export function xpMaySettle(input: {
  viewerId: string | null;
  xp: unknown;
  lastMoveAt: string | null;
  now: Date;
}): boolean {
  if (input.viewerId === null || input.xp !== null) return false;
  if (input.lastMoveAt === null) return false;
  const ended = Date.parse(input.lastMoveAt);
  if (Number.isNaN(ended)) return false;
  const since = input.now.getTime() - ended;
  return since < RESULT_CARD_SETTLE_MS;
}
