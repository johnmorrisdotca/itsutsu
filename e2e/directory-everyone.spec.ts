import { expect, test } from "@playwright/test";

/**
 * The Everyone button, which did nothing.
 *
 * John found it: narrowed to People, clicking "Everyone 全員" left the page on
 * People. Not a dead button — a button asking for exactly the thing it was
 * offering to remove.
 *
 * A bare /players means "however I last asked", because the narrowing is
 * remembered in a cookie. The bar wrote its links with the default left off,
 * the way an address politely does, so Everyone came out as /players — and the
 * cookie answered People. `SHOW_EVERYBODY_HREF` existed for precisely this
 * trap, with the reason written beside it, and the bar's own buttons walked
 * into it anyway.
 *
 * So the test is not "the button works". It is that choosing Everyone AFTER
 * choosing People shows everybody, which is the sequence that failed.
 */
test.describe("narrowing the members list", () => {
  test("Everyone comes back from People, which it used to refuse to do", async ({ page }) => {
    await page.goto("/players");

    // Narrow first. This is what makes the next click meaningful — and what
    // writes the preference that used to answer it.
    await page.getByTestId("who-people").click();
    await expect(page).toHaveURL(/who=people/);
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");

    await page.getByTestId("who-everyone").click();
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("who-people")).not.toHaveAttribute("aria-current", "true");
  });

  test("and says so in the address, so a bare visit is not narrowed again", async ({ page }) => {
    /*
     * The cause rather than the symptom. The address has to SAY everyone: a
     * bare /players is a question, not an answer, and the remembered
     * preference is what answers it.
     */
    await page.goto("/players");
    await page.getByTestId("who-people").click();
    await expect(page).toHaveURL(/who=people/);

    await page.getByTestId("who-everyone").click();
    await expect(page).toHaveURL(/who=everyone/);

    // And the preference that used to fight it now agrees: come back bare.
    await page.goto("/players");
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");
  });
});
