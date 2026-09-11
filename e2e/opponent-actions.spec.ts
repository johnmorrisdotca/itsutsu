import { expect, test } from "@playwright/test";

/**
 * What a reader can do about the people in somebody's record.
 *
 * "Every opponent you are shown offers what you would want to do about them"
 * is on this repo's own checklist, and Recent Games was where it quietly went
 * unkept: ten opponents named, each one a link to go and read about them, and
 * the decision a reader actually makes here — whether to play somebody — made
 * two pages away.
 *
 * A rule written down and not kept is worse than one nobody wrote, so this
 * holds it.
 */
test.describe("the opponents in a record", () => {
  test("offer a game, beside the game they were in", async ({ page }) => {
    // Somebody with games here. The computer players always have some, and
    // they are the one opponent every database is guaranteed to have.
    await page.goto("/players?view=computers");
    const first = page.getByTestId("computer-player-name").first();
    /*
     * ASSERTED, not skipped. This used to be `test.skip(count === 0, "no
     * computer players on this database")`, and that guard could only ever
     * fire on the one condition it must never swallow.
     *
     * The page awaits `ensureBotMembers()` before it renders, whichever tab
     * is open, so a database with no computer players in it is not a database
     * this page can produce — it writes them itself. An empty list here is
     * therefore never "this machine is a bit bare"; it is the computer
     * players having fallen off the players page, which AGENTS.md records as
     * a REAL bug that reached review and would have reached production, and
     * which was very nearly dismissed as local noise.
     *
     * A skip reports green. So the guard was arranged to stay silent for
     * exactly the fault this file is best placed to catch.
     */
    await expect(first).toBeVisible();
    await first.click();

    const recent = page.getByTestId("player-by-variant");
    await expect(recent).toBeVisible();

    const rows = page.locator("li", { has: page.getByTestId("player-opponent") });
    const found = await rows.count();
    test.skip(found === 0, "this player has no recent games with a named opponent");

    /*
     * At least one row offers something. Not every row can: an opponent who
     * never signed in is not an account to ask anything of, and offering a
     * game against a name nobody is behind would be an offer with nobody on
     * the other end.
     */
    const offers = page.locator("li").filter({ has: page.getByTestId("opponent-actions") });
    expect(await offers.count(), "no opponent in the record offers anything").toBeGreaterThan(0);
  });

  test("still lead to the person, which was the only thing they used to do", async ({ page }) => {
    await page.goto("/players?view=computers");
    const first = page.getByTestId("computer-player-name").first();
    // Asserted rather than skipped, for the reason given in the case above.
    await expect(first).toBeVisible();
    await first.click();

    /*
     * Wait for the record to be there before counting what is in it. Counting
     * first skipped this case every time — a skip that read as "this player
     * has no opponents" and meant "I asked before the page had answered",
     * which is the quietest way for a test to say nothing at all.
     */
    await expect(page.getByTestId("player-by-variant")).toBeVisible();
    const opponent = page.getByTestId("player-opponent").first();
    test.skip((await opponent.count()) === 0, "no named opponent in this record");
    await expect(opponent).toHaveAttribute("href", /^\/players\//);
  });
});
