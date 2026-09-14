import type { FamilyStats, GameStats } from "@/lib/catalogue/catalogue.types";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/** What a game is won by: a line of this many, or turning discs. Derived from its spec. */
export type GameCardKind = "3" | "4" | "5" | "6" | "flips";

/** One game as the card view knows it: enough to show and enough to narrow by. */
export type GameCard = {
  variant: RuleVariant;
  label: string;
  kanji: string;
  tagline: string;
  inspiredBy?: string;
  kind: GameCardKind;
};

/**
 * One game as the families view knows it: the copy, which is a table in this
 * repository. What has been played of it is `GameStats`, handed down beside
 * the copy rather than inside it, because it comes from the database and is
 * shaped by who is reading — see `forReader`.
 */
export type CatalogueGame = {
  variant: RuleVariant;
  label: string;
  kanji: string;
  tagline: string;
  inspiredBy?: string;
};

/** A family as the catalogue shows it: the heading, the line under it, and its games. */
export type CatalogueFamily = {
  /** The family's identity, which is what its figures are keyed by. */
  key: string;
  title: string;
  kanji: string;
  blurb: string;
  games: CatalogueGame[];
};

/** The figures strip under one game, in any of the three views. */
export type GameStatsStripProps = {
  stats: GameStats;
  /** Whether the reader has a session: a way in to play, or a way to the door. */
  signedIn: boolean;
  /**
   * Card-sized: games played, the top player and the standings link, and no
   * date. The Cards view keeps its cards the size of a card.
   */
  compact?: boolean;
  /**
   * Whether the strip carries the game's standings link. True unless the view
   * already offers one beside the strip — the plain list's row of links does —
   * so a game never shows the same link twice.
   */
  standings?: boolean;
};

/**
 * A family's line on the Families view. No `signedIn`: it offers no way in of
 * its own, and whose name it may print arrived decided in `stats`.
 */
export type FamilyStatsLineProps = {
  stats: FamilyStats;
};
