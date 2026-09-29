import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * ON A PHONE THE ACCOUNT SITS AT THE TOP RIGHT, AND NEW GAME IS NEVER ALONE.
 *
 * John, 2026-09-28, with a phone screenshot four rows deep — the logo, the
 * tabs, New game with the account menu beside it, then the member line: "In
 * mobile, the User Name dropdown should flow to the top right of the page,
 * rather than below the first row. The New Game button is still alone but fix
 * the dropdown first."
 *
 * So at three phone widths, signed in and signed out, on an ordinary page and
 * under the front page's hero: the account (or the way in) is on the logo's
 * row at its right edge, the menu opens and shuts by TAPPING, as a phone
 * does, New game shares its row with the tabs, and nothing scrolls sideways.
 * And at a desk's width the header is the one row it always was.
 */

const PHONES = [320, 390, 430] as const;
const PAGES = [
  { path: "/games", name: "an ordinary page" },
  { path: "/", name: "the front page" },
] as const;

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error("nothing to measure");
  return box;
}

/** Whether two boxes share any of their height: the test for "on the same row". */
function sameRow(a: Box, b: Box): boolean {
  return a.y < b.y + b.height && b.y < a.y + a.height;
}

async function scrollsSideways(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
}

/** A phone: touch, so the menu is tapped rather than clicked. Signed out means no cookies at all. */
async function phone(browser: Browser, width: number, signedIn: boolean) {
  return browser.newContext({
    viewport: { width, height: 800 },
    hasTouch: true,
    ...(signedIn ? {} : { storageState: { cookies: [], origins: [] } }),
  });
}

/** The account's box, once the browser has taken it over: the menu for a member, the way in for a stranger. */
async function accountOf(page: Page, signedIn: boolean): Promise<Locator> {
  const header = page.locator("header[data-chrome]");
  if (signedIn) {
    await ready(page, "account-menu");
    return header.getByTestId("account-menu-button");
  }
  const way = header.getByTestId("sign-in");
  await expect(way).toBeVisible();
  return way;
}

test.describe("the phone header", () => {
  for (const width of PHONES) {
    for (const { path, name } of PAGES) {
      for (const signedIn of [true, false]) {
        test(`at ${width}, ${signedIn ? "signed in" : "signed out"}, on ${name}: the account is top right and New game is not alone`, async ({ browser }) => {
          const context = await phone(browser, width, signedIn);
          try {
            const page = await context.newPage();
            await page.goto(path);
            const account = await accountOf(page, signedIn);
            const header = page.locator("header[data-chrome]");
            const logo = await boxOf(header.getByRole("link", { name: "Itsutsu home" }));
            const bar = await boxOf(header.locator("nav"));
            const at = await boxOf(account);
            const edge = (await boxOf(header)).x + (await boxOf(header)).width;

            // On the logo's row, above the tabs, at its right edge.
            expect(sameRow(at, logo), `the account is not on the logo's row: ${JSON.stringify({ at, logo })}`).toBe(true);
            expect(at.y + at.height, "the account is not above the tabs").toBeLessThanOrEqual(bar.y + 1);
            expect(Math.abs(at.x + at.width - edge), "the account is not at the right edge").toBeLessThanOrEqual(2);
            // And clear of the logo: the corner is the account's, not drawn over the wordmark.
            expect(at.x, "the account overlaps the logo").toBeGreaterThanOrEqual(logo.x + logo.width - 1);

            // New game shares its row with the tabs.
            const newGame = await boxOf(header.getByTestId("nav-new-game"));
            const tabs = header.locator("nav").locator('a:not([data-testid="nav-new-game"])');
            await expect(tabs.first()).toBeVisible();
            const beside = [];
            for (const tab of await tabs.all()) if (sameRow(await boxOf(tab), newGame)) beside.push(await tab.getAttribute("href"));
            expect(beside.length, "New game stands on a row of its own").toBeGreaterThan(0);

            // At 390 and up the tabs and New game are a single line.
            if (width >= 390) {
              const tops = new Set<number>();
              for (const tab of await tabs.all()) tops.add(Math.round((await boxOf(tab)).y));
              expect(tops.size, `the tabs wrapped at ${width}`).toBe(1);
            }

            expect(await scrollsSideways(page), "the page scrolls sideways").toBe(false);

            if (signedIn) {
              // Opened by a tap, on the screen, and shut by another; then shut by a tap elsewhere.
              await account.tap();
              const panel = page.getByTestId("account-menu-panel");
              await expect(panel).toBeVisible();
              await expect(account).toHaveAttribute("aria-expanded", "true");
              const opened = await boxOf(panel);
              expect(opened.x, "the menu opens off the left of the screen").toBeGreaterThanOrEqual(0);
              expect(opened.x + opened.width, "the menu opens off the right of the screen").toBeLessThanOrEqual(width);
              await expect(panel.getByTestId("sign-out")).toBeVisible();
              await account.tap();
              await expect(panel).toHaveCount(0);
              await expect(account).toHaveAttribute("aria-expanded", "false");

              await account.tap();
              await expect(panel).toBeVisible();
              await page.locator("main").tap({ position: { x: 5, y: 5 } });
              await expect(panel).toHaveCount(0);
            } else {
              // The way in still leads in.
              await account.tap();
              await expect(page).toHaveURL(/\/join(\?|$)/);
            }
          } finally {
            await context.close();
          }
        });
      }
    }
  }
});

test.describe("the desk's header", () => {
  for (const signedIn of [true, false]) {
    test(`at 1280, ${signedIn ? "signed in" : "signed out"}, is still one row with the account last`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        ...(signedIn ? {} : { storageState: { cookies: [], origins: [] } }),
      });
      try {
        const page = await context.newPage();
        await page.goto("/games");
        const account = await accountOf(page, signedIn);
        const header = page.locator("header[data-chrome]");
        const logo = await boxOf(header.getByRole("link", { name: "Itsutsu home" }));
        const newGame = await boxOf(header.getByTestId("nav-new-game"));
        const play = await boxOf(header.locator('nav a[href="/play"]'));
        const at = await boxOf(account);
        const whole = await boxOf(header);

        // One row: logo, tabs, New game and the account all share it.
        for (const [what, box] of [["the tabs", play], ["New game", newGame], ["the account", at]] as const) {
          expect(sameRow(box, logo), `${what} left the logo's row`).toBe(true);
        }
        // In the order they always were, the account last and at the right edge.
        expect(play.x).toBeGreaterThan(logo.x + logo.width);
        expect(newGame.x).toBeGreaterThan(play.x);
        expect(at.x).toBeGreaterThan(newGame.x + newGame.width);
        expect(Math.abs(at.x + at.width - (whole.x + whole.width))).toBeLessThanOrEqual(2);
        // The name is on the button at a desk, as it was.
        if (signedIn) await expect(account.locator("span.truncate")).toBeVisible();
        expect(await scrollsSideways(page)).toBe(false);
      } finally {
        await context.close();
      }
    });
  }
});
