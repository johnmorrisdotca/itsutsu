import type { RuleVariant } from "./gomoku.types";

/** A family of games: an identity (`key`), its words, and the games whose home it is. */
export type GameFamily = {
  /** Chosen once and never changed; the XP ledger stores it. */
  key: string;
  title: string;
  kanji: string;
  blurb: string;
  /** The games whose HOME this family is, in load-bearing order: the first is the one a click lands on. */
  games: RuleVariant[];
};

/** A shelf a game is also shown on, by the family's key, and why it belongs there. */
export type AlsoListing = { family: string; why: string };

/**
 * One game on a family's shelf. At home there, or a guest from its own family —
 * and a guest always knows which, so the shelf can say "also under" it.
 */
export type ShelvedGame = { variant: RuleVariant; listed: "home" } | { variant: RuleVariant; listed: "shelf"; home: GameFamily };
