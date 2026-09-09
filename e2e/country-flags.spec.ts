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

  test("says the city, and what time it is there", async ({ page }) => {
    /*
     * The clock is the one that earns its place on a site where a game takes
     * a week: knowing it is four in the morning where your opponent is turns
     * a slow reply from a slight into a person who is asleep.
     */
    await seedMember({
      email: "flags-tokyo@example.test",
      name: "Flags Tokyo",
      country: "Japan",
      city: "Tokyo",
      timeZone: "Asia/Tokyo",
    });
    await page.goto("/players/flags-tokyo");
    await expect(page.getByTestId("whereabouts-city")).toHaveText("Tokyo");
    await expect(page.getByTestId("whereabouts-time")).toContainText("where they are");
    await expect(page.getByTestId("whereabouts-time")).toContainText(/\d\d:\d\d/);
  });

  test("says nothing about whereabouts for somebody who has not said", async ({ page }) => {
    await seedMember({ email: "flags-quiet@example.test", name: "Flags Quiet" });
    await page.goto("/players/flags-quiet");
    await expect(page.getByTestId("whereabouts")).toHaveCount(0);
  });

  test("shows nothing at all for somebody who has not said", async ({ page }) => {
    await seedMember({ email: "flags-none@example.test", name: "Flags None", country: "" });
    await page.goto("/players/flags-none");
    await expect(page.getByTestId("country-mark")).toHaveCount(0);
  });

  test("says what somebody says about themselves", async ({ page }) => {
    /*
     * Another field with a writer and no reader. The bio has been in the
     * profile form since the form existed and appeared on no page — including
     * the computer players', whose bios explain what each of them does and
     * were readable only by opening the source.
     */
    await seedMember({ email: "flags-bio@example.test", name: "Flags Bio", bio: "I play slowly." });
    await page.goto("/players/flags-bio");
    await expect(page.getByTestId("player-bio")).toHaveText("I play slowly.");
  });

  test("shows a computer player's own account of itself", async ({ page }) => {
    await page.goto("/players/dan");
    await expect(page.getByTestId("player-bio")).toContainText("段");
  });

  test("gives every computer player their flag as well", async ({ page }) => {
    /*
     * John asked for this: they are players in their own right, so they get
     * what every other player gets.
     *
     * However many of them there are, and wherever each is from. This used to
     * name three and expect Japan of all of them, and went stale the day two
     * more arrived from Russia and China — a test that has to be edited to
     * add a player is a test that will be edited without being read.
     */
    await page.goto("/players");
    const rows = page.getByTestId("computer-player");
    const count = await rows.count();
    expect(count, "the computer players are not on the page at all").toBeGreaterThan(2);
    for (let i = 0; i < count; i += 1) {
      const mark = rows.nth(i).getByTestId("country-mark");
      await expect(mark, `computer player ${i + 1} has no flag`).toHaveCount(1);
      // A real country, not the code echoed back because nothing resolved.
      await expect(mark).not.toHaveAttribute("data-country", "");
    }
  });
});
