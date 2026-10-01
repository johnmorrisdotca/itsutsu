import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import type { BridgesBoard } from "../src/lib/puzzles/bridges/bridges.types";
import { boardOf, decodeBridges } from "../src/lib/puzzles/bridges/code";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * BRIDGES 橋: islands on a grid, joined by straight bridges, one or two between
 * a pair, never crossing, until every island has its number and all are one.
 *
 * Every bridge here is laid as a reader lays one — a tap on an island and a
 * tap on its partner, or a drag from one to the other — from the answer the
 * spec makes out of the same seed the page uses. The first Logic puzzle, so
 * its new family is visited too: its page, its tile on the set-up screen, and
 * its place on the list of every game.
 */
const KIND = "bridges";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;

type Laid = { board: BridgesBoard; answer: number[] };

function answerOf(size: number, level: "easy" | "medium" | "hard", seed: number): Laid {
  const puzzle = generatePuzzle(KIND, size, level, seed);
  const board = boardOf(puzzle.givens, size)!;
  return { board, answer: decodeBridges(board, puzzle.solution)! };
}

/** One bridge by tapping: the span's first island, then its other. */
async function tapBridge(page: Page, { board }: Laid, span: number) {
  const islands = page.getByTestId("bridges-island");
  await islands.nth(board.spans[span]!.a).click();
  await expect(islands.nth(board.spans[span]!.a)).toHaveAttribute("data-chosen", "true");
  await islands.nth(board.spans[span]!.b).click();
}

/** One bridge by dragging, a finger's way: pressed on one island, moved across the water, lifted on the other. */
async function dragBridge(page: Page, { board }: Laid, span: number) {
  const islands = page.getByTestId("bridges-island");
  // The whole board on the screen first, as a player would have it before reaching across it.
  await page.getByTestId("bridges-board").scrollIntoViewIfNeeded();
  const from = (await islands.nth(board.spans[span]!.a).boundingBox())!;
  const to = (await islands.nth(board.spans[span]!.b).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 });
  // Held, the bridge it would lay is drawn dashed, aimed at the island the finger went toward.
  await expect(page.getByTestId("bridges-board")).toHaveAttribute("data-aim", String(span));
  await page.mouse.up();
}

function bridgeOn(page: Page, span: number) {
  return page.locator(`[data-testid="bridges-bridge"][data-span="${span}"]`);
}

/** A seed whose 7×7 easy answer has a bridge that a span it leaves empty would cross: the crossing to refuse. */
function crossingSeed(): { seed: number; laid: Laid; drawn: number; empty: number } {
  for (let seed = 1; ; seed += 1) {
    const laid = answerOf(7, "easy", seed);
    for (const [drawn, count] of laid.answer.entries()) {
      if (count === 0) continue;
      const empty = laid.board.crossing[drawn]!.find((other) => laid.answer[other] === 0);
      if (empty !== undefined) return { seed, laid, drawn, empty };
    }
  }
}

test.describe("Bridges, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, under our own name, in the Logic puzzles family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("island-and-bridge puzzle");
    await expect(page.getByTestId("game-family")).toContainText("Logic puzzles");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.locator("main")).toContainText("never across another bridge");
    // Nikoli's own name for the puzzle is never used here, on the rules or anywhere a reader sees.
    await expect(page.locator("main")).not.toContainText(/hashiwokakero/i);
  });
});

