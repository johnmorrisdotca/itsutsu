import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

import { makeMemberId } from "../src/lib/auth/memberId";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { TSUNAGI_5 } from "@johnmorrisdotca/tsunagi/levels-5";
import { suiteOperator } from "./operator";
import { ready } from "./support";

/**
 * A Tsunagi solve's own page draws Tsunagi's board.
 *
 * John, 2026-09-26, on Hanachan's solve: "How is this a solved puzzle? buggy?"
 * The page had no Tsunagi branch and drew a blank white square, and it said the
 * answer was kept back "until tomorrow", which is not true of a level: a level
 * is the same board for good. Now somebody else's answer to a level the reader
 * has not solved shows the board as it is dealt, marbles and all, and says it
 * stays kept back until they solve it; the solver's own page shows the lines.
 */
const prisma = new PrismaClient();

test("another member's solve of a level shows its marbles and keeps the lines back until the reader solves it", async ({ page }) => {
  const stamp = Date.now().toString(36);
  const other = { id: makeMemberId(), email: `tsunagi-page-${stamp}@example.test`, name: `Tsu${stamp} Page`, picture: "", invitedWith: "playwright", ageBand: "18_plus" };
  await prisma.member.create({ data: other });
  const operator = await prisma.member.findFirst({ where: { email: suiteOperator().email }, select: { id: true } });
  // A 5×5 level far up the ladder, so the operator has not solved it in another spec.
  const [givens, answer] = TSUNAGI_5[200]!;
  await prisma.puzzleSolve.deleteMany({ where: { memberId: operator!.id, kind: "tsunagi", givens } });
  const theirs = await prisma.puzzleSolve.create({
    data: {
      memberId: other.id, kind: "tsunagi", size: 5, level: "hard", givens, answer, solved: true,
      elapsedMs: 61_000, points: 10, checksUsed: 0, hintsUsed: 0, pausedMs: 0, finishedAt: new Date(Date.now() - 3 * 86_400_000),
    },
    select: { id: true },
  });
  try {
    await page.goto(`/games/${PUZZLE_SLUGS.tsunagi}/history/${theirs.id}`);
    await ready(page, "solve-board");
    // Kept back three days on, because a level does not change: the marbles as dealt, no lines, and why.
    await expect(page.getByTestId("solve-page")).toHaveAttribute("data-kept", "false");
    await expect(page.getByTestId("solve-board").getByTestId("tsunagi-board")).toBeVisible();
    await expect(page.getByTestId("solve-board").locator('[data-testid="tsunagi-line"][data-cells]:not([data-cells="0"])')).toHaveCount(0);
    await expect(page.getByTestId("solve-kept-back")).toContainText("until you have solved it yourself");
    await expect(page.getByTestId("solve-kept-back")).not.toContainText("tomorrow");

    // Solved by the reader too, the same page shows the lines.
    await prisma.puzzleSolve.create({
      data: {
        memberId: operator!.id, kind: "tsunagi", size: 5, level: "hard", givens, answer, solved: true,
        elapsedMs: 90_000, points: 10, checksUsed: 0, hintsUsed: 0, pausedMs: 0, finishedAt: new Date(),
      },
    });
    await page.goto(`/games/${PUZZLE_SLUGS.tsunagi}/history/${theirs.id}`);
    await ready(page, "solve-board");
    await expect(page.getByTestId("solve-page")).toHaveAttribute("data-kept", "true");
    await expect(page.getByTestId("solve-board").locator('[data-testid="tsunagi-line"]:not([data-cells="0"])').first()).toBeVisible();
  } finally {
    await prisma.puzzleSolve.deleteMany({ where: { givens, kind: "tsunagi", memberId: { in: [other.id, operator!.id] } } });
    await prisma.member.delete({ where: { id: other.id } });
  }
});
