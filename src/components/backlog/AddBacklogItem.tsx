"use client";

import { useState } from "react";

import { BUTTON_BASE, BUTTON_STRONG, INPUT_CLASS, SELECT_CLASS } from "@/components/ui/ui.constants";
import { BACKLOG_KIND_VALUES, draftProblems } from "@/lib/backlog/backlog";
import { KIND_DISPLAY, TITLE_MAX } from "@/lib/backlog/backlog.constants";
import type { BacklogKind } from "@/lib/backlog/backlog.types";

import type { AddBacklogItemProps } from "./backlogBoard.types";

/**
 * Adding a request.
 *
 * The same `draftProblems` the API route refuses on is what greys the button
 * out, so the form cannot ask for something the server will not take, and the
 * rule about what counts as a real request is stated once.
 */
export function AddBacklogItem({ who, onAdded }: AddBacklogItemProps) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [kind, setKind] = useState<BacklogKind>("feature");
  const [askedBy, setAskedBy] = useState(who);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const problems = draftProblems({ title, detail, kind, askedBy });
  const ready = problems.length === 0 && !busy;

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/backlog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, detail, kind, askedBy }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "That did not go through.");
      return;
    }
    setTitle("");
    setDetail("");
    onAdded();
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={add} data-testid="add-backlog-item">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className={INPUT_CLASS}
          value={title}
          maxLength={TITLE_MAX}
          placeholder="What is wanted, in one line"
          aria-label="What is wanted"
          data-testid="backlog-title"
          onChange={(event) => setTitle(event.target.value)}
        />
        <select
          className={SELECT_CLASS}
          value={kind}
          aria-label="Feature, fix or chore"
          data-testid="backlog-kind"
          onChange={(event) => setKind(event.target.value as BacklogKind)}
        >
          {BACKLOG_KIND_VALUES.map((value) => (
            <option key={value} value={value}>
              {KIND_DISPLAY[value].label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className={`${INPUT_CLASS} min-h-20`}
        value={detail}
        placeholder="The longer telling: what it should do, and anything already settled about it."
        aria-label="The longer telling"
        data-testid="backlog-detail"
        onChange={(event) => setDetail(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${INPUT_CLASS} sm:w-56`}
          value={askedBy}
          placeholder="Who asked for it"
          aria-label="Who asked for it"
          data-testid="backlog-asked-by"
          onChange={(event) => setAskedBy(event.target.value)}
        />
        <button type="submit" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} disabled={!ready} data-testid="backlog-add">
          {busy ? "Adding…" : "Add to the board"}
        </button>
        <span className="text-xs text-muted" data-testid="backlog-problem">
          {error ?? (title === "" ? "" : (problems[0] ?? ""))}
        </span>
      </div>
    </form>
  );
}
