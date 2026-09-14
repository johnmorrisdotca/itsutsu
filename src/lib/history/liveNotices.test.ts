import { beforeEach, describe, expect, it, vi } from "vitest";

import { BOT_MEMBER_LIST } from "@/lib/bots/bots.constants";
import { MOVE_KINDS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { EmailEvent } from "@/lib/notify/email";

/**
 * A NOTICE IS ASKED FOR ONLY WHERE A PERSON CAN READ IT.
 *
 * Every move and every ending asked for an email whenever the game was not at
 * one screen, so a program's seat was asked for too: a batch of programs'
 * games asked for about two thousand your-turn emails and a game-over each.
 * The placeholder sends nothing, so nothing was paid — until a provider.
 *
 * These go through the real call sites — `appendMove`, `claimTimeout`,
 * `resignGame`, `cancelGame`, `declineOffer` — against a mocked database, with
 * the real `isBotId` deciding who is a program, and assert on what was ASKED
 * of `sendEmail`. The answer it gives is not the decision and is not checked.
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

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      findUnique: async () => row,
      update: ({ data }: { data: Record<string, unknown> }) => Promise.resolve(data),
    },
    move: {
      create: ({ data }: { data: Record<string, unknown> }) => Promise.resolve(data),
    },
    $transaction: async (writes: Promise<unknown>[]) => Promise.all(writes),
  },
}));

const sendEmail = vi.fn(async (event: EmailEvent) => ({ delivered: false as const, reason: "no-provider" as const, event }));

vi.mock("@/lib/notify/email", () => ({ sendEmail: (event: EmailEvent) => sendEmail(event) }));
vi.mock("./gameHistory", async (original) => ({
  ...(await original<typeof import("./gameHistory")>()),
  fetchGameDetail: async () => ({ id: "g1" }),
}));
vi.mock("./gameId", () => ({ freeGameId: async () => "g1" }));
vi.mock("@/lib/rating/recordResult", () => ({ recordResult: async () => {} }));
vi.mock("@/lib/rating/playedRun", () => ({ recordPlayed: async () => {} }));
vi.mock("@/lib/rating/pools", () => ({ poolFor: () => "people" }));
vi.mock("@/lib/social/vacation", () => ({ fetchTimeOff: async () => [], timeOffGraceMs: () => 0 }));
vi.mock("@/lib/xp/xpSocial", () => ({ awardAnsweredChallenge: async () => {}, awardCourtesy: async () => {} }));

const { appendMove } = await import("./liveGame");
const { cancelGame, claimTimeout, resignGame } = await import("./liveGameEndings");
const { declineOffer } = await import("./offerAnswer");

const [PROGRAM, OTHER_PROGRAM] = BOT_MEMBER_LIST.map((bot) => bot.id);

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

/** Four black stones in a row with black to move: (7, 7) makes five. */
const BLACK_TO_WIN = [
  stone(1, 7, 3, STONES.black),
  stone(2, 0, 0, STONES.white),
  stone(3, 7, 4, STONES.black),
  stone(4, 0, 2, STONES.white),
  stone(5, 7, 5, STONES.black),
  stone(6, 0, 4, STONES.white),
  stone(7, 7, 6, STONES.black),
  stone(8, 0, 6, STONES.white),
];

const hourAgo = () => new Date(Date.now() - 3_600_000);

/** A freestyle game with a seat key each, no clock, and whoever `over` seats in it. */
function liveRow(over: Partial<Row> = {}): Row {
  return {
    id: "g1",
    status: "active",
    size: 15,
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

const asked = () => sendEmail.mock.calls.map(([event]) => event);

beforeEach(() => {
  row = null;
  sendEmail.mockClear();
});

describe("a your-turn notice", () => {
  it("is asked for when a person holds the seat now to move", async () => {
    row = liveRow();
    expect((await appendMove("g1", "black-token", { kind: "place", row: 7, col: 7 })).ok).toBe(true);
    expect(asked()).toEqual([{ kind: "your-turn", gameId: "g1", stone: STONES.white, memberId: "member-white" }]);
  });

  it("is not asked for when a program holds the seat now to move", async () => {
    row = liveRow({ whiteMemberId: PROGRAM });
    expect((await appendMove("g1", "black-token", { kind: "place", row: 7, col: 7 })).ok).toBe(true);
    expect(asked()).toEqual([]);
  });

  it("is asked for the person when the program has moved", async () => {
    row = liveRow({ whiteMemberId: PROGRAM, moves: [stone(1, 7, 7, STONES.black)] });
    expect((await appendMove("g1", "white-token", { kind: "place", row: 0, col: 0 })).ok).toBe(true);
    expect(asked()).toEqual([{ kind: "your-turn", gameId: "g1", stone: STONES.black, memberId: "member-black" }]);
  });

  it("is not asked for a seat with no member row behind its name", async () => {
    row = liveRow({ whiteMemberId: null });
    expect((await appendMove("g1", "black-token", { kind: "place", row: 7, col: 7 })).ok).toBe(true);
    expect(asked()).toEqual([]);
  });

  it("is never asked for between two programs, whichever of them moves", async () => {
    row = liveRow({ blackMemberId: PROGRAM, whiteMemberId: OTHER_PROGRAM });
    expect((await appendMove("g1", "black-token", { kind: "place", row: 7, col: 7 })).ok).toBe(true);
    row = liveRow({ blackMemberId: PROGRAM, whiteMemberId: OTHER_PROGRAM, moves: [stone(1, 7, 7, STONES.black)] });
    expect((await appendMove("g1", "white-token", { kind: "place", row: 0, col: 0 })).ok).toBe(true);
    expect(asked()).toEqual([]);
  });
});

describe("a game-over notice", () => {
  it("is asked for nobody when two programs finish a game", async () => {
    row = liveRow({ blackMemberId: PROGRAM, whiteMemberId: OTHER_PROGRAM, moves: BLACK_TO_WIN });
    expect((await appendMove("g1", "black-token", { kind: "place", row: 7, col: 7 })).ok).toBe(true);
    expect(asked()).toEqual([]);
  });

  it("is asked for the person only when a person beats a program", async () => {
    row = liveRow({ whiteMemberId: PROGRAM, moves: BLACK_TO_WIN });
    expect((await appendMove("g1", "black-token", { kind: "place", row: 7, col: 7 })).ok).toBe(true);
    expect(asked()).toEqual([
      { kind: "game-over", gameId: "g1", winner: STONES.black, stone: STONES.black, memberId: "member-black" },
    ]);
  });

  it("is asked for the person only when a person resigns to a program", async () => {
    row = liveRow({ blackMemberId: PROGRAM, whiteMemberId: "member-white", moves: [stone(1, 7, 7, STONES.black)] });
    expect((await resignGame("g1", "white-token")).ok).toBe(true);
    expect(asked()).toEqual([
      { kind: "game-over", gameId: "g1", winner: STONES.black, stone: STONES.white, memberId: "member-white" },
    ]);
  });

  it("is asked for both people when a game between two people is lost on time", async () => {
    row = liveRow({ moveTimeMs: 60_000, timeoutPenalty: "game", lastMoveAt: hourAgo(), deadlineAt: hourAgo() });
    expect((await claimTimeout("g1", "white-token")).ok).toBe(true);
    expect(asked()).toEqual([
      { kind: "game-over", gameId: "g1", winner: STONES.white, stone: STONES.black, memberId: "member-black" },
      { kind: "game-over", gameId: "g1", winner: STONES.white, stone: STONES.white, memberId: "member-white" },
    ]);
  });

  it("is asked for nobody when a program's game with a typed name is called off", async () => {
    row = liveRow({ blackMemberId: null, whiteMemberId: PROGRAM });
    expect((await cancelGame("g1", "black-token")).ok).toBe(true);
    expect(asked()).toEqual([]);
  });

  it("is asked for the offerer only when an offer is declined", async () => {
    row = liveRow({
      whiteMemberId: null,
      offeredToMemberId: "member-white",
      offeredAt: hourAgo(),
    });
    expect((await declineOffer("g1", "member-white")).ok).toBe(true);
    expect(asked()).toEqual([
      { kind: "game-over", gameId: "g1", winner: null, stone: STONES.black, memberId: "member-black" },
    ]);
  });
});

describe("a game at one screen", () => {
  const oneScreen = { blackToken: "one-token", whiteToken: "one-token", whiteMemberId: "member-black" };

  it("asks for no your-turn notice, as before", async () => {
    row = liveRow(oneScreen);
    expect((await appendMove("g1", "one-token", { kind: "place", row: 7, col: 7 })).ok).toBe(true);
    expect(asked()).toEqual([]);
  });

  it("asks for no game-over notice, as before", async () => {
    row = liveRow({ ...oneScreen, moves: BLACK_TO_WIN });
    expect((await appendMove("g1", "one-token", { kind: "place", row: 7, col: 7 })).ok).toBe(true);
    expect(asked()).toEqual([]);
  });
});
