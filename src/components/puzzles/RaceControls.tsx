"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import type { RaceSeat } from "@/lib/puzzles/raceState";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/**
 * What a seat can do on the race page that is not solving: press Start,
 * send the other seat's link, and read the race again.
 *
 * READING AGAIN IS ON PURPOSE AND NEVER ON A TIMER. The other seat's state
 * is words the server wrote; the page reads them when this browser comes
 * back to the tab (`visibilitychange`) or when Refresh is pressed, and once
 * more when a finish is handed in. Nothing polls (John: "no server
 * calculations"), and a race left open in a tab costs the site nothing.
 */
export function RaceControls({ id, seat, canStart, seatLink }: { id: string; seat: RaceSeat | null; canStart: boolean; seatLink: string | null }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  const start = async () => {
    setStarting(true);
    setProblem(null);
    try {
      const answered = await fetch(`/api/puzzles/races/${id}/start`, { method: "POST" });
      if (!answered.ok) {
        const body = (await answered.json().catch(() => null)) as { error?: string } | null;
        setProblem(body?.error ?? "The site could not start your clock.");
        setStarting(false);
        return;
      }
      router.refresh();
    } catch {
      setProblem("The site could not be reached.");
      setStarting(false);
    }
  };

  const copy = async () => {
    if (seatLink === null) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${seatLink}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-2" data-testid="race-controls" {...readyMark(hydrated)}>
      {seatLink !== null ? (
        <div className="flex flex-col gap-1 rounded-lg border border-dashed border-rule-strong px-3 py-2 text-sm" data-testid="race-seat-link">
          <span className="text-muted">Send this link to the person you are racing. Whoever opens it takes the other seat.</span>
          <code className="break-all text-xs" data-testid="race-seat-link-address">
            {seatLink}
          </code>
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} self-start`} onClick={copy} data-testid="race-copy-link">
            {copied ? "Copied" : "Copy the link"}
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {seat !== null && canStart ? (
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG} px-5 py-2`} onClick={start} disabled={starting} data-testid="race-start">
            {starting ? "Starting…" : "Start my clock →"}
          </button>
        ) : null}
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => router.refresh()} data-testid="race-refresh">
          Refresh
        </button>
        {seat !== null && canStart ? <span className="text-xs text-muted">The clock runs from Start until your grid is right, in one sitting.</span> : null}
        {problem !== null ? <span className="text-sm text-shu">{problem}</span> : null}
      </div>
    </div>
  );
}
