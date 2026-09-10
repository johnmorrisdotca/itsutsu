import { expect, test } from "@playwright/test";

import { seedMember } from "./members";

/**
 * Everything somebody has played, on the page about them.
 *
 * John's argument for it is a growth argument and a fair one: showing
 * somebody the record they already have is a reason to come and play here.
 * It only works if the page is honest about what the figures are — a record
 * nobody can check and nobody can trust to be current is not a hook, it is a
 * claim.
 */
test.describe("a combined record", () => {
  test("adds every site up, and shows which part came from where", async ({ page }) => {
    await page.goto("/players/chibi");
    const whole = page.getByTestId("whole-record");
    await expect(whole).toBeVisible();

    // The sites are named individually beside the total.
    const sources = page.getByTestId("whole-record-sources");
    await expect(sources).toContainText("ItsYourTurn.com");
    await expect(sources).toContainText("GoldToken.com");

    // And the total is bigger than any one of them, which is the point of it.
    const played = await page.getByTestId("whole-played").innerText();
    expect(Number(played.replace(/[^0-9]/g, ""))).toBeGreaterThan(4000);
  });

  test("says plainly that it does not update", async ({ page }) => {
    /*
     * The part not to soften. Somebody who assumes their current play
     * elsewhere is flowing in is being misled by omission, and they find out
     * when the number is wrong and they had trusted it.
     */
    await page.goto("/players/chibi");
    const note = page.getByTestId("whole-record-snapshot");
    await expect(note).toBeVisible();
    await expect(note).toContainText("does not update");
    await expect(note).toContainText("snapshot");
  });

  test("says why there is no combined rating", async ({ page }) => {
    // A missing figure with no explanation reads as an oversight rather than
    // as a decision, and this one is a decision.
    await page.goto("/players/chibi");
    const why = page.getByTestId("whole-record-no-rating");
    await expect(why).toBeVisible();
    await expect(why).toContainText("No combined rating");
    await expect(why).toContainText("another scale");

    // And there is no number anywhere claiming to be one.
    await expect(page.getByTestId("whole-record")).not.toContainText(/\bElo\b/);
  });

  test("leads to the source, where a source was written down", async ({ page }) => {
    await page.goto("/players/chibi");
    const links = page.getByTestId("whole-record-link");
    await expect(links.first()).toBeVisible();
    // A real address, never one guessed from a site name and a handle.
    await expect(links.first()).toHaveAttribute("href", /^https?:\/\//);
    await expect(links.first()).toHaveAttribute("rel", /noopener/);
  });

  test("says nothing at all about somebody who has played nothing", async ({ page }) => {
    // No zeroes, no empty panel: a person with no games has no record to add.
    await seedMember({ email: "whole-none@example.test", name: "Whole None" });
    await page.goto("/players/whole-none");
    await expect(page.getByTestId("whole-record")).toHaveCount(0);
  });
});

/**
 * How much of a record the page leads with.
 *
 * John's argument again, one step further: somebody who played four thousand
 * games elsewhere and twenty here should not have to find a control before the
 * page reflects that. So the headline counts everywhere by default, and
 * narrowing to this site is what somebody asks for.
 */
test.describe("how much of a record the page leads with", () => {
  const OPERATOR = { email: "john@spxis.com", name: "John Morris" };
  const played = async (page: import("@playwright/test").Page) =>
    Number((await page.getByTestId("player-played").innerText()).replace(/[^0-9]/g, ""));

  test("counts every site before anybody asks, and narrows when they do", async ({ page }) => {
    await seedMember(OPERATOR);
    await page.goto("/players/john-morris");

    await expect(page.getByTestId("scope-everywhere")).toHaveAttribute("aria-current", "true");
    const everywhere = await played(page);
    expect(everywhere).toBeGreaterThan(1000);

    await page.getByTestId("scope-here").click();
    await expect(page).toHaveURL(/scope=here/);
    // Narrowing has to actually narrow: a toggle that changes the address and
    // not the figure is the shape of a filter that quietly does nothing.
    expect(await played(page)).toBeLessThan(everywhere);
  });

  test("keeps the snapshot warning beside the figure it is about", async ({ page }) => {
    /*
     * The warning used to sit below the tabs, under a figure nobody led with.
     * Now that combined IS the headline, a warning left down there would have
     * become fine print without anybody deciding to make it fine print.
     */
    await seedMember(OPERATOR);
    await page.goto("/players/john-morris");

    const figures = page.getByTestId("player-figures");
    const note = page.getByTestId("whole-record-snapshot").first();
    await expect(note).toBeVisible();
    await expect(note).toContainText("does not update");

    const figuresBox = await figures.boundingBox();
    const noteBox = await note.boundingBox();
    expect(noteBox!.y - figuresBox!.y).toBeLessThan(200);
  });

  test("never invents a combined rating", async ({ page }) => {
    // Games and wins add up; ratings do not. The space stays empty on purpose.
    await seedMember(OPERATOR);
    await page.goto("/players/john-morris");
    await expect(page.getByTestId("counting-everywhere")).toContainText("does not add");
  });

  test("offers no choice to somebody who has only ever played here", async ({ page }) => {
    // Both answers would be the same games, and a control that cannot change
    // anything promises a chapter that is not there.
    const only = { email: `only-here-${Date.now().toString(36)}@example.test`, name: `Only Here ${Date.now().toString(36)}` };
    await seedMember(only);
    await page.goto(`/players/${only.name.toLowerCase().replace(/ /g, "-")}`);
    await expect(page.getByTestId("record-scope")).toHaveCount(0);
  });
});
