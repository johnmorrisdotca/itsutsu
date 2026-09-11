import { expect, test } from "@playwright/test";

import { chooseBoard, chooseGame, chosenBoard, openSetUpPage } from "./support";
import { memberContext } from "./members";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * The board is chosen before the game exists.
 *
 * This was "choosing the board in the sentence" and tested a control inside a
 * one-line form in the lobby. The sentence has gone; CHOOSING THE BOARD is
 * still an intention and is still tested, on the screen that replaced it.
 *
 * The control is only there where there is a choice. Most games are played on
 * one board and have nothing to ask.
 */
const WEEK = 604800000;

async function setUp(page: import("@playwright/test").Page, variant: string) {
  await openSetUpPage(page);
  await chooseGame(page, variant);
}

test.describe("choosing the board before the game exists", () => {
  test("offers a board for a game that has more than one", async ({ page }) => {
    await setUp(page, "freestyle");
    const board = page.getByTestId("shared-rules-size");
    await expect(board).toBeVisible();
    // Big blocks with the numbers on them, in the order the boards grow.
    await expect(page.getByTestId("set-up-size")).toHaveText([/^9×9/, /^13×13/, /^15×15/, /^19×19/]);
  });

  test("asks nothing about a game played on one board", async ({ page }) => {
    await setUp(page, "reversi");
    // Reversi is 8×8 and nothing else: there is no decision to put to anybody.
    // Asserted after a control that IS on the form, so an absence cannot be
    // satisfied by a page that has not rendered.
    await expect(page.getByTestId("set-up-with")).toBeVisible();
    await expect(page.getByTestId("shared-rules-size")).toHaveCount(0);
  });

  test("starts the game on the board that was chosen", async ({ page, request }) => {
    await setUp(page, "freestyle");
    await chooseBoard(page, 19);

    /*
     * Against a computer, so a game is certainly made and made on this board.
     * "For anyone" sits down at a matching posted seat when there is one,
     * which is right and is the wrong thing to assert a chosen board against
     * — the board would be the poster's rather than this one.
     */
    const opponents = page.getByTestId("set-up-with");
    const computer = (
      await opponents
        .locator("option")
        .evaluateAll((options) =>
          options.map((option) => (option as HTMLOptionElement).value).filter((value) => value.startsWith("c:")),
        )
    )[0];
    expect(computer).toBeDefined();
    await opponents.selectOption(computer);
    await page.getByTestId("set-up-start").click();

    await page.waitForURL(/\/games\/gomoku\/match\/[a-z0-9-]+/, { timeout: 30_000 });
    const id = page.url().split("/games/gomoku/match/")[1].split("/")[0];
    const made = await (await request.get(`/api/games/${id}`)).json();
    expect(made.size).toBe(19);
    expect(made.variant).toBe("freestyle");
  });

  test("opens on the board somebody is already waiting on", async ({ page, browser, baseURL }) => {
    /*
     * The regression this control could easily cause, and the reason it was
     * carried over from the sentence rather than left behind. Every seat on
     * the noticeboard was posted at some size, so a screen that always opened
     * at the member's own favourite would stop matching them — asking for a
     * game would post a SECOND seat beside the one already waiting and neither
     * would ever be filled. Following the waiting seat keeps it one press.
     */
    const stamp = Date.now().toString(36);
    // Somebody, and not this reader: their own seat is not offered back.
    const waiting = await memberContext(browser, baseURL ?? "http://localhost:6600", {
      email: "board-waiting@example.test",
      name: "Board Waiting",
    });
    const waited = await waiting.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, blackName: `Waiting ${stamp}`, moveTimeMs: WEEK, open: true },
    });
    tidyAway(((await waited.json()) as { id: string }).id);
    await waiting.close();

    await setUp(page, "freestyle");
    await page.getByTestId("set-up-with").selectOption("anyone");
    await page.getByTestId("shared-rules-move-time").selectOption(String(WEEK));

    // Nobody has touched the board, and it has found them.
    await expect(chosenBoard(page)).toHaveAttribute("data-size", "9");
    await expect(page.getByTestId("set-up-start")).toContainText(/Sit down with/);
  });

  test("only offers a posted seat that is on the board being asked for", async ({ page, browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    // Somebody posts a 9×9 seat, at a pace nothing else here uses — and it has
    // to be somebody, since a seat is not offered back to its poster.
    const poster = await memberContext(browser, baseURL ?? "http://localhost:6600", {
      email: "board-poster@example.test",
      name: "Board Poster",
    });
    const posted = await poster.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, blackName: `Poster ${stamp}`, moveTimeMs: WEEK, open: true },
    });
    expect(posted.status()).toBe(201);
    tidyAway(((await posted.json()) as { id: string }).id);
    await poster.close();

    await setUp(page, "freestyle");
    await page.getByTestId("set-up-with").selectOption("anyone");
    await page.getByTestId("shared-rules-move-time").selectOption(String(WEEK));

    // Asking for their board offers their seat…
    await chooseBoard(page, 9);
    await expect(page.getByTestId("set-up-start")).toContainText(/Sit down with/);

    // …and asking for a different one does not pretend it will do.
    await chooseBoard(page, 19);
    await expect(page.getByTestId("set-up-start")).not.toContainText(/Sit down with/);
  });

  test("keeps a chosen board across a game that cannot use it", async ({ page }) => {
    await setUp(page, "freestyle");
    await chooseBoard(page, 19);

    // Through a game with one fixed board, and back again.
    await chooseGame(page, "reversi");
    await expect(page.getByTestId("set-up-with")).toBeVisible();
    await expect(page.getByTestId("shared-rules-size")).toHaveCount(0);
    await chooseGame(page, "freestyle");

    // Still 19×19: looking at another game does not quietly lose the choice.
    await expect(chosenBoard(page)).toHaveAttribute("data-size", "19");
  });
});
