import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { readPageWidth } from "./pageWidth";
import { type MadeRows, measuredRoutes, removeRouteRows, routeListProblems, seedRouteRows } from "./siteRoutes";
import { gamesMade, namesPlayedUnder } from "./tidy";

/**
 * EVERY PAGE IS ONE WIDTH, AND ITS TEXT RUNS THAT WIDTH.
 *
 * John, 2026-09-24: "We can't have pages be one width on one page, and then
 * change width in other pages. It needs to be consistent." He had watched the
 * header jump sideways between the games list and the players list for
 * months, and text stop at half the page on the games list and the XP page,
 * and nothing caught either. This visits every route the site has at a desk's
 * width and measures what was drawn: the left and right edge of everything
 * under the masthead, and any wrapped paragraph held short of its box by a
 * `max-width` (see `pageWidth.ts` for exactly what is measured).
 *
 * A FAILURE NAMES THE PAGE, THE WIDTHS AND THE ELEMENT, so it can be fixed
 * from the report. The frame is `PAGE_WIDTH` in `src/components/layout/Page.tsx`
 * and nothing else; a paragraph narrower on purpose carries
 * `data-width-reason="…"` in the source, which this reads and leaves alone.
 *
 * EVERY ROUTE IS LISTED in `siteRoutes.ts`, shared with `page-shape.spec.ts`,
 * and the first test fails when one is not: a page added without an entry
 * there is a page nobody measured, which is how the width drifted in the
 * first place. A route that is not a page of the site's frame at all is
 * listed too, with the reason it is skipped.
 */

const VIEWPORT = { width: 1440, height: 900 };

/**
 * The frame, read from where it is decided. Read as text rather than imported:
 * `Page.tsx` is a React component, and its one constant is the only part of it
 * this file wants.
 */
const PAGE_WIDTH = /export const PAGE_WIDTH = "([^"]+)"/.exec(
  readFileSync(join(process.cwd(), "src/components/layout/Page.tsx"), "utf8"),
)?.[1] ?? "";

/** Tailwind's container sizes, which is all `PAGE_WIDTH` may be. */
const MAX_W_PX: Record<string, number> = {
  "max-w-3xl": 768,
  "max-w-4xl": 896,
  "max-w-5xl": 1024,
  "max-w-6xl": 1152,
  "max-w-7xl": 1280,
};
const FRAME_PX = MAX_W_PX[PAGE_WIDTH] ?? Number.NaN;

/** Ids this file makes before the run, filled in `beforeAll` — in place, since the route closures hold this object. */
const made: MadeRows = { filed: "", live: "", member: "" };

const WIDTH_MEMBER = { email: "page-width@example.test", name: "Width Check" };

test.describe("page width", () => {
  test.use({ viewport: VIEWPORT });
  const under = namesPlayedUnder();
  const track = gamesMade();

  test("every page the site serves is measured here, or says why not", () => {
    expect(FRAME_PX, `PAGE_WIDTH is "${PAGE_WIDTH}", which is not a size this spec knows`).not.toBeNaN();
    const { missing, stale } = routeListProblems();
    expect(missing, "pages with no entry in ROUTES in e2e/siteRoutes.ts: add each, with an address to measure").toEqual([]);
    expect(stale, "entries in ROUTES for pages that no longer exist: take them out").toEqual([]);
  });

  test.beforeAll(async ({ playwright, baseURL }) => {
    Object.assign(made, await seedRouteRows(playwright, baseURL, WIDTH_MEMBER, under, track));
  });

  test.afterAll(async () => {
    await removeRouteRows(WIDTH_MEMBER);
  });

  for (const { route, name, url: address } of measuredRoutes(made)) {
    test(`${name} is the site's width, and so is its text`, async ({ page }) => {
      const url = address();
      const answered = await page.goto(url, { waitUntil: "load" });
      expect(answered?.status(), `${url} did not load`).toBeLessThan(400);
      // What loads after the first paint — a table, a list — changes the edges.
      await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

      const { left, right, atLeft, atRight, capped } = await readPageWidth(page);
      const expectedLeft = Math.round((VIEWPORT.width - FRAME_PX) / 2);
      const expectedRight = expectedLeft + FRAME_PX;
      expect.soft(
        { left, right },
        `${url} (${route}): the page runs ${left}–${right}px, ${right - left}px wide; every page is ` +
          `${expectedLeft}–${expectedRight}px, ${FRAME_PX}px (PAGE_WIDTH = "${PAGE_WIDTH}" in ` +
          "src/components/layout/Page.tsx). Something on this page is wider or narrower than the frame: " +
          `a max-w-… of its own, or content that does not fill it. At the left edge: ${atLeft}. ` +
          `At the right edge: ${atRight}.`,
      ).toEqual({ left: expectedLeft, right: expectedRight });

      const report = capped.map(
        (cap) =>
          `${cap.element} is ${cap.width}px of the ${cap.available}px it sits in (max-width ${cap.maxWidth}, ` +
          `class "${cap.classes}"), so "${cap.sample}…" stops part way`,
      );
      expect.soft(
        report,
        `${url} (${route}): text held short of the page by a max-width. Take the max-w-… off so it runs the ` +
          'frame, or put data-width-reason="…" on that element saying why it is narrower.',
      ).toEqual([]);
    });
  }
});
