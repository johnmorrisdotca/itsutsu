import { describe, expect, it } from "vitest";

import { gamesHref } from "./GameCount";

/*
 * THE 0.133.0 RULE, ON THE BUILDER THAT MISSED IT.
 *
 * "A name shown publicly must be the name the site means to show, in the links
 * as well as in the text." `playerPath` has carried a member's id since then;
 * `gamesHref` — the other function that puts a person in a URL — went on writing
 * `?player=<whole name>` behind every count, so a page reading "Hanako M." carried
 * her surname in the href of every number on it.
 */
describe("gamesHref", () => {
  it("carries a member's id rather than their name when it has one", () => {
    const href = gamesHref({ player: "Hanako Morris", memberId: "cm-hanako", outcome: "won" });
    expect(href).toBe("/history?member=cm-hanako&outcome=won");
    expect(href).not.toContain("Hanako");
    expect(href).not.toContain("Morris");
  });

  it("keeps the rest of what was counted beside the id", () => {
    expect(
      gamesHref({
        variant: "freestyle",
        player: "Hanako Morris",
        memberId: "cm-hanako",
        pool: "people",
        rated: "yes",
      }),
    ).toBe("/games/gomoku/history?member=cm-hanako&pool=people&rated=yes");
  });

  /*
   * A record with nobody behind it — a name typed in at one screen, a record kept
   * from another site — has only its name, so the name is the address.
   */
  it("falls back to the name where there is no member", () => {
    expect(gamesHref({ player: "Someone Typed In", memberId: null })).toBe(
      "/history?player=Someone+Typed+In",
    );
    expect(gamesHref({ player: "Someone Typed In", memberId: "  " })).toBe(
      "/history?player=Someone+Typed+In",
    );
    expect(gamesHref({ player: "Someone Typed In" })).toBe("/history?player=Someone+Typed+In");
  });

  it("names nobody when nobody was counted", () => {
    expect(gamesHref({ variant: "freestyle" })).toBe("/games/gomoku/history");
  });
});
