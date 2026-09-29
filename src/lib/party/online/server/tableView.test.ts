import { describe, expect, it } from "vitest";

import { PARTY_TURN_WAIT_MS } from "../online.constants";
import { resultFor } from "./tableNotices";
import { tableTag, viewOf } from "./tableRead";

/**
 * WHAT A TABLE'S READER IS SHOWN, from a row, with no database: the view the
 * page and the poll hand a browser, the tag a poll is answered by, and the
 * result each seat is told. Everything here is asked without Prisma reaching
 * anything (the suite runs these with a dead `DATABASE_URL`).
 */

const AT = new Date("2026-09-28T12:00:00Z");

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "abcd-efgh",
    game: "dotsAndBoxes",
    size: 3,
    state: "{}",
    version: 4,
    status: "playing",
    toPlay: 1,
    winners: [] as number[],
    moveCount: 3,
    movedAt: AT,
    hostMemberId: "m0",
    endedByMemberId: null as string | null,
    createdAt: AT,
    updatedAt: AT,
    finishedAt: null,
    lastMoverId: "m0",
    seats: [
      { tableId: "abcd-efgh", seat: 0, kind: "member", memberId: "m0", name: "Aiko", token: null, joinedAt: AT, colour: null },
      { tableId: "abcd-efgh", seat: 1, kind: "member", memberId: "m1", name: "Ben Hayashi", token: null, joinedAt: AT, colour: null },
      { tableId: "abcd-efgh", seat: 2, kind: "open", memberId: null, name: "", token: "tok123", joinedAt: null, colour: null },
    ],
    ...overrides,
  };
}

describe("a table as its reader is shown it", () => {
  it("is only ever made for a member seated at it", () => {
    expect(viewOf(row(), "stranger", false, AT)).toBeNull();
  });

  it("says which seat is the reader's, and hands every seated member each open seat's link", () => {
    const view = viewOf(row(), "m1", true, AT)!;
    expect(view.mySeat).toBe(1);
    expect(view.seats.map((seat) => seat.yours)).toEqual([false, true, false]);
    expect(view.seats[2].link).toBe("/games/dots-and-boxes/tables/abcd-efgh/seat/tok123");
    expect(view.seats[0].link).toBeNull();
    expect(view.toPlayHere).toBe(true);
    expect(view.lastMoverId).toBe("m0");
    // The name the site prints, never the whole one.
    expect(view.seats[1].name).toBe("Ben H.");
  });

  it("offers End only when the rule allows it", () => {
    expect(viewOf(row(), "m0", false, AT)!.canEnd).toBe(false);
    expect(viewOf(row(), "m0", false, new Date(AT.getTime() + PARTY_TURN_WAIT_MS))!.canEnd).toBe(true);
    expect(viewOf(row({ moveCount: 0 }), "m1", false, AT)!.canEnd).toBe(true);
  });

  it("names who ended an ended table", () => {
    const view = viewOf(row({ status: "ended", toPlay: null, endedByMemberId: "m0" }), "m1", false, AT)!;
    expect(view.endedBy).toBe("Aiko");
  });
});

describe("the poll's tag", () => {
  it("moves with the version, with who is here, and with a turn gone stale", () => {
    const tags = new Set([tableTag(4, false, false), tableTag(5, false, false), tableTag(4, true, false), tableTag(4, false, true)]);
    expect(tags.size).toBe(4);
    expect(tableTag(4, true, false)).toMatch(/^"p4-h"$/);
  });
});

describe("how a table went for each seat", () => {
  it("won, shared, lost, or ended with nobody winning", () => {
    expect(resultFor(0, [0], false)).toBe("won");
    expect(resultFor(0, [0, 2], false)).toBe("shared");
    expect(resultFor(1, [0], false)).toBe("lost");
    expect(resultFor(1, [], true)).toBe("ended");
    // A race nobody could finish names no winner, and nobody is told they lost it.
    expect(resultFor(1, [], false)).toBe("ended");
  });
});
