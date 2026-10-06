import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import type { BridgesBoard } from "../src/lib/puzzles/bridges/bridges.types";
import { boardOf, decodeBridges } from "../src/lib/puzzles/bridges/code";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import type { PuzzleLevel } from "../src/lib/puzzles/puzzles.types";
import { freshPuzzleSeed, ready } from "./support";
import { viewStillMovesAfterSolve } from "./viewAfterSolve";

/**
 * BRIDGES AT 17×17, 21×21 AND 25×25: islands in the hundred and more, read and
 * joined on a phone and at a desk.
 *
 * What is proved is what a reader does: the set-up offers the three on its
 * second shelf; the biggest opens zoomed and fits back; a finger drags a
 * bridge between two islands without the page moving; and whole boards are
 * solved by dragging a bridge between each pair, from the answer the spec makes
 * out of the seed the page uses.
 */
const KIND = "bridges";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

/**
 * A 25×25 BOARD WITH A BRIDGE LEAVING THE PHONE'S VIEW. The page opens a 25×25 zoomed in, so only a part of the board is on the screen, and the
 * drag test below needs a bridge from an island well inside the box to one past its right edge. Which islands those are depends on the board,
 * so a random seed could (rarely) make a board with none and fail by chance. This seed was chosen by opening it at the phone's size and
 * finding such a bridge, and it makes the same board every time, so the test cannot fail by luck; it still looks for the island on the page.
 */
const OFF_SCREEN_SEED = 1;

type Laid = { board: BridgesBoard; answer: number[] };

function answerOf(size: number, level: PuzzleLevel, seed: number): Laid {
  const puzzle = generatePuzzle(KIND, size, level, seed);
  const board = boardOf(puzzle.givens, size)!;
  return { board, answer: decodeBridges(board, puzzle.solution)! };
}

/** Where every island is on the page once the whole board is in view (Fit): the board's own box, a cell a side-th of it. */
async function cellsAt(page: Page, size: number) {
  await page.getByTestId("bridges-fit").click();
  await expect(page.getByTestId("bridges-viewport")).toHaveAttribute("data-zoom", "1.00");
  const box = (await page.getByTestId("bridges-board").boundingBox())!;
  return (cell: number) => ({ x: box.x + ((cell % size) + 0.5) * (box.width / size), y: box.y + (Math.floor(cell / size) + 0.5) * (box.height / size) });
}

/** One bridge by dragging, a pointer's way: pressed on one island, moved across the water, lifted on the other. */
async function drag(page: Page, at: (cell: number) => { x: number; y: number }, from: number, to: number) {
  const a = at(from);
  const b = at(to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 3 });
  await page.mouse.up();
}

/** Every bridge of the answer, one drag each (two for a double), until the puzzle says it is solved. */
async function solveByDragging(page: Page, size: number, { board, answer }: Laid) {
  await ready(page, "puzzle-play");
  const at = await cellsAt(page, size);
  for (const [span, count] of answer.entries()) {
    for (let bridge = 0; bridge < count; bridge += 1) {
      if (await page.getByTestId("puzzle-done").isVisible()) break;
      await drag(page, at, board.islands[board.spans[span]!.a]!.cell, board.islands[board.spans[span]!.b]!.cell);
    }
  }
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
}

