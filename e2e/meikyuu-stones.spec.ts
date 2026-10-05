import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { contrast } from "../src/lib/pieces/colourMath";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { LOOK_RULES, LOOK_STORAGE } from "../src/lib/puzzles/meikyuu/look.constants";
import { STONES_STORAGE } from "../src/lib/puzzles/meikyuu/stones";
import { encodeCells } from "../src/lib/puzzles/meikyuu/steps";
import { drawThrough, placedMaze, wayThrough, type PlacedMaze } from "./meikyuu";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * MEIKYUU'S STONES: a marble laid on a passage beside the line, which the line cannot enter. The package (2.1) has the rules and the drawing; what is held here is
 * the site's side: the Stone press beside Undo, Restart and Move, the count of stones left, the setting on the set-up (a few, or as many as you like), the
 * stones kept with a half-drawn run and still there when it is opened again, the colours that keep a stone readable on every paper, and that a stone is never
 * part of the answer.
 *
 * Every case drives what a player drives: the mouse, a real touch held on a cell (press-and-hold), the keyboard. Each is a member of its own.
 */
const AT = `/games/${PUZZLE_SLUGS.meikyuu}`;

async function aMember(browser: Browser, baseURL: string | undefined, tag: string, view = { width: 1280, height: 1100 }, touch = false): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `meikyuu-stones-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Meikyuu Stones" }, { viewport: view, ...(touch ? { hasTouch: true, isMobile: true } : {}) });
  return { context, page: await context.newPage(), email };
}

async function openLevel(page: Page, size: number, level: number, band = "easy") {
  await page.goto(`${AT}/play?size=${size}&level=${band}&seed=${level}`);
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
}

const board = (page: Page) => page.getByTestId("meikyuu-board");
const stonesLaid = async (page: Page) => Number(await board(page).getAttribute("data-stones"));
const cellsDrawn = async (page: Page) => Number(await page.getByTestId("puzzle-play").getAttribute("data-cells"));

/** Where on the way the line stops, and the first cell of a side passage there: the cell a stone goes on. */
function forkAt(placed: PlacedMaze, way: readonly number[], from = 2): { at: number; into: number } {
  for (let at = from; at < way.length - 2; at += 1) {
    const [into] = placed.maze.links[way[at]!]!.filter((next) => !way.includes(next));
    if (into !== undefined) return { at, into };
  }
  throw new Error("no fork on the way");
}

test.describe("the Stone press and the stones on the board", () => {
  test("a stone is laid beside the line in the Stone mode, the line cannot enter it, a tap takes it up, and Undo and Restart know it", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "mode");
    try {
      await openLevel(page, 1, 2);
      const stone = page.getByTestId("meikyuu-stone");
      await expect(stone).toBeVisible();
      await expect(stone).toHaveText("Stone");
      await expect(stone).toHaveAttribute("aria-pressed", "false");
      // Stones left: the package's few for a small maze, said in the room it always has.
      const left = page.getByTestId("meikyuu-stones-left");
      await expect(left).toHaveText("Stones left: 3");
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      const { at, into } = forkAt(placed, way);
      await drawThrough(page, placed, way.slice(0, at + 1));
      expect(await cellsDrawn(page)).toBe(at + 1);

      // The mode: a tap on the cell beside the line lays a stone and draws nothing.
      await stone.click();
      await expect(stone).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("meikyuu-said")).toContainText("Stone mode");
      const point = placed.at(into);
      await page.mouse.click(point.x, point.y);
      await expect(left).toHaveText("Stones left: 2");
      expect(await stonesLaid(page)).toBe(1);
      await expect(board(page).locator(".mk-stone")).toHaveCount(1);
      expect(await cellsDrawn(page)).toBe(at + 1);

      // The line cannot go in: drawn from its end into the stone's cell, it stays where it was.
      await stone.click();
      await drawThrough(page, placed, [way[at]!, into]);
      expect(await cellsDrawn(page)).toBe(at + 1);
      // ...and a tap on the stone takes it up and gives it back.
      await stone.click();
      await page.mouse.click(point.x, point.y);
      expect(await stonesLaid(page)).toBe(0);
      await expect(left).toHaveText("Stones left: 3");
      await page.mouse.click(point.x, point.y);
      expect(await stonesLaid(page)).toBe(1);

      // Undo takes the stone up (the line stays), and then the stroke; Restart takes the stones up with the line.
      await page.getByTestId("meikyuu-undo").click();
      expect(await stonesLaid(page)).toBe(0);
      expect(await cellsDrawn(page)).toBe(at + 1);
      await page.mouse.click(point.x, point.y);
      expect(await stonesLaid(page)).toBe(1);
      await page.getByTestId("meikyuu-restart").click();
      expect(await stonesLaid(page)).toBe(0);
      expect(await cellsDrawn(page)).toBe(0);
      await expect(page.getByTestId("meikyuu-restart")).toBeDisabled();
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a stone far from the line, or on it, is refused in words, and the keyboard reaches the press and lays one with Shift and an arrow", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "refuse");
    try {
      await openLevel(page, 1, 2);
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      const { at } = forkAt(placed, way);
      await drawThrough(page, placed, way.slice(0, at + 1));
      const stone = page.getByTestId("meikyuu-stone");
      await stone.focus();
      await page.keyboard.press("Enter");
      await expect(stone).toHaveAttribute("aria-pressed", "true");
      const said = page.getByTestId("meikyuu-said");
      // On the line: refused.
      const online = placed.at(way[1]!);
      await page.mouse.click(online.x, online.y);
      expect(await stonesLaid(page)).toBe(0);
      // Far: a cell of the way more than two cells along from where the line stops.
      const far = placed.at(way[Math.min(way.length - 1, at + 6)]!);
      await page.mouse.click(far.x, far.y);
      expect(await stonesLaid(page)).toBe(0);
      await expect(page.getByTestId("meikyuu-said")).toContainText("Stone mode");
      void said;
      await page.keyboard.press("Enter");
      await expect(stone).toHaveAttribute("aria-pressed", "false");
      // Shift and an arrow beside the end of the line, the other way in: the open cell that way.
      const head = way[at]!;
      const open = placed.maze.links[head]!.filter((cell) => cell !== way[at - 1]);
      const [hx, hy] = placed.maze.grid.centres[head]!;
      const [nx, ny] = placed.maze.grid.centres[open[0]!]!;
      const key = Math.abs(nx - hx) > Math.abs(ny - hy) ? (nx > hx ? "ArrowRight" : "ArrowLeft") : ny > hy ? "ArrowDown" : "ArrowUp";
      await page.locator('[data-testid="meikyuu-board"] .mk-box').focus();
      await page.keyboard.press(`Shift+${key}`);
      expect(await stonesLaid(page)).toBe(1);
      await page.keyboard.press(`Shift+${key}`);
      expect(await stonesLaid(page)).toBe(0);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("on a phone a finger held on a cell beside the line lays a stone with no mode, at 390 wide with no sideways scroll", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "hold", { width: 390, height: 844 }, true);
    try {
      await openLevel(page, 1, 3);
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      const { at, into } = forkAt(placed, way);
      const touch = await context.newCDPSession(page);
      const send = (type: "touchStart" | "touchMove" | "touchEnd", cell: number) => touch.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ ...placed.at(cell), id: 1 }] });
      await send("touchStart", way[0]!);
      for (const cell of way.slice(1, at + 1)) await send("touchMove", cell);
      await send("touchEnd", way[at]!);
      expect(await cellsDrawn(page)).toBe(at + 1);
      // A finger held for most of a second lays a stone (a quick tap, here, runs the line along, as the board's Tap does, and is not this).
      await send("touchStart", into);
      await page.waitForTimeout(800);
      await send("touchEnd", into);
      await expect.poll(() => stonesLaid(page)).toBe(1);
      await expect(page.getByTestId("meikyuu-stones-left")).toHaveText("Stones left: 2");
      expect(await cellsDrawn(page)).toBe(at + 1);
      // Held on the stone, it comes up again.
      await send("touchStart", into);
      await page.waitForTimeout(800);
      await send("touchEnd", into);
      await expect.poll(() => stonesLaid(page)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      // The press has the room of the others: a phone's row of presses wraps and nothing is cut off.
      const press = await page.getByTestId("meikyuu-stone").boundingBox();
      expect(press!.x + press!.width).toBeLessThanOrEqual(390);
      expect(press!.height).toBeGreaterThanOrEqual(44);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});

test.describe("the setting, and stones kept with the run", () => {
  test("the set-up offers a few or as many as you like, kept on this device, and the board counts what is laid when there is no limit", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "setting");
    try {
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("meikyuu-stones-limited")).toHaveAttribute("data-chosen", "true");
      // The option is in its place whatever shape is chosen, and its height never changes.
      const before = await page.getByTestId("meikyuu-stones").boundingBox();
      for (const shape of ["tall", "colossal", "square"]) {
        await page.getByTestId(`meikyuu-shape-${shape}`).click();
        const now = await page.getByTestId("meikyuu-stones").boundingBox();
        expect(Math.abs(now!.y - before!.y), `${shape}: the stones' place`).toBeLessThanOrEqual(1);
        expect(Math.abs(now!.height - before!.height), `${shape}: the stones' height`).toBeLessThanOrEqual(1);
      }
      await page.getByTestId("meikyuu-stones-unlimited").click();
      await expect(page.getByTestId("meikyuu-stones-unlimited")).toHaveAttribute("data-chosen", "true");
      expect(await page.evaluate((key) => window.localStorage.getItem(key), STONES_STORAGE)).toBe("unlimited");
      await openLevel(page, 1, 2);
      await expect(page.getByTestId("meikyuu-stones-left")).toHaveText("Stones laid: 0");
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      const { at } = forkAt(placed, way, 1);
      await drawThrough(page, placed, way.slice(0, at + 1));
      await page.getByTestId("meikyuu-stone").click();
      // As many as there are cells beside the line: more than the few a limited game gives.
      const beside: number[] = [];
      for (const cell of way.slice(0, at + 1)) for (const next of placed.maze.links[cell]!) if (!way.includes(next) && !beside.includes(next)) beside.push(next);
      for (const cell of beside) {
        const point = placed.at(cell);
        await page.mouse.click(point.x, point.y);
      }
      await expect.poll(() => stonesLaid(page)).toBe(beside.length);
      await expect(page.getByTestId("meikyuu-stones-left")).toHaveText(`Stones laid: ${beside.length}`);
      // And back to a few: the stones laid stay, and no more are laid past the limit.
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await page.getByTestId("meikyuu-stones-limited").click();
      expect(await page.evaluate((key) => window.localStorage.getItem(key), STONES_STORAGE)).toBeNull();
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a half-drawn level keeps its stones with the line: opened again from My games both are there, and finishing it is checked on the line alone", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "kept");
    try {
      await openLevel(page, 2, 9);
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      const { at, into } = forkAt(placed, way, 3);
      await drawThrough(page, placed, way.slice(0, at + 1));
      await page.getByTestId("meikyuu-stone").click();
      const point = placed.at(into);
      const leftBefore = Number(/\d+/.exec((await page.getByTestId("meikyuu-stones-left").textContent()) ?? "")![0]);
      await page.mouse.click(point.x, point.y);
      expect(await stonesLaid(page)).toBe(1);
      await expect(page.getByTestId("meikyuu-stones-left")).toHaveText(`Stones left: ${leftBefore - 1}`);
      await page.getByTestId("puzzle-pause").click();
      await expect(page.getByTestId("puzzle-paused")).toBeVisible();
      await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
      await ready(page, "tabs");
      await page.locator('[data-testid="tab"][data-tab="going"]').click();
      const row = page.locator(`[data-testid="puzzle-going"][data-kind="meikyuu"][data-seed="9"]`);
      await expect(row).toBeVisible();
      await row.getByTestId("puzzle-going-continue").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", String(at + 1));
      await expect.poll(() => stonesLaid(page)).toBe(1);
      await expect(page.getByTestId("meikyuu-stones-left")).toHaveText(`Stones left: ${leftBefore - 1}`);
      await expect(board(page).locator(".mk-stone")).toHaveCount(1);
      // Opened again, the stone is still a stone: the line is stopped at it.
      const again = await placedMaze(page);
      await drawThrough(page, again, [way[at]!, into]);
      expect(await cellsDrawn(page)).toBe(at + 1);
      // Finish along the way: the answer is the line, whatever stones lie.
      await drawThrough(page, again, way.slice(at));
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      expect(await board(page).getAttribute("data-stones")).toBe("1");
      void encodeCells;
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});

