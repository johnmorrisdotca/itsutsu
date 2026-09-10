import { beforeEach, describe, expect, it, vi } from "vitest";

import { BOT_MEMBERS, OPEN_SEATS_ANSWERED_AT_ONCE } from "./bots.constants";

/**
 * The sweep that answers a seat nobody has taken.
 *
 * Every case here is about WHICH seats it reaches rather than what it does
 * when it gets there. The sweep reads the oldest stale seats and puts a
 * computer in them, and the ordering is on a column that only gets older — so
 * anything that can sit at the front of that queue without being answerable
 * can sit there for good, and everything behind it starves. That is not a
 * failure any assertion about a single seat would notice.
 */

type Row = { id: string; blackMemberId: string | null; whiteMemberId: string | null };

let rows: Row[] = [];
let sat: string[] = [];
let refuse = new Set<string>();

const findMany = vi.fn(async ({ take }: { take: number }) => rows.slice(0, take));
const sitAtOpenSeat = vi.fn(async (id: string) => {
  sat.push(id);
  return refuse.has(id) ? { ok: false as const } : { ok: true as const, seat: "white" };
});

vi.mock("@/lib/prisma", () => ({ prisma: { game: { findMany: (args: { take: number }) => findMany(args) } } }));
vi.mock("@/lib/history/openGames", () => ({ sitAtOpenSeat: (id: string) => sitAtOpenSeat(id) }));
vi.mock("@/lib/history/seats", () => ({ bindSeat: async () => undefined }));
vi.mock("./botMembers", () => ({ ensureBotMembers: async () => undefined }));
vi.mock("./botPlay", () => ({ playBotTurns: async () => undefined }));

const { answerStaleOpenSeats } = await import("./botSeats");

/** A seat waiting for anybody: both chairs empty of a computer. */
const waiting = (id: string): Row => ({ id, blackMemberId: "a-person", whiteMemberId: null });

/** A seat a computer is already sitting in, which the sweep must pass over. */
const taken = (id: string): Row => ({ id, blackMemberId: BOT_MEMBERS.dan.id, whiteMemberId: null });

beforeEach(() => {
  rows = [];
  sat = [];
  refuse = new Set();
  findMany.mockClear();
  sitAtOpenSeat.mockClear();
});

describe("which seats one sweep can reach", () => {
  it("reaches a waiting game standing behind a queue of unanswerable ones", async () => {
    /*
     * THE CASE THE OLD SHAPE FAILED. The sweep cut the list to three and only
     * then discarded the games a computer was already in, so a discarded row
     * took its slot with it — and since the ordering is oldest-first, three
     * such rows at the front would have starved this one for good.
     */
    rows = [taken("a"), taken("b"), taken("c"), waiting("d")];

    expect(await answerStaleOpenSeats()).toBe(1);
    expect(sat, "the waiting game should have been the one sat in").toEqual(["d"]);
  });

  it("still answers no more than the cap in one sweep", async () => {
    // Looking further must not turn into working further: the cap is on the
    // expensive half, which is sitting down and playing a move.
    rows = Array.from({ length: 20 }, (_, at) => waiting(`g${at}`));

    expect(await answerStaleOpenSeats()).toBe(OPEN_SEATS_ANSWERED_AT_ONCE);
    expect(sat).toHaveLength(OPEN_SEATS_ANSWERED_AT_ONCE);
  });

  it("does not spend an answer on a seat somebody else took first", async () => {
    // Losing the race for a seat means the seat is gone, not that we have
    // answered one. The next game along should still get a computer.
    rows = [waiting("a"), waiting("b"), waiting("c"), waiting("d")];
    refuse = new Set(["a", "b"]);

    expect(await answerStaleOpenSeats()).toBe(2);
    expect(sat).toEqual(["a", "b", "c", "d"]);
  });

  it("looks at more seats than it will answer", async () => {
    rows = [waiting("a")];
    await answerStaleOpenSeats();
    expect(findMany.mock.calls[0][0].take).toBeGreaterThan(OPEN_SEATS_ANSWERED_AT_ONCE);
  });

  it("says nothing happened when every seat it can see is already answered", async () => {
    rows = [taken("a"), taken("b")];
    expect(await answerStaleOpenSeats()).toBe(0);
    expect(sat).toEqual([]);
  });
});
