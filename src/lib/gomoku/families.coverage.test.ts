import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CASUAL_FAMILY_KEY } from "../casual/casual.constants";
import { isCasualKind, isPartyKind } from "../catalogue/gameKeys";

import { gameKeyFor } from "./slugs";
import {
  GAME_FAMILIES,
  HOME_FAMILIES,
  RECORDED_FAMILIES,
  familyCountWords,
  familyKeepsRecords,
  familyPagePath,
  gamesShownIn,
} from "./families";

/**
 * A FAMILY NO RECORDED GAME CALLS HOME IS STILL A FAMILY A READER CAN OPEN.
 *
 * Party games (2026-09-28) was the first family with no game at home in it:
 * every game on its shelf lived in the family that says what kind of game it
 * is, and was listed here for the table that can play it on one device. The
 * same day Dots and Boxes moved in, the first party game (`PartyKind`), which
 * is played round one device and never recorded. So the question is not
 * "has it a game at home" but "has it a game the site keeps a record of"
 * (`familyKeepsRecords`), and these hold what a family without one has to
 * mean: a page of its own, a shelf that says where each guest lives, a
 * reason to be off the set-up screen, and no place among the families an
 * award is counted over — or its card on the front page leads nowhere and a
 * prize could never be finished.
 */
const noRecord = GAME_FAMILIES.filter((family) => !familyKeepsRecords(family));

describe("a family no recorded game calls home", () => {
  it("exists, so the rest of this is about something", () => {
    expect(noRecord.map((family) => family.key)).toContain("party");
  });

  it("has only party or casual games at home, if it has any", () => {
    for (const family of noRecord) expect(family.games.every((game) => isPartyKind(game) || isCasualKind(game)), family.title).toBe(true);
  });

  it("has a page of its own at /games/<key>, which no game's address can be", () => {
    for (const family of noRecord) {
      expect(familyPagePath(family)).toBe(`/games/${family.key}`);
      // A folder of its own, or the game page's route answering for it by name: Karakuri's is the latter, to spare the server function a route's manifests (`CasualFamilyPage`).
      const answeredBySlug = family.key === CASUAL_FAMILY_KEY && readFileSync("src/app/games/[slug]/page.tsx", "utf8").includes("<CasualFamilyPage />");
      expect(existsSync(join("src/app/games", family.key, "page.tsx")) || answeredBySlug, `${family.title} has no page`).toBe(true);
      expect(gameKeyFor(family.key), `${family.key} is also a game's address`).toBeNull();
    }
  });

  it("shows at least one game, and every one from another family says so", () => {
    for (const family of noRecord) {
      const shelf = gamesShownIn(family);
      expect(shelf.length, `${family.title} shows nothing`).toBeGreaterThan(0);
      // Its own party or casual games at home, and every other game a guest that knows where it lives.
      for (const shown of shelf) expect(shown.listed === "shelf" || isPartyKind(shown.variant) || isCasualKind(shown.variant), `${shown.variant} on ${family.title}`).toBe(true);
      if (shelf.some((shown) => shown.listed === "shelf")) expect(familyCountWords(family)).toMatch(/from other families$/);
    }
  });

  it("is kept off the set-up screen with a reason, since it has no game the two-player set-up can make", () => {
    for (const family of noRecord) expect(family.notOnSetUp?.length ?? 0, family.title).toBeGreaterThan(20);
  });

  it("is never counted among the families a recorded game is played from", () => {
    expect(RECORDED_FAMILIES).toEqual(GAME_FAMILIES.filter((family) => !noRecord.includes(family)));
    for (const family of RECORDED_FAMILIES) expect(familyPagePath(family)).toMatch(/^\/games\/[^/]+\/family$/);
  });

  it("is still some game's home, once one lives there, so every game is listed once under it", () => {
    expect(HOME_FAMILIES).toEqual(GAME_FAMILIES.filter((family) => family.games.length > 0));
    expect(HOME_FAMILIES.flatMap((family) => family.games)).toEqual(GAME_FAMILIES.flatMap((family) => family.games));
  });
});
