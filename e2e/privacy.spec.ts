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
    // The English the page says, found where the page finds it (the outline names each phrase; Playwright resolves no "@/").
    const { PRIVACY_OUTLINE } = await import("../src/app/privacy/privacy.constants");
    const { PHRASES_PRIVACY } = await import("../src/lib/i18n/phrases.privacy.constants");
    const headings = PRIVACY_OUTLINE.map((section) => PHRASES_PRIVACY[section.heading as keyof typeof PHRASES_PRIVACY]);
    const response = await page.goto("/privacy");
    expect(response?.status()).toBe(200);
    expect(page.url()).toContain("/privacy");

    await expect(page.getByRole("heading", { name: "Privacy", exact: false }).first()).toBeVisible();
    const sections = page.getByTestId("privacy-section");
    await expect(sections).toHaveCount(PRIVACY_OUTLINE.length);
    for (const heading of headings) {
      await expect(page.getByRole("heading", { name: heading }), `${heading} is missing`).toBeVisible();
    }
    // An English reader is never shown the line for a translation: the page they read is the one that governs.
    await expect(page.getByTestId("privacy-governing")).toHaveCount(0);
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

  /*
   * IN JAPANESE (ENJA-11), reached the way a reader reaches it: by clicking the language in the colophon. It opens
   * with the line that says the English version governs, and every heading is the Japanese the page was given, not
   * the English it falls back to. The line is not drawn for an English reader (the first case counts none).
   */
  test("a reader of Japanese is told at the head that the English version governs, and reads every section in Japanese", async ({ page }) => {
    const { PRIVACY_OUTLINE } = await import("../src/app/privacy/privacy.constants");
    const { JA_DRAFTED_PRIVACY } = await import("../src/lib/i18n/dictionaries/ja.drafted.privacy.constants");
    await page.goto("/privacy");
    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();

    const governing = page.getByTestId("privacy-governing");
    await expect(governing).toBeVisible();
    await expect(governing).toContainText("英語版が正式な文書");
    await expect(governing).toHaveAttribute("lang", "ja");
    // At the head: above the first section, and inside the title's block.
    const [governingBox, firstBox] = await Promise.all([governing.boundingBox(), page.getByTestId("privacy-section").first().boundingBox()]);
    expect(governingBox!.y).toBeLessThan(firstBox!.y);

    await expect(page.getByTestId("privacy-section")).toHaveCount(PRIVACY_OUTLINE.length);
    for (const section of PRIVACY_OUTLINE) {
      const heading = JA_DRAFTED_PRIVACY[section.heading]!.text;
      await expect(page.getByRole("heading", { name: heading, exact: true }), `${heading} is missing`).toBeVisible();
    }
    await expect(page.getByTestId("privacy-changed")).toContainText("最終更新：");
    await expect(page.getByRole("link", { name: "hello@itsutsu.com", exact: true }).first()).toHaveAttribute("href", "mailto:hello@itsutsu.com");

    // And the way back, by clicking: English again, with the governing line gone.
    await page.getByTestId("language-picker").locator('[data-locale="en"]').click();
    await expect(page.getByRole("heading", { name: "The short version" })).toBeVisible();
    await expect(page.getByTestId("privacy-governing")).toHaveCount(0);
  });
});
