import { expect, test, type Page } from "@playwright/test";

import { countsAsMove, decodeCubeMoves, moveNotation } from "@johnmorrisdotca/kyuubu";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { freshPuzzleSeed, ready } from "./support";

/**
 * THE 6×6 AND THE 7×7: the Cube's two biggest, on the set-up's second shelf,
 * scrambled by the same seed in every browser, turned by hand and by keys at
 * every layer they have (the inner ones through a digit and the middle ones by
 * M, E and S), zoomed on a phone, and solved when every face is one colour —
 * which the server turns again from the scramble before it pays.
 *
 * A short scramble is typed back as a reader at a keyboard would: the spec reads
 * the same seed the page scrambled and types the notation that undoes it.
 */
const KIND = "cube";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

/** A turn's keys as a reader types it: a digit for an inner layer, the letter, Shift for a prime, twice for a half turn. */
async function typeMove(page: Page, written: string) {
  const [, depth, letter, amount] = /^(\d?)([A-Za-z])(['2]?)$/.exec(written)!;
  if (depth !== "") await page.keyboard.press(depth);
  const key = amount === "'" ? `Shift+${letter.toUpperCase()}` : letter.toLowerCase();
  await page.keyboard.press(key);
  if (amount === "2") {
    if (depth !== "") await page.keyboard.press(depth);
    await page.keyboard.press(key);
  }
}

async function settledCube(page: Page) {
  await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-turning", "false");
}

/** The scramble's way back, typed, a turn at a time. */
async function typeSolution(page: Page, size: number, solution: string) {
  for (const move of decodeCubeMoves(solution)!) {
    await typeMove(page, moveNotation(move, size));
    await settledCube(page);
  }
}

test.describe("the Cube at 6×6 and 7×7", () => {
  test("the set-up offers them on its second shelf, with a live cube of the size chosen", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="set-up-size"][data-size="7"]')).toHaveCount(0);
    await page.getByTestId("puzzle-level-hard").click();
    await page.getByTestId("puzzle-more-sizes").click();
    await expect(page.locator('[data-testid="set-up-size"]')).toHaveCount(4);
    for (const size of [6, 7]) {
      await page.locator(`[data-testid="set-up-size"][data-size="${size}"]`).click();
      await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", String(size));
      // Six faces of size × size stickers, drawn.
      await expect(page.getByTestId("set-up-puzzle-preview").locator("[data-kyuubu] [data-slot]")).toHaveCount(6 * size * size);
      await expect(page.getByTestId("puzzle-level-hard")).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", new RegExp(`size=${size}&level=hard`));
    }
    await page.locator('[data-testid="set-up-size"][data-size="4"]').click();
    await expect(page.getByTestId("puzzle-more-sizes")).toBeVisible();
  });

  test("a 7×7 is scrambled as its seed says and solved by typing its notation, inner layers and the middle one included, and played back", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 7, "easy", seed);
    await page.goto(`${AT}/play?size=7&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("cube")).toHaveAttribute("data-size", "7");
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", puzzle.givens);
    await expect(page.locator("[data-kyuubu] [data-slot]")).toHaveCount(294);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "false");
    await typeSolution(page, 7, puzzle.solution);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
    const counted = decodeCubeMoves(puzzle.solution)!.filter(countsAsMove).reduce((sum, move) => sum + (move.turns === 2 ? 2 : 1), 0);
    await expect(page.getByTestId("puzzle-solved-line")).toContainText(`${counted} ${counted === 1 ? "move" : "moves"}`, { timeout: 15_000 });
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|IP|Already paid|allowance/);

    // Kept: its own page steps from the scramble to solved, a turn at a time.
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("cube-replay")).toBeVisible();
    await ready(page, "cube-replay");
    await expect(page.getByTestId("cube-replay-at")).toContainText(`${counted}`);
    await page.getByRole("button", { name: "One move back" }).click();
    await expect(page.getByTestId("cube-replay-at")).toHaveText(`Move ${counted - 1} of ${counted}`);
    await settledCube(page);
    await page.getByTestId("cube-replay-scrubber").fill("0");
    await expect(page.getByTestId("cube-replay-at")).toContainText("The scramble");
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", puzzle.givens);
  });

  test("a 6×6 has no middle layer to turn, and every layer it has turns by its digit", async ({ page }) => {
    const seed = freshPuzzleSeed();
    await page.goto(`${AT}/play?size=6&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("cube-move-count")).toHaveText("0 moves");
    // M is the middle layer of a cube with one: a 6×6 has none, and the key does nothing.
    await page.keyboard.press("m");
    await settledCube(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("0 moves");
    // 3R is the third layer in from the right; 2, 3 and then the layers a 6×6 does not have beyond a face's own side.
    for (const [keys, count] of [
      [["3", "r"], 1],
      [["2", "u"], 2],
      [["4", "f"], 3],
    ] as const) {
      for (const key of keys) await page.keyboard.press(key);
      await settledCube(page);
      await expect(page.getByTestId("cube-move-count")).toHaveText(`${count} ${count === 1 ? "move" : "moves"}`);
    }
    await page.getByTestId("cube-undo").click();
    await settledCube(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("2 moves");
  });

  test("a drag turns the layer under the finger and a pair of fingers zooms, on a 7×7 at a desk", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${AT}/play?size=7&level=medium&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("cube-move-count")).toHaveText("0 moves");
    // The front's centre sticker: slots run U R F D L B, forty-nine to a face, so the front starts at 98 and its centre is 98 + 24.
    const sticker = page.locator('[data-kyuubu] [data-slot="122"]');
    const box = (await sticker.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 4, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    await settledCube(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("1 move");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-inspecting", "false");
    // The wheel over a sticker turns its row, as it does on any cube.
    const again = (await sticker.boundingBox())!;
    await page.mouse.move(again.x + again.width / 2, again.y + again.height / 2);
    await page.mouse.wheel(0, 120);
    await settledCube(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("2 moves");
    await page.getByTestId("cube-undo").click();
    await settledCube(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("1 move");
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("a 7×7 fits the screen, zooms in on its stickers and back, and a finger's drag turns a layer", async ({ page }) => {
      await page.goto(`${AT}/play?size=7&level=medium&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      const cube = (await page.getByTestId("cube").boundingBox())!;
      expect(cube.width).toBeGreaterThan(250);
      const widthOf = async () => (await page.locator("[data-kyuubu]").boundingBox())!.width;
      const first = await widthOf();
      // A sticker of the whole cube is about twenty-five pixels; at the most the zoom gives, it is bigger than a finger's tip.
      const small = (await page.locator('[data-kyuubu] [data-slot="122"]').boundingBox())!;
      await page.getByTestId("cube-zoom-in").click();
      await page.getByTestId("cube-zoom-in").click();
      await page.getByTestId("cube-zoom-in").click();
      await page.getByTestId("cube-zoom-in").click();
      await expect.poll(widthOf).toBeGreaterThan(first * 1.5);
      const near = (await page.locator('[data-kyuubu] [data-slot="122"]').boundingBox())!;
      expect(near.width).toBeGreaterThan(small.width * 1.5);
      expect(near.width).toBeGreaterThan(30);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      await page.getByTestId("cube-zoom-reset").click();
      await expect.poll(widthOf).toBeCloseTo(first, 0);

      // A finger across a sticker of the front turns the layer it carries.
      const at = (await page.locator('[data-kyuubu] [data-slot="122"]').boundingBox())!;
      const cdp = await page.context().newCDPSession(page);
      const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
        cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
      const fromX = at.x + at.width / 2;
      const fromY = at.y + at.height / 2;
      await touch("touchStart", fromX, fromY);
      for (let step = 1; step <= 12; step += 1) await touch("touchMove", fromX + step * 7, fromY);
      await touch("touchEnd", 0, 0);
      await settledCube(page);
      await expect(page.getByTestId("cube-move-count")).toHaveText("1 move");
    });

    test("a 6×6 is solved on a phone by typing the way back, and left half way it waits in My games", async ({ page }) => {
      const seed = freshPuzzleSeed();
      const puzzle = generatePuzzle(KIND, 6, "easy", seed);
      await page.goto(`${AT}/play?size=6&level=easy&seed=${seed}`);
      await ready(page, "puzzle-play");
      // Three turns of it, then away and back.
      await typeSolution(page, 6, puzzle.solution.slice(0, 3 * 3));
      const kept = await page.getByTestId("puzzle-play").getAttribute("data-moves");
      await page.getByTestId("puzzle-pause").click();
      await expect(page.getByTestId("puzzle-paused")).toBeVisible();
      await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
      await ready(page, "tabs");
      await page.locator('[data-testid="tab"][data-tab="going"]').click();
      const row = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"][data-seed="${seed}"]`);
      await expect(row).toBeVisible();
      await row.getByTestId("puzzle-going-continue").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-moves", kept!);
      // And the rest of the way back.
      await typeSolution(page, 6, puzzle.solution.slice(3 * 3));
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|IP|Already paid|allowance/, { timeout: 15_000 });
    });
  });
});
