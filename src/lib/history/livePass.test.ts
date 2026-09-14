import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGame, passTurn, playMove } from "@/lib/gomoku/engine";
import { GAME_STATUS, MOVE_KINDS, STONES } from "@/lib/gomoku/gomoku.constants";

/**
 * A PASS ON A SHARED GAME IS WHATEVER THE ENGINE SAYS A PASS IS.
 *
 * `appendMove` used to accept a pass only when `mustPass` said the colour to
 * move had nothing it could play. That is the whole of passing in the piece
 * games, and none of it in Go: there a pass is a choice, always on offer, and
 * two of them in a row are how the game ends. `mustPass` is false for Go by
 * design, so every chosen pass on a live Go board was answered "illegal" — by
 * a person pressing Pass, and by a computer player choosing one, which left a
 * programs' game stuck at move 84 with the engine and the server disagreeing
 * about the same position.
 *
 * The rule the server now keeps is the engine's `canPass`, which reads the
 * variant's spec. These cases are about the server keeping it, so they go
 * through `appendMove` against a mocked client and assert on what it WROTE:
 * the pass row, and the game row the pass settled.
 */

type StoredMove = {
  number: number;
  row: number;
  col: number;
  stone: string;
  kind: string;
  fromRow: null;
  fromCol: null;
  twistQuadrant: null;
  twistClockwise: null;
  cells: null;
  createdAt: Date;
};

type Row = Record<string, unknown> & { id: string; moves: StoredMove[] };

let row: Row | null = null;
let moveWrites: Record<string, unknown>[] = [];
let gameWrites: Record<string, unknown>[] = [];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      findUnique: async () => row,
      update: ({ data }: { data: Record<string, unknown> }) => {
        gameWrites.push(data);
        return Promise.resolve(data);
      },
    },
    move: {
      create: ({ data }: { data: Record<string, unknown> }) => {
        moveWrites.push(data);
        return Promise.resolve(data);
      },
    },
    $transaction: async (writes: Promise<unknown>[]) => Promise.all(writes),
  },
}));

const recordResult = vi.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const recordPlayed = vi.fn<(...args: unknown[]) => Promise<void>>(async () => {});

vi.mock("./gameHistory", async (original) => ({
  ...(await original<typeof import("./gameHistory")>()),
  fetchGameDetail: async () => ({ id: "g1" }),
}));
vi.mock("./gameId", () => ({ freeGameId: async () => "g1" }));
vi.mock("@/lib/rating/recordResult", () => ({ recordResult: (...args: unknown[]) => recordResult(...args) }));
vi.mock("@/lib/rating/playedRun", () => ({ recordPlayed: (...args: unknown[]) => recordPlayed(...args) }));
vi.mock("@/lib/rating/pools", () => ({ poolFor: () => "people" }));
// People in both seats: no computer to excuse from the clock, none to rate in its own pool.
vi.mock("@/lib/bots/bots", () => ({ hasBotSeat: () => false, seatMemberId: () => null, isBotId: () => false }));
vi.mock("@/lib/social/vacation", () => ({ fetchTimeOff: async () => [], timeOffGraceMs: () => 0 }));
vi.mock("@/lib/notify/email", () => ({ sendEmail: async () => {} }));
vi.mock("@/lib/xp/xpSocial", () => ({ awardAnsweredChallenge: async () => {}, awardCourtesy: async () => {} }));

const { appendMove, replay } = await import("./liveGame");
const { claimTimeout } = await import("./liveGameEndings");

const stone = (number: number, r: number, c: number, colour: string): StoredMove => ({
  number,
  row: r,
  col: c,
  stone: colour,
  kind: MOVE_KINDS.place,
  fromRow: null,
  fromCol: null,
  twistQuadrant: null,
  twistClockwise: null,
  cells: null,
  createdAt: new Date(),
});

const pass = (number: number, colour: string): StoredMove => ({
  ...stone(number, -1, -1, colour),
  kind: MOVE_KINDS.pass,
});

/** A game between two people, one seat each, nothing offered and no clock. */
function liveRow(variant: string, size: number, moves: StoredMove[], over: Partial<Row> = {}): Row {
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
    moveTimeMs: null,
    timeoutPenalty: "turn",
    drawLimit: "none",
    lastMoveAt: new Date(),
    blackForfeits: 0,
    whiteForfeits: 0,
    allowResign: true,
    clockMode: "move",
    blackTimeMs: null,
    whiteTimeMs: null,
    deadlineAt: null,
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
    moves,
    ...over,
  };
}

/** Two stones each on a 9×9 Go board: an ordinary position, black to move. */
const GO_OPENING = [
  stone(1, 2, 2, STONES.black),
  stone(2, 6, 6, STONES.white),
  stone(3, 2, 6, STONES.black),
  stone(4, 6, 2, STONES.white),
];

/** What the engine makes of the opening and two passes, asked of the engine rather than restated. */
function goAfterTwoPasses() {
  let state = createGame({ variant: "go", size: 9 });
  for (const move of GO_OPENING) state = playMove(state, { row: move.row, col: move.col });
  return passTurn(passTurn(state));
}

beforeEach(() => {
  row = null;
  moveWrites = [];
  gameWrites = [];
  recordResult.mockClear();
  recordPlayed.mockClear();
});

