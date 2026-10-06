import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { freshPuzzleSeed, ready } from "./support";

/**
 * THE CUBE TAUGHT: "Show me how" on the play page, which gives the next step
 * of the beginner's method and turns it on request, and the guide in Learn,
 * which tells each step with a cube to practise it on. Both are driven as a
 * reader drives them, by pressing the buttons.
 */
const AT = `/games/${PUZZLE_SLUGS.cube}`;

async function settledCube(page: Page) {
  await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-turning", "false", { timeout: 30_000 });
}

test.describe("the cube's guide, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is found from Learn and the rules, tells every step, and a step practised is finished", async ({ page }) => {
    await page.goto(`${AT}/rules`);
    await page.getByTestId("rules-learn").getByRole("link", { name: "Solve the cube" }).click();
    await expect(page).toHaveURL(/\/learn\/cube$/);
    await ready(page, "cube-method");
    await expect(page.getByTestId("cube-method-stage")).toHaveCount(8);

    await page.getByTestId("cube-method-size-2").click();
    await expect(page.getByTestId("cube-method-stage")).toHaveCount(4);
    await page.getByTestId("cube-method-size-3").click();

    const stage = page.locator('[data-testid="cube-method-stage"][data-stage="yellowFace"]');
    await stage.getByTestId("cube-method-practise").click();
    const practice = stage.getByTestId("cube-practice");
    await expect(practice).toHaveAttribute("data-done", "false");
    await practice.getByTestId("cube-practice-show").click();
    await expect(practice.getByTestId("cube-practice-turns")).toContainText("Sune");
    // Turned for the reader, a turn at a time (the replay has its own spec, `cube-method-replay`): fast, so this one waits less.
    await practice.getByTestId("cube-practice-turn").click();
    await practice.getByTestId("cube-step-speed-fast").click();
    await expect(practice).toHaveAttribute("data-done", "true", { timeout: 40_000 });
    await expect(practice.getByTestId("cube-practice-said")).toContainText("Done");
    await settledCube(page);

    // Another cube is a fresh one with the step still to do.
    await practice.getByTestId("cube-practice-another").click();
    await expect(practice).toHaveAttribute("data-done", "false");

    await page.goto("/learn");
    await page.getByTestId("learn-cube").click();
    await expect(page).toHaveURL(/\/learn\/cube$/);
  });
});

test.describe("Show me how", () => {
  test("gives the next step and turns it, and a solve it helped is kept as helped", async ({ page }) => {
    await page.goto(`${AT}/play?size=2&level=easy&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    const guide = page.getByTestId("cube-guide");
    await expect(guide).toContainText("scores no points");
    await page.getByTestId("cube-guide-open").click();
    await expect(page.getByTestId("cube-guide-title")).toBeVisible();

    // Every step turned for the reader until the cube is solved.
    for (let step = 0; step < 12; step += 1) {
      if ((await page.getByTestId("puzzle-play").getAttribute("data-solved")) === "true") break;
      await page.getByTestId("cube-guide-turn").click();
      await settledCube(page);
    }
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
    await expect(page.getByTestId("puzzle-helped")).toHaveAttribute("data-helped", "guided", { timeout: 15_000 });
    await expect(page.getByTestId("puzzle-helped")).toContainText("steps were shown");
  });

  test("shows the next move on the cube itself, follows the solve, and takes it off again", async ({ page }) => {
    await page.goto(`${AT}/play?size=3&level=easy&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    const cube = page.locator("[data-kyuubu]");
    await page.getByTestId("cube-guide-open").click();
    await expect(page.getByTestId("cube-guide-title")).toBeVisible();
    await expect(cube).not.toHaveAttribute("data-hint", /.+/);

    await page.getByTestId("cube-guide-on-cube").click();
    await expect(page.getByTestId("cube-guide-on-cube")).toHaveAttribute("aria-pressed", "true");
    // The move is lit on the cube (a drag to make, a look round to find it, or a turn of the whole cube) and said in words beside it.
    await expect(cube).toHaveAttribute("data-hint", /^(drag|look|whole)$/);
    const now = page.getByTestId("cube-guide-now");
    await expect(now).toContainText(/Turn|Look|whole cube/);
    const first = await page.getByTestId("cube-guide").getAttribute("data-step-moves");
    await expect(now.locator(".font-mono")).toHaveText(first!.split(" ")[0]!);

    // Turned for the reader, the guide moves on and the cube shows the new step's first move.
    await page.getByTestId("cube-guide-turn").click();
    await settledCube(page);
    const next = await page.getByTestId("cube-guide").getAttribute("data-step-moves");
    await expect(now.locator(".font-mono")).toHaveText(next!.split(" ")[0]!);
    await expect(cube).toHaveAttribute("data-hint", /^(drag|look|whole)$/);

    await page.getByTestId("cube-guide-on-cube").click();
    await expect(page.getByTestId("cube-guide-now")).toHaveCount(0);
    await expect(cube).not.toHaveAttribute("data-hint", /.+/);
  });

  test("is for the 2×2 and 3×3, and says so on a bigger cube", async ({ page }) => {
    await page.goto(`${AT}/play?size=4&level=easy&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("cube-guide-sizes")).toContainText("2×2 and 3×3");
    await expect(page.getByTestId("cube-guide-open")).toHaveCount(0);
  });
});
