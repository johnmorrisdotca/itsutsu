"use client";

import { useCallback, useEffect, useRef } from "react";

import { keepRunOnDevice, type RunIdentity } from "./runsOnDevice";
import type { ResumedRun } from "./solveShared";
import { LINK_SELECTOR } from "./paint.constants";
import { ENTER_KEY } from "@/lib/ui/keyNames.constants";

/**
 * The write of a kept run that is still on its way, for the page the reader goes to next.
 *
 * A link followed inside the site is a navigation of one page, so this module outlives the puzzle's screen, and My
 * games can ask whether the run it is about to list is still being written (`KeptRunsSettle`). Without it the list is
 * asked for at the same moment as the write, and a pause followed at once by a click on My games showed no puzzle
 * until the page was loaded again: the two requests have no order, and a cold function can take a second to write.
 */
let writing: Promise<void> | null = null;

/** Resolves once the run being kept has been written, or null when nothing is on its way. */
export function whenKeptRunLands(): Promise<void> | null {
  return writing;
}

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

  /**
   * `leavingPage`: the page itself is going (hidden, closed), so the send is a beacon, which outlives it; any other
   * keep is a fetch whose end is known (`whenKeptRunLands`), still `keepalive` in case the page goes after all.
   */
  const keep = useCallback((leavingPage = false) => {
    const body = latest.current();
    if (body === null) return;
    // On this device too, so a run left with no connection is still here to open (`runsOnDevice.ts`).
    keepRunOnDevice(body as RunIdentity & ResumedRun);
    const json = JSON.stringify(body);
    if (json === sent.current) return;
    // Offline the send goes nowhere, so the same run is sent again the next time it is kept.
    if (navigator.onLine) sent.current = json;
    const beaconed = leavingPage && typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/puzzles/runs", new Blob([json], { type: "application/json" }));
    if (!beaconed) {
      const sending: Promise<void> = fetch("/api/puzzles/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: json, keepalive: true })
        .then(() => undefined, () => undefined)
        .finally(() => {
          if (writing === sending) writing = null;
        });
      writing = sending;
    }
  }, []);

  useEffect(() => {
    const hidden = () => {
      if (document.visibilityState === "hidden") keep(true);
    };
    const closing = () => keep(true);
    const online = () => keep();
    /*
     * A LINK PRESSED, BEFORE IT IS FOLLOWED. Unmounting is too late for the page
     * the link goes to: the site asks for that page first and drops this one
     * after, so a member who went straight to My games got there before the
     * puzzle did. The press is the first moment the reader is leaving; a press
     * that is not followed through costs one repeated write.
     */
    const leaving = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== ENTER_KEY) return;
      if (event.target instanceof Element && event.target.closest(LINK_SELECTOR) !== null) keep();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", closing);
    // Back online: what was kept while there was no connection is sent now.
    window.addEventListener("online", online);
    document.addEventListener("pointerdown", leaving, { capture: true, passive: true });
    document.addEventListener("keydown", leaving, { capture: true, passive: true });
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", closing);
      window.removeEventListener("online", online);
      document.removeEventListener("pointerdown", leaving, { capture: true });
      document.removeEventListener("keydown", leaving, { capture: true });
      // Unmounted: a link inside the site was followed, and the run goes with it unless kept now.
      keep();
    };
  }, [keep]);

  return keep;
}
