import { expect, test } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { ready } from "./support";

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

  /*
   * TEST MODE, pressed the way the operator presses it: the row in Admin's
   * Modes group, on and back off. On, the banner every page carries says so;
   * off, it is gone again — the way back is tested, not only the way there.
   * Ends off, so no other spec signed in as the operator sees test members.
   */
  test("the operator's Test mode switch shows the banner and takes it away again", async ({ page }) => {
    await page.goto("/admin?view=site");
    await ready(page, "test-mode-control");
    const row = page.getByTestId("site-test-mode");
    const toggle = page.getByTestId("test-mode-switch");
    if ((await row.getAttribute("data-test-mode")) === "on") {
      await toggle.click();
      await expect(row).toHaveAttribute("data-test-mode", "off");
      await expect(page.getByTestId("test-mode-banner")).toHaveCount(0);
    }
    await toggle.click();
    await expect(row).toHaveAttribute("data-test-mode", "on");
    await expect(page.getByTestId("test-mode-banner")).toBeVisible();
    await expect(page.getByTestId("test-mode-journeys")).toHaveAttribute("href", "/admin/player-journeys");

    await toggle.click();
    await expect(row).toHaveAttribute("data-test-mode", "off");
    await expect(page.getByTestId("test-mode-banner")).toHaveCount(0);
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
