import { expect, test } from "@playwright/test";

import { memberContext, memberIdFor, removeMember, removePlayedUnder, seedLadderRow } from "./members";
import { ready } from "./support";

/**
 * THE LINE UNDER THE MASTHEAD: a member's own figures, each a link.
 *
 * John, 2026-09-24: "put a row of small data that can be used to quick link to
 * games, etc. and all the items should be links to other places." Every case
 * follows a link as a reader would, and the record's numbers are checked to
 * lead to exactly the rated games they count: that member, rated, that
 * outcome. The member and the standing are this file's own.
 */
test.describe("the member's line under the masthead", () => {
  test("shows a member's record, level and XP, and each leads where it says", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `strip-${stamp}@example.test`, name: `Strip ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    const id = await memberIdFor(me.email);
    await seedLadderRow({ name: me.name, rating: 1600, games: 6, wins: 3, losses: 2, memberId: id });
    try {
      const page = await context.newPage();
      await page.goto("/games");
      await ready(page, "strip-games");
      const strip = page.getByTestId("member-strip");
      await expect(strip.getByTestId("strip-record")).toContainText("3W · 2L · 0D");
      await expect(strip.getByTestId("strip-xp")).toHaveAttribute("href", "/xp");
      await expect(strip.getByTestId("strip-waiting")).toHaveAttribute("href", "/play");

      // The wins lead to exactly the rated games won, by this member's id.
      const won = new URL((await strip.getByTestId("strip-won").getAttribute("href"))!, baseURL);
      expect(won.pathname).toBe("/history");
      expect(Object.fromEntries(won.searchParams)).toMatchObject({ member: id, rated: "yes", outcome: "won" });
      await strip.getByTestId("strip-won").click();
      await expect(page).toHaveURL(/\/history\?/);

      await page.goto("/games");
      await ready(page, "strip-games");
      await page.getByTestId("member-strip").getByTestId("strip-level").click();
      await expect(page).toHaveURL(/\/xp\/levels\/\d+$/);
    } finally {
      await context.close();
      await removePlayedUnder([me.name]);
      await removeMember(me.email);
    }
  });

  test("sits the same distance under the header on every page, and not under the home page's hero", async ({ page }) => {
    // John, 2026-09-24: "some pages there is more space between the bar and the subheader", and none on the home page.
    const gaps: Record<string, number> = {};
    for (const path of ["/games", "/players", "/about", "/play", "/xp"]) {
      await page.goto(path);
      await ready(page, "strip-games");
      const header = await page.locator("header[data-chrome]").boundingBox();
      const strip = await page.getByTestId("member-strip").boundingBox();
      gaps[path] = Math.round(strip!.y - (header!.y + header!.height));
    }
    expect(new Set(Object.values(gaps)).size, `gaps between header and line: ${JSON.stringify(gaps)}`).toBe(1);

    await page.goto("/");
    await ready(page, "account-menu");
    await expect(page.getByTestId("member-strip")).toHaveCount(0);
  });

  test("is not drawn for a visitor with no invite", async ({ browser }) => {
    const stranger = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await stranger.newPage();
    await page.goto("/games");
    // The masthead has arrived before the line is looked for.
    await expect(page.getByTestId("sign-in")).toBeVisible();
    await expect(page.getByTestId("member-strip")).toHaveCount(0);
    await stranger.close();
  });
});
