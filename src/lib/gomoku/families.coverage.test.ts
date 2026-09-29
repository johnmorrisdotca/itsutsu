import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { gameKeyFor } from "./slugs";
import { GAME_FAMILIES, HOME_FAMILIES, familyCountWords, familyPagePath, gamesShownIn } from "./families";

/**
 * A SHELF OF GUESTS IS STILL A FAMILY A READER CAN OPEN.
 *
 * Party games (2026-09-28) was the first family with no game at home in it:
 * every game on its shelf lives in the family that says what kind of game it
 * is, and is listed here for the table that can play it on one device. A
 * family page is otherwise found under one of its own games, so a family with
 * none needs an address of its own, and these hold the few things that has to
 * mean — or its card on the front page leads nowhere.
 */
const shelvesOnly = GAME_FAMILIES.filter((family) => family.games.length === 0);

describe("a family with no game at home in it", () => {
  it("exists, so the rest of this is about something", () => {
    expect(shelvesOnly.map((family) => family.key)).toContain("party");
  });

  it("has a page of its own at /games/<key>, which no game's address can be", () => {
    for (const family of shelvesOnly) {
      expect(familyPagePath(family)).toBe(`/games/${family.key}`);
      expect(existsSync(join("src/app/games", family.key, "page.tsx")), `${family.title} has no page`).toBe(true);
      expect(gameKeyFor(family.key), `${family.key} is also a game's address`).toBeNull();
    }
  });

  it("shows at least one game, and says it is from another family", () => {
    for (const family of shelvesOnly) {
      const shelf = gamesShownIn(family);
      expect(shelf.length, `${family.title} shows nothing`).toBeGreaterThan(0);
      expect(shelf.every((shown) => shown.listed === "shelf")).toBe(true);
      expect(familyCountWords(family)).toMatch(/from other families$/);
    }
  });

  it("is kept off the set-up screen with a reason, since it has no game of its own to set up", () => {
    for (const family of shelvesOnly) expect(family.notOnSetUp?.length ?? 0, family.title).toBeGreaterThan(20);
  });

  it("is never counted among the families a game is played from", () => {
    expect(HOME_FAMILIES).toEqual(GAME_FAMILIES.filter((family) => !shelvesOnly.includes(family)));
    for (const family of HOME_FAMILIES) expect(familyPagePath(family)).toMatch(/^\/games\/[^/]+\/family$/);
  });
});
