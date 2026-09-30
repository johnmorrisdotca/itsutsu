import type { Rank } from "../cards/cards.types.ts";

/**
 * THE CARD GAMES' VOCABULARY: Hearts, Spades, Euchre, Cribbage, Crazy Eights,
 * Go Fish, Big Two, President and Gin Rummy, each a table of people and
 * computers in any mix, and every one answering the same questions
 * (`CardGameRules`), so one table can play any of them.
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
 * WHAT EVERY CARD GAME'S RULES ANSWER, whatever the game. `S` is a game in
 * progress and `M` one move in it; both are plain data, so a game can be
 * kept, sent or compared as it is.
 *
 * Every function is pure: it returns a new game and leaves the one it was
 * given alone.
 *
 * `computer` sees what the player in that seat could see and nothing more:
 * their own hand, the cards on the table and everything said aloud (the moves
 * so far). Each game's computer reads a view built for it (`<game>View`), so
 * a player cannot be beaten by a program that looked at their hand; the tests
 * beside each computer hold that.
 */
export type CardGameRules<S, M> = {
  /**
   * A new game for these players (one name a seat) at this size, or null for
   * a table the game is not offered for. `size` is how long the game lasts in
   * its own terms (`CARD_GAME_TABLES`). The deal is shuffled from `seed`, so a
   * seed and the moves make the same game again anywhere; `computers` says,
   * one a seat, which seats a computer plays. The third argument is unused and
   * reserved: it keeps the signature of a table of games that are played in a
   * language (a word game), so these rules sit in such a table unchanged.
   */
  start: (size: number, players: readonly string[], _reserved?: unknown, seed?: number, computers?: readonly boolean[]) => S | null;
  /** Every move the player to move may make now; none once the game is over. */
  moves: (game: S) => readonly M[];
  /** The game after that move, or null for a move that may not be made. */
  play: (game: S, move: M) => S | null;
  over: (game: S) => boolean;
  /** On a game that is over, every seat that won: more than one for a partnership or a tie. */
  winners: (game: S) => readonly number[];
  /** The game as text: its table, seed and moves, never a hand (`cardGameCodec`). */
  encode: (game: S) => string;
  /** Text read back into the game it records, or null for anything these rules cannot play out again. */
  decode: (text: string | null) => S | null;
  /** The seat to move, or null once the game is over. */
  toPlay: (game: S) => number | null;
  /** The move a computer in the seat to move makes: always one of `moves(game)`. */
  computer: (game: S) => M;
  /** Who sits where, and which seats a computer plays. */
  seats: (game: S) => CardSeats;
  /**
   * For a game a player choosing uniformly at random would almost never
   * finish (Gin Rummy, where random play rarely knocks), a random move a
   * sensible player might make, for tests and simulations. Always one of
   * `moves(game)`. Absent where random play ends by itself.
   */
  sensible?: (game: S, random: () => number) => M;
};
