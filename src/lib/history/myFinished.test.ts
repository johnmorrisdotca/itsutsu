import { beforeEach, describe, expect, it, vi } from "vitest";

import { GAME_STATUS, OPENING_RULES, STONES } from "@/lib/gomoku/gomoku.constants";

/**
 * THE QUEUE'S FINISHED GROUP, PAGED — AND THE THREE WAYS A PAGE LIES.
 *
 * `/play` and every `/api/games/mine` the badge asks for read EVERY game the
 * member had ever sat in. 0.169.3 bounded that by the member's retention window
 * and could not bound the DEFAULT, "keep finished games for ever", because there
 * is no date to bound it with — 571 rows on the site owner's own account, on the
 * page he opens daily, to show five of them.
 *
 * So the finished group pages. The cost half of that is easy to assert and is
 * asserted here; the interesting half is that A PAGED LIST FAILS QUIETLY. There
 * are three ways, and each has a case below:
 *
 *  - IT REPEATS A ROW. A cursor that does not break ties, or an order that does
 *    not match the one the cursor was built for.
 *  - IT SKIPS A ROW. The dangerous one, because a list that is missing a game
 *    looks exactly like a list that has reached its end. The null run of this
 *    read is where that lives: get it wrong in the obvious direction and every
 *    finished game with no `lastMoveAt` stops existing past the first page.
 *  - IT MISCOUNTS. The heading over the group says how many there are, and
 *    `?all=finished` promises to page to exactly that many.
 *
 * THE FAKE HONOURS `where`, `orderBy` AND `take`, in that order, because a page
 * is meaningless unless all three are applied and applied in the order Postgres
 * applies them. A fake that sorted after slicing would hand back an arbitrary
 * five rows and call them the newest five, and every case here would pass.
 */

type Row = Record<string, unknown>;

let rows: Row[] = [];

/**
 * A STORED VALUE AND A BOUND, AS TWO COMPARABLE THINGS OF ONE KIND — or null
 * when they are not comparable at all.
 *
 * WHAT IS HELD DECIDES, never what the `where` carries, and that is the whole
 * reason this is a function. A cursor's value arrives as an ISO STRING and not a
 * Date — `paging.cursor.ts` converts one so that encoding and decoding cannot
 * produce two types for one position — so a bound against a date column has to be
 * read as an instant whichever shape it came in. Deciding from the BOUND instead
 * means guessing whether a string is a date, and `Date.parse` will happily find
 * one in an id: the first version of this did exactly that and fell over trying
 * to order two game ids, because one of them parsed as a date and the other did
 * not.
 */
function pair(held: unknown, bound: unknown): [number, number] | [string, string] | null {
  if (held instanceof Date) {
    const when =
      bound instanceof Date
        ? bound.getTime()
        : typeof bound === "string"
          ? Date.parse(bound)
          : Number.NaN;
    return Number.isNaN(when) ? null : [held.getTime(), when];
  }
  if (typeof held === "string" && typeof bound === "string") return [held, bound];
  if (typeof held === "number" && typeof bound === "number") return [held, bound];
  return null;
}

