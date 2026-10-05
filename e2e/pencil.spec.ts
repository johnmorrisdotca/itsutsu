import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { pencilEngine } from "../src/lib/puzzles/pencil/engines";
import type { PencilKind } from "../src/lib/puzzles/pencil/pencil.types";
import { shikakuRectsOf } from "../src/lib/puzzles/pencil/shikaku";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { codeOnPage, makeNextMark, makeWrongMark, pressCell } from "./pencil";
import { freshPuzzleSeed, ready } from "./support";

/**
 * THE PENCIL PUZZLES: Shikaku, Akari, Slitherlink, Hitori, Fillomino and
 * Kakuro, all Kazu's. Each is set up on its own screen, solved by pressing the
 * drawn board as a reader does (the answer made out of the same seed the page
 * uses), checked, shown, hinted, kept half done in My games, and found in its
 * family. One case a puzzle, with what is its own in `then`.
 */
const CASES = [
  { kind: "shikaku", size: 5, level: "easy", rule: "its area" },
  { kind: "akari", size: 5, level: "medium", rule: "No bulb may be lit by another" },
  { kind: "slitherlink", size: 4, level: "medium", rule: "single closed loop" },
  { kind: "hitori", size: 5, level: "medium", rule: "no number appears twice" },
  { kind: "fillomino", size: 4, level: "easy", rule: "Two regions of the same size" },
  { kind: "kakuro", size: 10, level: "medium", rule: "no digit may appear twice" },
] as const satisfies readonly { kind: PencilKind; size: number; level: "easy" | "medium" | "hard"; rule: string }[];

async function openPlay(page: Page, kind: PencilKind, size: number, level: string, extra = "") {
  await page.goto(`/games/${PUZZLE_SLUGS[kind]}/play?size=${size}&level=${level}&seed=${freshPuzzleSeed()}${extra}`);
  await ready(page, "puzzle-play");
  const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
  return generatePuzzle(kind, size, level as "easy", seed);
}

