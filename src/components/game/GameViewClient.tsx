"use client";

import dynamic from "next/dynamic";

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

export function GameViewClient() {
  return <GameView />;
}
