import { describe, expect, it } from "vitest";

import { COMPUTER_TAKEOVER_MS, PARTY_TURN_WAIT_MS } from "./online.constants";
import type { OnlineSeatKind, OnlineStatus } from "./online.types";
import { computerDriver, mayEnd, moveRefusal, readSeatAsk, seatAsksRefusal, seatOfMember, tableWaits } from "./onlineSeats";

const AT = new Date("2026-09-28T12:00:00Z");

function table({
  status = "playing" as OnlineStatus,
  toPlay = 0 as number | null,
  moveCount = 3,
  movedAt = AT,
  kinds = ["member", "member", "open"] as OnlineSeatKind[],
  lastMoverId = null as string | null,
} = {}) {
  return {
    status,
    toPlay,
    moveCount,
    movedAt,
    lastMoverId,
    seats: kinds.map((kind, seat) => ({ seat, kind, memberId: kind === "member" ? `m${seat}` : null })),
  };
}

describe("who may move for which seat", () => {
  it("the seat to play, and only its own member", () => {
    expect(moveRefusal(table(), "m0", 0)).toBeNull();
    expect(moveRefusal(table(), "m1", 0)).toBe("notYourTurn");
    expect(moveRefusal(table(), "m0", 1)).toBe("notYourTurn");
    expect(moveRefusal(table({ toPlay: 1 }), "m1", 1)).toBeNull();
  });

  it("nobody who is not seated, whatever seat they name", () => {
    expect(moveRefusal(table(), "stranger", 0)).toBe("notSeated");
  });

  it("an open seat's turn waits: nobody moves for it", () => {
    expect(moveRefusal(table({ toPlay: 2 }), "m0", 2)).toBe("notYourTurn");
  });

  it("a computer's seat, from any member seated at the table", () => {
    const computer = table({ toPlay: 2, kinds: ["member", "member", "computer"] });
    expect(moveRefusal(computer, "m1", 2)).toBeNull();
    expect(moveRefusal(computer, "stranger", 2)).toBe("notSeated");
  });

  it("nothing once the table is over", () => {
    expect(moveRefusal(table({ status: "finished", toPlay: null }), "m0", 0)).toBe("over");
    expect(moveRefusal(table({ status: "ended", toPlay: null }), "m0", 0)).toBe("over");
  });
});

describe("the reader's own seat", () => {
  it("is found by member, never for an open or a computer's seat", () => {
    expect(seatOfMember(table().seats, "m1")).toBe(1);
    expect(seatOfMember(table().seats, "nobody")).toBeNull();
    expect(seatOfMember(table().seats, null)).toBeNull();
  });
});

describe("ending a table for everybody", () => {
  it("is anybody's before the first move", () => {
    expect(mayEnd(table({ moveCount: 0, toPlay: 0 }), 0, AT)).toBe(true);
  });

  it("is refused while the turn is fresh", () => {
    expect(mayEnd(table(), 1, new Date(AT.getTime() + PARTY_TURN_WAIT_MS - 1))).toBe(false);
  });

  it("is anybody else's once the turn has waited a week — never the one who let it wait", () => {
    const later = new Date(AT.getTime() + PARTY_TURN_WAIT_MS);
    expect(mayEnd(table(), 1, later)).toBe(true);
    expect(mayEnd(table(), 0, later)).toBe(false);
  });

  it("is nobody's at a table that is over, or who is not seated", () => {
    expect(mayEnd(table({ status: "finished", toPlay: null }), 0, AT)).toBe(false);
    expect(mayEnd(table(), null, AT)).toBe(false);
  });
});

