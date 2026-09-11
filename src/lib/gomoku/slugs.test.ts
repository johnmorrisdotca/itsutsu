import { describe, expect, it } from "vitest";

import { RULE_VARIANT_LIST } from "./gomoku.constants";
import {
  GAME_SLUGS,
  backgroundPath,
  familyPath,
  gamePath,
  historyPath,
  matchPath,
  myGamePath,
  playPath,
  rulesPath,
  seatPath,
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
