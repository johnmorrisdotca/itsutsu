import { describe, expect, it } from "vitest";
import {
  buildGameOrderBy,
  buildGameWhere,
  outcomeNeedsPlayer,
  toGameHistoryQuery,
} from "./gameHistoryQuery";
import { isRefusal } from "@/lib/api/paging";
import { GAME_PAGE_SIZE_DEFAULT, GAME_PAGE_SIZE_MAX } from "./gameHistory.constants";
import type { GameHistoryQuery } from "./gameHistory.types";

const read = (search: string) =>
  toGameHistoryQuery(new URL(`https://example.test/api/games${search}`));

/**
 * A query that parsed, or a failure naming what did not.
 *
 * The listing used to answer `null` for anything it could not read, and the
 * route turned that into a 400 naming nothing. Every case below that used to
 * assert `toBeNull()` now asserts which parameter was refused, which is what a
 * caller actually needs — and what the test was silently not checking.
 */
const parse = (search: string): GameHistoryQuery => {
  const query = read(search);
  if (isRefusal(query)) throw new Error(`refused: ${query.error}`);
  return query;
};

/** The refusal's message, for the cases that are meant to be refused. */
const refusedBy = (search: string): string => {
  const query = read(search);
  if (!isRefusal(query)) throw new Error(`"${search}" was accepted`);
  return query.error;
};

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
    expect(query.size).toBeNull();
    // Nobody asked for this order, which is what decides a heading's first press.
    expect(query.sortAsked).toBe(false);
    expect(query.cursor).toBeNull();
  });

  it("coerces numeric parameters from strings", () => {
    expect(parse("?page=3&limit=50")).toMatchObject({ page: 3, pageSize: 50 });
  });

  it("treats a blank search as no filter rather than an empty match", () => {
    expect(parse("?search=%20%20").search).toBeNull();
  });

  it("trims a search that has content", () => {
    expect(parse("?search=%20ren%20").search).toBe("ren");
  });

  /*
   * CLAMPED, NOT REFUSED, and the change is deliberate. `limit=5000` is a caller
   * asking for more rows than they may have, and two hundred of them is a
   * truthful answer: the envelope's `next` says there is more, so nothing has
   * been hidden. It used to be a 400, which told a caller their whole request
   * was wrong because one number was ambitious.
   */
  it("clamps a page size beyond the cap rather than refusing the request", () => {
    expect(parse("?limit=5000").pageSize).toBe(GAME_PAGE_SIZE_MAX);
    expect(parse("?limit=abc").pageSize).toBe(GAME_PAGE_SIZE_DEFAULT);
  });

  it("refuses an unknown sort column BY NAME, and says what it accepts", () => {
    const message = refusedBy("?sort=winner");
    expect(message).toContain("winner");
    expect(message).toContain("played");
    expect(message).toContain("moves");
  });

  it("reads both spellings of the direction, and the attached one wins", () => {
    expect(parse("?sort=moves&order=asc")).toMatchObject({ sortBy: "moveCount", sortDir: "asc" });
    expect(parse("?sort=moves:asc")).toMatchObject({ sortBy: "moveCount", sortDir: "asc" });
    expect(parse("?sort=moves:desc&order=asc").sortDir).toBe("desc");
    expect(parse("?sort=moves").sortAsked).toBe(true);
  });

  it("still reads a game's slug as its variant", () => {
    expect(parse("?variant=drop-four")).toMatchObject({ variant: "dropFour" });
  });

  it("carries a cursor through untouched — whether it decodes is the read's question", () => {
    expect(parse("?cursor=abc").cursor).toBe("abc");
  });

  it("refuses an unknown result filter BY NAME", () => {
    expect(refusedBy("?result=forfeit")).toContain("result");
  });

  it("names every filter that failed, once each", () => {
    const message = refusedBy("?result=forfeit&size=42");
    expect(message).toContain("result");
    expect(message).toContain("size");
  });

  it("reads a board size filter as a number", () => {
    expect(parse("?size=9").size).toBe(9);
  });

  it("parses a date range", () => {
    const query = parse("?from=2026-01-01&to=2026-02-01");
    expect(query.from).toBeInstanceOf(Date);
    expect(query.to?.toISOString()).toBe("2026-02-01T00:00:00.000Z");
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
   * A PLAYER IS A PERSON, NOT A SPELLING.
   *
   * These are the cases the whole exercise is about. A game stores the names as
   * they were played, so a filter matching only the name lost every game somebody
   * played before renaming. Measured on production: her record counts five games
   * and `/history?player=Hanachan` answered with none of them, because every one
   * of the five is stored under "Hanako Morris". A count whose link opens an empty
   * page is the same fault as a count with no link at all, wearing a link.
   */
  describe("a player named in the address", () => {
    const HER = "964k9atpbhzja6d9";

    it("finds the games of whoever holds the name, whatever the seat was called", () => {
      const where = buildGameWhere(parse("?player=Hanachan")!, { computers: [], named: [HER] });
      expect(where.AND).toContainEqual({
        OR: [
          {
            OR: [
              { blackName: { equals: "Hanachan", mode: "insensitive" } },
              { blackMemberId: { in: [HER] } },
            ],
          },
          {
            OR: [
              { whiteName: { equals: "Hanachan", mode: "insensitive" } },
              { whiteMemberId: { in: [HER] } },
            ],
          },
        ],
      });
    });

    /*
     * Most seats on this site have no account behind them, and their games must
     * stay findable. Told of no member, the filter is the name alone — which is
     * what it has always been, rather than a narrower question quietly asked.
     */
    it("falls back to the stored name when the name belongs to no member", () => {
      const where = buildGameWhere(parse("?player=Aki")!, { computers: [], named: [] });
      expect(where.AND).toContainEqual({
        OR: [
          { blackName: { equals: "Aki", mode: "insensitive" } },
          { whiteName: { equals: "Aki", mode: "insensitive" } },
        ],
      });
    });

    /*
     * A display name carries no unique constraint, so two people may hold one.
     * Both go in: picking one would answer "which of them did you mean" with
     * somebody else's games, and the name has always denoted both here.
     */
    it("takes every member who goes by the name, not the first", () => {
      const where = buildGameWhere(parse("?player=John Morris")!, {
        computers: [],
        named: ["one", "two"],
      });
      expect(where.AND).toContainEqual({
        OR: [
          {
            OR: [
              { blackName: { equals: "John Morris", mode: "insensitive" } },
              { blackMemberId: { in: ["one", "two"] } },
            ],
          },
          {
            OR: [
              { whiteName: { equals: "John Morris", mode: "insensitive" } },
              { whiteMemberId: { in: ["one", "two"] } },
            ],
          },
        ],
      });
    });

    /*
     * The outcome filter reads the same seats. It used to ask only the name, so
     * "her three wins" and "her games" disagreed about which games were hers.
     */
    it("reads an outcome from the same seats the player filter found", () => {
      const where = buildGameWhere(parse("?player=Hanachan&outcome=won")!, {
        computers: [],
        named: [HER],
      });
      expect(where.AND).toContainEqual({
        OR: [
          {
            AND: [
              {
                OR: [
                  { blackName: { equals: "Hanachan", mode: "insensitive" } },
                  { blackMemberId: { in: [HER] } },
                ],
              },
              { result: "black" },
            ],
          },
          {
            AND: [
              {
                OR: [
                  { whiteName: { equals: "Hanachan", mode: "insensitive" } },
                  { whiteMemberId: { in: [HER] } },
                ],
              },
              { result: "white" },
            ],
          },
        ],
      });
    });

    /*
     * A SEARCH IS ABOUT SPELLINGS and must not follow anybody. It is somebody
     * half-remembering who they played; resolving it would make a few typed
     * letters mean something else entirely.
     */
    it("leaves a search matching the names as they were filed", () => {
      const where = buildGameWhere(parse("?search=hana")!, { computers: [], named: [HER] });
      expect(where.AND).toContainEqual({
        OR: [
          { blackName: { contains: "hana", mode: "insensitive" } },
          { whiteName: { contains: "hana", mode: "insensitive" } },
        ],
      });
    });
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

    it("drops a loss the same way it drops a win", () => {
      expect(buildGameWhere(parse("?outcome=lost")!)).toEqual({ AND: [{ status: "finished" }] });
    });
  });

  /*
   * `outcomeNeedsPlayer` is the query's own opinion of which outcomes it can
   * judge without a name, and `HistoryFilters`' chip reads the same function
   * (`narrowings.ts`) so it never claims a narrowing this WHERE clause did
   * not apply. The two tests above already prove the query's behaviour;
   * this ties the predicate to it by name, so a future outcome that changes
   * one side without the other fails here rather than as a chip nobody
   * questioned because the record it sat over looked plausible.
   */
  describe("outcomeNeedsPlayer", () => {
    it("agrees with buildGameWhere about every outcome", () => {
      for (const outcome of ["won", "lost", "drawn", "decided"] as const) {
        const where = buildGameWhere(parse(`?outcome=${outcome}`)!);
        // More conditions than just { status: "finished" } means the outcome
        // clause survived — buildGameWhere always builds AND as an array.
        const applied = Array.isArray(where.AND) && where.AND.length !== 1;
        expect(outcomeNeedsPlayer(outcome), outcome).toBe(!applied);
      }
    });

    it("says an outcome it does not recognise needs a player too", () => {
      expect(outcomeNeedsPlayer("sideways")).toBe(true);
    });
  });

  describe("which ladder was counting", () => {
    it("finds the computer pool by who was sitting in the seats", () => {
      const where = buildGameWhere(parse("?pool=computer")!, { computers: ["bot-1", "bot-2"], named: [] });
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
      const where = buildGameWhere(parse("?pool=people")!, { computers: ["bot-1"], named: [] });
      expect(where.AND).toContainEqual({
        AND: [
          { OR: [{ blackMemberId: null }, { blackMemberId: { notIn: ["bot-1"] } }] },
          { OR: [{ whiteMemberId: null }, { whiteMemberId: { notIn: ["bot-1"] } }] },
        ],
      });
    });

    it("finds no computer games when there are no computer players", () => {
      expect(buildGameWhere(parse("?pool=computer")!, { computers: [], named: [] }).AND).toContainEqual({ id: { in: [] } });
    });

    it("leaves the people pool alone when there are no computer players", () => {
      expect(buildGameWhere(parse("?pool=people")!, { computers: [], named: [] })).toEqual({ AND: [{ status: "finished" }] });
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

  /*
   * The seat and the verdict are AND-combined rather than written as one object,
   * because "this seat is that player" may itself be an OR once the name has been
   * resolved to member ids — see `seatIs`. Same rows, a shape that composes.
   */
  describe("what a player said about their own play", () => {
    it("reads a verdict from whichever seat they were in", () => {
      const where = buildGameWhere(parse("?player=Aki&verdict=up")!);
      expect(where.AND).toContainEqual({
        OR: [
          { AND: [{ blackName: { equals: "Aki", mode: "insensitive" } }, { blackVerdict: "up" }] },
          { AND: [{ whiteName: { equals: "Aki", mode: "insensitive" } }, { whiteVerdict: "up" }] },
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
          { AND: [{ blackName: { equals: "Aki", mode: "insensitive" } }, { blackVerdict: { not: null } }] },
          { AND: [{ whiteName: { equals: "Aki", mode: "insensitive" } }, { whiteVerdict: { not: null } }] },
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
