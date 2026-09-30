import { PrismaClient } from "@prisma/client";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeMoves, encodeMoves } from "../src/lib/puzzles/solitaire/code";
import { suiteOperator } from "./operator";
import { freshPuzzleSeed, ready } from "./support";

/**
 * HOW A GAME ENDED, SAID PLAINLY AND MARKED. John, 2026-09-29, at a finished
 * Solitaire's page: "The box that talks about how it ended... that english is
 * also weird?", "let's show a checkmark for success/win/ an appropriate icon
 * for loss/fail/quit", and "bug: text wrapping for large numbers. Move 123 of
 * 131 but none for earler on".
 *
 * Each case brings its own solves, the operator's, and takes them away again.
 */

process.loadEnvFile(".env");
const prisma = new PrismaClient();
test.afterAll(async () => {
  await prisma.$disconnect();
});

const AT = `/games/${PUZZLE_SLUGS.solitaire}`;

/** A Solitaire dealt easy, turning one, whose winning line runs past a hundred moves: the counts that wrapped. */
function longDeal(): { givens: string; moves: string; count: number } {
  for (let tries = 0; tries < 200; tries += 1) {
    const puzzle = generatePuzzle("solitaire", 1, "easy", freshPuzzleSeed());
    const moves = decodeMoves(puzzle.solution);
    if (moves !== null && moves.length >= 100) return { givens: puzzle.givens, moves: puzzle.solution, count: moves.length };
  }
  throw new Error("no deal of a hundred moves in two hundred");
}

async function keep(solved: boolean, givens: string, answer: string): Promise<string> {
  const operator = await prisma.member.findFirst({ where: { email: suiteOperator().email }, select: { id: true } });
  const made = await prisma.puzzleSolve.create({
    data: { memberId: operator!.id, kind: "solitaire", size: 1, level: "easy", givens, answer, solved, elapsedMs: 289_000, points: solved ? 260 : 0, checksUsed: 0, hintsUsed: 0, pausedMs: 0 },
    select: { id: true },
  });
  return made.id;
}

/** The count's box and the slider's, at every move from the deal to the last: one line, one width. */
async function scrubsSteady(page: Page, at: Locator, scrubber: Locator, last: number) {
  const widths = new Set<number>();
  const heights = new Set<number>();
  for (const move of [0, 1, 9, 10, 99, 100, last - 1, last]) {
    await scrubber.fill(String(move));
    await expect(at).toHaveText(move === 0 ? "The deal" : `Move ${move} of ${last}`);
    const box = (await at.boundingBox())!;
    heights.add(Math.round(box.height));
    widths.add(Math.round((await scrubber.boundingBox())!.width));
  }
  expect([...heights], "the count took more than one line").toHaveLength(1);
  expect([...widths], "the slider changed width as the count changed").toHaveLength(1);
}

test("a won Solitaire's page says Won with a tick, in plain words, and its count keeps one line as it is scrubbed", async ({ page }) => {
  const deal = longDeal();
  const id = await keep(true, deal.givens, deal.moves);
  try {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${AT}/me/${id}`);
    await ready(page, "solve-board");
    await expect(page.getByTestId("solve-outcome")).toHaveText("Won");
    await expect(page.getByTestId("solve-outcome").getByTestId("result-mark")).toHaveAttribute("data-mark", "tick");
    await expect(page.getByTestId("solve-lead").getByTestId("result-mark")).toHaveAttribute("data-mark", "tick");
    const facts = page.getByTestId("solve-facts");
    for (const label of ["Result", "Draw", "Level", "Time", "Moves", "Points", "Help used", "Finished"]) await expect(facts.getByText(label, { exact: true })).toBeVisible();
    await expect(page.getByTestId("solve-puzzle")).toHaveText("Draw 1");
    await expect(page.getByTestId("solve-level")).toHaveText("Easy");
    // A date a person reads, never 2026-09-30.
    await expect(page.getByTestId("solve-date")).not.toHaveText(/^\d{4}-\d{2}-\d{2}$/);
    await expect(page.getByTestId("solve-fastest-here")).toHaveText("Fastest times, same draw and level");

    await scrubsSteady(page, page.getByTestId("solitaire-replay-at"), page.getByTestId("solitaire-replay-scrubber"), deal.count);

    // The same in the ⤢ window, whose heading says the draw and the level the way the facts do.
    await page.getByTestId("solve-board").hover();
    await page.getByTestId("board-focus-toggle").click();
    const open = page.getByTestId("board-focus");
    await expect(open).toHaveAttribute("data-board-focus", "open");
    await expect(page.getByTestId("board-masthead")).toContainText("Solitaire · Draw 1 · Easy");
    await scrubsSteady(page, open.getByTestId("solitaire-replay-at"), open.getByTestId("solitaire-replay-scrubber"), deal.count);
  } finally {
    await prisma.puzzleSolve.deleteMany({ where: { id } });
  }
});

test("a Solitaire given up says Given up, with a cross, not Not found", async ({ page }) => {
  const deal = longDeal();
  const id = await keep(false, deal.givens, encodeMoves(decodeMoves(deal.moves)!.slice(0, 12)));
  try {
    await page.goto(`${AT}/me/${id}`);
    await ready(page, "solve-board");
    await expect(page.getByTestId("solve-outcome")).toHaveText("Given up");
    await expect(page.getByTestId("solve-outcome").getByTestId("result-mark")).toHaveAttribute("data-mark", "cross");
  } finally {
    await prisma.puzzleSolve.deleteMany({ where: { id } });
  }
});
