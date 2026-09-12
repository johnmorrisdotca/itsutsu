import "server-only";

import { randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { freeGameId } from "./gameId";
import { canTwist, createGame, inMovePhase, isLegalMove, movePiece, mustPass, passTurn, pieceMoves, placePiece, playMove, resolvePlacement, twistBoard } from "@/lib/gomoku/engine";
import { replayMoves } from "@/lib/gomoku/rules/record";
import { GAME_STATUS, MOVE_KINDS, SEED_RANGE, STONES, sizeForVariant } from "@/lib/gomoku/gomoku.constants";
import { seedFromRoll } from "@/lib/gomoku/rules/random";
import type { GameState, RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { fetchGameDetail } from "./gameHistory";
import { recordResult } from "@/lib/rating/players";
import { recordPlayed } from "@/lib/rating/playedRun";
import { UnwinnableGame, unwinnableBecause } from "./winnableGame";
import { poolFor } from "@/lib/rating/pools";
import { hasBotSeat } from "@/lib/bots/bots";
import { sendEmail } from "@/lib/notify/email";
import { parseHandicap, storedHandicap } from "./gameSettingsSchema";
import type {
  CreatedGame,
  LiveGameSettings,
  MoveOutcome,
  MoveRequest,
} from "./liveGame.types";
import { nextDeadline } from "./deadline";
import { UNSETTLED, settledTurn } from "./settledTurn";
import { toGameMove } from "./gameHistory";

/*
 * Changing a game's rules moved to `liveGameSettings.ts`, which imports from
 * here. Deliberately NOT re-exported from this file: that would make the two
 * modules import each other, and a cycle to save one caller an import line is
 * a worse trade than the line. This file keeps creation and the moves
 * themselves, as `liveGameEndings.ts` has always said it does.
 */

/** Prisma's code for "a unique constraint was violated". */
const UNIQUE_VIOLATION = "P2002";

export const GAME_ROW = {
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
  // Read as well as written now: a rules change that says nothing about the
  // length has to be able to leave the length alone.
  drawLimit: true,
  lastMoveAt: true,
  blackForfeits: true,
  whiteForfeits: true,
  allowResign: true,
  clockMode: true,
  blackTimeMs: true,
  whiteTimeMs: true,
  deadlineAt: true,
  extraMs: true,
  rated: true,
  openSeat: true,
  openedAt: true,
  blackClaimedAt: true,
  whiteClaimedAt: true,
  blackToken: true,
  whiteToken: true,
  blackMemberId: true,
  whiteMemberId: true,
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
      createdAt: true,
    },
  },
} satisfies Prisma.GameSelect;

export type GameRow = Prisma.GameGetPayload<{ select: typeof GAME_ROW }>;

/**
 * A hot-seat game: two people at one screen, so one token holds both chairs.
 * The server still checks every move; it simply lets that token play whichever
 * colour is to move.
 */
export function isHotSeat(row: { blackToken: string; whiteToken: string }): boolean {
  return row.blackToken === row.whiteToken;
}

/**
 * Rebuilds the position by replaying the stored moves through the engine.
 *
 * The database keeps a move list, never a board. Replaying is what guarantees
 * a shared game obeys exactly the same rules as a local one — there is no
 * second implementation of "who has won" on the server.
 */
