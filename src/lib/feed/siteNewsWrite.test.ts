import { beforeEach, describe, expect, it, vi } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import { RATING_POOLS } from "@/lib/rating/pools";

import { SITE_NEWS } from "./siteNews.constants";

/**
 * The writers, with the database mocked: what each writes, what each asks
 * first, and that a failure anywhere is logged and swallowed — news must never
 * cost the game or the solve it rides on.
 */

const written: Record<string, unknown>[][] = [];
const asked: { model: string; args: unknown }[] = [];
let earlierGame: { id: string } | null = null;
let leaders: ({ key: string; memberId: string | null } | null)[] = [];
let best: { elapsedMs: number } | null = null;
let failWrites = false;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siteNews: {
      createMany: async ({ data, skipDuplicates }: { data: Record<string, unknown>[]; skipDuplicates: boolean }) => {
        if (failWrites) throw new Error("database is down");
        expect(skipDuplicates).toBe(true);
        written.push(data);
        return { count: data.length };
      },
    },
    game: {
      fields: { whiteMemberId: "whiteMemberId-field" },
      findFirst: async (args: unknown) => {
        asked.push({ model: "game", args });
        return earlierGame;
      },
    },
    playerVariantRating: {
      findFirst: async (args: unknown) => {
        asked.push({ model: "playerVariantRating", args });
        return leaders.shift() ?? null;
      },
    },
    puzzleSolve: {
      findFirst: async (args: unknown) => {
        asked.push({ model: "puzzleSolve", args });
        return best;
      },
    },
  },
}));

const { bestBefore, leaderBefore, tellFinishedGame, tellFirstPlace, tellSolve } = await import("./siteNewsWrite");

const TOP = BOT_TIER_LIST.at(-1) as keyof typeof BOT_MEMBERS;
const topBot = BOT_MEMBERS[TOP].id;
const game = { id: "g1", variant: "reversi", blackMemberId: "ann", whiteMemberId: "bo", winner: "black" };
const errors = vi.spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => {
  written.length = 0;
  asked.length = 0;
  earlierGame = null;
  leaders = [];
  best = null;
  failWrites = false;
  errors.mockClear();
});

describe("a finished game", () => {
  it("is a game's first when no earlier game of it could have been", async () => {
    await tellFinishedGame(game, [
      { memberId: "ann", outcome: "win", wonBefore: 2, lostBefore: 2 },
      { memberId: "bo", outcome: "loss", wonBefore: 1, lostBefore: 1 },
    ]);
    expect(written.flat()).toEqual([
      { kind: SITE_NEWS.firstGameOfGame, memberId: "ann", variant: "reversi", subject: "", gameId: "g1" },
    ]);
    expect(asked).toHaveLength(1);
  });

  it("is not a game's first when one was played before, and still tells a first win and loss", async () => {
    earlierGame = { id: "g0" };
    await tellFinishedGame(game, [
      { memberId: "ann", outcome: "win", wonBefore: 0, lostBefore: 2 },
      { memberId: "bo", outcome: "loss", wonBefore: 1, lostBefore: 0 },
    ]);
    expect(written.flat().map((row) => row.kind)).toEqual([SITE_NEWS.firstWin, SITE_NEWS.firstLoss]);
  });

  it("asks nothing about a game against yourself, and writes nothing", async () => {
    await tellFinishedGame({ ...game, whiteMemberId: "ann" }, [{ memberId: "ann", outcome: "win", wonBefore: 0, lostBefore: 0 }]);
    expect(asked).toEqual([]);
    expect(written).toEqual([]);
  });

  it("tells the first person to beat a top grade, having asked the games before", async () => {
    earlierGame = null;
    const beaten = { ...game, whiteMemberId: topBot };
    await tellFinishedGame(beaten, [{ memberId: "ann", outcome: "win", wonBefore: 5, lostBefore: 5 }]);
    const kinds = written.flat().map((row) => row.kind);
    expect(kinds).toContain(SITE_NEWS.hardBotBeaten);
    expect(written.flat().find((row) => row.kind === SITE_NEWS.hardBotBeaten)?.subject).toBe(TOP);
  });

  it("does not tell a top grade beaten when a person had beaten it at this game before", async () => {
    earlierGame = { id: "g0" };
    await tellFinishedGame({ ...game, whiteMemberId: topBot }, [{ memberId: "ann", outcome: "win", wonBefore: 5, lostBefore: 5 }]);
    expect(written).toEqual([]);
  });

  it("logs a failed write and returns, never throwing at the ending", async () => {
    failWrites = true;
    await expect(tellFinishedGame(game, [{ memberId: "ann", outcome: "win", wonBefore: 0, lostBefore: 0 }])).resolves.toBeUndefined();
    expect(errors).toHaveBeenCalledOnce();
  });
});

describe("first place", () => {
  it("is read before a result only on the ladder of people", async () => {
    leaders = [{ key: "cy", memberId: "cy" }];
    expect(await leaderBefore("reversi", RATING_POOLS.people)).toEqual({ key: "cy", memberId: "cy" });
    expect(await leaderBefore("reversi", RATING_POOLS.computer)).toBeUndefined();
    expect(asked).toHaveLength(1);
  });

  it("is told when the result put one of its players at the top", async () => {
    leaders = [{ key: "ann", memberId: "ann" }];
    await tellFirstPlace("reversi", "g1", { key: "cy", memberId: "cy" }, ["ann", "bo"]);
    expect(written.flat()).toEqual([
      { kind: SITE_NEWS.tookFirstPlace, memberId: "ann", variant: "reversi", subject: "g1", gameId: "g1" },
    ]);
  });

  it("asks nothing and tells nothing when the leader before could not be read", async () => {
    await tellFirstPlace("reversi", "g1", undefined, ["ann"]);
    expect(asked).toEqual([]);
    expect(written).toEqual([]);
  });
});

describe("a best time", () => {
  const solve = { memberId: "ann", kind: "numberPlace", size: 9, level: "hard", elapsedMs: 150_000, solved: true };

  it("reads the fastest before the solve is kept, and tells a faster one", async () => {
    best = { elapsedMs: 200_000 };
    const before = await bestBefore(solve);
    expect(before).toBe(200_000);
    await tellSolve(solve, before);
    expect(written.flat()[0]).toMatchObject({ kind: SITE_NEWS.bestTime, subject: "9:hard:150000" });
  });

  it("asks nothing for a word that ran out", async () => {
    expect(await bestBefore({ ...solve, solved: false })).toBeUndefined();
    expect(asked).toEqual([]);
  });

  it("tells nothing slower, and nothing when the best could not be read", async () => {
    await tellSolve(solve, 100_000);
    await tellSolve(solve, undefined);
    expect(written).toEqual([]);
  });
});