describe("a pass on a shared game", () => {
  it("is accepted in Go when the player chooses it, and hands the turn over", async () => {
    row = liveRow("go", 9, GO_OPENING);

    const outcome = await appendMove("g1", "black-token", { kind: "pass" });

    expect(outcome).toEqual({ ok: true, game: { id: "g1" } });
    expect(moveWrites).toEqual([
      { gameId: "g1", number: 5, row: -1, col: -1, stone: STONES.black, kind: MOVE_KINDS.pass },
    ]);
    expect(gameWrites).toHaveLength(1);
    expect(gameWrites[0]).toMatchObject({ status: "active", moveCount: 5, winner: null });
    // One pass decides nothing.
    expect(recordPlayed).not.toHaveBeenCalled();
    expect(recordResult).not.toHaveBeenCalled();
  });

  it("ends a Go game on the second pass in a row, counted by the engine and filed and rated", async () => {
    row = liveRow("go", 9, [...GO_OPENING, pass(5, STONES.black)]);
    const expected = goAfterTwoPasses();
    expect(expected.status).toBe(GAME_STATUS.won);
    expect(expected.winner).not.toBeNull();

    const outcome = await appendMove("g1", "white-token", { kind: "pass" });

    expect(outcome.ok).toBe(true);
    expect(moveWrites).toEqual([
      { gameId: "g1", number: 6, row: -1, col: -1, stone: STONES.white, kind: MOVE_KINDS.pass },
    ]);
    expect(gameWrites[0]).toMatchObject({
      status: "finished",
      moveCount: 6,
      winner: expected.winner,
      result: expected.winner,
      deadlineAt: null,
    });
    expect(recordPlayed).toHaveBeenCalledTimes(1);
    expect(recordResult).toHaveBeenCalledTimes(1);
    expect(recordResult).toHaveBeenCalledWith("Kuro", "Shiro", expected.winner, "go", "people");
  });

  it("files an unrated Go game ended by two passes without rating it", async () => {
    row = liveRow("go", 9, [...GO_OPENING, pass(5, STONES.black)], { rated: false });

    const outcome = await appendMove("g1", "white-token", { kind: "pass" });

    expect(outcome.ok).toBe(true);
    expect(gameWrites[0]).toMatchObject({ status: "finished" });
    expect(recordPlayed).toHaveBeenCalledTimes(1);
    expect(recordResult).not.toHaveBeenCalled();
  });

  it("is still refused where the game has no chosen pass and the player has a move", async () => {
    row = liveRow("freestyle", 15, [stone(1, 7, 7, STONES.black), stone(2, 7, 8, STONES.white)]);

    const outcome = await appendMove("g1", "black-token", { kind: "pass" });

    expect(outcome).toEqual({ ok: false, reason: "illegal" });
    expect(moveWrites).toEqual([]);
    expect(gameWrites).toEqual([]);
  });

  it("is refused out of turn in Go, as any move is", async () => {
    row = liveRow("go", 9, GO_OPENING);

    const outcome = await appendMove("g1", "white-token", { kind: "pass" });

    expect(outcome).toEqual({ ok: false, reason: "not-your-turn" });
    expect(moveWrites).toEqual([]);
  });
});

/**
 * THE CLOCK WRITES A PASS TOO, and it must settle what that pass replays to.
 *
 * A claimed timeout under the graceful penalty writes the missed turn as a
 * pass row. With chosen passes now possible in a live Go game, a pass followed
 * by a missed turn is two passes on the record, and the replay every page
 * reads ends the game by count. The claim used to settle `forfeitTurn` instead
 * and write the row as still active: a board every reader saw as over, sitting
 * in both players' queues, never filed and never rated.
 */
describe("a claimed timeout that writes a pass", () => {
  const hourAgo = () => new Date(Date.now() - 3_600_000);
  const clocked = () => ({ moveTimeMs: 60_000, lastMoveAt: hourAgo(), deadlineAt: hourAgo(), timeoutPenalty: "turn" });

  it("in Go, after a pass, ends the game by count and files it the way the record replays", async () => {
    row = liveRow("go", 9, [...GO_OPENING, pass(5, STONES.black)], clocked());

    const outcome = await claimTimeout("g1", "black-token");

    expect(outcome.ok).toBe(true);
    expect(moveWrites).toEqual([
      { gameId: "g1", number: 6, row: -1, col: -1, stone: STONES.white, kind: MOVE_KINDS.pass },
    ]);
    // The record as it now stands on the database, replayed exactly as a page would.
    const stored = liveRow("go", 9, [...GO_OPENING, pass(5, STONES.black), pass(6, STONES.white)]);
    const replayed = replay(stored as unknown as Parameters<typeof replay>[0]);
    expect(replayed.status).toBe(GAME_STATUS.won);
    expect(gameWrites[0]).toMatchObject({ status: "finished", winner: replayed.winner, result: replayed.winner });
    expect(recordPlayed).toHaveBeenCalledTimes(1);
    expect(recordResult).toHaveBeenCalledTimes(1);
  });

  it("in a game with no chosen pass, still takes the turn away and decides nothing", async () => {
    row = liveRow("freestyle", 15, [stone(1, 7, 7, STONES.black)], clocked());

    const outcome = await claimTimeout("g1", "black-token");

    expect(outcome.ok).toBe(true);
    // Written as a forfeit: a pass here is one the rules refuse, and the replay would stop at it. See liveForfeit.test.ts.
    expect(moveWrites).toEqual([
      { gameId: "g1", number: 2, row: -1, col: -1, stone: STONES.white, kind: MOVE_KINDS.forfeit },
    ]);
    expect(gameWrites[0]).toMatchObject({ status: "active", moveCount: 2, whiteForfeits: 1 });
    expect(recordPlayed).not.toHaveBeenCalled();
  });
});
