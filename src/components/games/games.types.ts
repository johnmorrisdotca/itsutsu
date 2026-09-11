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
 * One game as the families view knows it.
 *
 * The counts are separate from the copy because they come from a different
 * place and can be absent: the copy is a table in this repository and is always
 * there, and the counts are rows in a database that a reader with no session
 * is not shown at all.
 */
export type CatalogueGame = {
  variant: RuleVariant;
  label: string;
  kanji: string;
  tagline: string;
  inspiredBy?: string;
  /** How many games of it have been played here, when that is known. */
  played?: number;
  /** The most recent one, when there is one. */
  last?: { id: string; blackName: string; whiteName: string };
};

/** A family as the catalogue shows it: the heading, the line under it, and its games. */
export type CatalogueFamily = {
  title: string;
  kanji: string;
  blurb: string;
  games: CatalogueGame[];
  /** Games of this family played here, summed. */
  played: number;
};
