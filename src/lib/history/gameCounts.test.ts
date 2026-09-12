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

type Where = { status?: string; variant?: string; result?: { not?: string } };

function matches(row: Row, where: Where): boolean {
  if (where.status !== undefined && row.status !== where.status) return false;
  if (where.variant !== undefined && row.variant !== where.variant) return false;
  if (where.result?.not !== undefined && row.result === where.result.not) return false;
  return true;
}

/** Enough of `groupBy` to answer the one call `fetchPlayedCounts` makes. */
const groupBy = vi.fn(async ({ where }: { where: Where }) => {
  const kept = stored.filter((row) => matches(row, where));
  const byVariant = new Map<string, number>();
  for (const row of kept) byVariant.set(row.variant, (byVariant.get(row.variant) ?? 0) + 1);
  return [...byVariant].map(([variant, count]) => ({ variant, _count: { _all: count } }));
});

/** Enough of `findMany` for both queries `gameCounts.ts` makes. */
const findMany = vi.fn(async ({ where }: { where: Where }) => {
  const kept = [...stored]
    .filter((row) => matches(row, where))
    .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());
  const seen = new Set<string>();
  const distinct: Row[] = [];
  for (const row of kept) {
    if (seen.has(row.variant)) continue;
    seen.add(row.variant);
    distinct.push(row);
  }
  return distinct;
});

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
