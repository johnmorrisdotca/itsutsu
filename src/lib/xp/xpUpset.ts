import { RATING_START, tierFor } from "@/lib/rating/elo";

import { XP_EVENTS, XP_EVENT_SPECS } from "./xp.constants";
import type { XpEventType } from "./xp.types";

/**
 * Beating somebody better than you, and what it adds.
 *
 * John's rule, in his words: *"If you beat someone better than you with a high
 * rank you earn more XP. You can never lose XP of course."* This is the whole of
 * it, pure, handed the two ratings as they stood and answering which award — if
 * any — the win adds on top of what winning already paid.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THREE BANDS, EACH A PRICED AWARD, NOT A MULTIPLIER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The bonus is one of three rows in `XP_EVENT_SPECS` — `upsetWin`,
 * `bigUpsetWin`, `giantKilled` — and never an amount worked out from the gap.
 * Three reasons, and the first is the one that settles it:
 *
 * - **It is capped by construction.** The most a win can add is the top band's
 *   price. An unbounded function of a rating difference is a lottery, and a
 *   bounded one with a clamp in it is a lottery with a ceiling somebody has to
 *   remember to keep.
 * - **Every amount is a number somebody chose.** A bonus of 23 on one game and
 *   24 on the next is the machine's arithmetic, and the catalogue's rule is that
 *   every price ends in a 0 or a 5.
 * - **The ledger explains itself.** A history row reading "A giant killed" says
 *   what happened. "+217, upset" says a formula ran.
 *
 * And the ledger's contract survives untouched: `XpEvent.points` records what
 * was paid at the time, one price per type, so nothing about `awardXp` or the
 * backfill's prediction had to learn that a type can be worth two amounts.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A GAP ONLY MEANS SOMETHING WHEN BOTH NUMBERS DO — AND THE TWO GUARDS DIFFER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `elo.ts` calls fewer than four rated games UNRATED and fewer than twenty
 * PROVISIONAL, and a provisional rating moves at K=40 — one result swings it by
 * up to forty points. So a gap is read only where it is a measurement, and the
 * two seats are held to different standards for two different reasons:
 *
 * - **The OPPONENT must be established** (twenty rated games or more). This is
 *   the guard against farming, and it is the load-bearing one. A newcomer sits
 *   at the starting 1600 whatever their strength, so "beat somebody rated above
 *   you" over a provisional opponent is "beat somebody new" — which is the exact
 *   opposite of what John asked to reward.
 * - **The WINNER must be rated at all** (four rated games or more). Not
 *   established: a winner cannot farm by being new, so holding them to twenty
 *   games would only delay the award for the members the early levels are for.
 *   But an unrated winner's figure is the 1600 everybody starts on and nobody
 *   earned, and a gap measured off it is not a gap. Provisional is a rating that
 *   has moved in answer to real results; it is noisy, and noise here costs
 *   nothing, because the bonus is capped and can never be negative.
 *
 * Either rating missing — no `Player` row, or a read that failed — is null, and
 * null pays nothing. It is never read as 1600: that would be a plausible rating
 * that also means "nobody knows", and it would pay an upset over every stranger.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * "BETTER THAN YOU WITH A HIGH RANK" IS TWO THINGS, AND HE NAMED BOTH
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The GAP decides whether a win is an upset and how big: 100, 200 and 300
 * points, which Elo reads as a 36%, 24% and 15% chance of the win happening at
 * all (`expectedScore`). The OPPONENT'S OWN STANDING decides only the top band:
 * `giantKilled` needs a 300-point gap AND an opponent rated at least a hundred
 * above where everybody starts. A 1200 beating a 1500 is a real upset between
 * two people still finding their feet, and pays `bigUpsetWin`; a 1500 beating
 * an 1800 is beating somebody near the top of this site, which is what "a high
 * rank" means, and is the only thing that pays the most.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE PEOPLE POOL, AND NEVER A PROGRAM'S NUMBER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The ratings handed here are `POOL_COLUMNS.people` — the ladder of people —
 * and the caller asks only on a win over a PERSON (`xpGame.ts` decides that from
 * the tier before this is reached). A computer player's rating lives in the
 * other pool, and beating one is paid by `gradeBeaten` and `specialistBeaten`,
 * once per grade. So a person's upset never reads a bot's number, and a bot
 * never earns anything at all (`awardXp` refuses them).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ONLY A GAME THE LADDER COUNTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * An upset is paid only on a game that moved the ratings it reads: rated, and
 * not refused by `gameRatingRefusal` — not played at one screen, two different
 * names, no kept record. `xpGame.ts` checks `ladderCounts` before it asks this
 * module anything, and `xpGameServer.ts` does not even read the ratings
 * otherwise. A friendly costs its loser nothing, so two people could agree to
 * trade upsets across a gap no rated game ever tested; on a rated game every
 * throw costs the loser rating and shrinks the very gap that pays.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * "AS THEY STOOD" IS TRUE BECAUSE OF WHERE IT IS ASKED
 * ─────────────────────────────────────────────────────────────────────────
 *
 * XP rides `recordPlayed`, and every ending calls `recordPlayed` BEFORE
 * `recordResult` — so when `xpGameServer.ts` reads the two `Player` rows, the
 * rating exchange for this game has not happened yet and the figures are the
 * ones the players carried into it. `xpUpset.test.ts` pins that order in the
 * four endings' source, because if it ever flips the bonus would quietly be
 * read off ratings that already include the upset it is paying for.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT THE REPLAY DOES WITH THIS: NOTHING, AND IT SAYS SO
 * ─────────────────────────────────────────────────────────────────────────
 *
 * An Elo figure cannot be rebuilt — it depends on both ratings at the moment
 * each earlier game was scored, which the standings work established and which
 * nothing stored. So `backfillXp.ts` hands this no ratings and it pays nothing,
 * and `XP_BACKFILL_COVERAGE` says why beside the three types. Paying history
 * off TODAY's ratings would put a number in the ledger nobody could check and
 * that is wrong in both directions: a member who has since climbed would be
 * denied upsets they really made, and one who has since fallen would be paid
 * for upsets that were never upsets.
 */

