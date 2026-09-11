import { expect, test } from "@playwright/test";

import { seedMember } from "./members";

/**
 * A link to a person carries their id, not their name.
 *
 * John, on his twelve-year-old daughter: "links can still be full name but
 * maybe links to people might need to be the guids?"
 *
 * WHAT THIS IS ACTUALLY GUARDING. `shownName` shipped at 0.121.0 and prints
 * "Hanako M." wherever a member is named — and the href under it read
 * /players/hanako-morris, so the surname she had taken down sat in the markup
 * of every page that named her. Shortening a name on screen does nothing while
 * the address under it is whole, and the two live in different lines of one
 * component, so they drift apart in silence.
 *
 * Asserted against the MARKUP rather than the rendered text, because the
 * rendered text was never the thing that was wrong: the screen passed and the
 * href failed. That is the same lesson as the production leak fixed in
 * e69fae7, and the reason that fix's test reads the markup too.
 */
test.describe("a member's address", () => {
  test("does not carry their surname, on any page that names them", async ({ page }) => {
    const stamp = Date.now();
    const surname = `Sasaki${stamp}`;
    await seedMember({ email: `addr-${stamp}@example.test`, name: `Hanako ${surname}` });

    await page.goto("/players");
    const link = page.getByTestId("directory-name").filter({ hasText: "Hanako" }).first();
    await expect(link).toBeVisible();

    const href = (await link.getAttribute("href")) ?? "";
    expect(href, "a member's link must not be built from their name").not.toContain(
      surname.toLowerCase(),
    );
    expect(href, "and it should be their id under /players").toMatch(/^\/players\/[a-z0-9]+$/);

    /*
     * And nowhere else in the document either. The href is where this was
     * found, but the property worth holding is about the whole markup — a
     * surname reaching the page by some other route is the same leak.
     */
    const markup = await page.content();
    expect(markup, "the surname reached the markup by another route").not.toContain(
      surname.toLowerCase(),
    );
  });

  test("is a real address: following it opens their page", async ({ page }) => {
    const stamp = Date.now();
    await seedMember({ email: `addr2-${stamp}@example.test`, name: `Mio Tanaka${stamp}` });

    await page.goto("/players");
    const link = page.getByTestId("directory-name").filter({ hasText: "Mio" }).first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");

    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("still answers to a name for somebody with no account behind it", async ({ page }) => {
    /*
     * The fallback, and it is not a leftover: a record kept from another site
     * has no member to be addressed by, so the name IS its address. John's own
     * kept records are reached this way and must go on working.
     */
    await page.goto("/players/john-morris");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
});
