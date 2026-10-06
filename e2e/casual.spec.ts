import { expect, test, type Page } from "@playwright/test";
import { choiceStory, tubeSort } from "@johnmorrisdotca/karakuri";
import { TUBE_SORT_LEVELS } from "@johnmorrisdotca/karakuri/levels";

import { CASUAL_KIND_LIST, CASUAL_SPECS } from "../src/lib/casual/casual.constants";
import { CASUAL_STORAGE_KEY } from "../src/lib/casual/casualProgress";
import { casualPlayPath, gamePath, setUpPath } from "../src/lib/gomoku/slugs";
import { ready } from "./support";

/**
 * KARAKURI'S EIGHT, PLAYED THE WAY A READER PLAYS THEM: from the game's own page
 * to its set-up, a level started, restarted, given up, won and lost, with the
 * progress it leaves in My games — on a phone's width with a finger and on a
 * desk's with the mouse.
 *
 * Every board is the package's canvas, so the way to its pieces is the
 * package's own: it leaves the mounted game on its element (`element.karakuri`),
 * and the test reads where a tube or a card is from it and presses there. The moves are the
 * ones the package's own search found for each level, so a level won here is
 * won by the real thing and not by a call into it.
 *
 * It signs in as the suite's operator and keeps nothing on the server: what a
 * casual game remembers is in the page's storage, which each case starts empty.
 */
const VIEWPORTS = [
  { name: "a phone", width: 390, height: 844, touch: true },
  { name: "a desk", width: 1280, height: 800, touch: false },
] as const;

type Viewport = (typeof VIEWPORTS)[number];

/** What the page complains of, collected from before it loads. */
function listen(page: Page): string[] {
  const complaints: string[] = [];
  page.on("pageerror", (error) => complaints.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") complaints.push(message.text());
  });
  return complaints;
}

/** Starts the pages of this test with nothing kept (once, so that what a level leaves survives the next page). */
async function arrive(page: Page) {
  await page.addInitScript((key) => {
    if (!sessionStorage.getItem("casual-test-started")) {
      sessionStorage.setItem("casual-test-started", "1");
      localStorage.removeItem(key);
    }
  }, CASUAL_STORAGE_KEY);
}

/** The mounted game's own account of itself, read in the page. */
function read<T>(page: Page, fn: string): Promise<T> {
  return page.evaluate(`(${fn})(document.querySelector('[data-testid="casual-board"]').karakuri)`) as Promise<T>;
}

