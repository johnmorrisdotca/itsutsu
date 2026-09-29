import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { decodeMoves, replay } from "../src/lib/puzzles/solitaire/code";
import { solitaireRules } from "../src/lib/puzzles/solitaire/generate";
import { allFaceUp, carriedFrom, columnAt, isColumnPile, klondikeWon } from "../src/lib/puzzles/solitaire/klondike";
import type { KlondikeMove, KlondikeTable } from "../src/lib/puzzles/solitaire/solitaire.types";
import { freshPuzzleSeed, ready } from "./support";

/**
 * SOLITAIRE ソリティア: Klondike with the site's own deck, the first game of the
 * Cards family.
 *
 * A game is played here as a reader plays it — a tap on the stock to turn it,
 * a tap on a card and a tap where it goes, a drag of a run from column to
 * column, a double tap to send a card home — following the winning line the
 * spec works out from the same seed the page deals, until the game brings the
 * rest home by itself.
 */
const KIND = "solitaire";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;

/** A pile's own buttons, the empty place first and then its cards, bottom up. */
function pileButtons(page: Page, pile: string) {
  return page.locator(`[data-card-pile="${pile}"][role="group"] > button`);
}

/** The card a move takes hold of: the waste's or a foundation's top, or the run's foot in a column. */
function fromButton(page: Page, table: KlondikeTable, move: KlondikeMove & { kind: "carry" }) {
  if (isColumnPile(move.from)) {
    const at = carriedFrom(table, columnAt(move.from), move.to)!;
    return page.locator(`[data-card-pile="${move.from}"][role="group"] > button[data-card-index="${at}"]`);
  }
  return pileButtons(page, move.from).last();
}

/** Play one move as a person would: the stock tapped, or a card tapped and then where it goes (its top card, or its empty place). */
async function tapMove(page: Page, table: KlondikeTable, move: KlondikeMove) {
  if (move.kind !== "carry") {
    await pileButtons(page, "s").last().click();
    return;
  }
  // On its top strip, where a card under others is still seen: its middle is under the cards on it.
  await fromButton(page, table, move).click({ position: { x: 12, y: 8 } });
  await pileButtons(page, move.to).last().click();
}

/** Drag a card (and whatever is on it) from where it is onto a pile, pressed, moved and let go a finger's way. */
async function dragMove(page: Page, table: KlondikeTable, move: KlondikeMove & { kind: "carry" }) {
  const from = (await fromButton(page, table, move).boundingBox())!;
  const to = (await pileButtons(page, move.to).last().boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + Math.min(12, from.height / 4));
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await expect(page.getByTestId("card-drag-ghost")).toBeVisible();
  await page.mouse.up();
}

async function movesOnPage(page: Page): Promise<string> {
  return (await page.getByTestId("puzzle-play").getAttribute("data-moves")) ?? "";
}

test.describe("Solitaire, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, as Klondike, in the Cards family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("Klondike");
    await expect(page.getByTestId("game-family")).toContainText("Cards");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.locator("main")).toContainText("alternating colours");
  });
});

