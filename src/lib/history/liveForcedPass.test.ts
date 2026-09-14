import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGame, piecePlacements, playMove } from "@/lib/gomoku/engine";
import { BLOCKED, MOVE_KINDS, RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Cell, GameState, Move, Point, RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { passesOwed } from "@/lib/gomoku/rules/forcedPass";
import { settledTurn } from "./settledTurn";

/**
 * A LIVE MOVE THAT LEAVES THE OTHER SIDE STUCK WRITES THEIR PASS WITH IT.
 *
 * Against the same kind of store as `liveForfeit.test.ts`: it keeps what is
 * written and refuses a second row with the same number, as the unique index
 * does. The position is planted through `replay` — a sealed board a real game
 * would take eighty moves to reach — and everything after that is
 * `appendMove`'s own: the rows, the turn, the clock, the notices and the
 * end-of-game writes.
 */

type StoredMove = { number: number; row: number; col: number; stone: string; kind: string; cells: unknown };
type Row = Record<string, unknown> & { id: string; moves: StoredMove[] };
type Write = { apply: () => void };

const seen = vi.hoisted(() => ({
  noticeYourTurn: vi.fn(async () => {}),
  noticeGameOver: vi.fn(async () => {}),
  recordPlayed: vi.fn(async () => {}),
  planted: null as GameState | null,
}));

let row: Row | null = null;
let gameWrites: Record<string, unknown>[] = [];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      findUnique: async () => (row === null ? null : { ...row, moves: row.moves.map((move) => ({ ...move })) }),
      update: ({ data }: { data: Record<string, unknown> }): Write => ({
        apply: () => {
          gameWrites.push(data);
          Object.assign(row as Row, data);
        },
      }),
    },
    move: {
      create: ({ data }: { data: Record<string, unknown> }): Write => ({
        apply: () => {
          const current = row as Row;
          if (current.moves.some((move) => move.number === data.number)) {
            throw new Prisma.PrismaClientKnownRequestError("Unique constraint failed on (gameId, number)", {
              code: "P2002",
              clientVersion: "test",
            });
          }
          current.moves.push({
            number: data.number as number,
            row: data.row as number,
            col: data.col as number,
            stone: data.stone as string,
            kind: data.kind as string,
            cells: data.cells ?? null,
          });
        },
      }),
    },
    $transaction: async (writes: Write[]) => {
      for (const write of writes) write.apply();
    },
  },
}));

vi.mock("./liveGameRow", async (original) => ({
  ...(await original<typeof import("./liveGameRow")>()),
  replay: () => seen.planted,
}));
vi.mock("./gameHistory", async (original) => ({
  ...(await original<typeof import("./gameHistory")>()),
  fetchGameDetail: async () => ({ id: "g1" }),
}));
vi.mock("@/lib/rating/recordResult", () => ({ recordResult: async () => {} }));
vi.mock("@/lib/rating/playedRun", () => ({ recordPlayed: seen.recordPlayed }));
vi.mock("@/lib/rating/pools", () => ({ poolFor: () => "people" }));
vi.mock("@/lib/bots/bots", () => ({ hasBotSeat: () => false, seatMemberId: () => null, isBotId: () => false }));
vi.mock("@/lib/notify/gameNotices", () => ({ noticeYourTurn: seen.noticeYourTurn, noticeGameOver: seen.noticeGameOver }));
vi.mock("@/lib/xp/xpSocial", () => ({ awardAnsweredChallenge: async () => {}, awardCourtesy: async () => {} }));

const { appendMove } = await import("./liveGame");

const p = (point: number, col: number): Point => ({ row: point, col });

/** A board sealed everywhere but `open`, so nothing but the pass is under test. */
function sealed(variant: RuleVariant, size: number, open: Point[], moves: Move[] = [], toPlay: Stone = STONES.black): GameState {
  const game = createGame({ variant, size, allowUndo: false });
  const board: Cell[] = new Array(size * size).fill(BLOCKED);
  for (const point of open) board[point.row * size + point.col] = null;
  return { ...game, board, moves, toPlay };
}

