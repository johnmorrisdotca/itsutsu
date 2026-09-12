import { describe, expect, it } from "vitest";

import {
  LEASE_MS,
  canMove,
  draftProblems,
  editProblems,
  filterItems,
  heldNow,
  leaseExpired,
  moveData,
  moveProblems,
  moveWhere,
  revisedDraft,
  isOpen,
  keyFromTitle,
  moveTo,
  movesFrom,
  normalizeDraft,
  openCount,
  sortItems,
  tally,
} from "./backlog";
import { BACKLOG_KINDS, BACKLOG_STATUSES, DETAIL_MAX, STATUS_MOVES, TITLE_MAX, TITLE_MIN } from "./backlog.constants";
import type { BacklogDraft, BacklogItem } from "./backlog.types";

/** An item at a status, with dates far enough apart to sort unambiguously. */
function item(over: Partial<BacklogItem> & { id: string }): BacklogItem {
  return {
    key: over.id,
    title: `Item ${over.id}`,
    detail: "",
    kind: BACKLOG_KINDS.feature,
    // Null unless a case says otherwise: only a row that has been marked done
    // since the column existed carries a version.
    releasedIn: null,
    releasedAt: null,
    // Ungraded unless a case says otherwise, which is how a real row arrives.
    priority: null,
    effort: null,
    status: BACKLOG_STATUSES.open,
    // Unclaimed unless a case says otherwise, which is how a real open row arrives.
    claimedBy: null,
    claimedAt: null,
    askedBy: "John",
    createdAt: "2026-09-01T00:00:00.000Z",
    movedAt: "2026-09-01T00:00:00.000Z",
    ...over,
  };
}

function draft(over: Partial<BacklogDraft> = {}): BacklogDraft {
  return { title: "A remembered board skin", detail: "", kind: BACKLOG_KINDS.feature, askedBy: "John", ...over };
}

describe("keys", () => {
  it("folds a title to kebab case", () => {
    expect(keyFromTitle("Go 囲碁 as a game family of its own")).toBe("go-as-a-game-family-of-its-own");
  });

  it("drops punctuation and never leaves a trailing or leading dash", () => {
    expect(keyFromTitle("  Wikipedia link, and a flag!  ")).toBe("wikipedia-link-and-a-flag");
  });

  it("still gives a key to a title with no Latin letters in it", () => {
    const key = keyFromTitle("囲碁", new Date("2026-09-08T00:00:00.000Z"));
    expect(key.startsWith("item-")).toBe(true);
  });
});

describe("what counts as a real request", () => {
  it("accepts a request that says something", () => {
    expect(draftProblems(draft())).toEqual([]);
  });

  it("refuses a title too short to be a request", () => {
    expect(draftProblems(draft({ title: "fix it" }))).toHaveLength(1);
    expect(draftProblems(draft({ title: "x".repeat(TITLE_MIN) }))).toEqual([]);
  });

  it("refuses a title long enough to be the description", () => {
    expect(draftProblems(draft({ title: "x".repeat(TITLE_MAX + 1) }))).toHaveLength(1);
  });

  it("refuses a kind that is not one of the three", () => {
    expect(draftProblems(draft({ kind: "wish" as BacklogDraft["kind"] }))).toContain(
      "Say whether it is a feature, a fix or a chore.",
    );
  });

  it("trims and collapses what it stores, and derives the key from the trimmed title", () => {
    const clean = normalizeDraft(draft({ title: "  A   remembered   skin ", detail: "  why  ", askedBy: " John " }));
    expect(clean.title).toBe("A remembered skin");
    expect(clean.detail).toBe("why");
    expect(clean.askedBy).toBe("John");
    expect(clean.key).toBe("a-remembered-skin");
  });
});

