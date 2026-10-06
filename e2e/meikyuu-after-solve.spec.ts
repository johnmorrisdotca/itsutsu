import { expect, test, type Browser, type BrowserContext, type CDPSession, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { drawQuickly, placedMaze, wayThrough } from "./meikyuu";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * A SOLVED BIG MAZE IS STILL A MAP. John, 2026-10-06, on an iPhone, Huge level 1 (the cross, 4,736 cells), solved in 7:20: "After
 * finishing a game, we only see the zoomed up map and not the full map at all. We are stuck with the view I've screenshotted. Can't
 * move the map or zoom etc. the full screen also doesn't show it. This is a bug. Full screen should be more useful."
 *
 * The finished board was locked whole (every touch refused) and the zoom presses went with the line's presses, so a maze zoomed in to be
 * drawn stayed exactly where the last stroke left it, with nothing to move it by. Held here, on a phone's real touches and on a desk's
 * mouse, in the page and in Just the board: after the solve the whole maze is in view with its line, and the wheel, the pad, one finger
 * and two fingers still change the view, and a finished maze takes no line (undo, restart and drawing stay refused).
 */
const AT = `/games/${PUZZLE_SLUGS.meikyuu}`;
const HUGE_LEVEL_ONE = `${AT}/play?size=4&level=easy&seed=1`;
/** How many cells before the goal the line is lifted, so the last stroke is drawn zoomed in on the goal. */
const LAST = 8;

type Where = { name: string; view: { width: number; height: number }; touch: boolean };
const WHERE: readonly Where[] = [
  { name: "a phone, 390×844", view: { width: 390, height: 844 }, touch: true },
  { name: "a desk, 1280×900", view: { width: 1280, height: 900 }, touch: false },
];

async function aMember(browser: Browser, baseURL: string | undefined, tag: string, where: Where): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `meikyuu-after-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Meikyuu After" }, { viewport: where.view, ...(where.touch ? { hasTouch: true, isMobile: true } : {}) });
  return { context, page: await context.newPage(), email };
}

type View = { x: number; y: number; width: number; height: number };
/** What the board shows of the maze: the package's own `viewBox`. The whole maze fitted is the widest it ever is. */
const viewOf = async (page: Page): Promise<View> => {
  const [x, y, width, height] = ((await page.locator('[data-testid="meikyuu-board"] svg').first().getAttribute("viewBox")) ?? "0 0 0 0").split(" ").map(Number);
  return { x: x!, y: y!, width: width!, height: height! };
};
const same = (a: View, b: View) => [a.x - b.x, a.y - b.y, a.width - b.width, a.height - b.height].every((gap) => Math.abs(gap) < Math.max(a.width, b.width) * 0.002);

/** The width of the view once it has stopped changing (the pad's presses glide there): two reads a moment apart that agree. */
async function settled(page: Page): Promise<number> {
  let last = -1;
  await expect
    .poll(async () => {
      const now = (await viewOf(page)).width;
      const still = Math.abs(now - last) < 1e-6;
      last = now;
      return still;
    }, "the view never settled")
    .toBe(true);
  return last;
}

/** The maze's box, as a finger or a mouse meets it, on the screen. */
async function boxOf(page: Page) {
  const box = page.locator(".mk-box").first();
  await box.scrollIntoViewIfNeeded();
  const rect = (await box.boundingBox())!;
  return { rect, middle: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 } };
}

/** Opens Huge level 1 and draws it with a last stroke made zoomed in on the goal, as a player who zoomed in to draw it. Returns the view the board opened at: the whole maze. */
async function solveZoomedIn(page: Page): Promise<{ fitted: View; line: number }> {
  await page.goto(HUGE_LEVEL_ONE);
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
  const placed = await placedMaze(page);
  const way = wayThrough(placed);
  const fitted = await viewOf(page);
  await drawQuickly(page, placed, way.slice(0, way.length - LAST));
  await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", String(way.length - LAST));
  // Zoomed in about the goal with the wheel, as a thumb would pinch there, and the rest of the line drawn in it.
  const goal = placed.at(way[way.length - 1]!);
  await page.mouse.move(goal.x, goal.y);
  await page.mouse.wheel(0, -1100);
  await expect.poll(async () => (await viewOf(page)).width, "the wheel did not zoom the maze in").toBeLessThan(fitted.width / 3);
  await drawQuickly(page, await placedMaze(page), way.slice(way.length - LAST - 1));
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  await page.getByTestId("win-cover-see-board").click();
  await expect(page.getByTestId("win-cover")).toHaveCount(0);
  return { fitted, line: way.length };
}

/** A touch as a finger makes one, or two: pressed, moved through points, lifted. */
async function touches(session: CDPSession, steps: readonly (readonly { x: number; y: number }[])[]) {
  const at = (points: readonly { x: number; y: number }[]) => points.map((point, id) => ({ ...point, id: id + 1 }));
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(steps[0]!) });
  for (const step of steps.slice(1)) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(step) });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

/** Everything a reader does to a map, each shown to change the view, and the line and the win not touched by any of it. */
async function viewStillMoves(page: Page, context: BrowserContext, where: Where, fitted: View, line: number) {
  const solved = async () => {
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", String(line));
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
  };
  const { middle } = await boxOf(page);

  // The wheel (a trackpad's pinch is the same event) zooms about the pointer.
  await page.mouse.move(middle.x, middle.y);
  await page.mouse.wheel(0, -700);
  await expect.poll(async () => (await viewOf(page)).width, "the wheel does not zoom a solved maze").toBeLessThan(fitted.width * 0.8);
  const zoomed = await viewOf(page);

  // One finger, or the mouse, drags the zoomed maze, and draws nothing.
  const [from, to] = [middle, { x: middle.x - 70, y: middle.y - 40 }];
  if (where.touch) {
    const session = await context.newCDPSession(page);
    await touches(session, [[from], [{ x: from.x - 20, y: from.y - 10 }], [{ x: from.x - 45, y: from.y - 25 }], [to]]);
  } else {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 6 });
    await page.mouse.up();
  }
  await expect.poll(async () => {
    const now = await viewOf(page);
    return Math.abs(now.x - zoomed.x) + Math.abs(now.y - zoomed.y);
  }, "a drag does not move a solved maze").toBeGreaterThan(1);
  await solved();

  // Two fingers pinch it.
  if (where.touch) {
    const session = await context.newCDPSession(page);
    const before = (await viewOf(page)).width;
    const spread = (gap: number) => [
      { x: middle.x - gap, y: middle.y },
      { x: middle.x + gap, y: middle.y },
    ];
    await touches(session, [spread(20), spread(40), spread(70), spread(100)]);
    await expect.poll(async () => (await viewOf(page)).width, "a pinch does not zoom a solved maze").toBeLessThan(before * 0.9);
    await solved();
  }

  // The pad: zoom out, zoom in, and Fit puts the whole maze back.
  const before = (await viewOf(page)).width;
  await page.getByTestId("meikyuu-zoom-out").click();
  await expect.poll(async () => (await viewOf(page)).width, "the − press does not zoom out").toBeGreaterThan(before);
  const out = await settled(page);
  await page.getByTestId("meikyuu-zoom-in").click();
  await expect.poll(async () => (await viewOf(page)).width, "the + press does not zoom in").toBeLessThan(out - 1e-6);
  await page.getByTestId("meikyuu-fit").click();
  await expect.poll(async () => same(await viewOf(page), fitted), "Fit does not put the whole maze back").toBe(true);
  await solved();

  // A finished maze takes no line: undo and restart are not offered, and the keys that would undo do nothing.
  await expect(page.getByTestId("meikyuu-undo")).toHaveCount(0);
  await expect(page.getByTestId("meikyuu-restart")).toHaveCount(0);
  await page.locator(".mk-box").first().focus();
  await page.keyboard.press("Control+z");
  await page.keyboard.press("Backspace");
  await solved();
}

for (const where of WHERE) {
  test(`after a solve on ${where.name}, the whole maze is in view with its line, and the wheel, the pad and fingers still move it`, async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "page", where);
    try {
      const { fitted, line } = await solveZoomedIn(page);
      // The whole maze, as it was first opened: not the corner the last stroke ended in.
      await expect.poll(async () => same(await viewOf(page), fitted), "a solved maze was left zoomed in on its last stroke").toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "the page runs wider than the screen").toBeLessThanOrEqual(0);
      // The board is a map to be touched: nothing in front of it, so a press on it reaches it.
      const { middle } = await boxOf(page);
      expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest(".mk-box") !== null, middle), "something is in front of the finished board").toBe(true);
      await viewStillMoves(page, context, where, fitted, line);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test(`Just the board after a solve on ${where.name}: the whole maze, as large as the window allows, with zoom and move working`, async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "bare", where);
    try {
      const { fitted, line } = await solveZoomedIn(page);
      await page.getByTestId("bare-board-toggle").click();
      await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
      await expect.poll(async () => same(await viewOf(page), fitted), "Just the board showed only a corner of the solved maze").toBe(true);
      // As large as the window lets it be, and whole in the window.
      const { rect } = await boxOf(page);
      const window = page.viewportSize()!;
      expect(rect.x, "the board starts off the window").toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width, "the board runs off the window").toBeLessThanOrEqual(window.width + 1);
      expect(rect.width, "the board is a sliver").toBeGreaterThan(Math.min(window.width, window.height) * 0.6);
      await viewStillMoves(page, context, where, fitted, line);
      // Esc leaves, and the maze is where it was.
      await page.keyboard.press("Escape");
      await expect(page.locator("html")).not.toHaveAttribute("data-bare", "true");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test(`Just the board before a solve on ${where.name}: the whole maze to begin with, and the wheel and Fit work in it`, async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "bare-before", where);
    try {
      await page.goto(HUGE_LEVEL_ONE);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
      const fitted = await viewOf(page);
      await page.getByTestId("bare-board-toggle").click();
      await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
      await expect.poll(async () => same(await viewOf(page), fitted), "Just the board did not show the whole maze").toBe(true);
      const { middle } = await boxOf(page);
      await page.mouse.move(middle.x, middle.y);
      await page.mouse.wheel(0, -700);
      await expect.poll(async () => (await viewOf(page)).width, "the wheel does not zoom in Just the board").toBeLessThan(fitted.width * 0.8);
      await page.getByTestId("meikyuu-fit").click();
      await expect.poll(async () => same(await viewOf(page), fitted)).toBe(true);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
}
