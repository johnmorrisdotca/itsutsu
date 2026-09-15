"use client";

import Link from "next/link";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

import type { FilterChipProps } from "./backlogBoard.types";

/**
 * One filter on the board: its name, how many rows stand there, and whether it
 * is the one being shown.
 *
 * TWO KINDS, BECAUSE A VIEW READS ONLY ITS OWN ROWS. A filter whose rows this
 * view already holds — Open inside the unfinished rows, say — is a button that
 * narrows in place, instantly, with no request. A filter whose rows were not
 * read — Done, from the default view — is a link to the view that reads them,
 * so a done row is fetched only when somebody asks to see done rows (see
 * `boardScope.ts`). It is a real link, so it works before the page is hydrated
 * and a reload keeps the view.
 *
 * AND ITS NUMBER ONLY WHERE ITS ROWS WERE COUNTED. `count` is null for a
 * filter whose rows this view did not read, and then no number is drawn: "0
 * done" from a read that never asked for done rows would be a figure nothing
 * counted.
 */
export function FilterChip({ label, kanji, count, current, onPick, href, testId }: FilterChipProps) {
  const className = `${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-xs ${current ? "border-moss bg-moss-soft text-ink" : ""}`;
  const inside = (
    <>
      {label}
      {kanji === undefined ? null : <span className="font-mincho text-muted">{kanji}</span>}
      {count === null ? null : <span className="font-mono tabular-nums text-muted">{count}</span>}
    </>
  );
  if (href !== null) {
    return (
      <Link href={href} scroll={false} data-testid={testId} className={className}>
        {inside}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onPick} aria-pressed={current} data-testid={testId} className={className}>
      {inside}
    </button>
  );
}