test.describe("the Solitaire game", () => {
  test("set up turning one card, and won by tapping, dragging and a double tap, the rest going home by itself", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="1"]').click();
    await page.getByTestId("puzzle-level-easy").click();
    await expect(page.getByTestId("solitaire-deal-winnable")).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/size=1/);
    await expect(page).toHaveURL(/seed=\d+/);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("solitaire-table")).toHaveAttribute("data-draw", "1");

    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const puzzle = generatePuzzle(KIND, 1, "easy", seed);
    const rules = solitaireRules(1, "easy");
    const line = decodeMoves(puzzle.solution)!;
    let dragged = 0;
    let doubled = 0;
    for (const move of line) {
      const played = await movesOnPage(page);
      const table = replay(puzzle.givens, rules, played)!.at(-1)!;
      // Once every card shows, the game plays itself out: the rest is its own.
      if (allFaceUp(table) || klondikeWon(table)) break;
      if (move.kind === "carry" && dragged < 2 && isColumnPile(move.from) && isColumnPile(move.to)) {
        await dragMove(page, table, move);
        dragged += 1;
      } else if (move.kind === "carry" && doubled < 1 && "SHDC".includes(move.to) && isColumnPile(move.from)) {
        await fromButton(page, table, move).dblclick();
        doubled += 1;
      } else {
        await tapMove(page, table, move);
      }
      // Each move lands before the next is read, or the next would be read off a table that is gone.
      await expect.poll(async () => (await movesOnPage(page)).length).toBeGreaterThan(played.length);
    }
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-won", "true", { timeout: 30_000 });
    await expect(page.getByTestId("puzzle-won")).toContainText("Won");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    expect(dragged + doubled).toBeGreaterThan(0);

    // Kept: its own page plays it back from the deal, and the front door's fastest table has it.
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", "replay");
    await expect(page.getByTestId("solitaire-replay-at")).toContainText("Move");
    await page.goto(AT);
    await expect(page.getByTestId("puzzle-fastest-rank").first()).toBeVisible();
  });

  test("a card let go where it cannot go stays, Undo takes a move back, and the stock turns", async ({ page }) => {
    await page.goto(`${AT}/play?size=3&level=medium&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("solitaire-table")).toHaveAttribute("data-draw", "3");
    await expect(page.getByTestId("solitaire-move-count")).toHaveText("0 moves");
    // Three cards turned, the top one playable.
    await pileButtons(page, "s").last().click();
    await expect(page.getByTestId("solitaire-move-count")).toHaveText("1 move");
    await expect(pileButtons(page, "w")).toHaveCount(4);
    await page.getByTestId("solitaire-undo").click();
    await expect(page.getByTestId("solitaire-move-count")).toHaveText("0 moves");
    await expect(pileButtons(page, "w")).toHaveCount(1);
    // A tap on a card picks it up, and a tap on it again puts it back.
    const top = pileButtons(page, "1").last();
    await top.click();
    await expect(top.locator("[data-card]")).toHaveClass(/ring-moss/);
    await page.waitForTimeout(400);
    await top.click();
    await expect(top.locator("[data-card]")).not.toHaveClass(/ring-moss/);
  });

  test("left half way, it waits in My games and opens where it was left", async ({ page }) => {
    const seed = freshPuzzleSeed();
    await page.goto(`${AT}/play?size=1&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    const dealt = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    await pileButtons(page, "s").last().click();
    await pileButtons(page, "s").last().click();
    await expect(page.getByTestId("solitaire-move-count")).toHaveText("2 moves");
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
    await expect(page.getByTestId("solitaire-move-count")).toHaveText("2 moves");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-moves", "dd");
  });

  test("any deal is dealt as it falls, and giving up keeps the game as it stood", async ({ page }) => {
    await page.goto(`${AT}/new?size=1&level=hard`);
    await ready(page, "puzzle-set-up");
    await page.getByTestId("solitaire-deal-any").click();
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/seed=\d+/);
    await ready(page, "puzzle-play");
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    expect(seed).toBeGreaterThanOrEqual(1_600_000_000);
    await pileButtons(page, "s").last().click();
    await page.getByTestId("solitaire-give-up").click();
    await expect(page.getByTestId("puzzle-given-up")).toContainText("Given up");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|ends unsolved/);
  });

  test("its family has a page, a tile on the set-up screen, and a place on the list of every game", async ({ page }) => {
    await page.goto(`${AT}/family`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Cards");
    await expect(page.locator('[data-testid="family-mark"][data-family="Cards"]').first()).toBeVisible();
    await expect(page.getByTestId("family-games")).toContainText(NAME);

    await page.goto("/games/new");
    await ready(page, "set-up-game");
    const cards = page.getByTestId("set-up-family").filter({ hasText: "Cards" });
    await cards.click();
    await expect(cards).toHaveAttribute("data-open", "true");
    await expect(page.getByTestId("set-up-puzzle").first()).toHaveAttribute("data-kind", KIND);
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-kind", KIND);

    await page.goto("/games");
    await expect(page.locator("main")).toContainText("Cards");
  });

  test("on a phone the table fits the screen, its cards wide enough to read", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${AT}/play?size=1&level=easy&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    const wide = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(wide).toBeLessThanOrEqual(390);
    // Seven columns across a phone: each card still wide enough for its corner to be read.
    const card = (await pileButtons(page, "1").last().boundingBox())!;
    expect(card.width).toBeGreaterThan(40);
  });
});