for (const { kind, size, level, rule } of CASES) {
  const AT = `/games/${PUZZLE_SLUGS[kind]}`;
  const NAME = PUZZLE_DISPLAY[kind].label;

  test.describe(`${NAME}, for a reader with no account`, () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test(`${kind}: its front door and rules are open, with the package it runs on named`, async ({ page }) => {
      await page.goto(AT);
      await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
      await expect(page.getByTestId("game-family")).toContainText("Pencil puzzles");
      await page.getByTestId("game-rules-link").click();
      await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
      await expect(page.locator("main")).toContainText(rule);
      await expect(page.getByTestId("open-source")).toContainText("Kazu");
    });
  });

  test.describe(NAME, () => {
    test(`${kind}: set up, solved by pressing the board, kept and scored`, async ({ page }) => {
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await page.locator(`[data-testid="set-up-size"][data-size="${size}"]`).click();
      await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", String(size));
      await expect(page.getByTestId("set-up-puzzle-preview").locator("svg")).toBeVisible();
      const levels = page.locator('[data-testid^="puzzle-level-"]');
      if ((await levels.count()) > 1) await page.getByTestId(`puzzle-level-${level}`).click();
      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(new RegExp(`size=${size}`));
      await expect(page).toHaveURL(/seed=\d+/);
      await ready(page, "puzzle-play");
      const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
      const puzzle = generatePuzzle(kind, size, level, seed);
      await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-kind", kind);
      await expect(page.getByTestId("puzzle-grid").locator("svg")).toBeVisible();
      // Nothing written yet: the code is the blank board's, and the clock has not started.
      expect(await codeOnPage(page)).toBe(pencilEngine(kind).blank(size, puzzle.givens));
      await expect(page.getByTestId("puzzle-clock")).toHaveText("0:00");

      for (let step = 0; step < 400; step += 1) {
        if (await makeNextMark(page, kind, size, puzzle.solution) === null) break;
        if (await page.getByTestId("puzzle-done").isVisible()) break;
      }
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      // The board is the answer, and it is the board the server accepted: its own page draws it solved.
      expect(await codeOnPage(page)).toBe(puzzle.solution);
      await page.getByTestId("puzzle-see-solve").click();
      await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", /replay|finished/);
      await expect(page.getByTestId("solve-board").locator("svg").first()).toBeVisible();
      await page.goto(AT);
      await expect(page.getByTestId("puzzle-fastest-rank").first()).toBeVisible();
    });

    test(`${kind}: Check counts a wrong mark, Show marks it, and Hint puts a right one in`, async ({ page }) => {
      const puzzle = await openPlay(page, kind, size, level, "&hints=1");
      const engine = pencilEngine(kind);
      await makeWrongMark(page, kind, size, puzzle.givens, puzzle.solution);
      await page.getByTestId("puzzle-check").click();
      await expect(page.getByTestId("puzzle-checked")).toContainText(/1 \w+ is wrong/);
      const marked = await page.getByTestId("puzzle-grid").locator("svg").innerHTML();
      await page.getByTestId("puzzle-show").click();
      // Show draws the wrong mark in the red of an error, which a board with nothing wrong never has.
      await expect.poll(async () => (await page.getByTestId("puzzle-grid").locator("svg").innerHTML()) !== marked).toBe(true);
      const before = await codeOnPage(page);
      await page.getByTestId("puzzle-hint").click();
      await expect.poll(() => codeOnPage(page)).not.toBe(before);
      const after = await codeOnPage(page);
      // A hint never makes the board worse: it has one wrong mark fewer, or one right mark more.
      const worse = engine.wrong(size, after, puzzle.solution).length > engine.wrong(size, before, puzzle.solution).length;
      expect(worse).toBe(false);
      await expect(page.getByTestId("puzzle-hint")).toContainText("1 used");
    });

    test(`${kind}: left half done it waits in My games and opens where it was left`, async ({ page }) => {
      const puzzle = await openPlay(page, kind, size, level);
      const code = await makeNextMark(page, kind, size, puzzle.solution);
      expect(code).not.toBeNull();
      await page.getByTestId("puzzle-pause").click();
      await expect(page.getByTestId("puzzle-paused")).toBeVisible();
      await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
      await expect(page).toHaveURL(/\/play$/);
      await ready(page, "tabs");
      await page.locator('[data-testid="tab"][data-tab="going"]').click();
      const row = page.locator(`[data-testid="puzzle-going"][data-kind="${kind}"][data-seed="${puzzle.seed}"]`);
      await expect(row).toBeVisible();
      await row.getByTestId("puzzle-going-continue").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-pausable")).toHaveAttribute("data-paused", "false");
      expect(await codeOnPage(page)).toBe(code);
    });
  });
}

