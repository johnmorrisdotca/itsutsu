/**
 * THE VOCABULARY OF HITOTSU 一つ, the site's colour-card shedding game: our
 * own deck of four colours, numbers and action cards, and the familiar play —
 * match the colour or the number, skip, reverse, draw two, wild, wild draw
 * four, and the call when a player is down to one card. How it is played is
 * `hitotsu.ts`; why it is ours and not a copy of the boxed game is
 * docs/plans/hitotsu/README.md.
 */

/** A card's colour: red, yellow, green or blue. A wild card has none until it is played and one is called. */
export type HitotsuColour = "R" | "Y" | "G" | "B";

/**
 * A card by its short name: its colour letter (`W` for a wild), its face — a
 * digit, `S` skip, `R` reverse, `D` draw two, `W` wild, `F` wild draw four —
 * and which copy of that card it is, so the two red fives are `R50` and `R51`.
 * Two cards are the same card to play when their first two letters are.
 */
export type HitotsuCard = string;

/** How the house plays: each popular variant, as a choice at the set-up. */
export type HitotsuOptions = {
  /**
   * Stacking a draw card on a draw card, so the next player takes the total:
   * never (the published rule), a Draw Two on a Draw Two and a Wild Draw Four
   * on a Wild Draw Four, or any draw card on any (progressive draw).
   */
  stacking: "off" | "same" | "any";
  /** Jump-in: a card identical to the one on top may be played out of turn, and play goes on from whoever played it. */
  jumpIn: boolean;
  /** Sevens and zeros: a seven swaps hands with a player of your choice, a zero passes every hand on round the table. */
  sevenZero: boolean;
  /** Draw until you can play, rather than one card. */
  drawToMatch: boolean;
  /**
   * The Wild Draw Four: playable any time, and challengeable by the player it
   * lands on (the published rule), or only when you hold nothing of the
   * colour, and never challenged (no bluffing).
   */
  wildFour: "challenge" | "strict";
  /** Cards dealt to each player: seven, or five in party mode. */
  deal: 7 | 5;
};

/** One move: a card played, a draw, a turn passed, a pending draw taken, a Wild Draw Four challenged, or a card played out of turn. */
export type HitotsuMove =
  | {
      play: HitotsuCard;
      /** The colour a wild card calls. */
      colour?: HitotsuColour;
      /** The seat a seven swaps hands with, when sevens and zeros are played. */
      swap?: number;
      /** "Hitotsu!", called as the second-last card goes down. */
      call?: boolean;
    }
  | { draw: true }
  | { pass: true }
  | { take: true }
  | { challenge: true }
  | { jump: HitotsuCard; seat: number; colour?: HitotsuColour; swap?: number; call?: boolean };

/** Something that happened in the last move, for the table to say: nothing a player could not have seen. */
export type HitotsuNews =
  | { kind: "caught"; seat: number }
  | { kind: "took"; seat: number; count: number }
  | { kind: "challenge"; seat: number; by: number; guilty: boolean }
  | { kind: "swap"; seat: number; with: number }
  | { kind: "rotate"; direction: 1 | -1 }
  | { kind: "jump"; seat: number }
  | { kind: "skipped"; seat: number }
  | { kind: "reversed" }
  | { kind: "drew"; seat: number; count: number };

/** How a hand ended: who won it and what they scored, or who held least when nobody could go on. */
export type HitotsuResult = { winners: number[]; points: number; blocked: boolean };

/** A Wild Draw Four the player to move may challenge: who played it, and whether they held a card of the colour it was played on. */
export type HitotsuChallenge = { by: number; bluffed: boolean };

/**
 * A GAME OF HITOTSU: its table and moves (what is kept), and the hand they
 * have reached. `size` is the score that wins — 200 or 500 — or 1 for a game
 * of a single hand.
 */
export type HitotsuGame = {
  size: number;
  players: readonly string[];
  computers: readonly boolean[];
  seed: number;
  options: HitotsuOptions;
  moves: readonly HitotsuMove[];
  /** Which hand this is, from 0: it decides who plays first. */
  hand: number;
  phase: "playing" | "over";
  hands: HitotsuCard[][];
  /** Face down, top card first. */
  stock: HitotsuCard[];
  /** Face up, top card last. */
  discard: HitotsuCard[];
  /** The colour to follow: the top card's, or the one a wild called. */
  colour: HitotsuColour;
  /** 1 round the table to the left, -1 after a reverse. */
  direction: 1 | -1;
  toPlay: number | null;
  /** The card the player to move has just drawn, the only one they may now play; null before they draw. */
  drawn: HitotsuCard | null;
  /** Cards the player to move must take unless they stack a draw card on them. */
  pending: number;
  /** The last draw card stacked, for "same card" stacking: `D` or `F`. */
  pendingFace: "D" | "F" | null;
  challenge: HitotsuChallenge | null;
  /** Turns passed in a row with nothing to play or draw: when every player has, the hand is blocked. */
  passes: number;
  /** How many times the discards have been shuffled into a new stock this hand. */
  turnovers: number;
  scores: number[];
  results: HitotsuResult[];
  /** What the last move did, beyond the card itself. */
  news: HitotsuNews[];
};
