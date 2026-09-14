import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { canPass, canTwist, inMovePhase, isLegalMove, movePiece, passTurn, pieceMoves, placePiece, playMove, resolvePlacement, twistBoard } from "@/lib/gomoku/engine";
import { GAME_STATUS, MOVE_KINDS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import { fetchGameDetail } from "./gameHistory";
import { recordResult } from "@/lib/rating/recordResult";
import { recordPlayed } from "@/lib/rating/playedRun";
import { poolFor } from "@/lib/rating/pools";
import { hasBotSeat } from "@/lib/bots/bots";
import { noticeGameOver, noticeYourTurn } from "@/lib/notify/gameNotices";
import { awardAnsweredChallenge } from "@/lib/xp/xpSocial";
import type { MoveOutcome, MoveRequest } from "./liveGame.types";
import { nextDeadline } from "./deadline";
import { settledTurn } from "./settledTurn";
import { GAME_ROW, isHotSeat, replay, stoneForToken } from "./liveGameRow";
import { isOffered } from "./offers";

/*
 * Playing a move on a live game. The row shape, the replay and the seat lookups
 * are in `liveGameRow.ts`, and making a game is in `liveGameCreate.ts`; both
 * are re-exported here so every caller that imported them from this file still
 * does, and neither of them imports this file back.
 */
export { GAME_ROW, isHotSeat, replay, seatForToken, stoneForToken } from "./liveGameRow";
export type { GameRow } from "./liveGameRow";
export { createLiveGame } from "./liveGameCreate";

/*
 * Changing a game's rules moved to `liveGameSettings.ts`, which imports from
 * here. Deliberately NOT re-exported from this file: that would make the two
 * modules import each other, and a cycle to save one caller an import line is
 * a worse trade than the line. This file keeps creation and the moves
 * themselves, as `liveGameEndings.ts` has always said it does.
 */

/** Prisma's code for "a unique constraint was violated". */
const UNIQUE_VIOLATION = "P2002";

/**
 * Plays one stone on a shared game.
 *
 * Every rule is re-checked here rather than trusted from the client: whose
 * turn it is, whether the intersection is free, and whether the game is still
 * running. The token is the only thing standing in for a sign-in, so it is
 * checked against the colour to move, not merely against the game.
 */
export async function appendMove(
  id: string,
  token: string,
  request: MoveRequest,
): Promise<MoveOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null) return { ok: false, reason: "not-found" };
  if (row.status !== "active") return { ok: false, reason: "finished" };
  /*
   * AN OFFER IS ANSWERED, NOT PLAYED — by anybody, including the person who
   * made it. Before the token check rather than after, because it is a fact
   * about the GAME and not about who is asking: a fork carries moves across, so
   * an offered board can have stones on it and a position whose turn it is, and
   * the offerer holds a perfectly good token for their own seat. Nothing about
   * that adds up to a game the other person has agreed to play.
   */
  if (isOffered(row)) return { ok: false, reason: "offered" };

  const state = replay(row);
  // One token for both chairs plays whoever is to move.
  const stone = isHotSeat(row) && token === row.blackToken ? state.toPlay : stoneForToken(row, token);
  if (stone === null) return { ok: false, reason: "wrong-token" };
  if (state.toPlay !== stone) return { ok: false, reason: "not-your-turn" };

  /*
   * Three shapes of move, each checked by the engine exactly as a local game
   * checks it: a stone, a sliding piece, or the twist that finishes a stone.
   * A twist updates the row of the stone it completes rather than adding one,
   * so the record stays one row per stone and a replay stays in step.
   */
  let next: GameState;
  let write: Prisma.PrismaPromise<unknown>;
  if (request.kind === MOVE_KINDS.move) {
    const allowed = pieceMoves(state, request.from).some(
      (to) => to.row === request.row && to.col === request.col,
    );
    if (!inMovePhase(state) || !allowed) return { ok: false, reason: "illegal" };
    next = movePiece(state, request.from, { row: request.row, col: request.col });
    write = prisma.move.create({
      data: {
        gameId: id,
        number: next.moves.length,
        row: request.row,
        col: request.col,
        fromRow: request.from.row,
        fromCol: request.from.col,
        stone,
        kind: MOVE_KINDS.move,
      },
    });
  } else if (request.kind === MOVE_KINDS.piece) {
    next = placePiece(state, request.cells);
    if (next === state) return { ok: false, reason: "illegal" };
    write = prisma.move.create({
      data: {
        gameId: id,
        number: next.moves.length,
        row: request.cells[0].row,
        col: request.cells[0].col,
        stone,
        kind: MOVE_KINDS.piece,
        cells: request.cells,
      },
    });
  } else if (request.kind === MOVE_KINDS.pass) {
    // Forced, or chosen at any point in Go: `canPass`, never `mustPass`. See why there.
    if (!canPass(state)) return { ok: false, reason: "illegal" };
    next = passTurn(state);
    write = prisma.move.create({
      data: { gameId: id, number: next.moves.length, row: -1, col: -1, stone, kind: MOVE_KINDS.pass },
    });
  } else if (request.kind === "twist") {
    if (!canTwist(state)) return { ok: false, reason: "illegal" };
    next = twistBoard(state, request.quadrant, request.clockwise);
    if (next === state) return { ok: false, reason: "illegal" };
    write = prisma.move.update({
      where: { gameId_number: { gameId: id, number: state.moves.length } },
      data: { twistQuadrant: request.quadrant, twistClockwise: request.clockwise },
    });
  } else {
    const point = resolvePlacement(state, { row: request.row, col: request.col });
    if (!isLegalMove(state, point)) return { ok: false, reason: "illegal" };
    next = playMove(state, point, MOVE_KINDS.place, request.stone ?? null);
    const placed = next.moves[next.moves.length - 1];
    write = prisma.move.create({
      data: {
        gameId: id,
        number: next.moves.length,
        row: point.row,
        col: point.col,
        // The colour placed; the mover is the seat that sent it.
        stone: placed.stone,
        kind: MOVE_KINDS.place,
      },
    });
  }
  const finished = next.status !== GAME_STATUS.playing;
  const now = new Date();
  const clock = spendClock(row, stone, now);

  try {
    await prisma.$transaction([
      /*
       * The unique index on (gameId, number) is the concurrency control. Two
       * devices racing to play the same move number cannot both succeed, so
       * the loser is told to reload rather than silently overwriting.
       */
      write,
      prisma.game.update({
        where: { id },
        data: {
          moveCount: next.moves.length,
          status: finished ? "finished" : "active",
          result: next.winner ?? (finished ? "draw" : "abandoned"),
          winner: next.winner,
          /*
           * Whose turn it is now, written by the only party that knows without
           * work: `next` is the position this move settled into. A list of
           * games used to replay every move of every game in it to learn the
           * same fact — see `settledTurn` — and it is written in this same
           * transaction as the move, so the two can never disagree.
           */
          ...settledTurn(next),
          lastMoveAt: now,
          ...clock,
          deadlineAt: finished ? null : nextDeadline({ ...row, ...clock }, next.toPlay, now),
          extraMs: 0,
          // A move made in time clears the mover's run of forfeits.
          ...(stone === STONES.black ? { blackForfeits: 0 } : { whiteForfeits: 0 }),
        },
      }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_VIOLATION
    ) {
      return { ok: false, reason: "conflict" };
    }
    throw error;
  }

  /*
   * The move that answers a challenge, when that is what this is. Every test it
   * makes is on columns already in hand, and it reads the ledger — once, on a
   * seat's first move — only for a game two members were bound to and nobody
   * posted. See `xpSocial.ts`, which explains how the asker is known at all.
   */
  await awardAnsweredChallenge(row, stone);

  if (finished) {
    /*
     * The run over every game played, first and with no test in front of it.
     * It is what the PLAYED column counts, and that column counts a friendly
     * and a game at one screen exactly as it counts a rated one — so the two
     * tests below must not narrow it. See `rating/playedRun.ts`.
     */
    // The count AFTER this move, which is the one the XP ledger asks about: the
    // row's own `moveCount` is written in the same transaction and `GAME_ROW`
    // does not read it back, so `next` is the only thing here that knows.
    await recordPlayed({ ...row, hotSeat: isHotSeat(row), winner: next.winner, moveCount: next.moves.length });
    // A game at one screen is filed, never rated: the site cannot tell who was playing. Nor is a friendly.
    if (!isHotSeat(row) && row.rated) await recordResult(row.blackName, row.whiteName, next.winner, row.variant, poolFor(hasBotSeat(row)));
    // To the people seated only: never a program, a typed name or a board at one screen. See `gameNotices.ts`.
    await noticeGameOver({ ...row, hotSeat: isHotSeat(row) }, id, next.winner);
  } else if (next.toPlay !== stone) {
    await noticeYourTurn({ ...row, hotSeat: isHotSeat(row) }, id, next.toPlay);
  }

  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}

/**
 * What a move does to the clock. Under the whole-game clock the mover's
 * budget loses the time they took; under the per-move clock nothing carries.
 */
function spendClock(
  row: { clockMode: string; moveTimeMs: number | null; lastMoveAt: Date | null; blackTimeMs: number | null; whiteTimeMs: number | null; extraMs: number },
  mover: Stone,
  now: Date,
): { blackTimeMs: number | null; whiteTimeMs: number | null } {
  const { blackTimeMs, whiteTimeMs } = row;
  if (row.clockMode !== "game" || row.moveTimeMs === null || row.lastMoveAt === null) return { blackTimeMs, whiteTimeMs };
  // Courtesy time for this move is not charged to the mover.
  const taken = Math.max(0, now.getTime() - row.lastMoveAt.getTime() - row.extraMs);
  const left = (mover === STONES.black ? blackTimeMs : whiteTimeMs) ?? row.moveTimeMs;
  const remaining = Math.max(0, left - taken);
  return mover === STONES.black ? { blackTimeMs: remaining, whiteTimeMs } : { blackTimeMs, whiteTimeMs: remaining };
}
