import { expect, test, type Page } from "@playwright/test";

import { decodeLayout, stepBetween, type LinkLayout } from "@johnmorrisdotca/tsunagi";
import { challengesOf, tsunagiRole } from "@johnmorrisdotca/tsunagi";
import { linesOfAnswer } from "@johnmorrisdotca/tsunagi";
import { TSUNAGI_6 } from "@johnmorrisdotca/tsunagi/levels-6";
import { ready } from "./support";

/**
 * TSUNAGI'S FIRST TWISTS, played by dragging: bridges (a block's 15th teaches
 * them, its 16th tests them), then walls. John, 2026-09-26: bridges first, then
 * walls and blocked cells, and a row under every board saying what the level
 * asks. Each line is drawn through the centres of its cells as a finger draws
 * it — over a bridge too — never set by an address.
 */
const AT = "/games/tsunagi";
const SIZE = 6;

/** The first 6×6 level that teaches a challenge, and its partner that tests it. */
function lesson(challenge: "bridges" | "walls" | "waypoints" | "wrap"): number {
  const at = TSUNAGI_6.findIndex(([layout], index) => challengesOf(layout).includes(challenge) && tsunagiRole(SIZE, index + 1)?.role === "teaches");
  return at + 1;
}

async function centre(page: Page, cell: number) {
  const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
  return { x: box.x + (((cell % SIZE) + 0.5) * box.width) / SIZE, y: box.y + ((Math.floor(cell / SIZE) + 0.5) * box.height) / SIZE };
}

async function drag(page: Page, cells: readonly number[]) {
  const from = await centre(page, cells[0]!);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (const cell of cells.slice(1)) {
    const to = await centre(page, cell);
    await page.mouse.move(to.x, to.y, { steps: 4 });
  }
  await page.mouse.up();
}

/** Opens a level to play: where the account has it solved already it opens on the finished board, and Restart gives a fresh one. */
async function playLevel(page: Page, level: number) {
  await page.goto(`${AT}/play?size=${SIZE}&seed=${level}`);
  await ready(page, "puzzle-play");
  if ((await page.getByTestId("puzzle-play").getAttribute("data-reviewing")) === "true") await page.getByTestId("tsunagi-restart-solved").click();
  await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
}

/** Every level before `level` solved in this browser, so its block is open. */
async function openTo(page: Page, level: number) {
  await page.addInitScript(
    ([size, last]) => window.localStorage.setItem(`itsutsu.tsunagi.solved.${size}@2026-09-26`, JSON.stringify(Object.fromEntries(Array.from({ length: last }, (_, at) => [at + 1, 60_000])))),
    [SIZE, level - 1],
  );
}

/**
 * A line on a board that wraps, as a finger draws it: along the board, and at
 * each step across the join off the edge onto the ghost of the far side, then
 * lifted and pressed again on the line's end over there to carry on.
 */
async function dragWrapped(page: Page, layout: LinkLayout, cells: readonly number[]) {
  const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
  const span = SIZE + 2;
  const at = (col: number, row: number) => ({ x: box.x + ((col + 1.5) * box.width) / span, y: box.y + ((row + 1.5) * box.height) / span });
  const real = (cell: number) => at(cell % SIZE, Math.floor(cell / SIZE));
  let from = real(cells[0]!);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let each = 1; each < cells.length; each += 1) {
    const [a, b] = [cells[each - 1]!, cells[each]!];
    if (stepBetween(SIZE, a, b, false) !== 0) {
      from = real(b);
      await page.mouse.move(from.x, from.y, { steps: 4 });
      continue;
    }
    // Across the join: onto the ghost beyond a's edge, let go, and press again on b, the line's end now.
    const by = stepBetween(SIZE, a, b, true);
    const ghost = at((a % SIZE) + (Math.abs(by) === 1 ? Math.sign(by) : 0), Math.floor(a / SIZE) + (Math.abs(by) === SIZE ? Math.sign(by) : 0));
    await page.mouse.move(ghost.x, ghost.y, { steps: 4 });
    await page.mouse.up();
    // Landed on its far marble: joined, and pressing that marble again would start the line afresh.
    if (each === cells.length - 1) return;
    from = real(b);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
  }
  await page.mouse.up();
  void layout;
}

