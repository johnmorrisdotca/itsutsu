import { describe, expect, it } from "vitest";

import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { acceptPreferences, cleanPreferences } from "@/lib/preferences/preferences";

import { FAMILY_FOLD_KEYS, familyOpenAt, foldsFrom, keptFoldsFrom } from "./familyFolds";

describe("the families a reader keeps open", () => {
  it("has a remembered fold for every family and no other", () => {
    // A family added without a row here would open and shut, and never be remembered.
    expect([...FAMILY_FOLD_KEYS].sort()).toEqual(GAME_FAMILIES.map((family) => family.key).sort());
  });

  it("opens a family as it was left, and one never touched by the page's own rule", () => {
    expect(familyOpenAt("shut", 0)).toBe(false);
    expect(familyOpenAt("open", 4)).toBe(true);
    // Never toggled: the first open, the rest shut, as the page has always drawn them.
    expect(familyOpenAt(undefined, 0)).toBe(true);
    expect(familyOpenAt(undefined, 3)).toBe(false);
  });

  it("is kept on the account one family at a time, and nothing else gets in", () => {
    expect(acceptPreferences({ "familyOpen.drops": "shut" })).toEqual({ ok: true, patch: { "familyOpen.drops": "shut" } });
    expect(acceptPreferences({ "familyOpen.nowhere": "shut" }).ok).toBe(false);
    expect(acceptPreferences({ "familyOpen.drops": "ajar" }).ok).toBe(false);
    const stored = { "familyOpen.drops": "shut", "familyOpen.flips": "open", "familyOpen.numbers": "ajar", playersWho: "people" };
    expect(keptFoldsFrom(cleanPreferences(stored))).toEqual({ drops: "shut", flips: "open" });
  });

  it("reads this browser's store whatever it holds", () => {
    expect(foldsFrom({ drops: "shut", nowhere: "open", flips: 3 })).toEqual({ drops: "shut" });
    expect(foldsFrom(null)).toEqual({});
    expect(foldsFrom(["drops"])).toEqual({});
  });
});
