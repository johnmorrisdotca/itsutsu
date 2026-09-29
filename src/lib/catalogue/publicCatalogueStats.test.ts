import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The stranger's figures: kept in production, fresh everywhere else, and never
 * a name in what is kept. Next's data cache is stood in for by one that keeps
 * an answer and never keeps a throw.
 */
const held = new Map<string, unknown>();
const asked: { keys: string[]; revalidate: number | undefined }[] = [];
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: <T,>(read: () => Promise<T>, keys: string[], options?: { revalidate?: number }) => {
    asked.push({ keys, revalidate: options?.revalidate });
    return async () => {
      const key = keys.join("/");
      if (!held.has(key)) held.set(key, await read());
      return held.get(key) as T;
    };
  },
}));

const top = { name: "Aiko Example", memberId: "m1", pool: "people", wins: 3, losses: 1, draws: 0, level: 4 };
let played = 7;
const reads = vi.fn(async () => ({
  games: { gomoku: { variant: "gomoku", played, last: { since: { unit: "today" }, gameId: "g1" }, top } },
  families: { five: { played, gamesPlayed: 1, games: 9, crowns: { kind: "held", holder: top, games: ["gomoku"] } } },
}));
vi.mock("./catalogueStats", () => ({ fetchCatalogueStats: () => reads() }));

async function stats() {
  vi.resetModules();
  return import("./publicCatalogueStats");
}

beforeEach(() => {
  held.clear();
  asked.length = 0;
  reads.mockClear();
  played = 7;
});

afterEach(() => vi.unstubAllEnvs());

describe("the catalogue's figures for a reader with no session", () => {
  it("reads the database once in production, however many strangers ask", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { strangerCatalogueStats, STRANGER_STATS_SECONDS } = await stats();
    expect((await strangerCatalogueStats()).games.gomoku!.played).toBe(7);
    played = 8;
    expect((await strangerCatalogueStats()).games.gomoku!.played).toBe(7);
    expect(reads).toHaveBeenCalledTimes(1);
    expect(asked).toEqual([{ keys: ["catalogue-stats-stranger"], revalidate: STRANGER_STATS_SECONDS }]);
    expect(STRANGER_STATS_SECONDS).toBeGreaterThanOrEqual(3600);
  });

  it("keeps no name, no level and no match id", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { strangerCatalogueStats } = await stats();
    await strangerCatalogueStats();
    const keptText = JSON.stringify([...held.values()]);
    expect(keptText).not.toContain("Aiko");
    expect(keptText).not.toContain("g1");
    expect(keptText).toContain('"level":null');
    expect(keptText).toContain('"wins":3');
  });

  it("does not keep a failed read", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { strangerCatalogueStats } = await stats();
    reads.mockRejectedValueOnce(new Error("database asleep"));
    await expect(strangerCatalogueStats()).rejects.toThrow(/asleep/);
    expect((await strangerCatalogueStats()).games.gomoku!.played).toBe(7);
  });

  it("reads fresh outside production, where the suite seeds a game and looks at once", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { strangerCatalogueStats } = await stats();
    expect((await strangerCatalogueStats()).games.gomoku!.played).toBe(7);
    played = 8;
    const again = await strangerCatalogueStats();
    expect(again.games.gomoku!.played).toBe(8);
    expect(again.games.gomoku!.top!.name).toBeNull();
    expect(reads).toHaveBeenCalledTimes(2);
  });
});
