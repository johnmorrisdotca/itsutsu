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
  test("says the same number in the list as on the page", async ({ page }) => {
    /*
     * THE COMPLAINT, IN ONE ASSERTION. Chibi's own page said 14,606 and the
     * members table beside it said 0, because the table counted games played
     * HERE and he played none — fourteen thousand of them were on two sites
     * that closed before this one opened.
     *
     * Read off the page rather than written down, so the two are held to each
     * other rather than both to a number in a test that would go stale.
     */
    await page.goto("/players/chibi");
    const onHisPage = (await page.getByTestId("player-played").innerText()).replace(/[^0-9]/g, "");
    expect(Number(onHisPage)).toBeGreaterThan(4000);

    await page.goto("/players?who=everyone");
    const row = page.getByTestId("directory").locator("tr", { hasText: "Chibi" });
    // Digits only: the cell also carries the mark saying part of the figure is
    // a snapshot, which is content rather than noise and belongs there.
    const inTheList = (await row.getByTestId("record-played").innerText()).replace(/[^0-9]/g, "");
    expect(inTheList).toBe(onHisPage);
  });

  test("says a combined figure does not update, even where there is no room to say it", async ({ page }) => {
    /*
     * A profile page can afford a paragraph beside the figure; a table row
     * cannot, and the first version of this shipped the combined number into
     * the directory with no qualification at all. Leaving it out because it
     * does not fit is misleading by omission — the exact fault the paragraph
     * was written to avoid — so the mark carries it and the legend explains
     * the mark.
     */
    await page.goto("/players?who=everyone");
    const row = page.getByTestId("directory").locator("tr", { hasText: "Chibi" });
    await expect(row.getByTestId("record-kept-mark")).toBeVisible();

    const note = page.getByTestId("directory-kept-note");
    await expect(note).toBeVisible();
    await expect(note).toContainText("do not update");
  });

  test("marks only the rows whose figures actually reach back", async ({ page }) => {
    // A mark on every row is a mark on none. Meijin has played only here, so
    // its count needs no qualifying and must not carry one.
    await page.goto("/players?who=everyone");
    const bot = page.getByTestId("directory").locator("tr", { hasText: "Meijin" });
    await expect(bot.getByTestId("record-kept-mark")).toHaveCount(0);
  });

  test("never lends somebody another site's rating", async ({ page }) => {
    /*
     * The one column that must not follow the count. Games and wins add up;
     * ratings do not — another site's is on another scale, against other
     * players, and was never converted. Chibi's dash is a fact about Chibi,
     * who never played here, and not what a lifetime view looks like.
     */
    await page.goto("/players?who=everyone");
    const row = page.getByTestId("directory").locator("tr", { hasText: "Chibi" });
    await expect(row.getByTestId("record-played")).not.toHaveText("0");
    /*
     * "record-rating", not "directory-rating": 0.150.0 unified every table
     * of records into one component, and its rating cell carries one shared
     * test id on every table it appears on rather than a name namespaced to
     * whichever page is asking — see RatingCell in RecordTable.tsx, which
     * always renders this cell (an em dash for a row with no rating, never
     * an omitted cell) under `data-testid="record-rating"`.
     */
    await expect(row.getByTestId("record-rating")).toHaveText("–");
  });

  test("adds every site up, and shows which part came from where", async ({ page }) => {
    await page.goto("/players/chibi");
    const whole = page.getByTestId("whole-record");
    await expect(whole).toBeVisible();

    // The sites are named individually beside the total.
    const sources = page.getByTestId("whole-record-sources");
    await expect(sources).toContainText("ItsYourTurn.com");
    await expect(sources).toContainText("GoldToken.com");

    /*
     * And the total is bigger than any one of them, which is the point of it.
     * Read from the headline: the combined figure is what this page LEADS
     * with now, and the panel below no longer repeats it — the same three
     * numbers twice on one screen read as two figures that happen to agree.
     */
    const played = await page.getByTestId("player-played").innerText();
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

/**
 * One page shape, whoever the player is.
 *
 * A record from before this site was built as a kind of PERSON — its own data
 * file, its own page component, its own badge, its own tab order — when it is
 * really a SOURCE. Chibi has records from ItsYourTurn and GoldToken; a member
 * here has those and Itsutsu; Itsutsu is simply the source we run, and the
 * only one that updates. Building it as a category is why the same numbers
 * kept coming out differently depending on which bucket a row fell into: the
 * members table read Chibi as nought, and his page had no scope control while
 * a live member's did.
 */
test.describe("one page shape", () => {
  test("a kept record gets the same page as anybody else", async ({ page }) => {
    await page.goto("/players/chibi");
    // The same panel, not a second component that resembles it.
    await expect(page.getByTestId("player-profile")).toBeVisible();
    // The same badge the members list draws, rather than a second wording.
    await expect(page.getByTestId("member-kind")).toHaveAttribute("data-kind", "remembered");
    // And the control that used to be for live members only.
    await expect(page.getByTestId("record-scope")).toBeVisible();
  });

  test("narrowing to this site works for somebody who never played here", async ({ page }) => {
    // The honest answer is nought, and it has to be reachable rather than
    // implied: a control with only one possible answer is not a control.
    await page.goto("/players/chibi");
    const everywhere = Number((await page.getByTestId("player-played").innerText()).replace(/[^0-9]/g, ""));
    expect(everywhere).toBeGreaterThan(4000);

    await page.getByTestId("scope-here").click();
    await expect(page.getByTestId("player-played")).toHaveText("0");
  });

  test("opens on the tab where the playing actually happened", async ({ page }) => {
    /*
     * Ordered by what somebody has rather than by what sort of row they are.
     * Chibi never played here, so opening him on an empty Itsutsu table with
     * his real record a click away would open on the least of him. This used
     * to be the difference between two page components.
     */
    await page.goto("/players/chibi");
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "ItsYourTurn.com");
  });
});
