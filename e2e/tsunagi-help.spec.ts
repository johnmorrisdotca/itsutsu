import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

import { decodeLayout } from "@johnmorrisdotca/tsunagi";
import { tsunagiRole } from "@johnmorrisdotca/tsunagi";
import { linesOfAnswer } from "@johnmorrisdotca/tsunagi";
import { TSUNAGI_4 } from "@johnmorrisdotca/tsunagi/levels-4";
import { keptPreferences, putPreferencesBack } from "./members";
import { suiteOperator } from "./operator";
import { ready } from "./support";

/**
 * HELP IN TSUNAGI, chosen at set-up and driven as a player drives it: Cheat,
 * which draws one unfinished line, and a level's explosions switched off. A
 * helped solve counts as solved, scores no points and says so on its record;
 * with explosions off it also opens no next block, until the level is solved
 * with them on (`solveHelp.ts`).
 *
 * Brings its own world: the operator's Tsunagi rows are cleared first, and
 * the two choices, made on the account by the clicks below, put back after.
 */
const AT = "/games/tsunagi";
const SIZE = 4;
let kept: unknown = null;

async function withPrisma<T>(work: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  const prisma = new PrismaClient();
  try {
    return await work(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function operatorId(): Promise<string | null> {
  return withPrisma(async (prisma) => (await prisma.member.findFirst({ where: { email: suiteOperator().email }, select: { id: true } }))?.id ?? null);
}

test.beforeEach(async () => {
  kept = await keptPreferences(suiteOperator().email);
  const id = await operatorId();
  if (id === null) return;
  await withPrisma(async (prisma) => {
    await prisma.puzzleSolve.deleteMany({ where: { memberId: id, kind: "tsunagi" } });
    await prisma.puzzleRun.deleteMany({ where: { memberId: id, kind: "tsunagi" } });
    await prisma.tsunagiAttempt.deleteMany({ where: { memberId: id } });
  });
});

test.afterEach(async () => {
  await putPreferencesBack(suiteOperator().email, kept);
});

/** Chooses at set-up, as a reader does: a chip pressed, and the account told. */
async function choose(page: Page, testId: string) {
  await page.goto(`${AT}/new`);
  await ready(page, "puzzle-set-up");
  const saved = page.waitForResponse((response) => response.url().endsWith("/api/me") && response.request().method() === "PATCH");
  await page.getByTestId(testId).click();
  await saved;
  await expect(page.getByTestId(testId)).toHaveAttribute("aria-checked", "true");
}

/** Opens a level to play: one solved already opens on its finished board, and Restart gives a fresh one. */
async function playLevel(page: Page, level: number) {
  await page.goto(`${AT}/play?size=${SIZE}&seed=${level}`);
  await ready(page, "puzzle-play");
  if ((await page.getByTestId("puzzle-play").getAttribute("data-reviewing")) === "true") await page.getByTestId("tsunagi-restart-solved").click();
  await expect(page.getByTestId("tsunagi-check")).toBeVisible();
}

async function drag(page: Page, cells: readonly number[]) {
  await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
  const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
  const centre = (cell: number) => ({ x: box.x + (((cell % SIZE) + 0.5) * box.width) / SIZE, y: box.y + ((Math.floor(cell / SIZE) + 0.5) * box.height) / SIZE });
  const from = centre(cells[0]!);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (const cell of cells.slice(1)) {
    const to = centre(cell);
    await page.mouse.move(to.x, to.y, { steps: 4 });
  }
  await page.mouse.up();
}

/** Draws the answer a line at a time, again where an explosion broke one, until the level is solved. */
async function solve(page: Page, level: number) {
  const [code, answer] = TSUNAGI_4[level - 1]!;
  const lines = linesOfAnswer(decodeLayout(code, SIZE)!, answer)!;
  const done = page.getByTestId("puzzle-done");
  for (let round = 0; round < 6 && !(await done.isVisible()); round += 1) {
    for (const [pair, line] of lines.entries()) {
      if (await done.isVisible()) break;
      const onPage = page.locator(`[data-testid="tsunagi-line"][data-pair="${pair}"]`);
      if ((await onPage.count()) === 0 || (await onPage.getAttribute("data-cells")) !== String(line.length)) await drag(page, line);
    }
  }
  await expect(done).toContainText("Solved");
  // Recorded on the account, not merely shown.
  await expect(page.getByTestId("puzzle-paid")).not.toContainText("Recording");
}

/** The operator's solve of a level: its help and its points, as kept. */
async function keptSolve(level: number) {
  const id = await operatorId();
  return withPrisma((prisma) => prisma.puzzleSolve.findFirst({ where: { memberId: id!, kind: "tsunagi", givens: TSUNAGI_4[level - 1]![0] }, orderBy: { finishedAt: "desc" }, select: { id: true, helped: true, points: true } }));
}

test.describe("Tsunagi help", () => {
  test("Cheat is offered only when allowed at set-up, draws the lines, and the solve is kept as helped with no points", async ({ page }) => {
    // Not allowed: no Cheat.
    await choose(page, "tsunagi-cheats-off");
    await playLevel(page, 1);
    await expect(page.getByTestId("tsunagi-cheat")).toHaveCount(0);
    // Allowed: set-up says what it costs, and Cheat draws a line a press until the level is solved.
    await choose(page, "tsunagi-cheats-allowed");
    await expect(page.getByTestId("tsunagi-help-costs")).toContainText("scores no points");
    await playLevel(page, 1);
    const pairs = decodeLayout(TSUNAGI_4[0]![0], SIZE)!.ends.length;
    for (let each = 1; each <= pairs; each += 1) {
      await page.getByTestId("tsunagi-cheat").click();
      if (each < pairs) await expect(page.getByTestId("tsunagi-help-note")).toContainText("Cheat has been used");
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-helped")).toHaveAttribute("data-helped", "cheated");
    await expect(page.getByTestId("puzzle-paid")).not.toContainText("Recording");
    const row = await keptSolve(1);
    expect(row).toMatchObject({ helped: "cheated", points: 0 });
    // Its own page says so.
    await page.goto(`${AT}/history/${row!.id}`);
    await expect(page.getByTestId("solve-help")).toContainText("Cheat drew a line");
    await expect(page.getByTestId("solve-points")).toContainText("0");
  });

  test("with explosions off a lesson counts as solved but opens no block, until it is solved with them on", async ({ page }) => {
    const teach = TSUNAGI_4.findIndex(([code], at) => /\|(boom|blast)\d+/.test(code) && tsunagiRole(SIZE, at + 1)?.role === "teaches") + 1;
    expect(teach).toBeGreaterThan(0);
    const after = teach + 2;
    // Everything before the lesson solved in this browser, so its block is open.
    await page.addInitScript(
      ([size, last]) => window.localStorage.setItem(`itsutsu.tsunagi.solved.${size}@2026-09-26`, JSON.stringify(Object.fromEntries(Array.from({ length: last }, (_, at) => [at + 1, 60_000])))),
      [SIZE, teach - 1],
    );
    await choose(page, "tsunagi-explosions-off");
    await expect(page.getByTestId("tsunagi-help-costs")).toContainText("does not open the next block");
    for (const level of [teach, teach + 1]) {
      await playLevel(page, level);
      await expect(page.getByTestId("tsunagi-help-note")).toContainText("Explosions are off");
      await expect(page.getByTestId("tsunagi-boom-countdown")).toHaveCount(0);
      await solve(page, level);
      await expect(page.getByTestId("puzzle-helped")).toHaveAttribute("data-helped", "explosionsOff");
      await expect(page.getByTestId("puzzle-helped")).toContainText("does not open the next block");
      expect(await keptSolve(level)).toMatchObject({ helped: "explosionsOff", points: 0 });
    }
    // Both solved, and the next block still shut.
    await page.goto(`${AT}/play?size=${SIZE}&seed=${after}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("tsunagi-shut")).toBeVisible();

    // With them on again, the lesson solved properly opens it.
    await choose(page, "tsunagi-explosions-on");
    for (const level of [teach, teach + 1]) {
      // Solved already, so it opens on its finished board and `playLevel` presses Restart.
      await playLevel(page, level);
      await expect(page.getByTestId("tsunagi-boom-countdown")).toBeVisible();
      await solve(page, level);
      await expect(page.getByTestId("puzzle-helped")).toHaveCount(0);
    }
    await page.goto(`${AT}/play?size=${SIZE}&seed=${after}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("tsunagi-check")).toBeVisible();
    await expect(page.getByTestId("tsunagi-shut")).toHaveCount(0);
  });
});
