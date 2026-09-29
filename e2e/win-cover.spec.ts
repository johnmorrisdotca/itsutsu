import { expect, test, type Locator, type Page } from "@playwright/test";

import { CARD_TABLE_KEYS } from "../src/components/party/cards/cardTable.constants";
import { DOTS_STORAGE_KEY } from "../src/components/party/party.constants";
import { rankOf } from "../src/lib/cardGames/cards";
import { playCrazyEights, startCrazyEights, EIGHT } from "../src/lib/cardGames/crazyEights/crazyEights";
import { crazyEightsComputer } from "../src/lib/cardGames/crazyEights/crazyEightsComputer";
import { encodeCrazyEights } from "../src/lib/cardGames/crazyEights/crazyEightsRules";
import type { CrazyEightsGame, CrazyEightsMove } from "../src/lib/cardGames/crazyEights/crazyEights.types";
import { PARTY_SLUGS, PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { dotsLineCount, drawLine, encodeDots, startDots } from "../src/lib/party/dotsAndBoxes/dotsAndBoxes";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, playSequence, ready } from "./support";

/**
 * THE WIN, OVER THE BOARD IT WAS WON ON. John, 2026-09-29, at a won Solitaire
 * whose only sign of the win was a panel beside the board: "If you win the
 * game, there should be a Modal like we see in Pause or whatever, that
 * indicates you win." Then, at a solved Tsunagi: "we should 'flash' the
 * screen or something, to indicate the win."
 *
 * So each case wins one kind of game the way a player does — a puzzle filled
 * in, a card game's last card played, a party table's last line drawn, a
 * practice board's last stone — and sees the two beats: the board flashes
 * (`data-win-flash="on"`), then the cover comes up over the board and nothing
 * else, with the right words. See the board closes it; the panel beside the
 * board is still there to press; and the finished page opened again does not
 * say it twice.
 *
 * The card game and the party table are set out one move from their end, in
 * this browser's own keeping, by the same rules the page plays them with, so
 * the case is about the win and not about forty moves before it.
 */

/**
 * Watches for the flash before the winning move is made. It lasts under a
 * second, so asking for it afterwards would be a race with the clock; the
 * page is asked to remember whether it ever drew one, and in what order.
 */
