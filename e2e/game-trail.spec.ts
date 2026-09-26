import { expect, test } from "@playwright/test";

import { type MadeRows, measuredRoutes, removeRouteRows, seedRouteRows } from "./siteRoutes";
import { gamesMade, namesPlayedUnder } from "./tidy";

/**
 * EVERY PAGE UNDER A GAME OPENS ITS TRAIL WITH GAMES. John, 2026-09-25: a
 * game's page read "Games / Gomoji Mot", its set-up "Gomoji Mot / Set up" and
 * its board "Gomoji Mot / Set up / Play" — the way back to the catalogue lost
 * one step down. `gameTrail.coverage.test.ts` holds the source to it; this
 * walks what a browser draws, at every address under a game that
 * `e2e/siteRoutes.ts` measures, games and puzzles alike, and the set-up
 * screen with no game chosen.
 */

// This run's own member, by a stamp, for the reason page-width.spec.ts gives.
const STAMP = Date.now().toString(36);
const TRAIL_MEMBER = { email: `game-trail-${STAMP}@example.test`, name: `Trail Check ${STAMP}` };

/** Ids this file makes before the run, filled in `beforeAll` — in place, since the route closures hold this object. */
const made: MadeRows = { filed: "", live: "", member: "", solve: "" };

test.describe("the trail under a game", () => {
  const under = namesPlayedUnder();
  const track = gamesMade();

  test.beforeAll(async ({ playwright, baseURL }) => {
    Object.assign(made, await seedRouteRows(playwright, baseURL, TRAIL_MEMBER, under, track));
  });

  test.afterAll(async () => {
    await removeRouteRows(TRAIL_MEMBER);
  });

  const routes = measuredRoutes(made).filter(({ route }) => route.startsWith("/games/[slug]") || route === "/games/new");

  for (const { route, name, url: address } of routes) {
    test(`${name} opens its trail with Games, then the game`, async ({ page }) => {
      const url = address();
      const answered = await page.goto(url, { waitUntil: "load" });
      expect(answered?.status(), `${url} did not load`).toBeLessThan(400);

      const trail = page.getByTestId("game-trail").first();
      await expect(trail, `${url} (${route}) draws no trail`).toBeVisible();
      const links = trail.locator("a");
      await expect(links.first()).toHaveText("Games");
      await expect(links.first()).toHaveAttribute("href", "/games");

      const slug = /^\/games\/([^/?]+)/.exec(new URL(url, "http://x").pathname)?.[1];
      const home = route === "/games/[slug]";
      if (route === "/games/new") {
        await expect(trail).toHaveText("Games / Set up");
      } else if (home) {
        // On the game's own page the game is where the reader is: named, not a link.
        await expect(links).toHaveCount(1);
        await expect(trail).toContainText(/^Games \/ \S/);
      } else {
        await expect(links.nth(1)).toHaveAttribute("href", `/games/${slug}`);
      }
    });
  }

  test.describe("for a reader with no invite", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("the rules, which are open, lead out to the catalogue first", async ({ page }) => {
      await page.goto("/games/gomoku/rules");
      const trail = page.getByTestId("game-trail").first();
      await expect(trail).toHaveText("Games / Gomoku / Rules");
      await trail.getByRole("link", { name: "Games" }).click();
      await expect(page).toHaveURL(/\/games$/);
    });
  });
});
