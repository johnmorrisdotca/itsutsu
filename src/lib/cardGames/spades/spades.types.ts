import type { KeptCardGame } from "../cardGameCodec";
import type { CardId } from "../cardGames.types";

/** Bidding how many tricks each seat will take, playing the deal out trick by trick, or the game over. */
export type SpadesPhase = "bidding" | "playing" | "over";

/** One card laid on a trick, and whose it was. */
export type SpadesPlay = { seat: number; card: CardId };

/** A bid of tricks, 0 (nil) to 13, or one card played to the trick. */
export type SpadesMove = { bid: number } | { play: CardId };

/** What one finished deal did to a partnership's score, as the scores table explains it. */
export type SpadesDealScore = {
  /** The points the deal made or cost each partnership: seats 0 and 2 first, then 1 and 3. */
  points: [number, number];
  /** The overtricks (bags) each partnership took this deal. */
  bags: [number, number];
};

/**
 * A GAME OF SPADES: its table and moves (what is kept, `KeptCardGame`), and
 * everything the moves make, read again from them whenever the game is.
 * Four seats in two partnerships, sitting across from each other: seats 0 and
 * 2 against 1 and 3. `size` is the score that ends the game: 200, 300 or 500.
 */
export type SpadesGame = KeptCardGame<SpadesMove> & {
  /** Which deal this is, from 0: the deal moves one seat round each time. */
  deal: number;
  phase: SpadesPhase;
  hands: CardId[][];
  /** Each seat's bid this deal, 0 for nil, or null while it has not bid. */
  bids: (number | null)[];
  /** The trick on the table, in the order it was played. */
  trick: SpadesPlay[];
  /** The trick before, and who took it. */
  lastTrick: { plays: SpadesPlay[]; winner: number } | null;
  /** Every card played in a finished trick this deal. */
  played: CardId[];
  /** Whose move it is; null once the game is over. */
  toPlay: number | null;
  /** Whether a spade has been played on another suit (or led from a hand of nothing else) this deal. */
  spadesBroken: boolean;
  /** The tricks each seat has taken this deal. */
  tricks: number[];
  /** Each partnership's score, before this deal: seats 0 and 2, then 1 and 3. */
  scores: [number, number];
  /** Each partnership's overtricks carried towards the next ten. */
  bags: [number, number];
  /** Each finished deal, one row a deal. */
  dealScores: SpadesDealScore[];
};
