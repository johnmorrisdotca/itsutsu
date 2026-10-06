import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

import { decodeLayout, linesOfAnswer, TSUNAGI_PORTAL_SEED } from "@johnmorrisdotca/tsunagi";
import { TSUNAGI_PORTAL_LEVELS } from "@johnmorrisdotca/tsunagi/levels-portals";
import { suiteOperator } from "./operator";
import { ready } from "./support";
import { drawWithMouse, drawWithTouch, strokesOf } from "./tsunagiFinger";

/*
 * THE LEVELS WITH PORTALS (Tsunagi 1.5.0, 2026-10-05). John asked "does Tsunagi have warps where you enter one side
 * and leave another?": it has wrap, which is the edges, and a portal is the same thing inside the board — two rings
 * alike, and a line that goes into one comes out of the other going the same way. A second set of levels, chosen by
 * "Portals" in the set-up's options, thirty-two a size. What is held here is that a person finds them, sees the two
 * rings, can ask where one goes (hover, or a tap), and solves a level by the drag a finger makes: by touch at a
 * phone's 390 and by mouse on a desk.
 *
 * The finger does not follow the line through a portal: it goes into the first ring, the line comes out of the
 * other by itself, and the finger is over the end of the line from then on (`dragFinger`). `tsunagiFinger.ts`
 * says where a finger goes to draw an answer, lifting where it would leave the board.
 */
async function forgetOperatorTsunagi() {
  const prisma = new PrismaClient();
  try {
    const member = await prisma.member.findFirst({ where: { email: suiteOperator().email }, select: { id: true } });
    if (member === null) return;
    await prisma.puzzleSolve.deleteMany({ where: { memberId: member.id, kind: "tsunagi" } });
    await prisma.puzzleRun.deleteMany({ where: { memberId: member.id, kind: "tsunagi" } });
    await prisma.tsunagiAttempt.deleteMany({ where: { memberId: member.id } });
  } finally {
    await prisma.$disconnect();
  }
}

test.beforeEach(forgetOperatorTsunagi);

const AT = "/games/tsunagi";
const seedOf = (level: number) => TSUNAGI_PORTAL_SEED + level;

/** A portal level as the package has it. */
function levelOf(size: number, level: number) {
  const [givens, answer] = TSUNAGI_PORTAL_LEVELS[size]![level - 1]!;
  const layout = decodeLayout(givens, size)!;
  return { givens, answer, layout, lines: linesOfAnswer(layout, answer)! };
}

async function openPortalLevel(page: Page, size: number, level: number) {
  await page.goto(`${AT}/play?size=${size}&seed=${seedOf(level)}`);
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-set", "portals");
  await expect(page.getByTestId("puzzle-asked")).toContainText(`${size}×${size} portals · Level ${level} of 32`);
}

/** Where a cell's middle is, read as the board stands now. */
const whereOn = (page: Page, size: number) => async (cell: number) => {
  const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
  return { x: box.x + (((cell % size) + 0.5) * box.width) / size, y: box.y + ((Math.floor(cell / size) + 0.5) * box.height) / size };
};

test.describe("the set-up offers the levels with portals", () => {
  test.use({ viewport: { width: 1280, height: 1100 } });

  test("Portals is chosen in the options, with its own sizes, its own thirty-two levels and a board that shows its rings; Classic brings the first set back", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    const height = (await page.getByTestId("puzzle-set-up").boundingBox())!.height;
    await expect(page.getByTestId("tsunagi-set-classic")).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("tsunagi-set-portals").click();
    await expect(page.getByTestId("puzzle-set-up")).toHaveAttribute("data-set", "portals");
    const sizes = async () => page.locator('[data-testid="tsunagi-sizes"] [data-testid="set-up-size"]').evaluateAll((tiles) => tiles.map((tile) => Number(tile.getAttribute("data-size"))));
    expect(await sizes()).toEqual([5, 6, 7, 8]);
    await page.getByTestId("tsunagi-more-sizes").click();
    expect(await sizes()).toEqual([9, 10, 12, 15]);
    await page.getByTestId("tsunagi-more-sizes").click();
    expect(await sizes()).toEqual([5, 6, 7, 8]);
    await page.locator('[data-testid="set-up-size"][data-size="7"]').click();
    await expect(page.getByTestId("tsunagi-preview")).toHaveAttribute("data-set", "portals");
    await expect(page.getByTestId("tsunagi-preview")).toHaveAttribute("data-drawn", "true");
    await expect(page.getByTestId("tsunagi-levels-caption")).toContainText("7×7 with portals: 0 of 32 solved");
    // The preview is the level chosen, with its rings: two for each portal, a portal's two alike.
    const portals = decodeLayout(TSUNAGI_PORTAL_LEVELS[7]![0]![0], 7)!.portalPairs.length;
    await expect(page.getByTestId("tsunagi-preview").getByTestId("tsunagi-portal")).toHaveCount(portals * 2);
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", new RegExp(`seed=${seedOf(1)}`));
    // The level's chip says what it asks.
    await expect(page.getByTestId("tsunagi-chip-portals")).toBeVisible();
    expect(Math.abs((await page.getByTestId("puzzle-set-up").boundingBox())!.height - height), "the set-up changed height").toBeLessThanOrEqual(1);
    await page.getByTestId("tsunagi-set-classic").click();
    await expect(page.getByTestId("puzzle-set-up")).toHaveAttribute("data-set", "classic");
    await expect(page.getByTestId("tsunagi-levels-caption")).toContainText(/of \d+ solved/);
  });

  test("an address with the set asked for opens on it", async ({ page }) => {
    await page.goto(`${AT}/new?size=9&set=portals`);
    await ready(page, "puzzle-set-up");
    await expect(page.getByTestId("puzzle-set-up")).toHaveAttribute("data-set", "portals");
    await expect(page.getByTestId("tsunagi-preview")).toHaveAttribute("data-size", "9");
  });
});

