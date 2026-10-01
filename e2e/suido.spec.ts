import { expect, test, type Page } from "@playwright/test";
import { decodeLayout, flowOf, hintFor, newGame, quartersBetween, shapeOf, turn, turnAt, type Game } from "@johnmorrisdotca/suido";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { suidoKindOfSeed } from "../src/lib/puzzles/suido/seed";
import { freshPuzzleSeed, ready } from "./support";

/**
 * SUIDO 水道: a square of pipe pieces that can only be turned, a pump, and
 * water that runs through every opening that meets another. Done when it
 * reaches what the kind asks and nothing leaks.
 *
 * Every piece here is turned as a reader turns one — a click on it, or the
 * keys — from the answer the spec makes out of the same seed the page uses
 * (`generatePuzzle`, which is the package's own board), and the water the page
 * draws is held to the water the package says the pieces make (`flowOf`):
 * after every turn, as many cells wet as there should be.
 */
const KIND = "suido";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;

type Played = { dealt: Game; answer: number[] };

function playedOf(size: number, level: "easy" | "medium" | "hard", seed: number): Played {
  const puzzle = generatePuzzle(KIND, size, level, seed);
  return { dealt: newGame(puzzle.givens)!, answer: decodeLayout(puzzle.solution)!.cells };
}

/** The pieces to turn, in the order the water needs them (nearest the pump first), each with the clockwise turns it takes. */
function turnsToSolve({ dealt, answer }: Played): { cell: number; turns: number; after: Game }[] {
  const steps: { cell: number; turns: number; after: Game }[] = [];
  let game = dealt;
  for (;;) {
    const cell = hintFor(game, answer);
    if (cell === null) return steps;
    const turns = quartersBetween(game.masks[cell]!, answer[cell]!)!;
    for (let each = 0; each < turns; each += 1) game = turnAt(game, cell);
    steps.push({ cell, turns, after: game });
  }
}

function pieces(page: Page) {
  return page.getByTestId("suido-cell");
}
const wet = (page: Page) => page.locator('[data-testid="suido-cell"][data-wet="true"]');

/** How many cells the package says are wet when the pieces face as `game` has them. */
function wetCount(game: Game): number {
  return flowOf(game.start, game.masks).wet.filter(Boolean).length;
}

test.describe("Suido, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, under our own name, in the Logic puzzles family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("pipe-turning puzzle");
    await expect(page.getByTestId("game-family")).toContainText("Logic puzzles");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.locator("main")).toContainText("A drip shows where");
    // The names of the falling-pipes video games are other games: never used here.
    await expect(page.locator("main")).not.toContainText(/pipe mania|pipe dream|plumber/i);
  });
});

