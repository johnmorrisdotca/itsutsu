import { buildMaze, parseRecipe, solutionOf, toDisplay, type Maze } from "@johnmorrisdotca/meikyuu";
import { expect, type Page } from "@playwright/test";

/**
 * DRAWING THROUGH A MEIKYUU MAZE AS A PLAYER DOES: the mouse pressed on the
 * start dot, taken through the middle of each cell of the line in turn, and let
 * go. The maze is the one the page is showing, read from its recipe (`data-maze`
 * on the play screen), and where a cell is on the screen is worked out from the
 * drawing itself: the viewBox the package writes for the box it is looked at
 * through, and the room that box leaves round a shape that is not square.
 *
 * A tall maze lying on its side is shown a quarter turn (`data-turned` on the board): the drawing's own coordinates are
 * the turned ones, so a cell is looked for where the package shows it (`toDisplay`) and the line drawn is the same line.
 *
 * The line is never handed to the board: this is the control a player drives
 * (`e2e/language.spec.ts` on why a test drives the control, not the mechanism).
 */
export type PlacedMaze = { maze: Maze; at: (cell: number) => { x: number; y: number } };

/** The maze on the play screen, with where each of its cells is on the page now. */
export async function placedMaze(page: Page): Promise<PlacedMaze> {
  const code = await page.getByTestId("puzzle-play").getAttribute("data-maze");
  const recipe = code === null ? null : parseRecipe(code);
  expect(recipe, `the play screen names no maze (${code})`).not.toBeNull();
  const maze = buildMaze(recipe!);
  const svg = page.locator('[data-testid="meikyuu-board"] svg').first();
  await expect(svg).toBeVisible();
  // On the screen, so the mouse can reach every cell: the spec's window is tall enough for the whole board.
  await svg.scrollIntoViewIfNeeded();
  const turn = (await page.getByTestId("meikyuu-board").getAttribute("data-turned")) === "true" ? 1 : 0;
  const seen = await svg.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const [x, y, width, height] = (element.getAttribute("viewBox") ?? "0 0 1 1").split(" ").map(Number);
    return { rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, view: { x: x!, y: y!, width: width!, height: height! } };
  });
  // The drawing is fitted inside its box, never stretched: a shape that is not square leaves room on two sides.
  const scale = Math.min(seen.rect.width / seen.view.width, seen.rect.height / seen.view.height);
  const left = seen.rect.x + (seen.rect.width - seen.view.width * scale) / 2;
  const top = seen.rect.y + (seen.rect.height - seen.view.height * scale) / 2;
  return {
    maze,
    at: (cell) => {
      const [x, y] = toDisplay(turn, maze.grid.centres[cell]!);
      return { x: left + (x - seen.view.x) * scale, y: top + (y - seen.view.y) * scale };
    },
  };
}

/** The one way from the maze's start to its goal, cell by cell. */
export function wayThrough(placed: PlacedMaze): number[] {
  return solutionOf(placed.maze);
}

/** Draws a line through `cells` with the mouse, from the start, and lets go. */
export async function drawThrough(page: Page, placed: PlacedMaze, cells: readonly number[]): Promise<void> {
  const first = placed.at(cells[0]!);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const cell of cells.slice(1)) {
    const to = placed.at(cell);
    await page.mouse.move(to.x, to.y, { steps: 3 });
  }
  await page.mouse.up();
}

/**
 * THE SAME LINE, SENT AS A FAST FINGER SENDS IT: pointer events straight to the board's box, a few cells a frame, each cell's place read from the
 * drawing as it is then (so a view that slides under a line at the edge is followed, as a finger would follow it). For a line of thousands of cells,
 * which a mouse driven through the protocol takes minutes over: a colossal maze's way is up to 5,009. The events are the ones a touch makes (`pointerType:
 * touch`), the same the package's own browser tests send; nothing is handed to the board but pointer events.
 */
export async function drawQuickly(page: Page, placed: PlacedMaze, cells: readonly number[], { perFrame = 12, lift = true }: { perFrame?: number; lift?: boolean } = {}): Promise<void> {
  const turned = (await page.getByTestId("meikyuu-board").getAttribute("data-turned")) === "true";
  await page.locator('[data-testid="meikyuu-board"] .mk-box').evaluate(
    async (box, { cells, centres, turned, perFrame, lift }) => {
      const svg = box.querySelector("svg")!;
      const place = (cell: number) => {
        const rect = svg.getBoundingClientRect();
        const [vx, vy, vw, vh] = svg.getAttribute("viewBox")!.split(" ").map(Number) as [number, number, number, number];
        const [x, y] = centres[cell]!;
        const [px, py] = turned ? [y, -x] : [x, y];
        const scale = Math.min(rect.width / vw, rect.height / vh);
        return { x: rect.x + (rect.width - vw * scale) / 2 + (px - vx) * scale, y: rect.y + (rect.height - vh * scale) / 2 + (py - vy) * scale };
      };
      const send = (type: string, cell: number) => {
        const at = place(cell);
        box.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: "touch", isPrimary: true, button: 0, buttons: type === "pointerup" ? 0 : 1, clientX: at.x, clientY: at.y, bubbles: true, cancelable: true }));
      };
      send("pointerdown", cells[0]!);
      for (let from = 1; from < cells.length; from += perFrame) {
        for (let at = from; at < Math.min(cells.length, from + perFrame); at += 1) send("pointermove", cells[at]!);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      if (lift) send("pointerup", cells[cells.length - 1]!);
    },
    { cells: [...cells], centres: placed.maze.grid.centres.map(([x, y]) => [x, y] as [number, number]), turned, perFrame, lift },
  );
}
