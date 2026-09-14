import { expect, test } from "@playwright/test";

/**
 * What a person sees when a seat link cannot seat them.
 *
 * The twenty-game cap is checked at the seat-claim route, which is a ROUTE
 * HANDLER — it cannot render a page. The first version of this answered with
 * a hand-written HTML document, the only such markup on the site: no masthead,
 * no colophon, no way back into anything.
 *
 * It redirects to the match instead, with `seat=full` on the address, and the
 * match page says why. The parameter is the whole point: a bare redirect to
 * the board would land somebody as a spectator with nothing saying their seat
 * had not been taken, which is the failure that looks exactly like success.
 *
 * Driven at the ADDRESS the redirect produces rather than by importing the
 * route, because "the check is in the tree" and "a person sees the answer" are
 * two different claims — see A Merge Cannot Conflict With A File That No
 * Longer Exists in AGENTS.md.
 */
test.describe("a seat link that cannot seat you", () => {
  test("says so on the match page, with the site around it", async ({ page, request }) => {
    const made = await request.post("/api/games/live", { data: { size: 9, open: true } });
    expect(made.status()).toBe(201);
    const game = (await made.json()) as { id: string };

    await page.goto(`/games/gomoku/match/${game.id}?seat=full`);

    const notice = page.getByTestId("seat-full-notice");
    await expect(notice).toBeVisible();

    /*
     * The number is the reader's OWN count, read by the page rather than
     * carried on the address — a number in a query is one a reader can edit,
     * and the page would be quoting their guess back at them.
     *
     * And it says WHICH games it counted. The cap counts games still being
     * played with this member in a seat; /play holds more than that, so a
     * sentence saying only "games on the go" over a link to /play was a number
     * promising a longer list than it came from.
     */
    await expect(notice).toContainText(/You are seated at \d+ games still being played/);

    // The site is around it, which is what the hand-written document lacked.
    await expect(page.locator("[data-chrome]").first()).toBeVisible();

    // And it says the invitation survives, because a refusal that reads as a
    // dead end sends somebody away from a game they were invited to.
    await expect(notice).toContainText("has not been used up");

    /*
     * THE COUNT LEADS TO EXACTLY THE GAMES IT COUNTED — driven by a click, not
     * read off an href. It once led to all of /play, which holds more than the
     * cap counts; the narrowing it leads to now lists `seatedLive`, the same
     * where the count reads.
     *
     * WHAT THIS DOES NOT ASSERT, AND WHY. The notice's number and the page's
     * number are two reads of a count this spec did not create: the suite signs
     * in as one operator, every other run on the shared database starts and
     * ends that operator's games, and the count was measured moving from 255 to
     * 267 between two reads with nothing of this spec running — so comparing
     * them failed on a 257 against a 256 that were both true. That the count and
     * the list are ONE definition is asserted where it can be, in
     * `activeGames.coverage.test.ts`. What a browser can say for certain is
     * inside one render: the narrowed page's number is the rows it lists.
     */
    const held = notice.getByTestId("seat-full-held");
    await expect(held).toHaveAttribute("href", "/play?all=seated");
    await held.click();
    await expect(page).toHaveURL(/\/play\?all=seated$/);
    await expect(page.getByTestId("my-games-seated")).toBeVisible();
    const listed = Number(await page.getByTestId("my-games-seated-count").innerText());
    await expect(page.getByTestId("my-games").locator("li")).toHaveCount(listed);

    // And the way back takes the narrowing off.
    await page.getByTestId("my-games-seated-back").click();
    await expect(page).toHaveURL(/\/play$/);
    await expect(page.getByTestId("my-games-seated")).toHaveCount(0);
  });

  test("is not shown to somebody who simply opened the match", async ({ page, request }) => {
    // The notice is an answer to a question nobody else asked. A match page
    // that carried it by default would be telling every watcher they had been
    // refused something they never reached for.
    const made = await request.post("/api/games/live", { data: { size: 9, open: true } });
    const game = (await made.json()) as { id: string };

    await page.goto(`/games/gomoku/match/${game.id}`);
    await expect(page.getByTestId("seat-full-notice")).toHaveCount(0);
  });
});
