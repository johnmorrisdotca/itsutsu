import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `fetchPlayedCounts` must exclude what `playerRecord.ts` excludes.
 *
 * `playerRecord.ts` — read for every player-level "Played" — has always left
 * abandoned games out: "Abandoned games are not results and are left out."
 * `gameCounts.ts` counted `status: "finished"` alone, with no `result`
 * filter, for the catalogue's own "N played" figure. The two agreed only
 * because production holds no abandoned row today — dormant, not fixed —
 * and would disagree the first time one exists.
 *
 * And it must read a bounded number of rows. The latest game of each kind was
 * a `distinct` read, which Prisma answers in memory by fetching every finished
 * game; the games index reads this on every render.
 */

type Row = {
  id: string;
  variant: string;
  blackName: string;
  whiteName: string;
  playedAt: Date;
  status: string;
  result: string;
};

let stored: Row[] = [];

function game(id: string, variant: string, result: string, playedAt: string, status = "finished"): Row {
  return { id, variant, blackName: "Black", whiteName: "White", playedAt: new Date(playedAt), status, result };
}

type Where = {
  status?: string;
  variant?: string;
  result?: { not?: string };
  OR?: { variant: string; playedAt: Date }[];
};

function matches(row: Row, where: Where): boolean {
  if (where.status !== undefined && row.status !== where.status) return false;
  if (where.variant !== undefined && row.variant !== where.variant) return false;
  if (where.result?.not !== undefined && row.result === where.result.not) return false;
  if (
    where.OR !== undefined &&
    !where.OR.some((one) => one.variant === row.variant && one.playedAt.getTime() === row.playedAt.getTime())
  ) {
    return false;
  }
  return true;
}

/** Enough of `groupBy` to answer the one call `fetchPlayedCounts` makes: a count and the latest date. */
const groupBy = vi.fn(async ({ where }: { where: Where }) => {
  const kept = stored.filter((row) => matches(row, where));
  const byVariant = new Map<string, { count: number; latest: Date }>();
  for (const row of kept) {
    const known = byVariant.get(row.variant);
    byVariant.set(row.variant, {
      count: (known?.count ?? 0) + 1,
      latest: known === undefined || row.playedAt > known.latest ? row.playedAt : known.latest,
    });
  }
  return [...byVariant].map(([variant, { count, latest }]) => ({
    variant,
    _count: { _all: count },
    _max: { playedAt: latest },
  }));
});

/** Enough of `findMany` for the latest-game read: its where, newest first, ties by id. */
const findMany = vi.fn(async ({ where }: { where: Where; distinct?: unknown }) =>
  [...stored]
    .filter((row) => matches(row, where))
    .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime() || a.id.localeCompare(b.id)),
);

vi.mock("@/lib/prisma", () => ({
  prisma: { game: { groupBy: (args: never) => groupBy(args), findMany: (args: never) => findMany(args) } },
}));

const { fetchPlayedCounts } = await import("./gameCounts");

beforeEach(() => {
  stored = [];
  groupBy.mockClear();
  findMany.mockClear();
});

describe("fetchPlayedCounts excludes what playerRecord excludes", () => {
  it("does not count an abandoned game as played", async () => {
    stored = [game("a", "freestyle", "black", "2026-01-01"), game("b", "freestyle", "abandoned", "2026-01-02")];

    const counts = await fetchPlayedCounts();

    expect(counts.get("freestyle")?.played, "the abandoned game must not be counted").toBe(1);
  });

  it("does not point 'last' at an abandoned game either", async () => {
    // The newest row of the variant is the abandoned one; the honest "last"
    // is the most recent one that actually finished with a result.
    stored = [game("a", "freestyle", "black", "2026-01-01"), game("b", "freestyle", "abandoned", "2026-01-02")];

    const counts = await fetchPlayedCounts();

    expect(counts.get("freestyle")?.last?.id).toBe("a");
  });

  it("still counts every other finished game", async () => {
    stored = [
      game("a", "freestyle", "black", "2026-01-01"),
      game("b", "freestyle", "white", "2026-01-02"),
      game("c", "freestyle", "draw", "2026-01-03"),
    ];

    const counts = await fetchPlayedCounts();

    expect(counts.get("freestyle")?.played).toBe(3);
  });
});

describe("fetchPlayedCounts reads a bounded number of rows", () => {
  it("asks for the latest game of each kind by its date, never for every game", async () => {
    stored = [
      game("a", "freestyle", "black", "2026-01-01"),
      game("b", "freestyle", "white", "2026-01-05"),
      game("c", "hex", "black", "2026-02-01"),
    ];

    const counts = await fetchPlayedCounts();

    expect(groupBy).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledTimes(1);
    const [{ where, distinct }] = findMany.mock.calls[0] as [{ where: Where; distinct?: unknown }];
    expect(distinct, "an in-memory distinct reads every finished game").toBeUndefined();
    expect(where.OR?.map((one) => one.variant).sort()).toEqual(["freestyle", "hex"]);
    expect(counts.get("freestyle")?.last?.id).toBe("b");
    expect(counts.get("hex")?.last?.id).toBe("c");
  });

  it("settles two latest games in the same moment by id, so the answer does not flicker", async () => {
    stored = [game("zz", "hex", "black", "2026-02-01"), game("aa", "hex", "white", "2026-02-01")];

    const counts = await fetchPlayedCounts();

    expect(counts.get("hex")).toMatchObject({ played: 2, last: { id: "aa" } });
  });

  it("makes no second read when nothing has been played", async () => {
    const counts = await fetchPlayedCounts();

    expect(counts.size).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
  });
});
