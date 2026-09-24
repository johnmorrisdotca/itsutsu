import { expect, test } from "@playwright/test";

/*
 * THE PRIVACY PAGE, READ THE WAY IT IS READ: with no session.
 *
 * The person who needs it is deciding whether to ask for an invite, or
 * whether a child may, so every case here runs as a stranger. A member's view
 * of it proves nothing about theirs (AGENTS.md, "reading is open means the
 * games, not the people").
 *
 * It reaches the page the way a reader does — by clicking — from the two
 * places a stranger stands: the catalogue's footer and the doorstep. A test
 * that only typed the address would pass over a footer that had lost the
 * link.
 */
test.describe("privacy", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a stranger reads every section, and the contact address is a link", async ({ page }) => {
    const { privacySections } = await import("../src/app/privacy/privacy.constants");
    const response = await page.goto("/privacy");
    expect(response?.status()).toBe(200);
    expect(page.url()).toContain("/privacy");

    await expect(page.getByRole("heading", { name: "Privacy", exact: false }).first()).toBeVisible();
    const sections = page.getByTestId("privacy-section");
    await expect(sections).toHaveCount(privacySections(30).length);
    for (const section of privacySections(30)) {
      await expect(page.getByRole("heading", { name: section.heading }), `${section.heading} is missing`).toBeVisible();
    }
    await expect(page.getByTestId("privacy-changed")).toContainText("Last changed");
    await expect(page.getByRole("link", { name: "hello@itsutsu.com", exact: true }).first()).toHaveAttribute(
      "href",
      "mailto:hello@itsutsu.com",
    );
  });

  test("the footer of the catalogue leads a stranger to it", async ({ page }) => {
    await page.goto("/games");
    await page.getByTestId("site-footer").getByRole("link", { name: "Privacy" }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole("heading", { name: "The short version" })).toBeVisible();
  });

  test("the doorstep leads a stranger to it", async ({ page }) => {
    await page.goto("/join");
    await page.getByTestId("join-privacy").click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole("heading", { name: "The short version" })).toBeVisible();
  });
});
