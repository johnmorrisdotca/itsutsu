import { describe, expect, it } from "vitest";

import {
  canMove,
  draftProblems,
  filterItems,
  isOpen,
  keyFromTitle,
  moveTo,
  movesFrom,
  normalizeDraft,
  openCount,
  sortItems,
  tally,
} from "./backlog";
import { BACKLOG_KINDS, BACKLOG_STATUSES, TITLE_MAX, TITLE_MIN } from "./backlog.constants";
import type { BacklogDraft, BacklogItem } from "./backlog.types";

/** An item at a status, with dates far enough apart to sort unambiguously. */
function item(over: Partial<BacklogItem> & { id: string }): BacklogItem {
  return {
    key: over.id,
    title: `Item ${over.id}`,
    detail: "",
    kind: BACKLOG_KINDS.feature,
    status: BACKLOG_STATUSES.proposed,
    assignedTo: "",
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

describe("moving between statuses", () => {
  it("lets a proposal be agreed, started, or turned down", () => {
    expect(canMove("proposed", "planned")).toBe(true);
    expect(canMove("proposed", "building")).toBe(true);
    expect(canMove("proposed", "dropped")).toBe(true);
  });

  it("does not let a proposal skip straight to done", () => {
    expect(canMove("proposed", "done")).toBe(false);
    expect(canMove("planned", "done")).toBe(false);
  });

  it("finishes only what was being built", () => {
    expect(canMove("building", "done")).toBe(true);
  });

  it("reopens a finished item, and nothing else", () => {
    expect(movesFrom("done")).toEqual(["building"]);
  });

  it("lets a dropped item be asked for again, as a proposal", () => {
    expect(movesFrom("dropped")).toEqual(["proposed"]);
    expect(canMove("dropped", "building")).toBe(false);
  });

  it("never moves an item to where it already is", () => {
    for (const status of Object.values(BACKLOG_STATUSES)) {
      expect(canMove(status, status)).toBe(false);
    }
  });

  it("returns a new item and leaves the old one exactly as it was", () => {
    const before = item({ id: "a", status: BACKLOG_STATUSES.building });
    const after = moveTo(before, BACKLOG_STATUSES.done, new Date("2026-09-08T12:00:00.000Z"));
    expect(after).not.toBeNull();
    expect(after?.status).toBe("done");
    expect(after?.movedAt).toBe("2026-09-08T12:00:00.000Z");
    expect(before.status).toBe("building");
    expect(before.movedAt).toBe("2026-09-01T00:00:00.000Z");
  });

  it("refuses an illegal move rather than performing it quietly", () => {
    expect(moveTo(item({ id: "a", status: BACKLOG_STATUSES.proposed }), BACKLOG_STATUSES.done)).toBeNull();
  });

  it("counts proposed, planned and building as still wanting something", () => {
    expect(isOpen("proposed")).toBe(true);
    expect(isOpen("planned")).toBe(true);
    expect(isOpen("building")).toBe(true);
    expect(isOpen("done")).toBe(false);
    expect(isOpen("dropped")).toBe(false);
  });
});

describe("reading the board", () => {
  const items = [
    item({ id: "a", status: BACKLOG_STATUSES.done, createdAt: "2026-09-01T00:00:00.000Z", movedAt: "2026-09-05T00:00:00.000Z" }),
    item({ id: "b", status: BACKLOG_STATUSES.building, createdAt: "2026-09-02T00:00:00.000Z", movedAt: "2026-09-03T00:00:00.000Z" }),
    item({
      id: "c",
      status: BACKLOG_STATUSES.proposed,
      kind: BACKLOG_KINDS.fix,
      title: "The scrubber skips a move",
      createdAt: "2026-09-03T00:00:00.000Z",
      movedAt: "2026-09-04T00:00:00.000Z",
    }),
  ];

  it("filters to one status, to everything, and to everything unfinished", () => {
    expect(filterItems(items, { status: "done", kind: "all", text: "" }).map((entry) => entry.id)).toEqual(["a"]);
    expect(filterItems(items, { status: "all", kind: "all", text: "" })).toHaveLength(3);
    expect(filterItems(items, { status: "open", kind: "all", text: "" }).map((entry) => entry.id)).toEqual(["b", "c"]);
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
    expect(tally(items)).toEqual({ proposed: 1, planned: 0, building: 1, done: 1, dropped: 0 });
    expect(openCount(items)).toBe(2);
  });

  it("counts an empty board as every status at zero", () => {
    expect(tally([])).toEqual({ proposed: 0, planned: 0, building: 0, done: 0, dropped: 0 });
    expect(openCount([])).toBe(0);
  });
});
