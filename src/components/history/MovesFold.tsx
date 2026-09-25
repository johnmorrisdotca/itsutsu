"use client";

import { useRef, type ReactNode } from "react";

import { SectionTitle } from "@/components/ui/Controls";

/** Whether a finished game's moves are open or folded, as the account keeps it (`movesShown`). */
export type MovesShown = "open" | "folded";

/**
 * A FINISHED GAME'S MOVES, FOLDED AWAY FOR A READER WHO DOES NOT WANT THEM.
 * John, 2026-09-25: "Moves might be collapsed or hidden naturally as some
 * people might not want it." The heading stays, with the count and show or
 * hide beside it, as the live record folds (`MoveHistory`); the choice is kept
 * on the account (`movesShown`), so a reader who folded it once finds it
 * folded on the next game. Written only when it changes: a `<details>` says it
 * toggled when it is first drawn open too, and that says nothing new.
 */
export function MovesFold({
  count,
  initial,
  saves,
  children,
}: {
  count: number;
  initial: MovesShown;
  /** Whether there is an account to keep it on. */
  saves: boolean;
  children: ReactNode;
}) {
  const kept = useRef<MovesShown>(initial);
  function toggled(open: boolean) {
    const now: MovesShown = open ? "open" : "folded";
    if (now === kept.current) return;
    kept.current = now;
    if (!saves) return;
    void fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { movesShown: now } }),
    }).catch(() => undefined);
  }
  return (
    <details
      className="group flex flex-col gap-2"
      open={initial === "open"}
      onToggle={(event) => toggled(event.currentTarget.open)}
      data-testid="moves-fold"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
        <SectionTitle kanji="棋譜">Moves</SectionTitle>
        <span className="text-xs text-muted">
          {count} {count === 1 ? "move" : "moves"} · <span className="group-open:hidden">show</span>
          <span className="hidden group-open:inline">hide</span>
        </span>
      </summary>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </details>
  );
}