describe("revising what a row says", () => {
  it("keeps what the revision is silent about and takes what it says", () => {
    const before = item({ id: "a", detail: "why", askedBy: "John" });
    expect(revisedDraft(before, { title: "A clearer title for it" })).toEqual({
      title: "A clearer title for it",
      detail: "why",
      kind: BACKLOG_KINDS.feature,
      askedBy: "John",
    });
  });

  it("is judged by the same rules as a new request", () => {
    const before = item({ id: "a", title: "A request that says something" });
    expect(draftProblems(revisedDraft(before, { detail: "x".repeat(DETAIL_MAX + 1) }))).toHaveLength(1);
    expect(draftProblems(revisedDraft(before, { title: "todo" }))).toHaveLength(1);
    expect(draftProblems(revisedDraft(before, { detail: "x".repeat(DETAIL_MAX) }))).toEqual([]);
  });
});

describe("what may be written about a row directly", () => {
  it("accepts a grade the board has", () => {
    expect(editProblems({ priority: "high", effort: null })).toEqual([]);
  });

  it("refuses a grade the board does not have", () => {
    expect(editProblems({ priority: "urgent" as never })).toHaveLength(1);
    expect(editProblems({ effort: "huge" as never })).toHaveLength(1);
  });

  it("says nothing about a field that was not sent", () => {
    expect(editProblems({})).toEqual([]);
  });
});

describe("moving between statuses", () => {
  it("lets an open item be picked up or turned down", () => {
    expect(canMove("open", "inProgress")).toBe(true);
    expect(canMove("open", "dropped")).toBe(true);
  });

  it("does not let an open item skip straight to done", () => {
    // The point of the table: nothing reaches done without having been built.
    expect(canMove("open", "done")).toBe(false);
  });

  it("says so in words when it refuses, and says nothing when it allows", () => {
    expect(moveProblems("open", "done")).toHaveLength(1);
    expect(moveProblems("open", "inProgress")).toEqual([]);
  });

  /*
   * Board convergence ITS-04: done is the release tool's alone. This table
   * is not how it is reached — canMove/movesFrom answer from STATUS_MOVES,
   * and STATUS_MOVES names nothing that leads to done, on purpose. See
   * `finishItem` in backlogStore.ts, which writes it directly, conditionally,
   * from inProgress only.
   */
  it("does not let in progress reach done through this table either", () => {
    expect(canMove("inProgress", "done")).toBe(false);
  });

  it("lets somebody put a thing back down without dropping it", () => {
    // Picking something up and finding it is not for you today is not the
    // same as saying no to it, and the board should be able to say so.
    expect(canMove("inProgress", "open")).toBe(true);
  });

  it("done can be left by nothing and reached by nothing in this table", () => {
    expect(movesFrom("done")).toEqual([]);
    for (const status of Object.values(BACKLOG_STATUSES)) {
      expect(STATUS_MOVES[status]).not.toContain(BACKLOG_STATUSES.done);
    }
  });

  it("refuses done from every status, not only from open", () => {
    for (const status of Object.values(BACKLOG_STATUSES)) {
      expect(canMove(status, BACKLOG_STATUSES.done), `${status} -> done should be illegal`).toBe(false);
    }
  });

  it("lets a dropped item be asked for again, and it is open like anything else", () => {
    expect(movesFrom("dropped")).toEqual(["open"]);
    expect(canMove("dropped", "inProgress")).toBe(false);
  });

  it("never moves an item to where it already is", () => {
    for (const status of Object.values(BACKLOG_STATUSES)) {
      expect(canMove(status, status)).toBe(false);
    }
  });

  it("returns a new item and leaves the old one exactly as it was", () => {
    const before = item({ id: "a", status: BACKLOG_STATUSES.inProgress, claimedBy: "John", claimedAt: "2026-09-01T00:00:00.000Z" });
    const after = moveTo(before, BACKLOG_STATUSES.open, "John", new Date("2026-09-08T12:00:00.000Z"));
    expect(after).not.toBeNull();
    expect(after?.status).toBe("open");
    expect(after?.movedAt).toBe("2026-09-08T12:00:00.000Z");
    expect(before.status).toBe("inProgress");
    expect(before.movedAt).toBe("2026-09-01T00:00:00.000Z");
  });

  it("refuses an illegal move rather than performing it quietly", () => {
    expect(moveTo(item({ id: "a", status: BACKLOG_STATUSES.open }), BACKLOG_STATUSES.done, "John")).toBeNull();
    // Not even from in progress — see the "done is the release tool's" block above.
    expect(moveTo(item({ id: "a", status: BACKLOG_STATUSES.inProgress }), BACKLOG_STATUSES.done, "John")).toBeNull();
  });

  it("writes the claim on a move to in progress, and previews the same shape the store writes", () => {
    const now = new Date("2026-09-08T12:00:00.000Z");
    const after = moveTo(item({ id: "a", status: BACKLOG_STATUSES.open }), BACKLOG_STATUSES.inProgress, "Sora", now);
    expect(after).toMatchObject({ claimedBy: "Sora", claimedAt: now.toISOString() });
    expect(moveData(BACKLOG_STATUSES.inProgress, "Sora", now)).toMatchObject({ claimedBy: "Sora", claimedAt: now });
  });

  it("clears the claim on every move that is not to in progress", () => {
    const before = item({ id: "a", status: BACKLOG_STATUSES.inProgress, claimedBy: "Sora", claimedAt: "2026-09-01T00:00:00.000Z" });
    for (const to of ["open", "dropped"] as const) {
      const after = moveTo(before, to, "Sora", new Date("2026-09-08T12:00:00.000Z"));
      expect(after).toMatchObject({ claimedBy: null, claimedAt: null });
      expect(moveData(to, "Sora", new Date("2026-09-08T12:00:00.000Z"))).toMatchObject({ claimedBy: null, claimedAt: null });
    }
  });

  it("counts open and in progress as still wanting something", () => {
    expect(isOpen("open")).toBe(true);
    expect(isOpen("inProgress")).toBe(true);
    expect(isOpen("done")).toBe(false);
    expect(isOpen("dropped")).toBe(false);
  });
});

