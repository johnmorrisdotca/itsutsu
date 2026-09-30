import type { GameKey } from "@/lib/catalogue/gameKeys";

/**
 * How a game in somebody's history stands, from their side of it:
 *
 * - `yourMove` / `theirMove`: going, and waiting on them or on somebody else;
 * - `going`: going with nobody in particular to wait on — a game on one device,
 *   a puzzle part way;
 * - `won`, `lost`, `drawn`, `shared` (a win shared at a table of several);
 * - `ended`: stopped by a player with nobody winning;
 * - `left`: put away half way, or abandoned;
 * - `solved` / `unsolved`: a puzzle finished, or one whose guesses or time ran out.
 */
export type HistoryState = "yourMove" | "theirMove" | "going" | "won" | "lost" | "drawn" | "shared" | "ended" | "left" | "solved" | "unsolved";

/** Where a game in the history came from: a game between two seats, a table on several devices, a game on one device, a puzzle finished or part way. */
export type HistorySource = "game" | "table" | "device" | "solve" | "run";

/** Somebody else who played in it: a name, and the member behind it where there is one. */
export type HistoryPlayer = { name: string; memberId: string | null; computer: boolean };

/** One game in a member's history, whatever kind of game it is. */
export type HistoryEntry = {
  /** Unique across every source: the source and the row's id. */
  key: string;
  source: HistorySource;
  game: GameKey;
  state: HistoryState;
  /** The last thing that happened in it, ISO. */
  at: string;
  /** Where it opens: to be looked at when it is over, carried on with when it is not. */
  href: string;
  /** Everybody else in it, in seat order. */
  others: HistoryPlayer[];
};

/** A page of somebody's history, newest first, and where the next page starts (an ISO time), or null at the end. */
export type HistoryPage = { entries: HistoryEntry[]; next: string | null };
