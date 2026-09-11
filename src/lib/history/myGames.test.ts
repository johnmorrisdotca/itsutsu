import { beforeEach, describe, expect, it, vi } from "vitest";

import { GAME_STATUS, MOVE_KINDS, OPENING_RULES, STONES } from "@/lib/gomoku/gomoku.constants";

/**
 * What a list of games costs to draw, and what it gets right.
 *
 * The fault this is about was measured on production: the list read every move
 * of every game somebody held a seat in — 312 rows for eight games, out of 726
 * on the whole site — and replayed each one to answer two questions, whose turn
 * it is and whether the game is still running. The busiest development database
 * to hand made it 2,508 move rows for sixteen games.
 *
 * So the first thing here is a cost assertion, which is a thing a comment
 * cannot be: for rows that carry a settled turn, NO move row is read at all.
 * The rest is the half that matters more — that the cheap answer is the same
 * answer, including where a move count would get it wrong, and that a row with
 * nothing stored still gets the right answer the slow way.
 */

type Row = Record<string, unknown>;

let rows: Row[] = [];
let moves: Row[] = [];
const gameFindMany = vi.fn(async (_args: unknown) => rows);
const moveFindMany = vi.fn(async ({ where }: { where: { gameId: { in: string[] } } }) =>
  moves.filter((move) => where.gameId.in.includes(move.gameId as string)),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: { findMany: (args: never) => gameFindMany(args) },
    move: { findMany: (args: never) => moveFindMany(args) },
  },
}));

const { fetchMyGames } = await import("./myGames");

const MEMBER = "member-1";

/** A game row as `SUMMARY_SELECT` plus the seat columns would bring it back. */
function game(over: Partial<Row> = {}): Row {
  return {
    id: "g1",
    playedAt: new Date("2026-09-01T00:00:00Z"),
    status: "active",
    blackName: "Black",
    whiteName: "White",
    size: 15,
    winLength: 5,
    variant: "freestyle",
    obstacles: "none",
    opener: STONES.black,
    opening: OPENING_RULES.free,
    handicap: null,
    seed: 0,
    moveTimeMs: null,
    timeoutPenalty: "turn",
    lastMoveAt: new Date("2026-09-02T00:00:00Z"),
    blackForfeits: 0,
    whiteForfeits: 0,
    allowResign: true,
    drawLimit: "none",
    clockMode: "move",
    blackTimeMs: null,
    whiteTimeMs: null,
    deadlineAt: null,
    extraMs: 0,
    rated: true,
    openSeat: null,
    result: "abandoned",
    winner: null,
    moveCount: 1,
    durationMs: null,
    blackToken: "tok-black",
    whiteToken: "tok-white",
    blackMemberId: MEMBER,
    whiteMemberId: "member-2",
    settledStatus: null,
    settledToPlay: null,
    ...over,
  };
}

/** Stones on a game, in order, alternating from black. */
function stones(gameId: string, count: number): Row[] {
  return Array.from({ length: count }, (_unused, index) => ({
    gameId,
    number: index + 1,
    row: index,
    col: 0,
    stone: index % 2 === 0 ? STONES.black : STONES.white,
    kind: MOVE_KINDS.place,
    fromRow: null,
    fromCol: null,
    twistQuadrant: null,
    twistClockwise: null,
    cells: null,
    createdAt: new Date("2026-09-02T00:00:00Z"),
  }));
}

/** The one game in the list, wherever it was sorted to. */
async function only() {
  const groups = await fetchMyGames(new Map(), MEMBER);
  const all = Object.values(groups).flat();
  expect(all).toHaveLength(1);
  return all[0];
}

beforeEach(() => {
  rows = [];
  moves = [];
  gameFindMany.mockClear();
  moveFindMany.mockClear();
});