describe("reading the board", () => {
  // b carries a live claim, the same as any real inProgress row would (see
  // BOARD_RULES.md invariant 2) — a nowMs close to its claimedAt is what
  // keeps it held rather than stale in the tests below.
  const items = [
    item({ id: "a", status: BACKLOG_STATUSES.done, createdAt: "2026-09-01T00:00:00.000Z", movedAt: "2026-09-05T00:00:00.000Z" }),
    item({
      id: "b",
      status: BACKLOG_STATUSES.inProgress,
      createdAt: "2026-09-02T00:00:00.000Z",
      movedAt: "2026-09-03T00:00:00.000Z",
      claimedBy: "John",
      claimedAt: "2026-09-03T00:00:00.000Z",
    }),
    item({
      id: "c",
      status: BACKLOG_STATUSES.open,
      kind: BACKLOG_KINDS.fix,
      title: "The scrubber skips a move",
      createdAt: "2026-09-03T00:00:00.000Z",
      movedAt: "2026-09-04T00:00:00.000Z",
    }),
  ];

  it("filters to one status, to everything, and to everything unfinished", () => {
    expect(filterItems(items, { status: "done", kind: "all", text: "" }).map((entry) => entry.id)).toEqual(["a"]);
    expect(filterItems(items, { status: "all", kind: "all", text: "" })).toHaveLength(3);
    // Unfinished is the umbrella: nobody is on c, somebody is on b, and both
    // still want something.
    expect(filterItems(items, { status: "unfinished", kind: "all", text: "" }).map((entry) => entry.id)).toEqual(["b", "c"]);
  });

  it("tells the unfinished umbrella apart from the open status", () => {
    /*
     * These were one word until the board's statuses were renamed, and the
     * day Open became a status the two meanings collided: a chip for "not
     * finished" and a chip for "nobody is on it" cannot both be `open`. The
     * board rendered the same filter twice and the end-to-end suite caught it.
     */
    expect(filterItems(items, { status: "open", kind: "all", text: "" }).map((entry) => entry.id)).toEqual(["c"]);
    expect(filterItems(items, { status: "inProgress", kind: "all", text: "" }).map((entry) => entry.id)).toEqual(["b"]);
  });

  it("filters by kind and by words in the title", () => {
    expect(filterItems(items, { status: "all", kind: "fix", text: "" }).map((entry) => entry.id)).toEqual(["c"]);
    expect(filterItems(items, { status: "all", kind: "all", text: "SCRUBBER" }).map((entry) => entry.id)).toEqual(["c"]);
    expect(filterItems(items, { status: "all", kind: "all", text: "nothing here" })).toEqual([]);
  });

  it("orders by last moved, by age, and by status", () => {
    expect(sortItems(items, "moved").map((entry) => entry.id)).toEqual(["a", "c", "b"]);
    expect(sortItems(items, "newest").map((entry) => entry.id)).toEqual(["c", "b", "a"]);
    expect(sortItems(items, "oldest").map((entry) => entry.id)).toEqual(["a", "b", "c"]);
    // Building first, then proposed, and the finished item last.
    expect(sortItems(items, "status").map((entry) => entry.id)).toEqual(["b", "c", "a"]);
  });

  it("orders without reordering the list it was given", () => {
    const before = items.map((entry) => entry.id);
    sortItems(items, "status");
    expect(items.map((entry) => entry.id)).toEqual(before);
  });

  it("counts every status, zeroes included, and says how many are still open", () => {
    // Just inside b's lease, so it counts as held rather than stale.
    const justAfterClaim = Date.parse("2026-09-03T01:00:00.000Z");
    expect(tally(items, justAfterClaim)).toEqual({ open: 1, inProgress: 1, done: 1, dropped: 0, stale: 0 });
    expect(openCount(items)).toBe(2);
  });

  it("counts an empty board as every status at zero", () => {
    expect(tally([])).toEqual({ open: 0, inProgress: 0, done: 0, dropped: 0, stale: 0 });
    expect(openCount([])).toBe(0);
  });

  it("counts a claim past its lease as stale, not as in progress, though the row is still open", () => {
    // Same row as b, read far enough past its claim for the lease to have lapsed.
    const longAfterClaim = Date.parse("2026-09-03T00:00:00.000Z") + LEASE_MS + 1;
    expect(tally(items, longAfterClaim)).toEqual({ open: 1, inProgress: 0, done: 1, dropped: 0, stale: 1 });
    // Stale is not finished: nobody has said this row is done or dropped.
    expect(openCount(items)).toBe(2);
    expect(filterItems(items, { status: "stale", kind: "all", text: "" }).map((entry) => entry.id)).toEqual(["b"]);
  });
});