test.describe("the Bridges puzzle", () => {
  test("set up at 7×7 easy and solved by tapping, full islands marked as they fill", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="7"]').click();
    await page.getByTestId("puzzle-level-easy").click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", "7");
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/size=7/);
    await expect(page).toHaveURL(/seed=\d+/);
    await ready(page, "puzzle-play");
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const laid = answerOf(7, "easy", seed);
    const islands = page.getByTestId("bridges-island");
    await expect(islands).toHaveCount(laid.board.islands.length);
    await expect(page.locator('[data-testid="bridges-island"][data-state="full"]')).toHaveCount(0);

    // A second tap on the island chosen lets it go.
    await islands.first().click();
    await expect(islands.first()).toHaveAttribute("data-chosen", "true");
    await islands.first().click();
    await expect(islands.first()).not.toHaveAttribute("data-chosen", "true");

    const spans = laid.answer.flatMap((count, span) => (count > 0 ? [span] : []));
    const last = spans.at(-1)!;
    for (const span of spans) {
      if (span === last) continue;
      for (let bridge = 0; bridge < laid.answer[span]!; bridge += 1) await tapBridge(page, laid, span);
      await expect(bridgeOn(page, span)).toHaveAttribute("data-count", String(laid.answer[span]));
    }
    // Every island but the last bridge's two is full: filled, and ticked as well, so colour is never the only sign.
    const lastEnds = [laid.board.spans[last]!.a, laid.board.spans[last]!.b];
    const fullNow = laid.board.islands.length - lastEnds.length;
    await expect(page.locator('[data-testid="bridges-island"][data-state="full"]')).toHaveCount(fullNow);
    await expect(page.getByTestId("bridges-tick")).toHaveCount(fullNow);
    for (const end of lastEnds) await expect(islands.nth(end)).toHaveAttribute("data-state", "open");

    for (let bridge = 0; bridge < laid.answer[last]!; bridge += 1) await tapBridge(page, laid, last);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);

    // Kept and scored: its own page draws it solved, and the fastest table has it.
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", /replay|finished/);
    await page.goto(AT);
    await expect(page.getByTestId("puzzle-fastest-rank").first()).toBeVisible();
    await expect(page.getByTestId("puzzle-points")).toContainText("each end of every bridge");
  });

  test("solved by dragging, and a bridge across another is refused and said", async ({ page }) => {
    const { seed, laid, drawn, empty } = crossingSeed();
    await page.goto(`${AT}/play?size=7&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");

    // A bridge the answer does not have, then the answer's bridge across it: refused, and the line under the board says why.
    await dragBridge(page, laid, empty);
    await expect(bridgeOn(page, empty)).toHaveAttribute("data-count", "1");
    await dragBridge(page, laid, drawn);
    await expect(page.getByTestId("bridges-said")).toHaveAttribute("data-said", "crossing");
    await expect(bridgeOn(page, drawn)).toHaveCount(0);
    // Twice more takes the wrong one away: a second bridge, then none.
    await dragBridge(page, laid, empty);
    await expect(bridgeOn(page, empty)).toHaveAttribute("data-count", "2");
    await dragBridge(page, laid, empty);
    await expect(bridgeOn(page, empty)).toHaveCount(0);

    for (const [span, count] of laid.answer.entries()) {
      for (let bridge = 0; bridge < count; bridge += 1) {
        if (await page.getByTestId("puzzle-done").isVisible()) break;
        await dragBridge(page, laid, span);
      }
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("left half way, it waits in My games and opens where it was left", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const laid = answerOf(9, "medium", seed);
    const span = laid.answer.findIndex((count) => count > 0);
    await page.goto(`${AT}/play?size=9&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    await dragBridge(page, laid, span);
    await expect(bridgeOn(page, span)).toHaveAttribute("data-count", "1");
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"][data-seed="${seed}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-pausable")).toHaveAttribute("data-paused", "false");
    await expect(bridgeOn(page, span)).toHaveAttribute("data-count", "1");
  });

  test("played on the Rabbit, the minute counts down from the first bridge", async ({ page }) => {
    await page.clock.install();
    await page.goto(`${AT}/new?size=7&level=easy`);
    await ready(page, "puzzle-set-up");
    const rabbit = page.getByTestId("puzzle-clock-rabbit");
    await rabbit.click();
    await expect(rabbit).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/clock=rabbit/);
    await ready(page, "puzzle-play");
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const laid = answerOf(7, "easy", seed);
    const clock = page.getByTestId("puzzle-clock");
    await expect(clock).toHaveAttribute("data-clock", "rabbit");
    await expect(clock).toHaveText("1:00");
    await tapBridge(page, laid, laid.answer.findIndex((count) => count > 0));
    await page.clock.runFor("00:20");
    await expect(clock).toHaveText(/^0:4\d$/);
  });

  test("its family has a page, a tile on the set-up screen, and a place on the list of every game", async ({ page }) => {
    await page.goto(`${AT}/family`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Logic puzzles");
    await expect(page.locator('[data-testid="family-mark"][data-family="Logic puzzles"]').first()).toBeVisible();
    await expect(page.getByTestId("family-games")).toContainText(NAME);

    await page.goto("/games/new");
    await ready(page, "set-up-game");
    const logic = page.getByTestId("set-up-family").filter({ hasText: "Logic puzzles" });
    await logic.click();
    await expect(logic).toHaveAttribute("data-open", "true");
    // Bridges first, then Picture logic (2026-09-29), Suido, Hidden Stones and Black and White (2026-10-01): the shelf opens on its first.
    await expect(page.getByTestId("set-up-puzzle")).toHaveCount(5);
    await expect(page.getByTestId("set-up-puzzle").first()).toHaveAttribute("data-kind", KIND);
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-kind", KIND);

    await page.goto("/games");
    await expect(page.locator("main")).toContainText("Logic puzzles");
  });

  test("a 13×13 on a phone fits the screen, zooms, and fits back", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${AT}/play?size=13&level=hard&seed=5`);
    await ready(page, "puzzle-play");
    const view = page.getByTestId("bridges-viewport");
    await expect(view).toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("bridges-arrows").click();
    await page.getByTestId("bridges-pad-in").click();
    await expect(view).not.toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("bridges-fit").click();
    await expect(view).toHaveAttribute("data-zoom", "1.00");
    // Put the arrows away again: this browser remembers them for every board.
    await page.getByTestId("bridges-arrows").click();
    const wide = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(wide).toBeLessThanOrEqual(390);
  });
});
