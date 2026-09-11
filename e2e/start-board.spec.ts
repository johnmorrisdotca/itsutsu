import { expect, test } from "@playwright/test";

import { openGamesPage } from "./support";

import { memberContext } from "./members";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * The board is chosen before the game exists.
 *
 * Starting a game offered Game, Pace and Opponent and no board at all, so the
 * only way to pick a size was to create the game first and edit it afterwards
 * — arriving at a board that already looks started and only then finding out
 * what could still be changed.
 *
 * The control is only there where there is a choice. Most games are played on
 * one board and have nothing to ask, and the sentence being one line is the
 * whole of what it is for.
 */
test.describe("choosing the board in the sentence", () => {
  test("offers a board for a game that has more than one", async ({ page }) => {
    await openGamesPage(page);
    await page.getByTestId("start-game-variant").selectOption("freestyle");

    const board = page.getByTestId("start-game-board");
    await expect(board).toBeVisible();
    await expect(board.locator("option")).toHaveText(["9×9", "13×13", "15×15", "19×19"]);
  });

  test("asks nothing about a game played on one board", async ({ page }) => {
    await openGamesPage(page);
    // Reversi is 8×8 and nothing else: there is no decision to put to anybody.
    await page.getByTestId("start-game-variant").selectOption("reversi");
    await expect(page.getByTestId("start-game-board")).toHaveCount(0);
  });

  test("starts the game on the board that was chosen", async ({ page, request }) => {
    await openGamesPage(page);
    await page.getByTestId("start-game-variant").selectOption("freestyle");
    await page.getByTestId("start-game-board").selectOption("19");

    /*
     * Against a computer, so a game is certainly made. "With anyone" sits down
     * at a seat somebody has already posted when there is a matching one, which
     * is the right thing for it to do and the wrong thing to assert a newly
     * chosen board against — the board would be the poster's, not this one.
     */
    const opponents = page.getByTestId("start-game-with");
    const computer = (await opponents.locator("option").evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value).filter((value) => value.startsWith("c:")),
    ))[0];
    expect(computer).toBeDefined();
    await opponents.selectOption(computer);
    await page.getByTestId("start-game").getByRole("button").last().click();

    await page.waitForURL(/\/games\/gomoku\/match\/[a-z0-9-]+/, { timeout: 30_000 });
    const id = page.url().split("/games/gomoku/match/")[1].split("/")[0];
    const made = await (await request.get(`/api/games/${id}`)).json();
    expect(made.size).toBe(19);
    expect(made.variant).toBe("freestyle");
  });

  test("opens on the board somebody is already waiting on", async ({ page, browser, baseURL }) => {
    /*
     * The regression this control could easily have caused. Every seat posted
     * before it existed is on the size the old code sent, so a control that
     * opened at a fixed 15×15 would have stopped matching them: the reader
     * would post a second seat beside the one already waiting and neither
     * would ever be filled. Following the waiting seat keeps the common case
     * one click.
     */
    const stamp = Date.now().toString(36);
    // Somebody, and not this reader: their own seat is not offered back.
    const waiting = await memberContext(browser, baseURL ?? "http://localhost:6600", {
      email: "board-waiting@example.test",
      name: "Board Waiting",
    });
    const waited = await waiting.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, blackName: `Waiting ${stamp}`, moveTimeMs: 604800000, open: true },
    });
    tidyAway(((await waited.json()) as { id: string }).id);
    await waiting.close();

    await openGamesPage(page);
    await page.getByTestId("start-game-variant").selectOption("freestyle");
    await page.getByTestId("start-game-with").selectOption("anyone");
    await page.getByTestId("start-game-pace").selectOption("604800000");

    // Nobody has touched the board control, and it has found them.
    await expect(page.getByTestId("start-game-board")).toHaveValue("9");
    await expect(page.getByTestId("start-game").getByRole("button").last()).toContainText(/Sit down with/);
  });

  test("only offers a posted seat that is on the board being asked for", async ({
    page,
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    // Somebody posts a 9×9 seat, at a pace nothing else here is using — and
    // it has to be somebody, since a seat is not offered back to its poster.
    const poster = await memberContext(browser, baseURL ?? "http://localhost:6600", {
      email: "board-poster@example.test",
      name: "Board Poster",
    });
    const posted = await poster.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, blackName: `Poster ${stamp}`, moveTimeMs: 604800000, open: true },
    });
    expect(posted.status()).toBe(201);
    tidyAway(((await posted.json()) as { id: string }).id);
    await poster.close();

    await openGamesPage(page);
    await page.getByTestId("start-game-variant").selectOption("freestyle");
    await page.getByTestId("start-game-with").selectOption("anyone");
    await page.getByTestId("start-game-pace").selectOption("604800000");

    // Asking for their board offers their seat…
    await page.getByTestId("start-game-board").selectOption("9");
    await expect(page.getByTestId("start-game").getByRole("button").last()).toContainText(/Sit down with/);

    // …and asking for a different one does not pretend it will do.
    await page.getByTestId("start-game-board").selectOption("19");
    await expect(page.getByTestId("start-game").getByRole("button").last()).not.toContainText(/Sit down with/);
  });

  test("keeps a chosen board across a game that cannot use it", async ({ page }) => {
    await openGamesPage(page);
    await page.getByTestId("start-game-variant").selectOption("freestyle");
    await page.getByTestId("start-game-board").selectOption("19");

    // Through a game with one fixed board, and back again.
    await page.getByTestId("start-game-variant").selectOption("reversi");
    await expect(page.getByTestId("start-game-board")).toHaveCount(0);
    await page.getByTestId("start-game-variant").selectOption("freestyle");

    // Still 19×19: looking at another game does not quietly lose the choice.
    await expect(page.getByTestId("start-game-board")).toHaveValue("19");
  });
});