/** -1, 0 or 1, for two values of one kind. */
function rank(left: number | string, right: number | string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * ONE COMPARISON, IN THE SHAPES THESE QUERIES ARE ALLOWED TO USE — and a throw
 * for anything else.
 *
 * It refuses an operator it does not know instead of answering "no match":
 * shrugging would quietly empty a list and pass, which is the false pass that is
 * most convincing exactly when somebody is proving a test works.
 */
function compares(held: unknown, test: unknown): boolean {
  if (test === null) return held === null;
  if (typeof test === "object" && !(test instanceof Date)) {
    const ops = test as Record<string, unknown>;
    if ("in" in ops) return (ops.in as unknown[]).includes(held);
    if ("not" in ops) return !compares(held, ops.not);
    for (const [op, keep] of [
      ["gte", (cmp: number) => cmp >= 0],
      ["gt", (cmp: number) => cmp > 0],
      ["lte", (cmp: number) => cmp <= 0],
      ["lt", (cmp: number) => cmp < 0],
    ] as const) {
      if (!(op in ops)) continue;
      const both = pair(held, ops[op]);
      /*
       * Null here is a row whose column is null, which no inequality matches —
       * Postgres says the same. A bound that cannot be read at all would have
       * been a `pair` of null as well, which is why the throw is above in
       * `order` and not here: this is asked of every row of every read, and a
       * null column is the ordinary case rather than a programming mistake.
       */
      return both !== null && keep(rank(both[0], both[1]));
    }
    throw new Error(`asked with an operator this fake cannot read: ${JSON.stringify(test)}`);
  }
  /*
   * A BARE VALUE IS AN EQUALITY, and against a date column it may be an ISO
   * string: `keysetWhere` writes its "same value, later row" branch as
   * `{ lastMoveAt: value }` with the cursor's string in it. Compared with `===`
   * that is false for every row there is — not a crash, but an empty page that
   * reads as "no more games". A three-row list paged to one row and stopped that
   * way, with the cursor, the order and the merge all correct.
   */
  const both = pair(held, test);
  return both === null ? held === test : rank(both[0], both[1]) === 0;
}

function matches(row: Row, where: Record<string, unknown>): boolean {
  for (const [key, test] of Object.entries(where)) {
    const clauses = test as Record<string, unknown>[];
    if (key === "OR") {
      if (!clauses.some((one) => matches(row, one))) return false;
    } else if (key === "AND") {
      if (!clauses.every((one) => matches(row, one))) return false;
    } else if (!compares(row[key], test)) return false;
  }
  return true;
}

/**
 * ONE COLUMN'S VALUE AGAINST ANOTHER ROW'S, for the order a read asks for.
 *
 * Nulls LAST, which matches `keysetOrderBy`. Two values of the same column, so
 * there is no coercion to do and nothing to guess: anything that is not a pair of
 * dates, strings or numbers is a read this fake cannot honour, and it says so
 * rather than picking an order.
 */
function order(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1;
  if (b === null || b === undefined) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "string" && typeof b === "string") return rank(a, b);
  if (typeof a === "number" && typeof b === "number") return a - b;
  throw new Error(`this fake cannot order ${JSON.stringify(a)} against ${JSON.stringify(b)}`);
}

/** Rows returned across every read, which is the cost the page exists to bound. */
let rowsRead = 0;
const gameFindMany = vi.fn(
  async (args: {
    where: Record<string, unknown>;
    orderBy?: Record<string, unknown>[];
    take?: number;
  }) => {
    const found = rows.filter((row) => matches(row, args.where));
    for (const clause of [...(args.orderBy ?? [])].reverse()) {
      const [field, direction] = Object.entries(clause)[0] as [string, string];
      const way = direction === "desc" ? -1 : 1;
      found.sort((a, b) => way * order(a[field], b[field]));
    }
    const page = args.take === undefined ? found : found.slice(0, args.take);
    rowsRead += page.length;
    return page;
  },
);
const gameCount = vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
  rows.filter((row) => matches(row, where)).length,
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: { findMany: (args: never) => gameFindMany(args), count: (args: never) => gameCount(args) },
    move: { findMany: async () => [] },
    member: { findMany: async () => [] },
  },
}));

const { fetchMyGames } = await import("./myGames");
const { staysInMyList } = await import("./retention");

const MEMBER = "member-1";
const NOW = new Date("2026-09-11T00:00:00Z");
const SEATS = new Map<string, string>();

/** A game row as the queue's projection brings one back. */
function game(over: Partial<Row> = {}): Row {
  return {
    id: "g1",
    playedAt: new Date("2026-09-01T00:00:00Z"),
    status: "finished",
    blackName: "Black",
    whiteName: "White",
    size: 15,
    winLength: 5,
    variant: "freestyle",
    obstacles: "none",
    opener: STONES.black,
    opening: OPENING_RULES.free,
    handicap: null,
    seed: 0,
    moveTimeMs: null,
    timeoutPenalty: "turn",
    lastMoveAt: new Date("2026-09-02T00:00:00Z"),
    blackForfeits: 0,
    whiteForfeits: 0,
    allowResign: true,
    drawLimit: "none",
    clockMode: "move",
    blackTimeMs: null,
    whiteTimeMs: null,
    deadlineAt: null,
    extraMs: 0,
    rated: true,
    openSeat: null,
    offeredToMemberId: null,
    offeredAt: null,
    declinedAt: null,
    withdrawnAt: null,
    result: "black",
    winner: STONES.black,
    moveCount: 9,
    durationMs: null,
    blackToken: "tok-black",
    whiteToken: "tok-white",
    blackMemberId: MEMBER,
    whiteMemberId: "member-2",
    settledStatus: null,
    settledToPlay: null,
    ...over,
  };
}

/**
 * A finished game whose last move landed `days` before the now under test.
 *
 * The ids carry the day so that a page's order can be read at a glance, and they
 * are deliberately NOT in the same alphabetical order as their dates: an id that
 * happened to sort the same way as the column would make a broken order look
 * right, which is the quietest way for a paging test to say nothing.
 */