test.describe("Tsunagi's twists", () => {
  test.use({ viewport: { width: 1280, height: 1100 } });

  test("a bridge level is solved by dragging one line straight across the bridge and another straight down it", async ({ page }) => {
    const level = lesson("bridges");
    const [layoutCode, answer] = TSUNAGI_6[level - 1]!;
    const layout = decodeLayout(layoutCode, SIZE)!;
    const lines = linesOfAnswer(layout, answer)!;
    await openTo(page, level);
    await playLevel(page, level);
    await expect(page.getByTestId("tsunagi-bridge")).toHaveCount([...layoutCode].filter((char) => char === "+").length);

    // The row under the board says what this level asks, and a tap says what a bridge is.
    const chips = page.getByTestId("tsunagi-chips");
    await expect(chips.getByTestId("tsunagi-chip-teaches")).toHaveText("New: Bridges");
    await chips.getByTestId("tsunagi-chip-bridges").click();
    await expect(chips.getByTestId("tsunagi-chip-says")).toContainText("one straight across, a different one straight down");
    await expect(chips.getByTestId("tsunagi-difficulty")).toHaveAttribute("data-marks", /^[1-5]$/);

    for (const line of lines) await drag(page, line);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    // Solved, every bridge carries its line across on top of the deck; the line going down is beneath it.
    for (const bridge of await page.getByTestId("tsunagi-bridge").all()) {
      await expect(bridge).toHaveAttribute("data-across", /^\d+$/);
      await expect(bridge.getByTestId("tsunagi-over-bridge")).toHaveCount(1);
    }
  });

  test("its partner, the block's test, says so before it is opened and on its board", async ({ page }) => {
    const test16 = lesson("bridges") + 1;
    await openTo(page, test16);
    await page.goto(`${AT}/new?size=${SIZE}`);
    await ready(page, "puzzle-set-up");
    const cell = page.locator(`[data-testid="tsunagi-level"][data-level="${test16}"]`);
    await expect(cell).toHaveAttribute("data-role", "tests");
    await expect(cell.getByTestId("tsunagi-level-role")).toHaveText("Test");
    await expect(page.locator(`[data-testid="tsunagi-level"][data-level="${test16 - 1}"]`)).toHaveAttribute("data-role", "teaches");
    // Chosen: the chips under Start say so before it is played, and again on its board.
    await cell.click();
    await expect(page.getByTestId("puzzle-play-buttons").getByTestId("tsunagi-chip-tests")).toContainText("Block's test");
    await page.getByTestId("puzzle-solve").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("tsunagi-chip-tests")).toContainText("Block's test");
  });

  test("a wall stops a line crossing it, and the level is solved going round", async ({ page }) => {
    const level = lesson("walls");
    const [layoutCode, answer] = TSUNAGI_6[level - 1]!;
    const layout = decodeLayout(layoutCode, SIZE)!;
    const lines = linesOfAnswer(layout, answer)!;
    await openTo(page, level);
    await playLevel(page, level);
    await expect(page.getByTestId("tsunagi-chip-teaches")).toHaveText("New: Walls");

    // The lesson's wall beside a stone: a drag from the stone across it goes nowhere. Asserted, not hoped for — a skip would say nothing.
    // One side a stone and the other an empty cell, so without the wall the drag would draw a line.
    const walled = [...layout.walls].map((edge) => edge.split("-").map(Number) as [number, number]).find(([a, b]) => (layout.cells[a]! >= 0 && layout.cells[b] === -1) || (layout.cells[b]! >= 0 && layout.cells[a] === -1));
    expect(walled, "the walls lesson has a wall between a stone and an empty cell").toBeDefined();
    const [a, b] = layout.cells[walled![0]]! >= 0 ? walled! : ([walled![1], walled![0]] as const);
    await expect(page.locator(`[data-testid="tsunagi-wall"][data-edge="${Math.min(a, b)}-${Math.max(a, b)}"]`)).toHaveCount(1);
    await drag(page, [a, b]);
    await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
    for (const line of lines) await drag(page, line);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("a waypoint is a ring only its own line may pass, and the level is solved through it", async ({ page }) => {
    const level = lesson("waypoints");
    const [layoutCode, answer] = TSUNAGI_6[level - 1]!;
    const layout = decodeLayout(layoutCode, SIZE)!;
    const lines = linesOfAnswer(layout, answer)!;
    await openTo(page, level);
    await playLevel(page, level);
    await expect(page.getByTestId("tsunagi-chip-teaches")).toHaveText("New: Waypoints");
    await expect(page.getByTestId("tsunagi-waypoint")).toHaveCount(layout.waypoints.size);
    for (const line of lines) await drag(page, line);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("a board that wraps shows the far edges as ghosts, and a line is drawn off one side and on at the other", async ({ page }) => {
    const level = lesson("wrap");
    const [layoutCode, answer] = TSUNAGI_6[level - 1]!;
    const layout = decodeLayout(layoutCode, SIZE)!;
    const lines = linesOfAnswer(layout, answer)!;
    // The lesson's answer does cross the join, or it would teach nothing.
    expect(lines.some((line) => line.some((cell, at) => at > 0 && stepBetween(SIZE, line[at - 1]!, cell, false) === 0))).toBe(true);
    await openTo(page, level);
    await playLevel(page, level);
    await expect(page.getByTestId("tsunagi-chip-teaches")).toHaveText("New: Wrap");
    await expect(page.getByTestId("tsunagi-wrap-edge")).toHaveCount(1);
    await expect(page.locator("[data-ghost]")).toHaveCount((SIZE + 2) * (SIZE + 2) - SIZE * SIZE);
    for (const line of lines) await dragWrapped(page, layout, line);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });
});
