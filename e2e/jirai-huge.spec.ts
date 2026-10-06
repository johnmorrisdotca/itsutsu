import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { JIRAI_SEED_BLOCK } from "../src/lib/puzzles/random";
import { freshJiraiSeed } from "../src/lib/puzzles/jirai/variants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * JIRAI AT 32×32, THE HUGE FIELD: 1,024 squares, four times the 16×16, dealt and proved to need no guess.
 *
 * What is proved is what a reader does: the set-up offers it on its second shelf; on a phone it opens
 * zoomed with a pad that moves it and fits it back, a square is a thing a thumb can press, a tap is
 * answered within a frame or two even with the processor slowed fourfold, and the page never scrolls
 * sideways; at a desk the whole field is there and a whole one is cleared by uncovering every safe square.
 */
const AT = `/games/${PUZZLE_SLUGS.jirai}`;
const square = (page: Page, cell: number) => page.locator(`[data-testid="jirai-cell"][data-cell="${cell}"]`);
const codeOf = async (page: Page) => (await page.getByTestId("puzzle-play").getAttribute("data-code")) ?? "";

test.describe("the 32×32 Jirai", () => {
  test("the set-up offers it on its second shelf, every level, and the address carries it", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="set-up-size"][data-size="32"]')).toHaveCount(0);
    await page.getByTestId("puzzle-level-extra-hard").click();
    await page.getByTestId("puzzle-more-sizes").click();
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    await page.locator('[data-testid="set-up-size"][data-size="32"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", "32");
    await expect(page.getByTestId("set-up-puzzle-preview").getByTestId("jirai-cell")).toHaveCount(1024);
    await expect(page.getByTestId("puzzle-level-extra-hard")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /size=32&level=extra-hard/);
    // A shape and four neighbours are still choices on the huge board.
    await page.getByTestId("jirai-grid-orthogonal").click();
    await page.getByTestId("jirai-shape-heart").click();
    await expect(page.getByTestId("jirai-shape-heart")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("set-up-puzzle-preview").locator('.jr-root[data-grid="orthogonal"][data-shape="heart"]')).toBeVisible();
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("opens zoomed on its middle's side of the board, moves and fits back, and the page never scrolls sideways", async ({ page }) => {
      const seed = freshPuzzleSeed();
      await page.goto(`${AT}/play?size=32&level=hard&seed=${seed}`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("jirai-cell")).toHaveCount(1024);
      const view = page.getByTestId("jirai-viewport");
      await expect(view).toHaveAttribute("data-zoom", "3.00");
      // It opens on the middle of the field, where the opening is uncovered, not on a corner of covered squares.
      // The square it opens on is the one the board was first opened at (`first` in the board's recipe), which is
      // uncovered: the lowest-numbered zero is not it, since an opening can spread a long way up and to the left of it.
      const opened = Number(generatePuzzle("jirai", 32, "hard", seed).givens.split(":")[5]);
      expect(Number.isInteger(opened)).toBe(true);
      expect((await codeOf(page))[opened]).toBe("0");
      const box = (await view.boundingBox())!;
      const middle = (await square(page, opened).boundingBox())!;
      expect(middle.x).toBeGreaterThanOrEqual(box.x - 1);
      expect(middle.x + middle.width).toBeLessThanOrEqual(box.x + box.width + 1);
      expect(middle.y).toBeGreaterThanOrEqual(box.y - 1);
      expect(middle.y + middle.height).toBeLessThanOrEqual(box.y + box.height + 1);
      // A square is a thing a thumb can press at three times the fitted board.
      const first = (await square(page, 0).boundingBox())!;
      expect(first.width).toBeGreaterThan(28);
      await page.getByTestId("jirai-arrows").click();
      await page.getByTestId("jirai-pad-down").click();
      await page.getByTestId("jirai-pad-right").click();
      await page.getByTestId("jirai-pad-in").click();
      expect(Number(await view.getAttribute("data-zoom"))).toBeGreaterThan(3);
      await page.getByTestId("jirai-fit").click();
      await expect(view).toHaveAttribute("data-zoom", "1.00");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });

    test("a tap is answered in a frame or two with the processor slowed fourfold, on 1,024 squares", async ({ page }) => {
      const seed = freshPuzzleSeed();
      await page.goto(`${AT}/play?size=32&level=extra-hard&seed=${seed}`);
      await ready(page, "puzzle-play");
      const puzzle = generatePuzzle("jirai", 32, "extra-hard", seed);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      // Flag Mode is on, so a tap flags: a mine, so it is a right flag, and the whole board redraws.
      await page.getByTestId("jirai-flag").tap();
      const code = await codeOf(page);
      const mines = [...puzzle.solution].flatMap((character, at) => (character === "f" && code[at] === "." ? [at] : []));
      const times: number[] = [];
      for (const mine of mines.slice(0, 6)) {
        const waited = await page.evaluate(async (at) => {
          const each = document.querySelector<HTMLElement>(`[data-testid="jirai-cell"][data-cell="${at}"]`)!;
          const started = performance.now();
          each.click();
          await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
          return { ms: performance.now() - started, kind: document.querySelector<HTMLElement>(`[data-testid="jirai-cell"][data-cell="${at}"]`)!.dataset.kind };
        }, mine);
        expect(waited.kind).toBe("flag");
        times.push(waited.ms);
      }
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      times.sort((a, b) => a - b);
      expect(times[Math.floor(times.length / 2)]!, `taps took ${times.map(Math.round).join(", ")} ms`).toBeLessThan(250);
    });
  });

  test.describe("at a desk", () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test("the whole field is there, and uncovering every safe square clears it, kept and paid", async ({ page }) => {
      test.setTimeout(300_000);
      const seed = freshPuzzleSeed();
      await page.goto(`${AT}/play?size=32&level=hard&seed=${seed}`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("jirai-viewport")).toHaveAttribute("data-zoom", "1.00");
      await expect(page.getByTestId("jirai-cell")).toHaveCount(1024);
      expect((await square(page, 0).boundingBox())!.width).toBeGreaterThan(14);
      const puzzle = generatePuzzle("jirai", 32, "hard", seed);
      for (let step = 0; step < 900; step += 1) {
        if (await page.getByTestId("puzzle-done").isVisible()) break;
        const code = await codeOf(page);
        const safe = [...code].findIndex((character, at) => character === "." && puzzle.solution[at] !== "f");
        if (safe === -1) break;
        await square(page, safe).click();
        await expect.poll(async () => (await codeOf(page))[safe]).toMatch(/[0-8]/);
      }
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    });

    test("a way to play other than the classic is dealt at 32×32 too, on the seed's own board", async ({ page }) => {
      const seed = freshJiraiSeed({ grid: "hex", shape: "hexagon" });
      expect(seed).toBeGreaterThanOrEqual(JIRAI_SEED_BLOCK.from);
      await page.goto(`${AT}/play?size=32&level=easy&seed=${seed}`);
      await ready(page, "puzzle-play");
      await expect(page.locator('.jr-root[data-grid="hex"][data-shape="hexagon"]')).toBeVisible();
      expect(await page.getByTestId("jirai-cell").count()).toBeGreaterThan(500);
    });
  });
});