test.describe("a level with portals, played with a mouse on a desk", () => {
  test.use({ viewport: { width: 1280, height: 1100 } });

  test("has two rings alike for each portal, and the pointer over one shows the link to its partner", async ({ page }) => {
    const level = levelOf(7, 1);
    await openPortalLevel(page, 7, 1);
    // Its level's number in its own set, never the seed it is kept by (1,001).
    await expect(page.getByTestId("tsunagi-level-fastest")).toContainText("Fastest on level 1");
    await expect(page.getByTestId("tsunagi-level-fastest")).not.toContainText("1001");
    const [first, second] = level.layout.portalPairs[0]!;
    const ring = page.locator(`[data-testid="tsunagi-portal"][data-portal="0"]`);
    await expect(ring).toHaveCount(2);
    const link = page.locator('[data-testid="tsunagi-portal-link"][data-portal="0"]');
    await expect(link).toHaveAttribute("data-shown", "false");
    await page.locator(`[data-testid="puzzle-cell"][data-index="${first}"]`).hover();
    await expect(link).toHaveAttribute("data-shown", "true");
    await page.locator(`[data-testid="puzzle-cell"][data-index="${second}"]`).hover();
    await expect(link).toHaveAttribute("data-shown", "true");
    await page.mouse.move(2, 2);
    await expect(link).toHaveAttribute("data-shown", "false");
  });

  test("is solved by a finger that goes into one ring while the line comes out of the other, and is kept as solved", async ({ page }) => {
    const level = levelOf(6, 2);
    await openPortalLevel(page, 6, 2);
    for (const line of level.lines) await drawWithMouse(page, whereOn(page, 6), strokesOf(level.layout, line));
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    // Kept as a portal level of its own set, not as level 1002 of the first.
    await page.goto(`${AT}/new?size=6&set=portals`);
    await ready(page, "puzzle-set-up");
    await expect(page.locator('[data-testid="tsunagi-level"][data-level="2"]')).toHaveAttribute("data-state", "solved");
    await expect(page.getByTestId("tsunagi-levels-caption")).toContainText("1 of 32 solved");
  });

  test("a line goes in and comes out in the one drag, and is taken back over the portal as it went in", async ({ page }) => {
    const level = levelOf(7, 1);
    const { layout } = level;
    await openPortalLevel(page, 7, 1);
    const line = level.lines.find((each) => each.some((cell, at) => layout.portals.has(cell) && layout.portals.get(cell) === each[at + 1]))!;
    const enter = line.findIndex((cell, at) => layout.portals.has(cell) && layout.portals.get(cell) === line[at + 1]);
    const strokes = strokesOf(layout, line);
    // The first stroke goes as far as the ring (or, where the finger leaves the board before it, the test has nothing to say).
    const first = strokes[0]!;
    test.skip(first.cells.length < enter, "this finger leaves the board before the ring: the unit tests hold the rule");
    const where = whereOn(page, 7);
    const start = await where(first.start);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (const cell of first.cells.slice(0, enter)) {
      const to = await where(cell);
      await page.mouse.move(to.x, to.y, { steps: 3 });
    }
    // In at the ring: the line now holds both rings and the cell the other comes out into.
    await expect(page.locator(`[data-testid="tsunagi-line"][data-cells="${enter + 3}"]`)).toHaveCount(1);
    await page.mouse.up();
  });
});

test.describe("a level with portals, played by touch on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("is solved by a finger, and nothing scrolls sideways", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Touches are sent through Chromium's own input protocol.");
    const level = levelOf(6, 3);
    await openPortalLevel(page, 6, 3);
    await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
    const cdp = await page.context().newCDPSession(page);
    for (const line of level.lines) await drawWithTouch(cdp, whereOn(page, 6), strokesOf(level.layout, line));
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("a tap on a ring shows the link to its partner for a moment, which a finger has no hover to do", async ({ page }) => {
    const level = levelOf(6, 1);
    await openPortalLevel(page, 6, 1);
    const [first] = level.layout.portalPairs[0]!;
    const link = page.locator('[data-testid="tsunagi-portal-link"][data-portal="0"]');
    await expect(link).toHaveAttribute("data-shown", "false");
    await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
    const at = await whereOn(page, 6)(first);
    await page.touchscreen.tap(at.x, at.y);
    await expect(link).toHaveAttribute("data-shown", "true");
    await expect(link).toHaveAttribute("data-shown", "false", { timeout: 6000 });
  });
});
