"use client";

import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { APPLAUSE, APPLAUSE_COPY, type ApplauseEmoji } from "@/lib/history/applause.constants";
import type { ApplauseTally } from "@/lib/history/applause";

/**
 * The row of marks under a finished game.
 *
 * Everything here counts up. A reader leaves one mark, changes it, or takes
 * it back by pressing the same one again; a game nobody has marked says so
 * plainly rather than showing a row of zeroes.
 */
export function Applause({
  gameId,
  initial,
  signedIn,
}: {
  gameId: string;
  initial: ApplauseTally;
  signedIn: boolean;
}) {
  const [tally, setTally] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function leave(emoji: ApplauseEmoji) {
    if (!signedIn || busy) return;
    setBusy(true);
    const response = await fetch(`/api/games/${gameId}/applause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    setBusy(false);
    if (response.ok) setTally((await response.json()) as ApplauseTally);
  }

  return (
    <section className="flex flex-col gap-2" data-testid="applause">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {APPLAUSE_COPY.title.label}
        <span className="font-mincho text-[0.8rem] font-normal tracking-normal">{APPLAUSE_COPY.title.kanji}</span>
        {tally.total > 0 ? <span className="font-normal tracking-normal">{tally.total}</span> : null}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        {APPLAUSE.map((mark) => {
          const count = tally.counts[mark.emoji] ?? 0;
          const mine = tally.mine === mark.emoji;
          return (
            <button
              key={mark.emoji}
              type="button"
              onClick={() => void leave(mark.emoji)}
              disabled={!signedIn || busy}
              aria-pressed={mine}
              title={mine ? `${mark.label} · ${APPLAUSE_COPY.yours}` : mark.label}
              data-testid={`applause-${mark.label.replace(/\s+/g, "-").toLowerCase()}`}
              className={`${BUTTON_BASE} ${mine ? BUTTON_STRONG : BUTTON_QUIET} px-2.5 py-1 text-sm`}
            >
              <span aria-hidden>{mark.emoji}</span>
              <span className="sr-only">{mark.label}</span>
              {count > 0 ? <span className="font-mono text-xs tabular-nums">{count}</span> : null}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        {!signedIn ? APPLAUSE_COPY.signedOut : tally.total === 0 ? APPLAUSE_COPY.none : APPLAUSE_COPY.hint}
      </p>
    </section>
  );
}
