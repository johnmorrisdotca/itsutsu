import type { KeptCardGame } from "../cardGameCodec.ts";
import type { CardId } from "../cardGames.types.ts";

/** A card drawn from the stock or taken from the discard pile, or a card thrown: laid on the pile, or face down to knock. */
export type GinMove = { draw: "stock" } | { draw: "discard" } | { discard: CardId } | { knock: CardId };

/** A meld: three or four of a rank, or a run of three or more in one suit. */
export type GinMeld = CardId[];

/** Each hand's player, laid out: their melds, and the cards left over. */
export type GinLayout = { melds: GinMeld[]; deadwood: CardId[] };

/** How a hand ended: who scored and how much, and how each hand was laid down. */
export type GinResult = {
  /** The seat that knocked, or null for a hand drawn with the stock run down. */
  knocker: number | null;
  /** The seat that scored the hand, or null for none. */
  winner: number | null;
  points: number;
  /** "gin" with no deadwood, "knock" won, "undercut" when the other player had no more, "drawn" when the stock ran out. */
  kind: "gin" | "knock" | "undercut" | "drawn";
  /** Each seat's melds and deadwood as scored, after the other player laid off onto a knocker's melds. */
  layouts: GinLayout[];
  /** The cards the defender laid off onto the knocker's melds. */
  laidOff: CardId[];
};

/**
 * A GAME OF GIN RUMMY: its table and moves (what is kept), and the hand they
 * have reached. Two seats. `size` is the score that wins: 50, 100 or 150.
 */
export type GinGame = KeptCardGame<GinMove> & {
  /** Which hand this is, from 0: the first to play alternates. */
  hand: number;
  /** Drawing a card, throwing one, or the game over. */
  phase: "draw" | "discard" | "over";
  hands: CardId[][];
  /** The stock, face down, top card first. */
  stock: CardId[];
  /** The discard pile, face up, the top card last. */
  discard: CardId[];
  /** The card just taken from the discard pile, which may not be thrown straight back; null otherwise. */
  taken: CardId | null;
  toPlay: number | null;
  /** The cards each seat has taken from the discard pile this hand and still holds: what the whole table watched them take. */
  picked: CardId[][];
  /** The cards thrown this hand so far: a new hand shows how the last was laid down until each player has thrown once. */
  throws: number;
  scores: number[];
  results: GinResult[];
};
