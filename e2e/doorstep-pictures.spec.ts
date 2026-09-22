import { expect, test, type Locator, type Page } from "@playwright/test";

import { seatPostedBySomebodyElse } from "./postedSeat";
import {
  chooseBoard,
  chooseGame,
  chooseOpening,
  openMoreSettings,
  openSetUpPage,
  ready,
} from "./support";
import { gamesMade } from "./tidy";

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
 * WHO SEES THIS PAGE NOW, and it is why each case here takes two browsers.
 * The set-up screen states a game of your own and writes it, so an ordinary
 * Begin goes straight to a board. The doorstep is what stands in front of
 * SOMEBODY ELSE'S POSTED SEAT — the one case where the rules being agreed to
 * were written by another person — and that is exactly the case a big picture
 * of the board earns its place in: it is a board you have not chosen.
 *
 * So each case posts the seat first, as another member, by making the same
 * choices on the same screen; then the reader makes them and presses, and the
 * press is an offer to sit down rather than a new game. Driven by clicking
 * throughout: nothing types the doorstep's address and nothing reloads.
 */

/** The games these cases post, taken away when the file finishes. */
const tidyAway = gamesMade();

/**
 * Reaches the doorstep the way a reader does now: by pressing Sit down on the
 * host's seat in the waiting room. Since 2026-09-22 a matched seat on the
 * set-up screen is sat at on the press — the doorstep stands only in front of
 * a seat reached COLD, which is this door.
 */
async function start(page: Page, seat: string) {
  await page.goto("/games");
  // By the seat's own id on its Sit down link: the room shortens names to an initial.
  const sit = page.locator(`[data-testid="sit"][href*="sit=${seat}"]`);
  await expect(sit, "the host's seat is not on the waiting room").toBeVisible();
  await sit.click();
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
 * name under it in one language, exactly twice the block it was chosen from —
 * John: "exactly DOUBLE the regular size, for symmetry" — and no "13×13" beside it.
 */
async function expectChosenBoard(page: Page, size: number, name: string, blockWidth: number): Promise<Locator> {
  const figure = page.getByTestId("doorstep-board");
  await expect(figure).toHaveAttribute("data-size", String(size));
  const mark = figure.getByRole("img", { name: `${size} by ${size} board` });
  await expect(mark).toHaveText(String(size));
  expect((await mark.boundingBox())!.width, "exactly twice the set-up block's mark").toBe(blockWidth * 2);
  await expect(figure.getByTestId("doorstep-board-name")).toHaveText(name);
  // Absent, asked only after the picture and its name above were read.
  await expect(page.getByTestId("doorstep-pictures")).not.toContainText("×");
  return figure;
}

test.describe("the doorstep draws the chosen board", () => {
  test("Checkers' one board is the big 8 and its name, with no size line", async ({ page, browser, baseURL }) => {
    const choose = async (on: Page) => {
      await chooseGame(on, "checkers");
    };
    const close = await seatPostedBySomebodyElse({ browser, baseURL: baseURL!, choose, noteGame: tidyAway });

    await openSetUpPage(page);
    await choose(page);
    const block = await blockMarkWidth(page, 8);
    await start(page, close.id);
    await expect(page).toHaveURL(/\/games\/checkers\/begin\?/);

    await expectChosenBoard(page, 8, "Eight", block);
    // One opening, so no picture of one: the board is visible, so this absence is about a rendered page.
    await expect(page.getByTestId("doorstep-opening")).toHaveCount(0);
    await close();
  });

  test("Go on 13×13 shows the big 13, and a 19×19 seat shows the 19", async ({ page, browser, baseURL }) => {
    const onThirteen = async (on: Page) => {
      await chooseGame(on, "go");
      await chooseBoard(on, 13);
    };
    const onNineteen = async (on: Page) => {
      await chooseGame(on, "go");
      await chooseBoard(on, 19);
    };
    /*
     * BOTH SEATS BEFORE THE READER ARRIVES. The screen is handed the seats
     * worth sitting at when the SERVER renders it, and coming back from the
     * doorstep is a client-side navigation the router may answer from its own
     * cache — so a seat posted halfway through would be one this page has
     * never been told about, and the case would fail for a reason that has
     * nothing to do with pictures.
     */
    const closeThirteen = await seatPostedBySomebodyElse({ browser, baseURL: baseURL!, choose: onThirteen, noteGame: tidyAway });
    const closeNineteen = await seatPostedBySomebodyElse({ browser, baseURL: baseURL!, choose: onNineteen, noteGame: tidyAway });

    await openSetUpPage(page);
    await onThirteen(page);
    const block = await blockMarkWidth(page, 13);
    await start(page, closeThirteen.id);
    await expect(page).toHaveURL(/\/games\/go\/begin\?/);
    await expectChosenBoard(page, 13, "Medium", block);
    await expect(page.getByTestId("doorstep-board").getByRole("img", { name: "19 by 19 board" })).toHaveCount(0);

    /*
     * THE WAY BACK, which a one-directional test never finds: Change returns
     * to the set-up screen with the seat's board chosen. Then a DIFFERENT
     * seat, so the picture is proved to follow the seat rather than to be the
     * only one this page can draw.
     */
    await page.getByTestId("doorstep-change").click();
    await ready(page, "set-up-game");
    await expect(page.locator('[data-testid="set-up-size"][data-chosen="true"]')).toHaveAttribute("data-size", "13");

    await start(page, closeNineteen.id);
    await expectChosenBoard(page, 19, "Go board", block);

    await closeNineteen();
    await closeThirteen();
  });

  test("an opening chosen among several is drawn beside the board, on that board", async ({
    page,
    browser,
    baseURL,
  }) => {
    /*
     * THE OPENING IS THE SEAT'S, and that is the point: a Pro opening is a rule
     * somebody else wrote, and reading it before sitting down is what this page
     * is for. Posted at fifteen with Pro, so the picture beside the board has
     * something to be about.
     */
    const choose = async (on: Page) => {
      await chooseGame(on, "freestyle");
      await chooseBoard(on, 15);
      await openMoreSettings(on);
      await chooseOpening(on, "pro");
    };
    const close = await seatPostedBySomebodyElse({ browser, baseURL: baseURL!, choose, noteGame: tidyAway });

    await openSetUpPage(page);
    await choose(page);
    const block = await blockMarkWidth(page, 15);
    await start(page, close.id);

    await expectChosenBoard(page, 15, "Standard", block);
    const opening = page.getByTestId("doorstep-opening");
    await expect(opening).toHaveAttribute("data-opening", "pro");
    await expect(opening.getByTestId("doorstep-opening-name")).toHaveText("Pro");
    await close();
  });
});
