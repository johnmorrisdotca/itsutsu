import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { newGame, quartersBetween } from "@johnmorrisdotca/suido";
import { levelAnswer, levelSolution, type LevelRow } from "@johnmorrisdotca/suido/levels-info";
import { SUIDO_20X20 } from "@johnmorrisdotca/suido/levels-20x20";
import { SUIDO_28X28 } from "@johnmorrisdotca/suido/levels-28x28";
import { SUIDO_20X50 } from "@johnmorrisdotca/suido/levels-20x50";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * SUIDO'S HUGE BOARDS: 20×20, 28×28 and the long 20×50, sixty-four levels each, in four blocks of sixteen. A phone cannot give a
 * thumb a piece of a board this big, so it is zoomed and moved about by the package's own view (a pinch, a drag once it is zoomed in,
 * three buttons under it), and a tap on a piece is still a tap.
 *
 * Every board here is played as a reader plays it, by the press a finger or a mouse makes at the middle of a piece, on a member made for the spec and taken away
 * after it, from the answer the package keeps for the level.
 */
const KIND = "suido";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const levelUrl = (size: string, number: number) => `${AT}/play?size=${size}&number=${number}`;

const LEVELS: Record<string, readonly LevelRow[]> = { "20": SUIDO_20X20, "28": SUIDO_28X28, "20x50": SUIDO_20X50 };

