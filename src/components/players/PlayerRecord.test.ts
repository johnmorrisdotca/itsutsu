import { describe, expect, it } from "vitest";

import { playedScopeNote } from "./PlayerRecord";

/**
 * What "Played" counts, said on hover, from the same `of` the numbers under
 * it are filtered by.
 *
 * On `/players`, the Ladder tab counts rated games in the people pool and the
 * Members tab counts every finished game, under the identical "Played"
 * heading `RecordHeadings` draws for both. For the same person that was 5 on
 * one tab and 14 on the other, one click apart, with nothing on either page
 * saying the two counted different things. The Ladder's scope is correct — a
 * ladder is inherently rated — so this only has to make it legible, the same
 * way the streak cell's hover already words its own scope from `of`.
 */
describe("playedScopeNote says what a table's Played column actually counts", () => {
  it("names the pool and rated-ness the ladder counts", () => {
    const note = playedScopeNote({ pool: "people", rated: "yes" });
    expect(note).toMatch(/rated/i);
    expect(note).toMatch(/other people/i);
  });

  it("names the computer pool for the Computers tab's scope", () => {
    const note = playedScopeNote({ pool: "computer", rated: "yes" });
    expect(note).toMatch(/computer players/i);
  });

  it("says a kept record has nothing here to open, same as the streak cell does", () => {
    const note = playedScopeNote({ here: false });
    expect(note).toMatch(/another site|no games here/i);
  });
});
