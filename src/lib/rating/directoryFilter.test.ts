import { describe, expect, it } from "vitest";

import {
  AWAY_AFTER_DAYS,
  DIRECTORY_WHO,
  filterBarHref,
  NO_FILTER,
  directoryQuery,
  filterDirectory,
  readDirectoryFilter,
  type FilterableEntry,
} from "./directoryFilter";

const NOW = new Date("2026-09-09T12:00:00Z").getTime();
const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

const person = (over: Partial<FilterableEntry> = {}): FilterableEntry => ({
  botTier: null,
  lastSeenAt: daysAgo(1),
  profile: { tier: "established" },
  ...over,
});
const computer = (over: Partial<FilterableEntry> = {}): FilterableEntry =>
  person({ botTier: "kyu", lastSeenAt: daysAgo(400), ...over });

describe("reading a filter off the address", () => {
  it("shows everybody when nothing is asked for, computer players included", () => {
    /*
     * The default used to be `people`, so that a filter changed nothing until
     * somebody asked it to. It hid the five computer players behind a control
     * nobody had reason to touch, on a site whose difficulty is that nobody is
     * about. Asserted by name and not only against NO_FILTER, so that moving
     * the default again has to be done on purpose here too.
     */
    expect(readDirectoryFilter({})).toEqual(NO_FILTER);
    expect(readDirectoryFilter({}).who).toBe(DIRECTORY_WHO.everyone);
  });

  it("takes the three answers it knows", () => {
    expect(readDirectoryFilter({ who: "computers" }).who).toBe(DIRECTORY_WHO.computers);
    expect(readDirectoryFilter({ who: "everyone" }).who).toBe(DIRECTORY_WHO.everyone);
    expect(readDirectoryFilter({ settled: "1", active: "1" })).toMatchObject({ settled: true, active: true });
  });

  it("falls back rather than showing nothing, for an address that makes no sense", () => {
    // A mistyped address should show the page, not an apparently deserted site.
    expect(readDirectoryFilter({ who: "robots" }).who).toBe(DIRECTORY_WHO.everyone);
    expect(readDirectoryFilter({ settled: "yes" }).settled).toBe(false);
  });

  it("reads back as the address it came from, with the defaults left off", () => {
    expect(directoryQuery(NO_FILTER)).toBe("");
    const asked = { who: DIRECTORY_WHO.everyone, settled: true, active: false } as const;
    expect(readDirectoryFilter(Object.fromEntries(new URLSearchParams(directoryQuery(asked))))).toEqual(asked);
  });
});

describe("narrowing the directory", () => {
  it("leaves the programs out of a list of people, and the people out of a list of programs", () => {
    const rows = [person(), computer()];
    expect(filterDirectory(rows, { ...NO_FILTER, who: DIRECTORY_WHO.people }, NOW)).toHaveLength(1);
    expect(filterDirectory(rows, { ...NO_FILTER, who: DIRECTORY_WHO.computers }, NOW)).toEqual([rows[1]]);
    expect(filterDirectory(rows, { ...NO_FILTER, who: DIRECTORY_WHO.everyone }, NOW)).toHaveLength(2);
  });

  it("drops a rating that has not settled, when asked", () => {
    const rows = [person(), person({ profile: { tier: "provisional" } }), person({ profile: null })];
    expect(filterDirectory(rows, { ...NO_FILTER, settled: true }, NOW)).toEqual([rows[0]]);
  });

  it("drops somebody nobody has seen for a month, when asked", () => {
    const rows = [person(), person({ lastSeenAt: daysAgo(AWAY_AFTER_DAYS + 1) })];
    expect(filterDirectory(rows, { ...NO_FILTER, active: true }, NOW)).toEqual([rows[0]]);
  });

  it("never puts a computer player away for being unseen", () => {
    /*
     * The case that would have made this filter quietly wrong. A program does
     * not sign in, so its stamp is frozen at the moment it was written and
     * every away test puts it away for ever — "seen lately" would have emptied
     * the computers list on any site older than a month.
     */
    const rows = [computer({ lastSeenAt: daysAgo(400) })];
    const asked = { ...NO_FILTER, who: DIRECTORY_WHO.computers, active: true };
    expect(filterDirectory(rows, asked, NOW)).toEqual(rows);
  });

  it("asks every question at once", () => {
    const rows = [
      person(),
      person({ profile: { tier: "unrated" } }),
      person({ lastSeenAt: daysAgo(90) }),
      computer(),
    ];
    const asked = { who: DIRECTORY_WHO.everyone, settled: true, active: true };
    // The settled program stays; the unrated and the long-gone person do not.
    expect(filterDirectory(rows, asked, NOW)).toEqual([rows[0], rows[3]]);
  });
});

