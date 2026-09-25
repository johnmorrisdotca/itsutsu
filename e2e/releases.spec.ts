import { expect, test } from "@playwright/test";

import { memberContext } from "./members";

/**
 * What has shipped, at an address of its own.
 *
 * It lived under the board, which answers 404 to everybody but the operator —
 * so a list written "in a player's words" was behind a door no player can
 * open. Two different questions were sharing a page: what is coming, which is
 * the operator's business, and what arrived, which is everybody's.
 */
test.describe("what has shipped", () => {
  test("is read from the changelog, newest first, with this edition marked", async ({ page }) => {
    await page.goto("/releases");
    const history = page.getByTestId("release-history");
    await expect(history).toBeVisible();
    // A real history read from CHANGELOG.md, not a placeholder.
    expect(await history.getByTestId("release").count()).toBeGreaterThan(3);
    await expect(history.getByTestId("releases")).toContainText("This edition");
  });

  test("is reachable by a player, who cannot see the board it came from", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const member = await memberContext(browser, baseURL!, {
      email: `reader-${stamp}@example.com`,
      name: `Reader ${stamp}`,
    });
    const page = await member.newPage();

    await page.goto("/releases");
    await expect(page.getByTestId("release-history")).toBeVisible();

    // The board it used to sit on is still the operator's, and still says so.
    await page.goto("/backlog");
    await expect(page.getByTestId("backlog")).toHaveCount(0);
  });

  test("is where the edition stamp at the foot of every page leads", async ({ page }) => {
    // The colophon names the edition; asking it what that edition brought is
    // a better home for the answer than another word in the row of links.
    await page.goto("/games?view=list");
    await page.getByTestId("version-link").click();
    await expect(page).toHaveURL(/\/releases$/);
    await expect(page.getByTestId("release-history")).toBeVisible();
  });
});

/*
 * UmaKuma's row (John, 2026-09-24): the number and the date at the right on one
 * line, the title under it, and the release opens only when it has more to say.
 */
test("a release is its number, its date at the right and its title, and opens only when there is more", async ({ page }) => {
  await page.goto("/releases");
  const first = page.getByTestId("release").first();
  await expect(first.getByTestId("release-title")).not.toBeEmpty();
  const [row, date] = [await first.boundingBox(), await first.getByTestId("release-date").boundingBox()];
  expect(date!.x + date!.width, "the date sits at the right of its row").toBeGreaterThan(row!.x + row!.width * 0.7);
  // A release with one line has nothing to open; one with more folds the rest.
  // The recent ones, drawn open on the page; the older ones are folded in a list of their own.
  for (const release of await page.getByTestId("releases").locator(':scope > ul > [data-testid="release"]').all()) {
    const more = release.getByTestId("release-more");
    if ((await more.count()) === 0) await expect(release.locator("details")).toHaveCount(0);
    else {
      await expect(more).toBeHidden();
      await release.locator("summary").click();
      await expect(more).toBeVisible();
      break;
    }
  }
});
