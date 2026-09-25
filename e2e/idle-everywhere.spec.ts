import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { openSetUpPage, ready, startAndBegin } from "./support";

/**
 * "ARE YOU STILL THERE?" ON A PUZZLE AND ON A LIVE GAME, not only the practice
 * board (`idle-leave.spec.ts`). John, 2026-09-24: "All games should have
 * that... why do we have games that don't have it????"
 *
 * Two minutes of nothing is what triggers it, so the clock is driven rather
 * than waited out, and only once the page says it is listening (its ready mark):
 * the watch is a timer that exists from hydration, and winding the clock before
 * it reads as "the question never appeared".
 */
test("a puzzle left alone asks, pauses its clock and covers its grid, and Still here carries on", async ({ page }) => {
  await page.clock.install();
  const givens = decodeCells(generateNumberPlace(4, "easy", 5).givens, 4)!;
  await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=4&level=easy&seed=5`);
  await ready(page, "puzzle-play");
  // The clock starts on the first entry, and the question is about a run that has started.
  await page.getByTestId("puzzle-cell").nth(givens.findIndex((given) => given === 0)).click();
  await page.getByTestId("puzzle-key-1").click();

  await page.clock.runFor("03:10");
  const modal = page.getByTestId("idle-modal");
  await expect(modal, "the idle question never appeared on a puzzle").toBeVisible();
  await expect(modal).toContainText("A puzzle is not kept");
  await expect(page.getByTestId("puzzle-pausable")).toHaveAttribute("data-paused", "true");
  const stopped = await page.getByTestId("puzzle-clock").textContent();
  await page.clock.runFor("01:00");
  await expect(page.getByTestId("puzzle-clock")).toHaveText(stopped!);

  await page.getByTestId("idle-confirm").click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByTestId("puzzle-pausable")).toHaveAttribute("data-paused", "false");
  await expect(page.getByTestId("puzzle-grid")).toBeVisible();
});

test("a live game left alone asks its seat holder, and says the game is kept", async ({ page }) => {
  await page.clock.install();
  await openSetUpPage(page);
  await startAndBegin(page);
  await ready(page, "shared-game");

  await page.clock.runFor("03:10");
  const modal = page.getByTestId("idle-modal");
  await expect(modal, "the idle question never appeared on a live game").toBeVisible();
  await expect(modal).toContainText("kept on the site");
  await page.getByTestId("idle-confirm").click();
  await expect(modal).toHaveCount(0);
});
