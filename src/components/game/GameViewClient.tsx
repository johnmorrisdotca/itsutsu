"use client";

import dynamic from "next/dynamic";

import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { GameDetail } from "@/lib/history/gameHistory.types";

/**
 * The board, loaded on the client only.
 *
 * A game in progress is restored from local storage while state is first set
 * up, which the server cannot know about. Skipping the server render is what
 * lets the restore happen in one pass instead of rendering an empty board and
 * then correcting it.
 */
const GameView = dynamic(
  () => import("./GameView").then((module) => module.GameView),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[24rem] w-full items-center justify-center text-sm text-muted">
        Setting out the board…
      </div>
    ),
  },
);

export function GameViewClient({
  variant,
  trackPath = false,
  match = null,
}: {
  variant?: RuleVariant;
  /** Keep the address at /games/<slug> as the game in play changes. */
  trackPath?: boolean;
  /** A match opened at its own address. */
  match?: { game: GameDetail; at?: number } | null;
}) {
  return <GameView variant={variant} trackPath={trackPath} match={match} />;
}
