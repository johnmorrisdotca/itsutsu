import "server-only";

import { Prisma } from "@prisma/client";

import { forfeitTurn, resign, winOnTime } from "@/lib/gomoku/engine";
import { GAME_STATUS, MOVE_KINDS, STONES } from "@/lib/gomoku/gomoku.constants";
import { fetchTimeOff, timeOffGraceMs } from "@/lib/social/vacation";
import { prisma } from "@/lib/prisma";
import { recordResult } from "@/lib/rating/players";
import { recordPlayed } from "@/lib/rating/playedRun";
import { poolFor } from "@/lib/rating/pools";
import { hasBotSeat } from "@/lib/bots/bots";
import { sendEmail } from "@/lib/notify/email";
import { courtesyMs, deadlineFor, nextDeadline } from "./deadline";
import { fetchGameDetail } from "./gameHistory";
import { FORFEITS_TO_LOSE } from "./gameSettingsSchema";
import { GAME_ROW, isHotSeat, replay, stoneForToken } from "./liveGame";
import { settledTurn } from "./settledTurn";
import type { TimeoutOutcome } from "./liveGame.types";

/**
 * How a shared game ends other than on the board, and the clock's courtesies:
 * a claimed timeout, a resignation, and time given to the other side. Split
 * from liveGame.ts, which keeps creation and the moves themselves.
 */

/**
 * Gives the other side more time on the current move. Only the side that is
 * waiting may give it — it is theirs to give, since it is their win the clock
 * would hand them — and it is kept as a gift on the record, so the courtesy
 * and the need can both be read later.
 */
export async function giveTime(id: string, token: string, now = new Date()): Promise<TimeoutOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null) return { ok: false, reason: "not-found" };
  if (row.status !== "active") return { ok: false, reason: "finished" };
  const giver = stoneForToken(row, token);
  if (giver === null) return { ok: false, reason: "wrong-token" };
  if (row.moveTimeMs === null) return { ok: false, reason: "no-clock" };
  const state = replay(row);
  if (state.status !== GAME_STATUS.playing) return { ok: false, reason: "finished" };
  if (state.toPlay === giver) return { ok: false, reason: "your-own-turn" };

  const deadline = deadlineFor({ ...row, toPlay: state.toPlay });
  /*
   * No clock running is the same answer as no clock at all. The only way to
   * reach here without a deadline is a seat still posted for anyone to take,
   * and defaulting to `now` would write a real deadline against the empty
   * chair — starting, by way of a courtesy, the very clock a posted seat is
   * not supposed to be running.
   */
  if (deadline === null) return { ok: false, reason: "no-clock" };

  const gift = courtesyMs(row.clockMode, row.moveTimeMs);
  const receiver = state.toPlay;
  await prisma.$transaction([
    prisma.timeGift.create({ data: { gameId: id, giver, givenMs: gift } }),
    prisma.game.update({
      where: { id },
      data: {
        extraMs: row.extraMs + gift,
        deadlineAt: new Date(Math.max(deadline.getTime(), now.getTime()) + gift),
        ...(row.clockMode === "game"
          ? receiver === STONES.black
            ? { blackTimeMs: (row.blackTimeMs ?? row.moveTimeMs) + gift }
            : { whiteTimeMs: (row.whiteTimeMs ?? row.moveTimeMs) + gift }
          : {}),
      },
    }),
  ]);
  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}

/**
 * Claims a missed deadline. Only the player waiting may claim, and only once
 * the other side's time is up. Under the graceful penalty the absent colour
 * forfeits the turn — a pass on the record — and three in a row lose the
 * game; under the strict one the game is lost at once. Not claiming is the
 * "pass it back": the game simply waits.
 */
