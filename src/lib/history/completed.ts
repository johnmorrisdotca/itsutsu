import type { MyTable } from "@/lib/party/online/server/myTables";
import type { MySolve } from "@/lib/puzzles/server/mySolves";

import type { HistoryEntry } from "./everyGame.types";
import type { MyGame } from "./myGames.types";

/**
 * THE COMPLETED TAB IS ONE LIST. John, 2026-09-30: "Complete games page should
 * list everything together. Right now it's grouped so need to go down low to
 * see some stuff. We don't want things buried." It was the finished games,
 * then the finished tables under them, with the puzzles in a column beside
 * (below, on a phone). Now every kind of finished game is one row in one list,
 * newest first by when it ended: games between two seats, tables on several
 * devices, games passed round one screen, and puzzles, each drawn by its own
 * row so nothing it said before is lost.
 *
 * Paged by time: each kind is read a page deep strictly before the page's
 * start, the four are merged and cut to a page, and the next page starts
 * before the last row shown, the way `everyGame.ts` pages the History tab.
 */
export type CompletedRow =
  | { kind: "game"; at: string; key: string; item: MyGame }
  | { kind: "table"; at: string; key: string; table: MyTable }
  | { kind: "device"; at: string; key: string; entry: HistoryEntry }
  | { kind: "solve"; at: string; key: string; solve: MySolve };

/** A page of the one list, and where the next begins (an ISO time), or null on the last. */
export type CompletedPage = { rows: CompletedRow[]; next: string | null };

/** Where an address asks the list to start, or null for the newest: a time handed out as `next`, anything else ignored. */
export function completedBefore(asked: string | null): Date | null {
  if (asked === null) return null;
  const at = new Date(asked);
  return Number.isNaN(at.getTime()) || at.toISOString() !== asked ? null : at;
}

/** Each kind's rows, tagged with when they ended. */
export function completedRows(parts: {
  games: readonly MyGame[];
  tables: readonly MyTable[];
  device: readonly HistoryEntry[];
  solves: readonly MySolve[];
}): CompletedRow[] {
  return [
    ...parts.games.map((item) => ({ kind: "game" as const, at: item.since, key: `game:${item.game.id}`, item })),
    ...parts.tables.map((table) => ({ kind: "table" as const, at: table.endedAt ?? table.movedAt, key: `table:${table.id}`, table })),
    ...parts.device.map((entry) => ({ kind: "device" as const, at: entry.at, key: entry.key, entry })),
    ...parts.solves.map((solve) => ({ kind: "solve" as const, at: solve.finishedAt.toISOString(), key: `solve:${solve.id}`, solve })),
  ];
}

/**
 * The page: every row newest first, cut to `limit`. `more` says whether any
 * kind had rows past its own page; the list goes on when it did, or when the
 * merge itself had more than a page.
 */
export function mergeCompleted(rows: readonly CompletedRow[], limit: number, more: boolean): CompletedPage {
  const sorted = [...rows].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const shown = sorted.slice(0, limit);
  const last = shown.at(-1);
  return { rows: shown, next: last !== undefined && (sorted.length > limit || more) ? last.at : null };
}