describe("which browser works out a computer's move", () => {
  const computer = (lastMoverId: string | null, movedAt = AT) => table({ toPlay: 2, kinds: ["member", "member", "computer"], lastMoverId, movedAt });

  it("the one whose move handed it the turn, at once, and no other", () => {
    expect(computerDriver(computer("m1"), "m1", AT)).toBe(true);
    expect(computerDriver(computer("m1"), "m0", AT)).toBe(false);
  });

  it("any member at the table once the turn has waited", () => {
    const later = new Date(AT.getTime() + COMPUTER_TAKEOVER_MS);
    expect(computerDriver(computer("m1"), "m0", later)).toBe(true);
    expect(computerDriver(computer("m1"), "stranger", later)).toBe(false);
  });

  it("nobody when the turn is not a computer's", () => {
    expect(computerDriver(table({ lastMoverId: "m0" }), "m0", AT)).toBe(false);
  });
});

describe("whether a table's page asks, and how fast", () => {
  const view = (toPlay: number | null, mySeat: number, toPlayHere: boolean, status: OnlineStatus = "playing") => ({ status, toPlay, mySeat, toPlayHere });

  it("at the ordinary cadence on the reader's own turn, never hurrying for themselves", () => {
    expect(tableWaits(view(0, 0, true))).toEqual({ polling: true, otherHere: false });
  });

  it("while it waits on somebody else, fast only when they are here", () => {
    expect(tableWaits(view(1, 0, false))).toEqual({ polling: true, otherHere: false });
    expect(tableWaits(view(1, 0, true))).toEqual({ polling: true, otherHere: true });
  });

  it("never once the table is over", () => {
    expect(tableWaits(view(null, 0, false, "finished"))).toEqual({ polling: false, otherHere: false });
    expect(tableWaits(view(null, 0, true, "ended"))).toEqual({ polling: false, otherHere: false });
  });
});

describe("the seats the set-up asks for", () => {
  const rules = { counts: [2, 3, 4], computer: false, links: true, makerId: "me" };

  it("seat 1 is the maker's, and each other seat a buddy, a link or a computer", () => {
    expect(seatAsksRefusal([{ kind: "me" }, { kind: "link" }], rules)).toBeNull();
    expect(seatAsksRefusal([{ kind: "me" }, { kind: "buddy", memberId: "b" }, { kind: "link" }], rules)).toBeNull();
    expect(seatAsksRefusal([{ kind: "link" }, { kind: "me" }], rules)).not.toBeNull();
    expect(seatAsksRefusal([{ kind: "me" }, { kind: "me" }], rules)).not.toBeNull();
  });

  it("as many as the game seats", () => {
    expect(seatAsksRefusal([{ kind: "me" }], rules)).not.toBeNull();
    expect(seatAsksRefusal(Array.from({ length: 5 }, (_, i) => (i === 0 ? { kind: "me" as const } : { kind: "link" as const })), rules)).not.toBeNull();
  });

  it("each buddy once, never the maker", () => {
    expect(seatAsksRefusal([{ kind: "me" }, { kind: "buddy", memberId: "b" }, { kind: "buddy", memberId: "b" }], rules)).not.toBeNull();
    expect(seatAsksRefusal([{ kind: "me" }, { kind: "buddy", memberId: "me" }], rules)).not.toBeNull();
  });

  it("a computer only where the game has one", () => {
    expect(seatAsksRefusal([{ kind: "me" }, { kind: "computer" }], rules)).not.toBeNull();
    expect(seatAsksRefusal([{ kind: "me" }, { kind: "computer" }], { ...rules, computer: true })).toBeNull();
  });

  it("no link for a member under 13, who seats buddies by name", () => {
    expect(seatAsksRefusal([{ kind: "me" }, { kind: "link" }], { ...rules, links: false })).toMatch(/under 13/);
    expect(seatAsksRefusal([{ kind: "me" }, { kind: "buddy", memberId: "b" }], { ...rules, links: false })).toBeNull();
  });

  it("reads a seat as a browser sent it, or nothing", () => {
    expect(readSeatAsk({ kind: "link" })).toEqual({ kind: "link" });
    expect(readSeatAsk({ kind: "buddy", memberId: "abc" })).toEqual({ kind: "buddy", memberId: "abc" });
    expect(readSeatAsk({ kind: "buddy" })).toBeNull();
    expect(readSeatAsk({ kind: "admin" })).toBeNull();
    expect(readSeatAsk("link")).toBeNull();
  });
});
