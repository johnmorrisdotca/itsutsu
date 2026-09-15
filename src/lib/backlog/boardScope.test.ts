import { describe, expect, it } from "vitest";

import { BACKLOG_STATUSES, BOARD_SCOPES } from "./backlog.constants";
import type { BacklogItem, StatusFilter } from "./backlog.types";
import { boardQuery, countFor, covers, hrefFor, scopeOf, statusFromAddress } from "./boardScope";

/*
 * What each view of the board asks Sumilabu for. The page read every row on
 * every load; a view now reads its own scope, and a count is said only where
 * its rows were read.
 */

const EVERY_FILTER: StatusFilter[] = ["unfinished", "open", "inProgress", "stale", "done", "dropped", "all"];

const item = (status: BacklogItem["status"], over: Partial<BacklogItem> = {}): BacklogItem => ({
  id: `${status}-${Math.random()}`,
  key: status,
  title: `A ${status} request`,
  detail: "",
  kind: "feature",
  status,
  priority: null,
  effort: null,
  askedBy: "",
  claimedBy: status === "inProgress" ? "op" : null,
  claimedAt: status === "inProgress" ? new Date().toISOString() : null,
  createdAt: "2026-09-14T10:00:00.000Z",
  movedAt: "2026-09-14T10:00:00.000Z",
  releasedIn: null,
  releasedAt: null,
  ...over,
});

describe("the scope a view reads", () => {
  it("reads the unfinished rows for the default view and every filter inside it", () => {
    for (const status of ["unfinished", "open", "inProgress", "stale"] as StatusFilter[]) {
      expect(scopeOf(status), status).toBe(BOARD_SCOPES.unfinished);
    }
  });

  it("reads done rows, dropped rows or everything only for the view that shows them", () => {
    expect(scopeOf("done")).toBe(BOARD_SCOPES.done);
    expect(scopeOf("dropped")).toBe(BOARD_SCOPES.dropped);
    expect(scopeOf("all")).toBe(BOARD_SCOPES.all);
  });

  it("asks Sumilabu for exactly that scope, and for everything only when everything is asked for", () => {
    expect(boardQuery(BOARD_SCOPES.unfinished)).toEqual({ unfinished: true });
    expect(boardQuery(BOARD_SCOPES.done)).toEqual({ statuses: [BACKLOG_STATUSES.done] });
    expect(boardQuery(BOARD_SCOPES.dropped)).toEqual({ statuses: [BACKLOG_STATUSES.dropped] });
    expect(boardQuery(BOARD_SCOPES.all)).toEqual({});
  });

  it("narrows in place only where the rows read already hold the filter", () => {
    expect(covers(BOARD_SCOPES.unfinished, "open")).toBe(true);
    expect(covers(BOARD_SCOPES.unfinished, "stale")).toBe(true);
    expect(covers(BOARD_SCOPES.unfinished, "done")).toBe(false);
    expect(covers(BOARD_SCOPES.unfinished, "all")).toBe(false);
    expect(covers(BOARD_SCOPES.done, "open")).toBe(false);
    for (const status of EVERY_FILTER) expect(covers(BOARD_SCOPES.all, status), status).toBe(true);
    for (const status of EVERY_FILTER) expect(covers(scopeOf(status), status), status).toBe(true);
  });
});

describe("a view's address", () => {
  it("names every filter in plain words, and the default view not at all, both ways round", () => {
    for (const status of EVERY_FILTER) {
      const href = hrefFor("/backlog", status);
      const show = new URL(href, "http://x").searchParams.get("show") ?? undefined;
      expect(statusFromAddress(show), href).toBe(status);
    }
    expect(hrefFor("/backlog", "unfinished")).toBe("/backlog");
    expect(hrefFor("/backlog", "inProgress")).toBe("/backlog?show=in-progress");
  });

  it("keeps Admin's own tab in the address, and takes the filter off again on the way back", () => {
    expect(hrefFor("/admin?view=work", "done")).toBe("/admin?view=work&show=done");
    expect(hrefFor("/admin?view=work&show=done", "unfinished")).toBe("/admin?view=work");
  });

  it("reads an absent, unknown or repeated word as the default view or the first word", () => {
    expect(statusFromAddress(undefined)).toBe("unfinished");
    expect(statusFromAddress("shipped")).toBe("unfinished");
    expect(statusFromAddress("inProgress")).toBe("unfinished");
    expect(statusFromAddress(["done", "all"])).toBe("done");
  });
});

describe("the counts a view may print", () => {
  const unfinished = [item("open"), item("open"), item("inProgress")];

  it("counts what the unfinished read holds, and says nothing of done or dropped rows it never read", () => {
    const scope = BOARD_SCOPES.unfinished;
    expect(countFor(unfinished, scope, "unfinished")).toBe(3);
    expect(countFor(unfinished, scope, "open")).toBe(2);
    expect(countFor(unfinished, scope, "inProgress")).toBe(1);
    expect(countFor(unfinished, scope, "done")).toBeNull();
    expect(countFor(unfinished, scope, "dropped")).toBeNull();
    expect(countFor(unfinished, scope, "all")).toBeNull();
  });

  it("counts everything once everything was read", () => {
    const all = [...unfinished, item("done"), item("dropped"), item("dropped")];
    expect(countFor(all, BOARD_SCOPES.all, "all")).toBe(6);
    expect(countFor(all, BOARD_SCOPES.all, "dropped")).toBe(2);
    expect(countFor(all, BOARD_SCOPES.all, "unfinished")).toBe(3);
  });

  it("says nothing of unfinished rows from a view of done ones", () => {
    const done = [item("done"), item("done")];
    expect(countFor(done, BOARD_SCOPES.done, "done")).toBe(2);
    expect(countFor(done, BOARD_SCOPES.done, "unfinished")).toBeNull();
    expect(countFor(done, BOARD_SCOPES.done, "open")).toBeNull();
  });
});
