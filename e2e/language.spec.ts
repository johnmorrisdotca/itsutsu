import { expect, test } from "@playwright/test";

/**
 * Choosing a language, and choosing back.
 *
 * John, on 0.126.0 in production: "BUG: Can't change back to ENG from JP."
 *
 * WHY IT SURVIVED A CAREFUL REVIEW, which is the part worth keeping. The i18n
 * work was verified thoroughly and in ONE DIRECTION: `?lang=es` sets the
 * cookie, `Accept-Language: ja` renders Japanese, `lang=de` falls back, a POST
 * is never redirected. Going TO a language, every time. Coming BACK from one,
 * never. And none of it drove the picker in a browser at all — the control a
 * reader actually uses was the one thing not exercised, so a bug that lived
 * entirely in the click survived every check made of the logic under it.
 *
 * So: every case here CLICKS, and none of them reloads. A reload was what hid
 * this — the cookie was always right and a fresh document always rendered the
 * chosen language, which is why reasoning about the code kept saying it worked.
 * What was broken was the App Router serving its cached, pre-switch payload
 * for the address the proxy redirected to. A test that reloads passes while a
 * reader is stuck.
 */
test.describe("the language a reader chooses", () => {
  const current = (page: import("@playwright/test").Page) =>
    page.getByTestId("language-picker").locator('[data-current="true"]');

  test("goes to Japanese and back to English, by clicking and nothing else", async ({ page }) => {
    await page.goto("/about");
    await expect(current(page)).toHaveAttribute("data-locale", "en");

    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();
    await expect(current(page), "choosing 日本語 did nothing").toHaveAttribute("data-locale", "ja");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");

    /*
     * THE ASSERTION THIS FILE EXISTS FOR. Everything above it was already
     * true when John reported the bug.
     */
    await page.getByTestId("language-picker").locator('[data-locale="en"]').click();
    await expect(current(page), "a reader who chose Japanese could not choose back").toHaveAttribute(
      "data-locale",
      "en",
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("can be changed back from a page reached while the other language was on", async ({ page }) => {
    /*
     * The worse half of the live bug, and the reason it read as permanent.
     * Once the site was Japanese, every page the reader touched went into the
     * client cache in Japanese — so choosing English back appeared to do
     * nothing on page after page, not just on the one where it was chosen.
     */
    await page.goto("/about");
    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();
    await expect(current(page)).toHaveAttribute("data-locale", "ja");

    /*
     * By address, not by name: the navigation is translated, so looking for a
     * link called "Games" while the site is in Japanese finds nothing — which
     * is a test failing at the one moment its subject is working.
     */
    await page.getByRole("navigation").locator('a[href="/games"]').first().click();
    await expect(page).toHaveURL(/\/games$/);
    await expect(current(page), "the choice did not follow the reader").toHaveAttribute(
      "data-locale",
      "ja",
    );

    await page.getByTestId("language-picker").locator('[data-locale="en"]').click();
    await expect(current(page), "still stuck, one page along").toHaveAttribute("data-locale", "en");
  });

  test("is remembered rather than carried in the address", async ({ page }) => {
    /*
     * The language is not part of what a page IS. An address with `?lang=` on
     * it would be copied, shared and bookmarked, and would then overrule the
     * language of whoever opened it — so the proxy takes it back out.
     */
    await page.goto("/about");
    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();
    await expect(current(page)).toHaveAttribute("data-locale", "ja");
    expect(page.url(), "the address kept the language on it").not.toContain("lang=");
  });

  test("does not un-narrow a page that was narrowed", async ({ page }) => {
    // The whole query is carried across the switch. A filter dropped by a link
    // is the same fault as a count that leads to the wrong set of games.
    await page.goto("/history?result=white");
    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();
    await expect(current(page)).toHaveAttribute("data-locale", "ja");
    await expect(page).toHaveURL(/result=white/);
    await expect(page.getByTestId("history-result")).toHaveValue("white");
  });
});
