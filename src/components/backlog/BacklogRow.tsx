"use client";

import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, INPUT_CLASS, SELECT_CLASS } from "@/components/ui/ui.constants";
import { movesFrom } from "@/lib/backlog/backlog";
import { KIND_DISPLAY, STATUS_DISPLAY } from "@/lib/backlog/backlog.constants";
import type { BacklogStatus } from "@/lib/backlog/backlog.types";

import type { BacklogRowProps } from "./backlogBoard.types";

/** A day, written the same way on the server and in the browser: no locale in it to disagree about. */
export function dayStamp(iso: string): string {
  return iso.slice(0, 10);
}

/** The coloured word for a status, used on a row and in the counts above the board. */
export function StatusPill({ status }: { status: BacklogStatus }) {
  const copy = STATUS_DISPLAY[status];
  return (
    <span
      className={`inline-flex items-baseline gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold ${copy.pill}`}
      data-testid={`status-pill-${status}`}
    >
      {copy.label} <span className="font-mincho font-normal opacity-75">{copy.kanji}</span>
    </span>
  );
}

/**
 * One thing somebody asked for: what it is, who asked, where it stands, and
 * the only moves it may make from there. The select is built from the board's
 * own table, so a move the rules forbid is never offered — and the API refuses
 * it too, for anything that does not come through this page.
 */
export function BacklogRow({ item, onMoved, who }: BacklogRowProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [hand, setHand] = useState(item.assignedTo);
  const moves = movesFrom(item.status);

  /** Says who has it, or takes the name off again. */
  async function assign(to: string) {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/backlog/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTo: to }),
    });
    setBusy(false);
    setNaming(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "That did not go through.");
      return;
    }
    onMoved();
  }

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
            {KIND_DISPLAY[item.kind].label}{" "}
            <span className="font-mincho tracking-normal normal-case">{KIND_DISPLAY[item.kind].kanji}</span>
          </span>
        </div>
        {item.detail === "" ? null : <p className="max-w-prose text-sm text-muted">{item.detail}</p>}
        <p className="text-xs text-muted">
          {item.askedBy === "" ? "Asked for" : `Asked for by ${item.askedBy}`} · added {dayStamp(item.createdAt)} · moved{" "}
          {dayStamp(item.movedAt)}
          {item.assignedTo === "" ? "" : " · "}
          {item.assignedTo === "" ? null : (
            <span className="font-medium text-ink-soft" data-testid="backlog-assigned">
              {item.assignedTo} has it
            </span>
          )}
        </p>
        {naming ? (
          <span className="flex flex-wrap items-center gap-2">
            <input
              className={`${INPUT_CLASS} max-w-48`}
              value={hand}
              autoFocus
              maxLength={60}
              placeholder="Who has it?"
              aria-label={`Who has "${item.title}"?`}
              data-testid="assign-name"
              onChange={(event) => setHand(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void assign(hand);
                if (event.key === "Escape") setNaming(false);
              }}
            />
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2 py-1 text-xs`} disabled={busy} onClick={() => void assign(hand)}>
              Save
            </button>
            {item.assignedTo === "" ? null : (
              <button type="button" className="text-xs text-muted underline underline-offset-4" onClick={() => void assign("")}>
                Nobody
              </button>
            )}
          </span>
        ) : (
          <span>
            <button
              type="button"
              className="text-xs text-muted underline underline-offset-4"
              data-testid="assign-open"
              onClick={() => {
                setHand(item.assignedTo === "" ? who : item.assignedTo);
                setNaming(true);
              }}
            >
              {item.assignedTo === "" ? "Take it" : "Hand it on"}
            </button>
          </span>
        )}
        {error === null ? null : <p className="text-xs text-shu">{error}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatusPill status={item.status} />
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
      </div>
    </li>
  );
}
