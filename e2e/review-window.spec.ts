import { expect, test, type Page } from "@playwright/test";

import { matchPath } from "../src/lib/gomoku/slugs";
import { readyHere } from "./support";
import { namesPlayedUnder, removeGame } from "./tidy";

/**
 * A GAME'S REVIEW, OPENED ON ITS OWN, IS THE MINIMUM. John, 2026-09-26, with
 * an iPhone screenshot of a tic-tac-toe game's review: "The full screen view
 * should not have so much stuff on it. We don't need the move list below, just
 * the scrubber is OK. Remember, it's a minimum view. It should also be
 * centered." In the window: the header line, the board, the move it is at and
 * the scrubber with its five buttons; no move list, no move styles, no column
 * of buttons. All of it in the middle of the screen, and on a phone all of it
 * on the screen at once.
 */
const under = namesPlayedUnder();

async function finishedTicTacToe(page: Page): Promise<string> {
  const stamp = Date.now().toString(36);
  const made = await page.request.post("/api/games/live", {
    data: { blackName: under(`Crosses ${stamp}`), whiteName: under(`Noughts ${stamp}`), variant: "tictactoe", size: 3 },
  });
  expect(made.status(), await made.text()).toBe(201);
  const game = (await made.json()) as { id: string; blackToken: string; whiteToken: string };
  // Down the left-hand column: black wins on its third stone.
  const moves: [string, number, number][] = [
    [game.blackToken, 0, 0],
    [game.whiteToken, 0, 1],
    [game.blackToken, 1, 0],
    [game.whiteToken, 1, 1],
    [game.blackToken, 2, 0],
  ];
  for (const [token, row, col] of moves) {
    const played = await page.request.post(`/api/games/${game.id}/moves`, { data: { token, row, col } });
    expect(played.ok(), await played.text()).toBe(true);
  }
  expect(((await (await page.request.get(`/api/games/${game.id}`)).json()) as { status: string }).status).toBe("finished");
  return game.id;
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
]) {
  test(`at ${viewport.width}×${viewport.height}: the review window is the board, the move and the scrubber, centred`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const id = await finishedTicTacToe(page);
    try {
      await page.goto(matchPath("tictactoe", id));
      const replay = page.getByTestId("game-replay");
      await readyHere(replay);
      // On the page, the column is there: the move list and its styles stay on the game's own page.
      await expect(page.getByTestId("moves-fold")).toBeVisible();

      await page.getByTestId("board-focus-toggle").first().click();
      const window = page.locator('[data-board-focus="open"]');
      const panel = window.getByRole("dialog");
      await expect(panel).toBeVisible();

      // What stays: the header line, the board, the move line and the scrubber with its five buttons.
      await expect(panel.getByTestId("board-masthead")).toBeVisible();
      await expect(panel.getByTestId("bare-replay-scrubber")).toBeVisible();
      for (const button of ["start", "back", "play", "forward", "end"]) await expect(panel.getByTestId(`bare-replay-${button}`)).toBeVisible();
      await expect(panel.getByText(/^Move 5 of 5$/)).toBeVisible();
      // What goes: the move list, its styles and the column's own scrubber and buttons.
      for (const gone of ["moves-fold", "replay-scrubber", "turn-board", "show-move-numbers", "move-list"]) await expect(panel.getByTestId(gone)).toBeHidden();

      // Centred: the panel in the middle of the window, and the board in the middle of the panel.
      const box = async (testId: string | null) => (testId === null ? (await panel.boundingBox())! : (await panel.locator(`[data-testid="${testId}"]`).first().boundingBox())!);
      const centre = (b: { x: number; width: number }) => b.x + b.width / 2;
      const whole = await box(null);
      expect(Math.abs(centre(whole) - viewport.width / 2), "the panel is centred").toBeLessThan(2);
      const board = (await panel.locator("[data-focus-board]").boundingBox())!;
      expect(Math.abs(centre(board) - centre(whole)), "the board is centred in the panel").toBeLessThan(2);
      const scrubber = await box("bare-replay-scrubber");
      expect(Math.abs(centre(scrubber) - centre(whole)), "the scrubber is centred under the board").toBeLessThan(2);
      const buttons = await box("bare-replay-buttons");
      expect(Math.abs(centre(buttons) - centre(whole)), "the five buttons are centred under the board").toBeLessThan(2);

      // All of it on the screen at once: nothing to scroll to.
      expect(whole.x).toBeGreaterThanOrEqual(0);
      expect(whole.x + whole.width).toBeLessThanOrEqual(viewport.width);
      expect(whole.y).toBeGreaterThanOrEqual(0);
      expect(whole.y + whole.height, "the panel fits the screen").toBeLessThanOrEqual(viewport.height);

      // The scrubber moves the one replay, and Esc puts the page back as it was.
      await panel.getByTestId("bare-replay-start").click();
      await expect(panel.getByText(/^Move 0 of 5$/)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(window).toHaveCount(0);
      await expect(page.getByTestId("moves-fold")).toBeVisible();
    } finally {
      await removeGame(id);
    }
  });
}
