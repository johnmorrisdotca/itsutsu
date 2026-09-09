import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import { BOT_MEMBERS, BOT_MEMBER_IDS, BOT_MEMBER_LIST } from "./bots.constants";

/**
 * Who is a computer, answered without asking the database.
 *
 * Pure and synchronous on purpose. The clock asks this question — see
 * `deadlineFor` — and the clock is read in three places that must all get the
 * same answer: the board a player is looking at, the claim they can make when
 * the other side is late, and the stamp written when somebody sits down. A
 * question that needed an `await` would be answered separately in each of
 * them, and separately answered questions drift.
 */

/** The grade a member id plays at, or null when the id belongs to a person. */
export function botTierFor(memberId: string | null | undefined): BotTier | null {
  if (memberId === null || memberId === undefined) return null;
  return BOT_MEMBER_LIST.find((bot) => bot.id === memberId)?.tier ?? null;
}

/** Whether this member id belongs to one of the computer players. */
export function isBotId(memberId: string | null | undefined): boolean {
  return memberId !== null && memberId !== undefined && BOT_MEMBER_IDS.has(memberId);
}

/** The member id holding one colour's seat in a game. */
export function seatMemberId(
  game: { blackMemberId?: string | null; whiteMemberId?: string | null },
  stone: Stone,
): string | null {
  const held = stone === STONES.black ? game.blackMemberId : game.whiteMemberId;
  return held ?? null;
}

/** The grade sitting in one colour's seat, or null when a person is in it. */
export function botInSeat(
  game: { blackMemberId?: string | null; whiteMemberId?: string | null },
  stone: Stone,
): BotTier | null {
  return botTierFor(seatMemberId(game, stone));
}

/**
 * Whether either seat in this game is held by a computer.
 *
 * What makes a game a game against the computer, which is the question the
 * rating pool asks: both sides of such a game are rated in the pool for games
 * against the computer, and neither side's ordinary rating is touched.
 */
export function hasBotSeat(game: {
  blackMemberId?: string | null;
  whiteMemberId?: string | null;
}): boolean {
  return isBotId(game.blackMemberId) || isBotId(game.whiteMemberId);
}

/** The name a grade plays under, for a seat being filled or a record being written. */
export function botName(tier: BotTier): string {
  return BOT_MEMBERS[tier].name;
}
