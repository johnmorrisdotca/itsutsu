import { beforeEach, describe, expect, it, vi } from "vitest";

import { GAME_STATUS, MOVE_KINDS, OPENING_RULES, STONES } from "@/lib/gomoku/gomoku.constants";

/**
 * What a list of games costs to draw, and what it gets right.
 *
 * The fault this is about was measured on production: the list read every move
 * of every game somebody held a seat in — 312 rows for eight games, out of 726
 * on the whole site — and replayed each one to answer two questions, whose turn
 * it is and whether the game is still running. The busiest development database
 * to hand made it 2,508 move rows for sixteen games.
 *
 * So the first thing here is a cost assertion, which is a thing a comment
 * cannot be: for rows that carry a settled turn, NO move row is read at all.
 * The rest is the half that matters more — that the cheap answer is the same
 * answer, including where a move count would get it wrong, and that a row with
 * nothing stored still gets the right answer the slow way.
 */

type Row = Record<string, unknown>;

let rows: Row[] = [];
let moves: Row[] = [];

/**
 * THE FAKE BELOW HONOURS THE `where`, THE `orderBy` AND THE `take` it is handed
 * rather than handing back every row.
 *
 * What the list shows is decided in three places now and only one of them is
 * this file's JavaScript: the member's window went into the query (see
 * `myListWindow`), and the finished group is a PAGE of a sorted read (see
 * `myFinished.ts`). A fake that ignored any of the three would report green on a
 * query that read the whole table — or, worse, on one that dropped a game
 * somebody is waiting to move in.
 */
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

/**
 * HOW MANY ROWS THE QUEUE BROUGHT BACK IN TOTAL, which is the cost.
 *
 * Accumulated across every read rather than overwritten by the last one, because
 * the queue is TWO reads now — the debt complete, the finished group one page,
 * the second of those in two runs — and a measure that reported only the last
 * would go green on a change that read the whole history in the first. Reset in
 * `beforeEach`, so a case that asserts on it makes one call.
 */
let rowsRead = 0;
/**
 * The fake honours `where`, `orderBy` AND `take`, in that order — which is the
 * order Postgres applies them, and the only order in which a page means
 * anything. Sorting after slicing would hand back an arbitrary five rows and
 * call them the newest five; slicing without sorting would make every cursor
 * point at whichever row happened to be last in the array.
 */
const gameFindMany = vi.fn(
  async (args: {
    where: Record<string, unknown>;
    orderBy?: Record<string, unknown>[];
    take?: number;
  }) => {
    const found = rows.filter((row) => matches(row, args.where));
    for (const clause of [...(args.orderBy ?? [])].reverse()) {
      const [field, direction] = Object.entries(clause)[0] as [string, string];
      if (typeof direction !== "string") {
        throw new Error(`this fake cannot order by ${JSON.stringify(clause)}`);
      }
      const way = direction === "desc" ? -1 : 1;
      found.sort((a, b) => way * order(a[field], b[field]));
    }
    const page = args.take === undefined ? found : found.slice(0, args.take);
    rowsRead += page.length;
    return page;
  },
);
/** The finished group's true size, over the same `where` its page is read with. */
const gameCount = vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
  rows.filter((row) => matches(row, where)).length,
);
const moveFindMany = vi.fn(async ({ where }: { where: { gameId: { in: string[] } } }) =>
  moves.filter((move) => where.gameId.in.includes(move.gameId as string)),
);
/**
 * The members a seat might be bound to, so a name can be resolved to whatever
 * that member is called NOW. Counted, because the cost assertions above are the
 * point of this file: resolving names must be ONE read for a whole list, not one
 * per game.
 */
let members: { id: string; name: string }[] = [];
const memberFindMany = vi.fn(async ({ where }: { where: { id: { in: string[] } } }) =>
  members.filter((one) => where.id.in.includes(one.id)),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: { findMany: (args: never) => gameFindMany(args), count: (args: never) => gameCount(args) },
    move: { findMany: (args: never) => moveFindMany(args) },
    member: { findMany: (args: never) => memberFindMany(args) },
  },
}));

const { fetchMyGames, pagedGroup, shownGroup } = await import("./myGames");

