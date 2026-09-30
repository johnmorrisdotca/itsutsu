import type { CardSeats } from "@johnmorrisdotca/toranpu";

import type { PartyRules } from "../party/party.types";

/**
 * THE FAMILY CARD GAMES' VOCABULARY: Hearts, Big Two, President, Go Fish and
 * Crazy Eights, each a party game (`PartyKind`) played round one device, with
 * a computer in any seat nobody sits in. Why they are party games, and how a
 * table plays them, is docs/plans/family-cards/README.md.
 *
 * The cards and every game's rules and computer player are Toranpu, the
 * open-source card package in packages/toranpu; this is where the site seats
 * them at its party tables.
 */
export type { CardId, CardRank, CardSeats, CardSuit } from "@johnmorrisdotca/toranpu";

/**
 * WHAT EVERY FAMILY CARD GAME'S RULES ANSWER at a party table: what every
 * party game does (`PartyRules`), and what Toranpu's rules add — whose move it
 * is, what a computer in that seat would do, and who sits where. Toranpu's
 * `CardGameRules` meets this as it is, so a card game is a party game with no
 * adapter between them.
 */
export type CardGameRules<S, M> = PartyRules<S, M> & {
  /** The seat to move, or null once the game is over. */
  toPlay: (game: S) => number | null;
  /** The move a computer in the seat to move makes: always one of `moves(game)`. */
  computer: (game: S) => M;
  /** Who sits where, and which seats a computer plays. */
  seats: (game: S) => CardSeats;
};
