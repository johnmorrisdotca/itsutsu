import { expect, test, type Browser, type Page } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { matchIdIn, ready, startAndBegin } from "./support";
import { gamesMade } from "./tidy";

/**
 * THE BOARD USES A DESK, AND REMEMBERS HOW BIG IT WAS ASKED TO BE.
 *
 * John, 2026-09-22: "If someones on a computer with big screen, we should allow
 * them to use that space and have a larger board… and have memory /preferences
 * that detect this and preserve on other devices? Of course, they might have
 * Mobile and esktop and should show approprialy on both."
 *
 * Driven the way a reader does it: the size is chosen by pressing it, and
 * "remembered" is tested by opening the game again in a page that was never
 * pressed on — the other desk — rather than by reading the account. Then the
 * way back, because a size you cannot un-choose is a trap.
 *
 * A member of its own, so the size it chooses is nobody else's and every other
 * spec's board stays the size it expects.
 */

const tidyAway = gamesMade();
const DESK = { width: 1440, height: 900 };

/**
 * The request that keeps a choice on the account. Ten seconds, not the test's
 * whole budget: a choice that was never sent should fail here, promptly and by
 * name, rather than as a two-minute timeout that reads like a slow machine.
 */
function keeping(page: Page) {
  return page.waitForResponse(
    (response) => response.url().endsWith("/api/me") && response.request().method() === "PATCH",
    { timeout: 10_000 },
  );
}

async function freshMember(browser: Browser, baseURL: string) {
  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const member = { email: `board-scale-${stamp}@example.test`, name: `Board ${stamp}` };
  const context = await memberContext(browser, baseURL, member, { viewport: DESK });
  return { context, page: await context.newPage(), email: member.email };
}

test.describe("the board's size on a desk", () => {
  test("a size pressed is the size, is the size on the next page, and can be taken back", async ({ browser, baseURL }) => {
    const { context, page, email } = await freshMember(browser, baseURL!);
    try {
      await page.goto("/games/new?game=go&board=19");
      await ready(page, "set-up-game");
      await startAndBegin(page);
      await page.waitForURL(/\/games\/go\/match\//, { timeout: 30_000 });
      const boardAt = page.url();
      tidyAway(matchIdIn(boardAt));

      const column = page.getByTestId("board-column");
      await ready(page, "board-column");
      // Arrives at Fit: nobody has chosen, and "nobody has chosen" is its own answer.
      await expect(column).toHaveAttribute("data-board-size", "fit");
      const fitted = (await column.boundingBox())!.width;

      const kept = keeping(page);
      await page.locator('[data-testid="board-scale-option"][data-size="large"]').click();
      await expect(column).toHaveAttribute("data-board-size", "large");
      expect((await kept).status(), "the choice was not kept on the account").toBe(200);
      const large = (await column.boundingBox())!.width;
      expect(large, "Large drew no bigger a board than Fit on a 1440px desk").toBeGreaterThan(fitted + 100);

      // The other desk: a page that has never been pressed on opens at Large.
      const elsewhere = await context.newPage();
      await elsewhere.goto(boardAt);
      await ready(elsewhere, "board-column");
      await expect(elsewhere.getByTestId("board-column")).toHaveAttribute("data-board-size", "large");
      await elsewhere.close();

      // And back.
      const back = keeping(page);
      await page.locator('[data-testid="board-scale-option"][data-size="fit"]').click();
      await expect(column).toHaveAttribute("data-board-size", "fit");
      expect((await back).status()).toBe(200);
      expect(Math.abs((await column.boundingBox())!.width - fitted)).toBeLessThan(2);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a phone keeps a board that fits it, and is offered no size to choose", async ({ browser, baseURL }) => {
    const { context, page, email } = await freshMember(browser, baseURL!);
    try {
      await page.goto("/games/new?game=go&board=19");
      await ready(page, "set-up-game");
      await startAndBegin(page);
      await page.waitForURL(/\/games\/go\/match\//, { timeout: 30_000 });
      tidyAway(matchIdIn(page.url()));

      await page.setViewportSize({ width: 390, height: 844 });
      // The column is there and answering before anything is said about what is not.
      await ready(page, "board-column");
      await expect(page.getByTestId("board-scale"), "a phone was offered sizes that change nothing on it").toBeHidden();
      const width = (await page.getByTestId("board-column").boundingBox())!.width;
      expect(width, "the board is wider than the phone").toBeLessThanOrEqual(390);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});
