import { expect, test } from "@playwright/test";

import { memberContext, removeMember } from "./members";

/**
 * `/admin/player-journeys`: a projection of 1000 simulated players' XP and
 * IP over a year, for the operator's own information. Purely a server render
 * of a deterministic, in-memory simulation — nothing here reads the real
 * database — so the spec asks only what the task itself asks: the operator
 * sees the roles table and the scatter, and a signed-in but ordinary member
 * gets the same 404 `/admin` gives them, never a refusal that would say the
 * page exists.
 */
test.describe("player journeys projection", () => {
  test("the operator sees the roles table and the scatter", async ({ page }) => {
    const opened = await page.goto("/admin/player-journeys");
    expect(opened?.status()).toBe(200);

    await expect(page.getByRole("heading", { name: "Player journeys" })).toBeVisible();

    const rolesTable = page.locator('table:has(caption:text("Every role"))');
    await expect(rolesTable).toBeVisible();
    // Eighteen roles, named in the task itself: two of them, checked by name.
    await expect(rolesTable).toContainText("Elite");
    await expect(rolesTable).toContainText("Gomoku Only");

    await expect(page.getByTestId("journey-scatter")).toBeVisible();
    await expect(page.getByTestId("journey-scatter").locator("svg")).toBeVisible();

    await expect(page.getByTestId("journey-small-multiples")).toBeVisible();
    await expect(page.getByTestId("journey-observations").locator("li").first()).toBeVisible();
  });

  test("an ordinary, signed-in member gets a 404, not a refusal", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const her = { email: `journeysreader-${stamp}@example.test`, name: `Journeys${stamp} Reader` };
    const context = await memberContext(browser, baseURL!, her);
    try {
      const page = await context.newPage();
      const response = await page.goto("/admin/player-journeys");
      expect(response?.status()).toBe(404);
    } finally {
      await context.close();
      await removeMember(her.email);
    }
  });
});
