import { beforeEach, describe, expect, it, vi } from "vitest";

import { STONES } from "@/lib/gomoku/gomoku.constants";

/**
 * The name a seat is SHOWN under, and the name it was PLAYED under.
 *
 * The case this exists for is on production and has a name. John's daughter
 * renamed from "Hanako Morris" to "Hanachan" on this site's own advice, because
 * her full name was public. Five of her finished games still store the old name,
 * her newest store the new, and nothing told a reader they were one child. So the
 * first thing below is that a rename reaches backwards onto every screen — and
 * the second is that it does NOT reach the names a rating was keyed by, because
 * those are a different fact and moving them would move a rating out from under
 * whoever earned it.
 *
 * The third is a cost: a page of games names a handful of people, so resolving a
 * whole page is ONE read. A resolution that cost a query per row would be a
 * correct answer nobody could afford to ask for.
 */

let members: { id: string; name: string }[] = [];
const memberFindMany = vi.fn(async ({ where }: { where: { id: { in: string[] } } }) =>
  members.filter((one) => where.id.in.includes(one.id)),
);

vi.mock("@/lib/prisma", () => ({
  prisma: { member: { findMany: (args: never) => memberFindMany(args) } },
}));

const { NO_CURRENT_NAMES, currentNamesFor, seatName } = await import("./currentNames");
const { toSummary } = await import("./gameHistory");

/** Her member id, and the two names it has answered to. */
const HANAKO = "964k9atpbhzja6d9";
const WAS = "Hanako Morris";
const NOW = "Hanachan";

beforeEach(() => {
  members = [{ id: HANAKO, name: NOW }];
  memberFindMany.mockClear();
});

/** A game row as `SUMMARY_SELECT` brings it back, with her in the black seat. */
function row(over: Record<string, unknown> = {}): never {
  return {
    id: "g1",
    playedAt: new Date("2026-08-01T00:00:00Z"),
    status: "finished",
    blackName: WAS,
    whiteName: "John Morris",
    size: 15,
    winLength: 5,
    variant: "freestyle",
    obstacles: "none",
    opener: STONES.black,
    opening: "free",
    handicap: null,
    seed: 0,
    moveTimeMs: null,
    timeoutPenalty: "turn",
    lastMoveAt: null,
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
    // Nobody was asked to play this: an ordinary finished game.
    offeredToMemberId: null,
    offeredAt: null,
    declinedAt: null,
    withdrawnAt: null,
    blackMemberId: HANAKO,
    whiteMemberId: null,
    result: "black",
    winner: STONES.black,
    moveCount: 20,
    durationMs: null,
    ...over,
  } as never;
}

describe("seatName", () => {
  it("shows the member's current name for a game played under an older one", async () => {
    expect(seatName(WAS, HANAKO, await currentNamesFor([row()]))).toBe(NOW);
  });

  /*
   * The fallback is most of the table rather than an edge: a name typed into a
   * game at one screen, or a record kept from another site, has no account behind
   * it and the stored name is the only name it has.
   */
  it("keeps the stored name for a seat bound to nobody", () => {
    expect(seatName("Somebody", null, NO_CURRENT_NAMES)).toBe("Somebody");
  });

  it("keeps the stored name for a member it was told nothing about", () => {
    expect(seatName(WAS, "someoneelsexxxxx", new Map([[HANAKO, NOW]]))).toBe(WAS);
  });

  /*
   * A blank `Member.name` is a column nobody filled in, not a person called
   * nothing — so it must not blank a seat that has a name on it.
   */
  it("keeps the stored name when the member's own name is blank", async () => {
    members = [{ id: HANAKO, name: "   " }];
    expect(seatName(WAS, HANAKO, await currentNamesFor([row()]))).toBe(WAS);
  });
});

describe("currentNamesFor", () => {
  it("reads both seats, not only the first", async () => {
    const other = "j0hnjdxxxxxxxxxx";
    members = [{ id: HANAKO, name: NOW }, { id: other, name: "John" }];
    const names = await currentNamesFor([row({ whiteMemberId: other, whiteName: "John Morris" })]);
    expect(names.get(HANAKO)).toBe(NOW);
    expect(names.get(other)).toBe("John");
  });

  it("asks once for a whole page, however many games name the same people", async () => {
    const rows = Array.from({ length: 20 }, (_unused, index) => row({ id: `g${index}` }));
    await currentNamesFor(rows);
    expect(memberFindMany).toHaveBeenCalledTimes(1);
  });

  it("asks nothing at all when no seat is bound to anybody", async () => {
    await currentNamesFor([row({ blackMemberId: null, whiteMemberId: null })]);
    expect(memberFindMany).not.toHaveBeenCalled();
  });
});

describe("toSummary", () => {
  it("shows a renamed member under the name they go by now", async () => {
    const rows = [row()];
    const summary = toSummary(rows[0], await currentNamesFor(rows));
    expect(summary.blackName).toBe(NOW);
  });

  /*
   * THE HALF THAT MUST NOT MOVE. A rating is earned under the name it was earned
   * under, and `ratingRefusal` reads these to ask whether one person held both
   * seats. Resolving them would have this page explain a refusal the database
   * never made.
   */
  it("keeps the names as played, beside the names to show", async () => {
    const rows = [row()];
    const summary = toSummary(rows[0], await currentNamesFor(rows));
    expect(summary.playedAs).toEqual({ black: WAS, white: "John Morris" });
  });

  it("leaves a seat nobody holds an account for exactly as it was stored", async () => {
    const rows = [row({ blackMemberId: null })];
    const summary = toSummary(rows[0], await currentNamesFor(rows));
    expect(summary.blackName).toBe(WAS);
    expect(summary.playedAs.black).toBe(WAS);
  });

  /*
   * Handed NO_CURRENT_NAMES — which is what a caller building a position for the
   * engine passes, because the engine reads no names — nothing is resolved and
   * nothing is lost.
   */
  it("changes no name when told of no members", () => {
    const summary = toSummary(row(), NO_CURRENT_NAMES);
    expect(summary.blackName).toBe(WAS);
    expect(summary.playedAs.black).toBe(WAS);
  });
});