function liveRow(variant: string, size: number): Row {
  return {
    id: "g1",
    status: "active",
    size,
    winLength: 5,
    variant,
    obstacles: "none",
    opener: STONES.black,
    opening: "free",
    handicap: null,
    seed: 1,
    blackName: "Kuro",
    whiteName: "Shiro",
    moveTimeMs: 60_000,
    timeoutPenalty: "turn",
    drawLimit: "none",
    lastMoveAt: new Date(),
    blackForfeits: 0,
    whiteForfeits: 0,
    allowResign: true,
    clockMode: "move",
    blackTimeMs: null,
    whiteTimeMs: null,
    deadlineAt: new Date(Date.now() + 60_000),
    extraMs: 0,
    rated: true,
    openSeat: null,
    openedAt: null,
    blackClaimedAt: new Date(),
    whiteClaimedAt: new Date(),
    blackToken: "black-token",
    whiteToken: "white-token",
    blackMemberId: "member-black",
    whiteMemberId: "member-white",
    offeredToMemberId: null,
    offeredAt: null,
    declinedAt: null,
    withdrawnAt: null,
    moves: [],
  };
}

beforeEach(() => {
  row = null;
  gameWrites = [];
  seen.planted = null;
  seen.noticeYourTurn.mockClear();
  seen.noticeGameOver.mockClear();
  seen.recordPlayed.mockClear();
});

describe("a live move that leaves the other side with nothing to play", () => {
  it("writes the stuck side's pass in the same write, hands the turn back, and sends nobody a 'your move'", async () => {
    const whiteSingles: Move[] = Array.from({ length: 6 }, (_, at) => ({ ...p(12, at), stone: STONES.white, kind: MOVE_KINDS.place }));
    seen.planted = sealed(RULE_VARIANTS.blockFive, 13, [p(1, 1), p(3, 3), p(5, 5)], whiteSingles);
    row = liveRow(RULE_VARIANTS.blockFive, 13);

    expect(await appendMove("g1", "black-token", { kind: "place", row: 1, col: 1 })).toEqual({ ok: true, game: { id: "g1" } });

    expect(row.moves.map((move) => [move.number, move.stone, move.kind])).toEqual([
      [7, STONES.black, MOVE_KINDS.place],
      [8, STONES.white, MOVE_KINDS.pass],
    ]);
    const expected = passesOwed(playMove(seen.planted, p(1, 1)));
    const written = gameWrites[gameWrites.length - 1];
    expect(written).toMatchObject({ status: "active", moveCount: 8, ...settledTurn(expected) });
    // Black's clock runs again, since the move is Black's again.
    expect(written.deadlineAt).toBeInstanceOf(Date);
    expect(seen.noticeYourTurn).not.toHaveBeenCalled();
    expect(seen.noticeGameOver).not.toHaveBeenCalled();
  });

  it("ends the game when the mover is stuck too, and files it as any finished game is filed", async () => {
    seen.planted = sealed(RULE_VARIANTS.dominoFive, 13, [p(0, 0), p(0, 1), p(5, 5), p(7, 7)]);
    row = liveRow(RULE_VARIANTS.dominoFive, 13);
    const [lay] = piecePlacements(seen.planted);

    expect(await appendMove("g1", "black-token", { kind: "piece", cells: lay })).toEqual({ ok: true, game: { id: "g1" } });

    expect(row.moves.map((move) => [move.number, move.stone, move.kind])).toEqual([
      [1, STONES.black, MOVE_KINDS.piece],
      [2, STONES.white, MOVE_KINDS.pass],
      [3, STONES.black, MOVE_KINDS.pass],
    ]);
    expect(gameWrites[gameWrites.length - 1]).toMatchObject({ status: "finished", result: "draw", moveCount: 3, deadlineAt: null });
    expect(seen.recordPlayed).toHaveBeenCalledTimes(1);
    expect(seen.recordPlayed).toHaveBeenCalledWith(expect.objectContaining({ moveCount: 3, winner: null }));
    expect(seen.noticeGameOver).toHaveBeenCalledTimes(1);
    expect(seen.noticeYourTurn).not.toHaveBeenCalled();
  });

  it("passes nobody after an ordinary move", async () => {
    seen.planted = sealed(RULE_VARIANTS.dominoFive, 13, [p(0, 0), p(0, 1), p(2, 0), p(2, 1), p(5, 5)]);
    row = liveRow(RULE_VARIANTS.dominoFive, 13);
    const [lay] = piecePlacements(seen.planted);

    expect((await appendMove("g1", "black-token", { kind: "piece", cells: lay })).ok).toBe(true);
    expect(row.moves.map((move) => move.kind)).toEqual([MOVE_KINDS.piece]);
    expect(seen.noticeYourTurn).toHaveBeenCalledTimes(1);
  });
});