/** A press at a client point: a finger where the screen has one, the mouse where it has not. */
async function press(page: Page, viewport: Viewport, point: { x: number; y: number }) {
  if (viewport.touch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

/** Opens a level's play page and waits for its board to be drawn. */
async function openLevel(page: Page, kind: (typeof CASUAL_KIND_LIST)[number], level: number) {
  await page.goto(casualPlayPath(kind, level));
  await ready(page, "casual-game");
  await expect(page.locator('[data-testid="casual-board"][data-ready="true"] canvas')).toBeVisible();
  // The whole board on the screen, so a finger put down on it lands there.
  await page.locator('[data-testid="casual-board"] canvas').scrollIntoViewIfNeeded();
}

/** The client point of a place in the game's own units. */
const client = (page: Page, x: number, y: number) => read<{ x: number; y: number }>(page, `(m) => m.toClient(${x}, ${y})`);

for (const viewport of VIEWPORTS) {
  test.describe(`on ${viewport.name}, ${viewport.width} px wide`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: viewport.touch, isMobile: viewport.touch });

    for (const kind of CASUAL_KIND_LIST) {
      const spec = CASUAL_SPECS[kind];

      test(`${kind}: from its page to a level, restarted, and given up`, async ({ page }) => {
        const complaints = listen(page);
        await arrive(page);
        await page.goto(gamePath(kind));
        // The game's own page offers Play, which leads to its levels.
        await expect(page.getByTestId("game-front-door")).toBeVisible();
        await page.getByTestId("casual-offer").click();
        await ready(page, "casual-set-up");
        await expect(page).toHaveURL(new RegExp(`${setUpPath(kind)}$`));
        await expect(page.getByTestId("casual-level")).toHaveCount(spec.levels);

        // Nothing on the screen moves when a level is chosen: not the preview, not the tiles, not the button below them.
        const reading = () =>
          page.evaluate(() => {
            const box = (selector: string) => {
              const at = document.querySelector(selector)!.getBoundingClientRect();
              return `${Math.round(at.top + scrollY)}:${Math.round(at.height)}`;
            };
            return [box('[data-testid="casual-preview"]'), box('[data-testid="casual-start"]'), box('[data-testid="casual-kept"]')].join(" ");
          });
        const first = await reading();
        for (let level = spec.levels; level >= 1; level -= 1) {
          await page.locator(`[data-testid="casual-level"][data-level="${level}"]`).click();
          await expect(page.getByTestId("casual-start")).toContainText(String(level));
          expect(await reading(), `choosing level ${level} moved the set-up screen`).toBe(first);
        }

        await page.getByTestId("casual-start").click();
        await ready(page, "casual-game");
        await expect(page).toHaveURL(new RegExp(`level=${1}$`));
        await expect(page.locator('[data-testid="casual-board"][data-ready="true"] canvas')).toBeVisible();
        // The board is all on the screen sideways, and the page does not scroll sideways round it.
        const across = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(across, "the page scrolls sideways").toBeLessThanOrEqual(0);
        const box = (await page.locator('[data-testid="casual-board"] canvas').boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.width).toBeGreaterThan(viewport.touch ? 250 : 300);
        await expect(page.getByTestId("casual-line")).toContainText(`1 of ${spec.levels}`);

        // Restart begins the level again; Give up asks, and ends it unsolved with a way back to the levels.
        await page.getByTestId("casual-restart").click();
        await expect(page.getByTestId("casual-game")).toHaveAttribute("data-state", "playing");
        await page.getByTestId("casual-give-up").click();
        await page.getByRole("button", { name: "Give up", exact: true }).last().click();
        await expect(page.getByTestId("casual-result")).toHaveAttribute("data-result", "gaveUp");
        await expect(page.getByTestId("casual-result-title")).toHaveText("You gave up");
        await page.getByTestId("casual-again").click();
        await expect(page.getByTestId("casual-game")).toHaveAttribute("data-state", "playing");
        await page.getByTestId("casual-new").click();
        await ready(page, "casual-set-up");
        expect(complaints, "the page complained").toEqual([]);
      });
    }

    test("tube-sort: a level is lost in a dead end, then won by the way the search found, and kept", async ({ page }) => {
      const complaints = listen(page);
      await arrive(page);
      const tubes = TUBE_SORT_LEVELS[0].tubes;
      const pourBy = async (from: number, to: number, count: number) => {
        for (const tube of [from, to]) {
          const snap = await read<{ centres: { x: number; y: number }[] }>(page, "(m) => m.controller.snapshot()");
          const at = await client(page, snap.centres[tube].x, snap.centres[tube].y);
          await press(page, viewport, at);
        }
        await expect.poll(() => read<{ pours: number }>(page, "(m) => m.controller.snapshot()").then((snap) => snap.pours)).toBe(count);
      };

      await openLevel(page, "tubeSort", 1);
      const dead = tubeSort.findDeadEnd(tubes)!;
      let count = 0;
      for (const [from, to] of dead) await pourBy(from, to, (count += 1));
      await expect(page.getByTestId("casual-result")).toHaveAttribute("data-result", "lost");
      await expect(page.getByTestId("casual-result-title")).toHaveText("Not this time");
      // A lost level is not a won one: nothing is kept as won, and Try again begins it over.
      await page.getByTestId("casual-again").click();
      await expect(page.getByTestId("casual-game")).toHaveAttribute("data-state", "playing");

      count = 0;
      for (const [from, to] of tubeSort.solveTubes(tubes).solution!.pours) await pourBy(from, to, (count += 1));
      await expect(page.getByTestId("casual-result")).toHaveAttribute("data-result", "won");
      await expect(page.getByTestId("casual-result-title")).toHaveText("Level 1 won");
      expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), CASUAL_STORAGE_KEY)).toEqual({ tubeSort: { won: [1], going: null } });

      // Next level leads to the next one, and the set-up and My games both say what is won.
      await page.getByTestId("casual-next").click();
      await ready(page, "casual-game");
      await expect(page).toHaveURL(/level=2$/);
      await page.goto(setUpPath("tubeSort"));
      await ready(page, "casual-set-up");
      await expect(page.locator('[data-testid="casual-level"][data-level="1"]')).toHaveAttribute("data-state", "won");
      await expect(page.locator('[data-testid="casual-level"][data-level="2"]')).toHaveAttribute("data-state", "going");
      await expect(page.getByTestId("casual-kept")).toContainText(`1 of ${CASUAL_SPECS.tubeSort.levels} levels won`);
      await page.goto("/play/pass-and-play");
      await expect(page.locator('[data-testid="casual-card"][data-kind="tubeSort"]')).toContainText("1 of 5 levels won");
      await page.locator('[data-testid="casual-card"][data-kind="tubeSort"] [data-testid="casual-card-continue"]').click();
      await ready(page, "casual-game");
      await expect(page).toHaveURL(/tube-sort\/play\?level=2$/);
      expect(complaints, "the page complained").toEqual([]);
    });

    test("choice-story: a story is played through with the right tool at each stage", async ({ page }) => {
      const complaints = listen(page);
      await arrive(page);
      await openLevel(page, "choiceStory", 1);
      for (let stage = 0; stage < 3; stage += 1) {
        await expect.poll(() => read<{ phase: string }>(page, "(m) => m.controller.snapshot()").then((snap) => snap.phase), { timeout: 10_000 }).toBe("ask");
        const snap = await read<{ cards: { x: number; y: number }[] }>(page, "(m) => m.controller.snapshot()");
        const card = snap.cards[choiceStory.STORIES[0].stages[stage].right];
        await press(page, viewport, await client(page, card.x, card.y));
        await expect.poll(() => read<{ phase: string }>(page, "(m) => m.controller.snapshot()").then((snap) => snap.phase), { timeout: 10_000 }).not.toBe("ask");
      }
      await expect(page.getByTestId("casual-result")).toHaveAttribute("data-result", "won", { timeout: 15_000 });
      await expect(page.getByTestId("casual-result-title")).toHaveText("Story 1 won");
      await expect(page.getByTestId("casual-next")).toHaveText("Next story →");
      expect(complaints, "the page complained").toEqual([]);
    });
  });
}
