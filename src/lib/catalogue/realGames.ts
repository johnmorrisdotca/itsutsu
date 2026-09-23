import "server-only";

import { unstable_cache } from "next/cache";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import { replayGame } from "@/lib/gomoku/replay";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { NOT_A_REFUSED_OFFER } from "@/lib/history/offers";
import { prisma } from "@/lib/prisma";

/**
 * A GAME'S OWN ART, made of its real games (John, 2026-09-10): "like a visual
 * tab for that game." The final positions of the last few games of it that
 * were played out, as a mosaic on its page — the record made visible, and it
 * changes as the game is played.
 *
 * Replaying a game is real work, so none of it happens per request: the tiles
 * are worked out once an hour for each game and kept, one read of a dozen
 * games at a time, and a page view reads the kept answer. A board is kept as a
 * short string — one letter a point — so the cache holds pictures, not games.
 */

/** One finished game, as the mosaic draws it: `b`, `w`, `.` for empty, `x` for anything else on a point. */
export type MosaicTile = { id: string; size: number; board: string };

/** How many games a mosaic shows. */
export const MOSAIC_TILES = 12;

/** Fewer moves than this and there is nothing much to look at. */
const MOSAIC_MIN_MOVES = 6;

function drawn(cell: unknown): string {
  if (cell === STONES.black) return "b";
  if (cell === STONES.white) return "w";
  return cell === null ? "." : "x";
}

async function readTiles(variant: string): Promise<MosaicTile[]> {
  const games = await prisma.game.findMany({
    where: { variant, status: "finished", moveCount: { gte: MOSAIC_MIN_MOVES }, ...NOT_A_REFUSED_OFFER },
    orderBy: { playedAt: "desc" },
    take: MOSAIC_TILES,
    select: { id: true },
  });
  const tiles: MosaicTile[] = [];
  for (const { id } of games) {
    const detail = await fetchGameDetail(id, { whole: true });
    if (detail === null) continue;
    try {
      const state = replayGame(detail);
      tiles.push({ id, size: state.settings.size, board: state.board.map(drawn).join("") });
    } catch (error) {
      // A game that will not replay is left out of the picture, not allowed to break the page.
      console.error("[mosaic] could not replay", id, error);
    }
  }
  return tiles;
}

/** The mosaic for a game, kept for an hour. */
export const realGameTiles = unstable_cache(readTiles, ["real-game-tiles"], { revalidate: 3600 });
