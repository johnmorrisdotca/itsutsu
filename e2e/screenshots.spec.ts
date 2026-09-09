import { test } from "@playwright/test";
import { openAdvanced, openSetup, playAt, playSequence } from "./support";

/**
 * Screenshots, not assertions.
 *
 * This spec exists to produce the images in `screenshots/` — one per surface
 * worth looking at. It is kept out of the ordinary run by name, so a failing
 * screenshot never blocks a real test suite.
 */
const SHOTS = "screenshots";

/** A mid-game position with real shape on the board, rather than a few stones. */
const OPENING: [number, number][] = [
  [7, 7], [7, 8],
  [8, 8], [6, 6],
  [8, 6], [8, 7],
  [9, 7], [6, 8],
  [6, 7], [9, 9],
];

test.describe("screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");
  });

  test("the board in play", async ({ page }) => {
    await playSequence(page, 15, OPENING);
    await page.screenshot({ path: `${SHOTS}/01-board-in-play.png`, fullPage: true });
  });

  test("a threat the other side has to answer", async ({ page }) => {
    // Black builds an open three; white is warned it must respond.
    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4], [0, 1], [7, 5]]);
    await page.locator("[data-outlook]").waitFor();
    await page.screenshot({ path: `${SHOTS}/02-danger-warning.png`, fullPage: true });
  });

  test("the engine naming a best move", async ({ page }) => {
    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4], [0, 1], [7, 5], [0, 2]]);
    await page.getByTestId("ask-hint").click();
    await page.getByTestId("hint-line").waitFor();
    await page.screenshot({ path: `${SHOTS}/03-best-move-hint.png`, fullPage: true });
  });

  test("a won game with the winning line marked", async ({ page }) => {
    await playSequence(page, 15, [
      [7, 3], [0, 0], [7, 4], [0, 1], [7, 5], [0, 2], [7, 6], [0, 3], [7, 7],
    ]);
    await openSetup(page);
    await page.getByLabel("Move numbers").check();
    await page.screenshot({ path: `${SHOTS}/04-won-game.png`, fullPage: true });
  });

  test("the mini board with obstacles", async ({ page }) => {
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("9");
    await openSetup(page);
    await page.getByTestId("obstacles").selectOption("hoshi");
    await playSequence(page, 9, [[4, 4], [3, 3], [5, 5], [2, 5], [3, 5]]);
    await page.screenshot({ path: `${SHOTS}/05-mini-board-obstacles.png`, fullPage: true });
  });

  test("every board theme", async ({ page }) => {
    await playSequence(page, 15, OPENING);
    // The panel folds itself away once a game is under way, and a control
    // inside a closed <details> is in the DOM but cannot be clicked.
    await openSetup(page);

    for (const theme of ["kaya", "shinkaya", "washi", "sumi", "matcha"]) {
      await page.getByTestId(`board-theme-${theme}`).click();
      await page.locator(".aspect-square").first().screenshot({
        path: `${SHOTS}/themes/${theme}.png`,
      });
    }
  });

  test("every stone set", async ({ page }) => {
    await playSequence(page, 15, OPENING);
    // The panel folds itself away once a game is under way, and a control
    // inside a closed <details> is in the DOM but cannot be clicked.
    await openSetup(page);

    for (const set of ["classic", "jade", "sakura", "indigo", "neon"]) {
      await page.getByTestId(`stone-set-${set}`).click();
      await page.locator(".aspect-square").first().screenshot({
        path: `${SHOTS}/stones/${set}.png`,
      });
    }
  });

  test("clocks, who is ahead, and the early warning", async ({ page }) => {
    /*
     * "Show chance of winning" was replaced by "Who is ahead" when the
     * percentage went, and this file was missed — the label it reached for
     * had not existed for hours. A screenshot spec is the easiest place in
     * the suite to leave an orphan like that, because nothing it asserts
     * fails until the click itself cannot land.
     */
    await openAdvanced(page);
    await openSetup(page);
    await page.getByTestId("time-control").selectOption("rapid");
    await page.getByLabel("Who is ahead").check();
    await page.getByLabel("Warn before a three forms").check();

    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4]]);
    await page.getByTestId("building-warning").waitFor();
    await page.screenshot({ path: `${SHOTS}/11-clock-and-odds.png`, fullPage: true });
  });

  test("the statistics after a game", async ({ page }) => {
    await playSequence(page, 15, [
      [7, 3], [0, 0], [7, 4], [0, 1], [7, 5], [14, 14], [7, 6], [0, 3], [7, 7],
    ]);
    await page.getByTestId("game-stats").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SHOTS}/12-game-stats.png`, fullPage: true });
  });

  test("the record and a replay", async ({ page }) => {
    await page.goto("/history");
    await page.screenshot({ path: `${SHOTS}/06-record.png`, fullPage: true });

    const first = page.getByTestId("history-list").getByRole("link").first();
    if ((await first.count()) > 0) {
      await first.click();
      await page.screenshot({ path: `${SHOTS}/07-replay.png`, fullPage: true });
    }
  });

  test("a shared game with its seat links", async ({ page, request }) => {
    const created = await request.post("/api/games/live", { data: { size: 15 } });
    const game = await created.json();

    await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 7, col: 7 },
    });

    await page.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);
    await page.screenshot({ path: `${SHOTS}/08-shared-game.png`, fullPage: true });
  });

  test("the embeddable board", async ({ page }) => {
    await page.setViewportSize({ width: 560, height: 700 });
    await page.goto("/embed?size=9&theme=sumi&stones=neon");
    await playAt(page, 9, 4, 4);
    await playAt(page, 9, 3, 3);
    await page.screenshot({ path: `${SHOTS}/09-embed.png`, fullPage: true });
  });

  test("dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/games/gomoku");
    await playSequence(page, 15, OPENING);
    await openSetup(page);
    await page.getByTestId("board-theme-sumi").click();
    await page.screenshot({ path: `${SHOTS}/10-dark-mode.png`, fullPage: true });
  });
});
