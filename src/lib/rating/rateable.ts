import { playerKey } from "./playerKey";
import { RATING_REFUSALS, type RatingRefusal } from "./rateable.constants";
import { isReservedKey } from "./reservedKeys";

/**
 * Whether a finished game between these two names moves a rating, and if not,
 * why not.
 *
 * The rule was written out twice — once in `recordResult` for the global
 * ladder and once in `recordVariantResult` for the per-game one — as the same
 * five-clause `if` that returned early. Two copies of a rule is one rule that
 * can drift, and neither copy could be shown to anybody: a condition inside a
 * function that returns `void` has no answer to give a page. Named here, it is
 * one rule, it is tested on its own, and the board and the record can both say
 * what it decided.
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
 * Whether a game actually moved — or, unfinished, would ever move — a
 * rating, and if not, why not. The same question `appendMove`,
 * `claimTimeout`, `settleEnded` and `resignGame` each ask before calling
 * `recordResult`, asked here as one function instead of four inline
 * conditions, so a page can ask it too.
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
 * **Do not simplify this to a single check.** `isHotSeat` and `ratingRefusal`
 * catch two different, non-overlapping shapes of the same problem — a device
 * fact and a name fact — and reducing this to either one alone is exactly the
 * bug this function was written to close. See the note on `ratingRefusal`.
 */
export function gameRatingRefusal(game: {
  rated: boolean;
  hotSeat: boolean;
  blackName: string;
  whiteName: string;
}): RatingRefusal | null {
  if (!game.rated) return null;
  if (game.hotSeat) return RATING_REFUSALS.hotSeat;
  return ratingRefusal(game.blackName, game.whiteName);
}
