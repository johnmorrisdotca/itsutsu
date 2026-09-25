import { expect, test } from "@playwright/test";

import { memberContext, seedMember } from "./members";

/**
 * Starting a game is never buried by having played games.
 *
 * "Your games" grows without limit as somebody plays, and it used to sit
 * above the panel that starts one — so the primary action moved further down
 * the page every week, and John found the dropdown a full scroll below the
 * fold. That is the same complaint that made the start panel one sentence in
 * the first place, arriving by a different route.
 *
 * The test measures where things are rather than asserting an order in the
 * markup, because "above the fold" is the actual promise and a reordered
 * section that is still off screen would pass a weaker test.
 */
test.describe("the lobby", () => {
  test("keeps starting a game above the games somebody already has, and the library opens on its games", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `lobby-${stamp}@example.test`, name: `Lobby ${stamp}` };
    await seedMember(me);
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // A pile of games, the way somebody who uses the site ends up with one.
    for (let index = 0; index < 12; index += 1) {
      const made = await context.request.post("/api/games/live", {
        data: { blackName: me.name, whiteName: "", size: 9 },
      });
      expect(made.status()).toBe(201);
      const game = (await made.json()) as { id: string; blackToken: string };
      await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    }

    await page.setViewportSize({ width: 1280, height: 800 });

    /*
     * Since 2026-09-24 starting a game is New game, a button in the bar on
     * every page — so it cannot be buried by anything a page lists. Measured on
     * My games, the page that grows as somebody plays.
     */
    await page.goto("/play");
    const start = page.getByTestId("nav-new-game");
    await expect(start).toBeVisible();
    const box = await start.boundingBox();
    expect(box, "New game should be laid out").not.toBeNull();
    expect(box!.y, "starting a game should be above the fold").toBeLessThan(800);
    const mine = page.getByTestId("my-games");
    await expect(mine).toBeVisible();
    expect(box!.y, "New game sits above the games somebody already has").toBeLessThan((await mine.boundingBox())!.y);

    /*
     * AND THE LIBRARY OPENS ON ITS GAMES. John: "Games page has a FULL page of
     * text before you get down to the different families." The first family is
     * on the first screen.
     */
    await page.goto("/games");
    const family = page.getByTestId("lobby-family").first();
    await expect(family).toBeVisible();
    expect((await family.boundingBox())!.y, "the families start on the first screen of /games").toBeLessThan(800);

    await context.close();
  });
});