export async function claimTimeout(id: string, token: string, now = new Date()): Promise<TimeoutOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null) return { ok: false, reason: "not-found" };
  if (row.status !== "active") return { ok: false, reason: "finished" };
  const claimant = stoneForToken(row, token);
  if (claimant === null) return { ok: false, reason: "wrong-token" };

  /*
   * The position first, because the deadline now depends on whose turn it is:
   * a computer's seat runs no clock while it is the computer's move.
   */
  const state = replay(row);
  if (state.status !== GAME_STATUS.playing) return { ok: false, reason: "finished" };
  const absent = state.toPlay;

  const deadline = deadlineFor({ ...row, toPlay: absent });
  // No clock, nobody yet to be late, or a computer to move: none of them is a slow player.
  if (deadline === null) return { ok: false, reason: "no-clock" };

  if (absent === claimant) return { ok: false, reason: "your-own-turn" };
  if (now.getTime() < deadline.getTime()) return { ok: false, reason: "not-due" };
  // Away days delay the deadline, unless this game was set up to ignore them.
  if (row.timeoutPenalty !== "game-strict") {
    const off = await fetchTimeOff(absent === STONES.black ? row.blackMemberId : row.whiteMemberId);
    const grace = timeOffGraceMs(off, row.lastMoveAt ?? deadline, deadline);
    if (now.getTime() < deadline.getTime() + grace) return { ok: false, reason: "not-due" };
  }

  const forfeits = (absent === STONES.black ? row.blackForfeits : row.whiteForfeits) + 1;
  // Out of time for the whole game is out of time: the budget cannot forfeit a turn and go on.
  const strict = row.timeoutPenalty !== "turn" || row.clockMode === "game" || forfeits >= FORFEITS_TO_LOSE;
  const next = strict ? winOnTime(state, absent) : forfeitTurn(state);
  if (next === state) return { ok: false, reason: "finished" };
  const finished = next.status !== GAME_STATUS.playing;

  const writes: Prisma.PrismaPromise<unknown>[] = [];
  if (!strict) {
    writes.push(
      prisma.move.create({
        data: { gameId: id, number: next.moves.length, row: -1, col: -1, stone: absent, kind: MOVE_KINDS.pass },
      }),
    );
  }
  writes.push(
    prisma.game.update({
      where: { id },
      data: {
        moveCount: next.moves.length,
        status: finished ? "finished" : "active",
        result: next.winner ?? (finished ? "draw" : "abandoned"),
        winner: next.winner,
        // A forfeited turn passes the move to the other side without anybody
        // having played one, so the stored turn has to move with it.
        ...settledTurn(next),
        lastMoveAt: now,
        deadlineAt: finished ? null : nextDeadline(row, next.toPlay, now),
        extraMs: 0,
        ...(absent === STONES.black ? { blackForfeits: forfeits } : { whiteForfeits: forfeits }),
      },
    }),
  );
  await prisma.$transaction(writes);

  if (finished) {
    // Outside the hot-seat test on purpose: a run over every game played is
    // not a rating, and PLAYED counts a game at one screen. See `playedRun.ts`.
    // The count includes the forfeited turn this claim may just have written.
    await recordPlayed({ ...row, winner: next.winner, moveCount: next.moves.length });
    if (!isHotSeat(row)) {
      if (row.rated) await recordResult(row.blackName, row.whiteName, next.winner, row.variant, poolFor(hasBotSeat(row)));
      await sendEmail({ kind: "game-over", gameId: id, winner: next.winner });
    }
  } else if (!isHotSeat(row)) {
    await sendEmail({ kind: "your-turn", gameId: id, stone: next.toPlay });
  }

  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}

/**
 * Resigns a game. Any seat holder may, at any time while it runs — a game
 * one side has stopped answering is finished by the side that is still
 * here, and a game that is lost is finished by the side that knows it. The
 * other colour wins, and the record says why.
 */
/**
 * Files a game the engine has already decided but nothing wrote down.
 *
 * A game normally ends on a move, and the move that ends it files it. There is
 * one way to reach a finished position without one: a side with no legal turn
 * to take. In Reversi a full board is exactly that — the last stone leaves the
 * position decided, and the player to move has nothing to play.
 *
 * Until this, nobody recorded that. The turn loop noticed the game was over,
 * said thank you for it, and returned — leaving a row that said `active` for
 * ever over a position the engine reads as won. One was found on production
 * that way: sixty moves of Reversi, white the winner, and a game that would
 * have sat in somebody's list until the site was switched off.
 *
 * The write is deliberately the same shape as the move path's and the
 * timeout path's, because it is the same fact being recorded. That there are
 * now three of them is worth fixing, and is not worth fixing in the same
 * change as the bug.
 */
