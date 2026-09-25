"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * KEEPING AN UNFINISHED PUZZLE, from the page it is being solved on.
 *
 * John, 2026-09-24: "I started Numbers game, paused it, then clicked away...
 * why is it not showing up in my current games list?" A run is sent to
 * `/api/puzzles/runs` when it is paused, and when its page is left by any of
 * the three ways a page is left: the tab hidden or closed (`visibilitychange`,
 * `pagehide`) and a link followed inside the site — the one John took —
 * which is caught as the link is pressed, and again as the page unmounts. Never on a timer and never while it is
 * being solved, and the same state twice is sent once.
 *
 * `sendBeacon`, because a page being closed may not finish a fetch; `keepalive`
 * fetch where a browser has no beacon. `snapshot` answers null when there is
 * nothing to keep: no account, a race (whose clock is the server's), a puzzle
 * finished, or one not started.
 */
export function useKeptRun(snapshot: () => object | null): () => void {
  const latest = useRef(snapshot);
  useEffect(() => {
    latest.current = snapshot;
  });
  const sent = useRef("");

  const keep = useCallback(() => {
    const body = latest.current();
    if (body === null) return;
    const json = JSON.stringify(body);
    if (json === sent.current) return;
    sent.current = json;
    const beaconed = typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/puzzles/runs", new Blob([json], { type: "application/json" }));
    if (!beaconed) {
      void fetch("/api/puzzles/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: json, keepalive: true }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const hidden = () => {
      if (document.visibilityState === "hidden") keep();
    };
    /*
     * A LINK PRESSED, BEFORE IT IS FOLLOWED. Unmounting is too late for the page
     * the link goes to: the site asks for that page first and drops this one
     * after, so a member who went straight to My games got there before the
     * puzzle did. The press is the first moment the reader is leaving; a press
     * that is not followed through costs one repeated write.
     */
    const leaving = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Enter") return;
      if (event.target instanceof Element && event.target.closest("a[href]") !== null) keep();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", keep);
    document.addEventListener("pointerdown", leaving, { capture: true, passive: true });
    document.addEventListener("keydown", leaving, { capture: true, passive: true });
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", keep);
      document.removeEventListener("pointerdown", leaving, { capture: true });
      document.removeEventListener("keydown", leaving, { capture: true });
      // Unmounted: a link inside the site was followed, and the run goes with it unless kept now.
      keep();
    };
  }, [keep]);

  return keep;
}