describe("what it costs to draw", () => {
  it("reads no move row at all when every game carries a settled turn", async () => {
    rows = Array.from({ length: 20 }, (_unused, index) =>
      game({
        id: `g${index}`,
        moveCount: 40,
        settledStatus: GAME_STATUS.playing,
        settledToPlay: index % 2 === 0 ? STONES.black : STONES.white,
      }),
    );
    moves = rows.flatMap((row) => stones(row.id as string, 40));

    const groups = await fetchMyGames(new Map(), MEMBER);
    expect(groups.yourMove).toHaveLength(10);
    expect(groups.theirMove).toHaveLength(10);
    // 800 move rows are there to be read, and none of them is.
    expect(moveFindMany).not.toHaveBeenCalled();
    expect(gameFindMany).toHaveBeenCalledTimes(1);
  });

  it("never asks for the moves of a game that is already filed", async () => {
    /*
     * A finished row needs no position: `running` has always been `status ===
     * "active" && …`, so the stones could not change the answer. This is where
     * the saving mostly comes from — a long-standing list is mostly history —
     * and it needs no stored column to get it.
     */
    rows = [game({ status: "finished", result: "black", winner: STONES.black, moveCount: 60 })];
    moves = stones("g1", 60);
    const mine = await only();
    expect(mine.group).toBe("finished");
    expect(mine.toPlay).toBeNull();
    expect(moveFindMany).not.toHaveBeenCalled();
  });

  it("asks for the moves of only the games that cannot answer for themselves", async () => {
    rows = [
      game({ id: "settled", settledStatus: GAME_STATUS.playing, settledToPlay: STONES.black, moveCount: 40 }),
      game({ id: "filed", status: "finished", result: "draw", moveCount: 40 }),
      game({ id: "silent", moveCount: 2 }),
    ];
    moves = [...stones("settled", 40), ...stones("filed", 40), ...stones("silent", 2)];

    await fetchMyGames(new Map(), MEMBER);
    expect(moveFindMany).toHaveBeenCalledTimes(1);
    expect(moveFindMany.mock.calls[0][0]).toMatchObject({ where: { gameId: { in: ["silent"] } } });
  });
});

describe("the answer a settled turn gives", () => {
  it("puts a game in your queue when the stored colour is your seat", async () => {
    rows = [game({ settledStatus: GAME_STATUS.playing, settledToPlay: STONES.black })];
    const mine = await only();
    expect(mine.group).toBe("yourMove");
    expect(mine.toPlay).toBe(STONES.black);
  });

  it("puts it in theirs when it is not", async () => {
    rows = [game({ settledStatus: GAME_STATUS.playing, settledToPlay: STONES.white })];
    expect((await only()).group).toBe("theirMove");
  });

  it("files a game the engine ended even though the row still says active", async () => {
    /*
     * The disagreement the pair exists to carry. A Reversi board that filled up
     * is over with nobody having written the row down — see `settleEnded` — and
     * the old reader found that out by replaying. Now the row says so.
     */
    rows = [game({ settledStatus: GAME_STATUS.won, settledToPlay: null, moveCount: 60 })];
    const mine = await only();
    expect(mine.group).toBe("finished");
    expect(mine.toPlay).toBeNull();
    expect(mine.stale).toBe(false);
    expect(moveFindMany).not.toHaveBeenCalled();
  });

  it("believes the stored colour where a move count would say the other one", async () => {
    /*
     * Two stones on the board, so anything alternating from the opener would
     * make it black's move. The stored answer says white — which is what a
     * Connect6 turn, an owed quarter turn or a swap opening all look like from
     * outside — and the list follows the stored answer.
     */
    rows = [
      game({
        moveCount: 2,
        settledStatus: GAME_STATUS.playing,
        settledToPlay: STONES.white,
      }),
    ];
    moves = stones("g1", 2);
    const mine = await only();
    expect(mine.toPlay).toBe(STONES.white);
    expect(mine.group).toBe("theirMove");
    expect(moveFindMany).not.toHaveBeenCalled();
  });
});