function filed(days: number): Row {
  const when = new Date(NOW.getTime() - days * 86_400_000);
  return game({ id: `d${String(1000 - days)}`, playedAt: when, lastMoveAt: when });
}

/** Every page of the finished group, walked from the top by cursor. */
async function walk(
  limit: number,
  keepFinishedDays = 0,
): Promise<{ pages: string[][]; totals: number[] }> {
  const pages: string[][] = [];
  const totals: number[] = [];
  let cursor: string | null = null;
  // Bounded, so a cursor that never advanced fails as a test rather than hanging.
  for (let turn = 0; turn < 40; turn += 1) {
    const queue = await fetchMyGames(SEATS, MEMBER, NOW, keepFinishedDays, { limit, cursor });
    pages.push(queue.groups.finished.map((one) => one.game.id));
    totals.push(queue.finished.total);
    if (queue.finished.next === null) return { pages, totals };
    cursor = queue.finished.next;
  }
  throw new Error("the finished group never reached its last page");
}

beforeEach(() => {
  rows = [];
  rowsRead = 0;
  gameFindMany.mockClear();
  gameCount.mockClear();
});

describe("the debt groups stay complete however much has been played", () => {
  /*
   * THE HALF THAT MUST NOT PAGE, and the reason the split is the way round it
   * is. `shownGroup` prints the bucket's true size and `useAdvanceToNextGame`
   * walks `yourMove` for the oldest, so a cap on this half would drop a game
   * somebody is waiting on and report a smaller number with nothing saying so.
   */
  it("reads every game waiting on this reader, beside a page of two hundred finished ones", async () => {
    rows = [
      game({
        id: "waiting",
        status: "active",
        settledStatus: GAME_STATUS.playing,
        settledToPlay: STONES.black,
        moveCount: 3,
      }),
      ...Array.from({ length: 200 }, (_unused, index) => filed(10 + index)),
    ];

    const queue = await fetchMyGames(SEATS, MEMBER, NOW, 0, { limit: 5 });
    expect(queue.groups.yourMove.map((one) => one.game.id)).toEqual(["waiting"]);
    expect(queue.groups.finished).toHaveLength(5);
    // One active row, plus one page of five read six deep. Not 201.
    expect(rowsRead).toBe(7);
  });

  it("reads every offer in every state, however old, with no page to fall off", async () => {
    const long = new Date(NOW.getTime() - 400 * 86_400_000);
    rows = [
      game({
        id: "asked",
        status: "active",
        blackMemberId: "member-2",
        whiteMemberId: null,
        offeredToMemberId: MEMBER,
        offeredAt: long,
        moveCount: 0,
        playedAt: long,
        lastMoveAt: long,
      }),
      /*
       * A REFUSED OFFER IS FILED `status: finished` and is NOT a finished game.
       * It belongs to the offerer's own group, complete — a decline is the one
       * thing on this page somebody has to be told — so it must arrive on the
       * complete read and never on the page, whatever else is in front of it.
       */
      game({
        id: "refused",
        blackMemberId: MEMBER,
        whiteMemberId: null,
        offeredToMemberId: "member-2",
        offeredAt: long,
        declinedAt: long,
        result: "abandoned",
        winner: null,
        moveCount: 0,
        playedAt: long,
        lastMoveAt: long,
      }),
      ...Array.from({ length: 30 }, (_unused, index) => filed(1 + index)),
    ];

    const queue = await fetchMyGames(SEATS, MEMBER, NOW, 0, { limit: 5 });
    expect(queue.groups.offered.map((one) => one.game.id)).toEqual(["asked"]);
    expect(queue.groups.offerSent.map((one) => one.game.id)).toEqual(["refused"]);
    expect(queue.groups.finished).toHaveLength(5);
    // And the refused offer is not counted among the finished games either.
    expect(queue.finished.total).toBe(30);
  });
});

