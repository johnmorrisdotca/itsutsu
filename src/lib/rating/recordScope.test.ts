import { describe, expect, it } from "vitest";

import {
  DEFAULT_SCOPE,
  RECORD_SCOPES,
  readRecordScope,
  scopeHref,
  scopeWorthAsking,
} from "./recordScope";

describe("how much of somebody's playing a page answers about", () => {
  it("answers about everywhere before anybody asks", () => {
    // The reversal, asserted by name: a page that leads with the twenty games
    // played here, over the four thousand played elsewhere, tells the smaller
    // truth first.
    expect(DEFAULT_SCOPE).toBe(RECORD_SCOPES.everywhere);
    expect(readRecordScope(undefined)).toBe(RECORD_SCOPES.everywhere);
  });

  it("narrows to this site when the address asks", () => {
    expect(readRecordScope("here")).toBe(RECORD_SCOPES.here);
    expect(readRecordScope(["here", "everywhere"])).toBe(RECORD_SCOPES.here);
  });

  it("shows the page rather than nothing for an address that makes no sense", () => {
    expect(readRecordScope("everything")).toBe(DEFAULT_SCOPE);
    expect(readRecordScope("")).toBe(DEFAULT_SCOPE);
  });

  it("keeps the open tab when the scope changes, and the scope when the tab does", () => {
    // Two independent questions. Answering one by quietly resetting the other
    // is how a page loses somebody's place.
    expect(scopeHref("/players/john", "goldtoken", RECORD_SCOPES.here)).toBe(
      "/players/john?view=goldtoken&scope=here",
    );
    expect(scopeHref("/players/john", "goldtoken", RECORD_SCOPES.everywhere)).toBe(
      "/players/john?view=goldtoken",
    );
  });

  it("leaves an ordinary player page a bare address", () => {
    expect(scopeHref("/players/john", undefined, RECORD_SCOPES.everywhere)).toBe("/players/john");
    expect(scopeHref("/players/john", "", RECORD_SCOPES.everywhere)).toBe("/players/john");
  });

  it("does not offer the choice where it cannot change the answer", () => {
    /*
     * With one source, both scopes are the same games. A control that cannot
     * change anything is furniture, and worse, it promises a chapter that is
     * not there.
     */
    expect(scopeWorthAsking(0)).toBe(false);
    expect(scopeWorthAsking(1)).toBe(false);
    expect(scopeWorthAsking(2)).toBe(true);
  });
});