export function replay(row: GameRow): GameState {
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

/**
 * Starts an empty game and mints a key for each seat. A hot-seat game gets
 * one key for both, and keeps the seed the browser drew, so the board it has
 * already shown is the board the record replays.
 */
export async function createLiveGame(
  input: LiveGameSettings & {
    blackName: string;
    whiteName: string;
    winLength: number;
    opener: Stone;
    hotSeat?: boolean;
    seed?: number;
    /** The accounts holding each seat, for a challenge sent to a named member. */
    blackMemberId?: string;
    whiteMemberId?: string;
    /** A position to start from: the first `moves` moves of another game are copied in. */
    from?: { id: string; moves: number };
  },
): Promise<CreatedGame> {
  const { handicap, open, hotSeat = false, seed, from, clockMode = "move", rated, ...rest } = input;
  const token = randomBytes(18).toString("base64url");
  const startedAt = new Date();
  const budget = clockMode === "game" ? rest.moveTimeMs : null;

  /*
   * Refuse a game nobody could win, before it is written.
   *
   * The choke point, on purpose: every path that makes a game comes through
   * here, so one check covers the lobby, a challenge, a rematch, a fork, the
   * bot batch, and whatever is written next. A rematch once stored a
   * three-by-three board needing five in a row and nothing objected — John
   * played six moves before finding that his winning move did nothing.
   *
   * Against the size that will actually be STORED rather than the one asked
   * for. A game with a board of its own is created on that board whatever the
   * request said, and a check that read the request would refuse games this
   * very function was about to correct.
   */
  const board = sizeForVariant(rest.variant as RuleVariant, rest.size);
  const cannot = unwinnableBecause({ variant: rest.variant, size: board, winLength: rest.winLength });
  if (cannot !== null) throw new UnwinnableGame(cannot);

  const game = await prisma.game.create({
    data: {
      id: await freeGameId(),
      ...rest,
      // A game with a board of its own is created on it, whatever was asked for.
      size: sizeForVariant(rest.variant as RuleVariant, rest.size),
      clockMode,
      rated,
      blackTimeMs: budget,
      whiteTimeMs: budget,
      deadlineAt: rest.moveTimeMs === null ? null : new Date(startedAt.getTime() + rest.moveTimeMs),
      handicap: storedHandicap(handicap) ?? undefined,
      ...(hotSeat ? { blackToken: token, whiteToken: token } : {}),
      // An open game posts its white seat for anyone; the creator sits as black.
      openSeat: open && !hotSeat ? STONES.white : null,
      openedAt: open && !hotSeat ? new Date() : null,
      // The server draws the seed: the two players must see the same board.
      seed: hotSeat && seed !== undefined ? seed : seedFromRoll(Math.random(), SEED_RANGE),
      // The first deadline runs from the moment the game exists.
      lastMoveAt: startedAt,
      status: "active",
      result: "abandoned",
      moveCount: 0,
    },
    select: { id: true, blackToken: true, whiteToken: true },
  });
  if (from !== undefined && from.moves > 0) {
    const moves = await prisma.move.findMany({
      where: { gameId: from.id, number: { lte: from.moves } },
      orderBy: { number: "asc" },
    });
    await prisma.$transaction([
      prisma.move.createMany({
        data: moves.map(({ id: _id, gameId: _gameId, ...move }) => {
          void _id;
          void _gameId;
          return { ...move, gameId: game.id, cells: move.cells ?? undefined };
        }),
      }),
      /*
       * And says nothing about whose turn it is. A fork copies move ROWS
       * across without ever building a position out of them, so nothing here
       * holds a settled state — and the new game's rules need not be the old
       * one's, so the fact the source row stored is not this game's fact. Null
       * is the honest answer and sends the reader to a replay; a colour copied
       * from somewhere would be a turn nobody had worked out.
       *
       * Written out rather than left to the column default, so that a default
       * added to the schema one day cannot quietly become a forked game's
       * answer.
       */
      prisma.game.update({ where: { id: game.id }, data: { moveCount: moves.length, ...UNSETTLED } }),
    ]);
  }
  return game;
}



/** The seat a token holds, or null when the token belongs to neither. */
export function stoneForToken(row: GameRow, token: string): Stone | null {
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
    await recordPlayed({ ...row, winner: next.winner, moveCount: next.moves.length });
    // A game at one screen is filed, never rated: the site cannot tell who was playing. Nor is a friendly.
    if (!isHotSeat(row) && row.rated) await recordResult(row.blackName, row.whiteName, next.winner, row.variant, poolFor(hasBotSeat(row)));
    if (!isHotSeat(row)) await sendEmail({ kind: "game-over", gameId: id, winner: next.winner });
  } else if (next.toPlay !== stone && !isHotSeat(row)) {
    await sendEmail({ kind: "your-turn", gameId: id, stone: next.toPlay });
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



