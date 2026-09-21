import { expect, test, type Page } from "@playwright/test";

import { openSetup, ready } from "./support";

/**
 * EVERY BOARD FITS A PHONE, SIDEWAYS.
 *
 * John, 2026-09-21: "Make sure these boards fit on a mobile device."
 *
 * The one that did not was the honeycomb. A hexagon board is a square array
 * sheared into a lattice, and `HEXAGON_TRANSFORM` fits the HEXAGON rather than
 * the array holding it — so the array's unused corners hang about a fifth of a
 * board width past each edge. A transform moves no layout, but it does move
 * the scroll area: on a 390px phone the document came out 455px wide, so the
 * page scrolled sideways and the browser shrank everything to fit. `Board.tsx`
 * clips the playing area, and this is what says so.
 *
 * WHY IT IS MEASURED IN A BROWSER AND NOT IN A UNIT TEST. Nothing about this
 * is visible in the transform: `hexagonFit.test.ts` measures the SHAPE, which
 * was right the whole time, and every stone sat where it should. The only
 * thing that was wrong was the size of the box it was painted in, which is a
 * fact about layout that only a layout engine holds.
 *
 * ONE SIZE PROVES THE OTHERS. The hexagon spans the same two numbers of its
 * array at every radius — see `HEXAGON_SPAN` — so the overhang is the same
 * fraction on the 7 as on the 13. The 13 is here because it is the widest
 * array, and one other size is here to hold that claim honest.
 */

/* A small phone, the narrowest case that matters: 390×844 is an iPhone 13 mini. */
test.use({ viewport: { width: 390, height: 844 } });

/**
 * How far the page can be scrolled sideways: nought when everything fits, and
 * the overhang when it does not.
 *
 * NOT `scrollWidth`. A real phone SHRINKS a page that does not fit, and the
 * measurement is taken after it has — so `scrollWidth` reads back equal to the
 * window on exactly the pages that failed, and a gate built on it passes
 * everywhere. Asking the window to scroll and reading how far it went cannot
 * be fooled that way: a page with nothing off its side does not move.
 */
async function scrolledSideways(page: Page): Promise<number> {
  return page.evaluate(() => {
    window.scrollTo(9_999, 0);
    const far = window.scrollX;
    window.scrollTo(0, 0);
    return far;
  });
}

/**
 * Every board drawn on a lattice, plus the widest square board there is.
 * A square grid cannot overhang its box, so Go is the control: if IT ever
 * fails here the cause is the page around the board, not the board.
 */
const BOARDS = ["honeycomb", "hex", "chinese-checkers", "go", "canadian-checkers"] as const;

for (const slug of BOARDS) {
  test(`the ${slug} board does not push the page sideways on a phone`, async ({ page }) => {
    await page.goto(`/games/${slug}/play`);
    await ready(page, "game-view");
    expect(await scrolledSideways(page), `the ${slug} board pushes the page sideways`).toBe(0);
  });
}

test("the largest honeycomb fits too", async ({ page }) => {
  await page.goto("/games/honeycomb/play");
  await ready(page, "game-view");
  // The board's own set-up folds away on this page, the way a player opens it.
  await openSetup(page);
  await page.getByTestId("board-size").selectOption("13");
  /*
   * The choice and the redraw land in one commit, so the select carrying the
   * new value IS the board having been redrawn. Measuring without this wait
   * would measure the board that was already there — and pass, whatever the
   * larger one does.
   */
  await expect(page.getByTestId("board-size")).toHaveValue("13");
  expect(await scrolledSideways(page), "the largest honeycomb pushes the page sideways").toBe(0);
});

/**
 * AND NEITHER DOES ANY PAGE.
 *
 * The board was one of two ways this site pushed a phone sideways; the other
 * was a table. A record has six or seven columns that cannot be narrowed below
 * their words, and where a table is not in a scroll box the DOCUMENT takes
 * that width: /champions measured 570 pixels on a 390-pixel phone, and the
 * browser answered by drawing every page — heading, prose, panels — small
 * enough to fit. /games leaked nineteen pixels the same way, from one
 * `sr-only` label that escaped its scroll box, which is the same fault at a
 * size nobody would ever report.
 *
 * `TABLE_SCROLL` and `tableScroll.coverage.test.ts` are the fix and its gate.
 * This is the measurement: the gate reads the source and can only hold what it
 * knows to look for, and a phone answers what actually happened.
 *
 * WHY IT TESTS THE SCROLL AND NOT THE WIDTH. `scrollWidth` is asked of a page
 * that has already been shrunk to fit on a real phone, so it reads back as
 * "fits" on exactly the pages that do not. Scrolling the window and reading
 * how far it went cannot be fooled that way: a page that cannot scroll
 * sideways has nothing off the side of it.
 */
const PAGES = [
  "/",
  "/games",
  "/games/new",
  "/play",
  "/players",
  "/champions",
  "/xp",
  "/history",
  "/learn",
  "/releases",
  "/me",
  "/about",
] as const;

for (const path of PAGES) {
  test(`${path} does not scroll sideways on a phone`, async ({ page }) => {
    await page.goto(path);
    const off = await scrolledSideways(page);
    expect(off, `${path} scrolls ${off}px sideways on a 390px phone`).toBe(0);
  });
}
