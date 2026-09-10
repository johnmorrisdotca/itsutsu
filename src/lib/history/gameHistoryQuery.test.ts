import { describe, expect, it } from "vitest";
import {
  buildGameOrderBy,
  buildGameWhere,
  toGameHistoryQuery,
} from "./gameHistoryQuery";
import { GAME_PAGE_SIZE_DEFAULT } from "./gameHistory.constants";

const parse = (search: string) =>
  toGameHistoryQuery(new URL(`https://example.test/api/games${search}`));

describe("toGameHistoryQuery", () => {
  it("defaults to the newest games first", () => {
    const query = parse("");
    expect(query).toMatchObject({
      page: 1,
      pageSize: GAME_PAGE_SIZE_DEFAULT,
      sortBy: "playedAt",
      sortDir: "desc",
      result: "all",
      variant: "all",
    });
    expect(query?.size).toBeNull();
  });

  it("coerces numeric parameters from strings", () => {
    expect(parse("?page=3&limit=50")).toMatchObject({ page: 3, pageSize: 50 });
  });

  it("treats a blank search as no filter rather than an empty match", () => {
    expect(parse("?search=%20%20")?.search).toBeNull();
  });

  it("trims a search that has content", () => {
    expect(parse("?search=%20ren%20")?.search).toBe("ren");
  });

  it("rejects a page size beyond the cap", () => {
    expect(parse("?limit=5000")).toBeNull();
  });

  it("rejects an unknown sort column", () => {
    expect(parse("?sort=winner")).toBeNull();
    expect(parse("?sort=moves&order=asc")).toMatchObject({ sortBy: "moveCount", sortDir: "asc" });
    expect(parse("?variant=drop-four")).toMatchObject({ variant: "dropFour" });
  });

  it("rejects an unknown result filter", () => {
    expect(parse("?result=forfeit")).toBeNull();
  });

  it("reads a board size filter as a number", () => {
    expect(parse("?size=9")?.size).toBe(9);
  });

  it("parses a date range", () => {
    const query = parse("?from=2026-01-01&to=2026-02-01");
    expect(query?.from).toBeInstanceOf(Date);
    expect(query?.to?.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });
});

describe("buildGameWhere", () => {
  it("lists only finished games when nothing else is asked for", () => {
    expect(buildGameWhere(parse("")!)).toEqual({ AND: [{ status: "finished" }] });
  });

  it("searches both seats case-insensitively", () => {
    const where = buildGameWhere(parse("?search=aki")!);
    expect(where.AND).toContainEqual({
      OR: [
        { blackName: { contains: "aki", mode: "insensitive" } },
        { whiteName: { contains: "aki", mode: "insensitive" } },
      ],
    });
  });

  it("combines every filter", () => {
    const where = buildGameWhere(parse("?result=black&variant=standard&size=15")!);
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { result: "black" },
        { variant: "standard" },
        { size: 15 },
      ]),
    );
  });

  /*
   * The player-relative outcome. Every count on the site links through it, so
   * "their seven losses" opening seven games is the whole promise being kept
   * — and the stored result names a colour, which cannot answer that alone.
   */
  describe("an outcome read from one player's side", () => {
    it("reads a loss as either colour losing, depending which they were", () => {
      const where = buildGameWhere(parse("?player=Aki&outcome=lost")!);
      expect(where.AND).toContainEqual({
        OR: [
          {
            AND: [
              { blackName: { equals: "Aki", mode: "insensitive" } },
              { result: "white" },
            ],
          },
          {
            AND: [
              { whiteName: { equals: "Aki", mode: "insensitive" } },
              { result: "black" },
            ],
          },
        ],
      });
    });

    it("reads a win the other way round", () => {
      const where = buildGameWhere(parse("?player=Aki&outcome=won")!);
      expect(where.AND).toContainEqual({
        OR: [
          {
            AND: [
              { blackName: { equals: "Aki", mode: "insensitive" } },
              { result: "black" },
            ],
          },
          {
            AND: [
              { whiteName: { equals: "Aki", mode: "insensitive" } },
              { result: "white" },
            ],
          },
        ],
      });
    });

    it("counts a draw without needing to know who was which colour", () => {
      expect(buildGameWhere(parse("?outcome=drawn")!).AND).toContainEqual({ result: "draw" });
    });

    /*
     * The link behind a player's "played". Their record leaves abandoned games
     * out, so this has to as well — a count that opens a longer list than it
     * counted is the fault the whole idea exists to prevent.
     */
    it("leaves abandoned games out of what was decided", () => {
      expect(buildGameWhere(parse("?outcome=decided")!).AND).toContainEqual({
        result: { not: "abandoned" },
      });
    });

    it("drops a win or a loss with nobody to read it against", () => {
      // Unanswerable, not empty: better to leave the record as it was than to
      // quietly return nothing and look like a player with no wins.
      expect(buildGameWhere(parse("?outcome=won")!)).toEqual({ AND: [{ status: "finished" }] });
    });
  });

  describe("which ladder was counting", () => {
    it("finds the computer pool by who was sitting in the seats", () => {
      const where = buildGameWhere(parse("?pool=computer")!, ["bot-1", "bot-2"]);
      expect(where.AND).toContainEqual({
        OR: [
          { blackMemberId: { in: ["bot-1", "bot-2"] } },
          { whiteMemberId: { in: ["bot-1", "bot-2"] } },
        ],
      });
    });

    it("keeps a seat nobody holds an account for in the people pool", () => {
      // `NOT (id IN (…))` is not true of NULL, and most of the record is games
      // played under a typed-in name with no member behind it.
      const where = buildGameWhere(parse("?pool=people")!, ["bot-1"]);
      expect(where.AND).toContainEqual({
        AND: [
          { OR: [{ blackMemberId: null }, { blackMemberId: { notIn: ["bot-1"] } }] },
          { OR: [{ whiteMemberId: null }, { whiteMemberId: { notIn: ["bot-1"] } }] },
        ],
      });
    });

    it("finds no computer games when there are no computer players", () => {
      expect(buildGameWhere(parse("?pool=computer")!, []).AND).toContainEqual({ id: { in: [] } });
    });

    it("leaves the people pool alone when there are no computer players", () => {
      expect(buildGameWhere(parse("?pool=people")!, [])).toEqual({ AND: [{ status: "finished" }] });
    });

    it("treats no seats handed in as no computer players, which is what it is", () => {
      /*
       * The two readings are indistinguishable from in here — "there are no
       * programs" and "the caller forgot" produce the same empty list — so it
       * takes the one that is true of a fresh database. The fetchers hand the
       * real ids in whenever a pool is asked for, so the other reading is a
       * misuse rather than a state the site reaches.
       */
      expect(buildGameWhere(parse("?pool=computer")!).AND).toContainEqual({ id: { in: [] } });
    });

    it("says rated in the address and true in the query", () => {
      expect(buildGameWhere(parse("?rated=yes")!).AND).toContainEqual({ rated: true });
      expect(buildGameWhere(parse("?rated=no")!).AND).toContainEqual({ rated: false });
    });
  });

  describe("what a player said about their own play", () => {
    it("reads a verdict from whichever seat they were in", () => {
      const where = buildGameWhere(parse("?player=Aki&verdict=up")!);
      expect(where.AND).toContainEqual({
        OR: [
          { blackName: { equals: "Aki", mode: "insensitive" }, blackVerdict: "up" },
          { whiteName: { equals: "Aki", mode: "insensitive" }, whiteVerdict: "up" },
        ],
      });
    });

    /*
     * The one the sentence actually needs. "The 12 games you judged" counts
     * both verdicts, and without this it would have linked to every game the
     * name ever played — a count opening a longer list than it counted, which
     * is the fault the whole idea exists to stop.
     */
    it("counts a game judged either way as judged", () => {
      const where = buildGameWhere(parse("?player=Aki&verdict=judged")!);
      expect(where.AND).toContainEqual({
        OR: [
          { blackName: { equals: "Aki", mode: "insensitive" }, blackVerdict: { not: null } },
          { whiteName: { equals: "Aki", mode: "insensitive" }, whiteVerdict: { not: null } },
        ],
      });
    });

    it("drops a verdict with nobody to read it against", () => {
      // Only the person who played can have said it, so without a name there
      // is no question here to answer.
      expect(buildGameWhere(parse("?verdict=up")!)).toEqual({ AND: [{ status: "finished" }] });
    });
  });

  it("builds a half-open range from one date", () => {
    const where = buildGameWhere(parse("?from=2026-01-01")!);
    expect(where.AND).toContainEqual({
      playedAt: { gte: new Date("2026-01-01") },
    });
  });
});

describe("buildGameOrderBy", () => {
  it("always breaks ties on id, so paging cannot hide a row", () => {
    for (const sort of ["playedAt", "moveCount", "size", "duration"]) {
      const order = buildGameOrderBy(parse(`?sortBy=${sort}`)!);
      expect(order[order.length - 1]).toEqual({ id: "asc" });
    }
  });

  it("sorts unclocked games last whichever way duration is sorted", () => {
    expect(buildGameOrderBy(parse("?sort=duration&order=asc")!)[0]).toEqual({
      durationMs: { sort: "asc", nulls: "last" },
    });
    expect(buildGameOrderBy(parse("?sort=duration&order=desc")!)[0]).toEqual({
      durationMs: { sort: "desc", nulls: "last" },
    });
  });
});
