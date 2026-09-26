import { expect, test } from "@playwright/test";

import { ready } from "./support";

/**
 * THE PLAY COLUMN STARTS AT THE TOP, NOT CENTRED LOW BESIDE THE OPTIONS.
 *
 * John, 2026-09-25, on Gomoji Mot's set-up screen: "probably best to always
 * TOP ALIGN TOP RIGHT the PLAY buttons. So they are not near the bottom." The
 * fix lives in the shared layout both a puzzle's own set-up screen and a
 * puzzle chosen from a game's set-up screen use (`SET_UP_PLAY_COLUMN` in
 * `picker.constants.ts`), not in one page — this drives the puzzle's own
 * screen, where the bug was found.
 */
test("the Play column's first button sits at the top of its column, not centred, on a desk", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/games/gomoji-mot/new");
  await ready(page, "puzzle-set-up");

  const column = await page.getByTestId("puzzle-play-buttons").boundingBox();
  const solve = await page.getByTestId("puzzle-solve").boundingBox();
  expect(column).not.toBeNull();
  expect(solve).not.toBeNull();

  // Stretched to the row's full height beside Options (`md:items-stretch`), so
  // there is real room below the buttons — the space a centred column would
  // have split evenly above and below them.
  const topGap = solve!.y - column!.y;
  const bottomGap = column!.y + column!.height - (solve!.y + solve!.height);
  expect(bottomGap, "the column is not taller than its buttons, so top-versus-bottom proves nothing").toBeGreaterThan(20);
  expect(topGap, "the first Play button is not flush with the top of its column").toBeLessThan(8);
  expect(topGap, "the button sits nearer the top than the bottom, not centred between them").toBeLessThan(bottomGap);
});
