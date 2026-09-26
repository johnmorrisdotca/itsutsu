import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { ready } from "./support";

/**
 * A puzzle's set-up keeps what was chosen through a reload.
 *
 * John, 2026-09-26: "selected Board Size is not preserved on reload" — the
 * choice lived only in the page, so a reload began again at 7, Usual. Each
 * choice now writes itself into the address, which the set-up already opened
 * on. The reload IS the subject here, which is the one case a spec reloads.
 * It drives the tiles as a reader does, then checks the way back as well as
 * the way there: a second choice replaces the first, and survives its reload.
 */
test("Hidden Stones' set-up opens on the board and level chosen before a reload", async ({ page }) => {
  const newPath = `/games/${PUZZLE_SLUGS.hiddenStones}/new`;
  const tile = (size: number) => page.locator(`[data-testid="set-up-size"][data-size="${size}"]`);

  await page.goto(newPath);
  await ready(page, "puzzle-set-up");
  // An address nobody changed stays as it was typed.
  await expect(tile(7)).toHaveAttribute("data-chosen", "true");
  expect(new URL(page.url()).search).toBe("");

  await tile(9).click();
  await page.getByTestId("puzzle-level-hard").click();
  await expect(page).toHaveURL(/size=9/);
  await expect(page).toHaveURL(/level=hard/);

  await page.reload();
  await ready(page, "puzzle-set-up");
  await expect(tile(9)).toHaveAttribute("data-chosen", "true");
  await expect(page.getByTestId("puzzle-level-hard")).toHaveAttribute("aria-checked", "true");

  // The way back: another board, kept over the last.
  await tile(5).click();
  await expect(page).toHaveURL(/size=5/);
  await page.reload();
  await ready(page, "puzzle-set-up");
  await expect(tile(5)).toHaveAttribute("data-chosen", "true");
  await expect(tile(9)).toHaveAttribute("data-chosen", "false");

  // And Play takes the board shown, not the default.
  await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /size=5/);
});
