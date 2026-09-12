import "server-only";

import { foldEmail } from "@/lib/auth/members";
import { botTierFor } from "@/lib/bots/bots";
import { prisma } from "@/lib/prisma";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import { STREAK_KINDS, type Streak, type StreakOutcome } from "@/lib/rating/streak";

import { awardXp } from "./awardXp";
import { XP_EVENTS } from "./xp.constants";
import { isWeekend, xpWeekKey } from "./xpDay";
import {
  NO_OPPONENT,
  XP_GRADES_TO_BEAT,
  gameAwards,
  otherSeat,
  variantOf,
  type FinishedGame,
  type Opponent,
} from "./xpGame";
import { awardCollected, awardTourBonuses, justPaid } from "./xpTour";

/**
 * Paying a finished game, one bound seat at a time.
 *
 * The seam between `recordPlayed` — the one place a decided game is seen exactly
 * once per bound member id — and the ledger. It holds no pricing and no rules
 * about what a game is worth: `xpGame.ts` decides what a game pays and `awardXp`
 * decides what an award comes to. What is left here is gathering the two facts a
 * finished game does not already know, and the one question that cannot be asked
 * until the batch has been paid.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT COSTS, PER FINISHED GAME
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **Nothing at all for a loss, a draw, or a win over a computer.** Every fact
 * those need is on the row `recordPlayed` has already read: the variant, the move
 * count, the run it is writing, and the other seat's id — and whether that id is
 * a program is answered by `botTierFor`, which is pure and asks nothing.
 *
 * **Two reads for a win over a person**, run together: whether they are on this
 * member's buddy list, and whether they had beaten this member at this game
 * before. Neither can be derived from anything in hand. They are the price of
 * `wonVsBuddy` and `revengeWin`, they are bounded per GAME rather than per move
 * or per page, and both are indexed — the buddy pair is a unique key and a game's
 * seats are indexed columns.
 *
 * **One count on the handful of games that could complete a set**: the tour's
 * thirty-nine and eleven (see `xpTour.ts`) and the five computer grades. Asked
 * only when the batch just paid the first-of award that could have completed it.
 *
 * Nothing here is on a page, and nothing here is per move.
 */

/** One bound seat, with everything `recordPlayed` already knows about it. */
export type XpSide = {
  memberId: string;
  /**
   * Their address, or null when the row has none.
   *
   * Carried because the buddy list is keyed by ADDRESS and this is keyed by id.
   * Null means the buddy question cannot be asked, which is answered as "not
   * known" rather than as "not a buddy".
   */
  email: string | null;
  outcome: StreakOutcome;
  /** The run this result made, from the columns the writer is writing. */
  run: Streak | null;
  /**
   * Their own zone, for the weekend. Another column on a row already read: a
   * game that ended on Sunday evening in Tokyo ended on Saturday night in
   * Tallinn, and the member's reading is the one that counts.
   */
  timeZone: string | null;
};

/**
 * Pay every bound seat for the game that has just been decided.
 *
 * One batch per member rather than one call per award, so a game that paid for
 * three things writes one flash and the toasts read as one stack — "+65 XP"
 * teaches a member less than three lines saying what each part was for.
 *
 * Sequential rather than `Promise.all`, deliberately: two batches racing for one
 * member's row would each have read the total the other was about to change, and
 * a finished game is not a hot path.
 */
export async function awardFinishedGameXp(
  game: FinishedGame & { blackMemberId: string | null; whiteMemberId: string | null },
  sides: readonly XpSide[],
  now: Date = new Date(),
): Promise<void> {
  const emails = new Map(sides.map((side) => [side.memberId, side.email]));

  for (const side of sides) {
    const opponent = await opponentFacts(game, side, emails);
    const paid = await awardXp({
      memberId: side.memberId,
      awards: gameAwards(game, {
        outcome: side.outcome,
        run: side.run,
        opponent,
        /* Their weekend, not the server's. Null unless it really is one for
           them, so nothing is paid on a guess about whose Sunday it is. */
        weekendWeek: isWeekend(now, side.timeZone) ? xpWeekKey(now, side.timeZone) : null,
      }),
      now,
    });
    /* AFTER the batch, and only because of what it paid. A first game of a
       variant is what can complete the set of thirty-nine, so the question is
       worth asking exactly when one was just paid for and at no other time. */
    await awardTourBonuses({ memberId: side.memberId, paid, now });
    await awardLadderBonus({ memberId: side.memberId, paid, now });
  }
}

