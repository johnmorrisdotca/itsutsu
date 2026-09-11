import { VARIANT_SPECS, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * Whether a game could be won at all, asked before it is written.
 *
 * John, after his winning move did nothing: "Should there not be checks when a
 * game starts about this sort of thing? seems buggy." He is right, and the
 * check belongs here rather than in each route. A rematch stored a
 * three-by-three board that needed FIVE in a row — unwinnable, and nothing
 * objected, so it was played for six moves before anybody could tell.
 *
 * The rule this repo already has covers it: a guard that cannot answer must
 * not answer quietly. A game nobody can win is exactly that — it plays, it
 * accepts moves, it just never ends.
 *
 * Two checks, and the first is the one that broke:
 *
 * 1. **A game is played under its variant's own rules.** Where a variant
 *    declares a win length, that is the win length, and a game written with
 *    any other has had its rules come from somewhere they should not have.
 *    Exact for every variant, and it needs no opinion about how the game is
 *    won — Reversi carries a five it never uses, and a Reversi game written
 *    with five is still right.
 *
 * 2. **A line somebody chose has to fit the board.** The few variants that let
 *    a player pick — freestyle and its neighbours — accept anything from three
 *    to nineteen, so a nine-by-nine board asking for nineteen in a row is the
 *    same unwinnable game by another road.
 *
 * Pure, so it can be checked without a database, and said once so the routes
 * cannot drift apart about what a playable game is.
 */
export function unwinnableBecause(settings: {
  variant: string;
  size: number;
  winLength: number;
}): string | null {
  const spec = VARIANT_SPECS[settings.variant as RuleVariant];
  if (spec === undefined) return `${settings.variant} is not a game this site has.`;

  if (spec.winLength !== null && settings.winLength !== spec.winLength) {
    return (
      `${settings.variant} is played to ${spec.winLength} in a row, not ${settings.winLength}. ` +
      `A game written with the wrong length has taken its rules from somewhere else.`
    );
  }

  /*
   * Only where a line is what the player chose. A variant that wins some other
   * way carries a length it never reads, and refusing those would be refusing
   * games that play perfectly well — Mini Reversi is a four-by-four board with
   * a five on it, and has never needed the five.
   */
  if (spec.winLength === null && settings.winLength > settings.size) {
    return (
      `${settings.winLength} in a row will not fit on a ${settings.size}×${settings.size} board, ` +
      `so nobody could ever win.`
    );
  }

  const sizes = boardSizesFor(settings.variant as RuleVariant);
  if (!sizes.includes(settings.size)) {
    return `${settings.variant} is not played on ${settings.size}×${settings.size}. It plays on: ${sizes.join(", ")}.`;
  }

  return null;
}

/** Thrown when a game that could not be won was about to be written. */
export class UnwinnableGame extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "UnwinnableGame";
  }
}
