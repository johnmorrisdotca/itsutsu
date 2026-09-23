import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { aComputerOpponent, chooseOpponent, openSetUpPage, startAndBegin } from "./support";
import { gamesMade } from "./tidy";

/**
 * A MOVE IS SHOWN BEFORE IT IS SENT.
 *
 * A live game's record is final — take-back only works in a hot-seat game — so
 * before this a misclick on a phone was a permanent move in a rated game that
 * might be days old. These games are played on trains and sofas, and every
 * elder correspondence site shows the stone and asks.
 *
 * DRIVEN THE WAY A PLAYER DRIVES IT, for the reason the language picker
 * earned: a feature reached by a route no reader takes proves nothing about
 * the route they do take. The board is clicked, the buttons under it are
 * pressed, and nothing here posts a move itself.
 *
 * The half that matters most is the NEGATIVE one, and it is asserted against a
 * rendered board rather than against a request that had not been made yet:
 * after the click, the move must not have been sent. That is checked by asking
 * the server what it holds, which cannot pass by being early.
 */
/** Every game this file makes is its own to take away again. */
const tidyAway = gamesMade();

test.describe("a move is shown before it is sent", () => {
  test("places the stone, sends nothing, and starts over on request", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `preview-${stamp}@example.test`,
      name: `Preview ${stamp}`,
    });
    const page = await context.newPage();

    await openSetUpPage(page, "gomoku");
    const computer = await aComputerOpponent(page, 0);
    await chooseOpponent(page, computer);
    await startAndBegin(page);
    await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/, { timeout: 30_000 });
    const id = page.url().split("/").pop()!;
    tidyAway(id);

    const empties = page.getByRole("button", { name: /, empty$/ });
    await empties.first().waitFor({ state: "visible" });
    const before = await empties.count();
    await empties.nth(Math.floor(before / 2)).click();

    /*
     * THE STONE IS ON THE BOARD — the engine's own answer, so a capture or a
     * win would show exactly as it will — and Submit is offered.
     */
    await expect(page.getByTestId("pending-move")).toBeVisible();
    await expect(page.getByRole("button", { name: /, empty$/ })).toHaveCount(before - 1);

    // AND NOTHING WAS SENT. Asked of the server, which cannot answer early.
    const held = await context.request.get(`/api/games/${id}`);
    expect(held.ok(), "the game could not be read back").toBe(true);
    expect(((await held.json()) as { moves?: unknown[] }).moves ?? [], "the move was sent before Submit").toHaveLength(
      0,
    );

    // Starting over puts the board back and leaves nothing behind.
    await page.getByTestId("pending-move-start-over").click();
    await expect(page.getByTestId("pending-move")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /, empty$/ })).toHaveCount(before);

    await context.close();
  });

  test("sends the move on Submit, and only then", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `submit-${stamp}@example.test`,
      name: `Submit ${stamp}`,
    });
    const page = await context.newPage();

    await openSetUpPage(page, "gomoku");
    const computer = await aComputerOpponent(page, 0);
    await chooseOpponent(page, computer);
    await startAndBegin(page);
    await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/, { timeout: 30_000 });
    const id = page.url().split("/").pop()!;
    tidyAway(id);

    const empties = page.getByRole("button", { name: /, empty$/ });
    await empties.first().waitFor({ state: "visible" });
    await empties.nth(Math.floor((await empties.count()) / 2)).click();

    // The button says where it is going, rather than moving somebody in silence.
    const submit = page.getByTestId("pending-move-submit");
    await expect(submit).toContainText(/Submit/);
    await submit.click();

    // Now the server holds it — and the computer opposite answers, which is
    // the whole turn working end to end rather than a button that clears.
    await expect
      .poll(
        async () => {
          const read = await context.request.get(`/api/games/${id}`);
          if (!read.ok()) return 0;
          return (((await read.json()) as { moves?: unknown[] }).moves ?? []).length;
        },
        { timeout: 30_000 },
      )
      .toBeGreaterThanOrEqual(1);

    await context.close();
  });

  /**
   * THE NEAR MISS, WHICH IS THE COMMON MISS. A 19×19 board on a phone gives
   * points 17.6 pixels across, and no layout makes those bigger — so the stone
   * is placed, the point is NAMED, and four arrows move it one point at a time
   * before it is sent.
   *
   * Driven by pressing, and read off the board: the arrow is pressed and the
   * point the row names must change, which is a statement about the move that
   * would be sent rather than about a button having been clicked.
   */
  test("names the point it landed on, and the arrows move it before it is sent", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `nudge-${stamp}@example.test`,
      name: `Nudge ${stamp}`,
    });
    const page = await context.newPage();

    await openSetUpPage(page, "gomoku");
    const computer = await aComputerOpponent(page, 0);
    await chooseOpponent(page, computer);
    await startAndBegin(page);
    await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/, { timeout: 30_000 });
    tidyAway(page.url().split("/").pop()!);

    const empties = page.getByRole("button", { name: /, empty$/ });
    await empties.first().waitFor({ state: "visible" });
    // The middle of the board, so every arrow has somewhere to go.
    await empties.nth(Math.floor((await empties.count()) / 2)).click();

    const where = page.getByTestId("pending-move-where");
    await expect(where).toContainText(/Placed at [A-Z]\d+/);
    const first = await where.textContent();

    await page.getByTestId("pending-move-right").click();
    await expect(where).not.toHaveText(first!);
    const moved = await where.textContent();

    // And the opposite arrow puts it back, so a nudge is not a one-way trip.
    await page.getByTestId("pending-move-left").click();
    await expect(where).toHaveText(first!);
    expect(moved).not.toBe(first);

    // Still nothing sent: this is all before Submit, which is the whole point.
    await expect(page.getByTestId("pending-move-submit")).toBeVisible();

    await context.close();
  });

  /**
   * AND SEND IS ON THE SCREEN, WITHOUT SCROLLING FOR IT.
   *
   * John: "i dont like the user scrolling to the bottom a lot to have to click
   * next or play." On a 390×844 phone a 19×19 go board ends at 724 pixels and
   * Submit used to begin at 816 — sixteen past the fold, which is near enough
   * to look like it fits and far enough that it does not.
   *
   * Measured where the button actually IS, against the window, rather than by
   * asking Playwright whether it is visible: a control below the fold is
   * "visible" to a locator, since visibility is about display and opacity.
   */
  test("keeps Submit on the screen with the board, on a phone", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(
      browser,
      baseURL!,
      { email: `sticky-${stamp}@example.test`, name: `Sticky ${stamp}` },
      // The narrowest phone that matters, and the one the fault was measured on.
      { viewport: { width: 390, height: 844 } },
    );
    const page = await context.newPage();

    // Go, because 19×19 is the longest board here and the worst case for this.
    await openSetUpPage(page, "go");
    // Against a program, so this seat is playable the moment the board opens —
    // a posted seat leaves every point disabled until somebody takes the other.
    const computer = await aComputerOpponent(page, 0);
    await chooseOpponent(page, computer);
    await startAndBegin(page);
    await page.waitForURL(/\/games\/go\/match\/[^/]+/, { timeout: 30_000 });
    tidyAway(/match\/([^/?#]+)/.exec(page.url())?.[1] ?? "");

    const empties = page.getByRole("button", { name: /, empty$/ });
    await empties.first().waitFor({ state: "visible" });
    await empties.nth(Math.floor((await empties.count()) / 2)).click();

    const room = await page.evaluate(() => {
      const submit = document.querySelector('[data-testid="pending-move-submit"]')!.getBoundingClientRect();
      const board = document.querySelector(".aspect-square")!.getBoundingClientRect();
      return { submitBottom: Math.round(submit.bottom), boardTop: Math.round(board.top), window: window.innerHeight };
    });
    // Both in the first screenful: the board begins on it, and Submit ends on it.
    expect(room.submitBottom, "Submit sits below the fold").toBeLessThanOrEqual(room.window);
    expect(room.boardTop, "the board starts below the fold").toBeLessThan(room.window);

    await context.close();
  });
});

