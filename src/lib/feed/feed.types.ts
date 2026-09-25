import type { FeedKind, FeedOutcome } from "./feed.constants";

/** Somebody a line names: a member by id, or a name a seat was played under with nobody behind it. */
export type FeedPerson = {
  memberId: string | null;
  name: string;
};

/** What every line carries. `at` is an ISO string, so a line crosses to the browser as it is. */
type FeedLine<K extends FeedKind> = {
  kind: K;
  /** Stable across reads, for React's key and a spec's handle. */
  id: string;
  at: string;
  /** Who the line is about. */
  who: FeedPerson;
  /** Whether that is the reader, which chooses "You beat…" over "Hanako beat…". */
  you: boolean;
};

export type FeedGameEntry = FeedLine<"game"> & {
  gameId: string;
  variant: string;
  other: FeedPerson;
  outcome: FeedOutcome;
};

export type FeedStartedEntry = FeedLine<"started"> & {
  gameId: string;
  variant: string;
  /** Null while the other seat is still waiting for somebody. */
  other: FeedPerson | null;
};

export type FeedXpEntry = FeedLine<"xp" | "credited"> & { points: number };

export type FeedLevelEntry = FeedLine<"level"> & { level: number };

export type FeedPuzzlesEntry = FeedLine<"puzzles"> & { variant: string; count: number };

export type FeedEntry = FeedGameEntry | FeedStartedEntry | FeedXpEntry | FeedLevelEntry | FeedPuzzlesEntry;

/** One day of the feed, newest first, in the reader's own zone. */
export type FeedDay = { day: string; entries: FeedEntry[] };

/** A seat of a game, as the feed reads it: who, under what name, and whether they hid the game. */
export type FeedSeat = {
  memberId: string | null;
  name: string;
  hidden: boolean;
};

/** A game row, reduced to what a line needs. */
export type FeedGameRow = {
  id: string;
  variant: string;
  /** "active" or "finished". */
  status: string;
  /** "black", "white", "draw" or "abandoned". */
  result: string;
  winner: string | null;
  playedAt: Date;
  lastMoveAt: Date | null;
  black: FeedSeat;
  white: FeedSeat;
};

/** One member's experience on one of their days, split into earned here and credited from elsewhere. */
export type FeedXpDay = {
  memberId: string;
  dayKey: string;
  points: number;
  imported: boolean;
  lastAt: Date;
};

/** One kept puzzle solve. */
export type FeedSolve = {
  id: string;
  memberId: string;
  kind: string;
  finishedAt: Date;
};

/**
 * What the Everyone tab needs to know about a member in a seat. Null for a
 * seat nobody is behind, or a member the read could not find.
 */
export type FeedSeatStanding = {
  ageBand: string | null;
  botTier: string | null;
} | null;
