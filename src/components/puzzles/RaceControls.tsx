"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SeatCard } from "@/components/live/SeatCard";
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
export function RaceControls({
  id,
  seat,
  canStart,
  invite,
  label,
}: {
  id: string;
  seat: RaceSeat | null;
  canStart: boolean;
  /** The other seat's link and its QR code, made on the server, while the host is still waiting for somebody. */
  invite: { url: string; qr: string } | null;
  /** The puzzle, as the text message names it. */
  label: string;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [starting, setStarting] = useState(false);
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

  return (
    <div className="flex flex-col gap-2" data-testid="race-controls" {...readyMark(hydrated)}>
      {invite !== null ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">Send this link to the person you are racing. Whoever opens it takes the other seat.</span>
          {/* The seat card every seat link on the site is handed over in — see `SeatCard`. */}
          <div className="w-full max-w-xs">
            <SeatCard
              url={invite.url}
              qr={invite.qr}
              name={{ en: "The other seat", kanji: "相手の席" }}
              mark={null}
              message={`Race me at ${label}: ${invite.url}`}
              isYours={false}
              testId="race-seat-link"
            />
          </div>
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
