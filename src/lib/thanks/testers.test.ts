import { describe, expect, it } from "vitest";

import { BETA_TESTERS, INVITED_COMMUNITIES, communitiesSaid } from "./testers";

describe("the list of beta testers", () => {
  it("names each tester once, with something said about what they did", () => {
    const names = BETA_TESTERS.map((tester) => tester.name.trim().toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    for (const tester of BETA_TESTERS) {
      expect(tester.name.trim(), "a tester with no name").not.toBe("");
      expect(tester.helped.trim(), `${tester.name} is thanked for nothing in particular`).not.toBe("");
      expect(tester.since.trim(), `${tester.name} has no start`).not.toBe("");
    }
  });

  it("says the invited communities as one sentence, every one of them", () => {
    const said = communitiesSaid();
    for (const community of INVITED_COMMUNITIES) expect(said).toContain(community);
    expect(said).toMatch(/ and [^,]+$/);
  });
});