/** One player's standing on the ladder of people, as it was going into the game. */
export type RatingAsItStood = { rating: number; ratedGames: number };

/**
 * Both, from the winner's side. Null where it could not be read — no row, or a
 * failed read — which pays nothing rather than guessing a starting rating.
 */
export type RatingsAsTheyStood = {
  mine: RatingAsItStood | null;
  theirs: RatingAsItStood | null;
};

/** The standing the top band asks of the opponent, over and above the gap. */
export const XP_HIGH_RANK = RATING_START + 100;

/** The bands, biggest first, so the first that fits is the one paid. */
export const XP_UPSET_BANDS: readonly {
  type: XpEventType;
  /** How far above the winner the opponent stood, at least. */
  gap: number;
  /** The opponent's own rating, at least. Null where only the gap is asked. */
  theirsAtLeast: number | null;
}[] = [
  { type: XP_EVENTS.giantKilled, gap: 300, theirsAtLeast: XP_HIGH_RANK },
  { type: XP_EVENTS.bigUpsetWin, gap: 200, theirsAtLeast: null },
  { type: XP_EVENTS.upsetWin, gap: 100, theirsAtLeast: null },
];

/** A rating that is a number a person earned, rather than a missing or broken one. */
function readable(one: RatingAsItStood | null): one is RatingAsItStood {
  return one !== null && Number.isFinite(one.rating) && Number.isInteger(one.ratedGames) && one.ratedGames >= 0;
}

/**
 * Which upset award this win adds, or null for none.
 *
 * Null for an equal or weaker opponent — the ordinary win awards are paid
 * whatever this says, so beating somebody weaker pays exactly what it always
 * did and never less.
 */
export function upsetAwardFor(ratings: RatingsAsTheyStood | null): XpEventType | null {
  if (ratings === null) return null;
  const { mine, theirs } = ratings;
  if (!readable(mine) || !readable(theirs)) return null;
  if (tierFor(theirs.ratedGames) !== "established") return null;
  if (tierFor(mine.ratedGames) === "unrated") return null;

  const gap = theirs.rating - mine.rating;
  const band = XP_UPSET_BANDS.find(
    (one) => gap >= one.gap && (one.theirsAtLeast === null || theirs.rating >= one.theirsAtLeast),
  );
  return band?.type ?? null;
}

/** What that award is worth: the extra XP, 0 where the win adds nothing. */
export function upsetBonusFor(ratings: RatingsAsTheyStood | null): number {
  const type = upsetAwardFor(ratings);
  return type === null ? 0 : XP_EVENT_SPECS[type].points;
}
