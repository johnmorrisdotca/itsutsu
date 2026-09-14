import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { emptyPoints, isLegalMove } from "@/lib/gomoku/engine";
import { MOVE_KINDS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Point } from "@/lib/gomoku/gomoku.types";
import type { MoveRequest } from "./liveGame.types";
import { settledTurn } from "./settledTurn";

const place = (point: Point): MoveRequest => ({ kind: "place", row: point.row, col: point.col });

/**
 * AFTER A TIMEOUT, THE GAME GOES ON.
 *
 * The claim wrote a missed turn as a pass, and in every game with no pass to
 * offer the replay refused that row and stopped. From then on the server and
 * the record disagreed about whose turn it was: the side that claimed was told
 * it was not their move, and the side that timed out was sent to a move
 * number the claim had already written — refused as a conflict, for ever. A
 * game with one timeout in it could not be finished.
 *
 * So these go through `claimTimeout` and `appendMove` against a store that
 * keeps what they write and enforces what the database does: one row per move
 * number. A mocked `create` that accepted everything is how the collision
 * stayed invisible.
 */

type StoredMove = {
  number: number;
  row: number;
  col: number;
  stone: string;
  kind: string;
  fromRow: number | null;
  fromCol: number | null;
  twistQuadrant: null;
  twistClockwise: null;
  cells: unknown;
  createdAt: Date;
};

type Row = Record<string, unknown> & { id: string; moves: StoredMove[] };
type Write = { apply: () => void };

let row: Row | null = null;
let gameWrites: Record<string, unknown>[] = [];

function stored(data: Record<string, unknown>): StoredMove {
  return {
    number: data.number as number,
    row: data.row as number,
    col: data.col as number,
    stone: data.stone as string,
    kind: data.kind as string,
    fromRow: (data.fromRow as number | undefined) ?? null,
    fromCol: (data.fromCol as number | undefined) ?? null,
    twistQuadrant: null,
    twistClockwise: null,
    cells: data.cells ?? null,
    createdAt: new Date(),
  };
}

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
          // The unique index on (gameId, number), which is the whole of the collision.
          if (current.moves.some((move) => move.number === data.number)) {
            throw new Prisma.PrismaClientKnownRequestError("Unique constraint failed on (gameId, number)", {
              code: "P2002",
              clientVersion: "test",
            });
          }
          current.moves.push(stored(data));
        },
      }),
    },
    // In order, and nothing after a write that throws: a transaction's shape, as far as these cases need it.
    $transaction: async (writes: Write[]) => {
      for (const write of writes) write.apply();
    },
  },
}));

vi.mock("./gameHistory", async (original) => ({
  ...(await original<typeof import("./gameHistory")>()),
  fetchGameDetail: async () => ({ id: "g1" }),
}));
vi.mock("./gameId", () => ({ freeGameId: async () => "g1" }));
vi.mock("@/lib/rating/recordResult", () => ({ recordResult: async () => {} }));
vi.mock("@/lib/rating/playedRun", () => ({ recordPlayed: async () => {} }));
vi.mock("@/lib/rating/pools", () => ({ poolFor: () => "people" }));
vi.mock("@/lib/bots/bots", () => ({ hasBotSeat: () => false, seatMemberId: () => null, isBotId: () => false }));
vi.mock("@/lib/social/vacation", () => ({ fetchTimeOff: async () => [], timeOffGraceMs: () => 0 }));
vi.mock("@/lib/notify/email", () => ({ sendEmail: async () => {} }));
vi.mock("@/lib/xp/xpSocial", () => ({ awardAnsweredChallenge: async () => {}, awardCourtesy: async () => {} }));

const { appendMove, replay } = await import("./liveGame");
const { claimTimeout } = await import("./liveGameEndings");

const hourAgo = () => new Date(Date.now() - 3_600_000);

/** A game between two people with a clock of a minute a move, and the graceful penalty. */
function liveRow(variant: string, size: number, over: Partial<Row> = {}): Row {
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
    ...over,
  };
}

const replayed = (): GameState => replay(row as unknown as Parameters<typeof replay>[0]);

function firstLegal(state: GameState): Point {
  const point = emptyPoints(state).find((candidate) => isLegalMove(state, candidate));
  if (point === undefined) throw new Error("No legal point to play.");
  return point;
}

beforeEach(() => {
  row = null;
  gameWrites = [];
});