export async function settleEnded(id: string, now = new Date()): Promise<boolean> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null || row.status !== "active" || row.openSeat !== null) return false;

  const state = replay(row);
  if (state.status === GAME_STATUS.playing) return false;

  await prisma.game.update({
    where: { id },
    data: {
      moveCount: state.moves.length,
      status: "finished",
      result: state.winner ?? "draw",
      winner: state.winner,
      // The one place the engine's verdict and the row's status had drifted
      // apart is the place this function exists for, so it writes both.
      ...settledTurn(state),
      lastMoveAt: now,
      deadlineAt: null,
      extraMs: 0,
    },
  });

  // Counted exactly as any other finish is. The run over every game played
  // asks nothing about rating or seats, because PLAYED does not.
  await recordPlayed({ ...row, winner: state.winner, moveCount: state.moves.length });
  // Rated exactly as any other finish is, and by the same rules: never a game
  // at one screen, never a friendly, and always into the pool the seats decide.
  if (!isHotSeat(row) && row.rated) {
    await recordResult(row.blackName, row.whiteName, state.winner, row.variant, poolFor(hasBotSeat(row)));
  }
  return true;
}

/**
 * Calls off a game nothing has happened in.
 *
 * Resigning is the wrong word for a board with no stones on it. John put it
 * plainly: a game with no moves offered "Resign" as its only action, and
 * resigning implies giving something up that was under way. Nothing was.
 *
 * SO IT COSTS NOBODY ANYTHING. No winner, no loser, and no rating write of
 * any kind — not a resignation quietly corrected afterwards, but a path that
 * never calls `recordResult` at all. The game is filed as ended without a
 * result, which is the one thing the stored result can honestly say about it.
 *
 * Allowed even where resigning is not. A host who says nobody may walk away
 * means a game in progress; there is nothing to walk away from before the
 * first stone, and leaving somebody stuck with an empty board for ever would
 * be a rule protecting nothing.
 */
export async function cancelGame(id: string, token: string, now = new Date()): Promise<TimeoutOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null) return { ok: false, reason: "not-found" };
  if (row.status !== "active") return { ok: false, reason: "finished" };
  if (stoneForToken(row, token) === null) return { ok: false, reason: "wrong-token" };
  /*
   * The one thing that makes this different from a resignation, checked
   * against the record rather than a count somebody passed in: a single stone
   * and it is a game, and a game is resigned rather than called off.
   */
  if (row.moves.length > 0) return { ok: false, reason: "not-allowed" };

  /*
   * And deliberately nothing about the settled turn. The engine never ended
   * this game — an empty board is a position it would go on playing — so
   * there is no verdict of its to write down, and inventing one would be the
   * same lie the pair exists to avoid. `status` is what says this game is
   * over, and `status` is what a reader asks first.
   */
  await prisma.game.update({
    where: { id },
    data: {
      status: "finished",
      result: "abandoned",
      winner: null,
      lastMoveAt: now,
      deadlineAt: null,
      extraMs: 0,
    },
  });
  // Deliberately no recordResult. Nothing was played, so nothing is owed.
  if (!isHotSeat(row)) await sendEmail({ kind: "game-over", gameId: id, winner: null });

  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}

export async function resignGame(id: string, token: string, now = new Date()): Promise<TimeoutOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null) return { ok: false, reason: "not-found" };
  if (row.status !== "active") return { ok: false, reason: "finished" };
  const loser = stoneForToken(row, token);
  if (loser === null) return { ok: false, reason: "wrong-token" };
  // The host may have set the game up so that nobody walks away from it.
  if (!row.allowResign) return { ok: false, reason: "not-allowed" };

  const state = replay(row);
  const next = resign(state, loser);
  if (next === state || next.winner === null) return { ok: false, reason: "finished" };

  await prisma.game.update({
    where: { id },
    data: {
      status: "finished",
      result: next.winner,
      winner: next.winner,
      // Resigned is ended, and nobody is to move in an ended game.
      ...settledTurn(next),
      lastMoveAt: now,
    },
  });
  // A resigned game is a decided game, whoever it was against and whether or
  // not anything rated it. Resigning adds no move, so the count is the record's.
  await recordPlayed({ ...row, winner: next.winner, moveCount: next.moves.length });
  if (!isHotSeat(row)) {
    if (row.rated) await recordResult(row.blackName, row.whiteName, next.winner, row.variant, poolFor(hasBotSeat(row)));
    await sendEmail({ kind: "game-over", gameId: id, winner: next.winner });
  }

  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}