/*
 * AGAINST THE COMPUTER, THE PLAYER MAY HAVE THE STONE GO DOWN ON THE TOUCH.
 * John, 2026-09-22: "some users might want a real time experience." Switched on
 * the board, kept on the account, and taken back the same way.
 */
test.describe("against the computer, confirming is a switch on the board", () => {
  test("switched off, a click is the move; the next game remembers; switched on, it asks again", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `straight-${stamp}@example.test`,
      name: `Straight ${stamp}`,
    });
    const page = await context.newPage();

    async function newGameAgainstTheComputer(): Promise<string> {
      await openSetUpPage(page, "gomoku");
      await chooseOpponent(page, await aComputerOpponent(page, 0));
      await startAndBegin(page);
      await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/, { timeout: 30_000 });
      const id = page.url().split("/").pop()!;
      tidyAway(id);
      await page.getByRole("button", { name: /, empty$/ }).first().waitFor({ state: "visible" });
      return id;
    }
    async function movesOnTheServer(id: string): Promise<number> {
      const held = await context.request.get(`/api/games/${id}`);
      return (((await held.json()) as { moves?: unknown[] }).moves ?? []).length;
    }

    const first = await newGameAgainstTheComputer();
    const confirm = page.getByTestId("confirm-moves");
    await expect(confirm, "a new player confirms by default").toBeChecked();

    const kept = page.waitForResponse((response) => response.url().endsWith("/api/me") && response.request().method() === "PATCH", { timeout: 10_000 });
    await confirm.uncheck();
    expect((await kept).status()).toBe(200);

    // The click is the move: no Submit offered, and the server holds it.
    const empties = page.getByRole("button", { name: /, empty$/ });
    await empties.nth(Math.floor((await empties.count()) / 2)).click();
    await expect.poll(() => movesOnTheServer(first), { message: "the click was not sent as the move" }).toBeGreaterThanOrEqual(1);
    await expect(page.getByTestId("pending-move")).toHaveCount(0);

    // The next game against the computer starts the way it was left.
    await newGameAgainstTheComputer();
    await expect(page.getByTestId("confirm-moves")).not.toBeChecked();

    // And back: switched on, a click waits for Submit again.
    await page.getByTestId("confirm-moves").check();
    const again = page.getByRole("button", { name: /, empty$/ });
    await again.nth(Math.floor((await again.count()) / 2)).click();
    await expect(page.getByTestId("pending-move")).toBeVisible();

    await context.close();
  });
});
