import type { RuleVariant } from "./gomoku.types";
import type { BotTier } from "./opponent.types";

/**
 * How the graded computer players did against each other at one game, as it
 * was measured — the shapes behind `ladderStrength.data.ts`.
 *
 * A grade's name is one claim about forty-odd games, and it cannot know how it
 * plays any of them because nothing asks. This is the asking: a round robin at
 * one board, in memory, at the budget a real move is given, kept with the
 * fingerprint of the code that played it so a reader can tell a measurement of
 * today's players from a measurement of somebody else's.
 */

/** One pairing, from `first`'s side of the board. Colours alternated every game. */
export type LadderPairing = {
  first: BotTier;
  second: BotTier;
  wins: number;
  losses: number;
  draws: number;
};

/** One game's round robin. */
export type LadderMeasurement = {
  variant: RuleVariant;
  /** The board it was played on. */
  size: number;
  gamesPerPairing: number;
  /** Positions each side could weigh for a move, with the clock set out of reach. */
  nodesPerMove: number;
  /** The day it was measured, as `YYYY-MM-DD`. */
  measuredOn: string;
  /**
   * The code it measured: a hash over `LADDER_FINGERPRINT_FILES`. A row whose
   * fingerprint is not the current code's says nothing — see `measuredLadder`.
   */
  fingerprint: string;
  tiers: BotTier[];
  pairings: LadderPairing[];
};

/** Every game measured so far. A game that has never been measured has no row. */
export type LadderStrengthTable = Partial<Record<RuleVariant, LadderMeasurement>>;
