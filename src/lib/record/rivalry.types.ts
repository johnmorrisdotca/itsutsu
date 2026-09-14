import type { Streak, StreakKind, StreakOutcome } from "@/lib/rating/streak";

import type { RIVALRY_MOMENTS } from "./rivalry.constants";

/**
 * As much of a game as a rivalry reads, and nothing more.
 *
 * `status` and `result` are here although the database read already asks for
 * finished, decided games only: the pure module checks them again, so a caller
 * that hands it a wider list — every game between two people, abandoned ones
 * included — gets the same answer rather than a record padded with games that
 * were never results.
 */
export type RivalryGame = {
  /** Only so the game just filed can be picked out of the pair's games. */
  id: string;
  playedAt: Date;
  variant: string;
  status: string;
  result: string;
  blackMemberId: string | null;
  whiteMemberId: string | null;
};

/** Whose side of a rivalry: the first-named member, or the other one. */
export type RivalrySide = "one" | "other";

/**
 * A head-to-head record, always from `one`'s side of the board.
 *
 * `lastPlayedAt` and `streak` are NULL for no games rather than the epoch and a
 * run of nought: "never" is a fact of its own, and a plausible date for it would
 * be read as a game that was played.
 */
export type RivalryTally = {
  wins: number;
  losses: number;
  draws: number;
  total: number;
  lastPlayedAt: Date | null;
  streak: Streak | null;
};

export type Rivalry = {
  /** The member whose side the tallies are read from. */
  one: string;
  other: string;
  /** Every finished, decided game between them, of any kind. */
  all: RivalryTally;
  /** The same, narrowed to one game — null when no game was asked about. */
  game: { variant: string; tally: RivalryTally } | null;
};

export type RivalryMoment = (typeof RIVALRY_MOMENTS)[keyof typeof RIVALRY_MOMENTS];

/** What the line is being chosen for. */
export type RivalryLineContext = {
  moment: RivalryMoment;
  now: Date;
  /**
   * How the game just filed went for `one` — only for the `after` moment, and
   * only for a game that reached a result. Without it "first win" cannot be
   * said, because nothing says which game was the one just played.
   */
  thisGame?: StreakOutcome | null;
};

/**
 * The ONE thing worth saying about a rivalry, as data rather than words.
 *
 * Words are the reader's language's business (`PHRASES`), and whether it says
 * "you" or a name depends on who is reading — neither belongs in a pure module
 * about a record. So this says WHICH fact, with the numbers, and the panel says
 * it.
 */
/** One side of the scoreboard, as a page shows them. */
export type RivalrySeat = {
  memberId: string;
  /** The whole name, which `PlayerName` shortens and links. */
  name: string;
  /** The level to badge beside them — a program's as much as a person's — or null for a total that is not a number. */
  level: number | null;
};

/** A tally crossing to the browser: the date as a string, since a `Date` does not survive it. */
export type RivalryTallyShown = Omit<RivalryTally, "lastPlayedAt"> & { lastPlayedAt: string | null };

/**
 * Everything the scoreboard draws, decided on the server.
 *
 * `readerIsOne` is the whole of "you": true only when the signed-in reader is
 * one of the two, and then they are always `one`. Anybody else reads both names.
 */
export type RivalryView = {
  one: RivalrySeat;
  other: RivalrySeat;
  readerIsOne: boolean;
  all: RivalryTallyShown;
  game: { variant: string; tally: RivalryTallyShown } | null;
  line: RivalryLine;
};

export type RivalryLine =
  | { kind: "never" }
  | { kind: "neverGame"; variant: string }
  | { kind: "gap"; unit: "months" | "years"; count: number }
  | { kind: "firstWin"; winner: RivalrySide }
  | { kind: "streak"; outcome: StreakKind; count: number }
  | { kind: "allDrawn" }
  | { kind: "tied"; score: number }
  | { kind: "lead"; leader: RivalrySide; ahead: number; behind: number };
