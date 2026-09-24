import { describe, expect, it } from "vitest";

import { FAMILY_ABSORBED, GAME_FAMILIES, familyKeyNow } from "./families";
import { RULE_VARIANT_LIST } from "./gomoku.constants";
import { heldDistinct, heldKey, type MemberState } from "@/lib/xp/backfillPay";
import { XP_EVENTS } from "@/lib/xp/xp.constants";

/**
 * THE FAMILIES THAT WERE MERGED, AND THE ONE THING A MERGE CAN BREAK.
 *
 * Eleven families became eight on 2026-09-22 (John: "Less categories"), and
 * eight became seven on 2026-09-24 when the races joined Territory to make
 * room for a family of number puzzles. The
 * table itself is easy and nothing here guards the taste of it — which games
 * belong together is the site owner's call, and the titles are display and
 * free to be reworded.
 *
 * What is guarded is the KEY, because a key is a thing somebody has already
 * been paid under. `firstOfFamily` writes the family's key into the XP ledger,
 * once per `(member, type, subject)`, so the day a key leaves `GAME_FAMILIES`
 * there are still rows holding it. Two things follow and both are here:
 *
 *  - a retired key must lead somewhere, or its rows mean nothing;
 *  - anything COUNTING families over those rows must read them forward first,
 *    or a member who has met seven families is paid for meeting eight.
 *
 * The second is not hypothetical. On the live ledger the day this was written,
 * one member held eight `firstOfFamily` rows — every family that had any rows
 * at all — and one of those eight was `captures`, which is now `flips`. Counted
 * raw against the new total of eight, that member completes the tour and is
 * paid 2,000 XP for a family they have never played.
 */
describe("the families that were folded into others", () => {
  it("leaves every retired key leading to a family that exists", () => {
    for (const [gone, home] of Object.entries(FAMILY_ABSORBED)) {
      expect(
        GAME_FAMILIES.some((family) => family.key === gone),
        `${gone} is listed as absorbed and is still a family of its own`,
      ).toBe(false);
      expect(
        GAME_FAMILIES.some((family) => family.key === home),
        `${gone} was folded into ${home}, which is not a family`,
      ).toBe(true);
    }
  });

  it("settles in one step, so no key is folded into another folded key", () => {
    for (const home of Object.values(FAMILY_ABSORBED)) {
      expect(FAMILY_ABSORBED[home], `${home} is both a home and absorbed`).toBeUndefined();
    }
  });

  it("answers a current key with itself and an unknown one unchanged", () => {
    for (const family of GAME_FAMILIES) expect(familyKeyNow(family.key)).toBe(family.key);
    expect(familyKeyNow("a-family-from-some-other-deploy")).toBe("a-family-from-some-other-deploy");
  });

  it("still gives every game exactly one home", () => {
    const homes = new Map<string, string>();
    for (const family of GAME_FAMILIES) {
      for (const game of family.games) {
        expect(homes.get(game), `${game} is in two families`).toBeUndefined();
        homes.set(game, family.key);
      }
    }
    for (const variant of RULE_VARIANT_LIST) {
      expect(homes.get(variant), `${variant} is in no family`).toBeDefined();
    }
  });
});

describe("counting families over rows written before the merge", () => {
  function held(subjects: readonly string[]): MemberState {
    return {
      run: null,
      held: new Set(subjects.map((subject) => heldKey(XP_EVENTS.firstOfFamily, subject))),
      perDay: new Map(),
      counts: new Map([[XP_EVENTS.firstOfFamily, subjects.length]]),
      results: new Map(),
    };
  }

  it("counts two rows for one family as one family", () => {
    /*
     * The live ledger's own shape on the day of the merge: everybody holding
     * `captures` held `flips` as well, so every one of those pairs is a single
     * family now and counting the rows would say two.
     */
    const state = held(["flips", "captures"]);
    expect(heldDistinct(state, XP_EVENTS.firstOfFamily, familyKeyNow)).toBe(1);
  });

  it("counts a member's rows as the families they are today, never as the rows", () => {
    /*
     * The exact member on the live ledger on 2026-09-22: eight rows, one of
     * them retired (`captures`, now `flips`). Counted raw against the eight
     * families of that day, they completed the tour; read forward, they had
     * met seven. The rows are the same today and `races` has since been
     * folded into `territory` as well, so the honest count is whatever the
     * fold table makes of them — which is why it is computed here rather than
     * written down as eight and seven.
     */
    const rows = ["flips", "five-in-a-row", "small-boards", "races", "checkers", "captures", "strange-boards", "drops"];
    const state = held(rows);
    const today = new Set(rows.map(familyKeyNow));
    expect(state.counts.get(XP_EVENTS.firstOfFamily)).toBe(rows.length);
    expect(today.size).toBeLessThan(rows.length);
    expect(heldDistinct(state, XP_EVENTS.firstOfFamily, familyKeyNow)).toBe(today.size);
  });

  it("counts the races and the territory games as one family since they merged", () => {
    const state = held(["races", "territory"]);
    expect(heldDistinct(state, XP_EVENTS.firstOfFamily, familyKeyNow)).toBe(1);
  });

  it("reads rows of another kind past, rather than folding everything it sees", () => {
    const state: MemberState = {
      run: null,
      held: new Set([
        heldKey(XP_EVENTS.firstOfFamily, "captures"),
        heldKey(XP_EVENTS.firstOfVariant, "captures"),
      ]),
      perDay: new Map(),
      counts: new Map(),
      results: new Map(),
    };
    expect(heldDistinct(state, XP_EVENTS.firstOfFamily, familyKeyNow)).toBe(1);
    expect(heldDistinct(state, XP_EVENTS.firstOfVariant, familyKeyNow)).toBe(1);
  });
});
