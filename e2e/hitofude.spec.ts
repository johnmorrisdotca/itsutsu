import { expect, test, type Page } from "@playwright/test";

import { dailySeed } from "../src/lib/puzzles/daily";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { blankLine, decodeLine, decodeNumbers, encodeLine, neighbours } from "../src/lib/puzzles/hitofude/code";
import { nextNumberOf } from "../src/lib/puzzles/hitofude/draw";
import type { Puzzle, PuzzleLevel } from "../src/lib/puzzles/puzzles.types";
import { freshPuzzleSeed, ready } from "./support";

/**
 * HITOFUDE 一筆: one line through every square, passing the numbers in order.
 * Drawn the way a reader draws it, with the mouse held down over the squares, a tap
 * beside the head, the buttons under the board, and the keys; the answer made out of
 * the same seed the page uses. Its own, as against every other grid: the line can only
 * go on from its head, a number out of its turn stops it, and it must fill every square.
 */
const AT = "/games/hitofude";

/** A fresh seed whose board has what a case needs: the rule under test is the point, so a board without it is passed over before the page opens, never skipped after. */
function seedWhere(size: number, level: PuzzleLevel, wanted: (puzzle: Puzzle) => boolean): number {
  const from = freshPuzzleSeed();
  for (let seed = from; seed < from + 400; seed += 1) if (wanted(generatePuzzle("hitofude", size, level, seed))) return seed;
  throw new Error("no board among four hundred has what this case needs");
}

async function openPlay(page: Page, size: number, level: PuzzleLevel, extra = "", wanted: (puzzle: Puzzle) => boolean = () => true) {
  const seed = seedWhere(size, level, wanted);
  await page.goto(`${AT}/play?size=${size}&level=${level}&seed=${seed}${extra}`);
  await ready(page, "puzzle-play");
  return generatePuzzle("hitofude", size, level, seed);
}

const codeOnPage = async (page: Page) => (await page.getByTestId("puzzle-play").getAttribute("data-code")) ?? "";

/** The middle of a square on the page. */
async function middleOf(page: Page, size: number, square: number) {
  const board = page.getByTestId("hitofude-board");
  await board.scrollIntoViewIfNeeded();
  const box = (await board.boundingBox())!;
  return { x: box.x + (((square % size) + 0.5) / size) * box.width, y: box.y + ((Math.floor(square / size) + 0.5) / size) * box.height };
}

async function tap(page: Page, size: number, square: number) {
  const at = await middleOf(page, size, square);
  await page.mouse.click(at.x, at.y);
}

/** Holds the mouse down at the first of these squares and draws through the rest. */
async function drag(page: Page, size: number, squares: readonly number[]) {
  const first = await middleOf(page, size, squares[0]!);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const square of squares.slice(1)) {
    const at = await middleOf(page, size, square);
    await page.mouse.move(at.x, at.y, { steps: 2 });
  }
  await page.mouse.up();
}

test.describe("Hitofude, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, it is at home in Pencil puzzles, and today's puzzle is one link away", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText("Hitofude");
    await expect(page.getByTestId("game-family")).toContainText("Pencil puzzles");
    await expect(page.getByTestId("game-daily")).toBeVisible();
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.locator("main")).toContainText("go through every square exactly once");
  });
});

