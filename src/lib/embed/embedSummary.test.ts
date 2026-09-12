import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The embed widget must not count a game against yourself twice.
 *
 * `playerRecord` ran `blackGames = count(blackName = X)` and
 * `whiteGames = count(whiteName = X)` as two separate queries and added them.
 * For an ordinary game that is right — a player occupies exactly one seat —
 * but a game played against yourself has the same name on both seats, so that
 * one row satisfied both counts and was added in twice. On production this
 * read "played 15, won 11" for John Morris while every other page on the
 * site — all of which count by the games table directly, one row per game —
 * said 14 and 10.
 *
 * The fixture below proves the mechanism rather than reproducing production's
 * exact figures: three finished games, one of them self-play. The true
 * answer is three games played; the old arithmetic answers four, because the
 * self-play row is counted from both seats.
 */

type Row = {
  id: string;
  variant: string;
  blackName: string;
  whiteName: string;
  blackMemberId: string | null;
  whiteMemberId: string | null;
  winner: string | null;
  hiddenByBlack: boolean;
  hiddenByWhite: boolean;
  status: string;
  result: string;
  moveCount: number;
  size: number;
  playedAt: Date;
};

let stored: Row[] = [];

type Clause = {
  blackName?: { equals: string; mode?: string };
  whiteName?: { equals: string; mode?: string };
  blackMemberId?: string;
  whiteMemberId?: string;
};
type Where = Clause & {
  status?: string;
  result?: string | { not: string };
  OR?: Clause[];
};

/** Enough of Prisma's `where` to answer every query these two modules make. */
function matches(row: Row, where: Where): boolean {
  if (where.status !== undefined && row.status !== where.status) return false;
  if (where.result !== undefined) {
    if (typeof where.result === "string") {
      if (row.result !== where.result) return false;
    } else if (row.result === where.result.not) {
      return false;
    }
  }
  if (where.blackName !== undefined && row.blackName.toLowerCase() !== where.blackName.equals.toLowerCase()) {
    return false;
  }
  if (where.whiteName !== undefined && row.whiteName.toLowerCase() !== where.whiteName.equals.toLowerCase()) {
    return false;
  }
  if (where.OR !== undefined) {
    return where.OR.some((clause) => matchesClause(row, clause));
  }
  return true;
}

/** A bare OR clause carries only the seat-name/id parts of `Where`. */
function matchesClause(row: Row, clause: Clause): boolean {
  if (clause.blackName !== undefined) return row.blackName.toLowerCase() === clause.blackName.equals.toLowerCase();
  if (clause.whiteName !== undefined) return row.whiteName.toLowerCase() === clause.whiteName.equals.toLowerCase();
  if (clause.blackMemberId !== undefined) return row.blackMemberId === clause.blackMemberId;
  if (clause.whiteMemberId !== undefined) return row.whiteMemberId === clause.whiteMemberId;
  return false;
}

const count = vi.fn(async ({ where }: { where: Where }) => stored.filter((row) => matches(row, where)).length);
const findMany = vi.fn(async ({ where }: { where: Where }) =>
  [...stored]
    .filter((row) => matches(row, where))
    .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime()),
);

vi.mock("@/lib/prisma", () => ({
  prisma: { game: { count: (args: never) => count(args), findMany: (args: never) => findMany(args) } },
}));

const { fetchEmbedSummary } = await import("./embedSummary");

/**
 * `winner` is never set independently of `result` — the schema's own rule,
 * from `prisma/schema.prisma`: "Set for a decisive game, null for a draw or
 * an abandoned one." A fixture that could set the two out of step from each
 * other is a fixture that can silently test the wrong thing, which is exactly
 * what happened while this was being written: overriding `result` alone left
 * `winner` on its default and the "old" seat lost a game it had actually won.
 */
function game(over: Partial<Omit<Row, "winner">>): Row {
  const result = over.result ?? "black";
  return {
    id: over.id ?? "g",
    variant: "freestyle",
    blackName: "John Morris",
    whiteName: "Someone Else",
    blackMemberId: "john",
    whiteMemberId: "someone",
    hiddenByBlack: false,
    hiddenByWhite: false,
    status: "finished",
    moveCount: 40,
    size: 15,
    playedAt: new Date("2026-01-01T00:00:00Z"),
    ...over,
    result,
    winner: result === "black" || result === "white" ? result : null,
  };
}

beforeEach(() => {
  stored = [];
  count.mockClear();
  findMany.mockClear();
});

describe("a game against yourself is one game, not two", () => {
  it("counts a self-play game once — the reported bug, kept as the thing being fixed", async () => {
    stored = [
      // Ordinary: John as black, wins.
      game({ id: "a", blackName: "John Morris", whiteName: "Someone Else", result: "black" }),
      // Ordinary: John as white, loses.
      game({ id: "b", blackName: "Someone Else", whiteName: "John Morris", result: "black" }),
      // Self-play: both seats are John, black wins — one game, not two.
      game({ id: "c", blackName: "John Morris", whiteName: "John Morris", result: "black" }),
    ];

    const summary = await fetchEmbedSummary("John Morris");

    // Three rows exist; a reader counting them by hand gets three.
    expect(summary.player).toEqual({ name: "John Morris", played: 3, won: 2, lost: 1, drawn: 0 });
  });

  it("still counts every seat correctly with no self-play in the mix", async () => {
    stored = [
      game({ id: "a", blackName: "John Morris", whiteName: "Someone Else", result: "black" }),
      game({ id: "b", blackName: "Someone Else", whiteName: "John Morris", result: "white" }),
      game({ id: "c", blackName: "Someone Else", whiteName: "John Morris", result: "black" }),
    ];

    const summary = await fetchEmbedSummary("John Morris");

    expect(summary.player).toEqual({ name: "John Morris", played: 3, won: 2, lost: 1, drawn: 0 });
  });

  it("reports nothing for a name with no games, rather than a row of noughts pretending to be one", async () => {
    stored = [game({ id: "a" })];

    const summary = await fetchEmbedSummary("Nobody Here");

    expect(summary.player).toEqual({ name: "Nobody Here", played: 0, won: 0, lost: 0, drawn: 0 });
  });

  it("says nothing about a player when none was asked for", async () => {
    stored = [game({ id: "a" })];

    const summary = await fetchEmbedSummary(null);

    expect(summary.player).toBeNull();
  });
});
