import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The batched sibling of `fetchPlayerRecord`, and the bug it exists to fix.
 *
 * The members directory read `wins + losses + draws` off the RATING table
 * (`Player`), which only ever holds rated games — so a computer player with
 * 36 finished games showed 1, because 35 of them were unrated. This is the
 * honest source for a table of many rows: the games table itself, batched
 * into one query rather than one call to `fetchPlayerRecord` per row.
 *
 * Its own test file, separate from `playerRecord.test.ts`, because the query
 * shape is different enough that sharing one mock would blur what each is
 * asserting: `fetchPlayerRecord` matches by name OR id with `equals` clauses;
 * this matches by id ALONE with `in` clauses, and never reads a name at all.
 */

type Row = {
  blackMemberId: string | null;
  whiteMemberId: string | null;
  winner: string | null;
  status?: string;
  result?: string;
};

let stored: Row[] = [];
let lastWhere: unknown = null;

const findMany = vi.fn(async ({ where }: { where: unknown }) => {
  lastWhere = where;
  // The real query filters in SQL; the fixtures below are already exactly
  // what a finished, non-abandoned game with one of the wanted ids looks
  // like, so the mock only needs to hand them back.
  return stored;
});

vi.mock("@/lib/prisma", () => ({ prisma: { game: { findMany: (args: never) => findMany(args) } } }));

const { fetchPlayedTallies } = await import("./playerRecord");

function game(black: string | null, white: string | null, winner: string | null): Row {
  return { blackMemberId: black, whiteMemberId: white, winner };
}

beforeEach(() => {
  stored = [];
  lastWhere = null;
  findMany.mockClear();
});

describe("a whole table's worth of members, in one query", () => {
  it("makes exactly one query, whatever the batch size", async () => {
    stored = [game("a", "b", "black"), game("c", "d", "white"), game("a", "c", null)];

    await fetchPlayedTallies(["a", "b", "c", "d"]);

    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("counts a win for the black seat and a loss for the white seat of the same game", async () => {
    stored = [game("a", "b", "black")];

    const tallies = await fetchPlayedTallies(["a", "b"]);

    expect(tallies.get("a")).toEqual({ wins: 1, losses: 0, draws: 0 });
    expect(tallies.get("b")).toEqual({ wins: 0, losses: 1, draws: 0 });
  });

  it("counts a draw for both seats", async () => {
    stored = [game("a", "b", null)];

    const tallies = await fetchPlayedTallies(["a", "b"]);

    expect(tallies.get("a")).toEqual({ wins: 0, losses: 0, draws: 1 });
    expect(tallies.get("b")).toEqual({ wins: 0, losses: 0, draws: 1 });
  });

  it("answers zero for a member with no games, rather than leaving them out", async () => {
    stored = [];

    const tallies = await fetchPlayedTallies(["nobody"]);

    expect(tallies.get("nobody")).toEqual({ wins: 0, losses: 0, draws: 0 });
  });

  it("skips the query entirely for an empty batch", async () => {
    const tallies = await fetchPlayedTallies([]);

    expect(findMany).not.toHaveBeenCalled();
    expect(tallies.size).toBe(0);
  });

  it("filters by member id alone — status finished, result not abandoned, either seat", async () => {
    await fetchPlayedTallies(["a"]);

    expect(lastWhere).toMatchObject({
      status: "finished",
      result: { not: "abandoned" },
      OR: [{ blackMemberId: { in: ["a"] } }, { whiteMemberId: { in: ["a"] } }],
    });
  });

  it("counts a game against yourself once, from the black seat, not twice", async () => {
    /*
     * Both seats carry the same id. Two entries in the UNION-shaped tally
     * would count this game twice for one member and invent a result they
     * did not have — a win AND a loss from a single game. It is one game:
     * attributed to the black seat, exactly as `fetchPlayerRecord` already
     * does for the same case.
     */
    stored = [game("solo", "solo", "white")];

    const tallies = await fetchPlayedTallies(["solo"]);

    expect(tallies.get("solo")).toEqual({ wins: 0, losses: 1, draws: 0 });
  });

  it("ignores a game whose seats belong to nobody in the batch", async () => {
    // The mock always returns `stored`, standing in for whatever the real
    // WHERE clause let through; a member not asked about must still be
    // ignored by the aggregation itself, not only by the query.
    stored = [game("a", "b", "black")];

    const tallies = await fetchPlayedTallies(["c"]);

    expect(tallies.get("c")).toEqual({ wins: 0, losses: 0, draws: 0 });
    expect(tallies.has("a")).toBe(false);
  });

  it("tallies many members from one shared read of the games table", async () => {
    stored = [
      game("a", "b", "black"),
      game("b", "a", "white"),
      game("a", "c", "black"),
      game("c", "a", null),
    ];

    const tallies = await fetchPlayedTallies(["a", "b", "c"]);

    // a: won as black vs b, won as white vs b, won as black vs c, drew as white vs c -> 3W 0L 1D
    expect(tallies.get("a")).toEqual({ wins: 3, losses: 0, draws: 1 });
    // b: lost as white vs a, lost as black vs a -> 0W 2L 0D
    expect(tallies.get("b")).toEqual({ wins: 0, losses: 2, draws: 0 });
    // c: lost as white vs a, drew as black vs a -> 0W 1L 1D
    expect(tallies.get("c")).toEqual({ wins: 0, losses: 1, draws: 1 });
  });
});
