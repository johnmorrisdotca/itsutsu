/**
 * FREECELL: the vocabulary of its table.
 *
 * A card is its place in a fresh deck, 0 to 51, as Klondike's are
 * (`solitaire/solitaire.types.ts`): suit × 13 + rank − 1, numbers rather than
 * objects because the solver makes and compares a great many tables.
 */

export type FreeCellTable = {
  /** Eight columns, each its cards from the bottom up. Every card is face up. */
  tableau: readonly (readonly number[])[];
  /** The free cells, one card or none each: four in the classic game, fewer to make it harder. */
  cells: readonly (number | null)[];
  /** How many cards are home on each suit's foundation, in `SUITS` order: its top card is that rank. */
  foundation: readonly number[];
};

/**
 * A place on the table a move names: a column `1`–`8`, a free cell `a`–`d`,
 * or a suit's foundation by its letter (`S` `H` `D` `C`, as a card id writes a suit).
 */
export type FreeCellPile = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "a" | "b" | "c" | "d" | "S" | "H" | "D" | "C";

/**
 * One move: `count` cards carried from one pile to another. Only a column to
 * a column ever carries more than one, and then the cards are the top of the
 * column, in order, and as many as the free cells and empty columns could
 * carry one at a time (`mostCarried`).
 */
export type FreeCellMove = { from: FreeCellPile; to: FreeCellPile; count: number };
