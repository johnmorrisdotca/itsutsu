"use client";

import useSWR from "swr";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { GameDetail } from "@/lib/history/gameHistory.types";

import { LiveMoves } from "./LiveMoves";

/**
 * The live game's moves, in the panel beside the board. John, 2026-09-23:
 * "Why is Moves list below in a space when RHS has space for it?"
 *
 * The side column is drawn by the page, not by the board, so it reads the game
 * from the cache the board keeps: the same key `useLiveGame` polls, with no
 * fetcher of its own. It never asks the site for anything — every move the
 * board hears of, from either side, reaches this list through that one cache.
 */
export function LiveMovesPanel({ initial }: { initial: GameDetail }) {
  const { data } = useSWR<GameDetail>(`/api/games/${initial.id}`, null, { fallbackData: initial });
  return (
    <div className={PANEL_CLASS} data-testid="live-moves-panel">
      <LiveMoves detail={data ?? initial} />
    </div>
  );
}
