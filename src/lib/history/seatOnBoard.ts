import type { SeatOnBoard } from "@/components/mine/startGame.types";
import { STONES } from "@/lib/gomoku/gomoku.constants";

import type { GameSummary } from "./gameHistory.types";

/**
 * A seat as the set-up screen and the lobby sentence read it: everything its
 * game is, so it is only offered to somebody who chose that game, and who is
 * waiting in it. One mapping for both, so neither can offer a seat on less.
 *
 * Pure and on its own, so the lobby's choice of seat can be tested without the
 * session reads `seatsToSitAt` makes.
 */
export function seatOnBoard(game: GameSummary): SeatOnBoard {
  return {
    id: game.id,
    variant: game.variant,
    size: game.size,
    moveTimeMs: game.moveTimeMs,
    opening: game.opening,
    obstacles: game.obstacles,
    rated: game.rated,
    handicap: game.handicap,
    clockMode: game.clockMode,
    timeoutPenalty: game.timeoutPenalty,
    who: (game.openSeat === STONES.black ? game.whiteName : game.blackName).trim() || "Somebody",
  };
}