test.describe("what is each puzzle's own", () => {
  test("Shikaku: a drag from one corner to the other draws the rectangle, and Remove takes it off", async ({ page }) => {
    const puzzle = await openPlay(page, "shikaku", 5, "easy");
    const rect = shikakuRectsOf(5, puzzle.solution)!.find((each) => each.width * each.height > 1)!;
    const box = (await page.getByTestId("puzzle-grid").locator("svg").boundingBox())!;
    const point = (cell: number) => ({ x: box.x + (((cell % 5) * 48 + 2 + 24) / (5 * 48 + 4)) * box.width, y: box.y + (((Math.floor(cell / 5)) * 48 + 2 + 24) / (5 * 48 + 4)) * box.height });
    const from = point(rect.y * 5 + rect.x);
    const to = point((rect.y + rect.height - 1) * 5 + rect.x + rect.width - 1);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 5 });
    await page.mouse.up();
    await expect.poll(async () => shikakuRectsOf(5, await codeOnPage(page))?.length).toBe(1);
    // Remove, then a press on the rectangle, takes it away.
    await page.getByTestId("shikaku-remove").click();
    await expect(page.getByTestId("shikaku-remove")).toHaveAttribute("aria-pressed", "true");
    await pressCell(page, "shikaku", 5, rect.y * 5 + rect.x);
    await expect.poll(() => codeOnPage(page)).toBe(".".repeat(25));
  });

  test("Akari: a second press takes a bulb out, and a black square takes none", async ({ page }) => {
    const puzzle = await openPlay(page, "akari", 5, "medium");
    const white = [...puzzle.givens].findIndex((character) => character === ".");
    const black = [...puzzle.givens].findIndex((character) => character !== ".");
    await pressCell(page, "akari", 5, white);
    await expect.poll(async () => (await codeOnPage(page))[white]).toBe("o");
    await pressCell(page, "akari", 5, white);
    await expect.poll(async () => (await codeOnPage(page))[white]).toBe(".");
    if (black !== -1) {
      await pressCell(page, "akari", 5, black);
      expect(await codeOnPage(page)).toBe(".".repeat(25));
    }
  });

  test("Fillomino: a printed number cannot be written over, and the keyboard enters a number", async ({ page }) => {
    const puzzle = await openPlay(page, "fillomino", 4, "easy");
    const printed = [...puzzle.givens].findIndex((character) => character !== ".");
    const empty = [...puzzle.givens].findIndex((character) => character === ".");
    await pressCell(page, "fillomino", 4, printed);
    await page.getByTestId("puzzle-key-2").click();
    expect(await codeOnPage(page)).toBe(puzzle.givens);
    await pressCell(page, "fillomino", 4, empty);
    await page.getByTestId("puzzle-grid").locator("[tabindex='0']").focus();
    await page.keyboard.press("3");
    await expect.poll(async () => (await codeOnPage(page))[empty]).toBe("3");
    await page.keyboard.press("Backspace");
    await expect.poll(async () => (await codeOnPage(page))[empty]).toBe(".");
  });

  test("Kakuro: a black cell cannot be chosen, and a digit goes in a white one", async ({ page }) => {
    const puzzle = await openPlay(page, "kakuro", 10, "medium");
    const black = [...puzzle.givens.matchAll(/#/g)].length > 0 ? 0 : -1;
    const white = pencilEngine("kakuro").blank(10, puzzle.givens).indexOf(".");
    if (black !== -1) {
      await pressCell(page, "kakuro", 10, black);
      await page.getByTestId("puzzle-key-5").click();
      expect(await codeOnPage(page)).toBe(pencilEngine("kakuro").blank(10, puzzle.givens));
    }
    await pressCell(page, "kakuro", 10, white);
    await page.getByTestId("puzzle-key-5").click();
    await expect.poll(async () => (await codeOnPage(page))[white]).toBe("5");
  });

  test("Slitherlink: a press on either side of a line is that line, and a second press takes it out", async ({ page }) => {
    await openPlay(page, "slitherlink", 4, "medium");
    const { pressEdge } = await import("./pencil");
    await pressEdge(page, 4, 5);
    await expect.poll(async () => (await codeOnPage(page))[5]).toBe("#");
    await pressEdge(page, 4, 5);
    await expect.poll(async () => (await codeOnPage(page))[5]).toBe(".");
  });

  test("Hitori: a press shades a square and a second clears it", async ({ page }) => {
    await openPlay(page, "hitori", 5, "medium");
    await pressCell(page, "hitori", 5, 6);
    await expect.poll(async () => (await codeOnPage(page))[6]).toBe("#");
    await pressCell(page, "hitori", 5, 6);
    await expect.poll(async () => (await codeOnPage(page))[6]).toBe(".");
  });
});

test.describe("the Pencil puzzles family", () => {
  test("has a page, a tile on the set-up screen, a place on the list of every game, and all six on its shelf", async ({ page }) => {
    await page.goto(`/games/${PUZZLE_SLUGS.shikaku}/family`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pencil puzzles");
    await expect(page.locator('[data-testid="family-mark"][data-family="Pencil puzzles"]').first()).toBeVisible();
    for (const { kind } of CASES) await expect(page.getByTestId("family-games")).toContainText(PUZZLE_DISPLAY[kind].label);

    await page.goto("/games/new");
    await ready(page, "set-up-game");
    const family = page.getByTestId("set-up-family").filter({ hasText: "Pencil puzzles" });
    await family.click();
    await expect(family).toHaveAttribute("data-open", "true");
    await expect(page.getByTestId("set-up-puzzle")).toHaveCount(CASES.length);
    await expect(page.getByTestId("set-up-puzzle").first()).toHaveAttribute("data-kind", "shikaku");
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-kind", "shikaku");

    await page.goto("/games");
    await expect(page.locator("main")).toContainText("Pencil puzzles");
  });

  test("leaves Numbers with its six puzzles and Meikyuu", async ({ page }) => {
    await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/family`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Numbers");
    await expect(page.getByTestId("family-games")).toContainText("Meikyuu");
    await expect(page.getByTestId("family-games")).not.toContainText("Shikaku");
  });
});
