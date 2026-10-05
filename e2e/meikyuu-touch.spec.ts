import { expect, test, type BrowserContext, type CDPSession, type Page } from "@playwright/test";

import { MEIKYUU_TALL_LEVELS } from "@johnmorrisdotca/meikyuu/levels/tall";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { meikyuuLevelBand } from "../src/lib/puzzles/meikyuu/levelCounts";
import { EDGE_PAN_STORAGE } from "../src/lib/puzzles/meikyuu/turn";
import { placedMaze, wayThrough } from "./meikyuu";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * GETTING ABOUT A BIG MAZE WITH A FINGER. John, 2026-10-02: "the ability for mobile users to easily navigate from the top of
 * the map to a bottom... allow users to zoom out enough that they can see the body easily on the left and right hand sides."
 *
 * Held here, on a phone with a real touch (CDP touch events, not the mouse): the biggest tall maze drawn from its start to
 * its goal on two phone sizes; Zoom out widening the page left beside the board, and Fit putting it back; the page scrolling
 * by a swipe on that margin and the board keeping a swipe on itself for drawing (touch-action: none on the maze's box only);
 * Move making a one-finger drag move the view and draw nothing; two fingers moving it; and the switch that stops the view
 * sliding at the edge. Each case is a member of its own, made for it and taken away after.
 */
const AT = `/games/${PUZZLE_SLUGS.meikyuu}`;
/** The biggest, hardest tall level that is drawn through from its start to its goal: a keys level wants a detour for each key, which a way through does not take. */
const BIGGEST = MEIKYUU_TALL_LEVELS.filter((level) => level.size === 6 && level.recipe.mode !== "keys").at(-1)!;

async function onAPhone(browser: Parameters<typeof memberContext>[0], baseURL: string | undefined, tag: string, view: { width: number; height: number }): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `meikyuu-touch-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Meikyuu Touch" }, { viewport: view, hasTouch: true, isMobile: true });
  return { context, page: await context.newPage(), email };
}

async function openBiggest(page: Page) {
  await page.goto(`${AT}/play?size=20x30&level=${meikyuuLevelBand(2030, BIGGEST.inSize)}&seed=${BIGGEST.inSize}`);
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-maze", BIGGEST.code);
  await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
}

const gutterOf = async (page: Page) => Number(await page.getByTestId("meikyuu-board").getAttribute("data-gutter"));
const viewOf = async (page: Page) => ((await page.locator('[data-testid="meikyuu-board"] svg').first().getAttribute("viewBox")) ?? "0 0 0 0").split(" ").map(Number);

/** A touch as a finger makes one: pressed, moved through points, lifted. Two fingers are two ids. */
async function finger(touch: CDPSession, points: readonly { x: number; y: number }[], id = 1, others: readonly { x: number; y: number }[] = []) {
  const at = (point: { x: number; y: number }, ids: number) => ({ ...point, id: ids });
  const withOthers = (point: { x: number; y: number }, index: number) => [at(point, id), ...others.map((other, at2) => at({ x: other.x + (point.x - points[0]!.x), y: other.y + (point.y - points[0]!.y) }, id + 1 + at2))].filter(() => index >= 0);
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: withOthers(points[0]!, 0) });
  for (const [index, point] of points.slice(1).entries()) await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: withOthers(point, index + 1) });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

for (const view of [{ width: 390, height: 844 }, { width: 360, height: 740 }]) {
  test(`the biggest tall maze is drawn from its start to its goal by a finger, ${view.width}×${view.height}`, async ({ browser, baseURL }) => {
    const { context, page, email } = await onAPhone(browser, baseURL, `big-${view.width}`, view);
    try {
      await openBiggest(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "the page runs wider than the screen").toBeLessThanOrEqual(0);
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      const touch = await context.newCDPSession(page);
      const send = (type: "touchStart" | "touchMove" | "touchEnd", cell: number) => touch.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ ...placed.at(cell), id: 1 }] });
      await send("touchStart", way[0]!);
      for (const cell of way.slice(1)) await send("touchMove", cell);
      await send("touchEnd", way[way.length - 1]!);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", String(way.length));
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
}

test("Zoom out widens the page beside the board, a swipe on that margin scrolls the page, and Fit puts it back", async ({ browser, baseURL }) => {
  const { context, page, email } = await onAPhone(browser, baseURL, "gutters", { width: 390, height: 844 });
  try {
    await openBiggest(page);
    const board = page.getByTestId("meikyuu-board");
    await expect(board).toHaveAttribute("data-gutter", "24");
    const wood = async () => (await page.getByTestId("board-surface").boundingBox())!;
    const before = await wood();
    // The page is touched to scroll beside the board and the board keeps its own touches (the package's rule), and nothing of the site's takes any more.
    const touchActions = await page.evaluate(() => {
      const out: string[] = [];
      for (let element: Element | null = document.querySelector('[data-testid="meikyuu-board"]'); element !== null; element = element.parentElement) out.push(`${element.className.toString().includes("mk-box") ? "box" : element.tagName.toLowerCase()}:${getComputedStyle(element).touchAction}`);
      return { chain: out, box: getComputedStyle(document.querySelector(".mk-box")!).touchAction };
    });
    expect(touchActions.box, "the maze's box keeps its touches").toBe("none");
    expect(touchActions.chain.filter((entry) => entry.endsWith(":none")), "nothing outside the maze's box asks for every touch").toEqual([]);

    // Zoom out first shrinks the maze to a little past its fit, and only then widens the page beside it, a step at a time.
    for (let press = 0; press < 6 && (await gutterOf(page)) <= 24; press += 1) await page.getByTestId("meikyuu-zoom-out").click();
    await expect.poll(() => gutterOf(page), "zooming out never widened the gutters").toBeGreaterThan(24);
    const after = await wood();
    expect(after.width, "the wood is narrower, so the page shows beside it").toBeLessThan(before.width - 20);
    expect(after.x, "the page shows on the left").toBeGreaterThan(before.x + 10);
    for (let press = 0; press < 4 && (await gutterOf(page)) < 72; press += 1) await page.getByTestId("meikyuu-zoom-out").click();
    await expect.poll(() => gutterOf(page), "the page beside the board is widened to the most").toBe(72);
    expect((await wood()).x, "the body is easily seen on the left").toBeGreaterThanOrEqual(56);
    expect(390 - ((await wood()).x + (await wood()).width), "and on the right").toBeGreaterThanOrEqual(56);
    // A swipe on the margin is the page's: the page scrolls and nothing is drawn.
    const touch = await context.newCDPSession(page);
    // From the top of the page (pressing Zoom out scrolled it), a finger on the margin dragged up: the page goes down.
    await page.evaluate(() => window.scrollTo(0, 0));
    const margin = (await wood()).x / 2;
    await touch.send("Input.synthesizeScrollGesture", { x: margin, y: 600, yDistance: -300, gestureSourceType: "touch", speed: 800 });
    await expect.poll(() => page.evaluate(() => window.scrollY), "the page did not scroll from its side").toBeGreaterThan(100);
    expect(Number(await page.getByTestId("puzzle-play").getAttribute("data-cells"))).toBe(0);

    await page.getByTestId("meikyuu-fit").click();
    await expect.poll(() => gutterOf(page), "Fit puts the gutters back").toBe(24);
    expect((await wood()).width).toBeGreaterThan(before.width - 2);
  } finally {
    await context.close();
    await removeMember(email);
  }
});

test("Move makes a finger drag the view and draw nothing, and two fingers move it too", async ({ browser, baseURL }) => {
  const { context, page, email } = await onAPhone(browser, baseURL, "move", { width: 390, height: 844 });
  try {
    await openBiggest(page);
    await page.getByTestId("meikyuu-zoom-in").click();
    await page.getByTestId("meikyuu-zoom-in").click();
    const placed = await placedMaze(page);
    const touch = await context.newCDPSession(page);
    const box = (await page.locator(".mk-box").first().boundingBox())!;
    const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const start = (await viewOf(page))[0]!;

    // Two fingers, moved together: the view moves along.
    await finger(touch, [middle, { x: middle.x - 40, y: middle.y }, { x: middle.x - 80, y: middle.y }], 1, [{ x: middle.x + 50, y: middle.y }]);
    await expect.poll(async () => (await viewOf(page))[0]!, "two fingers did not move the view").not.toBe(start);
    expect(Number(await page.getByTestId("puzzle-play").getAttribute("data-cells"))).toBe(0);

    // Move on: one finger pressed where the line would begin drags the view, and draws nothing.
    await page.getByTestId("meikyuu-move").click();
    await expect(page.getByTestId("meikyuu-move")).toHaveAttribute("data-moving", "true");
    await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-pan", "true");
    const placedNow = await placedMaze(page);
    const before = (await viewOf(page))[0]!;
    const startDot = placedNow.at(wayThrough(placedNow)[0]!);
    const on = { x: Math.min(Math.max(startDot.x, box.x + 20), box.x + box.width - 20), y: Math.min(Math.max(startDot.y, box.y + 20), box.y + box.height - 20) };
    await finger(touch, [on, { x: on.x + 30, y: on.y }, { x: on.x + 60, y: on.y }]);
    await expect.poll(async () => (await viewOf(page))[0]!, "a finger in Move did not move the view").not.toBe(before);
    expect(Number(await page.getByTestId("puzzle-play").getAttribute("data-cells")), "a finger in Move drew").toBe(0);
    void placed;
    await page.getByTestId("meikyuu-move").click();
    await expect(page.getByTestId("meikyuu-board")).toHaveAttribute("data-pan", "false");
  } finally {
    await context.close();
    await removeMember(email);
  }
});

test("the view slides when the line reaches the edge, unless this device has said not, and the choice is kept", async ({ browser, baseURL }) => {
  const { context, page, email } = await onAPhone(browser, baseURL, "edge", { width: 390, height: 844 });
  try {
    await openBiggest(page);
    await page.getByTestId("meikyuu-colours").click();
    const dialog = page.getByTestId("meikyuu-colours-dialog");
    await expect(dialog.getByTestId("meikyuu-edge-pan")).toBeChecked();
    await dialog.getByTestId("meikyuu-edge-pan").uncheck();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), EDGE_PAN_STORAGE)).toBe("off");
    await dialog.getByTestId("meikyuu-edge-pan").check();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), EDGE_PAN_STORAGE), "the default is kept as nothing").toBeNull();
    await dialog.getByTestId("meikyuu-edge-pan").uncheck();
    await page.keyboard.press("Escape");
    // The next page opens with it off.
    await page.goto(`${AT}/play?size=20x30&level=hard&seed=255`);
    await ready(page, "puzzle-play");
    await page.getByTestId("meikyuu-colours").click();
    await expect(page.getByTestId("meikyuu-colours-dialog").getByTestId("meikyuu-edge-pan")).not.toBeChecked();
  } finally {
    await context.close();
    await removeMember(email);
  }
});
