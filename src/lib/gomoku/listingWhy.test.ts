import { describe, expect, it } from "vitest";

import { familyBlurb, listingWhy } from "./familyCopy";
import { GAME_FAMILIES, gamesShownIn } from "./families";

/**
 * A guest on a family's shelf says why it is there, and the Japanese of that
 * sentence is kept by game and by the family whose shelf it is. It was once
 * looked up by the game's home family, which found nothing, so a reader of
 * Japanese was shown the English.
 */
describe("why a game is also on another family's shelf", () => {
  it("reads in Japanese for every guest, found by the shelf it stands on", () => {
    let guests = 0;
    for (const family of GAME_FAMILIES) {
      for (const shown of gamesShownIn(family)) {
        if (shown.listed !== "shelf") continue;
        guests += 1;
        expect(shown.shelf).toBe(family.key);
        expect(listingWhy(shown.variant, shown.shelf, shown.why, "ja"), `${shown.variant} on ${family.key}`).not.toBe(shown.why);
        expect(listingWhy(shown.variant, shown.shelf, shown.why, "en")).toBe(shown.why);
      }
    }
    expect(guests).toBeGreaterThan(0);
    expect(familyBlurb(GAME_FAMILIES[0]!, "en")).toBe(GAME_FAMILIES[0]!.blurb);
  });
});
