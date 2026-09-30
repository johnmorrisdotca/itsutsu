import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { decodeMoves, replaySpider, spiderFinishingMoves, spiderWon } from "@johnmorrisdotca/toranpu/spider";
import type { SpiderMove, SpiderTable } from "@johnmorrisdotca/toranpu/spider";
import { freshPuzzleSeed, ready } from "./support";

/**
 * SPIDER スパイダー: two decks, ten columns, eight runs of one suit to make,
 * the third patience game of the Cards family.
 *
 * A game is played here as a reader plays it — a tap on the stock to deal, a
 * tap on a card and a tap on the column it goes on, a drag of a run — following
 * the winning line the spec works out from the same seed the page deals, until
 * every card shows and the game puts the rest in order by itself.
 */
const KIND = "spider";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;

/** A pile's own buttons, the empty place first and then its cards, bottom up. */
function pileButtons(page: Page, pile: string) {
  return page.locator(`[data-card-pile="${pile}"][role="group"] > button`);
}

/** The card a carry takes hold of: the foot of the run it carries. */
function fromButton(page: Page, table: SpiderTable, move: SpiderMove & { kind: "carry" }) {
  const at = table.tableau[move.from].cards.length - move.count;
  return page.locator(`[data-card-pile="${move.from}"][role="group"] > button[data-card-index="${at}"]`);
}

/** Play one move as a person would: the stock tapped, or a card tapped on its top strip and then the column it goes on. */
async function tapMove(page: Page, table: SpiderTable, move: SpiderMove) {
  if (move.kind === "deal") {
    await pileButtons(page, "s").last().click();
    return;
  }
  await fromButton(page, table, move).click({ position: { x: 10, y: 6 } });
  await pileButtons(page, String(move.to)).last().click();
}

async function dragMove(page: Page, table: SpiderTable, move: SpiderMove & { kind: "carry" }) {
  const from = (await fromButton(page, table, move).boundingBox())!;
  const to = (await pileButtons(page, String(move.to)).last().boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + Math.min(8, from.height / 4));
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

test.describe("Spider, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, in the Cards family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("game-family")).toContainText("Cards");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.locator("main")).toContainText("King down to Ace");
  });
});

test.describe("the Spider game", () => {
  test("set up with one suit, and won by dealing, tapping and dragging, the rest put in order by itself", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="1"]').click();
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/size=1/);
    await settled(page);
    await expect(page.getByTestId("spider-table")).toHaveAttribute("data-deals", "5");

    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const puzzle = generatePuzzle(KIND, 1, "medium", seed);
    let dragged = 0;
    for (const move of decodeMoves(puzzle.solution)!) {
      const played = await movesOnPage(page);
      const table = replaySpider(puzzle.givens, 1, played)!.at(-1)!;
      // Once every card is dealt and shows and the game finds its way to the end, it plays itself out: the rest is its own.
      if (spiderWon(table) || spiderFinishingMoves(table) !== null) break;
      if (move.kind === "carry" && dragged < 2 && table.tableau[move.to].cards.length > 0) {
        await dragMove(page, table, move);
        dragged += 1;
      } else {
        await tapMove(page, table, move);
      }
      await expect.poll(async () => (await movesOnPage(page)).length).toBeGreaterThan(played.length);
    }
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-won", "true", { timeout: 60_000 });
    await expect(page.getByTestId("spider-table")).toHaveAttribute("data-runs", "8");
    await expect(page.getByTestId("puzzle-won")).toContainText("Won");
    expect(dragged).toBeGreaterThan(0);

    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", "replay");
    await expect(page.getByTestId("patience-replay-at")).toContainText("Move");
  });

  test("the stock deals a card onto every column, and Undo takes the deal back", async ({ page }) => {
    await page.goto(`${AT}/play?size=4&level=medium&seed=${freshPuzzleSeed()}`);
    await settled(page);
    await expect(page.getByTestId("spider-table")).toHaveAttribute("data-deals", "5");
    await expect(pileButtons(page, "9")).toHaveCount(6);
    await pileButtons(page, "s").last().click();
    await expect(page.getByTestId("spider-table")).toHaveAttribute("data-deals", "4");
    await expect(pileButtons(page, "9")).toHaveCount(7);
    await expect(page.getByTestId("patience-extra")).toContainText("4 deals left");
    await page.getByTestId("patience-undo").click();
    await expect(page.getByTestId("spider-table")).toHaveAttribute("data-deals", "5");
    await expect(page.getByTestId("patience-move-count")).toHaveText("0 moves");
  });

  test("left half way, it waits in My games and opens where it was left", async ({ page }) => {
    await page.goto(`${AT}/play?size=2&level=medium&seed=${freshPuzzleSeed()}`);
    await settled(page);
    const dealt = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    await pileButtons(page, "s").last().click();
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
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-moves", "d");
  });

  test("on a phone the table fits the screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${AT}/play?size=1&level=medium&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const card = (await pileButtons(page, "0").last().boundingBox())!;
    expect(card.width).toBeGreaterThan(28);
  });
});
