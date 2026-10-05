import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { MEIKYUU_TALL_LEVELS, MEIKYUU_TALL_SIZES as PACKAGE_TALL_SIZES } from "@johnmorrisdotca/meikyuu/levels/tall";

import { mySolvePath, PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { MEIKYUU_LEVELS_A_SIZE } from "../src/lib/puzzles/meikyuu/levelCounts";
import { encodeCells } from "../src/lib/puzzles/meikyuu/steps";
import { WAY_UP_STORAGE } from "../src/lib/puzzles/meikyuu/turn";
import { drawThrough, placedMaze, wayThrough } from "./meikyuu";
import { memberContext, newestSolveOf, removeMember } from "./members";
import { ready } from "./support";

/**
 * MEIKYUU'S TALL LEVELS 縦: 1,536 portrait mazes in six sizes of 256, two columns to three rows, made for a phone held
 * upright and lying on their side on a wide screen.
 *
 * Every line is drawn as a player draws one (`e2e/meikyuu.ts`): the mouse on a desk, a real touch on a phone, and a
 * maze lying down is drawn through where the package shows it, which is the same line (the way is the same steps).
 * Each case is a member of its own, made for it and taken away after, so what it counts is its own.
 */
const AT = `/games/${PUZZLE_SLUGS.meikyuu}`;

/** A tall level's address, as the set-up's Start writes it: `10x15` is a size. */
const levelUrl = (width: number, height: number, level: number, band = "easy") => `${AT}/play?size=${width}x${height}&level=${band}&seed=${level}`;

/** The package's tall levels of one size, in its order: what the page calls level 1, 2, 3 of that size. */
const levelsOf = (size: number) => MEIKYUU_TALL_LEVELS.filter((level) => level.size === size);

async function aMember(browser: Browser, baseURL: string | undefined, tag: string, view = { width: 1280, height: 1100 }, touch = false): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `meikyuu-tall-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Meikyuu Tall" }, { viewport: view, ...(touch ? { hasTouch: true, isMobile: true } : {}) });
  return { context, page: await context.newPage(), email };
}

const cellsDrawn = async (page: Page) => Number(await page.getByTestId("puzzle-play").getAttribute("data-cells"));

async function openLevel(page: Page, width: number, height: number, level: number, band = "easy") {
  await page.goto(levelUrl(width, height, level, band));
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
}

/** The remembered choice of the way up is on this device only, so a context starts at Auto; a spec that wants another says so before the page loads. */
async function wayUpIs(context: BrowserContext, way: "auto" | "portrait" | "landscape"): Promise<void> {
  await context.addInitScript(([key, value]) => {
    try {
      window.localStorage.setItem(key!, value!);
    } catch {
      // Storage refused: Auto.
    }
  }, [WAY_UP_STORAGE, way]);
}

test.describe("the Tall way up on the set-up", () => {
  test("turns the four sizes into the six tall ones, a shelf of four at a time, and Start plays the level chosen", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "setup");
    try {
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("set-up-size")).toHaveCount(4);
      await expect(page.getByTestId("meikyuu-shape-square")).toHaveAttribute("data-chosen", "true");
      // Tall is a choice of its own: six sizes, four tiles at a time, the biggest a press away.
      await page.getByTestId("meikyuu-shape-tall").click();
      await expect(page.getByTestId("meikyuu-shape-tall")).toHaveAttribute("data-chosen", "true");
      await expect(page.getByTestId("set-up-size")).toHaveCount(4);
      await expect(page.getByTestId("set-up-size-name")).toHaveText(["Tiny", "Little", "Middle", "Big"]);
      await expect(page.locator('[data-testid="set-up-size"][data-chosen="true"]')).toHaveAttribute("data-size", "609");
      const first = levelsOf(1)[0]!;
      const preview = page.getByTestId("meikyuu-preview");
      await expect(preview).toHaveAttribute("data-drawn", "true");
      await expect(preview).toHaveAttribute("data-maze", first.code);
      await expect(page.getByTestId("meikyuu-preview-caption")).toContainText(`Level 1 of ${MEIKYUU_LEVELS_A_SIZE} at tall 6×9 size: not solved yet.`);
      await expect(page.getByTestId("meikyuu-levels-caption")).toContainText(`Tall 6×9: 0 of ${MEIKYUU_LEVELS_A_SIZE} solved.`);
      await page.getByTestId("meikyuu-more-sizes").click();
      await expect(page.getByTestId("set-up-size-name")).toHaveText(["Middle", "Big", "Bigger", "Biggest"]);
      // The size chosen falls to the nearest on the new shelf, and the preview follows it.
      await page.locator('[data-testid="set-up-size"][data-size="2030"]').click();
      await expect(preview).toHaveAttribute("data-size", "2030");
      await expect(preview).toHaveAttribute("data-maze", levelsOf(6)[0]!.code);

      // Start plays the first level, at the size's address.
      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(/size=20x30&level=easy&seed=1$/);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-asked")).toContainText(`Tall 20×30 · Level 1 of ${MEIKYUU_LEVELS_A_SIZE}`);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-maze", levelsOf(6)[0]!.code);

      // And back to the squares: the size last chosen of them is where it was.
      await page.goto(`${AT}/new?size=2`);
      await ready(page, "puzzle-set-up");
      await page.getByTestId("meikyuu-shape-tall").click();
      await page.getByTestId("meikyuu-shape-square").click();
      await expect(page.locator('[data-testid="set-up-size"][data-chosen="true"]')).toHaveAttribute("data-size", "2");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  for (const width of [390, 1280]) {
    test(`choosing the other shape, a size or a level moves nothing on the set-up screen, ${width}px wide`, async ({ browser, baseURL }) => {
      const { context, page, email } = await aMember(browser, baseURL, `steady-${width}`);
      try {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${AT}/new`);
        await ready(page, "puzzle-set-up");
        const reading = async () =>
          page.evaluate(() => {
            const preview = document.querySelector('[data-testid="meikyuu-preview"] > div')!.getBoundingClientRect();
            const panel = document.querySelector('[data-testid="puzzle-set-up"]')!.getBoundingClientRect();
            const play = document.querySelector('[data-testid="puzzle-play-buttons"]')!.getBoundingClientRect();
            return { box: `${Math.round(preview.width)}×${Math.round(preview.height)}`, bottom: Math.round(panel.bottom - panel.top), play: Math.round(play.top - panel.top) };
          });
        const preview = page.getByTestId("meikyuu-preview");
        await expect(preview).toHaveAttribute("data-drawn", "true");
        await expect(page.getByTestId("meikyuu-chips")).toBeVisible();
        const first = await reading();
        await page.getByTestId("meikyuu-shape-tall").click();
        await expect(preview).toHaveAttribute("data-size", "609");
        await expect(preview).toHaveAttribute("data-drawn", "true");
        expect(await reading(), "after turning to the tall mazes").toEqual(first);
        for (const size of ["1015", "812", "1218"]) {
          await page.locator(`[data-testid="set-up-size"][data-size="${size}"]`).click();
          await expect(preview).toHaveAttribute("data-size", size);
          await expect(preview).toHaveAttribute("data-drawn", "true");
          expect(await reading(), `after choosing size ${size}`).toEqual(first);
        }
        await page.getByTestId("meikyuu-more-sizes").click();
        await page.locator('[data-testid="set-up-size"][data-size="2030"]').click();
        await expect(preview).toHaveAttribute("data-drawn", "true");
        expect(await reading(), "on the second shelf").toEqual(first);
        await page.getByTestId("meikyuu-block-on").click();
        await page.locator('[data-testid="meikyuu-level"][data-level="20"]').click();
        await expect(preview).toHaveAttribute("data-level", "20");
        expect(await reading()).toEqual(first);
        await page.getByTestId("meikyuu-shape-square").click();
        await expect(preview).toHaveAttribute("data-size", "1");
        expect(await reading(), "after turning back to the squares").toEqual(first);
      } finally {
        await context.close();
        await removeMember(email);
      }
    });
  }
});

