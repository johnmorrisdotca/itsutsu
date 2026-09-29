import type { CardId } from "../cardGames.types";

/**
 * A CLIMBING GAME'S TRICK: Big Two and President are both played this way.
 * Somebody leads a card or a set of cards; round the table each player beats
 * it with the same number of cards, higher, or passes; a pass holds until the
 * trick is over; and when everybody else has passed, the trick is cleared and
 * whoever played last leads again.
 */

/** What is on the table: the last cards played to this trick, and whose they were. */
export type ClimbPlay = { seat: number; cards: CardId[] };

/** Cards played to beat the table (or lead), or a pass. */
export type ClimbMove = { play: CardId[] } | { pass: true };

/** The part of a climbing game's state the trick machinery moves: every climbing game carries these. */
export type ClimbTrick = {
  hands: CardId[][];
  /** The cards to beat, or null when the seat to play leads. */
  pile: ClimbPlay | null;
  /** Who has passed on this trick: they wait until it is cleared. */
  passed: boolean[];
  /** Whose move it is; null once the game is over. */
  toPlay: number | null;
  /** Every card played this deal, in order: what the whole table has seen. */
  played: CardId[];
};
