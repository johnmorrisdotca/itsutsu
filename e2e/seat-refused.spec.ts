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
     */
    await expect(notice).toContainText(/You have \d+ games on the go/);

    // And it leads to the games it counted, which is this site's rule about
    // any number that refers to games. It is also the only useful thing to do
    // about the refusal: the game to finish is in that list.
    await expect(notice.locator("a").first()).toHaveAttribute("href", "/my-games");

    // The site is around it, which is what the hand-written document lacked.
    await expect(page.locator("[data-chrome]").first()).toBeVisible();

    // And it says the invitation survives, because a refusal that reads as a
    // dead end sends somebody away from a game they were invited to.
    await expect(notice).toContainText("has not been used up");
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
