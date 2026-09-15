import { tally, openCount } from "./backlog";
import { BACKLOG_STATUSES, BOARD_SCOPES, SHOW_WORDS } from "./backlog.constants";
import type { BacklogItem, BoardQuery, BoardScope, StatusFilter } from "./backlog.types";

/**
 * WHICH ROWS A VIEW OF THE BOARD READS, AND WHAT IT MAY SAY ABOUT THE REST.
 *
 * The page used to read every row Sumilabu held on every load — 767 KB on the
 * live board with four hundred tickets, and about 8 ms of Sumilabu's CPU — to
 * show the forty or so that still want something. Now a view reads its scope:
 * what is unfinished by default, and done or dropped rows only when a reader
 * opens them. `pnpm task` already reads `?unfinished=1`; this is the page
 * asking the same.
 *
 * A SCOPE IS A WHOLE SET, NOT A PAGE. Everything unfinished comes back, or every
 * done row, or everything — so filtering, sorting and grouping inside a scope
 * is still done over the complete set it names, which is what keeps them honest
 * in the browser (see `BacklogBoard`).
 *
 * AND A COUNT IS SAID ONLY WHERE ITS ROWS WERE READ. With only the unfinished
 * rows in hand, "0 done" would be a number nothing counted. `countFor` answers
 * null for a status its scope does not cover, and the chip shows no number.
 */

/** The scope a filter needs read: its own set, or the unfinished one its sub-filters narrow. */
export function scopeOf(status: StatusFilter): BoardScope {
  if (status === BACKLOG_STATUSES.done) return BOARD_SCOPES.done;
  if (status === BACKLOG_STATUSES.dropped) return BOARD_SCOPES.dropped;
  if (status === BOARD_SCOPES.all) return BOARD_SCOPES.all;
  return BOARD_SCOPES.unfinished;
}

/** Whether the rows a scope read already hold everything a filter shows, so it can narrow in place. */
export function covers(scope: BoardScope, status: StatusFilter): boolean {
  return scope === BOARD_SCOPES.all || scopeOf(status) === scope;
}

/** What to ask Sumilabu for, for one scope. Nothing at all is the whole board. */
export function boardQuery(scope: BoardScope): BoardQuery {
  if (scope === BOARD_SCOPES.unfinished) return { unfinished: true };
  if (scope === BOARD_SCOPES.done) return { statuses: [BACKLOG_STATUSES.done] };
  if (scope === BOARD_SCOPES.dropped) return { statuses: [BACKLOG_STATUSES.dropped] };
  return {};
}

/**
 * The filter an address names in `?show=`. Absent, repeated past the first, or
 * a word this board does not have, it is the default view, which the chips then
 * show as the one pressed.
 */
export function statusFromAddress(value: string | string[] | undefined): StatusFilter {
  const word = Array.isArray(value) ? value[0] : value;
  if (word === undefined) return BOARD_SCOPES.unfinished;
  const found = (Object.entries(SHOW_WORDS) as [StatusFilter, string | null][]).find(([, said]) => said === word);
  return found === undefined ? BOARD_SCOPES.unfinished : found[0];
}

/**
 * The address of a filter, on whichever page the board is drawn — `/backlog`, or
 * Admin's work tab, whose own `view=work` is kept. The default view carries no
 * `show` at all, so the way back is the plain address.
 */
export function hrefFor(base: string, status: StatusFilter): string {
  const url = new URL(base, "http://board.invalid");
  const word = SHOW_WORDS[status];
  if (word === null) url.searchParams.delete("show");
  else url.searchParams.set("show", word);
  return `${url.pathname}${url.search}`;
}

/** How many rows a filter holds, or null where its rows were not read and no number would be true. */
export function countFor(items: readonly BacklogItem[], scope: BoardScope, status: StatusFilter): number | null {
  if (!covers(scope, status)) return null;
  if (status === BOARD_SCOPES.all) return items.length;
  if (status === BOARD_SCOPES.unfinished) return openCount(items);
  return tally(items)[status];
}
