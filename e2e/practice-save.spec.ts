import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { playAt, winningSequence } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * A PRACTICE WIN IS FILED EVEN WHEN THE PLAYER LEAVES THE MOMENT IT IS WON.
 *
 * The board draws "wins in 9 moves" in the browser, and the mirror posts the
 * winning stone to the server behind it (`useMatchMirror`). A player who left in
 * that moment — typed another address, closed the tab — took the request with
 * them: the browser cancels a page's fetches when the page goes, the server never
 * heard the winning stone, and the game sat unfinished and was never filed.
 * Locally the post takes about 20ms; on the real site it is a round trip to a
 * server and a database, and the moment is long enough to leave in.
 *
 * So each case here plays eight stones and waits for the address to say the
 * server holds them — a player pausing before the last stone, as people do — then
 * holds the ninth request back for a second and a half, which is that round trip,
 * plays the winning stone and leaves at once. The game must be filed however the
 * page was left.
 */

const HOLD_MS = 1_500;

async function upToTheWinningStone(page: Page, stamp: string): Promise<string> {
  await page.goto("/games/gomoku/play");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto("/games/gomoku/play");
  await page.getByLabel(/Player 1/).first().fill(stamp);
  const moves = winningSequence();
  for (const [row, col] of moves.slice(0, -1)) await playAt(page, 15, row, col);
  // The server holds all eight: the address names the position only once it does.
  await expect(page).toHaveURL(/\/games\/gomoku\/match\/[^/]+\/8$/, { timeout: 30_000 });
  const id = new URL(page.url()).pathname.split("/")[4];
  tidyAway(id);
  return id;
}

/** The winning stone's post takes as long as a real round trip does. */
async function slowTheWinningStone(context: BrowserContext, id: string) {
  await context.route(`**/api/games/${id}/moves`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await new Promise((resolve) => setTimeout(resolve, HOLD_MS));
    await route.continue().catch(() => undefined);
  });
}

async function playTheWinningStone(page: Page) {
  const [row, col] = winningSequence().at(-1)!;
  await playAt(page, 15, row, col);
  await expect(page.getByText(/wins in 9 moves/)).toBeVisible();
}

/** Filed: the record has exactly this game, asked of the server and then read where a player reads it. */
async function filed(context: BrowserContext, stamp: string) {
  await expect
    .poll(
      async () => {
        const response = await context.request.get(`/api/games?search=${stamp}`);
        const page = (await response.json()) as { pagination: { total: number } };
        return page.pagination.total;
      },
      { message: "the won game was never filed", timeout: 15_000 },
    )
    .toBe(1);
  const record = await context.newPage();
  await record.goto(`/history?search=${stamp}`);
  await expect(record.getByTestId("history-list").getByRole("listitem")).toHaveCount(1);
  await expect(record.getByTestId("history-list").getByRole("listitem").first()).toContainText("9 moves");
  await record.close();
}

test.describe("a practice win the player leaves at once", () => {
  test("is filed when they type another address", async ({ page, context }) => {
    const stamp = `Leaver${Date.now()}`;
    const id = await upToTheWinningStone(page, stamp);
    await slowTheWinningStone(context, id);
    await playTheWinningStone(page);
    await page.goto("/games");
    await filed(context, stamp);
  });

  test("is filed when they close the tab", async ({ page, context }) => {
    const stamp = `Closer${Date.now()}`;
    const id = await upToTheWinningStone(page, stamp);
    await slowTheWinningStone(context, id);
    await playTheWinningStone(page);
    await page.close();
    await filed(context, stamp);
  });

  test("is filed when they follow a link on the page", async ({ page, context }) => {
    const stamp = `Linker${Date.now()}`;
    const id = await upToTheWinningStone(page, stamp);
    await slowTheWinningStone(context, id);
    await playTheWinningStone(page);
    await page.getByRole("navigation").locator('a[href="/games"]').first().click();
    await expect(page).toHaveURL(/\/games$/);
    await filed(context, stamp);
  });
});
