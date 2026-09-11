"use client";

import { useState } from "react";

/**
 * A request's detail, shown short until somebody wants the whole of it.
 *
 * John, reading the board: "where is the simple ticket about showing only part
 * of the text and click to expand???" There was no ticket — he had asked and
 * it had lived in a chat window — but the need is plain the moment you open
 * the page. A detail here is a summary of a conversation nobody else was in,
 * so the gate requires it to say more than its title, and the good ones run to
 * several paragraphs. Thirty of those in a column is a board you scroll past
 * rather than read.
 *
 * A summary/details pair rather than a clamp and a button: it opens without
 * script, it is one element rather than a height guess, and the browser
 * already knows how to say "there is more here".
 *
 * The first line is the summary, because a detail written well starts by
 * saying what it is about. Nothing is hidden that is not also one click away,
 * and a short detail is simply shown — a control offering to expand two lines
 * into two lines is furniture.
 */
const SHORT = 180;

export function DetailText({
  detail,
  /*
   * Not "backlog-detail": the add form's own input already answers to that,
   * and taking it made one name mean two things — a spec filling in the form
   * found forty-seven elements and could not say which it meant.
   */
  testId = "backlog-detail-text",
}: {
  detail: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const text = detail.trim();
  if (text === "") return null;

  if (text.length <= SHORT) {
    return (
      <p className="max-w-prose text-sm text-muted" data-testid={testId}>
        {text}
      </p>
    );
  }

  /*
   * Cut at a word, never mid-word. A summary that ends "the computer play" is
   * a different sentence from the one that was written.
   */
  const cut = text.slice(0, SHORT);
  const short = `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).trimEnd()}…`;

  return (
    <p className="max-w-prose text-sm text-muted" data-testid={testId}>
      <span data-testid={open ? "backlog-detail-full" : "backlog-detail-short"}>{open ? text : short}</span>{" "}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="underline underline-offset-2 hover:text-ink-soft"
        aria-expanded={open}
        data-testid="backlog-detail-toggle"
      >
        {open ? "less" : "more"}
      </button>
    </p>
  );
}
