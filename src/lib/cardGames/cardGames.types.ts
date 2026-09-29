import type { Rank } from "../cards/cards.types";
import type { PartyRules } from "../party/party.types";

/**
 * THE FAMILY CARD GAMES' VOCABULARY: Hearts, Big Two, President, Go Fish and
 * Crazy Eights, each a party game (`PartyKind`) played round one device, with
 * a computer in any seat nobody sits in. Why they are party games, and how a
 * table plays them, is docs/plans/family-cards/README.md.
 */

/** A card by its short name: rank letter then suit letter, "QS", "TD", "AH" (`cards.ts`). */
export type CardId = string;

/** Clubs, diamonds, hearts, spades. */
export type CardSuit = "C" | "D" | "H" | "S";

/** The deck's rank, ace low: 1 is the ace, 11 the jack, 12 the queen, 13 the king. Each game orders them its own way. */
export type CardRank = Rank;

/** Who sits in each seat: the name the set-up gave, and whether a computer plays it. */
export type CardSeats = {
  players: readonly string[];
  /** One a seat: true where a computer plays it. A seat nobody named a computer for is a person's. */
  computers: readonly boolean[];
};

/**
 * WHAT EVERY FAMILY CARD GAME'S RULES ANSWER, beyond what every party game
 * does (`PartyRules`): whose move it is — a card game's turn is not always the
 * next seat round, since Hearts passes three cards seat by seat before a card
 * is played and Go Fish asks again after a catch — and what a computer in that
 * seat would do.
 *
 * `computer` sees what the player in that seat could see and nothing more:
 * their own hand, the cards on the table and everything said aloud (the moves
 * so far). Each game's computer reads a view built for it (`<game>View`), so
 * a player cannot be beaten by a program that looked at their hand; the tests
 * beside each computer hold that.
 */
export type CardGameRules<S, M> = PartyRules<S, M> & {
  /** The seat to move, or null once the game is over. */
  toPlay: (game: S) => number | null;
  /** The move a computer in the seat to move makes: always one of `moves(game)`. */
  computer: (game: S) => M;
  /** Who sits where, and which seats a computer plays. */
  seats: (game: S) => CardSeats;
};
