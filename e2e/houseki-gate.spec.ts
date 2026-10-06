import { expect, test } from "@playwright/test";

import { HOUSEKI_KIND_LIST } from "../src/lib/houseki/houseki.constants";
import { gamePath, rulesPath, setUpPath } from "../src/lib/gomoku/slugs";

/**
 * A STRANGER READS HOUSEKI AND IS INVITED TO PLAY IT. Reading is open to anybody,
 * as every game's page is; playing is for members, as every board is, so a game's
 * set-up and play page turn a stranger to the join page, and the one route that
 * counts a win answers a stranger with a plain refusal rather than a page (the
 * gate, `src/proxy.ts`, decides that and this only holds it).
 */
test("a stranger reads the family, each game's page and its rules, and is sent to join to play", async ({ page }) => {
  const family = await page.goto("/games/houseki");
  expect(family!.status()).toBe(200);
  await expect(page.getByTestId("houseki-family")).toBeVisible();
  for (const kind of HOUSEKI_KIND_LIST) {
    const door = await page.goto(gamePath(kind));
    expect(door!.status(), `${kind}'s page`).toBe(200);
    await expect(page.getByTestId("game-front-door")).toBeVisible();
    const rules = await page.goto(rulesPath(kind));
    expect(rules!.status(), `${kind}'s rules`).toBe(200);
    await expect(page.getByTestId("rules-page")).toBeVisible();
    await page.goto(setUpPath(kind));
    await expect(page, `${kind}'s set-up is for members`).toHaveURL(/\/join/);
  }
});

test("a stranger's win is not counted, and the route says so without a page", async ({ request }) => {
  const response = await request.post("/api/houseki/win", { data: { game: "stoneCollapse", request: { kind: "level", campaign: "classic", number: 1 }, save: "x" }, maxRedirects: 0 });
  expect([401, 403, 307, 308]).toContain(response.status());
});
