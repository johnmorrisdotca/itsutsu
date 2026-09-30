/**
 * SPIDER: the vocabulary of its table.
 *
 * Two decks, a hundred and four cards, and a card is its place in a fresh
 * deck, 0 to 51, as Klondike's are (`solitaire/solitaire.types.ts`): the two
 * decks are simply every number twice. Played with fewer suits, the missing
 * suits' cards are more of the ones kept: one suit is eight sets of spades,
 * two suits four each of spades and hearts.
 */

/** One of the ten columns: its cards from the bottom up, of which the first `down` lie face down. */
export type SpiderColumn = { down: number; cards: readonly number[] };

export type SpiderTable = {
  /** Ten columns. */
  tableau: readonly SpiderColumn[];
  /** The cards still to be dealt, ten at a time, in the order they will be dealt. */
  stock: readonly number[];
  /** The suit of each full run taken off the table, King down to Ace, in the order they were made: eight is a won game. */
  done: readonly number[];
};

/**
 * One move: deal a card from the stock onto every column (`deal`), or carry
 * `count` cards from the top of one column onto another. Columns are named
 * `0` to `9`, from the left.
 */
export type SpiderMove = { kind: "deal" } | { kind: "carry"; from: number; to: number; count: number };
