import type { KeptCardGame } from "../cardGameCodec.ts";
import type { CardId, CardSuit } from "../cardGames.types.ts";

/** A card played (an eight names the suit to follow), a card drawn from the stock, or a turn passed. */
export type CrazyEightsMove = { play: CardId; suit?: CardSuit } | { draw: true } | { pass: true };

/** How a hand ended: who won it, and the points each winner took. */
export type CrazyEightsResult = { winners: number[]; points: number; blocked: boolean };

/**
 * A GAME OF CRAZY EIGHTS: its table and moves (what is kept), and the hand
 * they have reached. `size` is the score that wins: 50, 100 or 200.
 */
export type CrazyEightsGame = KeptCardGame<CrazyEightsMove> & {
  /** Which hand this is, from 0: it decides who plays first, round the table. */
  hand: number;
  phase: "playing" | "over";
  hands: CardId[][];
  /** The stock, face down, top card first. */
  stock: CardId[];
  /** The discard pile, face up, the top card last. */
  discard: CardId[];
  /** The suit to follow: the top card's, or the one called when an eight was played. */
  suit: CardSuit;
  toPlay: number | null;
  /** The card the player to move has just drawn, the only one they may now play; null before they draw. */
  drawn: CardId | null;
  /** Turns passed in a row with nothing to draw: when every player has, the hand is blocked. */
  passes: number;
  /** How many times the discards have been shuffled into a new stock this hand. */
  turnovers: number;
  /** Each seat's points so far: the first to the game's size wins. */
  scores: number[];
  results: CrazyEightsResult[];
};
