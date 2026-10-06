import { mkdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { HOUSEKI_KIND_LIST } from "../src/lib/houseki/houseki.constants";
import { housekiQuery } from "../src/lib/houseki/housekiAddress";
import { housekiPlayPath } from "../src/lib/gomoku/slugs";
import { ready } from "./support";

/**
 * One screenshot per Houseki game, into public/art/games/ — the picture on the
 * game's front door, its rules page, its family's card and every list that names
 * it. Run on purpose with `pnpm screenshots:houseki`, which cuts the thumbnails
 * and writes the stamp after it; not part of the ordinary suite, because it writes
 * files into the repo.
 *
 * A level as it opens (see `LEVEL_OF`), on the plain wood every board has: the
 * same picture every time the board's drawing changes, and the stamp says it must
 * be re-taken. The board is centred on a plain ground in a 712 pixel square, the
 * size every other game's picture is, whatever shape the board is.
 */
const OUT = "public/art/games";
/** The level pictured for each: one with a board worth looking at, from the first third of its campaign. */
const LEVEL_OF = { fallingTriplets: 7, colourChains: 4, stoneCollapse: 9, gemSwap: 3, magneticBlocks: 6 } as const;

test.skip(process.env.GAME_SCREENSHOTS !== "1", "run on purpose with pnpm screenshots:houseki");

test.use({ viewport: { width: 712, height: 712 }, deviceScaleFactor: 1, colorScheme: "light" });

for (const kind of HOUSEKI_KIND_LIST) {
  test(`${kind} has a picture`, async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await page.goto(housekiPlayPath(kind, housekiQuery({ kind: "level", campaign: "classic", number: LEVEL_OF[kind] })));
    await ready(page, "houseki-game");
    const well = page.locator('[data-testid="houseki-well"]');
    await expect(well).toBeVisible();
    // Only the board, centred on a plain ground: the page round it is not the picture.
    await page.evaluate(() => {
      const board = document.querySelector<HTMLElement>('[data-testid="houseki-well"]')!;
      const cols = Number(board.dataset.cols);
      const units = Number(board.dataset.rows) + Number(board.dataset.hidden ?? 0) * 0.42;
      const cover = document.createElement("div");
      cover.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#fffef9;padding:30px";
      // As large as the square allows, whatever the board's shape, and not larger than a cell of 80 pixels.
      board.style.cssText = `width:${Math.min(80 * cols, (712 - 90) * (cols / units))}px;max-width:none`;
      cover.append(board);
      document.body.append(cover);
      // The dev server's own badge is not part of the picture.
      for (const badge of document.querySelectorAll("nextjs-portal")) badge.remove();
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${kind}.jpg`, type: "jpeg", quality: 82 });
  });
}
