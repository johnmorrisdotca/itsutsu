import { expect, test } from "@playwright/test";

/**
 * How much of each record the members list is counting.
 *
 * The table had started answering with everybody's lifetime figures — John
 * Morris at 1,949, Chibi at 14,606 — which is the right answer and was the
 * only one on offer. A reader who wanted "what has happened HERE" had no way
 * to ask, while the page one click away, a player's own, had offered exactly
 * that choice for two releases. Same question, same two answers, and the list
 * could give only one of them.
 *
 * The mark beside a count is the other half: it says a figure reaches back to
 * another site, and it must appear only while that is what the figure is
 * doing.
 */
test.describe("how much of these records the members list counts", () => {
  test("offers the same two answers a player's own page does", async ({ page }) => {
    await page.goto("/players");
    const bar = page.getByTestId("record-scope");
    // Only drawn where somebody on the list has a record from elsewhere; on a
    // database without one there is nothing for it to change.
    test.skip((await bar.count()) === 0, "nobody listed has a record from another site");

    await expect(bar.getByTestId("scope-everywhere")).toBeVisible();
    await expect(bar.getByTestId("scope-here")).toBeVisible();
  });

  test("narrowing to this site takes the other sites out of the counts", async ({ page }) => {
    await page.goto("/players");
    const bar = page.getByTestId("record-scope");
    test.skip((await bar.count()) === 0, "nobody listed has a record from another site");

    // A row whose figure reaches back is exactly a row carrying the mark.
    const row = page
      .getByTestId("directory")
      .locator("tr")
      .filter({ has: page.getByTestId("record-kept-mark") })
      .first();
    const everywhere = await row.getByTestId("record-played").innerText();

    await bar.getByTestId("scope-here").click();
    await expect(page).toHaveURL(/scope=here/);

    /*
     * The mark goes with the reaching-back. Leaving it on a count that no
     * longer includes another site would be the same misleading-by-omission
     * the mark exists to prevent, pointing the other way.
     */
    await expect(page.getByTestId("directory").getByTestId("record-kept-mark")).toHaveCount(0);

    const here = await page
      .getByTestId("directory")
      .getByTestId("record-played")
      .first()
      .innerText();
    const digits = (text: string) => Number(text.replace(/[^0-9]/g, ""));
    expect(digits(here), "narrowing must not count more than everywhere did").toBeLessThanOrEqual(
      digits(everywhere),
    );
  });

  test("keeps whichever narrowing was already asked for", async ({ page }) => {
    // The two questions are independent: choosing how much to count must not
    // quietly answer who to list.
    await page.goto("/players?who=people");
    const bar = page.getByTestId("record-scope");
    test.skip((await bar.count()) === 0, "nobody listed has a record from another site");

    await bar.getByTestId("scope-here").click();
    await expect(page).toHaveURL(/who=people/);
    await expect(page).toHaveURL(/scope=here/);
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");
  });
});