test.describe("Hitofude", () => {
  test("set up, drawn by a held drag through every square, solved, scored and kept", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="5"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", "5");
    await expect(page.getByTestId("set-up-puzzle-preview").locator("svg")).toBeVisible();
    await page.getByTestId("puzzle-level-hard").click();
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/seed=\d+/);
    await ready(page, "puzzle-play");
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const puzzle = generatePuzzle("hitofude", 5, "hard", seed);
    // Nothing drawn yet: the line is the first number alone, and the clock has not started.
    expect(await codeOnPage(page)).toBe(blankLine(puzzle.givens, 5));
    await expect(page.getByTestId("puzzle-clock")).toHaveText("0:00");

    await drag(page, 5, decodeLine(puzzle.solution, 5)!);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    expect(await codeOnPage(page)).toBe(puzzle.solution);
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    // The server's check took it: its own page draws the finished line.
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", /replay|finished/);
    await expect(page.getByTestId("solve-board").getByTestId("hitofude-line")).toBeVisible();
  });

  test("the line goes on only from its head, a number out of its turn stops it, and a press on the line cuts it back", async ({ page }) => {
    const puzzle = await openPlay(page, 6, "easy");
    const numbers = decodeNumbers(puzzle.givens, 6)!;
    const answer = decodeLine(puzzle.solution, 6)!;
    const start = answer[0]!;

    // A square nowhere near the head: nothing happens, and the clock stays stopped.
    const far = answer.find((square) => !neighbours(start, 6).includes(square) && square !== start && numbers[square] === 0)!;
    await tap(page, 6, far);
    expect(await codeOnPage(page)).toBe(blankLine(puzzle.givens, 6));
    await expect(page.getByTestId("puzzle-clock")).toHaveText("0:00");

    // A tap beside the head takes a step; two more with a drag.
    await tap(page, 6, answer[1]!);
    await expect.poll(async () => decodeLine(await codeOnPage(page), 6)?.length).toBe(2);
    await drag(page, 6, answer.slice(1, 5));
    await expect.poll(async () => decodeLine(await codeOnPage(page), 6)?.length).toBe(5);

    // Every number that is not the next: the line will not step on it, wherever it lies beside the head.
    const line = decodeLine(await codeOnPage(page), 6)!;
    const next = nextNumberOf(line, numbers);
    const blocked = numbers.findIndex((number, square) => number > next && !line.includes(square));
    const before = await codeOnPage(page);
    await tap(page, 6, blocked);
    expect(await codeOnPage(page)).toBe(before);

    // Pressed on the line: cut back to there. Undo brings the cut part back, Restart clears it all.
    await tap(page, 6, answer[2]!);
    await expect.poll(async () => decodeLine(await codeOnPage(page), 6)?.length).toBe(3);
    await page.getByTestId("hitofude-undo").click();
    await expect.poll(() => codeOnPage(page)).toBe(before);
    await page.getByTestId("hitofude-restart").click();
    await expect.poll(() => codeOnPage(page)).toBe(blankLine(puzzle.givens, 6));
  });

  test("the arrow keys draw it, and back the way they came", async ({ page }) => {
    const puzzle = await openPlay(page, 5, "easy");
    const answer = decodeLine(puzzle.solution, 5)!;
    await page.getByTestId("hitofude-board").focus();
    const arrow = (from: number, to: number) => (to === from - 5 ? "ArrowUp" : to === from + 5 ? "ArrowDown" : to === from - 1 ? "ArrowLeft" : "ArrowRight");
    await page.keyboard.press(arrow(answer[0]!, answer[1]!));
    await expect.poll(async () => decodeLine(await codeOnPage(page), 5)?.length).toBe(2);
    await page.keyboard.press(arrow(answer[1]!, answer[0]!));
    await expect.poll(async () => decodeLine(await codeOnPage(page), 5)?.length).toBe(1);
  });

  test("Check counts what is off the answer, Show marks it, and Hint cuts back and gives one right step", async ({ page }) => {
    // A wrong step from the head, onto a blank square that is not the answer's next.
    const wrongStep = (puzzle: Puzzle) => {
      const answer = decodeLine(puzzle.solution, 6)!;
      const numbers = decodeNumbers(puzzle.givens, 6)!;
      return neighbours(answer[0]!, 6).find((square) => square !== answer[1] && numbers[square] === 0);
    };
    const puzzle = await openPlay(page, 6, "easy", "&hints=1", (each) => wrongStep(each) !== undefined);
    const answer = decodeLine(puzzle.solution, 6)!;
    const wrong = wrongStep(puzzle)!;
    await tap(page, 6, wrong);
    await expect.poll(async () => decodeLine(await codeOnPage(page), 6)?.length).toBe(2);
    await page.getByTestId("puzzle-check").click();
    await expect(page.getByTestId("puzzle-checked")).toContainText("1 square is wrong");
    await page.getByTestId("puzzle-show").click();
    await expect(page.locator(`[data-testid="hitofude-square"][data-square="${wrong}"]`)).toHaveAttribute("data-wrong", "true");
    await page.getByTestId("puzzle-hint").click();
    await expect.poll(() => codeOnPage(page)).toBe(encodeLine(answer.slice(0, 2), 6));
    await expect(page.getByTestId("puzzle-hint")).toContainText("1 used");
  });

  test("left half done it waits in My games and opens where it was left", async ({ page }) => {
    const puzzle = await openPlay(page, 6, "medium");
    const answer = decodeLine(puzzle.solution, 6)!;
    await drag(page, 6, answer.slice(0, 6));
    await expect.poll(async () => decodeLine(await codeOnPage(page), 6)?.length).toBe(6);
    const code = await codeOnPage(page);
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="hitofude"][data-seed="${puzzle.seed}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-pausable")).toHaveAttribute("data-paused", "false");
    expect(await codeOnPage(page)).toBe(code);
    // And it finishes from there.
    await drag(page, 6, answer.slice(5));
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("today's puzzle is one seed for everybody, at the usual size", async ({ page }) => {
    await page.goto(AT);
    await page.getByTestId("game-daily").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-seed", String(dailySeed(new Date())));
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-size", "6");
  });

  test("a line that reaches the last number too soon does not win, and the page says why", async ({ page }) => {
    // The answer's way up to three squares from its end, then straight to the last number, leaving two blank squares behind.
    const shortWay = (puzzle: Puzzle) => {
      const answer = decodeLine(puzzle.solution, 5)!;
      const numbers = decodeNumbers(puzzle.givens, 5)!;
      return neighbours(answer.at(-4)!, 5).includes(answer.at(-1)!) && numbers[answer.at(-2)!] === 0 && numbers[answer.at(-3)!] === 0;
    };
    const puzzle = await openPlay(page, 5, "easy", "", shortWay);
    const numbers = decodeNumbers(puzzle.givens, 5)!;
    const answer = decodeLine(puzzle.solution, 5)!;
    const last = Math.max(...numbers);
    const end = answer.at(-1)!;
    await drag(page, 5, [...answer.slice(0, -3), end]);
    await expect(page.getByTestId("hitofude-said")).toContainText("last number");
    await expect(page.getByTestId("puzzle-done")).toHaveCount(0);
    expect(numbers[end]).toBe(last);
  });
});

test.describe("Hitofude's family", () => {
  test("is on Pencil puzzles' page and its set-up shelf", async ({ page }) => {
    await page.goto("/games/hitofude/family");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pencil puzzles");
    await expect(page.getByTestId("family-games")).toContainText("Hitofude");
    await page.goto("/games/new");
    await ready(page, "set-up-game");
    await page.getByTestId("set-up-family").filter({ hasText: "Pencil puzzles" }).click();
    await page.locator('[data-testid="set-up-puzzle"][data-kind="hitofude"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-kind", "hitofude");
  });
});