/**
 * What is known about the other seat, having read only what an award needs.
 *
 * The order of the guards is the cost: the tier is pure, a loss asks nothing, and
 * the two reads happen only for the one case that can pay for them.
 */
async function opponentFacts(
  game: { blackMemberId: string | null; whiteMemberId: string | null; id: string; variant: string },
  side: XpSide,
  emails: ReadonlyMap<string, string | null>,
): Promise<Opponent> {
  const id = otherSeat(game, side.memberId);
  if (id === null) return NO_OPPONENT;
  const tier = botTierFor(id);
  /* A program's grade is what pays; nothing else about it is worth a query. And
     a game that was not won pays nothing that depends on who it was against. */
  if (tier !== null || side.outcome !== STREAK_KINDS.win) {
    return { ...NO_OPPONENT, id, tier };
  }

  const [buddy, beatenMeBefore] = await Promise.all([
    onMyBuddyList(side.email, emails.get(id) ?? null),
    hadBeatenMe({ me: side.memberId, them: id, game }),
  ]);
  return { id, tier: null, buddy, beatenMeBefore };
}

/**
 * Whether the opponent is on this member's buddy list. Null where it cannot be
 * asked.
 *
 * `Buddy` is keyed by two ADDRESSES, folded, so a seat bound to a member with no
 * address — a kept record, a computer — cannot be on one. That is a different
 * fact from "not a buddy", and it is reported as null so nothing pays on it.
 */
async function onMyBuddyList(mine: string | null, theirs: string | null): Promise<boolean | null> {
  if (mine === null || theirs === null) return null;
  try {
    const row = await prisma.buddy.findUnique({
      where: { owner_buddy: { owner: foldEmail(mine), buddy: foldEmail(theirs) } },
      select: { owner: true },
    });
    return row !== null;
  } catch (problem) {
    /* Null rather than false: a read that failed has not established that they
       are not a buddy. */
    console.error("Could not read a buddy list for XP", problem);
    return null;
  }
}

/**
 * Whether this opponent had already beaten this member at this game.
 *
 * The record of the games between the two IS the source, which is the only
 * honest one: a turn-around is a fact about history and nothing else on the row
 * knows it. One `findFirst` on the seats' own indexes, with this game excluded —
 * the game that has just been decided is not evidence of anything that came
 * before it.
 *
 * By member id and never by name, for the reason `playedRun.ts` gives at length:
 * production carries decided games with both seats' ids null and a name fallback
 * pulls games into a total they were never bound to.
 *
 * It runs on every win over a person, including the wins after the award has
 * already been paid — one indexed read, and the alternative is a read to find out
 * whether to do a read. Null where it could not be asked or could not be read.
 */
async function hadBeatenMe({
  me,
  them,
  game,
}: {
  me: string;
  them: string;
  game: { id: string; variant: string };
}): Promise<boolean | null> {
  /* A variant this deploy cannot name is a rivalry it cannot key, so there is
     nothing to establish. */
  if (variantOf({ ...game, moveCount: 0 }) === null) return null;
  try {
    const loss = await prisma.game.findFirst({
      where: {
        id: { not: game.id },
        status: "finished",
        variant: game.variant,
        OR: [
          { blackMemberId: them, whiteMemberId: me, winner: STONES.black },
          { blackMemberId: me, whiteMemberId: them, winner: STONES.white },
        ],
      },
      select: { id: true },
    });
    return loss !== null;
  } catch (problem) {
    console.error("Could not read a rivalry for XP", problem);
    return null;
  }
}

/**
 * The computer ladder's bonus, when the grade just beaten was the last one.
 *
 * The same shape as the tour's two: the ledger's own `gradeBeaten` rows ARE the
 * collection, so completing it is a count rather than a second definition of
 * which grades a member has beaten. Asked only on the five occasions in a
 * member's life when a grade is beaten for the first time.
 *
 * The specialists are not in it on purpose. They are not on the ladder — they
 * play one game each and have to be sought out — so "all five grades" stays a
 * statement about the five.
 */
async function awardLadderBonus({
  memberId,
  paid,
  now,
}: {
  memberId: string;
  paid: Awaited<ReturnType<typeof awardXp>>;
  now?: Date;
}): Promise<void> {
  if (!justPaid(paid, XP_EVENTS.gradeBeaten)) return;
  try {
    await awardCollected({
      memberId,
      each: XP_EVENTS.gradeBeaten,
      all: XP_EVENTS.everyGradeBeaten,
      size: XP_GRADES_TO_BEAT,
      now,
    });
  } catch (problem) {
    console.error("Could not settle the computer ladder's bonus", memberId, problem);
  }
}
