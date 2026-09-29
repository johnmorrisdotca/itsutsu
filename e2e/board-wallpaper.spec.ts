import { expect, test, type Page } from "@playwright/test";

import { CARD_TABLE_KEYS } from "../src/components/party/cards/cardTable.constants";
import { DOTS_STORAGE_KEY } from "../src/components/party/party.constants";
import { playCrazyEights, startCrazyEights } from "../src/lib/cardGames/crazyEights/crazyEights";
import { crazyEightsComputer } from "../src/lib/cardGames/crazyEights/crazyEightsComputer";
import { encodeCrazyEights } from "../src/lib/cardGames/crazyEights/crazyEightsRules";
import { PARTY_SLUGS, PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { dotsLineCount, drawLine, encodeDots, startDots } from "../src/lib/party/dotsAndBoxes/dotsAndBoxes";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * EVERY GAME'S WALLPAPER, NOT ONLY A BOARD GAME'S. John, 2026-09-29, on a
 * finished Solitaire: "where is the option to see the Desktop / Mobile image
 * of the game?"
 *
 * A board game draws every position from its moves (`game-mosaic.spec.ts`).
 * Every other game offers its finished board, taken from the page as it is
 * drawn, through the same window and the same two shapes: here a puzzle, a
 * card game and a party table are each finished, the press beside the way on
 * opens the window, the picture is drawn in both shapes and downloads as a
 * PNG, and the picture really has the board in it — not a blank frame.
 */

/** The press, the window, the picture in both shapes, and a PNG to keep. */
async function wallpaperOf(page: Page, name: RegExp) {
  await page.getByTestId("win-cover-see-board").click();
  await page.getByTestId("open-board-wallpaper").click();
  const dialog = page.getByTestId("mosaic-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("mosaic-game-name")).toHaveText(name);
  await expect(dialog.getByTestId("board-wallpaper")).toHaveAttribute("data-state", "ready", { timeout: 20_000 });
  const picture = dialog.getByTestId("mosaic-picture");
  await expect(picture).toBeVisible({ timeout: 20_000 });
  expect(await picture.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  // The board is in it: the middle of the picture is not the dark ground the frame is painted on.
  const middle = await picture.evaluate(async (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(img, 0, 0);
    const [r, g, b] = context.getImageData(Math.floor(img.naturalWidth / 2), Math.floor(img.naturalHeight * 0.55), 1, 1).data;
    return r! + g! + b!;
  });
  expect(middle, "the middle of the picture is the empty ground: the board was not drawn").toBeGreaterThan(3 * 0x40);

  await dialog.getByTestId("mosaic-shape-portrait").check();
  await expect(picture).toHaveAttribute("data-shape", "portrait");
  await dialog.getByTestId("mosaic-shape-landscape").check();
  await expect(picture).toHaveAttribute("data-shape", "landscape");
  const download = page.waitForEvent("download");
  await dialog.getByTestId("download-mosaic").click();
  expect((await download).suggestedFilename()).toMatch(/^itsutsu-.+\.png$/);
  await dialog.getByTestId("close-mosaic").click();
  await expect(dialog).toHaveCount(0);
}

test.describe("a finished game's wallpaper", () => {
  test("a puzzle: the finished grid, in both shapes, to keep", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generateNumberPlace(4, "easy", seed);
    const givens = decodeCells(puzzle.givens, 4)!;
    const solution = decodeCells(puzzle.solution, 4)!;
    await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=4&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    const cells = page.getByTestId("puzzle-cell");
    for (const [index, given] of givens.entries()) {
      if (given !== 0) continue;
      await cells.nth(index).click();
      await page.getByTestId(`puzzle-key-${solution[index]}`).click();
    }
    await expect(page.getByTestId("puzzle-done")).toBeVisible();
    await wallpaperOf(page, new RegExp(`^${PUZZLE_DISPLAY.numberPlace.label}$`));
  });

  test("a card game: the table as it ended", async ({ page }) => {
    let game = startCrazyEights(50, ["Aiko", "Computer 2"], undefined, 7, [false, true])!;
    let before = game;
    while (game.phase !== "over") {
      before = game;
      game = playCrazyEights(game, crazyEightsComputer(game))!;
    }
    // One move from the end, and that move a computer's or the person's: either way the page watches it finish.
    await page.goto(`/games/${PARTY_SLUGS.crazyEights}/pass-and-play`);
    await page.evaluate(([key, text]) => window.localStorage.setItem(key!, text!), [CARD_TABLE_KEYS.crazyEights, encodeCrazyEights(before)]);
    await page.reload();
    await ready(page, "cards-game");
    if (before.toPlay === 0) {
      const move = crazyEightsComputer(before);
      if ("play" in move) {
        const index = before.hands[0]!.indexOf(move.play);
        await page.locator(`[data-card-pile="hand"] button[data-card-index="${index}"]`).click({ position: { x: 8, y: 12 } });
        await page.getByTestId(move.suit === undefined ? "cards-play" : `cards-call-${move.suit}`).click();
      } else {
        await page.getByTestId("draw" in move ? "cards-draw" : "cards-pass").click();
      }
    }
    await expect(page.getByTestId("cards-game")).toHaveAttribute("data-state", "finished", { timeout: 20_000 });
    await wallpaperOf(page, /^Crazy Eights$/);
  });

  test("a party table: the last box drawn, on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let game = startDots(3, ["Aiko", "Ben"])!;
    const lines = dotsLineCount(3);
    for (let line = 0; line < lines - 1; line += 1) game = drawLine(game, line)!;
    await page.goto(`/games/${PARTY_SLUGS.dotsAndBoxes}/pass-and-play`);
    await page.evaluate(([key, text]) => window.localStorage.setItem(key!, text!), [DOTS_STORAGE_KEY, encodeDots(game)]);
    await page.reload();
    await ready(page, "dots-game");
    await page.locator(`[data-testid="dots-line"][data-line="${lines - 1}"]`).click();
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-state", "finished");
    // A fingertip's press on a phone, as every control is.
    const press = page.getByTestId("open-board-wallpaper");
    expect((await press.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await wallpaperOf(page, /^Dots and Boxes$/);
  });
});
