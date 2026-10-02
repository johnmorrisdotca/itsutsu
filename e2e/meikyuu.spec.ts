import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { MEIKYUU_MAZE_LEVELS, sizeOf } from "@johnmorrisdotca/meikyuu/levels";

import { mySolvePath, PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { MEIKYUU_LEVEL_COUNTS } from "../src/lib/puzzles/meikyuu/levelCounts";
import { encodeCells } from "../src/lib/puzzles/meikyuu/steps";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { drawThrough, placedMaze, wayThrough } from "./meikyuu";
import { memberContext, newestSolveOf, removeMember } from "./members";
import { ready } from "./support";

/**
 * MEIKYUU 迷宮: a maze to draw a line through, from the start to the goal, in
 * 1,000 fixed levels of four sizes.
 *
 * Every line here is drawn as a player draws one, with the mouse pressed on the
 * start and taken through the middle of each cell of the way (`e2e/meikyuu.ts`),
 * and every level is the package's own, found again from the same list the page
 * reads. Each case is a member of its own, made for it and taken away after, so
 * what it counts is its own: levels solved, runs kept, and nothing another run
 * left. The package holds its mazes to their rules (every level rebuilt, proved
 * a perfect maze and solved by drawing); what is held here is the site's side:
 * the set-up, the play, the kept run, the check the server runs and the page a
 * solve keeps.
 */
const KIND = "meikyuu";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;

/** A level's address, as the set-up's Start writes it. */
const levelUrl = (size: number, level: number, band = "easy") => `${AT}/play?size=${size}&level=${band}&seed=${level}`;

/** The package's levels of one size, in its order: what the page calls level 1, 2, 3 of that size. */
const WORDS = ["small", "medium", "large", "huge"] as const;
const levelsOf = (size: number) => MEIKYUU_MAZE_LEVELS.filter((level) => sizeOf(level.cells) === WORDS[size - 1]);

/** A fresh member's context, and the member's address for taking them away. */
async function aMember(browser: Browser, baseURL: string | undefined, tag: string): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `meikyuu-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  // A window tall enough for the whole board and the buttons under it: a mouse can only press what is on the screen.
  const context = await memberContext(browser, baseURL!, { email, name: "Meikyuu Player" }, { viewport: { width: 1280, height: 1100 } });
  return { context, page: await context.newPage(), email };
}

const cellsDrawn = async (page: Page) => Number(await page.getByTestId("puzzle-play").getAttribute("data-cells"));

/** The play screen, its board drawn and the browser in charge of it. */
async function openLevel(page: Page, size: number, level: number, band = "easy") {
  await page.goto(levelUrl(size, level, band));
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
}

test.describe("Meikyuu, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, under our own name, in the Numbers family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("also-known-as")).toContainText("Maze");
    await expect(page.getByTestId("game-family")).toContainText("Numbers");
    await expect(page.getByTestId("meikyuu-levels-line")).toContainText(`${MEIKYUU_LEVEL_COUNTS[1]} small, ${MEIKYUU_LEVEL_COUNTS[2]} medium, ${MEIKYUU_LEVEL_COUNTS[3]} large, ${MEIKYUU_LEVEL_COUNTS[4]} huge levels`);
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.locator("main")).toContainText("Every maze has exactly one way through");
  });
});

test.describe("the Meikyuu levels", () => {
  test("the set-up draws the chosen level's maze live, in four sizes, and Start plays the level chosen", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "setup");
    try {
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      // Four sizes, one tile each, the package's words for how big a maze is.
      const sizes = page.getByTestId("set-up-size");
      await expect(sizes).toHaveCount(4);
      await expect(page.getByTestId("set-up-size-name")).toHaveText(["Small", "Medium", "Large", "Huge"]);
      // The preview is level 1's own maze, drawn from its recipe once the list has arrived.
      const preview = page.getByTestId("meikyuu-preview");
      await expect(preview).toHaveAttribute("data-drawn", "true");
      await expect(preview).toHaveAttribute("data-maze", levelsOf(1)[0]!.code);
      await expect(page.getByTestId("meikyuu-preview-maze")).toHaveAttribute("data-drawn", "true");
      await expect(page.getByTestId("meikyuu-preview-maze").locator("svg")).toBeVisible();
      await expect(page.getByTestId("meikyuu-preview-caption")).toContainText(`Level 1 of ${MEIKYUU_LEVEL_COUNTS[1]} at small size: not solved yet.`);
      await expect(page.getByTestId("puzzle-solve")).toContainText("Start level 1");

      // Another size is another list and another maze.
      await page.locator('[data-testid="set-up-size"][data-size="3"]').click();
      await expect(preview).toHaveAttribute("data-size", "3");
      await expect(preview).toHaveAttribute("data-maze", levelsOf(3)[0]!.code);
      await expect(page.getByTestId("meikyuu-preview-caption")).toContainText(`Level 1 of ${MEIKYUU_LEVEL_COUNTS[3]} at large size`);

      // Every level is open: any can be chosen, the preview shows it, and Start plays it. A block of sixteen at a time.
      await expect(page.getByTestId("meikyuu-block")).toContainText(`Block 1 of 18 · levels 1–16`);
      await page.getByTestId("meikyuu-block-on").click();
      await expect(page.getByTestId("meikyuu-block")).toContainText("Block 2 of 18 · levels 17–32");
      const twenty = page.locator('[data-testid="meikyuu-level"][data-level="20"]');
      await expect(twenty).toHaveAttribute("data-state", "open");
      await twenty.click();
      await expect(preview).toHaveAttribute("data-level", "20");
      await expect(preview).toHaveAttribute("data-maze", levelsOf(3)[19]!.code);
      await expect(page.getByTestId("puzzle-solve")).toContainText("Start level 20");
      // What the level is, before it is started: how hard, what shape, how played and how big.
      await expect(page.getByTestId("meikyuu-chip-difficulty")).toBeVisible();
      await expect(page.getByTestId("meikyuu-chip-shape")).toBeVisible();
      await expect(page.getByTestId("meikyuu-chip-way")).toBeVisible();
      await expect(page.getByTestId("meikyuu-chip-cells")).toContainText(`${levelsOf(3)[19]!.cells.toLocaleString("en-US")} cells`);

      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(/size=3&level=easy&seed=20$/);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-asked")).toContainText(`Large · Level 20 of ${MEIKYUU_LEVEL_COUNTS[3]}`);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-maze", levelsOf(3)[19]!.code);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  for (const width of [390, 1280]) {
    test(`choosing another size or level moves nothing on the set-up screen, ${width}px wide`, async ({ browser, baseURL }) => {
      const { context, page, email } = await aMember(browser, baseURL, `steady-${width}`);
      try {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${AT}/new`);
        await ready(page, "puzzle-set-up");
        const reading = async () =>
          page.evaluate(() => {
            const preview = document.querySelector('[data-testid="meikyuu-preview"] > div')!.getBoundingClientRect();
            const panel = document.querySelector('[data-testid="puzzle-set-up"]')!.getBoundingClientRect();
            const play = document.querySelector('[data-testid="puzzle-play-buttons"]')!.getBoundingClientRect();
            return { box: `${Math.round(preview.width)}×${Math.round(preview.height)}`, bottom: Math.round(panel.bottom - panel.top), play: Math.round(play.top - panel.top) };
          });
        const preview = page.getByTestId("meikyuu-preview");
        await expect(preview).toHaveAttribute("data-drawn", "true");
        // The level's chips are in place before anything is chosen, so the Start column is the height it stays.
        await expect(page.getByTestId("meikyuu-chips")).toBeVisible();
        const first = await reading();
        for (const size of ["2", "4", "3", "1"]) {
          await page.locator(`[data-testid="set-up-size"][data-size="${size}"]`).click();
          await expect(preview).toHaveAttribute("data-size", size);
          await expect(preview).toHaveAttribute("data-drawn", "true");
          expect(await reading(), `after choosing size ${size}`).toEqual(first);
        }
        await page.getByTestId("meikyuu-block-on").click();
        await page.locator('[data-testid="meikyuu-level"][data-level="20"]').click();
        await expect(preview).toHaveAttribute("data-level", "20");
        expect(await reading()).toEqual(first);
      } finally {
        await context.close();
        await removeMember(email);
      }
    });
  }

  test("level 2 at small is solved by drawing the line, paid, kept, and offers the next level and the board of levels", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "solve");
    try {
      await openLevel(page, 1, 2);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-level", "2");
      await expect(page.getByTestId("puzzle-asked")).toContainText(`Small · Level 2 of ${MEIKYUU_LEVEL_COUNTS[1]}`);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-maze", levelsOf(1)[1]!.code);
      // A level has no hint and no countdown, and Undo and Restart have nothing to take back yet.
      await expect(page.getByTestId("puzzle-hint")).toHaveCount(0);
      await expect(page.getByTestId("meikyuu-undo")).toBeDisabled();
      await expect(page.getByTestId("meikyuu-restart")).toBeDisabled();
      await expect(page.getByTestId("meikyuu-said")).toContainText("Press the start dot and drag");

      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      await drawThrough(page, placed, way);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", String(way.length));
      // The way on is the next level and the board of levels, not Another.
      await expect(page.getByTestId("puzzle-another")).toHaveCount(0);
      await expect(page.getByTestId("puzzle-next-level")).toContainText("Level 1, the first one you have not finished");
      await expect(page.getByTestId("meikyuu-level-fastest")).toContainText("Fastest on level 2");

      // The board of levels shows it solved, with its time, and the preview draws the way through it.
      await page.getByTestId("puzzle-all-levels").click();
      await ready(page, "puzzle-set-up");
      const tile = page.locator('[data-testid="meikyuu-level"][data-level="2"]');
      await expect(tile).toHaveAttribute("data-state", "solved");
      await expect(page.getByTestId("meikyuu-levels-caption")).toContainText(`Small: 1 of ${MEIKYUU_LEVEL_COUNTS[1]} solved.`);
      await tile.click();
      await expect(page.getByTestId("meikyuu-preview")).toHaveAttribute("data-state", "solved");
      await expect(page.getByTestId("meikyuu-preview-caption")).toContainText("solved, best");

      // Opened again, a solved level shows how it ended, and only Play it again starts it over.
      await page.getByTestId("puzzle-solve").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("meikyuu-solved-view")).toContainText("Solved, best");
      await page.getByTestId("meikyuu-play-again").click();
      await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
      expect(await cellsDrawn(page)).toBe(0);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a solve is kept, and its page draws the line it was solved with", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "page");
    try {
      await openLevel(page, 1, 3);
      const placed = await placedMaze(page);
      await drawThrough(page, placed, wayThrough(placed));
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      // The solve is a row of the account's (a level's card offers the next level and the board of levels, not a replay): its own page.
      await page.goto(mySolvePath(KIND, await newestSolveOf(email, KIND)));
      await ready(page, "solve-board");
      await expect(page.getByTestId("meikyuu-still")).toHaveAttribute("data-drawn", "true");
      await expect(page.getByTestId("meikyuu-still").locator("svg")).toBeVisible();
      await expect(page.getByTestId("solve-level")).toContainText("3, easy");
      await expect(page.getByTestId("solve-outcome")).toContainText("Solved");
      await expect(page.getByTestId("solve-note-finished")).toContainText("the line drawn from the start to the goal");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the line follows the corridors, cannot pass a wall, and Undo and Restart take it back", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "line");
    try {
      await openLevel(page, 2, 6, "easy");
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      // Dragged straight across the maze, the line gets no further than the first wall it meets: it is not a cut through.
      const far = placed.at(placed.maze.grid.cells - 1);
      const from = placed.at(way[0]!);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(far.x, far.y, { steps: 40 });
      await page.mouse.up();
      expect(await cellsDrawn(page), "a line through the walls").toBeLessThan(way.length);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "false");

      // Undo takes the stroke back to nothing, and with nothing drawn it has nothing to take back.
      await page.getByTestId("meikyuu-restart").click();
      expect(await cellsDrawn(page)).toBe(0);
      await expect(page.getByTestId("meikyuu-restart")).toBeDisabled();
      // Pressing a button may have moved the page: where the cells are is read again.
      const again = await placedMaze(page);
      await drawThrough(page, again, way.slice(0, 6));
      expect(await cellsDrawn(page)).toBe(6);
      // A second stroke, drawing back along the first: the line shortens.
      await page.mouse.move(again.at(way[5]!).x, again.at(way[5]!).y);
      await page.mouse.down();
      await page.mouse.move(again.at(way[3]!).x, again.at(way[3]!).y, { steps: 4 });
      await page.mouse.up();
      expect(await cellsDrawn(page)).toBe(4);
      await page.getByTestId("meikyuu-undo").click();
      expect(await cellsDrawn(page)).toBe(6);
      await page.getByTestId("meikyuu-undo").click();
      expect(await cellsDrawn(page)).toBe(0);
      await expect(page.getByTestId("meikyuu-undo")).toBeDisabled();
      await expect(page.getByTestId("meikyuu-said")).toContainText("Press the start dot and drag");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a level left half drawn is in My games, opens with its line drawn again, and finishes", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "kept");
    try {
      await openLevel(page, 2, 9, "easy");
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      await drawThrough(page, placed, way.slice(0, 12));
      expect(await cellsDrawn(page)).toBe(12);
      await page.getByTestId("puzzle-pause").click();
      await expect(page.getByTestId("puzzle-paused")).toBeVisible();

      // Clicked away by the site's own navigation: it waits in My games, named by its level.
      await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
      await expect(page).toHaveURL(/\/play$/);
      await ready(page, "tabs");
      await page.locator('[data-testid="tab"][data-tab="going"]').click();
      const row = page.locator(`[data-testid="puzzle-going"][data-kind="meikyuu"][data-seed="9"]`);
      await expect(row, "the level left unfinished is not in My games").toBeVisible();
      await expect(row).toContainText("Medium · Level 9");
      await expect(row.getByTestId("puzzle-going-levels")).toBeVisible();

      await row.getByTestId("puzzle-going-continue").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-pausable")).toHaveAttribute("data-paused", "false");
      // Opened where it was left: the same line, drawn again, and running.
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", "12");
      await expect(page.getByTestId("meikyuu-undo")).toBeEnabled();
      const again = await placedMaze(page);
      await drawThrough(page, again, way.slice(11));
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");

      // Solved, it is no longer going.
      await page.goto("/play");
      await expect(page.getByTestId("my-games")).toBeVisible();
      await expect(page.locator(`[data-testid="puzzle-going"][data-kind="meikyuu"][data-seed="9"]`), "a solved level is still listed as going").toHaveCount(0);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the server pays for the way through a level and for nothing else", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "check");
    try {
      const level = levelsOf(1)[3]!;
      await openLevel(page, 1, 4);
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      const answer = encodeCells(placed.maze, way)!;
      const handed = (body: object) => page.request.post("/api/puzzles/solved", { data: { kind: KIND, size: 1, level: "easy", seed: 4, givens: level.code, elapsedMs: 5000, ...body } });
      // A line one step short, a line twice over, a maze that is no level's, and a size it is not of: each refused, none paid.
      expect((await handed({ answer: answer.slice(0, -1) })).status()).toBe(422);
      expect((await handed({ answer: answer + answer })).status()).toBe(422);
      expect((await handed({ answer, givens: "square:3x3:prim:enter-leave:1" })).status()).toBe(422);
      expect((await handed({ answer, size: 2 })).status()).toBe(422);
      const paid = await handed({ answer });
      expect(paid.status()).toBe(200);
      expect(((await paid.json()) as { ok: boolean }).ok).toBe(true);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a huge maze is zoomed with the buttons and fitted back", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "zoom");
    try {
      await openLevel(page, 4, 1, "easy");
      const viewWidth = async () => Number(((await page.locator('[data-testid="meikyuu-board"] svg').first().getAttribute("viewBox")) ?? "0 0 0 0").split(" ")[2]);
      const whole = await viewWidth();
      await page.getByTestId("meikyuu-zoom-in").click();
      await page.getByTestId("meikyuu-zoom-in").click();
      await expect.poll(viewWidth, "zooming in shows less of the maze").toBeLessThan(whole);
      await page.getByTestId("meikyuu-fit").click();
      await expect.poll(viewWidth, "Fit shows all of it again").toBeCloseTo(whole, 0);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("on a phone the board fits, and a finger draws the line", async ({ browser, baseURL }) => {
    const email = `meikyuu-phone-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
    const context = await memberContext(browser, baseURL!, { email, name: "Meikyuu Phone" }, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    try {
      const page = await context.newPage();
      await openLevel(page, 2, 3);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "the page runs wider than the screen").toBeLessThanOrEqual(0);
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      // A real touch: pressed on the start, moved through the cells, lifted (the mouse is not a finger).
      const touch = await context.newCDPSession(page);
      const send = (type: "touchStart" | "touchMove" | "touchEnd", cell: number) =>
        touch.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ ...placed.at(cell), id: 1 }] });
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
});
