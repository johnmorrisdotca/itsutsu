import { expect, test, type Page } from "@playwright/test";

import { TSUNAGI_4 } from "../src/lib/puzzles/tsunagi/levels/size4.data";
import { TSUNAGI_5 } from "../src/lib/puzzles/tsunagi/levels/size5.data";
import { TSUNAGI_7 } from "../src/lib/puzzles/tsunagi/levels/size7.data";
import { ready } from "./support";

/**
 * TSUNAGI, played as a person plays it: by dragging. Every line here is drawn
 * with the pointer through the centres of the cells (mouse on a desk, a
 * finger on a phone), never set by an address or a stored code, because the
 * drag is the whole of the game (AGENTS.md, "Drive the control, not the
 * mechanism").
 *
 * The levels are fixed data, so the spec reads a level's answer from the same
 * file the site plays and draws each pair's line along it.
 */
const AT = "/games/tsunagi";

type Level = readonly [string, string];

/** A pair's line in a level's answer, as cells from its first stone to its second. */
function answerLine(level: Level, size: number, letter: string): number[] {
  const [layout, answer] = level;
  const line = [layout.indexOf(letter)];
  for (;;) {
    const at = line[line.length - 1]!;
    const row = Math.floor(at / size);
    const next = [at - size, at + 1, at + size, at - 1].find(
      (cell) => cell >= 0 && cell < size * size && answer[cell] === letter && !line.includes(cell) && (Math.abs(cell - at) === size || Math.floor(cell / size) === row),
    );
    if (next === undefined) return line;
    line.push(next);
  }
}

function lettersOf(level: Level): string[] {
  return [...new Set([...level[0]].filter((char) => char !== "." && char !== "#"))];
}

async function centre(page: Page, size: number, cell: number): Promise<{ x: number; y: number }> {
  const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
  return { x: box.x + (((cell % size) + 0.5) * box.width) / size, y: box.y + ((Math.floor(cell / size) + 0.5) * box.height) / size };
}

/** Presses on the first cell and drags through the rest, letting go at the end unless asked to hold. */
async function drag(page: Page, size: number, cells: readonly number[], hold = false) {
  const from = await centre(page, size, cells[0]!);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (const cell of cells.slice(1)) {
    const to = await centre(page, size, cell);
    await page.mouse.move(to.x, to.y, { steps: 4 });
  }
  if (!hold) await page.mouse.up();
}

async function openLevel(page: Page, size: number, level: number) {
  await page.goto(`${AT}/play?size=${size}&seed=${level}`);
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("puzzle-asked")).toContainText(`Level ${level}`);
}

