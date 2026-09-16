import { beforeEach, describe, expect, it, vi } from "vitest";

import { playMove } from "@/lib/gomoku/engine";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";

/**
 * A MOVE MAY BE HANDED THE POSITION IT IS PLAYED ON, AND IS REPLAYED ANYWAY
 * UNLESS THAT POSITION IS THE ROW'S.
 *
 * `appendMove` takes `known`: the state a caller already holds — the one a
 * computer just chose on, or the one the previous move in the same request
 * settled into. What it saves is the replay, and only when `sameRecord` says
 * the state is what the row would replay to. Everything else it checks, it
 * checks against the row as read: the status, the offer, the token, the turn.
 *
 * Against a store that keeps what is written, so a second call sees the first
 * call's row, and with the real `replay` counted rather than replaced.
 */

type StoredMove = {
  number: number;
  row: number;
  col: number;
  stone: string;
  kind: string;
  fromRow: number | null;
  fromCol: number | null;
  twistQuadrant: number | null;
  twistClockwise: boolean | null;
  cells: unknown;
  createdAt: Date;
};
type Row = Record<string, unknown> & { id: string; status: string; moves: StoredMove[] };
type Write = { apply: () => void };

const seen = vi.hoisted(() => ({ replays: 0 }));

let row: Row | null = null;
let moveWrites: Record<string, unknown>[] = [];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      findUnique: async () => (row === null ? null : { ...row, moves: row.moves.map((move) => ({ ...move })) }),
      update: ({ data }: { data: Record<string, unknown> }): Write => ({
        apply: () => Object.assign(row as Row, data),
      }),
    },
    move: {
      create: ({ data }: { data: Record<string, unknown> }): Write => ({
        apply: () => {
          moveWrites.push(data);
          (row as Row).moves.push({
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
          });
        },
      }),
    },
    $transaction: async (writes: Write[]) => {
      for (const write of writes) write.apply();
    },
  },
}));

vi.mock("./liveGameRow", async (original) => {
  const real = await original<typeof import("./liveGameRow")>();
  return {
    ...real,
    replay: (stored: Parameters<typeof real.replay>[0]) => {
      seen.replays += 1;
      return real.replay(stored);
    },
  };
});
vi.mock("./gameHistory", async (original) => ({
  ...(await original<typeof import("./gameHistory")>()),
  fetchGameDetail: async () => ({ id: "g1" }),
}));
vi.mock("./gameId", () => ({ freeGameId: async () => "g1" }));
vi.mock("@/lib/rating/recordResult", () => ({ recordResult: async () => {} }));
vi.mock("@/lib/rating/playedRun", () => ({ recordPlayed: async () => {} }));
vi.mock("@/lib/rating/pools", () => ({ poolFor: () => "people" }));
vi.mock("@/lib/bots/bots", () => ({
  hasBotSeat: () => false,
  seatMemberId: () => null,
  isBotId: () => false,
  botInSeat: () => null,
}));
vi.mock("@/lib/social/vacation", () => ({ fetchTimeOff: async () => [], timeOffGraceMs: () => 0 }));
vi.mock("@/lib/notify/gameNotices", () => ({ noticeYourTurn: async () => {}, noticeGameOver: async () => {} }));
vi.mock("@/lib/xp/xpSocial", () => ({ awardAnsweredChallenge: async () => {}, awardCourtesy: async () => {} }));

const { appendMove, replay, sameRecord } = await import("./liveGame");

function liveRow(): Row {
  return {
    id: "g1",
    status: "active",
    size: 9,
    winLength: 5,
    variant: "freestyle",
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
    rated: false,
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

/** The row as the store holds it now, typed the way `replay` wants it. */
const current = () => row as unknown as Parameters<typeof replay>[0];

beforeEach(() => {
  row = liveRow();
  moveWrites = [];
  seen.replays = 0;
});

describe("appendMove with a known position", () => {
  it("replays the row when it is told nothing, as it always did", async () => {
    const outcome = await appendMove("g1", "black-token", { kind: "place", row: 4, col: 4 });
    expect(outcome.ok).toBe(true);
    expect(seen.replays).toBe(1);
    expect(moveWrites.map((write) => write.number)).toEqual([1]);
  });

  it("takes the position it is handed when that is the row's, and replays nothing", async () => {
    await appendMove("g1", "black-token", { kind: "place", row: 4, col: 4 });
    const known = replay(current());
    seen.replays = 0;

    const outcome = await appendMove("g1", "white-token", { kind: "place", row: 3, col: 3 }, { known });
    expect(outcome.ok).toBe(true);
    expect(seen.replays).toBe(0);
    expect(moveWrites.map((write) => write.number)).toEqual([1, 2]);
    if (!outcome.ok) throw new Error("unreachable");
    // What comes back is the position the move settled into: the next call may hand it straight back.
    expect(outcome.state.moves.length).toBe(2);
    expect(sameRecord(outcome.state, current())).toBe(true);
  });

  it("replays the row when the position it is handed is a move behind it", async () => {
    await appendMove("g1", "black-token", { kind: "place", row: 4, col: 4 });
    const behind = replay(current());
    await appendMove("g1", "white-token", { kind: "place", row: 3, col: 3 });
    seen.replays = 0;

    // `behind` has one move; the row has two. The row is the truth.
    const outcome = await appendMove("g1", "black-token", { kind: "place", row: 5, col: 5 }, { known: behind });
    expect(outcome.ok).toBe(true);
    expect(seen.replays).toBe(1);
    expect(moveWrites.map((write) => write.number)).toEqual([1, 2, 3]);
  });

  it("replays the row when the position it is handed ends in a different move", async () => {
    await appendMove("g1", "black-token", { kind: "place", row: 4, col: 4 });
    const one = replay(current());
    await appendMove("g1", "white-token", { kind: "place", row: 3, col: 3 });
    seen.replays = 0;

    // The same length as the row, and a different last stone: not this record.
    const elsewhere: GameState = playMove(one, { row: 2, col: 2 });
    expect(elsewhere.moves.length).toBe((row as Row).moves.length);
    const outcome = await appendMove("g1", "black-token", { kind: "place", row: 5, col: 5 }, { known: elsewhere });
    expect(outcome.ok).toBe(true);
    expect(seen.replays).toBe(1);
    // Played on the row's position, where 2,2 is empty and 3,3 is not.
    expect(moveWrites[2]).toMatchObject({ number: 3, row: 5, col: 5 });
  });

  it("still refuses on what the row says, whatever position it was handed", async () => {
    await appendMove("g1", "black-token", { kind: "place", row: 4, col: 4 });
    const known = replay(current());
    seen.replays = 0;

    (row as Row).status = "finished";
    const finished = await appendMove("g1", "white-token", { kind: "place", row: 3, col: 3 }, { known });
    expect(finished).toEqual({ ok: false, reason: "finished" });

    (row as Row).status = "active";
    const wrongSeat = await appendMove("g1", "black-token", { kind: "place", row: 3, col: 3 }, { known });
    expect(wrongSeat).toEqual({ ok: false, reason: "not-your-turn" });
    expect(seen.replays).toBe(0);
  });
});
