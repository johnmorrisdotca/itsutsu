import { DEFAULT_SETTINGS, NO_HANDICAP, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { ratedAtCreation } from "@/lib/rating/ratedAtCreation";
import type { Against } from "./liveAgainst";
import type { CreationAsked } from "./liveRequest";

/**
 * THE GAME AS IT WILL ACTUALLY BE PLAYED, which is not always the one the
 * request named.
 *
 * Three sources say what a new game is: the request, the game it came out of,
 * and the variant's own spec. They disagree, the order they are asked in
 * decides the game, and getting that order wrong has produced the same bug
 * three times — twice on the board, once on the ladder. So it is one pure
 * function with a test beside it rather than a spread in the middle of a route
 * handler.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE ORDER, AND THE TWO FIELDS THAT HAVE BITTEN
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **The position wins.** `source` is spread OVER the request, because a
 * rematch is the same game and a fork continues a position: replaying the
 * copied moves onto any other board would not be the same position. That
 * ordering is why a clock travels with a fork at all, after a three-day-a-move
 * game once forked into a five-minute one.
 *
 * **THE VARIANT.** A rematch and a fork take their rules from the game they
 * came from and send no variant at all — so the request's `variant` falls back
 * to the schema's default of freestyle, whose `winLength` is null, and the line
 * length then fell all the way through to five. That made a rematched game of
 * noughts and crosses UNWINNABLE: three in a row on a three-by-three board,
 * needing five in a row to win. John found it playing his daughter — he put his
 * winning move down and nothing happened, because on that board nothing ever
 * could. `playedAs` is the fix: ask the MERGED game what it is, not the request.
 *
 * **THE LINE LENGTH — the same bug one step further along, and the fix above
 * did not reach it.** That fix asks the variant's spec, which settles every
 * game that fixes its own: noughts and crosses is three in a row and cannot be
 * anything else. Freestyle gomoku does not fix one — its spec says null,
 * because the length is a thing the two players agree — and the length was then
 * read out of the REQUEST, which for a rematch says nothing at all. So a 9×9
 * freestyle game two people had agreed at THREE in a row came back from a
 * rematch needing five. Same shape, same cause, and invisible to the test that
 * covers the first one because that test uses a variant whose spec has an
 * answer.
 *
 * **THE RATING.** `rated` is spread AFTER `source` on purpose: `ratedAtCreation`
 * has already read what the source carried, so letting the source win again
 * would undo its last clause — which is the one that stops a fork minting a
 * rated board at one screen. `offer` keeps the place offers gave it: it carries
 * the four offer columns and nothing about rating, so the two orderings are
 * independent.
 */

/** Exactly what `createLiveGame` takes, so a mismatch shows up here. */
type LiveGameInput = Parameters<typeof import("./liveGame").createLiveGame>[0];

export function settingsAsPlayed({
  asked,
  against,
}: {
  asked: CreationAsked;
  against: Against;
}): LiveGameInput {
  const {
    challenge: _challenge,
    challengeId: _challengeId,
    rematch: _rematch,
    from,
    rated: ratedRequested,
    ...settings
  } = asked.data;
  void _rematch;
  void _challenge;
  void _challengeId;

  const { source, seats, offer, hotSeat } = against;
  /*
   * Whether THIS game moves a rating: the seats, then the game it came out of,
   * then the request, then yes. The whole argument for that order is in
   * `ratedAtCreation`, including why a board at one screen can never be stored
   * rated whoever asks.
   */
  const rated = ratedAtCreation({
    requested: ratedRequested,
    carried: typeof source.rated === "boolean" ? source.rated : undefined,
    hotSeat,
  });
  const merged = { ...settings, ...source, rated, ...seats, ...offer, hotSeat };
  const playedAs = (typeof merged.variant === "string" ? merged.variant : asked.data.variant) as RuleVariant;
  const carriedLine = typeof merged.winLength === "number" ? merged.winLength : undefined;

  return {
    ...merged,
    from: from === undefined ? undefined : { id: from.id, moves: from.move },
    handicap: merged.handicap ?? NO_HANDICAP,
    winLength:
      VARIANT_SPECS[playedAs].winLength ??
      carriedLine ??
      asked.data.winLength ??
      DEFAULT_SETTINGS.winLength,
  };
}
