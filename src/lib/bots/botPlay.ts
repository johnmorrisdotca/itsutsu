import "server-only";

import { GAME_STATUS, MOVE_KINDS, STONES } from "@/lib/gomoku/gomoku.constants";
import { chooseTurn } from "@/lib/gomoku/opponent";
import type { BotTurn } from "@/lib/gomoku/opponent.types";
import { appendMove, GAME_ROW, replay } from "@/lib/history/liveGame";
import type { MoveRequest } from "@/lib/history/liveGame.types";
import { prisma } from "@/lib/prisma";
import { botInSeat } from "./bots";
import { settleEnded } from "@/lib/history/liveGameEndings";
import { farewellFromBots, greetFromBot } from "./botTalk";
import { BOT_MOVE_MILLIS, BOT_TURNS_PER_REQUEST } from "./bots.constants";

/**
 * Taking a computer player's turn.
 *
 * Deliberately outside `appendMove` rather than inside it. A move on a shared
 * game already does a great deal — it replays the record, checks the rules,
 * writes the clock, rates the result, sends the mail — and a computer's reply
 * is another whole move, with all of that again. Calling it from the route
 * that just finished one keeps the recursion visible and bounded: the human's
 * request plays their stone, then asks for the answer, and comes back with
 * both. Nobody waits for a poll to see what the computer did.
 *
 * Every move it makes goes through `appendMove` exactly as a person's does.
 * There is no privileged path: the same token check, the same rules, the same
 * unique index deciding a race. A computer player cannot play out of turn, and
 * if the position is not its move, this does nothing at all.
 */

/** The turn a computer took, in the shape the move endpoint speaks. */
function asRequests(turn: BotTurn): MoveRequest[] {
  if (turn.kind === MOVE_KINDS.pass) return [{ kind: "pass" }];
  if (turn.kind === MOVE_KINDS.move) {
    return [{ kind: "move", row: turn.row, col: turn.col, from: turn.from }];
  }
  if (turn.kind === MOVE_KINDS.piece) return [{ kind: "piece", cells: turn.cells }];

  const place: MoveRequest = {
    kind: "place",
    row: turn.row,
    col: turn.col,
    ...(turn.stone === undefined ? {} : { stone: turn.stone }),
  };
  /*
   * A twist game's stone and its quarter turn are two writes on the record
   * even though they are one decision, because that is how the record is
   * shaped: the twist updates the row of the stone it completes. So the turn
   * arrives here as two requests, in order, and the second must follow the
   * first or the game sits owing a twist.
   */
  if (turn.twist === undefined) return [place];
  return [place, { kind: "twist", ...turn.twist }];
}

/**
 * Plays out every turn that is a computer's to take, in order, and stops the
 * moment it is a person's move again.
 *
 * The loop is what handles the games where one turn is more than one stone —
 * two a turn in Connect6 — and the case of a computer sitting opposite a
 * computer. It is bounded: a request answers a request, and a game that would
 * not stop asking is a bug rather than a long game.
 */
export async function playBotTurns(
  id: string,
  millis: number = BOT_MOVE_MILLIS,
): Promise<void> {
  for (let taken = 0; taken < BOT_TURNS_PER_REQUEST; taken += 1) {
    const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
    if (row === null) return;
    if (row.status !== "active") {
      await farewellFromBots(id, row);
      return;
    }
    // A posted seat has nobody in it; a computer does not sit down by playing.
    if (row.openSeat !== null) return;

    const state = replay(row);
    /*
     * The game is over — by five, by a resignation, by a flag, or by a draw.
     * A person thanks their opponent for all of those, so the computer does
     * too, and this is the one place that is reached however it ended: the
     * move that finished it calls back here for the reply that never comes.
     *
     * And file it, if nothing has. Almost always the move that ended the game
     * did that already and this changes nothing. The exception is a position
     * that ends with nobody able to move — a full Reversi board — where there
     * is no last move to do the filing, and the row would say `active` for
     * ever over a game the engine reads as won. One was found on production
     * exactly like that. Filed BEFORE the farewell so the thank-you lands on a
     * finished game and carries the move it ended on.
     */
    if (state.status !== GAME_STATUS.playing) {
      await settleEnded(id);
      await farewellFromBots(id, row);
      return;
    }
    const tier = botInSeat(row, state.toPlay);
    if (tier === null) return;

    // Hello, before the first stone it plays. Said once, and only to a person.
    await greetFromBot(id, row, state.toPlay);

    const turn = chooseTurn(state, tier, Math.random, { millis });
    if (turn === null) return;

    const token = state.toPlay === STONES.black ? row.blackToken : row.whiteToken;
    for (const request of asRequests(turn)) {
      const outcome = await appendMove(id, token, request);
      /*
       * A refusal is not something to retry. Either somebody moved first — the
       * unique index on the move number saw to that — or the position moved on
       * underneath us, and in both cases the next pass round this loop reads
       * the game as it now is and decides again.
       */
      if (!outcome.ok) return;
    }
  }
}

/**
 * Whether this game is waiting on a computer right now. Cheap enough to ask
 * before spending a request on `playBotTurns`.
 */
export async function waitingOnBot(id: string): Promise<boolean> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null || row.status !== "active" || row.openSeat !== null) return false;
  const state = replay(row);
  if (state.status !== GAME_STATUS.playing) return false;
  return botInSeat(row, state.toPlay) !== null;
}
