import { describe, expect, it } from "vitest";

import { forkOffered } from "./fork";

/**
 * The whole truth table: two booleans in, one out, so four rows are every
 * case there is. `move` and `last` stand in for "mid-history" — a fixed pair
 * (5 of 12) reads better than 0/1, which could look like an off-by-one guard
 * rather than "well before the end".
 */
describe("forkOffered", () => {
  it.each([
    { move: 5, last: 12, seated: true, offered: true },
    { move: 5, last: 12, seated: false, offered: false },
    { move: 12, last: 12, seated: true, offered: false },
    { move: 12, last: 12, seated: false, offered: false },
  ])("move $move of $last, seated=$seated -> offered=$offered", ({ move, last, seated, offered }) => {
    expect(forkOffered({ move, last, seated })).toBe(offered);
  });

  it("appears the moment a reader scrubs back a single move", () => {
    expect(forkOffered({ move: 11, last: 12, seated: true })).toBe(true);
  });
});
