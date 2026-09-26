import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { makeMemberId } from "../src/lib/auth/memberId";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { isWord } from "../src/lib/puzzles/gomoji/code";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { suiteOperator } from "./operator";
import { freshPuzzleSeed, ready } from "./support";

/**
 * A FINISHED PUZZLE IS WATCHED AGAIN, NOT JUST LOOKED AT. John, 2026-09-26:
 * "viewing past game shows no scrubber and doesn't have the option to View As
 * a Modal", "this game doesn't even look solved and it was in completed
 * games", and on Gomoji's standings "more tabular… the points they got… I
 * can't view the games that were played!"
 *
 * Each case drives what a reader drives — solving by pressing cells and keys,
 * a time or a Replay on a board, the ⤢ in the board's corner — and brings its
 * own rows, taking them away again.
 */

process.loadEnvFile(".env");
const prisma = new PrismaClient();
test.afterAll(async () => {
  await prisma.$disconnect();
});

const DAY_MS = 86_400_000;

test("a grid solved here replays from empty to solved, and opens on its own", async ({ page }) => {
  const seed = freshPuzzleSeed();
  const puzzle = generatePuzzle("numberPlace", 4, "easy", seed);
  const givens = decodeCells(puzzle.givens, 4)!;
  const solution = decodeCells(puzzle.solution, 4)!;
  const open = givens.flatMap((given, index) => (given === 0 ? [index] : []));

  // Solved as a reader solves it: a cell, then its number, every open cell.
  await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=4&level=easy&seed=${seed}`);
  await ready(page, "puzzle-play");
  for (const cell of open) {
    await page.getByTestId("puzzle-cell").nth(cell).click();
    await page.getByTestId(`puzzle-key-${solution[cell]}`).click();
  }
  await expect(page.getByTestId("puzzle-done")).toBeVisible();

  // The card that says it is solved opens it again.
  await page.getByTestId("puzzle-see-solve").click();
  await expect(page).toHaveURL(new RegExp(`/games/${PUZZLE_SLUGS.numberPlace}/me/[^/]+$`));
  const board = page.getByTestId("solve-board");
  await ready(page, "solve-board");
  await expect(board).toHaveAttribute("data-state", "replay");
  const steps = page.getByTestId("puzzle-steps");
  await expect(steps).toHaveAttribute("data-last", String(open.length));
  await expect(steps).toHaveAttribute("data-viewing", String(open.length));
  const cells = page.getByTestId("puzzle-cell");

  // To the start: only the printed numbers.
  await page.getByTestId("puzzle-steps-start").click();
  await expect(steps).toHaveAttribute("data-viewing", "0");
  for (const cell of open) await expect(cells.nth(cell)).toHaveAttribute("data-value", "");
  // One forward: the first entry, and nothing after it.
  await page.getByTestId("puzzle-steps-forward").click();
  await expect(cells.nth(open[0]!)).toHaveAttribute("data-value", String(solution[open[0]!]));
  await expect(cells.nth(open[1]!)).toHaveAttribute("data-value", "");
  // To the end: solved, every cell the answer.
  await page.getByTestId("puzzle-steps-end").click();
  for (const [index, value] of solution.entries()) await expect(cells.nth(index)).toHaveAttribute("data-value", String(value));

  // The ⤢ opens the board on its own, saying what it is; Esc puts it back.
  await board.hover();
  await page.getByTestId("board-focus-toggle").click();
  await expect(page.getByTestId("board-focus")).toHaveAttribute("data-board-focus", "open");
  await expect(page.getByTestId("board-masthead")).toContainText("Solve");
  await expect(page.getByTestId("board-masthead-source")).toContainText("Solved on Itsutsu");
  // The scrubber goes with it.
  await page.getByTestId("puzzle-steps-start").click();
  await expect(steps).toHaveAttribute("data-viewing", "0");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("board-focus")).toHaveAttribute("data-board-focus", "closed");
  await expect(steps).toHaveAttribute("data-viewing", "0");
});

test("a grid solved before its answer was kept shows it solved, worked out from the puzzle", async ({ page }) => {
  const operator = await prisma.member.findUnique({ where: { email: suiteOperator().email }, select: { id: true } });
  expect(operator, "the suite's operator has a member row").not.toBeNull();
  const puzzle = generatePuzzle("numberPlace", 4, "easy", freshPuzzleSeed());
  const old = await prisma.puzzleSolve.create({
    data: {
      memberId: operator!.id, kind: "numberPlace", size: 4, level: "easy", givens: puzzle.givens, answer: null,
      elapsedMs: 3_600_000 + Math.floor(Math.random() * 1000), points: 40, checksUsed: 0, hintsUsed: 0, pausedMs: 0,
      finishedAt: new Date(Date.now() - 2 * DAY_MS),
    },
    select: { id: true },
  });
  try {
    // Opened as John opened his: from the list of his own solves.
    await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/me`);
    await page.locator(`[data-testid="puzzle-own-solve-time"][data-solve="${old.id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/me/${old.id}$`));
    await ready(page, "solve-board");
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", "worked-out");
    const cells = page.getByTestId("puzzle-cell");
    for (const [index, value] of decodeCells(puzzle.solution, 4)!.entries()) await expect(cells.nth(index)).toHaveAttribute("data-value", String(value));
    await expect(page.getByTestId("solve-note-worked-out")).toContainText("worked out from the puzzle");
    // Nothing kept to step through, so no scrubber pretends there is.
    await expect(page.getByTestId("puzzle-steps")).toHaveCount(0);
  } finally {
    await prisma.puzzleSolve.delete({ where: { id: old.id } });
  }
});

