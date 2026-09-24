import { expect, test } from "@playwright/test";

/*
 * THE TERMS OF PLAY, READ THE WAY THEY ARE READ: with no session (PRIV-05).
 *
 * Like the privacy page beside them, they are for somebody deciding whether
 * to ask for an invite, so every case runs as a stranger, and the page is
 * reached by clicking from the two places a stranger stands: the catalogue's
 * footer and the join page. A test that only typed the address would pass
 * over a footer that had lost the link.
 */
test.describe("terms of play", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a stranger reads every section, and the contact address is a link", async ({ page }) => {
    const { TERMS_SECTIONS } = await import("../src/app/terms/terms.constants");
    const response = await page.goto("/terms");
    expect(response?.status()).toBe(200);
    expect(page.url()).toContain("/terms");

    await expect(page.getByTestId("terms-section")).toHaveCount(TERMS_SECTIONS.length);
    for (const section of TERMS_SECTIONS) {
      await expect(page.getByRole("heading", { name: section.heading }), `${section.heading} is missing`).toBeVisible();
    }
    await expect(page.getByTestId("terms-changed")).toContainText("Last changed");
    await expect(page.getByRole("link", { name: "hello@itsutsu.com", exact: true }).first()).toHaveAttribute(
      "href",
      "mailto:hello@itsutsu.com",
    );
  });

  test("the footer of the catalogue leads a stranger to them", async ({ page }) => {
    await page.goto("/games");
    await page.getByTestId("site-footer").getByRole("link", { name: "Terms" }).click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.getByRole("heading", { name: "One account each" })).toBeVisible();
  });

  test("the join page leads a stranger to them", async ({ page }) => {
    await page.goto("/join");
    await page.getByTestId("join-terms").click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.getByRole("heading", { name: "One account each" })).toBeVisible();
  });
});
