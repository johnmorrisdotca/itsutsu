import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { decodeMoves, replayFreeCell } from "../src/lib/puzzles/freecell/code";
import type { FreeCellMove, FreeCellTable } from "../src/lib/puzzles/freecell/freecell.types";
import { freeCellFinishingMoves } from "../src/lib/puzzles/freecell/intent";
import { columnAt, freeCellWon, isColumnPile } from "../src/lib/puzzles/freecell/rules";
import { freshPuzzleSeed, ready } from "./support";

/**
 * FREECELL フリーセル: every card face up, four free cells, the second
 * patience game of the Cards family.
 *
 * A game is played here as a reader plays it — a tap on a card and a tap
 * where it goes, a drag of a run from column to column, a double tap to send a
 * card home — following the winning line the spec works out from the same
 * seed the page deals, until the game brings the rest home by itself.
 */
const KIND = "freecell";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;

/** A pile's own buttons, the empty place first and then its cards, bottom up. */
function pileButtons(page: Page, pile: string) {
  return page.locator(`[data-card-pile="${pile}"][role="group"] > button`);
}

/** The card a move takes hold of: a cell's card, or the foot of the run it carries in a column. */
function fromButton(page: Page, table: FreeCellTable, move: FreeCellMove) {
  if (isColumnPile(move.from)) {
    const at = table.tableau[columnAt(move.from)].length - move.count;
    return page.locator(`[data-card-pile="${move.from}"][role="group"] > button[data-card-index="${at}"]`);
  }
  return pileButtons(page, move.from).last();
}

/** Play one move as a person would: the card tapped (on its top strip, where a card under others is still seen), then where it goes. */
async function tapMove(page: Page, table: FreeCellTable, move: FreeCellMove) {
  await fromButton(page, table, move).click({ position: { x: 12, y: 8 } });
  await pileButtons(page, move.to).last().click();
}

/** Drag a run from where it is onto a pile, pressed, moved and let go a finger's way. */
async function dragMove(page: Page, table: FreeCellTable, move: FreeCellMove) {
  const from = (await fromButton(page, table, move).boundingBox())!;
  const to = (await pileButtons(page, move.to).last().boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + Math.min(10, from.height / 4));
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await expect(page.getByTestId("card-drag-ghost")).toBeVisible();
  await page.mouse.up();
}

/** Wait for the address to name the seed on the table: a seed names the first deal from it the solver wins (`PuzzlePlay`). */
async function settled(page: Page) {
  await ready(page, "puzzle-play");
  const seed = await page.getByTestId("puzzle-play").getAttribute("data-seed");
  await expect(page).toHaveURL(new RegExp(`seed=${seed}(&|$)`));
}

async function movesOnPage(page: Page): Promise<string> {
  return (await page.getByTestId("puzzle-play").getAttribute("data-moves")) ?? "";
}

test.describe("FreeCell, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, in the Cards family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("game-family")).toContainText("Cards");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.locator("main")).toContainText("free cell");
  });
});

test.describe("the FreeCell game", () => {
  test("set up with four cells, and won by tapping, dragging and a double tap, the rest going home by itself", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="4"]').click();
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/size=4/);
    await settled(page);
    await expect(page.getByTestId("freecell-table")).toHaveAttribute("data-cells", "4");

    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const puzzle = generatePuzzle(KIND, 4, "medium", seed);
    let dragged = 0;
    let doubled = 0;
    for (const move of decodeMoves(puzzle.solution)!) {
      const played = await movesOnPage(page);
      const table = replayFreeCell(puzzle.givens, 4, played)!.at(-1)!;
      // Once every card left can go home in turn, the game plays itself out: the rest is its own.
      if (freeCellWon(table) || freeCellFinishingMoves(table) !== null) break;
      if (dragged < 2 && isColumnPile(move.from) && isColumnPile(move.to) && table.tableau[columnAt(move.to)].length > 0) {
        await dragMove(page, table, move);
        dragged += 1;
      } else if (doubled < 1 && "SHDC".includes(move.to) && isColumnPile(move.from)) {
        await fromButton(page, table, move).dblclick();
        doubled += 1;
      } else {
        await tapMove(page, table, move);
      }
      await expect.poll(async () => (await movesOnPage(page)).length).toBeGreaterThan(played.length);
    }
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-won", "true", { timeout: 30_000 });
    await expect(page.getByTestId("puzzle-won")).toContainText("Won");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    expect(dragged + doubled).toBeGreaterThan(0);

    // Kept: its own page plays it back from the deal.
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", "replay");
    await expect(page.getByTestId("patience-replay-at")).toContainText("Move");
  });

  test("a card goes into a free cell and back, and Undo takes a move back", async ({ page }) => {
    await page.goto(`${AT}/play?size=2&level=medium&seed=${freshPuzzleSeed()}`);
    await settled(page);
    await expect(page.getByTestId("freecell-table")).toHaveAttribute("data-cells", "2");
    await expect(pileButtons(page, "c")).toHaveCount(0);
    await expect(page.getByTestId("patience-move-count")).toHaveText("0 moves");
    await pileButtons(page, "1").last().click();
    await pileButtons(page, "a").last().click();
    await expect(page.getByTestId("patience-move-count")).toHaveText("1 move");
    await expect(pileButtons(page, "a")).toHaveCount(2);
    await page.getByTestId("patience-undo").click();
    await expect(page.getByTestId("patience-move-count")).toHaveText("0 moves");
    await expect(pileButtons(page, "a")).toHaveCount(1);
  });

  test("left half way, it waits in My games and opens where it was left", async ({ page }) => {
    await page.goto(`${AT}/play?size=4&level=medium&seed=${freshPuzzleSeed()}`);
    await settled(page);
    const dealt = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    await pileButtons(page, "1").last().click();
    await pileButtons(page, "a").last().click();
    await expect(page.getByTestId("patience-move-count")).toHaveText("1 move");
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"][data-seed="${dealt}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("patience-move-count")).toHaveText("1 move");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-moves", "1a");
  });

  test("giving up keeps the game as it stood", async ({ page }) => {
    await page.goto(`${AT}/play?size=3&level=medium&seed=${freshPuzzleSeed()}`);
    await settled(page);
    await pileButtons(page, "2").last().click();
    await pileButtons(page, "b").last().click();
    await page.getByTestId("patience-give-up").click();
    await expect(page.getByTestId("puzzle-given-up")).toContainText("Given up");
  });

  test("on a phone the table fits the screen, its cards wide enough to read", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${AT}/play?size=4&level=medium&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const card = (await pileButtons(page, "1").last().boundingBox())!;
    expect(card.width).toBeGreaterThan(35);
  });
});
