import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createGame, isLegalMove, playMove } from "@/lib/gomoku/engine";
import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Point, Stone } from "@/lib/gomoku/gomoku.types";
import { fetchGameDetail } from "./gameHistory";
import type { CreatedGame, MoveOutcome } from "./liveGame.types";

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
  blackToken: true,
  whiteToken: true,
  moves: { orderBy: { number: "asc" }, select: { row: true, col: true } },
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
    firstPlayer: row.opener as Stone,
    // A shared game is played from two devices, so neither side may rewind it.
    allowUndo: false,
    allowSwap: false,
  });

  return row.moves.reduce(
    (state, move) => playMove(state, { row: move.row, col: move.col }),
    start,
  );
}

/** Starts an empty game and mints a key for each seat. */
export async function createLiveGame(input: {
  blackName: string;
  whiteName: string;
  size: number;
  winLength: number;
  variant: string;
  obstacles: string;
  opener: Stone;
}): Promise<CreatedGame> {
  const game = await prisma.game.create({
    data: { ...input, status: "active", result: "abandoned", moveCount: 0 },
    select: { id: true, blackToken: true, whiteToken: true },
  });
  return game;
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
  point: Point,
): Promise<MoveOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null) return { ok: false, reason: "not-found" };
  if (row.status !== "active") return { ok: false, reason: "finished" };

  const stone = stoneForToken(row, token);
  if (stone === null) return { ok: false, reason: "wrong-token" };

  const state = replay(row);
  if (state.toPlay !== stone) return { ok: false, reason: "not-your-turn" };
  if (!isLegalMove(state, point)) return { ok: false, reason: "illegal" };

  const next = playMove(state, point);
  const finished = next.status !== GAME_STATUS.playing;

  try {
    await prisma.$transaction([
      /*
       * The unique index on (gameId, number) is the concurrency control. Two
       * devices racing to play the same move number cannot both succeed, so
       * the loser is told to reload rather than silently overwriting.
       */
      prisma.move.create({
        data: {
          gameId: id,
          number: next.moves.length,
          row: point.row,
          col: point.col,
          stone,
          kind: "place",
        },
      }),
      prisma.game.update({
        where: { id },
        data: {
          moveCount: next.moves.length,
          status: finished ? "finished" : "active",
          result: next.winner ?? (finished ? "draw" : "abandoned"),
          winner: next.winner,
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