describe("one page of the finished group, and the page after it", () => {
  it("hands back the newest page and a cursor for the rest", async () => {
    rows = Array.from({ length: 12 }, (_unused, index) => filed(1 + index));

    const queue = await fetchMyGames(SEATS, MEMBER, NOW, 0, { limit: 5 });
    expect(queue.groups.finished.map((one) => one.game.id)).toEqual([
      "d999",
      "d998",
      "d997",
      "d996",
      "d995",
    ]);
    expect(queue.finished.next).not.toBeNull();
    expect(queue.finished.total).toBe(12);
  });

  /*
   * NO REPEATS AND NO GAPS, asserted over the whole list rather than page by
   * page — because a repeat and a gap are the two halves of one fault and a
   * per-page check can miss either. Comparing the concatenation against the list
   * the read WOULD have returned whole is the only assertion that cannot be
   * satisfied by a plausible-looking wrong answer.
   */
  it("walks every finished game exactly once, in the order the group is drawn", async () => {
    rows = Array.from({ length: 13 }, (_unused, index) => filed(1 + index));
    const every = rows.map((row) => row.id as string);

    const { pages } = await walk(5);
    expect(pages.map((page) => page.length)).toEqual([5, 5, 3]);
    expect(pages.flat()).toEqual(every);
    expect(new Set(pages.flat()).size).toBe(13);
  });

  it("says a page is the last one by handing back no cursor, not by handing back nothing", async () => {
    rows = Array.from({ length: 10 }, (_unused, index) => filed(1 + index));
    const { pages } = await walk(5);
    // Exactly two full pages: the second must be the last, not a third that is empty.
    expect(pages).toHaveLength(2);
  });

  /*
   * A page size of ONE is the case that finds an off-by-one in the extra row
   * `takeFor` reads, and it is cheap. Five pages of one for five games, the
   * fifth of them final.
   */
  it("pages one row at a time without losing the last one", async () => {
    rows = Array.from({ length: 5 }, (_unused, index) => filed(1 + index));
    const { pages } = await walk(1);
    expect(pages).toEqual([["d999"], ["d998"], ["d997"], ["d996"], ["d995"]]);
  });

  /*
   * TWO GAMES FINISHED IN THE SAME MILLISECOND are the ordinary case here, not a
   * coincidence: a bot batch files dozens a second. Without the id tiebreaker the
   * database is free to return them either way round between two queries, so a
   * cursor naming only the date cannot say which of them it meant — and the page
   * after it repeats one and skips the other.
   */
  it("breaks a tie by the id, so a page boundary cannot fall inside one", async () => {
    const when = new Date(NOW.getTime() - 5 * 86_400_000);
    rows = [
      game({ id: "tie-c", playedAt: when, lastMoveAt: when }),
      game({ id: "tie-a", playedAt: when, lastMoveAt: when }),
      game({ id: "tie-b", playedAt: when, lastMoveAt: when }),
    ];

    const { pages } = await walk(1);
    expect(pages.flat()).toEqual(["tie-a", "tie-b", "tie-c"]);
  });
});

/**
 * ───────────────────────────────────────────────────────────────────────────
 * THE ROWS WITH NO LAST MOVE, WHICH ARE WHERE A SKIP WOULD LIVE
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The order is `lastMoveAt ?? playedAt` and Prisma cannot order by a `COALESCE`,
 * so the read is two runs: the rows with a last move ordered by it, the rows
 * without one ordered by `playedAt`, merged. 129 of 3,617 finished rows on the
 * development database have no `lastMoveAt`.
 *
 * THE WRONG ANSWER THAT LOOKS RIGHT is to order by `lastMoveAt` with nulls last.
 * Every case above would pass, and every finished game with no last move would be
 * sorted to the end of the list instead of into its proper place — which on this
 * database is the MIDDLE of the range, not the end. So these cases put a null row
 * between two dated ones and insist it comes out between them.
 */
describe("a finished game with no last move is sorted by when it was played", () => {
  const dated = (id: string, days: number) => {
    const when = new Date(NOW.getTime() - days * 86_400_000);
    return game({ id, playedAt: when, lastMoveAt: when });
  };
  const undated = (id: string, days: number) =>
    game({ id, playedAt: new Date(NOW.getTime() - days * 86_400_000), lastMoveAt: null });

  it("puts it between the games either side of it, not last", async () => {
    rows = [dated("newest", 1), undated("middle", 5), dated("oldest", 9)];
    const queue = await fetchMyGames(SEATS, MEMBER, NOW, 0, { limit: 5 });
    expect(queue.groups.finished.map((one) => one.game.id)).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
  });

  /*
   * AND ACROSS A PAGE BOUNDARY, which is the half that a single-page case cannot
   * see: one cursor serves both runs, so a position taken in the dated run has to
   * be understood by the undated one and the other way round. Get that wrong and
   * the undated rows are either repeated on every page or never reached at all.
   */
  it("is reached exactly once when the page boundary falls either side of it", async () => {
    rows = [
      dated("a", 1),
      undated("b", 3),
      dated("c", 5),
      undated("d", 7),
      dated("e", 9),
    ];
    for (const limit of [1, 2, 3, 4]) {
      rowsRead = 0;
      const { pages } = await walk(limit);
      expect(pages.flat()).toEqual(["a", "b", "c", "d", "e"]);
    }
  });

  it("counts the games with no last move in the total, like any other", async () => {
    rows = [dated("a", 1), undated("b", 3), undated("c", 5), dated("d", 7)];
    const queue = await fetchMyGames(SEATS, MEMBER, NOW, 0, { limit: 2 });
    expect(queue.finished.total).toBe(4);
  });
});

