import { describe, expect, it } from "vitest";

import { FAMILY_MARKS } from "./FamilyMark";
import { FAMILY_ABSORBED, GAME_FAMILIES } from "@/lib/gomoku/families";

/**
 * EVERY FAMILY HAS A MARK OF ITS OWN.
 *
 * `FamilyMark` falls back to PLAIN — one stone in the middle of a board — for a
 * title it does not know, and that fallback is silent. On /games it would be a
 * mild shame: each family sits beside its own title, screens apart. In the
 * family row on the set-up screen every mark is side by side, and a family
 * drawn as PLAIN there is indistinguishable from any other family drawn as
 * PLAIN. Three families were in exactly that state once and it was found by
 * eye rather than by anything failing.
 *
 * It became a gate the day the families were merged. `MARKS` is keyed by TITLE
 * and a title is display, free to be reworded — so a merge or a rename is
 * precisely the change that drops a family onto the fallback while every other
 * test stays green. Renaming Flips to "Turn and take" would have done it.
 */
describe("every family's mark", () => {
  it("is drawn for the family rather than falling through to the plain one", () => {
    const missing = GAME_FAMILIES.filter((family) => FAMILY_MARKS[family.title] === undefined).map(
      (family) => family.title,
    );
    expect(
      missing,
      "a family with no mark is drawn as one stone on a board, the same picture as every other family without one — add it to FAMILY_MARKS in FamilyMark.tsx",
    ).toEqual([]);
  });

  it("tells every family apart from every other", () => {
    const drawn = GAME_FAMILIES.map((family) => JSON.stringify(FAMILY_MARKS[family.title]));
    expect(new Set(drawn).size, "two families are drawn with the same mark").toBe(GAME_FAMILIES.length);
  });

  /*
   * The other direction is deliberately NOT a rule. A mark for a family that no
   * longer exists is kept on purpose — see the note in FamilyMark.tsx — because
   * it draws a mechanism the family that absorbed it still contains.
   */
  it("keeps the retired families' marks rather than deleting them", () => {
    for (const gone of Object.keys(FAMILY_ABSORBED)) {
      expect(
        GAME_FAMILIES.some((family) => family.key === gone),
        `${gone} is listed as absorbed and is still a family`,
      ).toBe(false);
    }
  });
});