test.describe("the three biggest Bridges boards", () => {
  test("the set-up offers 17×17, 21×21 and 25×25 on its second shelf, every level", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="set-up-size"][data-size="25"]')).toHaveCount(0);
    await page.getByTestId("puzzle-level-hard").click();
    await page.getByTestId("puzzle-more-sizes").click();
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    await page.locator('[data-testid="set-up-size"][data-size="25"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", "25");
    await expect(page.getByTestId("puzzle-level-hard")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /size=25&level=hard/);
    await page.locator('[data-testid="set-up-size"][data-size="13"]').click();
    await expect(page.getByTestId("puzzle-more-sizes")).toBeVisible();
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("a 25×25 opens zoomed, moves, and fits back, and the page never scrolls sideways", async ({ page }) => {
      await page.goto(`${AT}/play?size=25&level=medium&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      const view = page.getByTestId("bridges-viewport");
      await expect(view).toHaveAttribute("data-zoom", "2.00");
      // An island is a thing a thumb can press: wider than a finger's tip at half.
      const first = (await page.getByTestId("bridges-island").first().boundingBox())!;
      expect(first.width).toBeGreaterThan(24);
      await page.getByTestId("bridges-arrows").click();
      await page.getByTestId("bridges-pad-down").click();
      await page.getByTestId("bridges-pad-right").click();
      await page.getByTestId("bridges-pad-in").click();
      expect(Number(await view.getAttribute("data-zoom"))).toBeGreaterThan(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      await page.getByTestId("bridges-fit").click();
      await expect(view).toHaveAttribute("data-zoom", "1.00");
      await page.getByTestId("bridges-arrows").click();
    });

    test("a finger drags a bridge toward an island out of sight, and lifting lays it, the page where it was", async ({ page }) => {
      const seed = OFF_SCREEN_SEED;
      const { board, answer } = answerOf(25, "medium", seed);
      await page.goto(`${AT}/play?size=25&level=medium&seed=${seed}`);
      await ready(page, "puzzle-play");
      const view = page.getByTestId("bridges-viewport");
      const box = (await view.boundingBox())!;
      const islands = page.getByTestId("bridges-island");
      // A bridge across from an island in view to one past the box's right edge.
      let chosen: { span: number; from: { x: number; y: number } } | null = null;
      for (const [span, count] of answer.entries()) {
        if (count === 0 || !board.spans[span]!.across) continue;
        const a = (await islands.nth(board.spans[span]!.a).boundingBox())!;
        const b = (await islands.nth(board.spans[span]!.b).boundingBox())!;
        const inside = a.x > box.x + 16 && a.x + a.width < box.x + box.width - 16 && a.y > box.y + 4 && a.y + a.height < box.y + box.height - 4;
        if (inside && b.x > box.x + box.width) {
          chosen = { span, from: { x: a.x + a.width / 2, y: a.y + a.height / 2 } };
          break;
        }
      }
      // A 25×25 opened at twice the box shows a quarter of the board: some bridge always leaves it.
      expect(chosen, "a bridge from an island in view toward one off screen").not.toBeNull();
      const scrollBefore = await page.evaluate(() => window.scrollY);
      const cdp = await page.context().newCDPSession(page);
      const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
        cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
      await touch("touchStart", chosen!.from.x, chosen!.from.y);
      await touch("touchMove", chosen!.from.x + 16, chosen!.from.y);
      await touch("touchMove", chosen!.from.x + 30, chosen!.from.y);
      // Held, the bridge it would lay is aimed along the row, at an island nobody can see yet.
      await expect(page.getByTestId("bridges-board")).toHaveAttribute("data-aim", String(chosen!.span));
      await touch("touchEnd", 0, 0);
      await expect(page.locator(`[data-testid="bridges-bridge"][data-span="${chosen!.span}"]`)).toHaveAttribute("data-count", "1");
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    });

    test("a 17×17 is solved on a phone, bridge by bridge, by dragging between the islands", async ({ page }) => {
      test.setTimeout(240_000);
      const seed = freshPuzzleSeed();
      await page.goto(`${AT}/play?size=17&level=medium&seed=${seed}`);
      await solveByDragging(page, 17, answerOf(17, "medium", seed));
      await viewStillMovesAfterSolve(page, "bridges", { pinch: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    });
  });

  test.describe("at a desk", () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test("a 25×25 is solved by dragging a bridge between each pair, kept and scored", async ({ page }) => {
      test.setTimeout(300_000);
      const seed = freshPuzzleSeed();
      await page.goto(`${AT}/play?size=25&level=medium&seed=${seed}`);
      await solveByDragging(page, 25, answerOf(25, "medium", seed));
      await viewStillMovesAfterSolve(page, "bridges");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      await page.getByTestId("puzzle-see-solve").click();
      await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", /replay|finished/);
    });

    test("a 21×21 hard opens as the puzzle its seed makes, every island of it on the board", async ({ page }) => {
      const seed = freshPuzzleSeed();
      await page.goto(`${AT}/play?size=21&level=hard&seed=${seed}`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-seed", String(seed));
      const laid = answerOf(21, "hard", seed);
      await expect(page.getByTestId("bridges-island")).toHaveCount(laid.board.islands.length);
    });

    test("a long drag over a 25×25 is smooth: no step of it takes a frame's worth of work twice over", async ({ page }) => {
      const seed = freshPuzzleSeed();
      const { board, answer } = answerOf(25, "medium", seed);
      await page.goto(`${AT}/play?size=25&level=medium&seed=${seed}`);
      await ready(page, "puzzle-play");
      const at = await cellsAt(page, 25);
      await page.evaluate(() => {
        const w = window as unknown as { __frames: number[] };
        w.__frames = [];
        let last = performance.now();
        const tick = (now: number) => {
          w.__frames.push(now - last);
          last = now;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await page.waitForTimeout(300);
      await page.evaluate(() => ((window as unknown as { __frames: number[] }).__frames.length = 0));
      // Eight bridges' drags, each in small steps.
      let dragged = 0;
      for (const [span, count] of answer.entries()) {
        if (count === 0 || dragged === 8) continue;
        const a = at(board.islands[board.spans[span]!.a]!.cell);
        const b = at(board.islands[board.spans[span]!.b]!.cell);
        await page.mouse.move(a.x, a.y);
        await page.mouse.down();
        await page.mouse.move(b.x, b.y, { steps: 30 });
        await page.mouse.up();
        dragged += 1;
      }
      const frames = await page.evaluate(() => (window as unknown as { __frames: number[] }).__frames.slice(2));
      expect(frames.length).toBeGreaterThan(20);
      const sorted = [...frames].sort((x, y) => x - y);
      expect(sorted[Math.floor(sorted.length * 0.9)]!).toBeLessThan(50);
    });
  });
});
