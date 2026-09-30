import type { KeptCardGame } from "../cardGameCodec.ts";
import type { CardId, CardRank } from "../cardGames.types.ts";

/** Asking one player for every card they hold of one rank. */
export type GoFishMove = { ask: number; rank: CardRank };

/**
 * What the whole table saw of a turn: who asked whom for what, how many cards
 * were handed over, and — when none were — whether the card drawn from the
 * pond was the rank asked for (which is shown, and earns another ask). A card
 * drawn for any other reason is drawn face down: `drew` says only that it was.
 */
export type GoFishEvent =
  | { kind: "ask"; seat: number; asked: number; rank: CardRank; got: number; fished: "caught" | "missed" | "dry" | null }
  | { kind: "draw"; seat: number }
  | { kind: "book"; seat: number; rank: CardRank };

/**
 * A GAME OF GO FISH: its table and moves (what is kept), and what they make.
 * One deal is the game; `size` is 1.
 */
export type GoFishGame = KeptCardGame<GoFishMove> & {
  phase: "playing" | "over";
  hands: CardId[][];
  /** The pond: the cards not dealt, top card first. */
  stock: CardId[];
  /** Each seat's books, one rank each, in the order laid down. */
  books: CardRank[][];
  toPlay: number | null;
  /** Everything said and shown at the table, in order: what a player (or a computer) remembers from. */
  log: GoFishEvent[];
};
