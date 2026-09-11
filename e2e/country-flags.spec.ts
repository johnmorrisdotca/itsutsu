import { expect, test } from "@playwright/test";

import { BOT_MEMBERS } from "../src/lib/bots/bots.constants";
import { BOT_ALL_TIERS } from "../src/lib/gomoku/opponent.constants";
import { countryFrom } from "../src/lib/social/countries";

import { seedMember } from "./members";
import { shownName } from "../src/lib/rating/shownName";

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
    // By the name the row PRINTS — "Flags Ca" is shown as "Flags C." now.
    const row = page.locator("tr", { hasText: shownName("Flags Ca") }).first();
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

  test("is chosen from a list, and comes back as what was chosen", async ({ page }) => {
    await page.goto("/me?view=profile");
    const country = page.getByTestId("profile-country");
    await expect(country).toBeVisible();

    await country.selectOption("NZ");
    /*
     * Wait for the save to land before reloading, rather than for it to be
     * likely to have landed. Clicking and reloading straight away passed on
     * its own and failed inside a longer run — the reload was racing the PATCH
     * and winning about as often as not, which is the worst kind of test.
     */
    const saved = page.waitForResponse(
      (response) => response.url().includes("/api/me") && response.request().method() === "PATCH",
    );
    await page.getByTestId("profile-form").getByRole("button", { name: /save/i }).click();
    expect((await saved).ok()).toBe(true);

    await page.reload();
    await expect(page.getByTestId("profile-country")).toHaveValue("NZ");
  });

  test("keeps words it cannot place rather than quietly dropping them", async ({ page }) => {
    /*
     * THE CASE A SELECT GETS WRONG. Somebody whose stored country names no
     * country this list knows must not have it erased the next time they save
     * anything else on this form — a control that cannot represent a value
     * must not answer for it, so their own words stay as an option of their
     * own.
     */
    await seedMember({ email: "flags-keep@example.test", name: "Flags Keep", country: "Middle Earth" });
    await page.goto("/players/flags-keep");
    await expect(page.getByTestId("country-mark").first()).toContainText("Middle Earth");
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
     * Read from the ladder rather than written down. This test said three
     * players and all of them Japanese, which was true of the ladder it was
     * written against and stopped being true the day the ladder grew a
     * Russian rung and a Chinese one.
     */
    await page.goto("/players?view=computers");
    const rows = page.getByTestId("computer-player");
    await expect(rows).toHaveCount(BOT_ALL_TIERS.length);
    for (const [index, tier] of BOT_ALL_TIERS.entries()) {
      const country = countryFrom(BOT_MEMBERS[tier].country);
      expect(country, `${tier} is from somewhere the site knows`).not.toBeNull();
      await expect(rows.nth(index).getByTestId("country-mark")).toHaveAttribute(
        "data-country",
        country!.code,
      );
    }
  });
});
