import { boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { SeatOnBoard } from "@/components/mine/startGame.types";
import type { RulesDraft } from "./rulesDraft";

/**
 * WHETHER SOMEBODY IS ALREADY ASKING FOR THIS, AND WHICH BOARD TO OPEN ON.
 *
 * Asking for a game and posting a seat are the same wish said twice — the only
 * difference is whether somebody is already asking, and the site knows that. So
 * a screen asking for a game somebody is already asking for sits down at their
 * seat rather than posting a second one beside it, and leaving two people
 * waiting for each other.
 *
 * Its own module because it is a RULE rather than a rendering, and because it is
 * the one part of the setup screen worth testing without a browser: every branch
 * below was written from a regression, and a comment is a worse record of one
 * than a case.
 */
export type SeatMatch = {
  /** The rules as the screen should show them, with a followed board laid over. */
  settled: RulesDraft;
  /** Somebody already asking for exactly this, or undefined. */
  waiting: SeatOnBoard | undefined;
};

export function matchSeat({
  rules,
  seats,
  posting,
  boardChosen,
  matchable,
}: {
  rules: RulesDraft;
  /** The seats already on the noticeboard. */
  seats: readonly SeatOnBoard[];
  /** Whether this game is for whoever answers, rather than for one named person. */
  posting: boolean;
  /** A board somebody chose themselves. A chosen board is not a default. */
  boardChosen: number | null;
  /**
   * Whether this game may sit down at a stranger's seat at all.
   *
   * A REMATCH AND A FORK NEVER MAY. The wish above is "a game, with anybody";
   * those two are about one particular person and, for a fork, one particular
   * position. Following a posted seat's board would also quietly move a fork off
   * the board its own moves were played on, which is not a preference — it is a
   * different game.
   */
  matchable: boolean;
}): SeatMatch {
  /*
   * The board follows a seat somebody is already waiting on, until anybody
   * touches it.
   *
   * This is the regression a board control could easily cause, and the one-line
   * sentence that came before this screen was careful about it: every seat on the
   * noticeboard was posted at some size, and a screen that always opened at the
   * member's own favourite would stop matching them — so asking for a game would
   * post a SECOND seat beside the one already waiting, and neither would ever be
   * filled. Following keeps the common case one press; touching the control stops
   * it following, because at that point the board is a choice somebody has made.
   */
  const alone =
    matchable && posting && boardChosen === null
      ? seats.filter((seat) => seat.variant === rules.variant && seat.moveTimeMs === rules.moveTimeMs)
      : [];
  const follow = alone.length === 1 ? alone[0] : undefined;
  /*
   * Derived rather than written into state. The followed board is a reading of
   * what is on the noticeboard, not a decision anybody has made, and storing a
   * reading as if it were a decision is what makes it need an effect to keep it
   * in step — which React rightly refuses.
   *
   * A chosen board is remembered across a game that cannot use it, and only
   * applied where the current game has it: `applyRulesChange` snaps the size to
   * one the chosen game is played on, so looking at Reversi — which is 8×8 and
   * nothing else — and coming back would otherwise lose a 19×19 chosen on
   * purpose.
   */
  const wanted =
    boardChosen !== null && boardSizesFor(rules.variant as RuleVariant).includes(boardChosen)
      ? boardChosen
      : undefined;
  const settled: RulesDraft =
    follow !== undefined
      ? { ...rules, size: follow.size }
      : wanted !== undefined
        ? { ...rules, size: wanted }
        : rules;

  /*
   * A seat worth taking matches the whole of what is being asked for — the game,
   * the BOARD and the pace. Matching on the game alone would sit somebody down at
   * a board or a clock they did not choose, which is the opposite of settling the
   * rules before the game exists.
   */
  const waiting =
    matchable && posting
      ? seats.find(
          (seat) =>
            seat.variant === settled.variant &&
            seat.size === settled.size &&
            seat.moveTimeMs === settled.moveTimeMs,
        )
      : undefined;

  return { settled, waiting };
}
