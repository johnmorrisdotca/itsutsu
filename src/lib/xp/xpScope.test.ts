import { describe, expect, it } from "vitest";

import { RECORD_SCOPES } from "@/lib/rating/recordScope";

import {
  XP_BADGE_SCOPE,
  XP_SCOPE_DEFAULT,
  askedXpScope,
  xpAboveWhere,
  xpForBadge,
  xpOnBoardWhere,
  xpRangeWhere,
  xpScopeHref,
  xpTotalIn,
} from "./xpScope";

describe("how much experience the address asks for", () => {
  it("reads the players page's two answers, and nothing else", () => {
    expect(askedXpScope({ scope: "everywhere" })).toBe(RECORD_SCOPES.everywhere);
    expect(askedXpScope({ scope: "here" })).toBe(RECORD_SCOPES.here);
    expect(askedXpScope({ scope: ["here", "everywhere"] })).toBe(RECORD_SCOPES.here);
    // Null rather than the default, so a remembered choice can stand.
    expect(askedXpScope({})).toBeNull();
    expect(askedXpScope({ scope: "worldwide" })).toBeNull();
  });

  it("opens on Everywhere, and badges from Everywhere", () => {
    expect(XP_SCOPE_DEFAULT).toBe(RECORD_SCOPES.everywhere);
    expect(XP_BADGE_SCOPE).toBe(RECORD_SCOPES.everywhere);
  });
});

describe("the narrowing as the database applies it", () => {
  it("ranks Everywhere by xpEverywhere and Itsutsu only by xp — never the other's column", () => {
    expect(xpOnBoardWhere(RECORD_SCOPES.everywhere)).toEqual({ xpEverywhere: { gt: 0 } });
    expect(xpOnBoardWhere(RECORD_SCOPES.here)).toEqual({ xp: { gt: 0 } });
    expect(xpAboveWhere(RECORD_SCOPES.here, 400)).toEqual({ xp: { gt: 400 } });
    expect(xpRangeWhere(RECORD_SCOPES.everywhere, { from: 50, to: 150 })).toEqual({ xpEverywhere: { gte: 50, lt: 150 } });
    expect(xpRangeWhere(RECORD_SCOPES.here, { from: 999_999, to: null })).toEqual({ xp: { gte: 999_999 } });
  });

  it("reads a member's total the same way", () => {
    const member = { xp: 25, xpEverywhere: 1_008_888 };
    expect(xpTotalIn(member, RECORD_SCOPES.here)).toBe(25);
    expect(xpTotalIn(member, RECORD_SCOPES.everywhere)).toBe(1_008_888);
    expect(xpForBadge(member)).toBe(1_008_888);
  });
});

describe("a chip's address", () => {
  it("keeps the who and the sort, drops the cursor and the count-from, and always names the scope", () => {
    expect(xpScopeHref("/xp", "who=people&sort=name&cursor=abc&from=25", RECORD_SCOPES.here)).toBe("/xp?who=people&sort=name&scope=here");
    expect(xpScopeHref("/xp", "scope=here", RECORD_SCOPES.everywhere)).toBe("/xp?scope=everywhere");
    expect(xpScopeHref("/xp/levels/5", "", RECORD_SCOPES.here)).toBe("/xp/levels/5?scope=here");
  });
});
