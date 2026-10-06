import { expect, test, type Page } from "@playwright/test";
import { gridEscape, nutsAndBolts } from "@johnmorrisdotca/karakuri";
import {
  GRID_ESCAPE_LEVELS,
  NUTS_AND_BOLTS_LEVELS,
  PIN_RESCUE_LEVELS,
  SAVE_THE_CHARACTER_LEVELS,
  STRETCH_GRABBER_LEVELS,
  gridPuzzleOf,
} from "@johnmorrisdotca/karakuri/levels";

import type { CasualKind } from "../src/lib/casual/casual.types";
import { CASUAL_STORAGE_KEY } from "../src/lib/casual/casualProgress";
import { casualPlayPath } from "../src/lib/gomoku/slugs";
import { ready } from "./support";

/**
 * THE SIX GAMES THAT `casual.spec.ts` DOES NOT WIN, EACH WON AT ITS FIRST
 * LEVEL by the moves the package's own tests proved, pressed on the canvas the
 * way a finger or the mouse presses it, on a phone's width and a desk's.
 * (Tube Sort and Choice Story are won there.) What this holds that the unit
 * tests cannot: that the site's board, sized and fitted into its page, still
 * takes the package's moves where the package says its pieces are, and that a
 * win reaches the site's own result and is kept.
 *
 * It keeps nothing on the server: what a casual game remembers is in the
 * page's storage, which each case starts empty.
 */
const VIEWPORTS = [
  { name: "a phone", width: 390, height: 844, touch: true },
  { name: "a desk", width: 1280, height: 800, touch: false },
] as const;

type Viewport = (typeof VIEWPORTS)[number];
type Point = { x: number; y: number };

/** The mounted game's own account of itself, read in the page. */
function read<T>(page: Page, fn: string): Promise<T> {
  return page.evaluate(`(${fn})(document.querySelector('[data-testid="casual-board"]').karakuri)`) as Promise<T>;
}

const snapshot = <T>(page: Page) => read<T>(page, "(m) => m.controller.snapshot()");

/** The client pixels of a place in the game's own units. */
const client = (page: Page, x: number, y: number) => read<Point>(page, `(m) => m.toClient(${x}, ${y})`);

/** A press at a client point: a finger where the screen has one, the mouse where it has not. */
async function tap(page: Page, viewport: Viewport, point: Point) {
  if (viewport.touch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

/**
 * A finger (or the mouse) down at the first point, along the rest in small
 * steps and up at the last. Touch goes through the protocol as touch events,
 * which is what a phone sends the page.
 */
async function drag(page: Page, viewport: Viewport, points: Point[], stepsBetween = 4) {
  const path: Point[] = [];
  for (let i = 1; i < points.length; i += 1) {
    for (let s = 1; s <= stepsBetween; s += 1) {
      const t = s / stepsBetween;
      path.push({ x: points[i - 1].x + (points[i].x - points[i - 1].x) * t, y: points[i - 1].y + (points[i].y - points[i - 1].y) * t });
    }
  }
  if (viewport.touch) {
    const cdp = await page.context().newCDPSession(page);
    const touch = (p: Point) => [{ x: p.x, y: p.y, id: 1 }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touch(points[0]) });
    for (const p of path) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touch(p) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
    return;
  }
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (const p of path) await page.mouse.move(p.x, p.y);
  await page.mouse.up();
}

/** Opens the first level of a game with nothing kept, and waits for its board to be drawn. */
async function open(page: Page, kind: CasualKind) {
  await page.addInitScript((key) => localStorage.removeItem(key), CASUAL_STORAGE_KEY);
  await page.goto(casualPlayPath(kind, 1));
  await ready(page, "casual-game");
  await expect(page.locator('[data-testid="casual-board"][data-ready="true"] canvas')).toBeVisible();
  // The whole board on the screen, so a finger put down on it lands there.
  await page.locator('[data-testid="casual-board"] canvas').scrollIntoViewIfNeeded();
}

/** The result the site shows, and what it kept: level 1 won. */
async function wonAtLevelOne(page: Page, kind: CasualKind) {
  await expect(page.getByTestId("casual-result")).toHaveAttribute("data-result", "won", { timeout: 20_000 });
  await expect(page.getByTestId("casual-result-title")).toHaveText("Level 1 won");
  const kept = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), CASUAL_STORAGE_KEY);
  expect(kept[kind]?.won).toEqual([1]);
}

/** Where a block of Grid Escape is, in the game's units (its cell is 48 across, set 36 in from the corner). */
function gridCentre(puzzle: ReturnType<typeof gridPuzzleOf>, block: number, offset: number): Point {
  const CELL = 48;
  const MARGIN = 36;
  const b = puzzle.blocks[block];
  return b.dir === "h"
    ? { x: MARGIN + (offset + 0.5) * CELL, y: MARGIN + (b.row + 0.5) * CELL }
    : { x: MARGIN + (b.col + 0.5) * CELL, y: MARGIN + (offset + 0.5) * CELL };
}

