"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { whenKeptRunLands } from "@/components/puzzles/useKeptRun";

/**
 * MY GAMES, ASKED AGAIN ONCE IF A PUZZLE WAS STILL BEING WRITTEN WHEN IT OPENED.
 *
 * The puzzle a reader paused and then left by a link is sent as the link is pressed, and the page they land on is read
 * at the same moment, so the list could be drawn without it (`useKeptRun`, `whenKeptRunLands`). When the send is still
 * on its way as this mounts, the list is read once more as soon as it has landed: one request after the reader's own
 * act, nothing on a timer, and nothing at all when no run was on its way.
 */
export function KeptRunsSettle() {
  const router = useRouter();
  useEffect(() => {
    const landing = whenKeptRunLands();
    if (landing === null) return;
    let open = true;
    void landing.then(() => {
      if (open) router.refresh();
    });
    return () => {
      open = false;
    };
  }, [router]);
  return null;
}
