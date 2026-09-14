import { expect, test } from "@playwright/test";

import {
  aComputerOpponent,
  chooseBoard,
  chooseGame,
  chooseOpponent,
  chosenBoard,
  openMoreSettings,
  openSetUpPage,
  startAndBegin,
} from "./support";
import { memberContext } from "./members";
import { gamesMade, namesPlayedUnder } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();
/** And the names they were played under, which outlive the games. */
const under = namesPlayedUnder();

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
    /*
     * Big blocks with the numbers on them, in the order the boards grow.
     *
     * Read block by block rather than as one list of strings starting "9×9":
     * the block's first text is now the number drawn INSIDE the picture, so a
     * `^` match on the caption would fail for a reason that has nothing to do
     * with the order being tested here.
     */
    const blocks = page.getByTestId("set-up-size");
    await expect(blocks).toHaveCount(4);
    for (const [at, size] of [9, 13, 15, 19].entries()) {
      await expect(blocks.nth(at)).toHaveAttribute("data-size", String(size));
      await expect(blocks.nth(at)).toContainText(`${size}×${size}`);
    }
  });

  test("shows a one-board game its board, and asks nothing about it", async ({ page }) => {
    await setUp(page, "reversi");
    /*
     * Reversi is 8×8 and nothing else, so there is no decision to put to
     * anybody — and since 0.158.7 the board is SHOWN rather than hidden, as one
     * block with no tick on it and nothing to press. This case used to assert
     * the absence, which was the right claim when a one-option picker hid
     * itself and is the wrong one now: John's words were "the Reversi games
     * don't even have a board size… they should!"
     *
     * The two halves are separate assertions because they are separate facts:
     * the board is stated, and it is not a choice.
     */
    await expect(page.getByTestId("more-settings-open")).toBeVisible();
    await expect(page.getByTestId("set-up-size")).toHaveCount(1);
    await expect(chosenBoard(page)).toHaveAttribute("data-size", "8");
    await expect(chosenBoard(page)).toHaveAttribute("data-only", "true");
  });

  test("puts every board's number in its picture, and says a lone one in words", async ({ page }) => {
    await setUp(page, "reversi");
    /*
     * John: "a second set of images where we actually put in the number of the
     * size in the middle of that image… if you don't have the size below it in
     * text it is incorporated directly in the image."
     *
     * The lone block drops its "8×8" line, so two things have to be true at
     * once: the 8 is on the screen, IN the picture, and somebody who cannot see
     * the picture still gets the size — by the image's name, and so by the
     * radio's, which is what a screen reader announces on arriving at it.
     */
    const lone = chosenBoard(page);
    const mark = lone.getByRole("img", { name: "8 by 8 board" });
    await expect(mark).toBeVisible();
    await expect(mark).toHaveText("8");
    await expect(page.getByRole("radio", { name: /^8 by 8 board/ })).toBeChecked();

    /*
     * And a game with a CHOICE draws the same picture in every block, number
     * and all. It used to draw the plain lattice there, which is the
     * inconsistency John came back about: "I thought I already asked for the
     * 9x9, 15x15 etc board images to also have a set with the Number directly
     * centered in the board… I see it's done for some options but not
     * consistently for all."
     *
     * What still differs is the TEXT: "9×9" sits under the picture and names
     * the radio, so each mark stays silent to a screen reader rather than
     * saying the size a second time. The four blocks are waited for BEFORE
     * that absence is asserted, so the absence is a statement about a drawn
     * row rather than an early one.
     */
    await chooseGame(page, "freestyle");
    await expect(page.getByTestId("set-up-size")).toHaveCount(4);
    const marks = page.getByTestId("shared-rules-size").getByTestId("board-size-mark");
    await expect(marks).toHaveCount(4);
    for (const [at, size] of [9, 13, 15, 19].entries()) {
      await expect(marks.nth(at)).toHaveAttribute("data-size", String(size));
      await expect(marks.nth(at)).toHaveText(String(size));
      await expect(marks.nth(at)).toHaveAttribute("aria-hidden", "true");
    }
    await expect(page.getByTestId("shared-rules-size").getByRole("img")).toHaveCount(0);
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
    await openMoreSettings(page);
    await chooseOpponent(page, await aComputerOpponent(page));
    await startAndBegin(page);

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
      data: { variant: "freestyle", size: 9, blackName: under(`Waiting ${stamp}`), moveTimeMs: WEEK, open: true },
    });
    tidyAway(((await waited.json()) as { id: string }).id);
    await waiting.close();

    await setUp(page, "freestyle");
    await openMoreSettings(page);
    await chooseOpponent(page, "anyone");
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
      data: { variant: "freestyle", size: 9, blackName: under(`Poster ${stamp}`), moveTimeMs: WEEK, open: true },
    });
    expect(posted.status()).toBe(201);
    tidyAway(((await posted.json()) as { id: string }).id);
    await poster.close();

    await setUp(page, "freestyle");
    await openMoreSettings(page);
    await chooseOpponent(page, "anyone");
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

    // Through a game with one fixed board, and back again. That game shows its
    // own board as the only block there is — see the case above — so what this
    // waits on is the row holding exactly one, rather than holding none.
    await chooseGame(page, "reversi");
    await expect(page.getByTestId("more-settings-open")).toBeVisible();
    await expect(page.getByTestId("set-up-size")).toHaveCount(1);
    await chooseGame(page, "freestyle");

    // Still 19×19: looking at another game does not quietly lose the choice.
    await expect(chosenBoard(page)).toHaveAttribute("data-size", "19");
  });
});
