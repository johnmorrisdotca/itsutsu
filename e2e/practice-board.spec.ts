import { expect, test } from "@playwright/test";

import { ready } from "./support";

/**
 * THE PRACTICE BOARD: ITS MOVES, A GAME PASTED INTO IT, AND WHAT IT SAYS IT IS.
 *
 * John, 2026-09-21: "Practice a board. you get to click around on any board
 * through game and you get the moves list... you can paste a moves list to
 * view that game and browse around. accept several published formats on that
 * game. be flexible for badly formatted moves. Also you need to know it's a
 * practice, not a real match."
 *
 * This is the board that was already there — "Try the board" at
 * /games/<slug>/play — grown, rather than a second thing. The reading is
 * tested hard and cheaply in `readMoves.test.ts` against a corpus of ugly
 * lists; what needs a browser is the part that cannot be unit tested: that the
 * moves reach the BOARD, that the record lists them, and that walking back
 * through them works the way it does on a finished game.
 */
test.describe("the practice board", () => {
  test("says what it is, and offers the real game", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await ready(page, "game-view");
    const mark = page.getByTestId("practice-mark");
    await expect(mark).toBeVisible();
    /*
     * The four things it is not, and the one thing it IS. A board at one
     * screen is filed, as an unrated game of its own — saying "nothing is
     * kept" would be the comfortable line rather than the true one.
     */
    await expect(mark).toContainText("Nobody is sitting opposite");
    await expect(mark).toContainText("nothing played here is rated");
    await expect(mark).toContainText("a game you paste in is not kept at all");
    // Never a dead end: the real game is one press away.
    await expect(page.getByTestId("practice-to-real")).toHaveAttribute("href", "/games/gomoku/new");
  });

  test("lists the moves as they are played, above the fold and not below everything", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await ready(page, "game-view");
    const empties = page.getByRole("button", { name: /, empty$/ });
    await empties.first().waitFor({ state: "visible" });
    await empties.nth(112).click();
    await empties.nth(113).click();

    const record = page.getByTestId("move-history");
    await expect(record).toContainText("H8");
    /*
     * WHERE IT IS, not merely that it exists — the list was already on this
     * page and sat under the opponent, the controls, the shared-game panel and
     * the settings, about 1,200 pixels down. A record nobody finds is the same
     * as no record, which is what the ticket was about.
     */
    const order = await page.evaluate(() => {
      const top = (id: string) => document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().top ?? 1e9;
      return { record: top("move-history"), opponent: top("computer-opponent") || 1e9, notes: top("notes-panel") };
    });
    expect(order.record).toBeLessThan(order.notes);
  });

  test("plays a pasted game out on the board, and walks back through it", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await ready(page, "game-view");

    // A list in the mess a real one comes in: move numbers, mixed case, a result.
    await page.getByTestId("paste-moves-text").fill("1. h8 2. K10 3. j9 4. L11 1-0");
    await page.getByTestId("paste-moves-go").click();

    // It says what it read, on success as well as failure.
    await expect(page.getByTestId("paste-moves-said")).toContainText("Read 4 moves");

    // The stones are ON THE BOARD, which is the half a unit test cannot say.
    await expect(page.getByRole("button", { name: /^H8, Black stone$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^L11, White stone$/ })).toBeVisible();

    // And the record holds every one of them, to be walked back through.
    const record = page.getByTestId("move-history");
    for (const move of ["H8", "K10", "J9", "L11"]) await expect(record).toContainText(move);
  });

  /*
   * ANOTHER SITE'S GAME, copied off the page as the player sees it. GoldToken
   * letters its columns with I and counts rows from the top, so its I9 is this
   * site's J7 — read with this site's own rules it would be a different game.
   */
  test("reads a GoldToken move list by GoldToken's own lettering, known by its table", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await ready(page, "game-view");
    await page
      .getByTestId("paste-moves-text")
      .fill("Past Moves\nTurn\tdragonfire\n(Player 1)\tJohn Morris\n(Player 2)\n1\tH8\tI9\n2\tE8\tF8\n3\tG9");
    await page.getByTestId("paste-moves-go").click();
    await expect(page.getByTestId("paste-moves-said")).toContainText("Read 5 moves as a GoldToken move list");
    await expect(page.getByRole("button", { name: /^H8, Black stone$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^J7, White stone$/ })).toBeVisible();
  });

  test("reads an ItsYourTurn move list when it is said to be one", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await ready(page, "game-view");
    await page.getByTestId("paste-moves-from").selectOption("itsYourTurn");
    await page.getByTestId("paste-moves-text").fill("1. h8 i9\n2. j8");
    await page.getByTestId("paste-moves-go").click();
    await expect(page.getByTestId("paste-moves-said")).toContainText("Read 3 moves as an ItsYourTurn move list");
    // ItsYourTurn's i is its own column: i9 is this site's J9, and its j8 this site's K8.
    await expect(page.getByRole("button", { name: /^J9, White stone$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^K8, Black stone$/ })).toBeVisible();
  });

  test("says which move it could not read, and keeps the ones before it", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await ready(page, "game-view");
    await page.getByTestId("paste-moves-text").fill("H8 K10 Z99 J9");
    await page.getByTestId("paste-moves-go").click();
    const said = page.getByTestId("paste-moves-said");
    await expect(said).toContainText("Z99");
    // The two it could read are on the board: a half-read list beats none.
    await expect(page.getByRole("button", { name: /^H8, Black stone$/ })).toBeVisible();
  });

  /*
   * A PASTED GAME IS NOT FILED. A board played at one screen is mirrored to
   * the server as an unrated game from its first stone; another site's game,
   * pasted in, must not be filed here under this reader's name. Checked by
   * asking the server what it holds, which cannot pass by being early.
   */
  test("does not file a game somebody pasted in", async ({ page, request }) => {
    await page.goto("/games/gomoku/play");
    await ready(page, "game-view");
    const before = await request.get("/api/games/mine");
    const held = before.ok() ? (((await before.json()) as { games?: unknown[] }).games ?? []).length : 0;

    await page.getByTestId("paste-moves-text").fill("H8 K10 J9 L11 M12");
    await page.getByTestId("paste-moves-go").click();
    await expect(page.getByTestId("paste-moves-said")).toContainText("Read 5 moves");
    // Long enough for a mirror to have posted, had it been going to.
    await page.waitForTimeout(2_000);

    const after = await request.get("/api/games/mine");
    const now = after.ok() ? (((await after.json()) as { games?: unknown[] }).games ?? []).length : 0;
    expect(now, "a pasted game was filed as if it had been played here").toBe(held);
  });
});
