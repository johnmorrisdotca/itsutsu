import { expect, test } from "@playwright/test";

import { seedMember } from "./members";

/**
 * The flag beside somebody's name.
 *
 * The profile form has told members for a long time that "city, country and
 * the time where you are show beside your name on the players page". The
 * country showed nowhere at all — it was written, stored, and never read.
 * John found it by setting his own to Canada and his mother's to Japan and
 * seeing neither.
 */
test.describe("where somebody is", () => {
  test("stands beside their name on their own page, in words", async ({ page }) => {
    await seedMember({ email: "flags-jp@example.test", name: "Flags Jp", country: "Japan" });
    await page.goto("/players/flags-jp");
    const mark = page.getByTestId("country-mark").first();
    await expect(mark).toBeVisible();
    await expect(mark).toHaveAttribute("data-country", "JP");
    await expect(mark).toContainText("Japan");
  });

  test("is on the players directory too, as the flag alone", async ({ page }) => {
    await seedMember({ email: "flags-ca@example.test", name: "Flags Ca", country: "Canada" });
    await page.goto("/players");
    const row = page.locator("tr", { hasText: "Flags Ca" }).first();
    await expect(row.getByTestId("country-mark")).toHaveAttribute("data-country", "CA");
  });

  test("keeps somebody's own words when it cannot place them", async ({ page }) => {
    /*
     * A country nobody can resolve is still where somebody lives. Their words
     * stay and only the flag is missing — a wrong flag on a person's own
     * profile would be worse than none at all.
     */
    await seedMember({ email: "flags-odd@example.test", name: "Flags Odd", country: "Middle Earth" });
    await page.goto("/players/flags-odd");
    const mark = page.getByTestId("country-mark").first();
    await expect(mark).toContainText("Middle Earth");
    await expect(mark).toHaveAttribute("data-country", "");
  });

  test("shows nothing at all for somebody who has not said", async ({ page }) => {
    await seedMember({ email: "flags-none@example.test", name: "Flags None", country: "" });
    await page.goto("/players/flags-none");
    await expect(page.getByTestId("country-mark")).toHaveCount(0);
  });

  test("gives the three computer players their flag as well", async ({ page }) => {
    // John asked for this: they are players in their own right, so they get
    // what every other player gets.
    await page.goto("/players");
    const rows = page.getByTestId("computer-player");
    await expect(rows).toHaveCount(3);
    for (let i = 0; i < 3; i += 1) {
      await expect(rows.nth(i).getByTestId("country-mark")).toHaveAttribute("data-country", "JP");
    }
  });
});
