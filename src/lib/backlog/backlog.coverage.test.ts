import { describe, expect, it } from "vitest";

import { BACKLOG_EFFORT_VALUES, BACKLOG_KIND_VALUES, BACKLOG_PRIORITY_VALUES, BACKLOG_STATUS_VALUES, LEASE_MS, draftProblems, isBacklogKind, isBacklogStatus, movesFrom } from "./backlog";
import {
  CLAIMED_BY_MAX,
  KEY_MAX,
  KIND_DISPLAY,
  EFFORT_DISPLAY,
  EFFORT_ORDER,
  OPEN_STATUSES,
  PRIORITY_DISPLAY,
  PRIORITY_ORDER,
  SORT_DISPLAY,
  STATUS_DISPLAY,
  STATUS_MOVES,
  STATUS_ORDER,
} from "./backlog.constants";
import { BACKLOG_SEED } from "./backlog.seed.data";

/**
 * The Board Gate.
 *
 * A board is only worth making a rule out of if every line on it says
 * something. A row with "todo" for a title, or with no status anyone can move
 * it out of, is exactly the lost request the board exists to prevent — so the
 * same checks the add form and the API route make are made here over the
 * starter set and over the status table itself, and a build fails rather than
 * shipping a board that quietly cannot be used.
 *
 * TypeScript already forces a display entry for every status and kind, because
 * those are `Record<…>`. This covers what the type system cannot see: that the
 * copy is filled in, that no status is a dead end, and that every seeded row
 * is a request a person could act on.
 *
 * See AGENTS.md, "Board Gate".
 */

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("the claim contract in BOARD_RULES.md", () => {
  // These two numbers are the ones BOARD_RULES.md invariant 3 and 6 name.
  // Itsutsu and UmaKuma both copy them verbatim; a change here is a change to
  // the contract file in both repositories, in the same pass, not a value
  // tuned for this board alone.
  it("holds a claim for exactly six hours", () => {
    expect(LEASE_MS).toBe(6 * 60 * 60 * 1000);
  });

  it("caps a claimant's name at 80, matching the database column", () => {
    expect(CLAIMED_BY_MAX).toBe(80);
  });
});

describe("every status is usable", () => {
  it.each(BACKLOG_STATUS_VALUES)("%s can be left for somewhere else", (status) => {
    expect(movesFrom(status).length).toBeGreaterThan(0);
  });

  it.each(BACKLOG_STATUS_VALUES)("%s can be reached from somewhere else", (status) => {
    const from = BACKLOG_STATUS_VALUES.filter((other) => other !== status && STATUS_MOVES[other].includes(status));
    expect(from.length).toBeGreaterThan(0);
  });

  it.each(BACKLOG_STATUS_VALUES)("%s never leads to itself", (status) => {
    expect(STATUS_MOVES[status]).not.toContain(status);
  });

  it.each(BACKLOG_STATUS_VALUES)("%s only leads to statuses that exist", (status) => {
    for (const to of STATUS_MOVES[status]) expect(isBacklogStatus(to)).toBe(true);
  });

  it("orders every status exactly once, so 'by status' can show all of them", () => {
    expect([...STATUS_ORDER].sort()).toEqual([...BACKLOG_STATUS_VALUES].sort());
  });

  it("calls open and in progress the ones still wanting something", () => {
    expect([...OPEN_STATUSES].sort()).toEqual(["inProgress", "open"]);
  });
});

describe("every grade is spelled out for a reader", () => {
  /*
   * Held to the same standard as a status, for the same reason: a grade with
   * a label nobody wrote is a column of words that mean whatever the reader
   * guesses. TypeScript forces a row per value; this checks it says something.
   */
  it.each(BACKLOG_PRIORITY_VALUES)("priority %s has a label, a kanji and a blurb", (priority) => {
    const copy = PRIORITY_DISPLAY[priority];
    expect(copy.label.length).toBeGreaterThan(2);
    expect(copy.kanji.length).toBeGreaterThan(0);
    expect(copy.blurb.length).toBeGreaterThan(12);
    expect(copy.pill.length).toBeGreaterThan(0);
  });

  it.each(BACKLOG_EFFORT_VALUES)("effort %s has a label, a kanji and a blurb", (effort) => {
    const copy = EFFORT_DISPLAY[effort];
    expect(copy.label.length).toBeGreaterThan(2);
    expect(copy.kanji.length).toBeGreaterThan(0);
    expect(copy.blurb.length).toBeGreaterThan(12);
    expect(copy.pill.length).toBeGreaterThan(0);
  });

  it("orders every grade, so a sort can read straight down it", () => {
    // A value missing from the order would sort as ungraded and quietly sink.
    expect([...PRIORITY_ORDER].sort()).toEqual([...BACKLOG_PRIORITY_VALUES].sort());
    expect([...EFFORT_ORDER].sort()).toEqual([...BACKLOG_EFFORT_VALUES].sort());
  });
});

describe("every status and kind is spelled out for a reader", () => {
  it.each(BACKLOG_STATUS_VALUES)("%s has a label, a name in kanji, a blurb and a pill", (status) => {
    const copy = STATUS_DISPLAY[status];
    expect(copy.label.length).toBeGreaterThan(2);
    expect(copy.kanji.length).toBeGreaterThan(0);
    expect(copy.blurb.length).toBeGreaterThan(10);
    expect(copy.pill).toContain("border-");
  });

  it.each(BACKLOG_KIND_VALUES)("%s has a label and a name in kanji", (kind) => {
    expect(KIND_DISPLAY[kind].label.length).toBeGreaterThan(2);
    expect(KIND_DISPLAY[kind].kanji.length).toBeGreaterThan(0);
  });

  it("names every ordering the board offers", () => {
    for (const label of Object.values(SORT_DISPLAY)) expect(label.length).toBeGreaterThan(2);
  });
});

describe("the starter set is a board, not a list of stubs", () => {
  it.each(BACKLOG_SEED.map((item) => [item.key, item] as const))("%s is a request somebody could act on", (_key, item) => {
    expect(draftProblems({ title: item.title, detail: item.detail, kind: item.kind, askedBy: item.askedBy })).toEqual([]);
    // A seeded row is a summary of a conversation nobody else was in: it has to say more than its title.
    expect(item.detail.length).toBeGreaterThan(40);
    expect(item.askedBy.trim()).not.toBe("");
    expect(isBacklogStatus(item.status)).toBe(true);
    expect(isBacklogKind(item.kind)).toBe(true);
  });

  it.each(BACKLOG_SEED.map((item) => item.key))("%s is a kebab-case key that fits the column", (key) => {
    expect(key).toMatch(KEBAB);
    expect(key.length).toBeLessThanOrEqual(KEY_MAX);
  });

  it("has no two rows with the same key or the same title", () => {
    expect(new Set(BACKLOG_SEED.map((item) => item.key)).size).toBe(BACKLOG_SEED.length);
    expect(new Set(BACKLOG_SEED.map((item) => item.title.toLowerCase())).size).toBe(BACKLOG_SEED.length);
  });

  it("still has open items — a board with nothing wanted on it is a changelog", () => {
    const open = BACKLOG_SEED.filter((item) => OPEN_STATUSES.includes(item.status));
    expect(open.length).toBeGreaterThan(3);
  });
});
