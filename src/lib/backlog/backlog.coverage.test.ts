import { describe, expect, it } from "vitest";

import { BACKLOG_EFFORT_VALUES, BACKLOG_KIND_VALUES, BACKLOG_PRIORITY_VALUES, BACKLOG_STATUS_VALUES, LEASE_MS, isBacklogStatus, movesFrom } from "./backlog";
import {
  ASKED_BY_MAX,
  BACKLOG_STATUSES,
  CLAIMED_BY_MAX,
  DETAIL_MAX,
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
  TITLE_MAX,
  TITLE_MIN,
} from "./backlog.constants";
import { keyFromTitle } from "./backlogKey";

/**
 * The Board Gate.
 *
 * A board is only worth making a rule out of if every line on it says
 * something. A status no row can be moved out of, or a label nobody wrote, is
 * exactly the lost request the board exists to prevent — so the table of moves
 * and the copy are checked here, and a build fails rather than shipping a board
 * that quietly cannot be used.
 *
 * TypeScript already forces a display entry for every status and kind, because
 * those are `Record<…>`. This covers what the type system cannot see: that the
 * copy is filled in, that no status is a dead end, and that the caps and the
 * keys this code sends are the ones the contract names and Sumilabu enforces.
 *
 * WHAT WENT, AND WHY. This gate also held the starter set — every seeded row a
 * request somebody could act on, with a kebab key that fit its column. The seed
 * was written into an empty local table on first read; the board lives on
 * Sumilabu now and arrives there by import, so there is no seed, no table this
 * code writes, and nothing left for those cases to check. The caps they leaned
 * on are checked below instead.
 *
 * See AGENTS.md, "Board Gate".
 */

const SUMILABU_KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;

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

  it("holds every draft cap to the contract's number, which Sumilabu enforces", () => {
    expect({ TITLE_MIN, TITLE_MAX, DETAIL_MAX, ASKED_BY_MAX, KEY_MAX }).toEqual({
      TITLE_MIN: 8,
      TITLE_MAX: 120,
      DETAIL_MAX: 4000,
      ASKED_BY_MAX: 60,
      KEY_MAX: 80,
    });
  });

  it("derives a key Sumilabu's board accepts from any title, Latin or not", () => {
    for (const title of ["Keyboard shortcut for the scrubber", "  --Fix: the (board) doesn't draw!!  ", "盤面の表示を直す", "x".repeat(200)]) {
      const key = keyFromTitle(title, new Date("2026-09-15T00:00:00Z"));
      expect(key, title).toMatch(SUMILABU_KEY);
      expect(key.length, title).toBeLessThanOrEqual(KEY_MAX);
    }
  });
});

describe("every status is usable", () => {
  /*
   * Board convergence ITS-04: done is the one deliberate exception on both
   * counts, so it is asserted separately rather than folded into the loop
   * with a silent "greater than or equal to zero" — a status that CANNOT be
   * left or reached is meant to read differently from one that merely
   * happens to have few doors.
   */
  const LEAVABLE = BACKLOG_STATUS_VALUES.filter((status) => status !== BACKLOG_STATUSES.done);

  it.each(LEAVABLE)("%s can be left for somewhere else", (status) => {
    expect(movesFrom(status).length).toBeGreaterThan(0);
  });

  it("done can be left by nothing in this table — BOARD_RULES.md invariant 1", () => {
    expect(STATUS_MOVES[BACKLOG_STATUSES.done]).toEqual([]);
  });

  it.each(LEAVABLE)("%s can be reached from somewhere else", (status) => {
    const from = BACKLOG_STATUS_VALUES.filter((other) => other !== status && STATUS_MOVES[other].includes(status));
    expect(from.length).toBeGreaterThan(0);
  });

  it("done is reached by nothing in this table — only the release tool ships a row", () => {
    const from = BACKLOG_STATUS_VALUES.filter((other) => STATUS_MOVES[other].includes(BACKLOG_STATUSES.done));
    expect(from).toEqual([]);
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
