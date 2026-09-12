"use client";

import { Paired } from "@/components/i18n/Paired";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, INPUT_CLASS, SECTION_TITLE, SELECT_CLASS } from "@/components/ui/ui.constants";
import { BACKLOG_KIND_VALUES, filterItems, openCount, sortItems, tally } from "@/lib/backlog/backlog";
import { KIND_DISPLAY, SORT_DISPLAY, STATUS_DISPLAY, STATUS_ORDER } from "@/lib/backlog/backlog.constants";
import type { BacklogKind, BacklogSort } from "@/lib/backlog/backlog.types";

import { AddBacklogItem } from "./AddBacklogItem";
import { BacklogRow } from "./BacklogRow";
import type { BacklogBoardProps, BoardView } from "./backlogBoard.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

const START: BoardView = { status: "unfinished", kind: "all", text: "", sort: "status" };

/** One filter button: the status, how many stand there, and whether it is the one being shown. */
function FilterChip({
  label,
  kanji,
  count,
  current,
  onPick,
  testId,
}: {
  label: string;
  kanji?: string;
  count: number;
  current: boolean;
  onPick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={current}
      data-testid={testId}
      className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-xs ${current ? "border-moss bg-moss-soft text-ink" : ""}`}
    >
      {label}
      {kanji === undefined ? null : <span className="font-mincho text-muted">{kanji}</span>}
      <span className="font-mono tabular-nums text-muted">{count}</span>
    </button>
  );
}

/**
 * The board: everything asked for, filtered and ordered, with a form to add to
 * it and a select on every row to move it.
 *
 * Filtering and ordering are done here in the browser because the whole board
 * is a list of dozens — sending it once and narrowing it locally keeps every
 * filter instant, and the counts honest, since they are counted from the same
 * list the rows come from. Adding and moving go to the server and then ask the
 * page to re-read, so what is on screen is always what is stored.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND IT IS NOT ON `lib/api/paging.ts`, DELIBERATELY
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The record and the ladder moved to one convention — `sort=<column>[:asc|desc]`
 * with a cursor, ordered by the database — and this did not. Written down here
 * because "the board was not converted" and "the board should not be converted"
 * look identical in a diff, and only one of them is true.
 *
 * A CLIENT-SIDE SORT IS ONLY A LIE WHERE THERE IS A SECOND PAGE, and there is
 * not one here. `fetchBoard` reads every row — 218 on production — so sorting
 * the array is sorting the whole set, not reordering one page of it and calling
 * that the board. That is precisely the distinction the convention turns on, and
 * it is the same reason /play's groups open in place rather than paging.
 *
 * THREE THINGS WOULD BREAK IF IT DID. The counts beside each status filter are
 * counted from the same list the rows come from, which is what makes them agree
 * with what a reader can see; a paged board would need a second query per
 * status and could disagree with itself between them. The grouped-by-status view
 * needs every row at once to know which groups exist at all. And every filter
 * would become a round trip on a page whose whole manner is instant.
 *
 * What would change the answer is size: a board of thousands wants the
 * convention, and the columns are plain ones — `movedAt` and `createdAt` are
 * both indexed. It is a list of dozens, and the operator is one person.
 */
export function BacklogBoard({ items, who }: BacklogBoardProps) {
  const router = useRouter();
  const [view, setView] = useState<BoardView>(START);

  const counts = useMemo(() => tally(items), [items]);
  const open = useMemo(() => openCount(items), [items]);
  const shown = useMemo(() => sortItems(filterItems(items, view), view.sort), [items, view]);
  /*
   * A board of thirty rows reads as a wall unless it is broken up. When the
   * order is by status and more than one status is on show, each gets a
   * subheading; under any other order the list stays flat, because the
   * headings would then be lying about the order.
   */
  const grouped = useMemo(() => {
    if (view.sort !== "status" || (view.status !== "all" && view.status !== "unfinished")) return null;
    const groups = STATUS_ORDER.map((status) => ({ status, items: shown.filter((entry) => entry.status === status) })).filter(
      (group) => group.items.length > 0,
    );
    return groups.length > 1 ? groups : null;
  }, [shown, view.sort, view.status]);
  const change = (part: Partial<BoardView>) => setView((current) => ({ ...current, ...part }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2" data-testid="backlog-filters" {...readyMark(useHydrated())}>
        <FilterChip
          label="Unfinished"
          kanji="未了"
          count={open}
          current={view.status === "unfinished"}
          onPick={() => change({ status: "unfinished" })}
          testId="filter-unfinished"
        />
        <FilterChip
          label="All"
          count={items.length}
          current={view.status === "all"}
          onPick={() => change({ status: "all" })}
          testId="filter-all"
        />
        <span className="h-4 w-px bg-rule-strong" aria-hidden />
        {STATUS_ORDER.map((status) => (
          <FilterChip
            key={status}
            label={STATUS_DISPLAY[status].label}
            kanji={STATUS_DISPLAY[status].kanji}
            count={counts[status]}
            current={view.status === status}
            onPick={() => change({ status })}
            testId={`filter-${status}`}
          />
        ))}
        {counts.stale === 0 ? null : (
          <FilterChip
            label="Stale"
            count={counts.stale}
            current={view.status === "stale"}
            onPick={() => change({ status: "stale" })}
            testId="filter-stale"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${INPUT_CLASS} sm:w-64`}
          value={view.text}
          placeholder="Find in the board"
          aria-label="Find in the board"
          data-testid="backlog-search"
          onChange={(event) => change({ text: event.target.value })}
        />
        <select
          className={SELECT_CLASS}
          value={view.kind}
          aria-label="Kind"
          data-testid="backlog-kind-filter"
          onChange={(event) => change({ kind: event.target.value as BacklogKind | "all" })}
        >
          <option value="all">Every kind</option>
          {BACKLOG_KIND_VALUES.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_DISPLAY[kind].label}
            </option>
          ))}
        </select>
        <select
          className={SELECT_CLASS}
          value={view.sort}
          aria-label="Order"
          data-testid="backlog-sort"
          onChange={(event) => change({ sort: event.target.value as BacklogSort })}
        >
          {(Object.keys(SORT_DISPLAY) as BacklogSort[]).map((sort) => (
            <option key={sort} value={sort}>
              {SORT_DISPLAY[sort]}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted" data-testid="backlog-shown">
          {shown.length} of {items.length} shown
        </span>
      </div>

      <details className="rounded-lg border border-rule bg-ivory/60 px-3 py-2" data-testid="backlog-add-panel">
        <summary className="cursor-pointer text-sm font-medium">Ask for something</summary>
        <div className="pt-3">
          <p className="pb-2 text-xs text-muted">
            One line for what is wanted, and as much detail as you have. It lands as{" "}
            <span className="font-medium">{STATUS_DISPLAY.open.label}</span> — on the board, with nobody on it yet.
          </p>
          <AddBacklogItem
            who={who}
            onAdded={() => {
              setView((current) => ({ ...current, status: "all", sort: "newest" }));
              router.refresh();
            }}
          />
        </div>
      </details>

      <div className="flex flex-col gap-1">
        <span className={SECTION_TITLE}>
          {view.status === "all"
            ? "Everything"
            : view.status === "unfinished"
              ? "Still wanted"
              : view.status === "stale"
                ? "Stale"
                : STATUS_DISPLAY[view.status].label}
        </span>
        {shown.length === 0 ? (
          <p className="py-4 text-sm text-muted" data-testid="backlog-empty">
            Nothing here under those filters.
          </p>
        ) : grouped === null ? (
          <ul className="flex flex-col" data-testid="backlog-list">
            {shown.map((entry) => (
              <BacklogRow key={entry.id} item={entry} onMoved={() => router.refresh()} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-4" data-testid="backlog-list">
            {grouped.map((group) => (
              <div key={group.status} className="flex flex-col gap-1" data-testid="backlog-group">
                <h3 className="flex items-baseline gap-2 pt-2 text-sm font-semibold">
                  <Paired en={STATUS_DISPLAY[group.status].label} kanji={STATUS_DISPLAY[group.status].kanji} kanjiClassName="text-xs font-normal opacity-70" />
                  <span className="font-mono text-xs font-normal text-muted tabular-nums">{group.items.length}</span>
                  <span className="text-xs font-normal text-muted">{STATUS_DISPLAY[group.status].blurb}</span>
                </h3>
                <ul className="flex flex-col">
                  {group.items.map((entry) => (
                    <BacklogRow key={entry.id} item={entry} onMoved={() => router.refresh()} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        A status only moves where the board allows: a request is agreed or started before it can be done, and a dropped
        one comes back as a proposal, not as work. {STATUS_DISPLAY.dropped.blurb}
      </p>
    </div>
  );
}
