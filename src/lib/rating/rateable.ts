import type { HandicapTerms } from "@/lib/gomoku/gomoku.types";

import { handicapRefusal } from "./handicapRefusal";
import { playerKey } from "./playerKey";
import { RATING_REFUSALS, type RatingRefusal } from "./rateable.constants";
import { isReservedKey } from "./reservedKeys";

/**
 * Whether a finished game between these two names moves a rating, and if not,
 * why not.
 *
 * The rule was once written out twice — in the two functions that separately
 * moved the global ladder and the per-game standing — as the same five-clause
 * `if` that returned early. Two copies of a rule is one rule that can drift,
 * and neither copy could be shown to anybody: a condition inside a function
 * that returns `void` has no answer to give a page. Named here, it is one
 * rule, it is tested on its own, and the board and the record can both say
 * what it decided. (Those two writers are now one — `recordResult.ts` — for a
 * related reason: two writers of one fact is one fact that can disagree.)
 *
 * Names rather than accounts, because that is what the ladder is keyed by: two
 * spellings of one name are one player, which is exactly how somebody ends up
 * on both sides of a game without meaning to.
 *
 * **Deliberately blind to hot seat.** This reads two names and nothing else,
 * so it cannot tell a two-person hot-seat board from an ordinary one — that is
 * a fact about the SEATS (one token holding both), not about the names typed
 * into them. It looked, for a while, like `isHotSeat` covered the same ground
 * `onePlayer` does; it does not. Twelve production rows were stored `rated:
 * true` for a hot-seat game, and of those, only two were also caught here (as
 * `onePlayer` or `unnamed`) — the other ten had two ordinary, different names
 * and no reason to refuse a rating BY NAME, yet none of the twelve ever moved
 * one, because the write path checks `isHotSeat` first and never reaches this
 * function at all for a hot-seat game. See `gameRatingRefusal` below, which
 * is where the two checks are combined for anything that needs the whole
 * answer — a display in particular, which has no other way to ask it.
 */
export function ratingRefusal(blackName: string, whiteName: string): RatingRefusal | null {
  const black = playerKey(blackName);
  const white = playerKey(whiteName);
  if (black === "" || white === "") return RATING_REFUSALS.unnamed;
  // Before the reserved check: two seats under one kept name is still one player.
  if (black === white) return RATING_REFUSALS.onePlayer;
  if (isReservedKey(black) || isReservedKey(white)) return RATING_REFUSALS.keptRecord;
  return null;
}

/** Shorthand for the two recorders, which only need the verdict. */
export function isRateable(blackName: string, whiteName: string): boolean {
  return ratingRefusal(blackName, whiteName) === null;
}

/**
 * Why a rating COULD NEVER move for this game — whatever its `rated` column
 * says.
 *
 * The two halves of the write path's test, in the order it applies them, and
 * nothing about whether anybody asked for a rating. That separation is the
 * point: `rated: false` on a stored row means two different things — "somebody
 * chose a friendly game" and "this could never have counted" — and a reader
 * asking why their evening is not in their figures needs the second, which the
 * column cannot tell them.
 *
 * Not exported to any page directly. `gameRatingRefusal` below is what a
 * display asks, because a game nobody asked to count is a friendly and should
 * be badged as one rather than lectured at; this is the half the AUDIT needs,
 * where the column is the thing under suspicion and cannot be used to gate
 * the question. See `ratedButRefused.ts`.
 *
 * **IT DOES NOT ASK ABOUT A HANDICAP, AND MUST NOT.** The audit writes `rated:
 * false` onto every finished row this refuses, and until a handicap was refused
 * a rating (`handicapRefusal`), a finished handicap game DID move both players'
 * ratings. Refusing it here would have the next audit rewrite rows whose rated
 * flag was true when it was written — and John's instruction for this change
 * was to touch no existing production row. The two refusals here are the ones
 * the write path has always applied, which is what makes the audit's
 * corrections true.
 */
export function ratingImpossible(game: {
  hotSeat: boolean;
  blackName: string;
  whiteName: string;
}): RatingRefusal | null {
  if (game.hotSeat) return RATING_REFUSALS.hotSeat;
  return ratingRefusal(game.blackName, game.whiteName);
}

/**
 * Whether a game actually moved — or, unfinished, would ever move — a
 * rating, and if not, why not. The same question `appendMove`,
 * `claimTimeout`, `settleEnded` and `resignGame` each ask before calling
 * `recordResult`, through `countsOnLadder`, so a page asks exactly what the
 * writers do.
 *
 * `rated` is the row's own flag: a game never asked to count is not a
 * refusal, it is a friendly, and says so with its own badge rather than this
 * one. `hotSeat` is read off the seat tokens by the caller (`isHotSeat` in
 * `liveGame.ts`) rather than by this module — `rateable.ts` has no reason to
 * import a live-game concern, and every caller that can ask this question
 * already has the row that answers it.
 *
 * Checked in the SAME ORDER the write path checks it: hot seat first,
 * because that is what actually happens there — `recordResult` is never even
 * called for a hot-seat game, so `ratingRefusal` never runs for one either.
 * A hot-seat game that also happens to have one name on both seats is shown
 * as `hotSeat`, not `onePlayer`, for that reason.
 *
 * **A HANDICAP IS REFUSED WHATEVER THE FLAG SAYS.** A friendly is a choice, and
 * a handicap game has no choice left to make: the set-up screen shows the fact
 * where the Rated and Friendly tiles would be, so its row's flag says nothing
 * anybody decided. Its reason is the answer somebody reading the game needs,
 * rated or not. Where another refusal also applies to a rated game, that one is
 * said first — it is the one the write path would have met.
 *
 * **Do not simplify this to a single check.** `isHotSeat` and `ratingRefusal`
 * catch two different, non-overlapping shapes of the same problem — a device
 * fact and a name fact — and reducing this to either one alone is exactly the
 * bug this function was written to close. See the note on `ratingRefusal`.
 */
export function gameRatingRefusal(
  game: HandicapTerms & {
    rated: boolean;
    hotSeat: boolean;
    blackName: string;
    whiteName: string;
  },
): RatingRefusal | null {
  const handicapped = handicapRefusal(game);
  if (!game.rated) return handicapped;
  return ratingImpossible(game) ?? handicapped;
}
