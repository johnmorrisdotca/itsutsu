import { mkdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { CASUAL_KIND_LIST } from "../src/lib/casual/casual.constants";
import { casualPlayPath, slugFor } from "../src/lib/gomoku/slugs";
import { ready } from "./support";

/**
 * One screenshot per casual game, into public/art/games/ — the picture on the
 * game's front door, its rules page, its family's card and every list that
 * names it. Run on purpose with `pnpm screenshots:casual`, which cuts the
 * thumbnails and writes the stamp after it; not part of the ordinary suite,
 * because it writes files into the repo.
 *
 * The third level of each (see `LEVEL_OF`), as it opens: the same picture every time the
 * board's drawing changes and the stamp says it must be re-taken. The board is
 * centred on its own floor colour in a 712 pixel square, the size every
 * other game's picture is, whatever shape the board is.
 */
const OUT = "public/art/games";
/** The level pictured: the third, except where an earlier one is nearly empty. */
const LEVEL_OF: Partial<Record<(typeof CASUAL_KIND_LIST)[number], number>> = { saveTheCharacter: 5, stretchGrabber: 4 };

test.skip(process.env.GAME_SCREENSHOTS !== "1", "run on purpose with pnpm screenshots:casual");

test.use({ viewport: { width: 712, height: 712 }, deviceScaleFactor: 1 });

for (const kind of CASUAL_KIND_LIST) {
  test(`${kind} has a picture`, async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await page.goto(casualPlayPath(kind, LEVEL_OF[kind] ?? 3));
    await ready(page, "casual-game");
    const board = page.locator('[data-testid="casual-board"][data-ready="true"]');
    await expect(board.locator("canvas")).toBeVisible();
    // Only the board, centred on its own floor: the page round it is not the picture.
    await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>('[data-testid="casual-board"]')!;
      const floor = getComputedStyle(host.querySelector(".karakuri")!).getPropertyValue("--kk-board");
      const cover = document.createElement("div");
      cover.style.cssText = `position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:${floor}`;
      cover.style.padding = "24px";
      host.style.width = "100%";
      cover.append(host);
      document.body.append(cover);
      // The dev server's own badge is not part of the picture.
      for (const badge of document.querySelectorAll("nextjs-portal")) badge.remove();
    });
    await page.waitForTimeout(400);
    expect(slugFor(kind).length).toBeGreaterThan(0);
    await page.screenshot({ path: `${OUT}/${kind}.jpg`, type: "jpeg", quality: 82 });
  });
}
