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
    const { TERMS_OUTLINE } = await import("../src/app/terms/terms.constants");
    const { PHRASES_TERMS } = await import("../src/lib/i18n/phrases.terms.constants");
    const headings = TERMS_OUTLINE.map((section) => PHRASES_TERMS[section.heading as keyof typeof PHRASES_TERMS]);
    const response = await page.goto("/terms");
    expect(response?.status()).toBe(200);
    expect(page.url()).toContain("/terms");

    await expect(page.getByTestId("terms-section")).toHaveCount(TERMS_OUTLINE.length);
    for (const heading of headings) {
      await expect(page.getByRole("heading", { name: heading }), `${heading} is missing`).toBeVisible();
    }
    await expect(page.getByTestId("terms-governing")).toHaveCount(0);
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

  test("a reader of Japanese is told at the head that the English version governs, and reads every section in Japanese", async ({ page }) => {
    const { TERMS_OUTLINE } = await import("../src/app/terms/terms.constants");
    const { JA_DRAFTED_TERMS } = await import("../src/lib/i18n/dictionaries/ja.drafted.terms.constants");
    await page.goto("/terms");
    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();

    const governing = page.getByTestId("terms-governing");
    await expect(governing).toBeVisible();
    await expect(governing).toContainText("英語版が正式な文書");
    const [governingBox, firstBox] = await Promise.all([governing.boundingBox(), page.getByTestId("terms-section").first().boundingBox()]);
    expect(governingBox!.y).toBeLessThan(firstBox!.y);

    await expect(page.getByTestId("terms-section")).toHaveCount(TERMS_OUTLINE.length);
    for (const section of TERMS_OUTLINE) {
      const heading = JA_DRAFTED_TERMS[section.heading]!.text;
      await expect(page.getByRole("heading", { name: heading, exact: true }), `${heading} is missing`).toBeVisible();
    }
    await expect(page.getByTestId("terms-changed")).toContainText("最終更新：");

    await page.getByTestId("language-picker").locator('[data-locale="en"]').click();
    await expect(page.getByRole("heading", { name: "One account each" })).toBeVisible();
    await expect(page.getByTestId("terms-governing")).toHaveCount(0);
  });
});
