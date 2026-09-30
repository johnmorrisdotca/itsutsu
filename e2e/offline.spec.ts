import { expect, test, type Page } from "@playwright/test";

import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";

import { freshPuzzleSeed, playAt, ready } from "./support";

/**
 * PLAYING WITH NO CONNECTION (public/sw.js). John, 2026-09-30: "Allow the
 * user to play certain games off-line", then "So the site needs an offline
 * mode."
 *
 * Every other spec blocks the keeper (`playwright.config.ts`); this one lets
 * it run, opens a game once while online, and then takes the network away —
 * `context.setOffline`, which is the device losing its signal, not a route
 * standing in for the site — and plays.
 *
 * The keeper registers only in a production build (`OfflineKeeper`), so under
 * `pnpm dev` there is nothing to test and the file says so and skips.
 */
test.use({ serviceWorkers: "allow" });
test.skip(process.env.E2E_SERVER !== "start", "the offline keeper runs only in a production build (E2E_SERVER=start)");

/** The keeper is running this page, and has kept what the first visit handed it. */
async function kept(page: Page, path: string) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(async (want) => (await (await caches.open("itsutsu-pages-v1")).keys()).some((key) => new URL(key.url).pathname === want), path), {
      message: `${path} is kept on the device`,
    })
    .toBe(true);
}

test("a practice board opened once plays with no connection, and says it is offline", async ({ page, context }) => {
  await page.goto("/games/gomoku/play");
  await page.evaluate(() => window.localStorage.clear());
  await kept(page, "/games/gomoku/play");
  // And the games list, kept on its own first visit, marks the game.
  await page.goto("/games/cards");
  await kept(page, "/games/cards");

  await context.setOffline(true);
  try {
    await page.goto("/games/cards");
    await expect(page.getByTestId("offline-line")).toBeVisible();
    const mark = page.locator('[data-testid="ready-offline"][data-game="freestyle"]');
    await expect(mark).toHaveAttribute("href", "/games/gomoku/play");
    await mark.click();
    await expect(page).toHaveURL(/\/games\/gomoku\/play$/);
    await expect(page.getByTestId("offline-line")).toBeVisible();
    await playAt(page, 15, 7, 7);
    await playAt(page, 15, 7, 8);
    await expect(page.getByRole("button", { name: /^H8, (?!empty)/ })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

test("a puzzle opened once makes a new puzzle with no connection, from the seed in its address", async ({ page, context }) => {
  await page.goto("/games/number-place/play?size=4&level=easy");
  await ready(page, "puzzle-play");
  await kept(page, "/games/number-place/play");

  await context.setOffline(true);
  try {
    await page.goto("/games/number-place/play?size=4&level=easy&seed=12345");
    await ready(page, "puzzle-play");
    // Drawn from the address the keeper was asked for, not drawn again: the page did not move.
    await expect(page).toHaveURL(/seed=12345/);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-seed", "12345");
    await expect(page.getByTestId("puzzle-making")).toHaveCount(0);

    // A new puzzle chosen at a size and level never opened here: made as chosen, the page kept at another answering for it.
    await page.goto("/games/number-place/play?size=6&level=hard");
    await expect(page).toHaveURL(/size=6&level=hard&seed=\d+/);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-making")).toHaveCount(0);
    const address = page.url();
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-ready", "true");
    expect(page.url(), "the page settled on one puzzle rather than drawing another").toBe(address);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-seed", new URL(address).searchParams.get("seed")!);
  } finally {
    await context.setOffline(false);
  }
});

test("a page this device never kept says it needs a connection, and lists what is ready", async ({ page, context }) => {
  await page.goto("/games/gomoku/play");
  await kept(page, "/games/gomoku/play");

  await context.setOffline(true);
  try {
    await page.goto("/players");
    await expect(page.getByTestId("offline-page")).toBeVisible();
    await expect(page.getByTestId("offline-kept").getByRole("link").first()).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

test("Keep every game offline keeps the games never opened here, says what it came to, and Remove takes them away", async ({ page, context }) => {
  test.setTimeout(300_000);
  await page.goto("/games");
  await kept(page, "/games");
  // The keeper takes the page over once it is running, and the offer appears only then.
  await page.getByTestId("keep-all-button").click();
  await expect(page.getByTestId("keep-all-done")).toBeVisible({ timeout: 240_000 });
  console.log(`kept every game: ${await page.getByTestId("keep-all-done").textContent()}`);

  await context.setOffline(true);
  try {
    // Never opened on this device, and there all the same.
    await page.goto("/games/mancala/pass-and-play");
    await expect(page).toHaveTitle(/Mancala/);
    await expect(page.getByTestId("offline-line")).toBeVisible();
    await page.goto("/games/number-place/new");
    await expect(page).toHaveTitle(/Sudoku|Number/);
    await expect(page.getByTestId("offline-page")).toHaveCount(0);
  } finally {
    await context.setOffline(false);
  }

  await page.goto("/games");
  await page.getByTestId("keep-all-remove").click();
  await expect(page.getByTestId("keep-all-button")).toBeVisible();
  await expect
    .poll(() => page.evaluate(async () => (await (await caches.open("itsutsu-pages-v1")).keys()).map((key) => new URL(key.url).pathname)), { message: "only the offline page is left" })
    .toEqual(["/offline.html"]);
});

test("a puzzle solved with no connection is kept on the device and handed in once back online", async ({ page, context }) => {
  await page.goto("/games/number-place/play?size=4&level=easy");
  await ready(page, "puzzle-play");
  await kept(page, "/games/number-place/play");
  await page.evaluate(() => window.localStorage.removeItem("itsutsu:solve-outbox"));
  const seed = freshPuzzleSeed();
  const puzzle = generateNumberPlace(4, "easy", seed);
  const givens = decodeCells(puzzle.givens, 4)!;
  const solution = decodeCells(puzzle.solution, 4)!;

  await context.setOffline(true);
  try {
    await page.goto(`/games/number-place/play?size=4&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    const cells = page.getByTestId("puzzle-cell");
    for (const [index, given] of givens.entries()) {
      if (given !== 0) continue;
      await cells.nth(index).click();
      await page.getByTestId(`puzzle-key-${solution[index]}`).click();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-done")).toContainText("You're offline");
    expect(await page.evaluate(() => Object.keys(JSON.parse(window.localStorage.getItem("itsutsu:solve-outbox") ?? "{}")).length)).toBe(1);
  } finally {
    await context.setOffline(false);
  }
  // Back online, the queue is sent and empties: the site has the solve.
  await expect.poll(() => page.evaluate(() => Object.keys(JSON.parse(window.localStorage.getItem("itsutsu:solve-outbox") ?? "{}")).length)).toBe(0);
  const again = await page.request.post("/api/puzzles/solved", {
    data: { kind: "numberPlace", size: 4, level: "easy", seed, givens: puzzle.givens, answer: puzzle.solution, elapsedMs: 1000 },
  });
  // The same grid a second time pays nothing: the site already holds it, from the queue.
  expect(((await again.json()) as { points?: number }).points ?? 0).toBe(0);
});