describe.each([
  { variant: "freestyle", size: 15 },
  { variant: "renju", size: 15 },
  { variant: "reversi", size: 8 },
])("a claimed timeout in $variant", ({ variant, size }) => {
  it("records a forfeit, the record replays to the position the claim settled, and the game goes on", async () => {
    row = liveRow(variant, size);
    const opening = firstLegal(replayed());
    expect(await appendMove("g1", "black-token", place(opening))).toEqual({ ok: true, game: { id: "g1" } });

    // White's minute went by an hour ago. The clock is planted, not waited out.
    Object.assign(row, { lastMoveAt: hourAgo(), deadlineAt: hourAgo() });
    expect((await claimTimeout("g1", "black-token")).ok).toBe(true);

    expect(row.moves.map((move) => [move.number, move.stone, move.kind])).toEqual([
      [1, STONES.black, MOVE_KINDS.place],
      [2, STONES.white, MOVE_KINDS.forfeit],
    ]);
    const after = replayed();
    expect(after.moves).toHaveLength(2);
    expect(after.toPlay).toBe(STONES.black);
    // What the claim wrote on the game row is what every page's replay reads.
    expect(gameWrites[gameWrites.length - 1]).toMatchObject({ moveCount: 2, whiteForfeits: 1, ...settledTurn(after) });

    // The turn that was lost is not white's to take back, and says so rather than colliding.
    const elsewhere = firstLegal(after);
    expect(await appendMove("g1", "white-token", place(elsewhere))).toEqual({ ok: false, reason: "not-your-turn" });

    // And black's next move is accepted: move three, no conflict.
    expect(await appendMove("g1", "black-token", place(elsewhere))).toEqual({ ok: true, game: { id: "g1" } });
    expect(row.moves.map((move) => move.number)).toEqual([1, 2, 3]);
    expect(replayed().moves).toHaveLength(3);
  });
});

describe("a forfeit on the record of a game with no clock", () => {
  it("is refused by the replay, so no turn is skipped that nobody lost", async () => {
    row = liveRow("freestyle", 15, { moveTimeMs: null, deadlineAt: null });
    row.moves.push(
      stored({ number: 1, row: 7, col: 7, stone: STONES.black, kind: MOVE_KINDS.place }),
      stored({ number: 2, row: -1, col: -1, stone: STONES.white, kind: MOVE_KINDS.forfeit }),
    );

    const state = replayed();
    expect(state.moves).toHaveLength(1);
    expect(state.toPlay).toBe(STONES.white);
    // The refusal is visible, not a quiet skip: black is not handed a turn it was never given.
    expect(await appendMove("g1", "black-token", { kind: "place", row: 7, col: 8 })).toEqual({ ok: false, reason: "not-your-turn" });
  });
});

/**
 * A TIMEOUT CLAIMED WHILE SWAP2 WAITS ON ITS COLOUR CHOICE ALWAYS RESOLVES.
 *
 * A live game cannot be created under swap2 — a seat token is a colour — but
 * the claim is written against the rule rather than against how the row got
 * here. Under the lose-the-turn penalty the choice is made as the replay makes
 * it and the turn is forfeited; under either lose-the-game penalty the game is
 * lost on time. Before, the claim wrote nothing and answered "finished".
 */
describe.each([
  { penalty: "turn", finished: false },
  { penalty: "game", finished: true },
  { penalty: "game-strict", finished: true },
])("a timeout claimed during swap2's colour choice, under the $penalty penalty", ({ penalty, finished }) => {
  it(finished ? "loses the game on time" : "forfeits the chooser's turn, and the record replays it", async () => {
    row = liveRow("freestyle", 15, { opening: "swap2", timeoutPenalty: penalty, lastMoveAt: hourAgo(), deadlineAt: hourAgo() });
    row.moves.push(
      stored({ number: 1, row: 7, col: 7, stone: STONES.black, kind: MOVE_KINDS.place }),
      stored({ number: 2, row: 7, col: 8, stone: STONES.white, kind: MOVE_KINDS.place }),
      stored({ number: 3, row: 8, col: 8, stone: STONES.black, kind: MOVE_KINDS.place }),
    );
    const waiting = replayed();
    expect(waiting.opening.stage).toBe("choosing");
    expect(waiting.toPlay).toBe(STONES.white);

    expect((await claimTimeout("g1", "black-token")).ok).toBe(true);

    const written = gameWrites[gameWrites.length - 1];
    if (finished) {
      expect(row.moves).toHaveLength(3);
      expect(written).toMatchObject({ status: "finished", winner: STONES.black, deadlineAt: null });
      return;
    }
    expect(row.moves.map((move) => [move.number, move.stone, move.kind])).toEqual([
      [1, STONES.black, MOVE_KINDS.place],
      [2, STONES.white, MOVE_KINDS.place],
      [3, STONES.black, MOVE_KINDS.place],
      [4, STONES.white, MOVE_KINDS.forfeit],
    ]);
    const after = replayed();
    expect(after.moves).toHaveLength(4);
    expect(after.opening.stage).toBe("done");
    expect(after.toPlay).toBe(STONES.black);
    expect(written).toMatchObject({ status: "active", moveCount: 4, whiteForfeits: 1, ...settledTurn(after) });
    // And the game goes on: black's next stone is move five.
    expect(await appendMove("g1", "black-token", place(firstLegal(after)))).toEqual({ ok: true, game: { id: "g1" } });
  });
});
