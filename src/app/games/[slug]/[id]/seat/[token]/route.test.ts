import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Claiming a seat from its link, when you are already holding twenty games.
 *
 * This is the door the cap missed most quietly. A private game binds nobody
 * at creation — `createLiveGame` only writes a member id onto a seat when the
 * request already named one — so the count against the person who started it
 * does not move until this route runs. Which means the limit was never
 * checked at the moment it became true: the creation check saw two empty
 * seats and had nothing to count, and this route, which is where the seat
 * actually becomes theirs, never asked at all.
 *
 * Two things are asserted about the refusal beyond its status. It must not
 * bind, obviously. And it must not BURN THE TOKEN: `markSeatTaken` is what
 * stops a seat link being shown again, so refusing and stamping in the same
 * breath would leave the person with a game they were not allowed into and a
 * link that no longer works to get them there once they had finished one.
 */

const overActiveLimit = vi.fn<
  (ids: readonly (string | null | undefined)[]) => Promise<{ memberId: string; count: number; limit: number } | null>
>(async () => null);

const bindSeat = vi.fn(async () => {});
const markSeatTaken = vi.fn(async () => {});

vi.mock("@/lib/history/activeGames", () => ({
  memberOverActiveLimit: (ids: readonly (string | null | undefined)[]) => overActiveLimit(ids),
  activeLimitRefusal: (over: { count: number; limit: number }) =>
    `You have ${over.count} games on the go, and ${over.limit} at once is the limit here.`,
}));
vi.mock("@/lib/history/gameHistory", () => ({
  fetchGameDetail: async (id: string) => ({ id, variant: "freestyle" }),
}));
const currentMemberId = vi.fn<() => Promise<string | null>>(async () => "alice");
vi.mock("@/lib/auth/currentSession", () => ({
  currentMemberId: () => currentMemberId(),
  currentSession: async () => ({ name: "Alice" }),
}));
vi.mock("@/lib/history/liveGame", () => ({ seatForToken: async () => "black" }));
vi.mock("@/lib/history/seats", () => ({
  bindSeat: (...args: unknown[]) => bindSeat(...(args as [])),
  markSeatTaken: (...args: unknown[]) => markSeatTaken(...(args as [])),
  wouldAnswerTheirOwnInvitation: async () => false,
}));

const { GET } = await import("./route");

/** Following the seat link, the way the QR code does. */
function claim(id = "game-1", token = "seat-token") {
  return GET(new Request(`http://localhost/games/gomoku/${id}/seat/${token}`), {
    params: Promise.resolve({ slug: "gomoku", id, token }),
  });
}

beforeEach(() => {
  overActiveLimit.mockClear();
  overActiveLimit.mockResolvedValue(null);
  bindSeat.mockClear();
  markSeatTaken.mockClear();
  currentMemberId.mockClear();
  currentMemberId.mockResolvedValue("alice");
});

describe("GET /games/[slug]/[id]/seat/[token]", () => {
  it("refuses to bind a seat for a member already at the limit", async () => {
    overActiveLimit.mockResolvedValue({ memberId: "alice", count: 20, limit: 20 });

    const response = await claim();

    expect(response.status).toBe(403);
    expect(bindSeat).not.toHaveBeenCalled();
  });

  it("says how many games they actually have", async () => {
    overActiveLimit.mockResolvedValue({ memberId: "alice", count: 20, limit: 20 });

    const response = await claim();

    expect(await response.text()).toContain("20");
  });

  it("leaves the link usable, so it still works once they have finished one", async () => {
    overActiveLimit.mockResolvedValue({ memberId: "alice", count: 20, limit: 20 });

    await claim();

    expect(markSeatTaken).not.toHaveBeenCalled();
  });

  it("binds the seat for a member under the limit, exactly as before", async () => {
    const response = await claim();

    expect(response.status).toBe(303);
    expect(bindSeat).toHaveBeenCalled();
    expect(markSeatTaken).toHaveBeenCalled();
  });

  it("has nothing to ask about a visitor who is not signed in", async () => {
    /*
     * An anonymous seat belongs to no member, so there is no count to be over
     * — and asking anyway would be asking the database a question with no
     * subject. The rule module refuses nulls for the same reason; this proves
     * the door does not reach it with one.
     */
    currentMemberId.mockResolvedValueOnce(null);

    const response = await claim();

    expect(response.status).toBe(303);
    expect(overActiveLimit).not.toHaveBeenCalled();
  });
});