/**
 * THE SEVEN GROUPS, which is what nearly every case below is about.
 *
 * `fetchMyGames` answers a `MyQueue` — the groups, plus how big the finished
 * group really is and where its page ended — because `groups.finished` is one
 * page now and a caller holding only the groups would read its length as the
 * total. The cases about the finished group's PAGING use `fetchMyGames` itself;
 * everything else wants the groups and says so through this.
 */
const queueOf = async (
  ...args: Parameters<typeof fetchMyGames>
): Promise<Awaited<ReturnType<typeof fetchMyGames>>["groups"]> =>
  (await fetchMyGames(...args)).groups;

const MEMBER = "member-1";

/** A game row as `SUMMARY_SELECT` plus the seat columns would bring it back. */
function game(over: Partial<Row> = {}): Row {
  return {
    id: "g1",
    playedAt: new Date("2026-09-01T00:00:00Z"),
    status: "active",
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
    // Nobody was asked to play this one: an ordinary game with both seats bound.
    offeredToMemberId: null,
    offeredAt: null,
    declinedAt: null,
    withdrawnAt: null,
    result: "abandoned",
    winner: null,
    moveCount: 1,
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

/** Stones on a game, in order, alternating from black. */
function stones(gameId: string, count: number): Row[] {
  return Array.from({ length: count }, (_unused, index) => ({
    gameId,
    number: index + 1,
    row: index,
    col: 0,
    stone: index % 2 === 0 ? STONES.black : STONES.white,
    kind: MOVE_KINDS.place,
    fromRow: null,
    fromCol: null,
    twistQuadrant: null,
    twistClockwise: null,
    cells: null,
    createdAt: new Date("2026-09-02T00:00:00Z"),
  }));
}

/** The one game in the list, wherever it was sorted to. */
async function only() {
  const groups = await queueOf(new Map(), MEMBER);
  const all = Object.values(groups).flat();
  expect(all).toHaveLength(1);
  return all[0];
}

beforeEach(() => {
  rows = [];
  moves = [];
  members = [];
  rowsRead = 0;
  gameFindMany.mockClear();
  gameCount.mockClear();
  moveFindMany.mockClear();
  memberFindMany.mockClear();
});

describe("what it costs to draw", () => {
  it("reads no move row at all when every game carries a settled turn", async () => {
    rows = Array.from({ length: 20 }, (_unused, index) =>
      game({
        id: `g${index}`,
        moveCount: 40,
        settledStatus: GAME_STATUS.playing,
        settledToPlay: index % 2 === 0 ? STONES.black : STONES.white,
      }),
    );
    moves = rows.flatMap((row) => stones(row.id as string, 40));

    const groups = await queueOf(new Map(), MEMBER);
    expect(groups.yourMove).toHaveLength(10);
    expect(groups.theirMove).toHaveLength(10);
    // 800 move rows are there to be read, and none of them is.
    expect(moveFindMany).not.toHaveBeenCalled();
    /*
     * THREE READS, AND WHY THAT IS THE RIGHT NUMBER. The debt groups are one
     * complete read; the finished group is a page, which is two runs because its
     * order is `lastMoveAt ?? playedAt` and Prisma cannot order by a `COALESCE`.
     * See `myFinished.ts`. All three go out at once, so this is one round trip's
     * latency and not three — and the number is asserted rather than left to
     * grow, because a per-row query appearing in here is exactly the fault the
     * rest of this file is about.
     */
    expect(gameFindMany).toHaveBeenCalledTimes(3);
  });

  /*
   * Showing a renamed member under the name they go by now costs ONE read for the
   * whole list. A resolution asked per row would be the right answer at twenty
   * times the price, on the list a signed-in reader loads most often.
   */
  it("resolves every seat's current name in one read, not one per game", async () => {
    rows = Array.from({ length: 20 }, (_unused, index) =>
      game({
        id: `g${index}`,
        moveCount: 40,
        settledStatus: GAME_STATUS.playing,
        settledToPlay: STONES.black,
        blackMemberId: MEMBER,
      }),
    );
    members = [{ id: MEMBER, name: "Hanachan" }];

    const groups = await queueOf(new Map(), MEMBER);
    expect(groups.yourMove).toHaveLength(20);
    expect(memberFindMany).toHaveBeenCalledTimes(1);
    // And it is the current name that comes out, on every one of them.
    expect(groups.yourMove.map((mine) => mine.game.blackName)).toEqual(
      Array.from({ length: 20 }, () => "Hanachan"),
    );
  });

  it("never asks for the moves of a game that is already filed", async () => {
    /*
     * A finished row needs no position: `running` has always been `status ===
     * "active" && …`, so the stones could not change the answer. This is where
     * the saving mostly comes from — a long-standing list is mostly history —
     * and it needs no stored column to get it.
     */
    rows = [game({ status: "finished", result: "black", winner: STONES.black, moveCount: 60 })];
    moves = stones("g1", 60);
    const mine = await only();
    expect(mine.group).toBe("finished");
    expect(mine.toPlay).toBeNull();
    expect(moveFindMany).not.toHaveBeenCalled();
  });

  it("asks for the moves of only the games that cannot answer for themselves", async () => {
    rows = [
      game({ id: "settled", settledStatus: GAME_STATUS.playing, settledToPlay: STONES.black, moveCount: 40 }),
      game({ id: "filed", status: "finished", result: "draw", moveCount: 40 }),
      game({ id: "silent", moveCount: 2 }),
    ];
    moves = [...stones("settled", 40), ...stones("filed", 40), ...stones("silent", 2)];

    await queueOf(new Map(), MEMBER);
    expect(moveFindMany).toHaveBeenCalledTimes(1);
    expect(moveFindMany.mock.calls[0][0]).toMatchObject({ where: { gameId: { in: ["silent"] } } });
  });
});

describe("the answer a settled turn gives", () => {
  it("puts a game in your queue when the stored colour is your seat", async () => {
    rows = [game({ settledStatus: GAME_STATUS.playing, settledToPlay: STONES.black })];
    const mine = await only();
    expect(mine.group).toBe("yourMove");
    expect(mine.toPlay).toBe(STONES.black);
  });

  it("puts it in theirs when it is not", async () => {
    rows = [game({ settledStatus: GAME_STATUS.playing, settledToPlay: STONES.white })];
    expect((await only()).group).toBe("theirMove");
  });

  it("files a game the engine ended even though the row still says active", async () => {
    /*
     * The disagreement the pair exists to carry. A Reversi board that filled up
     * is over with nobody having written the row down — see `settleEnded` — and
     * the old reader found that out by replaying. Now the row says so.
     */
    rows = [game({ settledStatus: GAME_STATUS.won, settledToPlay: null, moveCount: 60 })];
    const mine = await only();
    expect(mine.group).toBe("finished");
    expect(mine.toPlay).toBeNull();
    expect(mine.stale).toBe(false);
    expect(moveFindMany).not.toHaveBeenCalled();
  });

  it("believes the stored colour where a move count would say the other one", async () => {
    /*
     * Two stones on the board, so anything alternating from the opener would
     * make it black's move. The stored answer says white — which is what a
     * Connect6 turn, an owed quarter turn or a swap opening all look like from
     * outside — and the list follows the stored answer.
     */
    rows = [
      game({
        moveCount: 2,
        settledStatus: GAME_STATUS.playing,
        settledToPlay: STONES.white,
      }),
    ];
    moves = stones("g1", 2);
    const mine = await only();
    expect(mine.toPlay).toBe(STONES.white);
    expect(mine.group).toBe("theirMove");
    expect(moveFindMany).not.toHaveBeenCalled();
  });
});

describe("a row with nothing stored", () => {
  it("falls back to the replay and gets the same answer", async () => {
    // Two stones down, nothing stored: black to move, which is your seat.
    rows = [game({ moveCount: 2 })];
    moves = stones("g1", 2);
    const mine = await only();
    expect(mine.group).toBe("yourMove");
    expect(mine.toPlay).toBe(STONES.black);
    expect(moveFindMany).toHaveBeenCalledTimes(1);
  });

  it("replays a game whose stored status is not one this engine knows", async () => {
    rows = [game({ moveCount: 2, settledStatus: "asleep", settledToPlay: STONES.white })];
    moves = stones("g1", 2);
    const mine = await only();
    // The replay's answer, not the row's.
    expect(mine.toPlay).toBe(STONES.black);
    expect(moveFindMany).toHaveBeenCalledTimes(1);
  });

  it("replays a game stored as running with nobody to move", async () => {
    rows = [game({ moveCount: 2, settledStatus: GAME_STATUS.playing, settledToPlay: null })];
    moves = stones("g1", 2);
    expect((await only()).toPlay).toBe(STONES.black);
    expect(moveFindMany).toHaveBeenCalledTimes(1);
  });

  it("finds the game over when the stones say so, with nothing stored", async () => {
    /*
     * Five black stones in a column with white answering in another: black has
     * won, the row still says active, and only a replay can find it. The group
     * has to be `finished` — which is what it was before these columns, and has
     * to go on being true for every row already in the database.
     */
    rows = [game({ moveCount: 9 })];
    moves = [
      { gameId: "g1", number: 1, row: 0, col: 0, stone: STONES.black },
      { gameId: "g1", number: 2, row: 0, col: 9, stone: STONES.white },
      { gameId: "g1", number: 3, row: 1, col: 0, stone: STONES.black },
      { gameId: "g1", number: 4, row: 1, col: 9, stone: STONES.white },
      { gameId: "g1", number: 5, row: 2, col: 0, stone: STONES.black },
      { gameId: "g1", number: 6, row: 2, col: 9, stone: STONES.white },
      { gameId: "g1", number: 7, row: 3, col: 0, stone: STONES.black },
      { gameId: "g1", number: 8, row: 3, col: 9, stone: STONES.white },
      { gameId: "g1", number: 9, row: 4, col: 0, stone: STONES.black },
    ].map((move) => ({
      ...move,
      kind: MOVE_KINDS.place,
      fromRow: null,
      fromCol: null,
      twistQuadrant: null,
      twistClockwise: null,
      cells: null,
      createdAt: new Date("2026-09-02T00:00:00Z"),
    }));
    const mine = await only();
    expect(mine.group).toBe("finished");
    expect(mine.toPlay).toBeNull();
  });

  it("keeps the moves of one game out of another's replay", async () => {
    /*
     * One query brings back the moves of every game that needs replaying, so
     * splitting them by game is this file's job and getting it wrong would
     * quietly play somebody else's stones onto your board.
     */
    rows = [game({ id: "a", moveCount: 2 }), game({ id: "b", moveCount: 1 })];
    moves = [...stones("a", 2), ...stones("b", 1)];
    const groups = await queueOf(new Map(), MEMBER);
    const byId = new Map(Object.values(groups).flat().map((one) => [one.game.id, one]));
    // Two stones down: black to move. One stone down: white to move.
    expect(byId.get("a")?.toPlay).toBe(STONES.black);
    expect(byId.get("b")?.toPlay).toBe(STONES.white);
  });
});

describe("what the list still does regardless", () => {
  it("leaves out a game no seat of yours is in", async () => {
    rows = [game({ blackMemberId: "somebody", whiteMemberId: "else" })];
    const groups = await queueOf(new Map(), MEMBER);
    expect(Object.values(groups).flat()).toHaveLength(0);
  });

  it("calls a game at one screen a hot seat, whoever is to move", async () => {
    rows = [
      game({
        blackToken: "one",
        whiteToken: "one",
        settledStatus: GAME_STATUS.playing,
        settledToPlay: STONES.white,
      }),
    ];
    expect((await only()).group).toBe("hotSeat");
  });

  it("calls a game with no stones unstarted, whatever is stored", async () => {
    rows = [
      game({ moveCount: 0, settledStatus: GAME_STATUS.playing, settledToPlay: STONES.black }),
    ];
    expect((await only()).group).toBe("unstarted");
  });

  it("flags a running game nobody has touched for a fortnight", async () => {
    rows = [
      game({
        lastMoveAt: new Date("2026-08-01T00:00:00Z"),
        settledStatus: GAME_STATUS.playing,
        settledToPlay: STONES.black,
      }),
    ];
    const groups = await queueOf(new Map(), MEMBER, new Date("2026-09-11T00:00:00Z"));
    expect(groups.yourMove[0].stale).toBe(true);
  });
});

describe("shownGroup keeps the bucket's true size, not just what it shows", () => {
  it("reports nothing hidden when the cap covers the whole bucket", () => {
    const result = shownGroup([1, 2, 3], 5);
    expect(result).toEqual({ items: [1, 2, 3], total: 3, hidden: 0 });
  });

  it("says how many the cap left out, without losing the true total", () => {
    /*
     * The reported bug, reproduced directly: "Lately finished 5" printed over
     * a bucket of fourteen because the header counted the slice (5), not the
     * bucket it was sliced from (14).
     */
    const fourteen = Array.from({ length: 14 }, (_, index) => index);

    const result = shownGroup(fourteen, 5);

    expect(result.total).toBe(14);
    expect(result.items).toHaveLength(5);
    expect(result.hidden).toBe(9);
  });

  it("takes the slice from the front, so the cap keeps the same games it always did", () => {
    const result = shownGroup(["a", "b", "c"], 2);
    expect(result.items).toEqual(["a", "b"]);
  });
});

/**
 * AN OFFER IS ANSWERED, NOT PLAYED — which the queue has to say by putting it
 * somewhere a move is never taken from.
 *
 * `useAdvanceToNextGame` reads `groups.yourMove` and walks it, so an offer
 * reaching that bucket would carry somebody onto a board they had never agreed
 * to play. A fork offer is what makes that a real risk rather than a tidiness:
 * it copies moves across, so the position has a colour to move and it may well
 * be the offeree's.
 */
describe("where an offer goes in the queue", () => {
  /** A game MEMBER has been offered: their seat is loose, the offer names them. */
  function offeredToMe(over: Partial<Row> = {}): Row {
    return game({
      blackMemberId: "member-2",
      whiteMemberId: null,
      offeredToMemberId: MEMBER,
      offeredAt: new Date("2026-09-02T00:00:00Z"),
      moveCount: 0,
      ...over,
    });
  }

  /** One MEMBER has made: their seat is bound, somebody else's is offered. */
  function offeredByMe(over: Partial<Row> = {}): Row {
    return game({
      blackMemberId: MEMBER,
      whiteMemberId: null,
      offeredToMemberId: "member-2",
      offeredAt: new Date("2026-09-02T00:00:00Z"),
      moveCount: 0,
      ...over,
    });
  }

  it("puts an offer to you in its own group, and names the colour you would take", async () => {
    rows = [offeredToMe()];
    const groups = await queueOf(new Map(), MEMBER);
    expect(groups.offered).toHaveLength(1);
    expect(groups.yourMove).toEqual([]);
    expect(groups.unstarted).toEqual([]);
    expect(groups.offered[0].offer).toBe("offered");
    expect(groups.offered[0].offerSide).toBe("to-me");
    // Their seat is the loose one: black is taken, so they would be white.
    expect(groups.offered[0].seat).toBe(STONES.white);
  });

  it("puts an offer you made in its own group too, never in the unstarted boards", async () => {
    rows = [offeredByMe()];
    const groups = await queueOf(new Map(), MEMBER);
    expect(groups.offerSent).toHaveLength(1);
    expect(groups.offerSent[0].offerSide).toBe("from-me");
    expect(groups.unstarted).toEqual([]);
    expect(groups.yourMove).toEqual([]);
  });

  /*
   * THE FORK CASE, and the reason the offer test comes before the turn ladder
   * rather than after it. Eight moves in, with the offeree to move: every
   * other rule in `fetchMyGames` would have called this "your move".
   */
  it("keeps a forked offer out of your move even when the position is waiting on you", async () => {
    rows = [
      offeredToMe({
        moveCount: 8,
        settledStatus: GAME_STATUS.playing,
        settledToPlay: STONES.white,
      }),
    ];
    const groups = await queueOf(new Map(), MEMBER);
    expect(groups.yourMove).toEqual([]);
    expect(groups.offered).toHaveLength(1);
    // And nobody is to move in it, so nothing downstream can read a turn off it.
    expect(groups.offered[0].toPlay).toBeNull();
  });

  /*
   * SAYING NO MAKES IT DISAPPEAR, which is what "costs nothing" looks like
   * from the offeree's side: no row, no result, nothing in their list to tidy.
   */
  it("shows the offeree nothing at all once they have declined", async () => {
    rows = [
      offeredToMe({
        status: "finished",
        declinedAt: new Date("2026-09-03T00:00:00Z"),
        lastMoveAt: new Date("2026-09-03T00:00:00Z"),
      }),
    ];
    const groups = await queueOf(new Map(), MEMBER);
    expect(Object.values(groups).flat()).toEqual([]);
  });

  /*
   * AND THE OFFERER IS TOLD. It stays with their offers, saying it was
   * declined — not in "Lately finished", whose hint reads "Filed in the
   * record", because it is in no record at all.
   */
  it("tells the offerer it was declined, in their offers rather than their finished games", async () => {
    rows = [
      offeredByMe({
        status: "finished",
        declinedAt: new Date("2026-09-03T00:00:00Z"),
        lastMoveAt: new Date("2026-09-03T00:00:00Z"),
      }),
    ];
    const groups = await queueOf(new Map(), MEMBER, new Date("2026-09-04T00:00:00Z"));
    expect(groups.finished).toEqual([]);
    expect(groups.offerSent).toHaveLength(1);
    expect(groups.offerSent[0].offer).toBe("declined");
  });

  it("tells a withdrawal from a decline, which are two different things to say", async () => {
    rows = [
      offeredByMe({
        status: "finished",
        withdrawnAt: new Date("2026-09-03T00:00:00Z"),
        lastMoveAt: new Date("2026-09-03T00:00:00Z"),
      }),
    ];
    const groups = await queueOf(new Map(), MEMBER, new Date("2026-09-04T00:00:00Z"));
    expect(groups.offerSent[0].offer).toBe("withdrawn");
  });

  /*
   * And it leaves on its own, by the window that already drops a finished
   * game — so being told is a thing that happens once and then stops, with no
   * second mechanism marking anything as seen.
   */
  it("drops a refused offer on the same window a finished game leaves by", async () => {
    rows = [
      offeredByMe({
        status: "finished",
        declinedAt: new Date("2026-09-03T00:00:00Z"),
        lastMoveAt: new Date("2026-09-03T00:00:00Z"),
      }),
    ];
    const groups = await queueOf(new Map(), MEMBER, new Date("2026-11-01T00:00:00Z"), 7);
    expect(groups.offerSent).toEqual([]);
  });

  /*
   * AND AN ACCEPTED GAME IS AN ORDINARY GAME. `acceptOffer` clears the offer
   * and binds the seat, so this is the row it leaves behind — and the queue
   * must read it with no trace of where it came from.
   */
  it("reads an accepted game exactly as it reads any other", async () => {
    rows = [
      game({
        blackMemberId: "member-2",
        whiteMemberId: MEMBER,
        moveCount: 1,
        settledStatus: GAME_STATUS.playing,
        settledToPlay: STONES.white,
      }),
    ];
    const groups = await queueOf(new Map(), MEMBER);
    expect(groups.offered).toEqual([]);
    expect(groups.offerSent).toEqual([]);
    expect(groups.yourMove).toHaveLength(1);
    expect(groups.yourMove[0].offer).toBeNull();
    expect(groups.yourMove[0].offerSide).toBeNull();
    expect(groups.yourMove[0].toPlay).toBe(STONES.white);
  });

  /*
   * A STRANGER WHO HOLDS THE ADDRESS IS TOLD NOTHING, and cannot be: an offer
   * is reached by member id, and nobody else is one of the two people in it.
   */
  it("shows an offer to nobody but its two people", async () => {
    rows = [offeredToMe()];
    const groups = await queueOf(new Map(), "member-3");
    expect(Object.values(groups).flat()).toEqual([]);
  });

  /*
   * THE QUEUE IS ONE QUERY, and adding offers to it must not have made it two.
   * The third way a game is yours is a third branch of the same OR, on its own
   * index — see the migration.
   */
  it("reads the offers on the same query as the seats", async () => {
    rows = [offeredToMe(), offeredByMe({ id: "g2" })];
    await queueOf(new Map(), MEMBER);
    /*
     * ON THE COMPLETE READ, and still one query for the three ways a game is
     * yours. The seats moved under an `AND` when the finished group started
     * paging — the read is now "anything a debt could be, AND one of your
     * seats" — so this reads the branch rather than the top level. The point is
     * unchanged: the offers are not a query of their own.
     */
    const asked = gameFindMany.mock.calls[0][0] as {
      where: { AND: { OR?: Record<string, unknown>[] }[] };
    };
    const seats = asked.where.AND.find((one) =>
      (one.OR ?? []).some((branch) => "blackMemberId" in branch),
    );
    expect(seats?.OR).toEqual(expect.arrayContaining([{ offeredToMemberId: MEMBER }]));
  });

  /*
   * Oldest first, as the games waiting on your move read: an offer is a debt,
   * and the one that has been waiting longest is the one somebody is most
   * likely to be wondering about.
   */
  it("reads the longest-waiting offer first", async () => {
    rows = [
      offeredToMe({ id: "new", lastMoveAt: new Date("2026-09-09T00:00:00Z") }),
      offeredToMe({ id: "old", lastMoveAt: new Date("2026-09-03T00:00:00Z") }),
    ];
    const groups = await queueOf(new Map(), MEMBER);
    expect(groups.offered.map((one) => one.game.id)).toEqual(["old", "new"]);
  });
});

/**
 * ───────────────────────────────────────────────────────────────────────────
 * WHAT THE QUERY ITSELF ASKS FOR, WHICH IS WHERE THE COST WAS
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The read had no date bound. Every game the member had ever sat in came
 * back — one member on a development database holds 559 — was replayed where
 * it could not answer for itself, sorted, and then mostly thrown away by the
 * retention check at the bottom of the loop. On `/play`, on every
 * `/api/games/mine` the badge asks for on every page, and on every advance to
 * the next game after a move.
 *
 * So these are assertions about the QUERY, not only about the answer: the
 * fake above honours the `where`, so a bound that stopped being sent would
 * show up here as rows read rather than as a list that happens to look right.
 */
describe("what the read costs before anything is sorted", () => {
  const NOW = new Date("2026-09-11T00:00:00Z");

  /** A game filed as over, with its last move `days` before the now under test. */
  function filed(id: string, days: number): Row {
    const when = new Date(NOW.getTime() - days * 86_400_000);
    return game({
      id,
      status: "finished",
      result: "black",
      winner: STONES.black,
      moveCount: 30,
      playedAt: when,
      lastMoveAt: when,
    });
  }

  it("does not read a finished game past the member's window", async () => {
    rows = [filed("lately", 2), ...Array.from({ length: 50 }, (_unused, index) => filed(`old-${index}`, 60 + index))];

    const groups = await queueOf(new Map(), MEMBER, NOW, 14);
    expect(groups.finished.map((one) => one.game.id)).toEqual(["lately"]);
    // Fifty-one rows to be had, and the list is drawn from one of them.
    expect(rowsRead).toBe(1);
  });

  /*
   * THE CASE THE BOUND COULD NOT HELP, AND WHAT NOW BOUNDS IT.
   *
   * Keeping for ever is the DEFAULT, so it is most members and it is John's own
   * setting: there is no date to bound the read with, and the read used to be
   * the whole history again. This case asserted exactly that, as an honest
   * report of a gap. The gap is closed by the PAGE instead of a date, so what it
   * asserts now is the opposite — and the assertion that matters is `rowsRead`,
   * because a page that quietly stopped being asked for would show up here as
   * two hundred rows rather than as a list that happens to look right.
   */
  it("bounds a member who keeps everything by the page, since there is no date to bound by", async () => {
    rows = [
      filed("lately", 2),
      ...Array.from({ length: 200 }, (_unused, index) => filed(`older-${index}`, 10 + index)),
    ];

    const queue = await fetchMyGames(new Map(), MEMBER, NOW, 0, { limit: 5 });
    expect(queue.groups.finished.map((one) => one.game.id)).toEqual([
      "lately",
      "older-0",
      "older-1",
      "older-2",
      "older-3",
    ]);
    /*
     * Six rather than five: each run is read ONE row longer than the page, which
     * is how "is there more" is answered without a second query — see `takeFor`.
     * The null run is empty here, so it contributes nothing. Two hundred and one
     * rows to be had, and six of them are read.
     */
    expect(rowsRead).toBe(6);
    // And the heading still says how many there really are, exactly.
    expect(queue.finished.total).toBe(201);
    expect(queue.finished.next).not.toBeNull();

    // No date bound was asked for, which is the half `myListWindow` decides.
    const asked = gameFindMany.mock.calls[0][0] as { where: { AND: unknown[] } };
    expect(asked.where.AND).toHaveLength(2);
  });

  it("never drops a game still being played, however old it has grown", async () => {
    /*
     * The one thing this must not do. A correspondence game somebody has not
     * moved in for a year is the game they most need to be shown, and a bound
     * that read only the last fortnight would have taken it off the page — with
     * nothing failing, because the row would simply not be there.
     */
    rows = [
      game({
        id: "long-game",
        playedAt: new Date(NOW.getTime() - 400 * 86_400_000),
        lastMoveAt: new Date(NOW.getTime() - 400 * 86_400_000),
        settledStatus: GAME_STATUS.playing,
        settledToPlay: STONES.black,
        moveCount: 12,
      }),
    ];

    const groups = await queueOf(new Map(), MEMBER, NOW, 7);
    expect(groups.yourMove.map((one) => one.game.id)).toEqual(["long-game"]);
    expect(groups.yourMove[0].stale).toBe(true);
  });

  it("still lets go of an old game the engine ended while the row says active", async () => {
    /*
     * THE ONE ROW THE TWO HALVES DISAGREE ABOUT, so it is worth a case of its
     * own. A Reversi board that filled up is over with nothing written down —
     * the row still says `active` — so the bound READS it, because a `where`
     * cannot ask the engine anything. The check is what knows it is over and
     * drops it, exactly as it did before the bound existed. If that ever
     * stopped being true, an old finished game would come back to the list
     * for one variant and nobody would know why.
     */
    const long = new Date(NOW.getTime() - 400 * 86_400_000);
    rows = [
      game({
        id: "filled-up",
        playedAt: long,
        lastMoveAt: long,
        settledStatus: GAME_STATUS.won,
        settledToPlay: null,
        moveCount: 60,
      }),
    ];

    const groups = await queueOf(new Map(), MEMBER, NOW, 7);
    // Read — the bound is the looser half — and then left out.
    expect(rowsRead).toBe(1);
    expect(Object.values(groups).flat()).toEqual([]);
  });

  it("never drops an offer nobody has answered, however long it has waited", async () => {
    const long = new Date(NOW.getTime() - 400 * 86_400_000);
    rows = [
      game({
        id: "still-asking",
        blackMemberId: "member-2",
        whiteMemberId: null,
        offeredToMemberId: MEMBER,
        offeredAt: long,
        moveCount: 0,
        playedAt: long,
        lastMoveAt: long,
      }),
    ];

    const groups = await queueOf(new Map(), MEMBER, NOW, 7);
    expect(groups.offered.map((one) => one.game.id)).toEqual(["still-asking"]);
  });

  it("keeps the bound beside the three ways a game is yours, not instead of them", async () => {
    /*
     * The window is itself an OR, and a `where` cannot hold two of those at one
     * level — so spreading it would have replaced the seats with the dates and
     * handed every member everybody's recent games. It goes in an `AND`.
     */
    rows = [filed("mine", 2)];
    await queueOf(new Map(), MEMBER, NOW, 14);

    /*
     * THREE ORs NOW, AT ONE LEVEL, WHICH IS WHY THEY ARE ALL IN THE `AND`. The
     * debt read asks "anything a debt could be" — itself an OR — beside the
     * seats and the window, which are two more. A `where` cannot hold two at one
     * level, so the trap this case was written for got bigger rather than going
     * away: spreading any of the three would silently replace another and hand a
     * member somebody else's games, or every recent game on the site.
     */
    const asked = gameFindMany.mock.calls[0][0] as {
      where: { AND: { OR: Record<string, unknown>[] }[] };
    };
    expect(asked.where.AND).toHaveLength(3);
    const branches = asked.where.AND.map((one) => one.OR);
    expect(branches).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          { blackMemberId: MEMBER },
          { whiteMemberId: MEMBER },
          { offeredToMemberId: MEMBER },
        ]),
      ]),
    );
    // The debt read's own half: anything active, and every offer in any state.
    expect(branches).toEqual(
      expect.arrayContaining([expect.arrayContaining([{ status: "active" }])]),
    );
    // And the window, which is the dates.
    expect(branches).toEqual(
      expect.arrayContaining([expect.arrayContaining([{ lastMoveAt: { gte: expect.any(Date) } }])]),
    );
  });

  it("reads a game this browser holds a seat cookie in, bound or not", async () => {
    /*
     * A phone with a scanned link and no account gets the default window —
     * keeping everything — and its read is bounded by the cookies themselves,
     * which are a primary-key lookup and a handful at most. Worth a case
     * because the seat-cookie branch is the one that does not go through a
     * member id at all.
     */
    const old = new Date(NOW.getTime() - 900 * 86_400_000);
    rows = [
      game({ id: "cookied", blackMemberId: null, whiteMemberId: null, playedAt: old, lastMoveAt: old, status: "finished", result: "draw" }),
    ];
    const groups = await queueOf(new Map([["cookied", "tok-black"]]), null, NOW);
    expect(groups.finished.map((one) => one.game.id)).toEqual(["cookied"]);
  });
});