async function aMember(browser: Browser, baseURL: string | undefined, tag: string, options?: Parameters<Browser["newContext"]>[0]): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `suido-huge-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Suido Huge" }, options);
  return { context, page: await context.newPage(), email };
}

const pieces = (page: Page) => page.getByTestId("suido-cell");
const board = (page: Page) => page.getByTestId("suido-board");

/** The press a finger or a mouse makes: at the middle of where the piece is drawn, whatever is on top there. */
async function press(page: Page, touch: boolean, x: number, y: number): Promise<void> {
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

/** Every piece of a level pressed until it faces as the answer says, by the middle of its square on the page. The whole board is in view first. */
async function solveByPressing(page: Page, rows: readonly LevelRow[], level: number, touch: boolean): Promise<number> {
  const row = rows[level - 1]!;
  const game = newGame(row[0])!;
  const answer = levelSolution(row)!;
  await board(page).scrollIntoViewIfNeeded();
  const centres = await page.locator('[data-testid="suido-cell"] .sd-hit').evaluateAll((all) =>
    all.map((one) => {
      const box = one.getBoundingClientRect();
      return [box.x + box.width / 2, box.y + box.height / 2] as [number, number];
    }),
  );
  let presses = 0;
  for (const [cell, mask] of game.masks.entries()) {
    const need = quartersBetween(mask, answer[cell]!) ?? 0;
    for (let each = 0; each < need; each += 1) {
      const [x, y] = centres[cell]!;
      await press(page, touch, x, y);
      presses += 1;
    }
  }
  return presses;
}

test.describe("Suido's huge boards", () => {
  test("four shelves of four sizes: the huge ones are on the third and the long 20×50 on the last, each with its sixty-four levels in four blocks", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "shelves");
    try {
      await page.goto(`${AT}/new?size=20`);
      await ready(page, "puzzle-set-up");
      const sizes = page.getByTestId("set-up-size");
      // The first screen on the size asked for is full: four tiles, 13 to 28.
      await expect(sizes).toHaveCount(4);
      await expect(page.locator('[data-testid="set-up-size"][data-size="20"]')).toBeVisible();
      await expect(page.locator('[data-testid="set-up-size"][data-size="28"]')).toBeVisible();
      await page.locator('[data-testid="set-up-size"][data-size="28"]').click();
      await expect(page.getByTestId("suido-preview")).toHaveAttribute("data-size", "28");
      await expect(page.getByTestId("suido-preview-caption")).toContainText("Level 1 of 64 at 28×28: not solved yet.");
      await expect(page.getByTestId("suido-preview").getByTestId("suido-cell")).toHaveCount(784);
      await expect(page.getByTestId("suido-block")).toContainText("Block 1 of 4 · levels 1–16");
      await expect(page.getByTestId("suido-block-on")).toBeEnabled();
      await page.getByTestId("suido-block-on").click();
      await page.getByTestId("suido-block-on").click();
      await page.getByTestId("suido-block-on").click();
      await expect(page.getByTestId("suido-block")).toContainText("Block 4 of 4 · levels 49–64");
      await expect(page.getByTestId("suido-block-on")).toBeDisabled();
      await expect(page.getByTestId("suido-levels-caption")).toContainText("0 of 64 solved");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /size=28&level=easy&number=1/);
      // The press beside the tiles goes on to the long boards, and the 20×50 is drawn as the long board it is.
      await page.getByTestId("suido-more-sizes").click();
      await expect(sizes).toHaveCount(4);
      const long = page.locator('[data-testid="set-up-size"][data-size="2050"]');
      await expect(long).toBeVisible();
      await expect(long.getByTestId("board-size-mark")).toHaveAttribute("aria-label", "20 by 50 board");
      const mark = (await long.locator('[data-testid="board-size-mark"] > span').boundingBox())!;
      expect(mark.height).toBeGreaterThan(mark.width * 2);
      await long.click();
      await expect(page.getByTestId("suido-preview-caption")).toContainText("Level 1 of 64 at 20×50");
      await expect(page.getByTestId("suido-preview").getByTestId("suido-cell")).toHaveCount(1000);
      const grid = page.getByTestId("suido-preview").getByTestId("puzzle-grid");
      await expect(grid).toHaveAttribute("data-size", "20");
      await expect(grid).toHaveAttribute("data-rows", "50");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a 20×20 level is solved on a phone by touch, the whole board in view, and is paid, kept and ranked like any level", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "phone", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    try {
      await page.goto(levelUrl("20", 1));
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-asked")).toContainText("20×20 · Level 1 of 64");
      await expect(pieces(page)).toHaveCount(400);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", SUIDO_20X20[0]![0]);
      // A piece is under a thumb's width at this size, so the board offers its buttons, and the page does not scroll sideways.
      await expect(page.getByTestId("suido-zoom")).toBeVisible();
      await expect(board(page)).toHaveAttribute("data-zoom", "1.00");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      const presses = await solveByPressing(page, SUIDO_20X20, 1, true);
      expect(presses).toBeGreaterThan(100);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
      await expect(page.getByTestId("puzzle-next-level")).toHaveText("Level 2 →");
      // Kept on the account: sixty-four levels, one solved.
      await page.getByTestId("puzzle-all-levels").click();
      await expect(page).toHaveURL(/\/new\?size=20$/);
      await ready(page, "puzzle-set-up");
      await expect(page.locator('[data-testid="suido-level"][data-level="1"]')).toHaveAttribute("data-state", "solved");
      await expect(page.getByTestId("suido-levels-caption")).toContainText("1 of 64 solved");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-level", "2");
      await page.locator('[data-testid="suido-level"][data-level="1"]').click();
      await expect(page.getByTestId("suido-preview")).toHaveAttribute("data-board", levelAnswer(SUIDO_20X20[0]!)!);
      // Its time opens the solve, which names the level (a huge level is known by its board's hash, not by loading its size) and draws it as it was solved.
      await page.getByTestId("suido-preview-best").click();
      await expect(page).toHaveURL(/\/games\/suido\/me\/[a-z0-9]+$/);
      await expect(page.getByTestId("solve-level")).toContainText("1, easy");
      await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", "finished");
      // And the level's own table of fastest times has it.
      await page.goto(levelUrl("20", 1));
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-reviewing", "true");
      await page.getByTestId("suido-play-again").click();
      await expect(page.getByTestId("suido-level-fastest")).toContainText("Fastest on level 1");
      await expect(page.getByTestId("suido-level-fastest-row").first()).toBeVisible();
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a 20×20 level is solved on a desk by mouse", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "desk", { viewport: { width: 1280, height: 900 } });
    try {
      await page.goto(levelUrl("20", 2));
      await ready(page, "puzzle-play");
      await expect(pieces(page)).toHaveCount(400);
      const presses = await solveByPressing(page, SUIDO_20X20, 2, false);
      expect(presses).toBeGreaterThan(100);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a 28×28 on a phone is zoomed by its buttons and moved by a finger, and a drag is not a tap on the piece under it", async ({ browser, baseURL, browserName }) => {
    test.skip(browserName !== "chromium", "the finger is sent through Chromium's own input");
    const { context, page, email } = await aMember(browser, baseURL, "zoom", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    try {
      await page.goto(levelUrl("28", 1));
      await ready(page, "puzzle-play");
      await expect(pieces(page)).toHaveCount(784);
      await expect(board(page)).toHaveAttribute("data-zoom", "1.00");
      await expect(page.getByTestId("suido-zoom-out")).toBeDisabled();
      await expect(page.getByTestId("suido-fit")).toBeDisabled();
      for (let each = 0; each < 3; each += 1) await page.getByTestId("suido-zoom-in").click();
      await expect(board(page)).toHaveAttribute("data-zoom", "4.10");
      await expect(page.getByTestId("suido-zoom")).toHaveAttribute("data-zoom", "4.10");
      await board(page).scrollIntoViewIfNeeded();
      const frame = (await board(page).boundingBox())!;
      // Zoomed in, a piece is under the finger at a size it can be pressed at.
      const piece = (await page.locator('[data-testid="suido-cell"] .sd-hit').first().boundingBox())!;
      expect(frame.width).toBeGreaterThan(300);
      const before = await page.locator("svg.suido").getAttribute("viewBox");
      const quarters = () => page.evaluate(() => [...document.querySelectorAll('[data-testid="suido-cell"] .sd-turn')].map((one) => (one as SVGGElement).style.getPropertyValue("--q")).join());
      const turned = await quarters();
      const session = await context.newCDPSession(page);
      const from = { x: frame.x + frame.width / 2 + 70, y: frame.y + frame.height / 2 + 40 };
      const to = { x: frame.x + frame.width / 2 - 70, y: frame.y + frame.height / 2 - 40 };
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x, y: from.y, id: 1 }] });
      for (let step = 1; step <= 6; step += 1) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x + ((to.x - from.x) * step) / 6, y: from.y + ((to.y - from.y) * step) / 6, id: 1 }] });
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      const after = await page.locator("svg.suido").getAttribute("viewBox");
      expect(after).not.toBe(before);
      expect(await quarters()).toBe(turned);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "false");
      expect(piece.width).toBeGreaterThan(0);
      // The whole board again.
      await page.getByTestId("suido-fit").click();
      await expect(board(page)).toHaveAttribute("data-zoom", "1.00");
      expect(await page.locator("svg.suido").getAttribute("viewBox")).toBe("0 0 2800 2800");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a tap on a zoomed 28×28 turns the piece under the finger and only that piece", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "tap", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    try {
      await page.goto(levelUrl("28", 1));
      await ready(page, "puzzle-play");
      for (let each = 0; each < 3; each += 1) await page.getByTestId("suido-zoom-in").click();
      await board(page).scrollIntoViewIfNeeded();
      const frame = (await board(page).boundingBox())!;
      const target = await page.evaluate(({ left, top, width, height }) => {
        const found = [...document.querySelectorAll('[data-testid="suido-cell"]')]
          .filter((one) => !["blank", "cross"].includes(one.getAttribute("data-shape") ?? "") && one.getAttribute("data-locked") !== "true")
          .map((one) => {
            const box = one.querySelector(".sd-hit")!.getBoundingClientRect();
            return { cell: Number(one.getAttribute("data-cell")), x: box.x + box.width / 2, y: box.y + box.height / 2, box };
          })
          .filter(({ box }) => box.left >= left && box.right <= left + width && box.top >= top && box.bottom <= top + height)
          .sort((a, b) => Math.hypot(a.x - left - width / 2, a.y - top - height / 2) - Math.hypot(b.x - left - width / 2, b.y - top - height / 2));
        return found[0] ? { cell: found[0].cell, x: found[0].x, y: found[0].y } : null;
      }, { left: frame.x, top: frame.y, width: frame.width, height: frame.height });
      expect(target).not.toBeNull();
      const masks = () => pieces(page).evaluateAll((all) => all.map((one) => Number(one.getAttribute("data-mask"))));
      const was = await masks();
      await page.touchscreen.tap(target!.x, target!.y);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", /.+/);
      const now = await masks();
      const changed = now.flatMap((mask, at) => (mask === was[at] ? [] : [at]));
      expect(changed).toEqual([target!.cell]);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("left half way, a huge board waits in My games and opens where it was left", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "going");
    try {
      await page.goto(levelUrl("28", 3));
      await ready(page, "puzzle-play");
      const row = SUIDO_28X28[2]!;
      const game = newGame(row[0])!;
      const answer = levelSolution(row)!;
      const first = game.masks.findIndex((mask, cell) => (quartersBetween(mask, answer[cell]!) ?? 0) > 0);
      for (let each = 0; each < (quartersBetween(game.masks[first]!, answer[first]!) ?? 0); each += 1) await pieces(page).nth(first).click();
      const code = await page.getByTestId("puzzle-play").getAttribute("data-code");
      expect(code!.length).toBeGreaterThan(780);
      await page.getByTestId("puzzle-pause").click();
      await expect(page.getByTestId("puzzle-paused")).toBeVisible();
      await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
      await expect(page).toHaveURL(/\/play$/);
      await ready(page, "tabs");
      await page.locator('[data-testid="tab"][data-tab="going"]').click();
      const going = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"]`);
      await expect(going).toHaveCount(1);
      await expect(going).toContainText("28×28 · Level 3");
      await going.getByTestId("puzzle-going-continue").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", code!);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the long 20×50 is as tall as it is on a phone, with its zoom, and the page does not scroll sideways", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "long", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    try {
      await page.goto(levelUrl("20x50", 1));
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-asked")).toContainText("20×50 · Level 1 of 64");
      await expect(pieces(page)).toHaveCount(1000);
      const grid = page.getByTestId("puzzle-grid");
      await expect(grid).toHaveAttribute("data-size", "20");
      await expect(grid).toHaveAttribute("data-rows", "50");
      const box = (await grid.boundingBox())!;
      expect(box.height).toBeGreaterThan(box.width * 2);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      await expect(page.getByTestId("suido-zoom")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      expect(LEVELS["20x50"]).toBe(SUIDO_20X50);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});
