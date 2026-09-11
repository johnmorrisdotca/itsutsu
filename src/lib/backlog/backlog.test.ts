import { describe, expect, it } from "vitest";

import {
  canMove,
  draftProblems,
  editProblems,
  filterItems,
  moveProblems,
  revisedDraft,
  isOpen,
  keyFromTitle,
  moveTo,
  movesFrom,
  normalizeDraft,
  openCount,
  releaseStampFor,
  sortItems,
  tally,
} from "./backlog";
import { ASSIGNED_TO_MAX, BACKLOG_KINDS, BACKLOG_STATUSES, DETAIL_MAX, TITLE_MAX, TITLE_MIN } from "./backlog.constants";
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
    // Ungraded unless a case says otherwise, which is how a real row arrives.
    priority: null,
    effort: null,
    status: BACKLOG_STATUSES.open,
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
  it("accepts a short name and a grade the board has", () => {
    expect(editProblems({ assignedTo: "Sora", priority: "high", effort: null })).toEqual([]);
  });

  it("refuses a name longer than a name", () => {
    expect(editProblems({ assignedTo: "x".repeat(ASSIGNED_TO_MAX + 1) })).toHaveLength(1);
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

  it("finishes only what somebody was on", () => {
    expect(canMove("inProgress", "done")).toBe(true);
  });

  it("lets somebody put a thing back down without dropping it", () => {
    // Picking something up and finding it is not for you today is not the
    // same as saying no to it, and the board should be able to say so.
    expect(canMove("inProgress", "open")).toBe(true);
  });

  it("reopens a finished item, and nothing else", () => {
    expect(movesFrom("done")).toEqual(["inProgress"]);
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
    const before = item({ id: "a", status: BACKLOG_STATUSES.inProgress });
    const after = moveTo(before, BACKLOG_STATUSES.done, new Date("2026-09-08T12:00:00.000Z"));
    expect(after).not.toBeNull();
    expect(after?.status).toBe("done");
    expect(after?.movedAt).toBe("2026-09-08T12:00:00.000Z");
    expect(before.status).toBe("inProgress");
    expect(before.movedAt).toBe("2026-09-01T00:00:00.000Z");
  });

  it("refuses an illegal move rather than performing it quietly", () => {
    expect(moveTo(item({ id: "a", status: BACKLOG_STATUSES.open }), BACKLOG_STATUSES.done)).toBeNull();
  });

  it("stamps the running version on a row as it is marked done", () => {
    expect(releaseStampFor(BACKLOG_STATUSES.done, "0.108.2")).toBe("0.108.2");
  });

  it("clears the stamp off a row that leaves done, rather than leaving last time's", () => {
    // The case that matters: a row goes done, is reopened, and must not still
    // claim a release. Nothing has shipped a row that is open again.
    for (const status of Object.values(BACKLOG_STATUSES)) {
      if (status === BACKLOG_STATUSES.done) continue;
      expect(releaseStampFor(status, "0.108.2"), `${status} should carry no release`).toBeNull();
    }
  });

  it("carries the same stamp through a move as the store writes to the row", () => {
    // Two doors into a move, one rule. If these ever disagree the board says
    // one thing on the way through and another once it is reloaded.
    const before = item({ id: "a", status: BACKLOG_STATUSES.inProgress });
    const done = moveTo(before, BACKLOG_STATUSES.done, new Date("2026-09-08T12:00:00.000Z"), "0.108.2");
    expect(done?.releasedIn).toBe(releaseStampFor(BACKLOG_STATUSES.done, "0.108.2"));

    const reopened = moveTo(done!, BACKLOG_STATUSES.inProgress, new Date("2026-09-09T12:00:00.000Z"), "0.109.0");
    expect(reopened?.releasedIn).toBeNull();
  });

  it("counts open and in progress as still wanting something", () => {
    expect(isOpen("open")).toBe(true);
    expect(isOpen("inProgress")).toBe(true);
    expect(isOpen("done")).toBe(false);
    expect(isOpen("dropped")).toBe(false);
  });
});

describe("reading the board", () => {
  const items = [
    item({ id: "a", status: BACKLOG_STATUSES.done, createdAt: "2026-09-01T00:00:00.000Z", movedAt: "2026-09-05T00:00:00.000Z" }),
    item({ id: "b", status: BACKLOG_STATUSES.inProgress, createdAt: "2026-09-02T00:00:00.000Z", movedAt: "2026-09-03T00:00:00.000Z" }),
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
    expect(tally(items)).toEqual({ open: 1, inProgress: 1, done: 1, dropped: 0 });
    expect(openCount(items)).toBe(2);
  });

  it("counts an empty board as every status at zero", () => {
    expect(tally([])).toEqual({ open: 0, inProgress: 0, done: 0, dropped: 0 });
    expect(openCount([])).toBe(0);
  });
});
