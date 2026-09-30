// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { PACHISI_HOME, PACHISI_NEST, PACHISI_TRACK } from "./pachisi.constants";
import { isSafe, pachisiMoves, playPachisi, squareOf } from "./pachisi";
import type { PachisiGame, PachisiMove, PachisiSeat } from "./pachisi.types";

/**
 * THE COMPUTER AT THE TABLE: a steady player, not a perfect one. It tries
 * every move it is offered and keeps the one that leaves the board best for
 * it — its pawns further on, out of the nest, home, on safe squares, and out
 * of reach of an opponent's next throw; its opponents' pawns sent back. Every
 * die is on the table, so it reads nothing a person could not see.
 */

/** How far back an opponent's pawn threatens: the most two dice can throw. */
const REACH = 12;

/** Whether an opponent's pawn stands within a throw behind this square of the track. */
function threatened(game: PachisiGame, seat: PachisiSeat, square: number): boolean {
  return game.pawns.some((pawns, other) =>
    other === seat
      ? false
      : pawns.some((progress) => {
          const at = squareOf(game.arms[other], progress);
          if (at === null) return false;
          const behind = (square - at + PACHISI_TRACK) % PACHISI_TRACK;
          return behind >= 1 && behind <= REACH;
        }),
  );
}

/** How good the board is for this seat. */
function worth(game: PachisiGame, seat: PachisiSeat): number {
  if (game.phase === "finished") return game.winners.includes(seat) ? 100_000 : -100_000;
  let total = 0;
  game.pawns.forEach((pawns, at) => {
    for (const progress of pawns) {
      const value = progress === PACHISI_NEST ? -12 : progress + (progress === PACHISI_HOME ? 25 : 0);
      if (at !== seat) {
        total -= value * 0.6;
        continue;
      }
      total += value;
      const square = squareOf(game.arms[at], progress);
      if (square !== null && !isSafe(square) && threatened(game, seat, square)) total -= 9;
      if (square !== null && isSafe(square)) total += 3;
    }
  });
  return total;
}

/** The move the computer makes now; always one `pachisiMoves` offers. */
export function pachisiComputerMove(game: PachisiGame): PachisiMove {
  const offered = pachisiMoves(game);
  if (offered.length === 1) return offered[0];
  let best = offered[0];
  let bestWorth = -Infinity;
  for (const move of offered) {
    const next = playPachisi(game, move);
    if (next === null) continue;
    const value = worth(next, game.toPlay);
    if (value > bestWorth) {
      best = move;
      bestWorth = value;
    }
  }
  return best;
}
