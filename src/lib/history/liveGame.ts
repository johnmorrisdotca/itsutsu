import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  canTwist,
  createGame,
  forfeitTurn,
  inMovePhase,
  isLegalMove,
  movePiece,
  mustPass,
  passTurn,
  pieceMoves,
  placePiece,
  playMove,
  replayMoves,
  resign,
  resolvePlacement,
  twistBoard,
  winOnTime,
} from "@/lib/gomoku/engine";
import { GAME_STATUS, MOVE_KINDS, SEED_RANGE, STONES } from "@/lib/gomoku/gomoku.constants";
import { seedFromRoll } from "@/lib/gomoku/rules/random";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import { fetchGameDetail } from "./gameHistory";
import { recordResult } from "@/lib/rating/players";
import { sendEmail } from "@/lib/notify/email";
import { parseHandicap, storedHandicap } from "./gameSettingsSchema";
import type {
  CreatedGame,
  LiveGameSettings,
  MoveOutcome,
  MoveRequest,
  SettingsOutcome,
  TimeoutOutcome,
} from "./liveGame.types";
import { FORFEITS_TO_LOSE } from "./gameSettingsSchema";
import { deadlineFor } from "./deadline";
import { toGameMove } from "./gameHistory";

/** Prisma's code for "a unique constraint was violated". */
const UNIQUE_VIOLATION = "P2002";

const GAME_ROW = {
  id: true,
  status: true,
  size: true,
  winLength: true,
  variant: true,
  obstacles: true,
  opener: true,
  opening: true,
  handicap: true,
  seed: true,
  blackName: true,
  whiteName: true,
  moveTimeMs: true,
  timeoutPenalty: true,
  lastMoveAt: true,
  blackForfeits: true,
  whiteForfeits: true,
  allowResign: true,
  openSeat: true,
  openedAt: true,
  blackToken: true,
  whiteToken: true,
  moves: {
    orderBy: { number: "asc" },
    select: {
      number: true,
      row: true,
      col: true,
      stone: true,
      kind: true,
      fromRow: true,
      fromCol: true,
      twistQuadrant: true,
      twistClockwise: true,
      cells: true,
    },
  },
} satisfies Prisma.GameSelect;

type GameRow = Prisma.GameGetPayload<{ select: typeof GAME_ROW }>;

/**
 * Rebuilds the position by replaying the stored moves through the engine.
 *
 * The database keeps a move list, never a board. Replaying is what guarantees
 * a shared game obeys exactly the same rules as a local one — there is no
 * second implementation of "who has won" on the server.
 */
function replay(row: GameRow): GameState {
  const start = createGame({
    size: row.size,
    winLength: row.winLength,
    variant: row.variant as GameState["settings"]["variant"],
    obstacles: row.obstacles as GameState["settings"]["obstacles"],
    opening: row.opening as GameState["settings"]["opening"],
    handicap: parseHandicap(row.handicap),
    seed: row.seed,
    firstPlayer: row.opener as Stone,
    // A shared game is played from two devices, so neither side may rewind it.
    allowUndo: false,
    allowSwap: false,
  });

  const timeline = replayMoves(start, row.moves.map(toGameMove));
  return timeline[timeline.length - 1];
}

/** Starts an empty game and mints a key for each seat. */
export async function createLiveGame(
  input: LiveGameSettings & {
    blackName: string;
    whiteName: string;
    winLength: number;
    opener: Stone;
  },
): Promise<CreatedGame> {
  const { handicap, open, ...rest } = input;
  const game = await prisma.game.create({
    data: {
      ...rest,
      handicap: storedHandicap(handicap) ?? undefined,
      // An open game posts its white seat for anyone; the creator sits as black.
      openSeat: open ? STONES.white : null,
      openedAt: open ? new Date() : null,
      // The server draws the seed: the two players must see the same board.
      seed: seedFromRoll(Math.random(), SEED_RANGE),
      // The first deadline runs from the moment the game exists.
      lastMoveAt: new Date(),
      status: "active",
      result: "abandoned",
      moveCount: 0,
    },
    select: { id: true, blackToken: true, whiteToken: true },
  });
  return game;
}

/**
 * Changes a shared game's rules. Only a seat holder may, and only while the
 * board is empty: once a stone is down the rules are part of the record.
 */
export async function updateLiveGameSettings(
  id: string,
  token: string,
  settings: LiveGameSettings & { winLength: number },
): Promise<SettingsOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null) return { ok: false, reason: "not-found" };
  if (row.status !== "active") return { ok: false, reason: "finished" };
  if (stoneForToken(row, token) === null) return { ok: false, reason: "wrong-token" };
  if (row.moves.length > 0) return { ok: false, reason: "started" };

  const { handicap, open, ...rest } = settings;
  await prisma.game.update({
    where: { id },
    data: {
      ...rest,
      handicap: storedHandicap(handicap) ?? Prisma.JsonNull,
      openSeat: open ? STONES.white : null,
      openedAt: open ? (row.openedAt ?? new Date()) : null,
      seed: seedFromRoll(Math.random(), SEED_RANGE),
    },
  });

  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}


/** The seat a token holds, or null when the token belongs to neither. */
function stoneForToken(row: GameRow, token: string): Stone | null {
  if (token === row.blackToken) return STONES.black;
  if (token === row.whiteToken) return STONES.white;
  return null;
}

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

  const stone = stoneForToken(row, token);
  if (stone === null) return { ok: false, reason: "wrong-token" };

  const state = replay(row);
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
    if (!mustPass(state)) return { ok: false, reason: "illegal" };
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
          lastMoveAt: new Date(),
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

  if (finished) {
    await recordResult(row.blackName, row.whiteName, next.winner);
    await sendEmail({ kind: "game-over", gameId: id, winner: next.winner });
  } else if (next.toPlay !== stone) {
    await sendEmail({ kind: "your-turn", gameId: id, stone: next.toPlay });
  }

  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}

/** The colour a token holds, for a page deciding which seat the reader is in. */
export async function seatForToken(
  id: string,
  token: string | undefined,
): Promise<Stone | null> {
  if (token === undefined || token === "") return null;
  const row = await prisma.game.findUnique({
    where: { id },
    select: { blackToken: true, whiteToken: true },
  });
  if (row === null) return null;
  if (token === row.blackToken) return STONES.black;
  if (token === row.whiteToken) return STONES.white;
  return null;
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

  const forfeits = (absent === STONES.black ? row.blackForfeits : row.whiteForfeits) + 1;
  const strict = row.timeoutPenalty === "game" || forfeits >= FORFEITS_TO_LOSE;
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
        ...(absent === STONES.black ? { blackForfeits: forfeits } : { whiteForfeits: forfeits }),
      },
    }),
  );
  await prisma.$transaction(writes);

  if (finished) {
    await recordResult(row.blackName, row.whiteName, next.winner);
    await sendEmail({ kind: "game-over", gameId: id, winner: next.winner });
  } else {
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
  await recordResult(row.blackName, row.whiteName, next.winner);
  await sendEmail({ kind: "game-over", gameId: id, winner: next.winner });

  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}
