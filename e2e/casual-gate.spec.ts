import { expect, test } from "@playwright/test";

import { CASUAL_KIND_LIST } from "../src/lib/casual/casual.constants";
import { gamePath, playPath, rulesPath, setUpPath } from "../src/lib/gomoku/slugs";

/**
 * A STRANGER READS KARAKURI AND IS INVITED TO PLAY IT. Reading is open to
 * anybody, as every game's page is; playing is for members, as every board is,
 * so a casual game's set-up and play page turn a stranger to the join page
 * (the gate, `src/proxy.ts`, decides that and this only holds it). The
 * family's own page, `/games/karakuri`, is the catalogue's and open.
 */
test("a stranger reads the family, each game's page and its rules, and is sent to join to play", async ({ page }) => {
  const family = await page.goto("/games/karakuri");
  expect(family!.status()).toBe(200);
  await expect(page.getByTestId("karakuri-family")).toBeVisible();
  for (const kind of CASUAL_KIND_LIST) {
    const door = await page.goto(gamePath(kind));
    expect(door!.status(), `${kind}'s page`).toBe(200);
    await expect(page.getByTestId("game-front-door")).toBeVisible();
    const rules = await page.goto(rulesPath(kind));
    expect(rules!.status(), `${kind}'s rules`).toBe(200);
    await expect(page.getByTestId("rules-page")).toBeVisible();
    for (const shut of [setUpPath(kind), playPath(kind)]) {
      await page.goto(shut);
      await expect(page, `${shut} is for members`).toHaveURL(/\/join/);
    }
  }
});
