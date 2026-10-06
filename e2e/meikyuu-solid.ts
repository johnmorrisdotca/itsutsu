import { buildSolidMaze, parseSolidRecipe, solidSolutionOf, type SolidMaze } from "@johnmorrisdotca/meikyuu/3d";
import { expect, type Page } from "@playwright/test";

/**
 * DRAWING OVER A SOLID AS A PLAYER DOES: a finger or the mouse on the start, taken along the line and across the edge from one face to the next, the
 * solid turning by itself when the line reaches the edge of the side in view, and let go. Where a cell is on the screen is asked of the board
 * (`place`, `between`: the package's handle, which is on the board's element), because a solid is not a flat drawing a spec can read the
 * place of a cell off; but the line is never handed to the board: the pointer is what draws, a mouse on a desk and a touch through Chromium's protocol on a phone.
 */
export type SolidPlay = { maze: SolidMaze; way: number[] };

/** The maze on the play screen, and its one way through. */
export async function solidOnScreen(page: Page): Promise<SolidPlay> {
  const code = await page.getByTestId("puzzle-play").getAttribute("data-maze");
  const recipe = code === null ? null : parseSolidRecipe(code);
  expect(recipe, `the play screen names no solid maze (${code})`).not.toBeNull();
  const maze = buildSolidMaze(recipe!);
  return { maze, way: solidSolutionOf(maze) };
}

const BOARD = '[data-testid="meikyuu-board"]';

/** Ask the board's handle something. */
export function askBoard<T>(page: Page, source: string, argument?: unknown): Promise<T> {
  return page.evaluate(`(async (argument) => { const s = document.querySelector('${BOARD}').meikyuuSolid; ${source} })(${JSON.stringify(argument ?? null)})`) as Promise<T>;
}

export type Placed = { x: number; y: number; visible: boolean; facing: number; room: number };
export const placeOf = (page: Page, cell: number) => askBoard<Placed>(page, "return s.place(argument);", cell);
export const betweenOf = (page: Page, a: number, b: number) => askBoard<{ x: number; y: number }>(page, "return s.between(argument[0], argument[1]);", [a, b]);
export const headOf = (page: Page) => askBoard<number>(page, "const g = s.mazeGame(); return g.path[g.path.length - 1];");

/** A pointer: where the box is on the page, and down, move, up in the page's pixels. */
export type Finger = { down(x: number, y: number): Promise<void>; move(x: number, y: number): Promise<void>; up(): Promise<void>; at(x: number, y: number): { x: number; y: number } };

/** A mouse, or, on a phone, a touch through Chromium's own protocol (which hands the page each move with the next frame). */
export async function fingerOn(page: Page, touch: boolean): Promise<Finger> {
  const box = page.locator(`${BOARD} .mk-box`);
  await box.scrollIntoViewIfNeeded();
  const rect = (await box.boundingBox())!;
  const at = (x: number, y: number) => ({ x: rect.x + x, y: rect.y + y });
  if (!touch) {
    return {
      at,
      down: async (x, y) => {
        await page.mouse.move(rect.x + x, rect.y + y);
        await page.mouse.down();
      },
      move: (x, y) => page.mouse.move(rect.x + x, rect.y + y),
      up: () => page.mouse.up(),
    };
  }
  const client = await page.context().newCDPSession(page);
  const frame = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const send = async (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) => {
    await client.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: rect.x + x, y: rect.y + y, id: 5 }] });
    await frame();
  };
  return { at, down: (x, y) => send("touchStart", x, y), move: (x, y) => send("touchMove", x, y), up: () => send("touchEnd", 0, 0) };
}

/**
 * Follow the way with one finger, as a person follows a corridor: the end of the line, then the edge it crosses, then the next cell, reading where each is on
 * the picture afresh at each move; and, while the next cell is out of sight, keeping the finger on the end of the line as the solid turns by itself to show it.
 * `stopAt` is how many cells of the way to draw; the finger is lifted at the end unless `lift` is false.
 */
export async function followWay(page: Page, finger: Finger, way: readonly number[], { stopAt = way.length, lift = true }: { stopAt?: number; lift?: boolean } = {}): Promise<void> {
  let p = await placeOf(page, way[0]!);
  await finger.down(p.x, p.y);
  for (let i = 1; i < stopAt; i += 1) {
    for (let tries = 0; ; tries += 1) {
      p = await placeOf(page, way[i]!);
      if (p.visible && p.facing > 0.4) break;
      expect(tries, `cell ${i} of the way never came into view`).toBeLessThan(200);
      const head = await placeOf(page, way[i - 1]!);
      await finger.move(head.x, head.y);
      await page.waitForTimeout(25);
    }
    const mid = await betweenOf(page, way[i - 1]!, way[i]!);
    await finger.move(mid.x, mid.y);
    p = await placeOf(page, way[i]!);
    await finger.move(p.x, p.y);
    expect(await headOf(page), `the line is not at cell ${way[i]} after step ${i}`).toBe(way[i]);
  }
  if (lift) await finger.up();
}
