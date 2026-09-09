import "server-only";

import { Prisma } from "@prisma/client";

import { forfeitTurn, resign, winOnTime } from "@/lib/gomoku/engine";
import { GAME_STATUS, MOVE_KINDS, STONES } from "@/lib/gomoku/gomoku.constants";
import { fetchTimeOff, timeOffGraceMs } from "@/lib/social/vacation";
import { prisma } from "@/lib/prisma";
import { recordResult } from "@/lib/rating/players";
import { sendEmail } from "@/lib/notify/email";
import { courtesyMs, deadlineFor, nextDeadline } from "./deadline";
import { fetchGameDetail } from "./gameHistory";
import { FORFEITS_TO_LOSE } from "./gameSettingsSchema";
import { GAME_ROW, isHotSeat, replay, stoneForToken } from "./liveGame";
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

  const gift = courtesyMs(row.clockMode, row.moveTimeMs);
  const deadline = deadlineFor(row) ?? now;
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

  const deadline = deadlineFor(row);
  if (deadline === null) return { ok: false, reason: "no-clock" };

  const state = replay(row);
  if (state.status !== GAME_STATUS.playing) return { ok: false, reason: "finished" };
  const absent = state.toPlay;
  if (absent === claimant) return { ok: false, reason: "your-own-turn" };
  if (now.getTime() < deadline.getTime()) return { ok: false, reason: "not-due" };
  // Away days delay the deadline, unless this game was set up to ignore them.
  if (row.timeoutPenalty !== "game-strict") {
    const off = await fetchTimeOff(absent === STONES.black ? row.blackMember : row.whiteMember);
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
        lastMoveAt: now,
        deadlineAt: finished ? null : nextDeadline(row, next.toPlay, now),
        extraMs: 0,
        ...(absent === STONES.black ? { blackForfeits: forfeits } : { whiteForfeits: forfeits }),
      },
    }),
  );
  await prisma.$transaction(writes);

  if (finished) {
    if (!isHotSeat(row)) {
      if (row.rated) await recordResult(row.blackName, row.whiteName, next.winner, row.variant);
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
    data: { status: "finished", result: next.winner, winner: next.winner, lastMoveAt: now },
  });
  if (!isHotSeat(row)) {
    if (row.rated) await recordResult(row.blackName, row.whiteName, next.winner, row.variant);
    await sendEmail({ kind: "game-over", gameId: id, winner: next.winner });
  }

  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}
