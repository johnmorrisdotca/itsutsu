import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { TSUNAGI_RENUMBERED } from "../src/lib/puzzles/tsunagi/levels/renumbered.data";
import { TSUNAGI_5 } from "../src/lib/puzzles/tsunagi/levels/size5.data";
import { suiteOperator } from "./operator";
import { ready } from "./support";

/**
 * A SOLVE MADE BEFORE THE LEVELS WERE RENUMBERED STAYS ON ITS OWN BOARD.
 *
 * On 2026-09-26 Tsunagi's hundred levels a size became 256, easiest first by a
 * measured difficulty, and nearly every board changed its number. What a
 * player did is stored three ways, and each must follow the board:
 *
 *  - A solve on the account is kept by its board (`givens`), with no number at
 *    all: made before, it shows at the board's new number. Tested here.
 *  - A browser's own record is kept by number, under a key of the old
 *    numbering: read once, it is moved to the new numbers. Tested here.
 *  - Kept runs, races and attempts are moved by the migration, which
 *    `renumber.test.ts` holds to the same move, and which was rehearsed on a
 *    database holding rows numbered the old way before it shipped.
 *
 * Old 5×5 level 3 is the board used: it moved to 105, in the seventh block,
 * which nothing in the suite opens, so what is shown there is only what this
 * spec put there.
 */
const OLD = 3;
const NOW = TSUNAGI_RENUMBERED[5]![OLD - 1]!;
const BOARD = TSUNAGI_5[NOW - 1]![0];

test.describe("Tsunagi after the renumbering", () => {
  test.use({ viewport: { width: 1280, height: 1100 } });

  test("a solve on the account, made before, shows at its board's new number, opens solved, and not at its old one", async ({ page }) => {
    expect(NOW, "old 5×5 level 3 moved").not.toBe(OLD);
    process.loadEnvFile(".env");
    const prisma = new PrismaClient();
    const member = await prisma.member.findFirstOrThrow({ where: { email: suiteOperator().email }, select: { id: true } });
    // As a solve was kept before the renumbering: the board and a time, nothing that says which number it had.
    const solve = await prisma.puzzleSolve.create({ data: { memberId: member.id, kind: "tsunagi", size: 5, level: "easy", givens: BOARD, elapsedMs: 42_000 } });
    try {
      await page.goto("/games/tsunagi/new?size=5");
      await ready(page, "puzzle-set-up");
      const block = Math.ceil(NOW / 16);
      for (let turn = 1; turn < block; turn += 1) await page.getByTestId("tsunagi-block-on").click();
      await expect(page.getByTestId("tsunagi-block")).toHaveAttribute("data-block", String(block));
      const cell = page.locator(`[data-testid="tsunagi-level"][data-level="${NOW}"]`);
      // Solved, with its time, though its block is not open: a board you solved is never locked.
      await expect(cell).toHaveAttribute("data-state", "solved");
      await expect(cell.getByTestId("tsunagi-level-time")).toHaveText("0:42");

      // Chosen, the preview draws it solved, and its time opens the solve it was; Start opens it.
      await cell.click();
      await expect(page.getByTestId("tsunagi-preview")).toHaveAttribute("data-state", "solved");
      await expect(page.getByTestId("tsunagi-preview-best")).toHaveText("0:42");
      await expect(page.getByTestId("tsunagi-preview-best")).toHaveAttribute("href", new RegExp(solve.id));
      await page.getByTestId("puzzle-solve").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-reviewing", "true");
      await expect(page.getByTestId("tsunagi-best-time")).toHaveText("0:42");
      await expect(page.getByTestId("tsunagi-best-time")).toHaveAttribute("href", new RegExp(solve.id));

      // And not at the number it had: that is another board now.
      await page.goto("/games/tsunagi/new?size=5");
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("tsunagi-block")).toHaveAttribute("data-block", "1");
      await expect(page.locator(`[data-testid="tsunagi-level"][data-level="${OLD}"]`)).not.toHaveAttribute("data-state", "solved");
    } finally {
      await prisma.puzzleSolve.delete({ where: { id: solve.id } });
      await prisma.$disconnect();
    }
  });

  test("a browser's record from before is moved to the new numbers the first time it is read", async ({ page }) => {
    // What this browser kept before: old level 3 solved in 51 seconds, under the old key.
    await page.addInitScript(
      ([old]) => {
        if (window.sessionStorage.getItem("seeded") !== null) return;
        window.sessionStorage.setItem("seeded", "1");
        window.localStorage.setItem("itsutsu.tsunagi.solved.5", JSON.stringify({ [old]: 51_000 }));
      },
      [OLD],
    );
    await page.goto("/games/tsunagi/new?size=5");
    await ready(page, "puzzle-set-up");
    const block = Math.ceil(NOW / 16);
    for (let turn = 1; turn < block; turn += 1) await page.getByTestId("tsunagi-block-on").click();
    await expect(page.locator(`[data-testid="tsunagi-level"][data-level="${NOW}"]`)).toHaveAttribute("data-state", "solved");
    const kept = await page.evaluate(() => ({ now: window.localStorage.getItem("itsutsu.tsunagi.solved.5@2026-09-26"), before: window.localStorage.getItem("itsutsu.tsunagi.solved.5") }));
    expect(JSON.parse(kept.now!)).toEqual({ [NOW]: 51_000 });
    expect(kept.before, "the old key is taken away once moved").toBeNull();
  });
});
