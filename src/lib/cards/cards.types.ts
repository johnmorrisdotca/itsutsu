/**
 * THE VOCABULARY OF A DECK OF PLAYING CARDS, for every card game on the site.
 *
 * One deck, fifty-two cards, four suits of thirteen ranks: Solitaire deals it
 * first, and the family card games (Hearts, Big Two, President, Go Fish, Crazy
 * Eights) deal the same one. Nothing here knows any game's rules; a game keeps
 * its own state and names cards by these.
 */

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";

/** Ace is 1 and King 13. A game that ranks the ace high (Hearts, Big Two) says so in its own rules. */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/** A suit's colour, which Klondike's alternating runs and Crazy Eights' matches both read. */
export type SuitColour = "red" | "black";

export type Card = { suit: Suit; rank: Rank };

/**
 * A card as ONE character, `A`–`Z` then `a`–`z` (`cardCode`): a whole deck is a
 * fifty-two-character string, so a deal travels in a kept run, a puzzle's
 * givens and a move list without any separator to parse.
 */
export type CardCode = string;

/** How a suit is written and drawn. */
export type SuitDisplay = {
  /** The Unicode suit, for a sentence or an aria label: ♠ ♥ ♦ ♣. */
  symbol: string;
  /** Its name in English, lower case, as a sentence uses it. */
  name: string;
  colour: SuitColour;
};

/** How a rank is written: `A`, `2`…`10`, `J`, `Q`, `K`, and in a sentence. */
export type RankDisplay = { short: string; name: string };
