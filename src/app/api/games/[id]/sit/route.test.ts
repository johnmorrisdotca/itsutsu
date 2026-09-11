import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Sitting down at somebody else's posted seat, when you are already holding
 * twenty games.
 *
 * The cap was written into the button that STARTS a game and nowhere else, so
 * the pile it exists to stop could still be grown one seat at a time from the
 * noticeboard — which is the pile most likely to grow, because answering a
 * posted seat is the cheapest thing on the site to do. A member at the limit
 * could take a twenty-first and a twenty-second this way and the only thing
 * that ever said no was a button they were not pressing.
 *
 * The rule itself is tested in `src/lib/history/activeGames.test.ts`. What is
 * tested here is the only thing that was ever wrong: whether this door asks
 * it, and whether it does so BEFORE the seat is taken. `sitAtOpenSeat` is a
 * conditional update that claims the seat and stamps the deadline in one
 * write — ask after that and the seat is already gone, so a refusal would
 * leave the game seated by somebody who was then told no.
 */

const overActiveLimit = vi.fn<
  (ids: readonly (string | null | undefined)[]) => Promise<{ memberId: string; count: number; limit: number } | null>
>(async () => null);

const sitAtOpenSeat = vi.fn(async () => ({
  ok: true as const,
  seat: "white",
  variant: "freestyle",
  token: "seat-token",
}));
const bindSeat = vi.fn(async () => {});

vi.mock("@/lib/history/activeGames", () => ({
  memberOverActiveLimit: (ids: readonly (string | null | undefined)[]) => overActiveLimit(ids),
  activeLimitRefusal: (over: { count: number; limit: number }) =>
    `You have ${over.count} games on the go, and ${over.limit} at once is the limit here.`,
}));
vi.mock("@/lib/api/rateLimit", () => ({ overLimit: () => null, RATE_LIMITS: {} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/history/liveGame", () => ({ seatForToken: async () => null }));
vi.mock("@/lib/auth/currentSession", () => ({
  currentMemberId: async () => "alice",
  currentSession: async () => ({ name: "Alice" }),
}));
vi.mock("@/lib/history/seats", () => ({
  bindSeat: (...args: unknown[]) => bindSeat(...(args as [])),
  wouldAnswerTheirOwnInvitation: async () => false,
}));
vi.mock("@/lib/history/openGames", () => ({ sitAtOpenSeat: () => sitAtOpenSeat() }));
vi.mock("@/lib/bots/botPlay", () => ({ playBotTurns: async () => {} }));

const { POST } = await import("./route");

/** The route's own shape of call: a request and the params Next would hand it. */
function sit(id = "game-1") {
  return POST(new Request(`http://localhost/api/games/${id}/sit`, { method: "POST" }), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  overActiveLimit.mockClear();
  overActiveLimit.mockResolvedValue(null);
  sitAtOpenSeat.mockClear();
  bindSeat.mockClear();
});

describe("POST /api/games/[id]/sit", () => {
  it("refuses a member who is already at the limit", async () => {
    overActiveLimit.mockResolvedValue({ memberId: "alice", count: 20, limit: 20 });

    const response = await sit();

    expect(response.status).toBe(422);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("20");
  });

  it("does not take the seat it is about to refuse", async () => {
    /*
     * The order is the whole point. A refusal that arrives after
     * `sitAtOpenSeat` has run has already emptied the noticeboard: the seat
     * is claimed, the deadline is stamped, and the person told no is the
     * person sitting in it.
     */
    overActiveLimit.mockResolvedValue({ memberId: "alice", count: 20, limit: 20 });

    await sit();

    expect(sitAtOpenSeat).not.toHaveBeenCalled();
    expect(bindSeat).not.toHaveBeenCalled();
  });

  it("asks about the member doing the sitting", async () => {
    overActiveLimit.mockResolvedValue({ memberId: "alice", count: 20, limit: 20 });

    await sit();

    expect(overActiveLimit).toHaveBeenCalled();
    expect(overActiveLimit.mock.calls[0]?.[0]).toContain("alice");
  });

  it("seats a member who is under it, exactly as before", async () => {
    // The guard must not become a wall: the ordinary case still goes through.
    const response = await sit();

    expect(response.status).toBe(200);
    expect(sitAtOpenSeat).toHaveBeenCalled();
    expect(bindSeat).toHaveBeenCalled();
  });
});
