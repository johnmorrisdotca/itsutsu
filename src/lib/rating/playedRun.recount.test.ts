import { describe, expect, it, vi } from "vitest";

/**
 * Counting a member's played figures and run again from their games — what an
 * attached record needs, because its games land in the middle of the run.
 *
 * The rules are `playedSides`'s, which `playedRun.test.ts` pins against
 * `fetchPlayedTallies` itself; these pin that the recount applies them and
 * orders the run by when each game ended.
 */

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/xp/xpGameServer", () => ({ awardFinishedGameXp: async () => undefined }));

const { playedFromGames, playedRecountWrite } = await import("./playedRun");

const ME = "me00000000000xxx";
const day = (n: number) => new Date(Date.UTC(2026, 0, n));

function game(id: string, seats: { black?: string | null; white?: string | null }, winner: string | null, ended: number) {
  return {
    id,
    blackMemberId: seats.black ?? null,
    whiteMemberId: seats.white ?? null,
    winner,
    lastMoveAt: day(ended),
    playedAt: day(ended),
  };
}

describe("playedFromGames", () => {
  it("is nought and no run for no games", () => {
    expect(playedFromGames(ME, [])).toEqual({ played: 0, won: 0, lost: 0, drawn: 0, streak: null });
  });

  it("counts each seat of theirs from its own side, and a draw as a draw", () => {
    const games = [game("a", { black: ME }, "black", 1), game("b", { white: ME }, "black", 2), game("c", { white: ME }, null, 3)];
    expect(playedFromGames(ME, games)).toMatchObject({ played: 3, won: 1, lost: 1, drawn: 1 });
  });

  it("counts a game against yourself once, from black", () => {
    expect(playedFromGames(ME, [game("self", { black: ME, white: ME }, "white", 1)])).toMatchObject({ played: 1, lost: 1 });
  });

  it("ignores games that are nobody's, or somebody else's", () => {
    const games = [game("x", { black: "someone" }, "black", 1), game("y", {}, "white", 2)];
    expect(playedFromGames(ME, games).played).toBe(0);
  });

  it("moves nothing for a winner it cannot read", () => {
    expect(playedFromGames(ME, [game("odd", { black: ME }, "purple", 1)]).played).toBe(0);
  });

  it("runs newest first by when the game ended, whatever order the games arrive in", () => {
    const games = [game("old", { black: ME }, "white", 1), game("new", { black: ME }, "black", 3), game("mid", { black: ME }, "black", 2)];
    expect(playedFromGames(ME, games).streak).toEqual({ kind: "win", count: 2 });
  });

  it("reads when a game was played where no stone ever landed", () => {
    const games = [
      { ...game("unmoved", { black: ME }, "white", 9), lastMoveAt: null, playedAt: day(9) },
      game("moved", { black: ME }, "black", 5),
    ];
    expect(playedFromGames(ME, games).streak).toEqual({ kind: "loss", count: 1 });
  });
});

describe("playedRecountWrite", () => {
  it("writes the four figures and the run, and null rather than a kind for no run", () => {
    expect(playedRecountWrite({ played: 0, won: 0, lost: 0, drawn: 0, streak: null })).toEqual({
      played: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      playedStreakKind: null,
      playedStreakCount: 0,
    });
    expect(playedRecountWrite({ played: 2, won: 2, lost: 0, drawn: 0, streak: { kind: "win", count: 2 } })).toMatchObject({
      playedStreakKind: "win",
      playedStreakCount: 2,
    });
  });
});
