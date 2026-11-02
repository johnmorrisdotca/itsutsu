import { mkdirSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { HOUSEKI_KIND_LIST, HOUSEKI_SPECS } from "../src/lib/houseki/houseki.constants";
import type { HousekiKind } from "../src/lib/houseki/houseki.types";
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
 *
 * THREE ARE A GAME UNDER WAY INSTEAD (`UNDER_WAY`), because the level as it opens
 * showed nothing worth looking at. Tsumiki's opens with four stones on an empty
 * board, and the two games whose pieces fall open with their first piece still in
 * the rows above the well, drawn squashed and cut by its top edge. So these play a
 * free game first: shapes set down on Tsumiki's board, and pieces dropped into the
 * well, then the game paused with the piece in the air wholly inside the well.
 */
const OUT = "public/art/games";
/** The level pictured for each: one with a board worth looking at, from the first third of its campaign. */
const LEVEL_OF = { fallingTriplets: 7, colourChains: 4, stoneCollapse: 9, gemSwap: 3, magneticBlocks: 6, tsumiki: 6 } as const;

/** The games pictured part way through a free game, and how many pieces are set down first. */
const UNDER_WAY = { fallingTriplets: 8, colourChains: 8, tsumiki: 9 } as const satisfies Partial<Record<HousekiKind, number>>;

/** Sideways steps from where a piece appears, for each piece in turn, so the drops spread across the well. */
const SPREAD = [-2, 2, -1, 1, 0, 3, -3, 2, -2, 1];

/** Presses the falling games' keys: each piece is moved over, turned and dropped, and the next waited for. */
async function dropPieces(page: Page, count: number) {
  const done = () => page.locator('[data-testid="houseki-falling"]').getAttribute("data-progress").then(Number);
  for (let piece = 0; piece < count; piece += 1) {
    const before = await done();
    await expect(page.locator('[data-role="active"]').first()).toBeVisible();
    const shift = SPREAD[piece % SPREAD.length]!;
    for (let step = 0; step < Math.abs(shift); step += 1) await page.keyboard.press(shift < 0 ? "ArrowLeft" : "ArrowRight");
    if (piece % 3 === 1) await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Space");
    await expect.poll(done, { timeout: 8000 }).toBeGreaterThan(before);
  }
}

/** Waits until the piece in the air is wholly inside the well's rows (it is born in the hidden ones, where it is squashed and cut), then pauses. */
async function pauseWithPieceShowing(page: Page) {
  const well = page.locator('[data-testid="houseki-well"]');
  await expect
    .poll(
      async () => {
        const board = await well.boundingBox();
        const hidden = Number(await well.getAttribute("data-hidden")) * 0.42;
        const rows = Number(await well.getAttribute("data-rows")) + hidden;
        const edge = board!.y + (hidden / rows) * board!.height;
        const tops = await page.locator('[data-role="active"]').evaluateAll((gems) => gems.map((gem) => gem.getBoundingClientRect().top));
        return tops.length > 0 && Math.min(...tops) > edge + 4;
      },
      { timeout: 10_000, intervals: [25] },
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("houseki-status")).toHaveText("Paused");
}

/** Tsumiki: shapes from the tray set down one after another, a square each, keeping the two columns on the right clear so no line is ever made and cleared away. */
async function setDownShapes(page: Page, count: number) {
  const moves = () => page.locator('[data-testid="houseki-full"]').getAttribute("data-progress").then(Number);
  const board = page.locator('[data-testid="houseki-well"] [role="group"]');
  for (let placed = 0; placed < count; placed += 1) {
    const before = await moves();
    search: for (let row = 0; row < 8; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        for (const slot of [0, 1, 2]) {
          const shape = page.locator(`[data-testid="tsumiki-slot"][data-slot="${slot}"]`);
          if (!(await shape.isEnabled())) continue;
          await shape.click();
          const box = (await board.boundingBox())!;
          await page.mouse.click(box.x + ((column + 0.5) / 8) * box.width, box.y + ((row + 0.5) / 8) * box.height);
          if ((await moves()) > before) break search;
        }
      }
    }
    expect(await moves(), `a shape could not be set down for piece ${placed + 1}`).toBeGreaterThan(before);
  }
}

test.skip(process.env.GAME_SCREENSHOTS !== "1", "run on purpose with pnpm screenshots:houseki");

test.use({ viewport: { width: 712, height: 712 }, deviceScaleFactor: 1, colorScheme: "light" });

for (const kind of HOUSEKI_KIND_LIST) {
  test(`${kind} has a picture`, async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    const underWay = kind in UNDER_WAY ? UNDER_WAY[kind as keyof typeof UNDER_WAY] : null;
    // A game under way is a free game, which has no goal to be won half way through.
    const asked = underWay === null ? housekiQuery({ kind: "level", campaign: "classic", number: LEVEL_OF[kind] }) : housekiQuery({ kind: "free", size: HOUSEKI_SPECS[kind].sizes[0]!.id, colours: 5, arcade: kind !== "tsumiki" });
    await page.goto(housekiPlayPath(kind, asked));
    await ready(page, "houseki-game");
    const well = page.locator('[data-testid="houseki-well"]');
    await expect(well).toBeVisible();
    if (underWay !== null) {
      if (kind === "tsumiki") await setDownShapes(page, underWay);
      else {
        await dropPieces(page, underWay);
        await pauseWithPieceShowing(page);
      }
    }
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
