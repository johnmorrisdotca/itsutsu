/// <reference lib="webworker" />

import type { OnlineGameKey } from "./online.types";
import { computerPlayOf } from "./onlineComputerMoves";
import { onlineRulesOf } from "./onlineGames";

/**
 * A COMPUTER'S MOVE AT A TABLE, WORKED OUT OFF THE PAGE: the browser that
 * should answer for a computer's seat (`computerDriver`) hands this worker the
 * table's game as its rules keep it, the seat and the computer's level, and
 * gets back the move to send — so a search on the browser's budget never
 * freezes the board. Never on the server: the move is sent like anybody's and
 * checked there by the same rules.
 */

export type ComputerAsk = { id: number; game: OnlineGameKey; state: string; seat: number; level: string };

export type ComputerAnswer = { id: number; seat: number; move: unknown };

self.addEventListener("message", async (event: MessageEvent<ComputerAsk>) => {
  const ask = event.data;
  let move: unknown = null;
  try {
    const rules = onlineRulesOf(ask.game);
    const game = rules.decode(ask.state);
    const computer = computerPlayOf(ask.game);
    if (game !== null) await computer?.prepare?.(game);
    move = game === null || computer === undefined ? null : computer.move(game, ask.seat, ask.level);
  } catch (error) {
    // A computer that cannot move says so by answering nothing; the page waits for a person to notice, as the live board does.
    console.error(error);
  }
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id: ask.id, seat: ask.seat, move } satisfies ComputerAnswer);
});