for (const viewport of VIEWPORTS) {
  test.describe(`on ${viewport.name}, ${viewport.width} px wide`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: viewport.touch, isMobile: viewport.touch });

    test("grid-escape: the key block leaves by the fewest moves", async ({ page }) => {
      await open(page, "gridEscape");
      const puzzle = gridPuzzleOf(GRID_ESCAPE_LEVELS[0]);
      let state = gridEscape.newGridGame(puzzle, 99);
      for (const [block, to] of gridEscape.solveGrid(puzzle)!.moves) {
        const from = gridCentre(puzzle, block, state.at[block]);
        const there = gridCentre(puzzle, block, to);
        await drag(page, viewport, [await client(page, from.x, from.y), await client(page, there.x, there.y)]);
        state = gridEscape.slide(state, block, to);
        await expect.poll(() => snapshot<{ moves: number }>(page).then((snap) => snap.moves)).toBe(state.moves);
      }
      await wonAtLevelOne(page, "gridEscape");
    });

    test("nuts-and-bolts: every plate falls when the screws come out in the order the search found", async ({ page }) => {
      await open(page, "nutsAndBolts");
      let taps = 0;
      for (const ref of nutsAndBolts.solveNuts(NUTS_AND_BOLTS_LEVELS[0].plates)!.order) {
        const snap = await snapshot<{ screws: Point[][] }>(page);
        const where = snap.screws[ref.plate][ref.screw];
        await tap(page, viewport, await client(page, where.x, where.y));
        taps += 1;
        await expect.poll(() => snapshot<{ taps: number }>(page).then((now) => now.taps)).toBe(taps);
      }
      await wonAtLevelOne(page, "nutsAndBolts");
    });

    test("pin-rescue: the pins are pulled in the recorded order, each left to settle", async ({ page }) => {
      await open(page, "pinRescue");
      for (const index of PIN_RESCUE_LEVELS[0].solution) {
        const snap = await snapshot<{ pins: { handle: Point }[] }>(page);
        await tap(page, viewport, await client(page, snap.pins[index].handle.x, snap.pins[index].handle.y));
        await expect.poll(() => snapshot<{ pins: { pulling: boolean }[] }>(page).then((now) => now.pins[index].pulling)).toBe(true);
        // Settled: nothing moving for half a second, or the level decided.
        let calm = 0;
        await expect
          .poll(
            async () => {
              const now = await snapshot<{ status: string; moving: boolean }>(page);
              if (now.status !== "playing") return true;
              calm = now.moving ? 0 : calm + 1;
              return calm >= 8;
            },
            { timeout: 30_000, intervals: [60] },
          )
          .toBe(true);
      }
      await wonAtLevelOne(page, "pinRescue");
    });

    test("rope-cut: a swipe across the rope lets the lantern fall to its target", async ({ page }) => {
      await open(page, "ropeCut");
      const snap = await snapshot<{ ropes: { nodes: Point[] }[] }>(page);
      const a = snap.ropes[0].nodes[4];
      const b = snap.ropes[0].nodes[5];
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const across = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
      const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      await drag(
        page,
        viewport,
        [await client(page, middle.x - across.x * 26, middle.y - across.y * 26), await client(page, middle.x + across.x * 26, middle.y + across.y * 26)],
        8,
      );
      await expect.poll(() => snapshot<{ cuts: unknown[] }>(page).then((now) => now.cuts.length)).toBe(1);
      await wonAtLevelOne(page, "ropeCut");
    });

    test("stretch-grabber: the tip is led along the recorded route to the star", async ({ page }) => {
      await open(page, "stretchGrabber");
      const tip = (await snapshot<{ tip: Point }>(page)).tip;
      const route = [tip, ...STRETCH_GRABBER_LEVELS[0].solution];
      const points: Point[] = [];
      for (const p of route) points.push(await client(page, p.x, p.y));
      await drag(page, viewport, points, 10);
      await wonAtLevelOne(page, "stretchGrabber");
    });

    test("save-the-character: the recorded line is drawn and he is kept safe for three seconds", async ({ page }) => {
      await open(page, "saveTheCharacter");
      const points: Point[] = [];
      for (const p of SAVE_THE_CHARACTER_LEVELS[0].solution) points.push(await client(page, p.x, p.y));
      await drag(page, viewport, points, 1);
      await expect.poll(() => snapshot<{ phase: string }>(page).then((now) => now.phase)).toBe("run");
      await wonAtLevelOne(page, "saveTheCharacter");
    });
  });
}
