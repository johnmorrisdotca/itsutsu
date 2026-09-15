import Link from "next/link";

import { PlayerName } from "@/components/players/PlayerName";
import { CELL, HEAD, ROW_CLASS, TABLE_CLASS, TABLE_HEAD_CLASS } from "@/components/players/PlayerRecord";
import { ariaSort, sortHref } from "@/lib/api/paging";
import type { SortChoice, SortColumn, SortSpec } from "@/lib/api/paging.types";
import { countText } from "@/lib/rating/figures";
import type { RecordScope } from "@/lib/rating/recordScope";
import type { XpBoardRow } from "@/lib/xp/xpBoard";
import { xpBoardSortSpec } from "@/lib/xp/xpBoard.sort";
import { xpDayKey } from "@/lib/xp/xpDay";
import { xpLevelFor } from "@/lib/xp/xpCurve";
import { xpBehindText, xpGainText, xpGapsFor, type XpGain } from "@/lib/xp/xpGains";

import { LevelName } from "./LevelName";

/**
 * THE XP LEADERBOARD'S TABLE.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS IS NOT `RecordTable`, WHICH IS THE ONE TABLE OF RECORDS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `RecordTable` owns every table of RECORDS on this site and it should: the
 * ladder, the members list, the computer players and every per-game standing
 * draw the same ten columns in the same order, and John asked for that
 * consistency by name. It does not fit here, and the reason is its own argument
 * rather than a preference.
 *
 * Its columns are `played · W · L · D · win rate · streak · rating · tier ·
 * joined`, and a caller may switch off exactly three of them — tier, joined and
 * rating. A leaderboard row is `rank · member · level · XP · last earned`: it
 * shares the subject and not one figure. Drawn through `RecordTable` it would
 * carry six columns of em dashes, and that file's own header says what that is:
 * *"A column of dashes is not a smaller truth, it is a column that says
 * nothing."* Switching them off is not offered, and offering it would mean
 * editing a table five other pages draw from.
 *
 * The headings are the same story one layer down. `RecordSortSlots` has nine
 * named slots — `played`, `won`, `lost`, `drawn`, `winRate`, `streak`, `rating`,
 * `tier`, `joined` — and no slot for XP, a level or a date earned. There is no
 * way to express a sortable XP heading through `SortableHead` without widening
 * that type, in a directory this branch must not touch, for a table it does not
 * draw.
 *
 * **So what is reused is the CONVENTION rather than the component**, which is
 * the part that must not be built twice: `sortHref` and `ariaSort` come from
 * `lib/api/paging.ts`, the cursor and the envelope come from the same module the
 * ladder and the record use, and the five class strings come from
 * `PlayerRecord.tsx` so the columns line up with every other table on the site.
 * Nothing about sorting or paging is decided in this file.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A HEADING IS A LINK, NOT A BUTTON
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The same three reasons `recordSort.tsx` gives, and they are worth repeating
 * because they are why sorting could never be component state: the sort is in
 * the address, so a sorted view can be linked, bookmarked and read with no
 * JavaScript; it therefore pages correctly, where a client-side sort of the rows
 * already loaded would reorder twenty-five of however many and present the
 * result as the board; and an anchor is keyboard-reachable for free.
 */

