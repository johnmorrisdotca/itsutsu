import type { PieceCell, Point, Stone, Twist } from "./gomoku.types";

/**
 * The computer opponent: what a turn looks like when a program takes one, and
 * how strongly it is meant to be taken.
 *
 * Kept beside the engine and above it, the same way `analysis.ts` is: nothing
 * here decides what is legal or who has won. Every candidate is offered to the
 * engine and every outcome is read back from it, so a tier is a way of
 * choosing between legal turns and never a way of playing an illegal one.
 */

/**
 * The three graded players, named the way the board games they come from
 * grade people: 級 for the learner, 段 for the graded player, 名人 for the
 * master. The order here is the order of strength.
 */
export type BotTier = "kyu" | "dan" | "meijin";

/**
 * One whole turn, in the shapes a turn can take across these games.
 *
 * A twist rides on the placement that owes it rather than being a turn of its
 * own: the quarter turn changes whether the stone just played wins, so the two
 * are one decision and have to be made together.
 */
export type BotTurn =
  | {
      kind: "place";
      row: number;
      col: number;
      /** The colour to lay, in the games where the mover chooses it. */
      stone?: Stone;
      twist?: Twist;
    }
  | { kind: "move"; from: Point; row: number; col: number }
  | { kind: "piece"; cells: PieceCell[] }
  | { kind: "pass" };

/** How hard a tier tries, in the knobs the chooser actually reads. */
export type TierSpec = {
  /**
   * How far it looks. 1 is its own move only; 2 asks what the opponent could
   * do in reply. Nothing here searches deeper than that — a turn-based site
   * has to answer a request, and two plies of a checked, spec-driven reading
   * is a stronger opponent than four plies of a guess.
   */
  depth: 1 | 2;
  /**
   * The chance it notices, this turn, that the opponent is about to win. Rolled
   * once per turn rather than per candidate, so a tier that misses a threat
   * misses it consistently instead of half-blocking it.
   */
  guard: number;
  /** The chance it throws the turn away on a legal move picked at random. */
  blunder: number;
  /** How much of the heuristic's spread is drowned in noise, as a share of it. */
  noise: number;
  /** Whether it reads the threat ladder where the game's shape allows one. */
  reads: boolean;
  /** How many candidates it will weigh, so the work a request does is bounded. */
  width: number;
  /**
   * How many of the best it looks a reply ahead for. The reply itself is
   * always read in full — a half-read reply is a wrong answer, not a weaker
   * one, and how *often* a tier looks is already what `guard` says.
   */
  guardTop: number;
  /**
   * How many plies it looks ahead in the games where looking ahead means
   * something, or 0 for a grade that does not search at all. This is the whole
   * difference between a player who does not blunder and a player who is
   * strong: seeing the four that forces a reply, and the three waiting behind
   * it.
   */
  searchDepth: number;
};

/** How a graded player is named and introduced. */
export type BotProfile = {
  tier: BotTier;
  /** The name it plays under: its member name, and what the record shows. */
  name: string;
  kanji: string;
  /** The tier in the words a player choosing an opponent needs. */
  strength: string;
  blurb: string;
};

/**
 * What a look-ahead may spend.
 *
 * Two limits, and either alone is enough to stop it. In a running game the
 * clock is the one that binds: a move has to come back inside a request, and
 * how many positions that buys depends on the board, the variant and what else
 * the machine is doing. In a test it is the node count that binds, with the
 * clock set far out of reach — because a search bounded by a clock reaches a
 * different depth on a loaded machine than on an idle one, and a test whose
 * answer depends on how busy the laptop is will pass all week and fail in the
 * one run that mattered. It did exactly that, once, before this existed.
 */
export type SearchBudget = {
  /** Wall clock, in milliseconds. */
  millis?: number;
  /** Positions visited. */
  nodes?: number;
};
