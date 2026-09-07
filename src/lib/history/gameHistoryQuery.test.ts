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
    expect(parse("?page=3&pageSize=50")).toMatchObject({ page: 3, pageSize: 50 });
  });

  it("treats a blank search as no filter rather than an empty match", () => {
    expect(parse("?search=%20%20")?.search).toBeNull();
  });

  it("trims a search that has content", () => {
    expect(parse("?search=%20ren%20")?.search).toBe("ren");
  });

  it("rejects a page size beyond the cap", () => {
    expect(parse("?pageSize=5000")).toBeNull();
  });

  it("rejects an unknown sort column", () => {
    expect(parse("?sortBy=winner")).toBeNull();
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
  it("is unfiltered when nothing is asked for", () => {
    expect(buildGameWhere(parse("")!)).toEqual({});
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
    expect(buildGameOrderBy(parse("?sortBy=duration&sortDir=asc")!)[0]).toEqual({
      durationMs: { sort: "asc", nulls: "last" },
    });
    expect(buildGameOrderBy(parse("?sortBy=duration&sortDir=desc")!)[0]).toEqual({
      durationMs: { sort: "desc", nulls: "last" },
    });
  });
});
