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
  test("puts starting a game above the games somebody already has", async ({ browser, baseURL }) => {
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
      await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/games");

    const start = page.getByTestId("lobby-start");
    await expect(start).toBeVisible();

    // The control that starts a game is reachable without scrolling.
    const box = await start.boundingBox();
    expect(box, "the start panel should be laid out").not.toBeNull();
    expect(box!.y, "starting a game should be above the fold").toBeLessThan(800);

    // And it really is above the list, not merely near the top by accident.
    const mine = page.getByTestId("my-games");
    if ((await mine.count()) > 0) {
      const listBox = await mine.boundingBox();
      if (listBox !== null) expect(box!.y).toBeLessThan(listBox.y);
    }

    await context.close();
  });
});