/**
 * The bar's own links, which are not the same as an address a person types.
 *
 * A bare /players means "however I last asked", so a link that leaves the
 * default off is not asking for the default — it is asking for whatever was
 * remembered. That made the Everyone button dead while narrowed to People:
 * it produced /players, the cookie answered People, and nothing appeared to
 * happen.
 */
describe("filterBarHref", () => {
  it("says who even when who is the default", () => {
    // The whole bug in one assertion: this must not be a bare /players.
    expect(filterBarHref(NO_FILTER)).toBe(`/players?who=${DIRECTORY_WHO.everyone}`);
  });

  it("says who for a narrowing too, so every button reads the same way", () => {
    expect(filterBarHref({ ...NO_FILTER, who: DIRECTORY_WHO.people })).toBe(
      `/players?who=${DIRECTORY_WHO.people}`,
    );
  });

  it("carries the other two narrowings when they are on", () => {
    const href = filterBarHref({ who: DIRECTORY_WHO.computers, settled: true, active: true });
    expect(href).toContain(`who=${DIRECTORY_WHO.computers}`);
    expect(href).toContain("settled=1");
    expect(href).toContain("active=1");
  });

  it("leaves them off when they are off, which the address then reads as off", () => {
    /*
     * Safe only because `who` is always present: once the address says
     * anything about narrowing, the whole filter is read from the address, so
     * an absent settled means off rather than remembered.
     */
    const href = filterBarHref({ ...NO_FILTER, settled: false, active: false });
    expect(href).not.toContain("settled");
    expect(href).not.toContain("active");
  });

  /*
   * ONE CONTROL MUST NOT UNDO ANOTHER, which this bar did the day the directory
   * learned to sort.
   *
   * It built a fresh query of who/settled/active and nothing else. That was
   * harmless while those three were the whole of what /players could say, and it
   * became a silent reversal the moment there was an order to lose: press
   * Played, then press People, and the list goes back to who was seen last with
   * nothing saying so. It is the same fault `sortHref` is careful about from the
   * other side, and the same one `scopeHrefFrom` was given the whole query for.
   *
   * Every one of the four cases above still passes with no query at all, which
   * is why none of them could have caught it.
   */
  it("keeps the order a heading was just pressed for", () => {
    const href = filterBarHref(
      { ...NO_FILTER, who: DIRECTORY_WHO.people },
      "view=members&sort=played%3Adesc",
    );
    expect(href).toContain("sort=played%3Adesc");
    expect(href).toContain("view=members");
    expect(href).toContain(`who=${DIRECTORY_WHO.people}`);
  });

  it("replaces the narrowing already on the address rather than saying it twice", () => {
    const href = filterBarHref(
      { ...NO_FILTER, who: DIRECTORY_WHO.computers, active: true },
      `who=${DIRECTORY_WHO.people}&settled=1`,
    );
    const asked = new URLSearchParams(href.split("?")[1]);
    expect(asked.getAll("who")).toEqual([DIRECTORY_WHO.computers]);
    expect(asked.get("settled")).toBe(null);
    expect(asked.get("active")).toBe("1");
  });

  it("drops the cursor, because a page of the old narrowing is not a page of this one", () => {
    /*
     * The same reasoning `sortHref` gives for dropping it: a cursor is a
     * position in the list as it was, and carrying it into a different
     * narrowing opens the middle of a list and calls it the top. A reader who
     * pressed People on page four would land on rows that were never page one
     * of anything.
     */
    const href = filterBarHref({ ...NO_FILTER }, "cursor=abc123&page=4&sort=name%3Aasc");
    expect(href).not.toContain("cursor");
    expect(href).not.toContain("page=");
    expect(href).toContain("sort=name%3Aasc");
  });
});
