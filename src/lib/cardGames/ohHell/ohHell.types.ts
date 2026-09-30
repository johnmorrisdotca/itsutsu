import type { KeptCardGame } from "../cardGameCodec";
import type { CardId, CardSuit } from "../cardGames.types";

/** Bidding the exact number of tricks each seat will take, playing the deal out, or the game over. */
export type OhHellPhase = "bidding" | "playing" | "over";

export type OhHellPlay = { seat: number; card: CardId };

/** A bid of tricks, nought up to the cards in hand, or one card played to the trick. */
export type OhHellMove = { bid: number } | { play: CardId };

/** What one finished deal did: each seat's bid, the tricks it took, and what it scored. */
export type OhHellDealScore = { cards: number; bids: number[]; tricks: number[]; points: number[] };

/**
 * A GAME OF OH HELL: its table and moves (what is kept, `KeptCardGame`), and
 * everything the moves make. Three or four seats, each for itself. `size` is
 * how many deals: 7 (one card, then two, up to seven) or 13 (up to seven and
 * back down to one).
 */
export type OhHellGame = KeptCardGame<OhHellMove> & {
  /** Which deal this is, from 0. */
  deal: number;
  phase: OhHellPhase;
  /** The cards each seat holds this deal. */
  cards: number;
  hands: CardId[][];
  /** The card turned up after the deal: its suit is trumps. */
  turned: CardId;
  trump: CardSuit;
  bids: (number | null)[];
  trick: OhHellPlay[];
  lastTrick: { plays: OhHellPlay[]; winner: number } | null;
  /** Every card played in a finished trick this deal. */
  played: CardId[];
  toPlay: number | null;
  tricks: number[];
  scores: number[];
  dealScores: OhHellDealScore[];
};