test.describe("Tsunagi", () => {
  // Tall enough for a whole board and its buttons on screen: a drag can only pass through cells the pointer can reach.
  test.use({ viewport: { width: 1280, height: 1100 } });

  test("its front door names it, what it is our version of, and its family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText("Tsunagi");
    await expect(page.getByTestId("inspired-by")).toContainText("Numberlink");
    await expect(page.getByTestId("game-family")).toContainText("Other");
  });

  test("dragging every line along the answer solves level 1, keeps it on the account, and offers level 2", async ({ page }) => {
    const level = TSUNAGI_4[0]!;
    await openLevel(page, 4, 1);
    for (const letter of lettersOf(level)) await drag(page, 4, answerLine(level, 4, letter));
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid/);

    await page.getByTestId("puzzle-next-level").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-asked")).toContainText("Level 2");

    // Kept on the account, not only in this browser: forget the browser's copy and the board of levels still knows.
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(`${AT}/new?size=4`);
    await ready(page, "puzzle-set-up");
    await expect(page.locator('[data-testid="tsunagi-level"][data-level="1"]')).toHaveAttribute("data-state", "solved");
  });

  test("dragging back over a line shortens it cell by cell, without letting go", async ({ page }) => {
    const level = TSUNAGI_7[4]!;
    const longest = lettersOf(level)
      .map((letter) => answerLine(level, 7, letter))
      .sort((a, b) => b.length - a.length)[0]!;
    expect(longest.length).toBeGreaterThanOrEqual(5);
    await openLevel(page, 7, 5);
    await drag(page, 7, longest.slice(0, 5), true);
    const line = page.getByTestId("tsunagi-line");
    await expect(line).toHaveAttribute("data-cells", "5");
    for (const cell of [longest[3]!, longest[2]!]) {
      const to = await centre(page, 7, cell);
      await page.mouse.move(to.x, to.y, { steps: 4 });
    }
    await expect(line).toHaveAttribute("data-cells", "3");
    await page.mouse.up();
    await expect(line).toHaveAttribute("data-cells", "3");
  });

  test("a line drawn into another cuts the other back", async ({ page }) => {
    const level = TSUNAGI_7[5]!;
    const [layout] = level;
    // A stone of one pair beside the middle of another pair's line.
    let found: { cut: string; through: number; from: number; line: number[] } | null = null;
    for (const letter of lettersOf(level)) {
      const line = answerLine(level, 7, letter);
      for (const cell of line.slice(1, -1)) {
        const beside = [cell - 7, cell + 1, cell + 7, cell - 1].find(
          (next) => next >= 0 && next < 49 && layout[next] !== "." && layout[next] !== letter && (Math.abs(next - cell) === 7 || Math.floor(next / 7) === Math.floor(cell / 7)),
        );
        if (beside !== undefined && found === null) found = { cut: letter, through: cell, from: beside, line };
      }
    }
    expect(found).not.toBeNull();
    const { through, from, line } = found!;
    await openLevel(page, 7, 6);
    await drag(page, 7, line);
    const lines = page.getByTestId("tsunagi-line");
    await expect(lines).toHaveCount(1);
    await expect(lines.first()).toHaveAttribute("data-cells", String(line.length));
    await drag(page, 7, [from, through]);
    await expect(page.locator(`[data-testid="puzzle-cell"][data-index="${through}"]`)).toHaveAttribute("data-owner", String(layout.charCodeAt(from) - 65));
    const cutTo = line.indexOf(through);
    // What is left of the first line: the cells before the crossing, or nothing where only its stone was left.
    const left = await page.locator(`[data-testid="tsunagi-line"][data-pair="${found!.cut.charCodeAt(0) - 65}"]`).count();
    if (cutTo <= 1) expect(left).toBe(0);
    else await expect(page.locator(`[data-testid="tsunagi-line"][data-pair="${found!.cut.charCodeAt(0) - 65}"]`)).toHaveAttribute("data-cells", String(cutTo));
  });

  test("a stone tapped clears its line, Undo puts it back, and Restart clears the board", async ({ page }) => {
    const level = TSUNAGI_5[1]!;
    const letter = lettersOf(level)[0]!;
    const line = answerLine(level, 5, letter);
    await openLevel(page, 5, 2);
    await drag(page, 5, line.slice(0, 3));
    await expect(page.getByTestId("tsunagi-line")).toHaveCount(1);
    await drag(page, 5, [line[0]!]);
    await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
    await page.getByTestId("tsunagi-undo").click();
    await expect(page.getByTestId("tsunagi-line")).toHaveAttribute("data-cells", "3");
    await page.getByTestId("tsunagi-restart").click();
    await expect(page.getByTestId("tsunagi-line")).toHaveCount(0);
  });

  test("the board of levels opens a row of ten at a time, and an open level plays", async ({ page }) => {
    // Nine of the first row solved in this browser: the row is not finished, so the second stays shut.
    await page.addInitScript(() => window.localStorage.setItem("itsutsu.tsunagi.solved.6", JSON.stringify(Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => [level, 60_000])))));
    await page.goto(`${AT}/new?size=6`);
    await ready(page, "puzzle-set-up");
    const cell = (level: number) => page.locator(`[data-testid="tsunagi-level"][data-level="${level}"]`);
    await expect(cell(9)).toHaveAttribute("data-state", "solved");
    await expect(cell(10)).toHaveAttribute("data-state", "open");
    await expect(cell(11)).toHaveAttribute("data-state", "locked");
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-level", "10");

    // The tenth solved as well: the second row opens, the third does not.
    await page.addInitScript(() => window.localStorage.setItem("itsutsu.tsunagi.solved.6", JSON.stringify(Object.fromEntries(Array.from({ length: 10 }, (_, at) => [at + 1, 60_000])))));
    await page.reload();
    await ready(page, "puzzle-set-up");
    await expect(cell(11)).toHaveAttribute("data-state", "open");
    await expect(cell(20)).toHaveAttribute("data-state", "open");
    await expect(cell(21)).toHaveAttribute("data-state", "locked");

    await cell(11).click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-asked")).toContainText("Level 11");

    // A shut level asked for by address says so, and offers the way back.
    await openLevelShut(page, 6, 31);
  });

  test("Colours or Numbers: the marbles change, and the choice comes back after a reload", async ({ page }) => {
    await openLevel(page, 4, 3);
    const savedNumbers = page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");
    await page.getByTestId("tsunagi-marks-numbers").click();
    await savedNumbers;
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-marks", "numbers");
    await expect(page.getByTestId("tsunagi-marble").first()).toHaveText("1");
    await page.reload();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-marks", "numbers");
    const savedColours = page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");
    await page.getByTestId("tsunagi-marks-colours").click();
    await savedColours;
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-marks", "colours");
    await expect(page.getByTestId("tsunagi-marble").first()).toHaveText("");
    await page.reload();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-marks", "colours");
  });

  test("Marbles fill a line's cells as it is dragged, Lines turns them off, and the choice comes back after a reload", async ({ page }) => {
    const level = TSUNAGI_4[2]!;
    const longest = lettersOf(level)
      .map((letter) => answerLine(level, 4, letter))
      .sort((a, b) => b.length - a.length)[0]!;
    // A line with cells between its two ends, or there would be nothing to fill.
    expect(longest.length).toBeGreaterThan(2);
    const choose = async (fill: "marbles" | "lines") => {
      const saved = page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");
      await page.getByTestId(`tsunagi-fill-${fill}`).click();
      await saved;
      await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-fill", fill);
    };
    const beads = page.getByTestId("tsunagi-bead");

    await openLevel(page, 4, 3);
    await choose("marbles");
    // Still pressed: the marbles are there while the line is being drawn, one in each cell between its ends.
    await drag(page, 4, longest, true);
    await expect(beads).toHaveCount(longest.length - 2);
    await page.mouse.up();
    const pair = await page.getByTestId("tsunagi-line").first().getAttribute("data-pair");
    for (const bead of await beads.all()) await expect(bead).toHaveAttribute("data-pair", pair!);

    await choose("lines");
    await expect(page.getByTestId("tsunagi-line")).toHaveCount(1);
    await expect(beads).toHaveCount(0);
    await page.reload();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-fill", "lines");

    // And back, which is also how this leaves the account: marbles, as a new player first sees it.
    await choose("marbles");
    await page.reload();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-fill", "marbles");
    await expect(beads).toHaveCount(longest.length - 2);
    await page.getByTestId("tsunagi-restart").click();
    await expect(beads).toHaveCount(0);
  });

  test("a half-drawn level is kept when left, and waits in My games", async ({ page }) => {
    const level = TSUNAGI_5[6]!;
    const letter = lettersOf(level)[0]!;
    const line = answerLine(level, 5, letter);
    await openLevel(page, 5, 7);
    await drag(page, 5, line.slice(0, 3));
    await expect(page.getByTestId("tsunagi-line")).toHaveAttribute("data-cells", "3");
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator('[data-testid="puzzle-going"][data-kind="tsunagi"][data-seed="7"]');
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-asked")).toContainText("Level 7");
    await expect(page.getByTestId("tsunagi-line")).toHaveAttribute("data-cells", "3");
  });
});

