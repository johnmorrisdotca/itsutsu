"use client";

import { useEffect } from "react";

import { SUGOROKU_STRENGTHS, sugorokuSeatName } from "@/lib/party/sugoroku/sugoroku.constants";
import type { SugorokuTable } from "@/lib/party/sugoroku/sugoroku.types";
import { playSugoroku, sugorokuComputerMove, sugorokuOver, sugorokuToPlay } from "@/lib/party/sugoroku/sugorokuTable";

import { SUGOROKU_PAUSE_MS } from "./sugoroku.constants";

/**
 * A COMPUTER'S MOVE IN THIS BROWSER, one at a time, as the card games' are
 * (`useHitotsuComputer`): after a short pause, so the table can watch the last
 * move land, and a reader who asked for less motion waits a quarter as long.
 * The search is the package's (`sugorokuComputerMove`), up to about a tenth of
 * a second at the strongest, so the page does not freeze for it. Waits while
 * the tab is hidden; no server is asked anything. Returns the name of the
 * computer about to move, for the page to say so, or null.
 */
export function useSugorokuComputer(table: SugorokuTable, keep: (table: SugorokuTable) => void, played?: () => void): string | null {
  const to = sugorokuOver(table) ? null : sugorokuToPlay(table);
  const strength = to === null ? undefined : SUGOROKU_STRENGTHS.find((one) => one === table.levels[to]);
  const moving = to !== null && table.computers[to] === true && strength !== undefined;
  useEffect(() => {
    if (!moving || strength === undefined) return;
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: number | undefined;
    const move = () => {
      timer = undefined;
      const chosen = sugorokuComputerMove(table, strength, Math.random);
      const next = chosen === null ? null : playSugoroku(table, chosen);
      if (next !== null) {
        played?.();
        keep(next);
      }
    };
    const arm = () => {
      if (timer === undefined && document.visibilityState === "visible") timer = window.setTimeout(move, still ? SUGOROKU_PAUSE_MS / 4 : SUGOROKU_PAUSE_MS);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") arm();
      else if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    };
    arm();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [moving, strength, table, keep, played]);
  return moving && to !== null ? sugorokuSeatName(table.players, table.computers, to) : null;
}