test.describe("the Suido puzzle", () => {
  test("set up at 5×5 as a network, then solved by turning pieces, the water reaching further with each", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="5"]').click();
    await page.getByTestId("puzzle-level-easy").click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", "5");
    // Drains is the usual kind and leaves the address alone; Network says so, until a seed is drawn.
    await expect(page.getByTestId("suido-kind-drains")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-solve")).not.toHaveAttribute("href", /pipes=/);
    await page.getByTestId("suido-kind-network").click();
    await expect(page.getByTestId("suido-kind-network")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /pipes=network/);
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/size=5/);
    await expect(page).toHaveURL(/seed=\d+/);
    await ready(page, "puzzle-play");
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    // The seed says it is a network from now on, and the address no longer needs to.
    expect(suidoKindOfSeed(seed)).toBe("network");
    await expect(page).not.toHaveURL(/pipes=/);

    const played = playedOf(5, "easy", seed);
    await expect(pieces(page)).toHaveCount(25);
    // A network has a piece in every cell, and the board as dealt has the water where the package says.
    await expect(wet(page)).toHaveCount(wetCount(played.dealt));
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", /^5x5:/);
    await expect(page.getByTestId("suido-said")).toContainText("Tap a piece");

    const steps = turnsToSolve(played);
    expect(steps.length).toBeGreaterThan(0);
    for (const [at, step] of steps.entries()) {
      for (let each = 0; each < step.turns; each += 1) await pieces(page).nth(step.cell).click();
      await expect(pieces(page).nth(step.cell)).toHaveAttribute("data-mask", String(played.answer[step.cell]));
      // The water the page draws is the water the pieces make.
      await expect(wet(page)).toHaveCount(wetCount(step.after));
      if (at === 0) await expect(page.getByTestId("suido-said")).toContainText("pieces wet");
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
    // Every piece wet, and nothing left to turn once it is done.
    await expect(wet(page)).toHaveCount(25);
    const before = await pieces(page).first().getAttribute("data-mask");
    await pieces(page).first().click({ force: true });
    await expect(pieces(page).first()).toHaveAttribute("data-mask", before!);

    // Kept and scored: its own page draws it solved, and the fastest table has it.
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("solve-board").locator('[data-testid="suido-cell"][data-wet="true"]')).toHaveCount(25);
    await page.goto(AT);
    await expect(page.getByTestId("puzzle-fastest-rank").first()).toBeVisible();
    await expect(page.getByTestId("puzzle-points")).toContainText("every piece of pipe");
  });

  test("a drains board is solved the same way, and its spare pieces may be left as they were", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const played = playedOf(7, "medium", seed);
    expect(suidoKindOfSeed(seed)).toBe("drains");
    await page.goto(`${AT}/play?size=7&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", /^7x7d:/);
    for (const step of turnsToSolve(played)) {
      for (let each = 0; each < step.turns; each += 1) await pieces(page).nth(step.cell).click();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
  });

  test("a piece turns clockwise by default and the other way when chosen, by Shift or by a right click", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const { dealt } = playedOf(7, "medium", seed);
    // A piece that looks different turned (an end, an elbow or a T), and not in the last column, so an arrow key has somewhere to go.
    const cell = dealt.masks.findIndex((mask, at) => ["end", "elbow", "tee"].includes(shapeOf(mask)) && at % 7 !== 6);
    expect(cell).toBeGreaterThanOrEqual(0);
    const start = dealt.masks[cell]!;
    await page.goto(`${AT}/play?size=7&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    const piece = pieces(page).nth(cell);
    await expect(piece).toHaveAttribute("data-mask", String(start));

    await piece.click();
    await expect(piece).toHaveAttribute("data-mask", String(turn(start, 1)));
    await page.getByTestId("suido-way-anticlockwise").click();
    await expect(page.getByTestId("suido-way-anticlockwise")).toHaveAttribute("aria-checked", "true");
    await piece.click();
    await expect(piece).toHaveAttribute("data-mask", String(start));
    // The way chosen, Shift turns it the other way again; and a right click always turns it back.
    await piece.click({ modifiers: ["Shift"] });
    await expect(piece).toHaveAttribute("data-mask", String(turn(start, 1)));
    await page.getByTestId("suido-way-clockwise").click();
    await piece.click({ button: "right" });
    await expect(piece).toHaveAttribute("data-mask", String(start));
    // And the keys: the arrows move one piece at a time, Enter turns it, Shift with Enter turns it back.
    await piece.focus();
    await page.keyboard.press("Enter");
    await expect(piece).toHaveAttribute("data-mask", String(turn(start, 1)));
    await page.keyboard.press("Shift+Enter");
    await expect(piece).toHaveAttribute("data-mask", String(start));
    await page.keyboard.press("ArrowRight");
    await expect(pieces(page).nth(cell + 1)).toBeFocused();
  });

  test("left half way, it waits in My games and opens where it was left", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const played = playedOf(9, "medium", seed);
    const [first] = turnsToSolve(played);
    await page.goto(`${AT}/play?size=9&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    for (let each = 0; each < first!.turns; each += 1) await pieces(page).nth(first!.cell).click();
    await expect(pieces(page).nth(first!.cell)).toHaveAttribute("data-mask", String(played.answer[first!.cell]));
    const code = await page.getByTestId("puzzle-play").getAttribute("data-code");
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
    // The board as it was left, piece for piece, and the water in it.
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", code!);
    await expect(pieces(page).nth(first!.cell)).toHaveAttribute("data-mask", String(played.answer[first!.cell]));
    await expect(wet(page)).toHaveCount(wetCount(first!.after));
  });

  test("with hints chosen, Hint turns the next piece to face the way the answer has it, and lights it", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const played = playedOf(7, "easy", seed);
    const [first] = turnsToSolve(played);
    await page.goto(`${AT}/play?size=7&level=easy&seed=${seed}&hints=1`);
    await ready(page, "puzzle-play");
    const hint = page.getByTestId("puzzle-hint");
    await expect(hint).toHaveAttribute("data-allowed", "true");
    await hint.click();
    await expect(hint).toContainText("1 used");
    await expect(pieces(page).nth(first!.cell)).toHaveAttribute("data-mask", String(played.answer[first!.cell]));
    await expect(pieces(page).nth(first!.cell)).toHaveAttribute("data-hint", "true");
    await expect(wet(page)).toHaveCount(wetCount(first!.after));
    // Lit until the next turn.
    const other = pieces(page).nth((first!.cell + 1) % 49);
    await other.click({ force: true });
    await expect(pieces(page).nth(first!.cell)).not.toHaveAttribute("data-hint", "true");
  });

  test("just the board: the pieces, the water and a few buttons in a modal, and Esc leaves", async ({ page }) => {
    await page.goto(`${AT}/play?size=7&level=easy&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    await ready(page, "bare-board");
    await page.getByTestId("bare-board-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
    await expect(pieces(page)).toHaveCount(49);
    await expect(pieces(page).first()).toBeVisible();
    // Still played in the modal.
    const target = pieces(page).nth(24);
    const before = Number(await target.getAttribute("data-mask"));
    await target.click({ force: true });
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", /.+/);
    expect([before, turn(before, 1)]).toContain(Number(await target.getAttribute("data-mask")));
    await page.keyboard.press("Escape");
    await expect(page.locator("html")).not.toHaveAttribute("data-bare", "true");
  });

  test("a 12×12 on a phone fits the screen, zooms, and fits back", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${AT}/play?size=12&level=hard&seed=5`);
    await ready(page, "puzzle-play");
    const view = page.getByTestId("suido-viewport");
    await expect(view).toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("suido-arrows").click();
    await page.getByTestId("suido-pad-in").click();
    await expect(view).not.toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("suido-fit").click();
    await expect(view).toHaveAttribute("data-zoom", "1.00");
    // Put the arrows away again: this browser remembers them for every board.
    await page.getByTestId("suido-arrows").click();
    const wide = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(wide).toBeLessThanOrEqual(390);
  });

  test("played on the Rabbit, the minute counts down from the first turn", async ({ page }) => {
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
    const [first] = turnsToSolve(playedOf(7, "easy", seed));
    const clock = page.getByTestId("puzzle-clock");
    await expect(clock).toHaveAttribute("data-clock", "rabbit");
    await expect(clock).toHaveText("1:00");
    await pieces(page).nth(first!.cell).click();
    await page.clock.runFor("00:20");
    await expect(clock).toHaveText(/^0:4\d$/);
  });

  test("run out on the Rabbit, it ends unsolved with the board as it stood, and its page draws that board", async ({ page }) => {
    await page.clock.install();
    const seed = freshPuzzleSeed();
    const [first] = turnsToSolve(playedOf(7, "easy", seed));
    await page.goto(`${AT}/play?size=7&level=easy&seed=${seed}&clock=rabbit`);
    await ready(page, "puzzle-play");
    await pieces(page).nth(first!.cell).click();
    const code = await page.getByTestId("puzzle-play").getAttribute("data-code");
    await page.clock.runFor("01:01");
    await expect(page.getByTestId("puzzle-out-of-time")).toContainText("Out of time");
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-outcome")).toHaveText("Out of time");
    // The board as it stood when the minute ran out, not the answer and not the board as dealt.
    const board = page.getByTestId("solve-board");
    await expect(board).toHaveAttribute("data-state", "unsolved");
    const masks = await board.getByTestId("suido-cell").evaluateAll((all) => all.map((cell) => cell.getAttribute("data-mask")));
    expect(masks.length).toBe(49);
    expect(decodeLayout(code!)!.cells.map(String)).toEqual(masks);
  });

  test("its family has a page, and the set-up screen shows it beside Bridges and Picture logic", async ({ page }) => {
    await page.goto(`${AT}/family`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Logic puzzles");
    await expect(page.getByTestId("family-games")).toContainText(NAME);
    await page.goto("/games/new");
    await ready(page, "set-up-game");
    const logic = page.getByTestId("set-up-family").filter({ hasText: "Logic puzzles" });
    await logic.click();
    await expect(logic).toHaveAttribute("data-open", "true");
    const tile = page.locator(`[data-testid="set-up-puzzle"][data-kind="${KIND}"]`);
    await expect(tile).toHaveCount(1);
    await tile.click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-kind", KIND);
    // The preview is a live board of the size chosen.
    await expect(page.getByTestId("set-up-puzzle-preview").getByTestId("suido-cell")).toHaveCount(49);
  });
});
