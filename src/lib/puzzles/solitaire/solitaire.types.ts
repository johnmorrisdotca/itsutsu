/**
 * KLONDIKE, the Solitaire: the vocabulary of its table.
 *
 * A card is its place in a fresh deck, 0 to 51 (`cardIndex` in
 * `lib/cards/deck.ts`): suit × 13 + rank − 1. Numbers, not objects, because
 * the solver makes and compares hundreds of thousands of tables, and a table
 * is a handful of short arrays of them.
 */

/** One of the seven columns: its cards from the bottom up, of which the first `down` lie face down. */
export type KlondikeColumn = { down: number; cards: readonly number[] };

/** How the game was set up: cards turned from the stock at a time, and how many times through the stock (Infinity for no limit). */
export type KlondikeRules = { draw: 1 | 3; passes: number };

export type KlondikeTable = {
  rules: KlondikeRules;
  /** Seven columns. */
  tableau: readonly KlondikeColumn[];
  /** Face down; the top card, the next to turn, is the LAST. */
  stock: readonly number[];
  /** Face up beside the stock; the top card, the one that can be played, is the LAST. */
  waste: readonly number[];
  /** How many cards are home on each suit's foundation, in `SUITS` order: its top card is that rank. */
  foundation: readonly number[];
  /** How many times the waste has been turned back into the stock. */
  recycles: number;
};

/**
 * A place on the table a move names: the stock `s`, the waste `w`, a suit's
 * foundation by its letter (`S` `H` `D` `C`, as a card id writes a suit), or
 * a column `1`–`7`.
 */
export type KlondikePile = "s" | "w" | "S" | "H" | "D" | "C" | "1" | "2" | "3" | "4" | "5" | "6" | "7";

/**
 * One move: turn cards from the stock (`draw`), turn the waste back over
 * (`recycle`), or carry cards from one pile to another. Which cards a carry
 * takes is never written, because the rules decide it: one card from the waste
 * or a foundation or to a foundation, and from column to column the one run
 * whose foot fits where it lands — a column's face-up cards are always a
 * single run, so there is only ever one.
 */
export type KlondikeMove = { kind: "draw" } | { kind: "recycle" } | { kind: "carry"; from: KlondikePile; to: KlondikePile };