describe("a claim's lease", () => {
  it("treats a hold with no time on it as expired", () => {
    expect(leaseExpired(null)).toBe(true);
    expect(leaseExpired(undefined)).toBe(true);
    expect(leaseExpired(new Date())).toBe(false);
  });

  it("is exactly six hours", () => {
    expect(LEASE_MS).toBe(6 * 60 * 60 * 1000);
  });

  it("is not expired at the boundary, and is one millisecond past it", () => {
    const claimedAt = new Date("2026-09-08T00:00:00.000Z");
    const atLease = claimedAt.getTime() + LEASE_MS;
    expect(leaseExpired(claimedAt, atLease)).toBe(false);
    expect(leaseExpired(claimedAt, atLease + 1)).toBe(true);
  });

  it("holds a row only when somebody is named and the lease has not lapsed", () => {
    const now = Date.parse("2026-09-08T06:00:00.000Z");
    expect(heldNow({ claimedBy: "Sora", claimedAt: "2026-09-08T00:00:00.000Z" }, now)).toBe(true);
    expect(heldNow({ claimedBy: null, claimedAt: null }, now)).toBe(false);
    expect(heldNow({ claimedBy: "   ", claimedAt: "2026-09-08T00:00:00.000Z" }, now)).toBe(false);
    // Past the six hours between the claim and "now".
    expect(heldNow({ claimedBy: "Sora", claimedAt: "2026-09-07T23:00:00.000Z" }, now)).toBe(false);
  });

  it("writes the id, the status it was read at, and the three-way OR a database evaluates", () => {
    const staleBefore = new Date("2026-09-08T00:00:00.000Z");
    expect(moveWhere("row-1", "open", "Sora", staleBefore)).toEqual({
      id: "row-1",
      status: "open",
      OR: [{ claimedBy: null }, { claimedBy: "Sora" }, { claimedAt: { lt: staleBefore } }],
    });
  });
});
