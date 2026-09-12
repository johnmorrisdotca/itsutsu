import { describe, expect, it } from "vitest";

import { RULE_VARIANT_LIST } from "./gomoku.constants";
import {
  GAME_SLUGS,
  NO_PACE,
  backgroundPath,
  familyPath,
  gamePath,
  historyPath,
  matchPath,
  myGamePath,
  playPath,
  rulesPath,
  seatPath,
  setUpLink,
  setUpPath,
  slugFor,
  standingsPath,
  variantFor,
} from "./slugs";

describe("game slugs", () => {
  it("gives every variant a slug of its own", () => {
    const slugs = RULE_VARIANT_LIST.map(slugFor);
    expect(new Set(slugs).size).toBe(RULE_VARIANT_LIST.length);
  });

  it("reads like an address: lowercase letters, digits and hyphens only", () => {
    for (const slug of Object.values(GAME_SLUGS)) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("round-trips", () => {
    for (const variant of RULE_VARIANT_LIST) {
      expect(variantFor(slugFor(variant))).toBe(variant);
    }
  });

  it("names plain gomoku by the name people know", () => {
    expect(variantFor("gomoku")).toBe("freestyle");
  });

  it("names nothing for an address that is not a game", () => {
    expect(variantFor("freestyle")).toBeNull();
    expect(variantFor("")).toBeNull();
    expect(variantFor("Gomoku")).toBeNull();
  });

  /**
   * A game is one address, and every one of these hangs under it.
   *
   * Written out in full rather than checked by a rule, because the point of
   * the scheme is the exact words in the bar: /games/gomoku/rules reads as a
   * fact about Gomoku, and /rules/gomoku read as a fact about rules. The three
   * namespaces this replaced — /rules/<slug>, /history/<slug> and
   * /champions/<slug> — each had an index of its own, and a reader who reached
   * any one of them had to know the other two existed.
   */
  it("hangs every facet of a game under the game", () => {
    expect(gamePath("freestyle")).toBe("/games/gomoku");
    expect(rulesPath("blockFive")).toBe("/games/block-five/rules");
    expect(historyPath("freestyle")).toBe("/games/gomoku/history");
    expect(myGamePath("freestyle")).toBe("/games/gomoku/me");
    expect(standingsPath("freestyle")).toBe("/games/gomoku/standings");
    expect(familyPath("freestyle")).toBe("/games/gomoku/family");
    expect(backgroundPath("freestyle")).toBe("/games/gomoku/background");
  });

  /*
   * Playing is a verb under the game, not the game itself. /games/<slug> used
   * to BE a board, which made every reference to a game an instruction to
   * start one.
   */
  it("puts the two ways onto a board under the game as well", () => {
    expect(playPath("freestyle")).toBe("/games/gomoku/play");
    expect(setUpPath("freestyle")).toBe("/games/gomoku/new");
  });

  /*
   * ONE ADDRESS FOR A MATCH, live or filed. It was /games/<slug>/<id> while
   * being played and /history/<slug>/<id> afterwards, so every link anybody
   * sent changed meaning the day the game finished.
   */
  it("gives a match one address, and a position under it", () => {
    expect(matchPath("dropFour", "abc")).toBe("/games/drop-four/match/abc");
    expect(matchPath("dropFour", "abc", 12)).toBe("/games/drop-four/match/abc/12");
    expect(seatPath("renju", "abc", "tok")).toBe("/games/renju/match/abc/seat/tok");
  });

  /*
   * The `match` segment is what makes the facets possible at all: without it,
   * /games/gomoku/rules is indistinguishable from a match whose id is "rules".
   */
  it("keeps match ids out of the facet names", () => {
    expect(matchPath("freestyle", "rules")).toBe("/games/gomoku/match/rules");
    expect(matchPath("freestyle", "rules")).not.toBe(rulesPath("freestyle"));
  });
});

/**
 * WHAT THE SETUP SCREEN IS HANDED, AND HOW.
 *
 * Every way of starting a game leads to that screen now, and each arrives
 * knowing a different amount. The facts travel in the query so that a
 * pre-filled screen is a plain address — linkable, readable, and nameable by a
 * spec — and the GAME stays in the path, because identity belongs there.
 */
describe("the way to the setup screen", () => {
  it("is /games/new when the game is still to choose", () => {
    expect(setUpLink({})).toBe("/games/new");
  });

  it("names the game in the path when the game is settled", () => {
    expect(setUpLink({ variant: "reversi" })).toBe("/games/reversi/new");
    expect(setUpLink({ variant: "freestyle" })).toBe("/games/gomoku/new");
  });

  /*
   * By id, never by address. A computer player has no address at all, and a
   * member's address in a query string is one in a history, a referrer and
   * anything pasted to a friend.
   */
  it("carries an opponent by member id", () => {
    expect(setUpLink({ against: "mem_123" })).toBe("/games/new?against=mem_123");
  });

  /*
   * A REMATCH LEAVES THE GAME OUT OF THE PATH ON PURPOSE. /games/new is where
   * the game is still a choice, which is the whole of John's "I want to play
   * Bob at Reversi, but I want to try that variant" — a rematch that locked the
   * game because its address named one could not offer that.
   */
  it("leaves a rematch's game out of the path, so the game can still be changed", () => {
    expect(setUpLink({ rematch: "g1" })).toBe("/games/new?rematch=g1");
    expect(setUpLink({ rematch: "g1" })).not.toContain("/games/gomoku/");
  });

  /*
   * A FORK'S GAME IS IN THE PATH, for the opposite reason: the position it
   * carries belongs to the game it was played in, so naming another game would
   * not be a preference, it would be nonsense.
   */
  it("names a fork's game, and how far in", () => {
    expect(setUpLink({ variant: "renju", from: { id: "g2", move: 12 } })).toBe(
      "/games/renju/new?from=g2&move=12",
    );
  });

  it("clamps a fork's move to something the page can read back", () => {
    expect(setUpLink({ from: { id: "g", move: -4 } })).toContain("move=0");
    expect(setUpLink({ from: { id: "g", move: 1.7 } })).toContain("move=1");
    expect(setUpLink({ from: { id: "g", move: 99_999 } })).toContain("move=4096");
  });

  it("carries a board and a pace somebody has already asked for", () => {
    expect(setUpLink({ variant: "freestyle", board: 19, pace: 300_000 })).toBe(
      "/games/gomoku/new?board=19&pace=300000",
    );
  });

  /*
   * "No clock" and "nobody said" are different answers, and an absent
   * parameter can only carry the second. So a game with no clock says so.
   */
  it("says no clock out loud rather than by leaving it out", () => {
    expect(setUpLink({ variant: "freestyle", pace: NO_PACE })).toBe("/games/gomoku/new?pace=none");
    expect(setUpLink({ variant: "freestyle" })).not.toContain("pace");
  });

  it("carries everything at once, for the sentence that knows everything", () => {
    const link = setUpLink({ variant: "reversi", against: "mem_9", board: 8, pace: NO_PACE });
    expect(link.startsWith("/games/reversi/new?")).toBe(true);
    expect(link).toContain("against=mem_9");
    expect(link).toContain("board=8");
    expect(link).toContain("pace=none");
  });

  /* An empty id is nobody, and must not become `?against=`. */
  it("says nothing rather than saying an empty thing", () => {
    expect(setUpLink({ against: "" })).toBe("/games/new");
    expect(setUpLink({ rematch: "" })).toBe("/games/new");
  });
});
