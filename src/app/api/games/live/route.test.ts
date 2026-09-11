import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Whether a game this route creates is rated, when the request does not say.
 *
 * A hot-seat board is somebody trying a board out at one screen: nobody
 * asked for a rated game, and `useMatchMirror` now says `rated: false`
 * outright — but the schema used to default an absent field to `true`,
 * which is how a scratch board reached a real ladder with neither player
 * having asked for a rated game. See AGENTS.md, "A board you were only
 * trying out creates a rated game".
 *
 * `createLiveGame` is mocked so these read what the route actually decided,
 * the same shape as `sit/route.test.ts` next door.
 */

const createLiveGame = vi.fn<
  (input: Record<string, unknown>) => Promise<{ id: string; blackToken: string; whiteToken: string }>
>(async () => ({
  id: "game-1",
  blackToken: "black-token",
  whiteToken: "white-token",
}));

vi.mock("@/lib/history/liveGame", () => ({
  createLiveGame: (input: Record<string, unknown>) => createLiveGame(input),
}));
vi.mock("@/lib/api/rateLimit", () => ({ overLimit: () => null, RATE_LIMITS: { createGame: {} } }));
vi.mock("@/lib/history/activeGames", () => ({
  memberOverActiveLimit: async () => null,
  activeLimitRefusal: () => "",
}));
vi.mock("@/lib/auth/currentSession", () => ({
  currentMemberId: async () => null,
  currentSession: async () => null,
}));
vi.mock("@/lib/social/ignores", () => ({ isIgnoring: async () => false }));
vi.mock("@/lib/bots/botMembers", () => ({ ensureBotMembers: async () => {} }));
vi.mock("@/lib/bots/bots", () => ({ isBotId: () => false }));
vi.mock("@/lib/bots/botPlay", () => ({ playBotTurns: async () => {} }));

const { POST } = await import("./route");

function post(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/games/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  createLiveGame.mockClear();
});

describe("POST /api/games/live — rated", () => {
  it("a hot-seat board that says nothing about rated is not rated", async () => {
    const response = await post({ hotSeat: true, open: false });

    expect(response.status).toBe(201);
    expect(createLiveGame).toHaveBeenCalledTimes(1);
    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(false);
  });

  it("a hot-seat board that explicitly asks to be rated stays rated", async () => {
    await post({ hotSeat: true, open: false, rated: true });

    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(true);
  });

  it("a hot-seat board that explicitly declines rating stays unrated", async () => {
    await post({ hotSeat: true, open: false, rated: false });

    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(false);
  });

  /*
   * `StartGame` posts a seat with `{ variant, size, moveTimeMs, open: true }`
   * and never sends `hotSeat` or `rated` — this is that shape. It has to go
   * on creating a rated game exactly as it always has: it is one of the two
   * callers a hot-seat-only default was chosen specifically so as not to
   * disturb, because neither lives on a path this fix was free to edit.
   */
  it("a posted seat that says nothing about rated is still rated, as it always was", async () => {
    const response = await post({ open: true });

    expect(response.status).toBe(201);
    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(true);
  });

  /*
   * `ChallengeButton` posts `{ challenge, challengeId, variant, from,
   * rematch }` and never sends `hotSeat` or `rated` either. Neither
   * `challenge` nor `challengeId` is set here — an anonymous caller cannot
   * challenge anybody — so this exercises the same "ordinary, non-hot-seat
   * creation" branch that one relies on, without needing a signed-in
   * session or a member row.
   */
  it("an ordinary board that says nothing about rated or hotSeat is still rated", async () => {
    const response = await post({});

    expect(response.status).toBe(201);
    const [input] = createLiveGame.mock.calls[0] as [{ rated: boolean }];
    expect(input.rated).toBe(true);
  });
});
