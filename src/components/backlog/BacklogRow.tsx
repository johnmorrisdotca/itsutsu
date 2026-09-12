"use client";

import { Paired } from "@/components/i18n/Paired";
import { useState } from "react";

import { SELECT_CLASS } from "@/components/ui/ui.constants";
import { heldNow, movesFrom } from "@/lib/backlog/backlog";
import { BACKLOG_STATUSES, EFFORT_DISPLAY, KIND_DISPLAY, PRIORITY_DISPLAY, STATUS_DISPLAY } from "@/lib/backlog/backlog.constants";
import type { BacklogItem, BacklogStatus } from "@/lib/backlog/backlog.types";

import type { BacklogRowProps } from "./backlogBoard.types";
import { DetailText } from "./DetailText";

/** A day, written the same way on the server and in the browser: no locale in it to disagree about. */
export function dayStamp(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * The row's last move, in the words that fit where it landed.
 *
 * "Moved" is the honest word while a row is still going somewhere, and the
 * wrong one once it has arrived: the last move a done row made was being
 * finished, and that date is the one anybody reading a done board wants.
 * Same field, read for what it means on this row rather than for what it is
 * called on the column.
 *
 * "Shipped in" only when `releasedAt` is set — board convergence ITS-04,
 * `pnpm release:take` writing the version it is taking at the moment it
 * takes it, which makes the word true. A row finished before ITS-04 carries
 * `releasedIn` with no `releasedAt`: that version was the one RUNNING when
 * somebody marked the row done, usually the release before the one that
 * carried the work, and it keeps the old wording — "marked done in" — rather
 * than a claim it was never given the means to make. A row finished before
 * `releasedIn` existed at all has neither, and says only that it is done.
 */
function MoveStamp({ item }: { item: BacklogItem }) {
  const day = dayStamp(item.movedAt);
  if (item.status !== BACKLOG_STATUSES.done) return <>moved {day}</>;
  if (item.releasedIn === null) return <>done {day}</>;
  const version = (
    <span className="font-medium text-ink-soft" data-testid="backlog-released-in">
      {item.releasedIn}
    </span>
  );
  if (item.releasedAt !== null) return <>shipped in {version}</>;
  return (
    <>
      marked done {day} in {version}
    </>
  );
}

/**
 * Who holds this row, if anybody, read from the claim rather than the status
 * column — so a hold nobody has renewed inside the lease reads as stale
 * rather than as somebody still working it. Computed at render from
 * `Date.now()`, not on a timer: the board re-reads after every move, and
 * nothing here needs to tick on its own between two of those.
 *
 * Gated on the row's current status, not only on `claimedBy` being set.
 * ITS-01's migration preserves a finished row's old assignee in `claimedBy`
 * rather than dropping it, so a done or dropped row can carry one too — and
 * without this guard it would print "held by" or "stale" beside a row whose
 * own status pill already says Done, which is a row contradicting itself.
 * Held and stale are both facts about work someone is or was doing right
 * now; a released claim on a finished row is history, shown nowhere on the
 * board today.
 */
function HoldLine({ item }: { item: BacklogItem }) {
  if (item.status !== BACKLOG_STATUSES.inProgress) return null;
  if (item.claimedBy === null) return null;
  if (heldNow(item)) {
    return (
      <>
        {" · "}
        <span className="font-medium text-ink-soft" data-testid="backlog-held">
          held by {item.claimedBy}
        </span>
      </>
    );
  }
  return (
    <>
      {" · "}
      <span className="font-medium text-muted" data-testid="backlog-stale">
        stale · {item.claimedBy} since {dayStamp(item.claimedAt ?? item.movedAt)}
      </span>
    </>
  );
}

/** The coloured word for a status, used on a row and in the counts above the board. */
export function StatusPill({ status }: { status: BacklogStatus }) {
  const copy = STATUS_DISPLAY[status];
  return (
    <span
      className={`inline-flex items-baseline gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold ${copy.pill}`}
      data-testid={`status-pill-${status}`}
    >
      <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="font-normal opacity-75" />
    </span>
  );
}

/**
 * How much a row matters and how much work it is, where somebody has said.
 *
 * Nothing is drawn for an ungraded row rather than a placeholder saying so.
 * Ninety-odd of those would be a column of shrugs, and the absence already
 * reads correctly: no mark means nobody has judged it.
 */
function GradePills({ item }: { item: BacklogItem }) {
  if (item.priority === null && item.effort === null) return null;
  return (
    <span className="inline-flex items-baseline gap-1" data-testid="grade-pills">
      {item.priority === null ? null : (
        <span
          className={`inline-flex items-baseline gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold ${PRIORITY_DISPLAY[item.priority].pill}`}
          title={PRIORITY_DISPLAY[item.priority].blurb}
          data-testid={`priority-pill-${item.priority}`}
        >
          <Paired en={PRIORITY_DISPLAY[item.priority].label} kanji={PRIORITY_DISPLAY[item.priority].kanji} kanjiClassName="font-normal opacity-75" />
        </span>
      )}
      {item.effort === null ? null : (
        <span
          className={`inline-flex items-baseline gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold ${EFFORT_DISPLAY[item.effort].pill}`}
          title={EFFORT_DISPLAY[item.effort].blurb}
          data-testid={`effort-pill-${item.effort}`}
        >
          <Paired en={EFFORT_DISPLAY[item.effort].label} kanji={EFFORT_DISPLAY[item.effort].kanji} kanjiClassName="font-normal opacity-75" />
        </span>
      )}
    </span>
  );
}

/**
 * One thing somebody asked for: what it is, who asked, where it stands, and
 * the only moves it may make from there. The select is built from the board's
 * own table, so a move the rules forbid is never offered — and the API refuses
 * it too, for anything that does not come through this page.
 *
 * There is no separate "take it" any more. Choosing In progress from the move
 * select IS taking it: the API writes the operator's own name into the claim
 * the moment the move lands, and a row somebody else is already holding
 * answers 409, shown in the error line below rather than applied quietly.
 */
export function BacklogRow({ item, onMoved }: BacklogRowProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const moves = movesFrom(item.status);

  async function move(to: string) {
    if (to === "") return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/backlog/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "That did not go through.");
      return;
    }
    onMoved();
  }

  return (
    <li
      className="flex flex-col gap-2 border-t border-rule py-3 first:border-t-0 sm:flex-row sm:items-start sm:gap-4"
      data-testid="backlog-item"
      data-key={item.key}
      data-status={item.status}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-medium">{item.title}</span>
          <span className="text-[0.68rem] tracking-[0.1em] text-muted uppercase">
            <Paired en={KIND_DISPLAY[item.kind].label} kanji={KIND_DISPLAY[item.kind].kanji} kanjiClassName="tracking-normal normal-case" />
          </span>
          <GradePills item={item} />
        </div>
        <DetailText detail={item.detail} />
        <p className="text-xs text-muted">
          {item.askedBy === "" ? "Asked for" : `Asked for by ${item.askedBy}`} · added {dayStamp(item.createdAt)} ·{" "}
          <MoveStamp item={item} />
          <HoldLine item={item} />
        </p>
        {error === null ? null : <p className="text-xs text-shu">{error}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatusPill status={item.status} />
        {/* Done does not move (BOARD_RULES.md invariant 1): movesFrom("done")
            is empty, and a select with nothing to offer is not a control. */}
        {moves.length === 0 ? null : (
          <select
            className={SELECT_CLASS}
            value=""
            disabled={busy}
            aria-label={`Move "${item.title}" to another status`}
            data-testid="move-status"
            onChange={(event) => move(event.target.value)}
          >
            <option value="">Move…</option>
            {moves.map((status) => (
              <option key={status} value={status}>
                {STATUS_DISPLAY[status].label}
              </option>
            ))}
          </select>
        )}
      </div>
    </li>
  );
}
