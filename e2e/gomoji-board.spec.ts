import { expect, test } from "@playwright/test";

import { FELTS } from "../src/components/board/Board.constants";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { freshPuzzleSeed, ready } from "./support";

/**
 * TWO THINGS JOHN ASKED FOR ON A GOMOJI BOARD, 2026-09-25, BESIDE A REAL
 * GOMOKU BOARD: the same board colour picker Reversi and Gomoku boards have,
 * and, in the Gomoku style, the dark star-point dots and the dark play-area
 * border those boards draw. See `GomojiGrid.tsx`.
 */
test("a Gomoji board offers the board colour picker, and its Gomoku style marks the play area's corners and border", async ({ page }) => {
  const seed = freshPuzzleSeed();
  await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/play?size=5&level=easy&seed=${seed}`);
  await ready(page, "puzzle-play");

  // Neither the board's letters nor the keys can be selected as text (John, 2026-09-26).
  await expect(page.getByTestId("puzzle-grid")).toHaveCSS("user-select", "none");
  await expect(page.getByTestId("word-keyboard")).toHaveCSS("user-select", "none");

  // Every style offers the same picker Reversi and Gomoku boards do.
  const patches = page.getByTestId("felt-patches");
  await expect(patches).toBeVisible();
  await expect(page.getByTestId("felt-green")).toBeVisible();

  await page.getByTestId("word-style-gomoku").click();
  await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-style", "gomoku");

  // The Gomoku style's own extras: four star points at the play area's corners, and its own dark border.
  const border = page.getByTestId("word-play-border");
  await expect(border).toHaveCount(1);
  await expect(page.getByTestId("word-star-point")).toHaveCount(4);

  // Reversi and Tiles have no star points, only Gomoku does.
  await page.getByTestId("word-style-reversi").click();
  await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-style", "reversi");
  await expect(page.getByTestId("word-play-border")).toHaveCount(1);
  await expect(page.getByTestId("word-star-point")).toHaveCount(0);

  await page.getByTestId("word-style-tiles").click();
  await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-style", "tiles");
  await expect(page.getByTestId("word-play-border")).toHaveCount(1);
  await expect(page.getByTestId("word-star-point")).toHaveCount(0);

  // Choosing a felt colour redraws the border and, in the Gomoku style, the star points in it.
  await page.getByTestId("word-style-gomoku").click();
  const kept = page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");
  await page.getByTestId("felt-green").click();
  expect((await kept).ok()).toBe(true);
  await expect(border).toHaveAttribute("stroke", FELTS.green.line);
  await expect(page.getByTestId("word-star-point").first()).toHaveAttribute("fill", FELTS.green.star);
});

/**
 * AND BOTH ARE CHOSEN AT SET-UP. John, 2026-09-26: "Why is the preview board
 * not red??? where is the Reversi / Gomoku / Tiles options in our Options…?
 * also board isn't red when playing either." The colour and the style picked
 * on the set-up screen draw the preview at once and open the game in them.
 */
test("the colour and the style chosen at set-up draw the preview and open the game in them", async ({ page }) => {
  await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/new`);
  await ready(page, "puzzle-set-up");
  const preview = page.getByTestId("set-up-puzzle-preview");

  const colour = page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");
  await preview.getByTestId("felt-red").click();
  expect((await colour).ok()).toBe(true);
  await expect(preview.getByTestId("word-play-border")).toHaveAttribute("stroke", FELTS.red.line);

  const style = page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");
  await page.getByTestId("puzzle-word-style-tiles").click();
  expect((await style).ok()).toBe(true);
  await expect(preview.getByTestId("puzzle-grid")).toHaveAttribute("data-style", "tiles");

  await page.getByTestId("puzzle-play-buttons").getByRole("link").first().click();
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-style", "tiles");
  await expect(page.getByTestId("word-play-border")).toHaveAttribute("stroke", FELTS.red.line);

  // And back, so the suite's operator is left drawing Reversi as it was.
  const back = page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");
  await page.getByTestId("word-style-reversi").click();
  expect((await back).ok()).toBe(true);
});

/**
 * THE BORDER SURROUNDS THE PLAY AREA IN EVERY STYLE. John, 2026-09-26,
 * CRITICAL, on Gomoji Kana in Tiles: the border started at the board's left
 * edge and cut through the tiles, because the tiles stand centred and the
 * border did not. Measured on the page, not read off the numbers that drew it.
 */
test("the play area's border stands around the tiles and stones in every style, at every length", async ({ page }) => {
  for (const [slug, size] of [[PUZZLE_SLUGS.gomojiKana, 4], [PUZZLE_SLUGS.gomojiKana, 5], [PUZZLE_SLUGS.gomoji, 5]] as const) {
    await page.goto(`/games/${slug}/play?size=${size}&level=easy&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    for (const style of ["tiles", "reversi", "gomoku"] as const) {
      await page.getByTestId(`word-style-${style}`).click();
      await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-style", style);
      const border = (await page.getByTestId("word-play-border").boundingBox())!;
      const tiles = page.getByTestId("word-tile");
      const first = (await tiles.first().boundingBox())!;
      const last = (await tiles.last().boundingBox())!;
      const middle = (first.x + last.x + last.width) / 2;
      expect(Math.abs(border.x + border.width / 2 - middle), `${slug} ${size} ${style}: the border's middle is the tiles' middle`).toBeLessThan(2);
      // Gomoku's runs along its outer lines, through the stones' middles, as a Gomoku board's does; the others go round the outside.
      if (style === "gomoku") continue;
      expect(border.x, `${slug} ${size} ${style}: the border starts no further right than the first tile`).toBeLessThanOrEqual(first.x + 1);
      expect(border.x + border.width, `${slug} ${size} ${style}: the border ends no further left than the last tile`).toBeGreaterThanOrEqual(last.x + last.width - 1);
    }
  }
  await page.getByTestId("word-style-reversi").click();
});