async function openLevelShut(page: Page, size: number, level: number) {
  await page.goto(`${AT}/play?size=${size}&seed=${level}`);
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("tsunagi-shut")).toContainText(`Level ${level}`);
}

test.describe("Tsunagi on a phone", () => {
  test.use({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });

  test("a finger drags a line, and the page does not scroll under it", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Touches are sent through Chromium's own input protocol.");
    const level = TSUNAGI_5[2]!;
    const line = answerLine(level, 5, lettersOf(level)[0]!);
    await openLevel(page, 5, 3);
    await page.getByTestId("tsunagi-board").scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    const cdp = await page.context().newCDPSession(page);
    const first = await centre(page, 5, line[0]!);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: first.x, y: first.y }] });
    for (const cell of line.slice(1)) {
      const to = await centre(page, 5, cell);
      for (const step of [0.5, 1]) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: first.x + (to.x - first.x) * step, y: first.y + (to.y - first.y) * step }] });
      }
      first.x = to.x;
      first.y = to.y;
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByTestId("tsunagi-line")).toHaveAttribute("data-cells", String(line.length));
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });
});

/*
 * THE SIZES FIT THE PAGE AT EVERY WIDTH. John, 2026-09-26: beside the board of
 * levels, at narrower desk widths, the size tiles ran off the right edge and
 * "Bigger boards" was cut in half. Measured on both shelves at a phone, the
 * narrow desk widths he named, and a wide one: no sideways scroll, and every
 * tile and the shelf button inside the page and inside the set-up.
 */
for (const width of [390, 820, 1024, 1280]) {
  test(`the set-up's sizes fit the page at ${width}px, on both shelves`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    const fits = async (shelf: string) => {
      const drawn = await page.evaluate(() => {
        const box = (element: Element) => element.getBoundingClientRect();
        const setUp = box(document.querySelector('[data-testid="puzzle-set-up"]')!);
        const parts = [...document.querySelectorAll('[data-testid="tsunagi-sizes"] [data-testid="set-up-size"], [data-testid="tsunagi-more-sizes"]')].map(box);
        return {
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
          right: Math.max(...parts.map((part) => part.right)),
          left: Math.min(...parts.map((part) => part.left)),
          setUpRight: setUp.right,
          tiles: parts.length - 1,
        };
      });
      expect(drawn.tiles, `${shelf}: four size tiles`).toBe(4);
      expect(drawn.scroll, `${shelf}: the page scrolls sideways at ${width}px`).toBeLessThanOrEqual(drawn.client);
      expect(drawn.right, `${shelf}: a size runs off the right edge at ${width}px`).toBeLessThanOrEqual(Math.min(drawn.client, drawn.setUpRight) + 0.5);
      expect(drawn.left).toBeGreaterThanOrEqual(0);
    };
    await fits("4×4 to 7×7");
    // The other shelf, whose button reads the other way, and back: the way there and the way back.
    await page.getByTestId("tsunagi-more-sizes").click();
    await expect(page.getByTestId("tsunagi-more-sizes")).toContainText("Smaller boards");
    await fits("the bigger boards");
    await page.getByTestId("tsunagi-more-sizes").click();
    await expect(page.getByTestId("tsunagi-more-sizes")).toContainText("Bigger boards");
  });
}
