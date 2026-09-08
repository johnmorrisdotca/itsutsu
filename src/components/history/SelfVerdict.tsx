"use client";

import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

export type Verdict = "up" | "down" | null;

/** "How do you think you did?" Private, one tap, changeable. Not who won: how you played. */
export function SelfVerdict({ id, initial }: { id: string; initial: Verdict }) {
  const [verdict, setVerdict] = useState<Verdict>(initial);
  const [busy, setBusy] = useState(false);

  async function choose(next: Verdict) {
    const value = verdict === next ? null : next;
    setBusy(true);
    const response = await fetch(`/api/games/${id}/verdict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verdict: value }),
    });
    setBusy(false);
    if (response.ok) setVerdict(value);
  }

  const tone = (which: Verdict) => (verdict === which ? "ring-2 ring-moss" : "");
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="self-verdict">
      <span className="text-muted">
        How do you think you played? <span className="font-mincho text-xs">自己評価</span>
      </span>
      <button type="button" onClick={() => choose("up")} disabled={busy} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2 py-1 ${tone("up")}`} aria-pressed={verdict === "up"} title="Well">
        👍
      </button>
      <button type="button" onClick={() => choose("down")} disabled={busy} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2 py-1 ${tone("down")}`} aria-pressed={verdict === "down"} title="Not well">
        👎
      </button>
      <span className="text-xs text-muted">Private; only you see it.</span>
    </div>
  );
}
