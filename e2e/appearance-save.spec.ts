import { expect, test, type Browser, type Page } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { openSetup } from "./support";

/**
 * A BOARD THEME CHOSEN AND LEFT AT ONCE IS STILL THE MEMBER'S BOARD.
 *
 * The board's look is kept on the account, and the write waited half a second
 * after a choice — so that clicking through themes is one save, not several
 * racing. The wait's timer belonged to the page: a member who chose a theme and
 * reloaded, or followed a link off the board, inside that half-second took the
 * timer with them, and the choice was never saved. The next page drew the board
 * the account still held.
 *
 * Each case leaves the page the moment the tile is pressed, which is the whole
 * point, and signs in as a member of its own, so the account under test is
 * nobody else's. Driven by clicking, on the practice board, whose panel arrives
 * with its handlers (`openSetup` waits for it).
 */

const MEMBER = (label: string) => {
  const stamp = `${Date.now().toString(36)}${label}`;
  return { email: `appearance-${stamp}@example.test`, name: `Appearance ${stamp}` };
};

/** The theme this board is on now, and one it is not. */
async function themes(page: Page) {
  await openSetup(page);
  const tiles = page.locator('[data-testid^="board-theme-"]');
  await expect(tiles.first()).toBeVisible();
  const current = await page.locator('[data-testid^="board-theme-"][aria-pressed="true"]').getAttribute("data-testid");
  const other = await page.locator('[data-testid^="board-theme-"][aria-pressed="false"]').first().getAttribute("data-testid");
  expect(current, "no theme is pressed to begin with").not.toBeNull();
  expect(other, "there is no other theme to choose").not.toBeNull();
  return { current: current!, other: other! };
}

async function pressed(page: Page, testId: string) {
  await openSetup(page);
  await expect(page.getByTestId(testId)).toHaveAttribute("aria-pressed", "true");
}

/** The account's board, read as another device reads it: a fresh browser holding nothing but the sign-in. */
async function onAnotherDevice(browser: Browser, baseURL: string, member: { email: string; name: string }, testId: string) {
  const elsewhere = await memberContext(browser, baseURL, member);
  const page = await elsewhere.newPage();
  await page.goto("/games/gomoku/play");
  await pressed(page, testId);
  await elsewhere.close();
}

test.describe("a board theme chosen and left at once", () => {
  test("is still chosen after a reload straight away, and the way back is too", async ({ browser, baseURL }) => {
    const member = MEMBER("r");
    const context = await memberContext(browser, baseURL!, member);
    try {
      const page = await context.newPage();
      await page.goto("/games/gomoku/play");
      const { current, other } = await themes(page);

      await page.getByTestId(other).click();
      await page.reload();
      await pressed(page, other);
      await onAnotherDevice(browser, baseURL!, member, other);

      // And back to the theme it started on, left just as fast.
      await page.getByTestId(current).click();
      await page.reload();
      await pressed(page, current);
      await onAnotherDevice(browser, baseURL!, member, current);
    } finally {
      await context.close();
      await removeMember(member.email);
    }
  });

  test("is still chosen after following a link off the board straight away", async ({ browser, baseURL }) => {
    const member = MEMBER("l");
    const context = await memberContext(browser, baseURL!, member);
    try {
      const page = await context.newPage();
      await page.goto("/games/gomoku/play");
      const { other } = await themes(page);

      await page.getByTestId(other).click();
      await page.getByRole("navigation").locator('a[href="/games"]').first().click();
      await expect(page).toHaveURL(/\/games$/);
      await onAnotherDevice(browser, baseURL!, member, other);
    } finally {
      await context.close();
      await removeMember(member.email);
    }
  });
});
