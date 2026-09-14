import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";

/**
 * What the mixed plan is made from, and what it makes. See `botMix.ts`.
 */

/** One computer player's rated record, as read from the database it is about to write to. */
export type MixRecord = {
  tier: BotTier;
  /** Rated games in either pool. A computer player only ever plays in the computer pool. */
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
  /** The games it holds a rated standing at — where its record was made. */
  variants: readonly RuleVariant[];
};

/** Everything the planner reads from a database, and nothing it decides. */
export type MixFacts = {
  /**
   * Finished games per game. A game missing from this map has none — the
   * database was asked and answered nothing for it, which is a count of zero
   * and not an unknown.
   */
  finishedByVariant: Partial<Record<RuleVariant, number>>;
  records: readonly MixRecord[];
};

/** A game the computer players cannot be trusted to finish, and why. */
export type MixLeftOut = { variant: RuleVariant; reason: string };

/** A board size too slow to draw for a game on one machine, and why. */
export type MixSizeCap = { variant: RuleVariant; size: number; reason: string };

/** Why a game is in the plan. */
export type MixWhy =
  /** Nobody has finished a game of this here. */
  | { kind: "unplayed" }
  /** A computer player with no losses, sent to a game away from the ones it has been winning. */
  | { kind: "undefeated"; tier: BotTier };

export type MixMatch = {
  variant: RuleVariant;
  size: number;
  black: BotTier;
  white: BotTier;
  why: MixWhy;
};

export type MixOptions = {
  seed: number;
  /** Who may be drawn to play. Default: all seven — the five grades and both specialists. */
  players: readonly BotTier[];
  /** How many games each unplayed game gets: between these, inclusive. */
  unplayedGames: { fewest: number; most: number };
  /** How many games each undefeated player is sent to. */
  undefeatedGames: number;
  leftOut: readonly MixLeftOut[];
  sizeCaps: readonly MixSizeCap[];
};

export type MixPlan = {
  seed: number;
  matches: readonly MixMatch[];
  /** Every game with no finished games, playable or not. */
  unplayed: readonly RuleVariant[];
  /** Unplayed games the plan could not include, with the reason. */
  unplayedLeftOut: readonly MixLeftOut[];
  /** The players found undefeated, and the games each was allowed to be sent to. */
  undefeated: readonly { record: MixRecord; awayFrom: readonly RuleVariant[]; sentTo: number }[];
};
