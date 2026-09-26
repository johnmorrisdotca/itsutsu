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
