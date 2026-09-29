"use client";

import { BoardWallpaper } from "@/components/history/BoardWallpaper";
import { gameCopyFor } from "@/lib/catalogue/gameKeys";
import type { GameKey } from "@/lib/catalogue/gameKeys";
import { slugFor } from "@/lib/gomoku/slugs";

/**
 * A FINISHED TABLE'S WALLPAPER (`BoardWallpaper`): the board as the game
 * ended, named with the game and how it ended ("Aiko wins"). Offered beside
 * the table's own Play again, once the game is over.
 */
export function TableWallpaper({ game, result }: { game: GameKey; result: string }) {
  return (
    <BoardWallpaper id={`table-${game}`} name={gameCopyFor(game).label} details={() => [result]} fileName={`itsutsu-${slugFor(game)}.png`} />
  );
}