describe("the count over the group the page came from", () => {
  /*
   * A COUNT IS A SECOND QUERY, so it is asked only where the page cannot answer
   * on its own. Most members have fewer finished games than a page holds, and
   * they must pay nothing for a number their own page already knows exactly.
   */
  it("asks for no count at all when the page is the whole group", async () => {
    rows = Array.from({ length: 3 }, (_unused, index) => filed(1 + index));
    const queue = await fetchMyGames(SEATS, MEMBER, NOW, 0, { limit: 5 });
    expect(queue.finished.total).toBe(3);
    expect(gameCount).not.toHaveBeenCalled();
  });

  it("asks for exactly one count when there is a page after this one", async () => {
    rows = Array.from({ length: 9 }, (_unused, index) => filed(1 + index));
    const queue = await fetchMyGames(SEATS, MEMBER, NOW, 0, { limit: 5 });
    expect(queue.finished.total).toBe(9);
    expect(gameCount).toHaveBeenCalledTimes(1);
  });

  /*
   * THE ROW THE TWO HALVES DISAGREE ABOUT. A Reversi board that filled up is over
   * with nothing written down — its row still says `active` — so it arrives on the
   * COMPLETE read, because no `where` can ask whether a position is over, and the
   * JavaScript is what files it under "finished". It is shown with the first page
   * and it has to be added to the count, or the heading would say nine over a group
   * holding ten.
   */
  it("counts an engine-over game on top of the ones the count could see", async () => {
    const when = new Date(NOW.getTime() - 2 * 86_400_000);
    rows = [
      game({
        id: "filled-up",
        status: "active",
        settledStatus: GAME_STATUS.won,
        settledToPlay: null,
        moveCount: 60,
        playedAt: when,
        lastMoveAt: when,
      }),
      ...Array.from({ length: 9 }, (_unused, index) => filed(5 + index)),
    ];

    const queue = await fetchMyGames(SEATS, MEMBER, NOW, 0, { limit: 5 });
    expect(queue.groups.finished.map((one) => one.game.id)).toContain("filled-up");
    expect(queue.finished.total).toBe(10);
  });
});

/**
 * ───────────────────────────────────────────────────────────────────────────
 * THE PAGE AND THE RETENTION CHECK MUST AGREE, ON EVERY PAGE
 * ───────────────────────────────────────────────────────────────────────────
 *
 * `myListWindow` is a `where` and `staysInMyList` is a JavaScript check, and the
 * `where` is deliberately the LOOSER of the two: it cannot ask whether a position
 * is over, so it lets every active row through and the check drops them.
 *
 * On a FINISHED row neither of those looser branches can match, so the two agree
 * EXACTLY — and that equality is load-bearing twice over. It is what lets a
 * `count` over the `where` be the group's true size; and it is what stops a page
 * from being short, because a row the `where` returned and the check then dropped
 * would shorten the page while the cursor pointed past it.
 */
describe("the window in the query and the check after it agree on every page", () => {
  it("keeps exactly the games the check would keep, page by page", async () => {
    rows = Array.from({ length: 24 }, (_unused, index) => filed(1 + index * 2));
    const inside = rows.filter((row) =>
      staysInMyList((row.lastMoveAt as Date).toISOString(), 14, NOW),
    );
    expect(inside.length).toBeGreaterThan(0);
    expect(inside.length).toBeLessThan(rows.length);

    const { pages, totals } = await walk(3, 14);
    expect(pages.flat()).toEqual(inside.map((row) => row.id));
    // Every page reported the same true size, and it is the window's own size.
    for (const total of totals) expect(total).toBe(inside.length);
  });

  it("does not shorten a page by dropping a row the query should never have returned", async () => {
    rows = Array.from({ length: 9 }, (_unused, index) => filed(1 + index));
    const { pages } = await walk(4, 90);
    /*
     * Full pages until the last. A row read and then thrown away would show up
     * here as a page of three between two of four — which is exactly how a
     * retention rule that had drifted from its `where` would present itself.
     */
    expect(pages.map((page) => page.length)).toEqual([4, 4, 1]);
  });
});