test("Gomoji's fastest table has a column each for time, guesses and points, and a Replay that opens the game", async ({ page }) => {
  const stamp = Date.now().toString(36);
  const ann = { id: makeMemberId(), email: `replay-ann-${stamp}@example.test`, name: `Ann${stamp} Replay`, picture: "", invitedWith: "playwright", ageBand: "18_plus" };
  await prisma.member.create({ data: ann });
  try {
    const puzzle = generatePuzzle("gomoji", 5, "easy", freshPuzzleSeed());
    const first = ["slate", "irony", "chump", "gawky", "fjord", "crane"].find((word) => word !== puzzle.solution && isWord(word, 5))!;
    // Faster than anything a real game keeps, so it tops the easy five-letter row.
    const elapsedMs = 500 + Math.floor(Math.random() * 400);
    const solve = await prisma.puzzleSolve.create({
      data: {
        memberId: ann.id, kind: "gomoji", size: 5, level: "easy", givens: puzzle.givens, answer: first + puzzle.solution,
        elapsedMs, points: 1234, checksUsed: 0, hintsUsed: 0, pausedMs: 0, finishedAt: new Date(Date.now() - DAY_MS),
      },
      select: { id: true },
    });

    await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/standings`);
    const table = page.getByTestId("puzzle-fastest-table");
    await expect(table.locator("thead th")).toHaveText(["#", "Player", "Time", "Guesses", "Points", "Replay"]);
    const rank = page.locator(`[data-testid="puzzle-fastest-rank"][data-solve="${solve.id}"]`);
    await expect(rank.locator("td").first()).toHaveText("1");
    await expect(rank.getByTestId("puzzle-fastest-time")).toHaveText("0:00");
    await expect(rank.getByTestId("puzzle-fastest-guesses")).toHaveText(/^2\/\d$/);
    await expect(rank.getByTestId("puzzle-fastest-points")).toHaveText("1,234");

    // Replay opens Ann's game, word by word, from its first guess.
    await rank.getByTestId("puzzle-fastest-replay").click();
    await expect(page).toHaveURL(new RegExp(`/games/${PUZZLE_SLUGS.gomoji}/history/${solve.id}$`));
    await expect(page.getByTestId("solve-solver")).toContainText(ann.name.split(" ")[0]!);
    await expect(page.getByTestId("word-replay")).toHaveAttribute("data-last", "2");
    await page.getByTestId("word-replay-start").click();
    await expect(page.getByTestId("word-replay")).toHaveAttribute("data-at", "0");

    // And its points on the table open the same game.
    await page.goBack();
    await page.locator(`[data-testid="puzzle-fastest-rank"][data-solve="${solve.id}"] [data-testid="puzzle-fastest-points"]`).click();
    await expect(page).toHaveURL(new RegExp(`/history/${solve.id}$`));
  } finally {
    await prisma.puzzleSolve.deleteMany({ where: { memberId: ann.id } });
    await prisma.member.delete({ where: { id: ann.id } });
  }
});
