import type { KeptCardGame } from "../cardGameCodec";
import type { CardId } from "../cardGames.types";

/** Two cards laid away to the crib, or one card played in the pegging. */
export type CribbageMove = { crib: [CardId, CardId] } | { play: CardId };

/** Both players laying two cards to the crib, the pegging, or the game over. */
export type CribbagePhase = "crib" | "pegging" | "over";

export type CribbagePlay = { seat: number; card: CardId };

/** What one card played in the pegging scored, and why: "fifteen", "a pair", "a run of three", "go", "last card", "thirty-one". */
export type CribbagePeg = { seat: number; points: number; why: string[] };

/** What a hand's show is worth, by kind. */
export type CribbageCount = { fifteens: number; pairs: number; runs: number; flush: number; nobs: number; total: number };

/** One hand as it was shown: the dealer, the starter, both four-card hands and the crib, and what each counted. */
export type CribbageHandScore = {
  dealer: number;
  starter: CardId;
  hands: [CardId[], CardId[]];
  crib: CardId[];
  counts: [CribbageCount, CribbageCount];
  cribCount: CribbageCount;
};

/**
 * A GAME OF CRIBBAGE: its table and moves (what is kept, `KeptCardGame`), and
 * everything the moves make, read again from them whenever the game is. Two
 * seats; `size` is the score that wins, 61 or 121.
 */
export type CribbageGame = KeptCardGame<CribbageMove> & {
  /** Which hand this is, from 0: the deal goes to the other player each time. */
  deal: number;
  phase: CribbagePhase;
  /** The cards each seat still holds: six dealt, four kept, then played away in the pegging. */
  hands: CardId[][];
  /** The four cards each seat kept, as they will be shown. */
  kept: CardId[][];
  crib: CardId[];
  /** The card to be cut once the crib is laid: face down until then, so never shown. */
  cut: CardId;
  /** The starter, once cut. */
  starter: CardId | null;
  /** The pegging count, 0 to 31. */
  count: number;
  /** The cards played since the count last went back to nought. */
  run: CribbagePlay[];
  /** Every card played in the pegging this hand. */
  pegged: CribbagePlay[];
  /** What the last card played scored, if it scored. */
  peg: CribbagePeg | null;
  toPlay: number | null;
  scores: [number, number];
  /** Each hand shown, one row a hand. */
  results: CribbageHandScore[];
};
