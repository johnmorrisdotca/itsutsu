import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `GET /api/games?member=<id>` — whether the narrowing it asks for is the one it
 * gets.
 *
 * An id naming nobody used to be dropped on the floor: the query went on with
 * no player at all and answered with every game, a 200 saying the filter had
 * been honoured. These read what the route decided, with the record's own read
 * mocked so the question is only "what was it asked for", and the member lookup
 * left real so the refusal is decided where it is decided in production.
 */

type Row = { key: string; name: string; updatedAt: Date };

let players: Row[] = [];
let member: { name: string } | null = null;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    player: { findMany: async () => players },
    member: { findUnique: async () => member },
  },
}));
vi.mock("@/lib/api/rateLimit", () => ({ overLimit: () => null, RATE_LIMITS: { read: {}, recordGame: {} } }));

const EVERY_GAME = { pagination: { page: 1, pageSize: 20, total: 3, totalPages: 1 }, next: null, items: [], facets: {} };
const fetchGameHistoryPage = vi.fn(async (query: Record<string, unknown>) => {
  void query;
  return EVERY_GAME;
});
vi.mock("@/lib/history/gameHistory", () => ({
  fetchGameHistoryPage: (query: Record<string, unknown>) => fetchGameHistoryPage(query),
}));
vi.mock("@/lib/history/gameRecord", () => ({ gameRecordSchema: {}, recordGame: async () => ({}) }));

const { GET } = await import("./route");

const get = (search: string) => GET(new Request(`https://itsutsu.local/api/games${search}`));

beforeEach(() => {
  players = [];
  member = null;
  fetchGameHistoryPage.mockClear();
});

describe("GET /api/games?member=", () => {
  it("refuses an id that names nobody, by name, instead of answering with every game", async () => {
    const response = await get("?member=nobody-has-this");
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("member");
    expect(body.error).toContain("nobody-has-this");
    // The whole record was never read, so no games could have been returned.
    expect(fetchGameHistoryPage).not.toHaveBeenCalled();
  });

  it("still narrows by a known id, to the name that member's record is counted under", async () => {
    member = { name: "Hanako Morris" };
    players = [{ key: "hanako morris", name: "Hanako Morris", updatedAt: new Date("2026-09-01") }];
    const response = await get("?member=cm-hanako&outcome=won");
    expect(response.status).toBe(200);
    expect(fetchGameHistoryPage).toHaveBeenCalledTimes(1);
    expect(fetchGameHistoryPage.mock.calls[0]?.[0]).toMatchObject({
      player: "Hanako Morris",
      member: null,
      outcome: "won",
    });
  });

  it("asks nothing about a member when none was named", async () => {
    const response = await get("?player=Alice");
    expect(response.status).toBe(200);
    expect(fetchGameHistoryPage.mock.calls[0]?.[0]).toMatchObject({ player: "Alice", member: null });
  });

  it("refuses an unknown sort the same way, which is the shape the member refusal matches", async () => {
    const response = await get("?sort=passwordHash");
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toContain("passwordHash");
  });
});