async function watchForFlash(page: Page) {
  await page.evaluate(() => {
    const seen: string[] = [];
    (window as unknown as { winBeats: string[] }).winBeats = seen;
    new MutationObserver(() => {
      const layer = document.querySelector('[data-testid="win-cover-layer"]');
      const beat = layer?.getAttribute("data-win-flash") ?? null;
      if (beat !== null && seen.at(-1) !== beat) seen.push(beat);
      // And what the flash is drawn with, the moment it is drawn: a glow, or for less motion a fade.
      const glow = document.querySelector(".win-flash");
      if (glow !== null) (window as unknown as { winGlow: string }).winGlow = getComputedStyle(glow).animationName;
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-win-flash"] });
  });
}

/** The flash, then the cover over `board`, saying `headline`. */
async function coverComesUp(page: Page, board: Locator, headline: RegExp) {
  const layer = page.getByTestId("win-cover-layer");
  const cover = page.getByTestId("win-cover");
  await expect(cover).toBeVisible();
  // Two beats, in order: the board flashed, and then the card came up.
  expect(await page.evaluate(() => (window as unknown as { winBeats?: string[] }).winBeats ?? [])).toEqual(["on", "done"]);
  await expect(layer).toHaveAttribute("data-win-flash", "done");
  await expect(page.getByTestId("win-cover-headline")).toHaveText(headline);
  await expect(page.getByTestId("win-cover-mark")).toBeVisible();
  // Over the board and nothing else: the layer covers exactly the board's box.
  const over = await layer.boundingBox();
  const under = await board.boundingBox();
  expect(over).not.toBeNull();
  expect(under).not.toBeNull();
  expect(Math.abs(over!.x - under!.x)).toBeLessThan(2);
  expect(Math.abs(over!.y - under!.y)).toBeLessThan(2);
  expect(Math.abs(over!.width - under!.width)).toBeLessThan(2);
  expect(over!.height).toBeGreaterThanOrEqual(under!.height - 2);
}

/** See the board: the cover goes, the board is there. */
async function seeTheBoard(page: Page) {
  await page.getByTestId("win-cover-see-board").click();
  await expect(page.getByTestId("win-cover")).toHaveCount(0);
  await expect(page.getByTestId("win-cover-layer")).toHaveCount(0);
}

/** Fills a small Number Place right, as a person taps it in. */
async function solveNumberPlace(page: Page) {
  const seed = freshPuzzleSeed();
  const puzzle = generateNumberPlace(4, "easy", seed);
  const givens = decodeCells(puzzle.givens, 4)!;
  const solution = decodeCells(puzzle.solution, 4)!;
  await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=4&level=easy&seed=${seed}`);
  await ready(page, "puzzle-play");
  const cells = page.getByTestId("puzzle-cell");
  await watchForFlash(page);
  for (const [index, given] of givens.entries()) {
    if (given !== 0) continue;
    await cells.nth(index).click();
    await page.getByTestId(`puzzle-key-${solution[index]}`).click();
  }
}

test.describe("the win's cover", () => {
  test("a puzzle solved: the flash, then Solved over the grid, with the XP and Another", async ({ page }) => {
    await solveNumberPlace(page);
    const board = page.getByTestId("puzzle-pausable");
    await coverComesUp(page, board, /^Solved 解決 in \d+:\d\d$/);
    await expect(page.getByTestId("win-cover")).toHaveAttribute("data-tone", "won");
    await expect(page.getByTestId("win-cover-mark")).toHaveText("解");
    // The operator has an account, so the XP line fills in place once the solve is recorded — or stays empty if it was paid before.
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid/);
    const paid = await page.getByTestId("puzzle-paid").textContent();
    if (paid?.includes("+")) await expect(page.getByTestId("win-cover-xp")).toContainText(/^\+\d+ XP, for /);
    // The strongest next step is the panel's own first: another of the same.
    await expect(page.getByTestId("win-cover-next")).toHaveText(`Another ${PUZZLE_DISPLAY.numberPlace.label} →`);

    // The panel beside the board is there and pressable while the cover is up, and after.
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await page.getByTestId("puzzle-set-up").click({ trial: true });
    await seeTheBoard(page);
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-done", "true");
    await page.getByTestId("puzzle-another").click({ trial: true });

    // The finished page opened again says nothing over the board.
    await page.reload();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-grid")).toBeVisible();
    await expect(page.getByTestId("win-cover-layer")).toHaveCount(0);
  });

  test("Escape closes it, and so does a press on the board around the card", async ({ page }) => {
    await solveNumberPlace(page);
    await expect(page.getByTestId("win-cover")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("win-cover")).toHaveCount(0);

    await solveNumberPlace(page);
    await expect(page.getByTestId("win-cover")).toBeVisible();
    // The layer's lower corner: on the board, outside the card.
    const layer = await page.getByTestId("win-cover-layer").boundingBox();
    await page.mouse.click(layer!.x + 6, layer!.y + layer!.height - 6);
    await expect(page.getByTestId("win-cover")).toHaveCount(0);
  });

  test("a reader who asks for less motion sees no flash: a calm fade, then the cover", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await solveNumberPlace(page);
    await expect(page.getByTestId("win-cover")).toBeVisible();
    // The beat still comes first — as a fade, never the glow.
    expect(await page.evaluate(() => (window as unknown as { winGlow?: string }).winGlow)).toBe("win-fade-in");
    expect(await page.evaluate(() => (window as unknown as { winBeats?: string[] }).winBeats ?? [])).toEqual(["on", "done"]);
  });

  test("a card game won against a computer: You win, over the table, with Play again", async ({ page }) => {
    // A deal whose last move is the person's, and wins: found by playing every seat as the computer plays it.
    let before: CrazyEightsGame | null = null;
    let last: CrazyEightsMove | null = null;
    for (let seed = 1; seed < 400 && before === null; seed += 1) {
      let game = startCrazyEights(50, ["Aiko", "Computer 2"], undefined, seed, [false, true])!;
      let previous = game;
      let move: CrazyEightsMove | null = null;
      while (game.phase !== "over") {
        previous = game;
        move = crazyEightsComputer(game);
        game = playCrazyEights(game, move)!;
      }
      const won = game.scores[0]! > game.scores[1]!;
      if (won && previous.toPlay === 0 && move !== null && "play" in move && rankOf(move.play) !== EIGHT) {
        before = previous;
        last = move;
      }
    }
    expect(before, "no deal ends on the person's winning card").not.toBeNull();
    const card = (last as { play: string }).play;

    await page.goto(`/games/${PARTY_SLUGS.crazyEights}/pass-and-play`);
    await page.evaluate(([key, text]) => window.localStorage.setItem(key!, text!), [CARD_TABLE_KEYS.crazyEights, encodeCrazyEights(before!)]);
    await page.reload();
    await ready(page, "cards-game");
    await expect(page.getByTestId("cards-game")).toHaveAttribute("data-state", "playing");

    await watchForFlash(page);
    const index = before!.hands[0]!.indexOf(card);
    await page.locator(`[data-card-pile="hand"] button[data-card-index="${index}"]`).click({ position: { x: 8, y: 12 } });
    await page.getByTestId("cards-play").click();
    await expect(page.getByTestId("cards-game")).toHaveAttribute("data-state", "finished");

    await coverComesUp(page, page.getByTestId("win-cover-over"), /^You win 勝ち$/);
    await expect(page.getByTestId("win-cover-next")).toHaveText("Play again, same table");
    await page.getByTestId("cards-new").click({ trial: true });
    await seeTheBoard(page);
    await expect(page.getByTestId("cards-again")).toBeVisible();

    await page.reload();
    await ready(page, "cards-game");
    await expect(page.getByTestId("cards-game")).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("win-cover-layer")).toHaveCount(0);
  });

  test("a party table's last box: the winner named, over the board, with Play again", async ({ page }) => {
    // Two at one device, every line but the last drawn in order.
    let game = startDots(3, ["Aiko", "Ben"])!;
    const lines = dotsLineCount(3);
    for (let line = 0; line < lines - 1; line += 1) game = drawLine(game, line)!;
    const finished = drawLine(game, lines - 1)!;
    const names = ["Aiko", "Ben"];
    const headline =
      finished.winners.length === 1 ? new RegExp(`^${names[finished.winners[0]!]} wins 勝ち$`) : /^Aiko and Ben share the win 勝ち$/;

    await page.goto(`/games/${PARTY_SLUGS.dotsAndBoxes}/pass-and-play`);
    await page.evaluate(([key, text]) => window.localStorage.setItem(key!, text!), [DOTS_STORAGE_KEY, encodeDots(game)]);
    await page.reload();
    await ready(page, "dots-game");
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-state", "playing");
    await watchForFlash(page);
    await page.locator(`[data-testid="dots-line"][data-line="${lines - 1}"]`).click();
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-state", "finished");

    await coverComesUp(page, page.getByTestId("win-cover-over"), headline);
    // Several people at one device: the winner is named, never "you".
    await expect(page.getByTestId("win-cover")).toHaveAttribute("data-tone", "decided");
    await expect(page.getByTestId("win-cover-next")).toHaveText("Play again, same table");
    await expect(page.getByTestId("dots-winner")).toBeVisible();
    await page.getByTestId("dots-again").click({ trial: true });
    await seeTheBoard(page);

    await page.reload();
    await ready(page, "dots-game");
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("win-cover-layer")).toHaveCount(0);

    // And its next step is the table's own: the same table again, the cover gone with the old game.
    await page.goto(`/games/${PARTY_SLUGS.dotsAndBoxes}/pass-and-play`);
    await page.evaluate(([key, text]) => window.localStorage.setItem(key!, text!), [DOTS_STORAGE_KEY, encodeDots(game)]);
    await page.reload();
    await ready(page, "dots-game");
    await page.locator(`[data-testid="dots-line"][data-line="${lines - 1}"]`).click();
    await page.getByTestId("win-cover-next").click();
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-state", "playing");
    await expect(page.getByTestId("win-cover-layer")).toHaveCount(0);
  });

  test("a practice board won: the winner named over the board, New game, and no second word on a reload", async ({ page }) => {
    await page.goto("/games/tic-tac-toe/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/tic-tac-toe/play");
    await ready(page, "game-view");
    await watchForFlash(page);
    await playSequence(page, 3, [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]]);
    await expect(page.getByTestId("to-play")).toContainText("wins");

    await coverComesUp(page, page.getByTestId("win-cover-over"), /^Player 1 wins 勝ち$/);
    await expect(page.getByTestId("win-cover-detail")).toContainText("Black");
    await expect(page.getByTestId("win-cover-next")).toHaveText("New game");
    await seeTheBoard(page);
    await expect(page.getByTestId("to-play")).toContainText("wins");

    // The game was filed as it was played; its page opened again announces nothing — neither this cover nor the result card.
    await page.reload();
    await expect(page.locator('[data-testid="game-view"], [data-testid="game-replay"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /A1/ }).first()).toBeVisible();
    await expect(page.getByTestId("win-cover-layer")).toHaveCount(0);
    await expect(page.getByTestId("result-card")).toHaveCount(0);
  });
});