describe("a row with nothing stored", () => {
  it("falls back to the replay and gets the same answer", async () => {
    // Two stones down, nothing stored: black to move, which is your seat.
    rows = [game({ moveCount: 2 })];
    moves = stones("g1", 2);
    const mine = await only();
    expect(mine.group).toBe("yourMove");
    expect(mine.toPlay).toBe(STONES.black);
    expect(moveFindMany).toHaveBeenCalledTimes(1);
  });

  it("replays a game whose stored status is not one this engine knows", async () => {
    rows = [game({ moveCount: 2, settledStatus: "asleep", settledToPlay: STONES.white })];
    moves = stones("g1", 2);
    const mine = await only();
    // The replay's answer, not the row's.
    expect(mine.toPlay).toBe(STONES.black);
    expect(moveFindMany).toHaveBeenCalledTimes(1);
  });

  it("replays a game stored as running with nobody to move", async () => {
    rows = [game({ moveCount: 2, settledStatus: GAME_STATUS.playing, settledToPlay: null })];
    moves = stones("g1", 2);
    expect((await only()).toPlay).toBe(STONES.black);
    expect(moveFindMany).toHaveBeenCalledTimes(1);
  });

  it("finds the game over when the stones say so, with nothing stored", async () => {
    /*
     * Five black stones in a column with white answering in another: black has
     * won, the row still says active, and only a replay can find it. The group
     * has to be `finished` — which is what it was before these columns, and has
     * to go on being true for every row already in the database.
     */
    rows = [game({ moveCount: 9 })];
    moves = [
      { gameId: "g1", number: 1, row: 0, col: 0, stone: STONES.black },
      { gameId: "g1", number: 2, row: 0, col: 9, stone: STONES.white },
      { gameId: "g1", number: 3, row: 1, col: 0, stone: STONES.black },
      { gameId: "g1", number: 4, row: 1, col: 9, stone: STONES.white },
      { gameId: "g1", number: 5, row: 2, col: 0, stone: STONES.black },
      { gameId: "g1", number: 6, row: 2, col: 9, stone: STONES.white },
      { gameId: "g1", number: 7, row: 3, col: 0, stone: STONES.black },
      { gameId: "g1", number: 8, row: 3, col: 9, stone: STONES.white },
      { gameId: "g1", number: 9, row: 4, col: 0, stone: STONES.black },
    ].map((move) => ({
      ...move,
      kind: MOVE_KINDS.place,
      fromRow: null,
      fromCol: null,
      twistQuadrant: null,
      twistClockwise: null,
      cells: null,
      createdAt: new Date("2026-09-02T00:00:00Z"),
    }));
    const mine = await only();
    expect(mine.group).toBe("finished");
    expect(mine.toPlay).toBeNull();
  });

  it("keeps the moves of one game out of another's replay", async () => {
    /*
     * One query brings back the moves of every game that needs replaying, so
     * splitting them by game is this file's job and getting it wrong would
     * quietly play somebody else's stones onto your board.
     */
    rows = [game({ id: "a", moveCount: 2 }), game({ id: "b", moveCount: 1 })];
    moves = [...stones("a", 2), ...stones("b", 1)];
    const groups = await fetchMyGames(new Map(), MEMBER);
    const byId = new Map(Object.values(groups).flat().map((one) => [one.game.id, one]));
    // Two stones down: black to move. One stone down: white to move.
    expect(byId.get("a")?.toPlay).toBe(STONES.black);
    expect(byId.get("b")?.toPlay).toBe(STONES.white);
  });
});

describe("what the list still does regardless", () => {
  it("leaves out a game no seat of yours is in", async () => {
    rows = [game({ blackMemberId: "somebody", whiteMemberId: "else" })];
    const groups = await fetchMyGames(new Map(), MEMBER);
    expect(Object.values(groups).flat()).toHaveLength(0);
  });

  it("calls a game at one screen a hot seat, whoever is to move", async () => {
    rows = [
      game({
        blackToken: "one",
        whiteToken: "one",
        settledStatus: GAME_STATUS.playing,
        settledToPlay: STONES.white,
      }),
    ];
    expect((await only()).group).toBe("hotSeat");
  });

  it("calls a game with no stones unstarted, whatever is stored", async () => {
    rows = [
      game({ moveCount: 0, settledStatus: GAME_STATUS.playing, settledToPlay: STONES.black }),
    ];
    expect((await only()).group).toBe("unstarted");
  });

  it("flags a running game nobody has touched for a fortnight", async () => {
    rows = [
      game({
        lastMoveAt: new Date("2026-08-01T00:00:00Z"),
        settledStatus: GAME_STATUS.playing,
        settledToPlay: STONES.black,
      }),
    ];
    const groups = await fetchMyGames(new Map(), MEMBER, new Date("2026-09-11T00:00:00Z"));
    expect(groups.yourMove[0].stale).toBe(true);
  });
});
