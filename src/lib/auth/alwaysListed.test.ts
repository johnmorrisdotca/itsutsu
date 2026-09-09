import { describe, expect, it } from "vitest";

import { alwaysListed } from "./members";

/**
 * A listing ordered by who was seen last and cut at a limit drops whoever was
 * seen least recently. A computer player is never seen at all — it does not
 * sign in — so its stamp is frozen at the moment it was written, and past the
 * limit all three fall off a page that exists partly to badge them.
 *
 * It had already happened once on the players directory. This is the same
 * shape on the members list, which is the page that gives them their badge.
 */
const row = (id: string) => ({ id });

describe("alwaysListed", () => {
  it("appends the rows that must survive the cut", () => {
    expect(alwaysListed([row("a"), row("b")], [row("kyu")]).map((one) => one.id)).toEqual(["a", "b", "kyu"]);
  });

  it("does not list one twice when it made the cut anyway", () => {
    expect(alwaysListed([row("kyu"), row("a")], [row("kyu")]).map((one) => one.id)).toEqual(["kyu", "a"]);
  });

  it("leaves the order of the cut listing alone", () => {
    // Still what it says it is: most recently seen first, with the fixtures
    // added rather than ranked in among them.
    expect(alwaysListed([row("c"), row("a"), row("b")], []).map((one) => one.id)).toEqual(["c", "a", "b"]);
  });

  it("holds them however long the listing is", () => {
    // The case that only exists past the limit, which no small database
    // reaches and no test would otherwise reach either.
    const crowd = Array.from({ length: 200 }, (_, index) => row(`m${index}`));
    const merged = alwaysListed(crowd, [row("kyu"), row("dan"), row("meijin")]);
    expect(merged).toHaveLength(203);
    for (const bot of ["kyu", "dan", "meijin"]) {
      expect(merged.some((one) => one.id === bot)).toBe(true);
    }
  });
});