test.describe("a stone is readable on every paper", () => {
  test("it is drawn in the colour the look gives it, 3:1 or better against the paper on a light and a dark set", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "colours");
    try {
      await openLevel(page, 1, 2);
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      const { at, into } = forkAt(placed, way);
      await drawThrough(page, placed, way.slice(0, at + 1));
      await page.getByTestId("meikyuu-stone").click();
      const point = placed.at(into);
      await page.mouse.click(point.x, point.y);
      await expect(board(page).locator(".mk-stone")).toHaveCount(1);
      const reading = () =>
        board(page).evaluate((host) => {
          const rgb = (text: string) => {
            const found = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(text);
            return found === null ? "#000000" : `#${[1, 2, 3].map((index) => Number(found[index]).toString(16).padStart(2, "0")).join("")}`;
          };
          const stone = host.querySelector(".mk-stone")!;
          return { stone: rgb(getComputedStyle(stone).fill), rim: rgb(getComputedStyle(stone).stroke), paper: rgb(getComputedStyle(host.querySelector(".mk-paper")!).fill), wall: rgb(getComputedStyle(host.querySelector(".mk-walls")!).stroke) };
        });
      for (const theme of ["wood", "midnight", "candy", "forest", "mono"]) {
        await page.getByTestId("meikyuu-colours").click();
        await page.getByTestId(`meikyuu-theme-${theme}`).click();
        await page.getByTestId("meikyuu-colours-done").click();
        const seen = await reading();
        expect(contrast(seen.stone, seen.paper), `${theme}: the stone on the paper`).toBeGreaterThanOrEqual(LOOK_RULES.stone);
        expect(contrast(seen.stone, seen.rim), `${theme}: the stone against its rim`).toBeGreaterThanOrEqual(LOOK_RULES.stoneFromWall);
        expect(seen.rim, `${theme}: its rim is the walls' colour`).toBe(seen.wall);
      }
      expect(await page.evaluate((key) => window.localStorage.getItem(key) !== null, LOOK_STORAGE)).toBe(true);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});
