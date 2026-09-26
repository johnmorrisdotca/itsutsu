import "server-only";

import { replayGame } from "@/lib/gomoku/replay";
import { gameResultFacts } from "@/lib/history/gameResult";
import { fetchGameDetail } from "@/lib/history/gameHistory";

import type { GameBook, GameOverSummary } from "./mail.types";

/**
 * A FINISHED GAME, READ FOR ITS EMAIL: the result card's facts
 * (`gameResultFacts` over the replayed moves), the names, the length and the
 * rating change. Asked only by `sendNotice`, and only once a notice is going
 * to be sent — switched on, with an address — so nothing is read for a game
 * nobody will be told about.
 *
 * Null where the game cannot be read or has no result (an abandoned game),
 * and the email then says only what the event knows. Silence about the game
 * is the safe answer; a summary made up from half a row is not.
 */
export async function readGameOver(gameId: string): Promise<GameOverSummary | null> {
  try {
    const game = await fetchGameDetail(gameId);
    if (game === null || game.status !== "finished") return null;
    const facts = gameResultFacts({ result: game.result, final: replayGame(game), forfeits: game.forfeits, seat: null, hotSeat: false });
    if (facts === null) return null;
    return {
      gameId,
      variant: game.variant,
      facts,
      names: { black: game.blackName, white: game.whiteName },
      moveCount: game.moveCount,
      startedAt: new Date(game.playedAt),
      endedAt: game.lastMoveAt === null ? null : new Date(game.lastMoveAt),
      ratingChange:
        game.blackRatingChange === null || game.whiteRatingChange === null ? null : { black: game.blackRatingChange, white: game.whiteRatingChange },
    };
  } catch (error) {
    console.error("[mail] a finished game could not be read for its notice", error);
    return null;
  }
}

/**
 * A game book that reads each game once, however many seats are told about
 * it: both people at a finished game get an email, and they are about the
 * same game. Made fresh for each ending (`noticeGameOver`), so nothing is
 * held between one game and the next.
 */
export function gameBookOnce(read: (gameId: string) => Promise<GameOverSummary | null> = readGameOver): GameBook {
  const kept = new Map<string, Promise<GameOverSummary | null>>();
  return {
    gameOverOf(gameId) {
      const known = kept.get(gameId);
      if (known !== undefined) return known;
      const reading = read(gameId);
      kept.set(gameId, reading);
      return reading;
    },
  };
}
