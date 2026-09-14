import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createGame } from "@/lib/gomoku/engine";
import { replayMoves } from "@/lib/gomoku/rules/record";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import { toGameMove } from "./gameHistory";
import { parseHandicap } from "./gameSettingsSchema";
import { OFFER_SELECT } from "./offers";

/*
 * What a live game IS, as the database holds it: the one row shape every
 * live-game function reads, the position replayed out of that row, and which
 * seat a token holds.
 *
 * Lifted out of `liveGame.ts`, which had reached the File Size Gate's limit
 * doing three jobs — this, making a game (`liveGameCreate.ts`), and playing a
 * move on one, which stayed. `liveGame.ts` re-exports both halves, so nothing
 * that imports from it had to change, and neither half imports it back.
 */

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
  /*
   * An offer is a game nothing may be done to until it is answered. Read on
   * the one select every live-game function shares, so the guard below and the
   * four in `liveGameEndings.ts` all ask the same columns — a select that
   * forgot them would answer "not an offer" for every row, which is the
   * plausible-looking wrong answer.
   */
  ...OFFER_SELECT,
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
 * THE FACTS ABOUT A ROW THAT THE LADDER'S RULE NEEDS AND THE ROW DOES NOT HOLD
 * AS SUCH: whether one device holds both seats, and the handicap parsed out of
 * its JSON column.
 *
 * Spread beside the row into `recordPlayed` and `countsOnLadder` by every
 * ending, so the four hand over the same facts worked out the same way — one of
 * them reading the column raw is how a handicap game would go on being rated.
 */
export function ladderFacts(row: { blackToken: string; whiteToken: string; handicap: unknown }) {
  return { hotSeat: isHotSeat(row), handicap: parseHandicap(row.handicap) };
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

  // A clock is what lets a turn lost to it replay; see `replayMoves`.
  const timeline = replayMoves(start, row.moves.map(toGameMove), [], { clocked: row.moveTimeMs !== null });
  return timeline[timeline.length - 1];
}

/** The seat a token holds, or null when the token belongs to neither. */
export function stoneForToken(row: GameRow, token: string): Stone | null {
  if (token === row.blackToken) return STONES.black;
  if (token === row.whiteToken) return STONES.white;
  return null;
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
