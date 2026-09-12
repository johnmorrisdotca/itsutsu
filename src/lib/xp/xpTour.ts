import "server-only";

import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { prisma } from "@/lib/prisma";

import { awardXp } from "./awardXp";
import { XP_EVENTS } from "./xp.constants";
import type { XpAwardResult, XpEventType } from "./xp.types";
import { XP_VARIANTS_TO_PLAY } from "./xpGame";

/**
 * The tour's two big bonuses: every game played, and every family met.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE LEDGER IS THE COLLECTION, SO NOTHING ELSE COUNTS THE GAMES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * "Have I played all thirty-nine?" could be asked of the games table — a
 * `groupBy` over every finished game a member has a seat in — and it would be a
 * second definition of the same fact, able to disagree with the awards already
 * paid. It is asked of `XpEvent` instead: **one `firstOfVariant` row exists per
 * variant this member has finished a game of**, because that is exactly what the
 * unique index on `(memberId, type, subject)` means. So a count of those rows IS
 * the number of games met, with no `distinct` needed and no second rule.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND IT IS ONLY ASKED ON THE DAY IT CAN HAVE CHANGED
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The count runs only when the finish just paid a `firstOfVariant` — which
 * happens at most thirty-nine times in a member's life, and eleven for the
 * families. Every other finished game asks nothing. That is the whole cost of
 * these two awards: two counts on the index, on the handful of games that could
 * possibly have completed the set.
 *
 * Asking on every finish would be one query per game per member for an answer
 * that cannot have moved, which is the fault taken off the landing page in
 * 0.139.0 wearing a bonus.
 */

/** Whether this type was actually paid in a batch, rather than merely asked for. */
export function justPaid(result: XpAwardResult, type: XpEventType): boolean {
  return result.awards.some((award) => award.type === type && award.points > 0);
}

/**
 * Pay the "all of them" award when the ledger says they are all in.
 *
 * `each` is the once-per-thing award whose rows ARE the collection; `all` is what
 * completing it pays; `size` is how many things there are. Generic because the
 * site has three of these — thirty-nine games, eleven families, five computer
 * grades — and three copies of the same count would be three places for the
 * comparison to be got wrong by one.
 *
 * `>=` rather than `===`, deliberately. A variant or a grade retired from the
 * list leaves a member holding more rows than there are things, and a member who
 * has genuinely played everything must not be refused the award because the site
 * has since dropped a game.
 */
export async function awardCollected({
  memberId,
  each,
  all,
  size,
  now,
}: {
  memberId: string;
  each: XpEventType;
  all: XpEventType;
  size: number;
  now?: Date;
}): Promise<void> {
  const held = await prisma.xpEvent.count({ where: { memberId, type: each } });
  if (held < size) return;
  await awardXp({ memberId, awards: [{ type: all }], now });
}

/**
 * The tour bonuses a finished game may have completed.
 *
 * Called with what the finish actually paid, because that is the only thing that
 * says whether the collection can have grown. Never throws: it is bookkeeping on
 * top of bookkeeping, and the game is finished either way.
 */
export async function awardTourBonuses({
  memberId,
  paid,
  now,
}: {
  memberId: string;
  paid: XpAwardResult;
  now?: Date;
}): Promise<void> {
  try {
    if (justPaid(paid, XP_EVENTS.firstOfVariant)) {
      await awardCollected({
        memberId,
        each: XP_EVENTS.firstOfVariant,
        all: XP_EVENTS.everyVariantPlayed,
        size: XP_VARIANTS_TO_PLAY,
        now,
      });
    }
    if (justPaid(paid, XP_EVENTS.firstOfFamily)) {
      await awardCollected({
        memberId,
        each: XP_EVENTS.firstOfFamily,
        all: XP_EVENTS.everyFamilyPlayed,
        size: GAME_FAMILIES.length,
        now,
      });
    }
  } catch (problem) {
    /* The tour's bonus is not worth failing a finished game for. `awardXp`
       swallows its own; this covers the counts, which are this module's. */
    console.error("Could not settle the tour bonuses", memberId, problem);
  }
}