test.describe("playing a tall maze", () => {
  test("on a phone held upright it stands upright, fits the page, and a finger draws it through, paid and kept", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "phone", { width: 390, height: 844 }, true);
    try {
      await openLevel(page, 10, 15, 3);
      await expect(page.getByTestId("puzzle-asked")).toContainText(`Tall 10×15 · Level 3 of ${MEIKYUU_LEVELS_A_SIZE}`);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-maze", levelsOf(3)[2]!.code);
      // Upright, and the wood is as tall as it is wide and a half again: nothing runs past the glass.
      await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-turned", "false");
      await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-stand", "upright");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "the page runs wider than the screen").toBeLessThanOrEqual(0);
      const surface = await page.getByTestId("board-surface").boundingBox();
      expect(surface!.height / surface!.width).toBeGreaterThan(1.3);
      expect(surface!.x + surface!.width).toBeLessThanOrEqual(390);

      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      const touch = await context.newCDPSession(page);
      const send = (type: "touchStart" | "touchMove" | "touchEnd", cell: number) =>
        touch.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ ...placed.at(cell), id: 1 }] });
      await send("touchStart", way[0]!);
      for (const cell of way.slice(1)) await send("touchMove", cell);
      await send("touchEnd", way[way.length - 1]!);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      await expect(page.getByTestId("meikyuu-level-fastest")).toContainText("Fastest on level 3");

      // The solve is the member's own, at the tall size, and its page draws the line it was solved with.
      await page.goto(mySolvePath("meikyuu", await newestSolveOf(email, "meikyuu")));
      await ready(page, "solve-board");
      await expect(page.getByTestId("meikyuu-still")).toHaveAttribute("data-drawn", "true");
      await expect(page.getByTestId("solve-level")).toContainText("3, easy");
      await expect(page.getByTestId("solve-outcome")).toContainText("Solved");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("on a desk, Lying down turns the maze a quarter and the same line solves it; Upright stands it up again, and the choice is remembered", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "lying");
    try {
      await openLevel(page, 6, 9, 2);
      await expect(page.getByTestId("meikyuu-wayup-auto")).toHaveAttribute("data-chosen", "true");
      await page.getByTestId("meikyuu-wayup-landscape").click();
      await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-turned", "true");
      await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-stand", "lying");
      // The wood is wider than it is tall now, and fits the column.
      await expect.poll(async () => (await page.getByTestId("board-surface").boundingBox())!.width).toBeGreaterThan((await page.getByTestId("board-surface").boundingBox())!.height);
      await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();

      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      await drawThrough(page, placed, way.slice(0, 10));
      expect(await cellsDrawn(page), "the line a mouse draws through the turned maze").toBe(10);
      // Upright: the same cells are drawn, and the same line goes on to the goal.
      await page.getByTestId("meikyuu-wayup-portrait").click();
      await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-turned", "false");
      expect(await cellsDrawn(page), "turning the maze keeps the line").toBe(10);
      await page.getByTestId("meikyuu-wayup-landscape").click();
      await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-turned", "true");
      const again = await placedMaze(page);
      await drawThrough(page, again, way.slice(9));
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      const kept = await newestSolveOf(email, "meikyuu");
      expect(kept).toBeTruthy();

      // Remembered on this device: the next page opens lying down, and Auto puts it back to the room's own answer.
      await page.goto(levelUrl(6, 9, 4));
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("meikyuu-wayup-landscape")).toHaveAttribute("data-chosen", "true");
      await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-turned", "true");
      await page.getByTestId("meikyuu-wayup-auto").click();
      await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-turned", "false");
      expect(await page.evaluate((key) => window.localStorage.getItem(key), WAY_UP_STORAGE)).toBeNull();
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("Auto lies the maze down where the room is wide and short, and stands it up where it is not", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "auto", { width: 1100, height: 480 });
    try {
      await openLevel(page, 8, 12, 5);
      await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-turned", "true");
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-turned", "false");
      await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-stand", "upright");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a tall level left half drawn lying down opens with its line drawn again where it was, and finishes", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "kept");
    try {
      await wayUpIs(context, "landscape");
      await openLevel(page, 8, 12, 9, "easy");
      await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-turned", "true");
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      await drawThrough(page, placed, way.slice(0, 12));
      expect(await cellsDrawn(page)).toBe(12);
      await page.getByTestId("puzzle-pause").click();
      await expect(page.getByTestId("puzzle-paused")).toBeVisible();

      await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
      await expect(page).toHaveURL(/\/play$/);
      await ready(page, "tabs");
      await page.locator('[data-testid="tab"][data-tab="going"]').click();
      const row = page.locator(`[data-testid="puzzle-going"][data-kind="meikyuu"][data-seed="9"]`);
      await expect(row, "the level left unfinished is not in My games").toBeVisible();
      await expect(row).toContainText("Tall 8×12 · Level 9");
      await row.getByTestId("puzzle-going-continue").click();
      await ready(page, "puzzle-play");
      // Drawn again as a finger draws it, through the maze as it is shown now: the same twelve cells.
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", "12");
      await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-turned", "true");
      const again = await placedMaze(page);
      await drawThrough(page, again, way.slice(11));
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the server pays for the way through a tall level, at its own size, and for nothing else", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "check");
    try {
      const level = levelsOf(2)[3]!;
      await openLevel(page, 8, 12, 4);
      const placed = await placedMaze(page);
      const answer = encodeCells(placed.maze, wayThrough(placed))!;
      const handed = (body: object) => page.request.post("/api/puzzles/solved", { data: { kind: "meikyuu", size: 812, level: "easy", seed: 4, givens: level.code, elapsedMs: 5000, ...body } });
      // One step short, a maze of another size's, a size it is not of, and a square size: each refused, none paid.
      expect((await handed({ answer: answer.slice(0, -1) })).status()).toBe(422);
      expect((await handed({ answer, givens: levelsOf(1)[3]!.code })).status()).toBe(422);
      expect((await handed({ answer, size: 609 })).status()).toBe(422);
      expect((await handed({ answer, size: 2 })).status()).toBe(422);
      const paid = await handed({ answer });
      expect(paid.status()).toBe(200);
      expect(((await paid.json()) as { ok: boolean }).ok).toBe(true);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the six sizes are the package's, as the page names them", async () => {
    expect(PACKAGE_TALL_SIZES.map((size) => size.label)).toEqual(["6×9", "8×12", "10×15", "12×18", "16×24", "20×30"]);
  });
});
