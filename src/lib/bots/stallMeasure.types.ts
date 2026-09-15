import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";

/**
 * Each colour's running step toward home, ply by ply: the arithmetic
 * `racingStalled` does over one window, done once over a whole game so any
 * window can be read off it by subtraction.
 */
export type RaceLedger = {
  /** `black[n]`: black's summed change in distance home over the first n plies. Negative is nearer; index 0 is 0. */
  black: number[];
  /** The same for white. */
  white: number[];
  /** `unsteps[n]`: plies among the first n with no `from`. A window holding one never fires, as `racingStalled` reads it. */
  unsteps: number[];
};

/** The longest window over which the racing rule would have fired, and the first ply such a window ended on. */
export type LongestStall = { plies: number; endsAt: number };

/** One game the runner played with the rule lifted, as its report reads it. */
export type PlayedRace = {
  black: BotTier;
  white: BotTier;
  seed: number;
  /** `won`; `stuck` when the side to move had no turn at all; `unfinished` when the runner's ceiling stopped it. */
  outcome: "won" | "stuck" | "unfinished";
  winner: Stone | null;
  plies: number;
  /** Pieces each colour had in the camp it was filling when the game stopped. */
  home: { black: number; white: number };
  longest: LongestStall | null;
  /** For each cap checked, the move count at which it would first have drawn the game, or null for never. */
  firing: Record<number, number | null>;
  millis: number;
};

/** One game that was won, as the recommendation reads it. */
export type MeasuredGame = {
  /** Its longest stall in plies, or 0 when no window of any length would have fired. */
  longest: number;
  /** Whether the cap in force would have called it off before it was won. */
  endedByCurrentCap: boolean;
};

/**
 * What the measurement says about the cap.
 *
 * `keep`        no won game would have been called off, and the cap is at least the margin over the longest stall
 * `thin`        no won game would have been called off, but the cap is under that margin
 * `raise`       the cap would have called off a game that was then won
 * `unmeasured`  no game was won, so there is nothing to calibrate on
 */
export type CapVerdict = "keep" | "thin" | "raise" | "unmeasured";

export type CapRecommendation = {
  verdict: CapVerdict;
  currentCap: number;
  /** The longest stall in any won game, or null when none was won. */
  longest: number | null;
  wonGames: number;
  wonGamesEnded: number;
  margin: number;
  /** The margin over the longest stall, rounded up; null where the verdict needs no number. */
  suggested: number | null;
  why: string;
};