/** One heading: a link where the board can order by it, plain text where it cannot. */
function SortHead({
  spec,
  current,
  at,
  query,
  param,
  children,
  title,
}: {
  spec: SortSpec<string>;
  current: SortChoice<string>;
  /** The address this table lives at — where a press lands. */
  at: string;
  /** Everything else in the query, so a press keeps it. */
  query: string;
  /** The spec's word for this column, or null for a column nothing can order by. */
  param: string | null;
  children: React.ReactNode;
  title?: string;
}) {
  const column: SortColumn<string> | undefined =
    param === null ? undefined : spec.columns.find((one) => one.param === param);

  /*
   * Thrown rather than quietly drawn as text, for the reason `recordSort.tsx`
   * throws: a heading pressing a word the spec does not have is a link to a 400,
   * and drawing plain text instead would hide a heading that is meant to sort.
   * A mistake in a declaration should be loud where it is made.
   */
  if (param !== null && column === undefined) {
    throw new Error(`${spec.of} has no sort called "${param}", but a heading presses it.`);
  }

  if (column === undefined) {
    return (
      <th className={HEAD} scope="col" title={title}>
        {children}
      </th>
    );
  }

  const way = ariaSort(current, column);
  const inForce = way !== "none";

  return (
    <th className={HEAD} scope="col" aria-sort={way} title={title}>
      <Link
        href={sortHref(at, new URLSearchParams(query), current, column)}
        className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
        data-testid="sortable-head"
        data-sort={param}
        /*
         * Which way it is NOW, for a reader who cannot see the arrow — not what a
         * press would do. `aria-sort` above already states the current order, and
         * a label describing the effect would contradict it.
         */
        aria-label={
          inForce ? `${column.label}, sorted ${way}. Press to reverse.` : `Sort by ${column.label}`
        }
      >
        {children}
        <span aria-hidden className={inForce ? "text-ink-soft" : "text-muted opacity-40"}>
          {inForce ? (current.direction === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </Link>
    </th>
  );
}

export type LeaderboardProps = {
  /**
   * Who the board is narrowed to, in words, where it is narrowed at all — so
   * the rank column's title says a rank is a place among those and not among
   * everyone. Absent for the whole board.
   */
  rankAmong?: string;
  rows: readonly XpBoardRow[];
  /** Everywhere or Itsutsu only: which total the XP and Level headings sort by. */
  scope: RecordScope;
  /**
   * The justification under a name whose total includes another site's credit,
   * by member id — worded by the page, in the reader's language.
   */
  notes?: ReadonlyMap<string, React.ReactNode>;
  /** The sort in force, already checked against the spec. */
  current: SortChoice<string>;
  /** The address the headings press, and the rest of the query they keep. */
  at: string;
  query: string;
  /**
   * The position the first row on this page holds in the whole order.
   *
   * A DISPLAY FIGURE AND NEVER WHAT DECIDES WHICH ROWS APPEAR — the cursor does
   * that, and this is carried alongside it purely so the second page can number
   * its rows 26 to 50 instead of 1 to 25. It is derived from what the previous
   * page already knew, and if rows shifted in between it can be out by however
   * many: that is the ordinary cost of numbering a cursor-paged list, and it is
   * paid on a number rather than on which members are shown.
   */
  from: number;
  /** The reader's own member id, so their row is marked. Null for a stranger. */
  viewerId: string | null;
  /** The reader's zone, so a date reads in their own terms. Empty means UTC. */
  viewerZone: string;
  /** What the empty board offers, worded by the page for whoever is reading. */
  empty: React.ReactNode;
  /**
   * What each row gained today and over seven days, in the board's scope and
   * each member's own days, by member id. A row missing from it prints a dash:
   * a gain the read did not measure is not a nought.
   */
  gains: ReadonlyMap<string, XpGain>;
  /**
   * The total of the row directly above this page's first row — the previous
   * page's last — or null on the first page, where the top row has nobody above.
   */
  above: number | null;
};

export function Leaderboard({
  rows,
  current,
  at,
  query,
  from,
  viewerId,
  viewerZone,
  empty,
  rankAmong,
  scope,
  notes,
  gains,
  above,
}: LeaderboardProps) {
  const spec = xpBoardSortSpec(scope) as SortSpec<string>;
  const head = { spec, current, at, query };
  /* Behind next follows the order in force, so it is computed over the rows as drawn. */
  const gaps = xpGapsFor(rows.map((row) => row.xp), above);

  return (
    <div className="overflow-x-auto" data-testid="xp-leaderboard">
      <table className={TABLE_CLASS}>
        <thead className={TABLE_HEAD_CLASS}>
          <tr>
            {/* Rank is the row's place in the order in force, so it is a
                consequence of the sort and can never be one. See the spec. */}
            <SortHead {...head} param={null} title={rankAmong === undefined ? "Place in the order shown" : `Place in the order shown, among ${rankAmong}`}>
              #
            </SortHead>
            <SortHead {...head} param="name">
              Member
            </SortHead>
            <SortHead {...head} param="level" title="Read from the total; the curve is monotonic">
              Level
            </SortHead>
            <SortHead {...head} param="xp">
              XP
            </SortHead>
            {/*
              Not sortable, any of the three: a gain is summed from the ledger for
              the rows on screen, and ordering the whole board by it would be a
              read of every member's week on every press. See `xpBoardGains.ts`.
            */}
            <SortHead {...head} param={null} title="XP gained today, on each member's own day">
              Today
            </SortHead>
            <SortHead {...head} param={null} title="XP gained over the last seven days, today included">
              7 days
            </SortHead>
            <SortHead {...head} param={null} title="Points behind the row directly above, in the order shown">
              Behind next
            </SortHead>
            <SortHead {...head} param="last-earned" title="When they last earned anything">
              Last earned
            </SortHead>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            /*
             * The headings are drawn whether or not there is anybody under them.
             * An empty board is a true fact — a narrowing nobody is in yet, a
             * fresh database — and hiding the table would teach a reader nothing
             * about what is kept here and read as an apology. See "Show The Data,
             * Not The Way To It".
             */
            <tr className={ROW_CLASS}>
              <td className="py-3 pr-3 text-sm" colSpan={8} data-testid="xp-board-empty">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const you = row.id === viewerId;
              return (
                <tr
                  key={row.id}
                  className={`${ROW_CLASS} ${you ? "bg-moss-soft" : ""}`.trim()}
                  aria-current={you ? "true" : undefined}
                  data-testid={you ? "xp-board-you" : "xp-board-row"}
                >
                  <td className={`${CELL} text-muted`}>{from + index + 1}</td>
                  <td className="py-1.5 pr-3">
                    <PlayerName name={row.name} memberId={row.id} fallback="A member with no name yet" />
                    {you ? (
                      <span className="ml-2 text-[0.65rem] tracking-wide text-moss uppercase">You</span>
                    ) : null}
                    {notes?.get(row.id) ?? null}
                  </td>
                  <td className="py-1.5 pr-3">
                    <LevelName level={xpLevelFor(row.xp)} />
                  </td>
                  <td className={CELL} data-testid="xp-board-xp">{countText(row.xp)}</td>
                  <td className={`${CELL} text-moss`} data-testid="xp-board-today">
                    {xpGainText(gains.get(row.id)?.today)}
                  </td>
                  <td className={`${CELL} text-moss`} data-testid="xp-board-week">
                    {xpGainText(gains.get(row.id)?.week)}
                  </td>
                  <td
                    className={`${CELL} text-muted`}
                    data-testid="xp-board-behind"
                    title={(gaps[index] ?? 0) < 0 ? "Ahead of the row above, in this order" : undefined}
                  >
                    {xpBehindText(gaps[index])}
                  </td>
                  <td className={`${CELL} text-muted`}>
                    {/*
                      An em dash for a member who has never earned anything, which
                      is a real state and not a date. The day is written out by the
                      server in the reader's own zone — `YYYY-MM-DD`, one spelling
                      everywhere, and never formatted in the browser where Node and
                      Chromium could disagree about it.
                    */}
                    {row.lastAt === null ? (
                      "—"
                    ) : (
                      <time dateTime={row.lastAt.toISOString()}>
                        {xpDayKey(row.lastAt, viewerZone)}
                      </time>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
