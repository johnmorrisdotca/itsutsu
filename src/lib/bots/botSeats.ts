import "server-only";

import { BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import { sitAtOpenSeat } from "@/lib/history/openGames";
import { bindSeat } from "@/lib/history/seats";
import { prisma } from "@/lib/prisma";
import { BOT_MEMBERS, OPEN_SEAT_GRACE_MS, OPEN_SEATS_ANSWERED_AT_ONCE, OPEN_SEATS_CONSIDERED_AT_ONCE } from "./bots.constants";
import { ensureBotMembers } from "./botMembers";
import { hasBotSeat } from "./bots";
import { playBotTurns } from "./botPlay";

/**
 * Answering a seat nobody has taken.
 *
 * This is the part of a computer opponent that actually solves the problem it
 * was asked for. A site with few members has the same trouble every evening: a
 * game gets posted, and nothing happens, because there is nobody about. Being
 * able to *challenge* a computer helps only the person who thinks to do it;
 * having the computer answer a seat that has been sitting on the noticeboard
 * means a posted game gets played whether or not anyone else is here.
 *
 * It waits first. A seat answered the instant it is posted is not a
 * noticeboard, it is a button with extra steps, and a person who wanted a game
 * against a person should get the chance to have one.
 */

/** Which grade takes an unanswered seat. */
function grade(roll: number): BotTier {
  /*
   * Evenly, at random, rather than matched to the poster.
   *
   * Matching would need ratings that mean something, and on a new site none
   * of them has any yet — so matching would only be an elaborate way of
   * always choosing the same one. Spreading the games instead is what gives
   * every rung a record, which is what makes matching possible later.
   */
  return BOT_TIER_LIST[Math.min(BOT_TIER_LIST.length - 1, Math.floor(roll * BOT_TIER_LIST.length))];
}

/**
 * Takes any seat that has been posted longer than the grace period, up to a
 * few at a time, and plays the computer's move if the seat it took opens.
 *
 * Returns how many were answered. Safe to call from anywhere that happens to
 * be looking at the noticeboard: a seat is claimed by the same conditional
 * update a person's click uses, so two sweeps racing cannot both take it.
 */
export async function answerStaleOpenSeats(
  now: Date = new Date(),
  graceMs: number = OPEN_SEAT_GRACE_MS,
  random: () => number = Math.random,
): Promise<number> {
  const oldest = await prisma.game.findMany({
    where: {
      status: "active",
      openSeat: { not: null },
      openedAt: { lt: new Date(now.getTime() - graceMs) },
    },
    orderBy: { openedAt: "asc" },
    take: OPEN_SEATS_CONSIDERED_AT_ONCE,
    select: { id: true, blackMemberId: true, whiteMemberId: true },
  });

  /*
   * NARROWED BEFORE THE CUT, and that is the whole of a bug worth keeping in
   * view. A game a computer is already sitting in is not a game waiting for
   * one — but dropping it after the list had been cut to three dropped a SLOT
   * with it, and the ordering is oldest-first on a column that only gets
   * older. Three such rows at the front would have starved every real waiting
   * game behind them, quietly and for good.
   *
   * The predicate stays in JavaScript on purpose. It reads as though it
   * belongs in the `where` above, and the bot ids are a fixed set that needs
   * no lookup — but `blackMemberId` and `whiteMemberId` are NULL exactly when
   * a seat is open, `NOT (col IN (…))` over NULL is NULL, and Postgres drops
   * those rows. That where clause would have excluded every open seat on the
   * site rather than the handful meant, and answered nothing at all.
   */
  const waiting = oldest.filter((row) => !hasBotSeat(row));
  if (waiting.length === 0) return 0;
  await ensureBotMembers();

  let answered = 0;
  for (const row of waiting) {
    // The cap counts seats ANSWERED, not rows looked at: a seat somebody else
    // took while we were reading is gone, not an answer we have spent.
    if (answered >= OPEN_SEATS_ANSWERED_AT_ONCE) break;
    const bot = BOT_MEMBERS[grade(random())];
    const outcome = await sitAtOpenSeat(row.id);
    if (!outcome.ok) continue;
    await bindSeat(row.id, outcome.seat, bot.id, bot.name);
    answered += 1;
    try {
      await playBotTurns(row.id);
    } catch (error) {
      console.error(error);
    }
  }
  return answered;
}

/**
 * How often a page render is allowed to sweep. There is no scheduler on this
 * site, so the noticeboard being looked at is what makes the sweep happen —
 * and a page must not pay for it on every render.
 */
const SWEEP_EVERY_MS = 5 * 60_000;
let sweptAt = 0;

/**
 * The throttled sweep, for a page to call while it is listing open seats.
 *
 * Fire and forget: whether a stale seat was answered is not something the
 * render is waiting on, and a page that failed to load because a computer
 * could not think of a move would be a poor trade.
 */
export function sweepOpenSeats(now = Date.now()): void {
  if (now - sweptAt < SWEEP_EVERY_MS) return;
  sweptAt = now;
  void answerStaleOpenSeats().catch((error) => {
    console.error(error);
  });
}
