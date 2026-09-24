import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { type MadeRows, measuredRoutes, removeRouteRows, routeListProblems, seedRouteRows } from "./siteRoutes";
import { gamesMade, namesPlayedUnder } from "./tidy";

/**
 * EVERY PAGE HAS THE SAME SHAPE: ONE TITLE, AT ONE SIZE, ON THE PAPER.
 *
 * John, 2026-09-24, with /players, /about, /, /play and /games side by side:
 * "each page has a different page... some pages are in a box, others are
 * not. Some headers are different sizes for pages next to each other. This is
 * HIGHLY INCONSISTENT." The rule is written over `PAGE_TITLE` in
 * `src/components/ui/ui.constants.ts`; `pageShape.coverage.test.ts` holds the
 * source to it, and this holds what a browser actually drew, on every page:
 *
 * - exactly one h1, unless the page is listed below as having none;
 * - drawn at the title's size and weight, whatever put it there;
 * - standing on the paper, with no panel around it — a title inside a panel
 *   is a page inside a page, which is what "some pages are in a box" was;
 * - and every h2 on the page at one of the two sizes a section may be.
 *
 * Measured at a desk's width. The classes are the same at a phone's, and
 * `fits-a-phone.spec.ts` already walks the phone.
 */

const VIEWPORT = { width: 1440, height: 900 };

/** The panel's classes, read from where they are decided, so a renamed panel is still found. */
const PANEL_CLASS =
  /export const PANEL_CLASS =\s*"([^"]+)"/.exec(readFileSync(join(process.cwd(), "src/components/ui/ui.constants.ts"), "utf8"))?.[1] ??
  "";
const PANEL_SELECTOR = PANEL_CLASS.split(/\s+/)
  .filter((cls) => /^[a-z0-9-]+$/.test(cls))
  .map((cls) => `.${cls}`)
  .join("");

/** The title's size and weight: text-2xl semibold. */
const TITLE = { fontSize: "24px", fontWeight: "600" };
/** The two sizes an h2 may be: a section heading (text-lg) and a panel's label (text-[0.7rem]). */
const SECTION_SIZES = ["18px", "11.2px"];

/** Pages that draw no title at all, and why — the coverage test keeps the same list by file. */
const NO_TITLE: Record<string, string> = {
  "/games/[slug]/play": "a board to play on: the board is the page",
  "/games/[slug]/match/[id]": "a live game is a board too; a finished one is titled by its players",
};

/** The one page whose h1 is not a title: the home page's hero, John's exception, at its own size. */
const HERO: Record<string, string> = {
  "/": "the home page opens with its hero, which is its own thing and is not measured as a title",
};

const SHAPE_MEMBER = { email: "page-shape@example.test", name: "Shape Check" };

/** Ids this file makes before the run, filled in `beforeAll` — in place, since the route closures hold this object. */
const made: MadeRows = { filed: "", live: "", member: "" };

test.describe("page shape", () => {
  test.use({ viewport: VIEWPORT });
  const under = namesPlayedUnder();
  const track = gamesMade();

  test("every page the site serves is measured here, or says why not", () => {
    expect(PANEL_SELECTOR, "PANEL_CLASS could not be read from ui.constants.ts").not.toBe("");
    const { missing, stale } = routeListProblems();
    expect(missing, "pages with no entry in ROUTES in e2e/siteRoutes.ts: add each, with an address to measure").toEqual([]);
    expect(stale, "entries in ROUTES for pages that no longer exist: take them out").toEqual([]);
  });

  test.beforeAll(async ({ playwright, baseURL }) => {
    Object.assign(made, await seedRouteRows(playwright, baseURL, SHAPE_MEMBER, under, track));
  });

  test.afterAll(async () => {
    await removeRouteRows(SHAPE_MEMBER);
  });

  for (const { route, name, url: address } of measuredRoutes(made)) {
    test(`${name} has one title at the one size, on the paper, over sections at the one scale`, async ({ page }) => {
      const url = address();
      const answered = await page.goto(url, { waitUntil: "load" });
      expect(answered?.status(), `${url} did not load`).toBeLessThan(400);
      // The page's own content is server-rendered; a panel that loads after
      // the first paint still lands before the network is quiet.
      await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

      const drawn = await page.evaluate((panel) => {
        const titles = [...document.querySelectorAll("h1")].map((h1) => {
          const style = getComputedStyle(h1);
          return {
            text: (h1.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            boxed: h1.closest(panel) !== null,
          };
        });
        // The result card's verdict is an h2 in the result's colour and size — a
        // headline, not a section; the coverage test lists it for the same reason.
        const sections = [...document.querySelectorAll('h2:not([data-testid="result-card-headline"])')].map((h2) => ({
          text: (h2.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
          fontSize: getComputedStyle(h2).fontSize,
        }));
        return { titles, sections };
      }, PANEL_SELECTOR);

      if (route in HERO) {
        expect.soft(drawn.titles.length, `${url} (${route}) draws its hero as the one h1`).toBe(1);
      } else if (route in NO_TITLE) {
        expect.soft(drawn.titles, `${url} (${route}) is listed as having no title (${NO_TITLE[route]}) and drew one`).toEqual([]);
      } else {
        expect.soft(
          drawn.titles.length,
          `${url} (${route}) drew ${drawn.titles.length} h1s: ${JSON.stringify(drawn.titles.map((title) => title.text))}. ` +
            "Every page has exactly one, from <PageTitle>.",
        ).toBe(1);
        for (const title of drawn.titles) {
          expect.soft(
            { fontSize: title.fontSize, fontWeight: title.fontWeight },
            `${url} (${route}): the title "${title.text}" is ${title.fontSize}/${title.fontWeight}; every page's is ` +
              `${TITLE.fontSize}/${TITLE.fontWeight} (PAGE_TITLE in src/components/ui/ui.constants.ts).`,
          ).toEqual(TITLE);
          expect.soft(
            title.boxed,
            `${url} (${route}): the title "${title.text}" sits inside a panel. A title stands on the paper above ` +
              "the panels; move the <PageTitle> out of the PANEL_CLASS element.",
          ).toBe(false);
        }
      }

      const odd = drawn.sections.filter((section) => !SECTION_SIZES.includes(section.fontSize));
      expect.soft(
        odd,
        `${url} (${route}): an h2 at a size of its own. A section heading is ${SECTION_SIZES[0]} (SECTION_HEADING) ` +
          `and a panel's label is ${SECTION_SIZES[1]} (SECTION_TITLE); nothing else.`,
      ).toEqual([]);
    });
  }
});
