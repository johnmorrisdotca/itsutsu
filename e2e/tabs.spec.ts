import { expect, test } from "@playwright/test";

/**
 * A page with several sections shows one at a time, and the address says
 * which.
 *
 * This is a standing rule rather than one page's design, so it is tested as
 * one: the same behaviour is asked of a player's record and of the operator's
 * page, which are the two that have it. A tab that cannot be linked to is a
 * tab somebody has to explain over the phone.
 */
test.describe("a page of many sections is tabs", () => {
  test("the address names the open tab, and opening that address opens it", async ({ page }) => {
    await page.goto("/players/chibi");
    // The first tab is the plain address: an ordinary link to a player must
    // not grow a query string just by being looked at.
    expect(new URL(page.url()).search).toBe("");
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "ItsYourTurn.com");

    await page.getByTestId("tab").filter({ hasText: "GoldToken" }).click();
    await expect(page).toHaveURL(/\?view=goldtoken$/);
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "GoldToken.com");

    // The whole point: that address, opened cold, is the same page.
    await page.goto("/players/chibi?view=goldtoken");
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "GoldToken.com");
    await expect(page.getByTestId("tab").filter({ hasText: "GoldToken" })).toHaveAttribute("data-open", "true");
  });

  test("an address naming a tab that is not there still lands on the person", async ({ page }) => {
    // A renamed tab, or an address somebody typed. Better the first tab than
    // an empty page.
    await page.goto("/players/chibi?view=myspace");
    await expect(page.getByTestId("legacy-player")).toContainText("Chibi");
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "ItsYourTurn.com");
  });

  test("a record from one site still has this site's tab beside it", async ({ page }) => {
    /*
     * Kyokosan played on ItsYourTurn and nowhere else, and never here. She
     * still has two tabs. A page whose tabs depend on a count being zero
     * looks like a different kind of page to the reader, and what this site
     * holds of somebody is worth saying even when it is nothing.
     */
    await page.goto("/players/kyokosan");
    await expect(page.getByTestId("tab")).toHaveCount(2);
    // The record made elsewhere comes first, so the page opens on its substance.
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "ItsYourTurn.com");

    await page.getByTestId("tab").filter({ hasText: "Itsutsu" }).click();
    await expect(page).toHaveURL(/\?view=itsutsu$/);
    // And it says what an empty record means for somebody who never played
    // here, rather than telling her to wait for a rating.
    const empty = page.getByTestId("player-no-games");
    await expect(empty).toContainText("No games on Itsutsu");
    await expect(empty).not.toContainText("yet");
  });

  test("a remembered record is not told to wait for a first game", async ({ page }) => {
    // "No finished games yet" is the wrong word about somebody who has died.
    await page.goto("/players/chibi?view=itsutsu");
    const empty = page.getByTestId("player-no-games");
    await expect(empty).toContainText("kept rather than added to");
    await expect(empty).not.toContainText("yet");
  });

  test("the operator's page is three tabs, one part at a time", async ({ page }) => {
    /*
     * The door, the members and the work. It was three headings on one page
     * with the whole features board inside the third, which made it long
     * however short the headings were.
     */
    await page.goto("/admin");
    await expect(page.getByTestId("tab")).toHaveCount(3);
    await expect(page.getByTestId("admin-door")).toBeVisible();
    // One at a time: the board is not also on screen behind the invites.
    await expect(page.getByTestId("admin-backlog")).toHaveCount(0);
    await expect(page.getByTestId("admin-people")).toHaveCount(0);

    await page.getByTestId("tab").filter({ hasText: "The work" }).click();
    await expect(page).toHaveURL(/\?view=work$/);
    await expect(page.getByTestId("admin-backlog")).toBeVisible();
    await expect(page.getByTestId("admin-door")).toHaveCount(0);

    await page.goto("/admin?view=members");
    await expect(page.getByTestId("admin-people")).toBeVisible();
    await expect(page.getByTestId("tab").filter({ hasText: "The members" })).toHaveAttribute("data-open", "true");
  });
});
