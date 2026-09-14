import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  aComputerOpponent,
  chooseBoard,
  chooseGame,
  chooseOpening,
  chooseOpponent,
  openMoreSettings,
  openSetUpPage,
  ready,
} from "./support";

/**
 * THE LAST PAGE BEFORE A GAME SHOWS THE BOARD THE SET-UP CHOSE, LARGER.
 *
 * John, with the Checkers doorstep in front of him — a paragraph and a table,
 * no picture: "Checkers page, and all pages like it, should use the Board
 * Icon... since this is the last page before the game... perhaps we use new
 * larger icons? if so we need to always create a larger set of icons with
 * number too... or whatever you think is the best icon."
 *
 * And the rule the picture keeps, from the set-up screen it comes from: "I
 * don't want the 9x9 size under every board... i want consistency. Like
 * checkers, just the big number now. easier to read". So the doorstep's board
 * is the big numbered mark and its name, with no size line beside it.
 *
 * Driven by clicking, the way a reader gets there: the set-up screen, a game,
 * a board, Start. Nothing types the doorstep's address and nothing reloads.
 * No game is written — nobody presses Begin — so there is nothing to tidy.
 */

/** Presses Start and waits for the doorstep to be listening. */
async function start(page: Page) {
  await page.getByTestId("set-up-start").click();
  await ready(page, "doorstep");
}

/** The width of the chosen block's mark on the set-up screen, to compare the doorstep's with. */
async function blockMarkWidth(page: Page, size: number): Promise<number> {
  const mark = page
    .locator(`[data-testid="set-up-size"][data-size="${size}"]`)
    .getByRole("img", { name: `${size} by ${size} board` });
  await expect(mark).toBeVisible();
  return (await mark.boundingBox())!.width;
}

/**
 * The doorstep's board: the chosen size as the big number in the picture, the
 * name under it, larger than the block it was chosen from, and no "13×13" beside it.
 */
async function expectChosenBoard(page: Page, size: number, name: string, blockWidth: number): Promise<Locator> {
  const figure = page.getByTestId("doorstep-board");
  await expect(figure).toHaveAttribute("data-size", String(size));
  const mark = figure.getByRole("img", { name: `${size} by ${size} board` });
  await expect(mark).toHaveText(String(size));
  expect((await mark.boundingBox())!.width, "larger than the set-up block's mark").toBeGreaterThan(blockWidth);
  await expect(figure.getByTestId("doorstep-board-name")).toContainText(name);
  // Absent, asked only after the picture and its name above were read.
  await expect(page.getByTestId("doorstep-pictures")).not.toContainText("×");
  return figure;
}

test.describe("the doorstep draws the chosen board", () => {
  test("Checkers' one board is the big 8 and its name, with no size line", async ({ page }) => {
    await openSetUpPage(page);
    await chooseGame(page, "checkers");
    const block = await blockMarkWidth(page, 8);
    await start(page);
    await expect(page).toHaveURL(/\/games\/checkers\/begin\?/);

    await expectChosenBoard(page, 8, "Eight", block);
    // One opening, so no picture of one: the board is visible, so this absence is about a rendered page.
    await expect(page.getByTestId("doorstep-opening")).toHaveCount(0);
  });

  test("Go on 13×13 shows the big 13, and changing it to 19×19 shows the 19", async ({ page }) => {
    await openSetUpPage(page);
    await chooseGame(page, "go");
    await chooseBoard(page, 13);
    const block = await blockMarkWidth(page, 13);
    await start(page);
    await expect(page).toHaveURL(/\/games\/go\/begin\?/);
    await expectChosenBoard(page, 13, "Medium", block);
    await expect(page.getByTestId("doorstep-board").getByRole("img", { name: "19 by 19 board" })).toHaveCount(0);

    // The way back, and a different answer on the return.
    await page.getByTestId("doorstep-change").click();
    await ready(page, "set-up-game");
    await expect(page.locator('[data-testid="set-up-size"][data-chosen="true"]')).toHaveAttribute("data-size", "13");
    await chooseBoard(page, 19);
    await start(page);
    await expectChosenBoard(page, 19, "Go board", block);
  });

  test("an opening chosen among several is drawn beside the board, on that board", async ({ page }) => {
    await openSetUpPage(page);
    await chooseGame(page, "freestyle");
    await chooseBoard(page, 15);
    const block = await blockMarkWidth(page, 15);
    await openMoreSettings(page);
    await chooseOpening(page, "pro");
    /*
     * Against a program, so this spec brings its own world. With nobody named, a
     * seat somebody left posted on this game and board is taken instead — and the
     * doorstep then states THAT seat's rules, opening and all, which is right of
     * the page and says nothing about the opening chosen here.
     */
    await chooseOpponent(page, await aComputerOpponent(page));
    await start(page);
    await expect(page.getByTestId("doorstep-begin")).not.toContainText("Sit down");

    await expectChosenBoard(page, 15, "Standard", block);
    const opening = page.getByTestId("doorstep-opening");
    await expect(opening).toHaveAttribute("data-opening", "pro");
    await expect(opening.getByTestId("doorstep-opening-name")).toContainText("Pro");
  });
});
