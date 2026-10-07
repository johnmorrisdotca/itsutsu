import { buildMaze, solutionOf } from "@johnmorrisdotca/meikyuu";
import { MEIKYUU_COLOSSAL_LEVELS, MEIKYUU_COLOSSAL_TALL_LEVELS } from "@johnmorrisdotca/meikyuu/levels/colossal";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { mySolvePath, PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { MEIKYUU_COLOSSAL_LEVELS_A_SIZE } from "../src/lib/puzzles/meikyuu/levelCounts";
import { encodeCells } from "../src/lib/puzzles/meikyuu/steps";
import { drawQuickly, placedMaze, wayThrough } from "./meikyuu";
import { memberContext, newestSolveOf, removeMember } from "./members";
import { ready } from "./support";

/**
 * MEIKYUU'S COLOSSAL LEVELS 巨: two lists of 128 mazes of about ten thousand cells, a square box (size 5) and a tall one (64×96, kept as 6496), beside the
 * four sizes and the six tall ones as a shape of their own, so the set-up never has a fifth tile.
 *
 * A colossal maze's way through is up to 5,009 steps, so the lines here are sent as a fast finger sends them (`drawQuickly`), a few cells a frame. What is
 * held: the set-up, the play, the check on the server for the longest answer there is (its size on the wire, and how long the check takes), the kept run
 * drawn again, and the board on a phone and in Just the board.
 */
const AT = `/games/${PUZZLE_SLUGS.meikyuu}`;
const levelUrl = (size: string, level: number, band = "easy") => `${AT}/play?size=${size}&level=${band}&seed=${level}`;

/** The colossal level with the shortest way through it that has no keys (a keyed level is solved by fetching each key first, which these tests do not do). */
function shortest(list: typeof MEIKYUU_COLOSSAL_LEVELS) {
  let best: { level: (typeof list)[number]; length: number } | null = null;
  for (const level of list) {
    if (level.recipe.mode === "keys") continue;
    const length = solutionOf(buildMaze(level.recipe)).length;
    if (best === null || length < best.length) best = { level, length };
  }
  return best!;
}

/** The colossal level with the longest way through it that has no keys. */
function longest(list: typeof MEIKYUU_COLOSSAL_LEVELS) {
  let best: { level: (typeof list)[number]; length: number } | null = null;
  for (const level of list) {
    if (level.recipe.mode === "keys") continue;
    const length = solutionOf(buildMaze(level.recipe)).length;
    if (best === null || length > best.length) best = { level, length };
  }
  return best!;
}

async function aMember(browser: Browser, baseURL: string | undefined, tag: string, view = { width: 1280, height: 1100 }, touch = false): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `meikyuu-colossal-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Meikyuu Colossal" }, { viewport: view, ...(touch ? { hasTouch: true, isMobile: true } : {}) });
  return { context, page: await context.newPage(), email };
}

async function openLevel(page: Page, size: string, level: number, band = "easy") {
  await page.goto(levelUrl(size, level, band));
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
}

test.describe("the Colossal shape on the set-up", () => {
  test("is a third shape beside Square and Tall, two tiles, 128 levels each, and Start plays the level chosen", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "setup");
    try {
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("meikyuu-shape-square")).toHaveAttribute("data-chosen", "true");
      await expect(page.getByTestId("set-up-size")).toHaveCount(4);
      const progressBefore = await page.getByTestId("meikyuu-progress").boundingBox();
      const optionsBefore = await page.getByTestId("puzzle-settings").boundingBox();
      await page.getByTestId("meikyuu-shape-colossal").click();
      await expect(page.getByTestId("meikyuu-shape-colossal")).toHaveAttribute("data-chosen", "true");
      // Two tiles, never a fifth: a square box and a tall one, each with its own words.
      await expect(page.getByTestId("set-up-size")).toHaveCount(2);
      await expect(page.getByTestId("set-up-size-name")).toHaveText(["Colossal", "Colossal tall"]);
      await expect(page.locator('[data-testid="set-up-size"][data-chosen="true"]')).toHaveAttribute("data-size", "5");
      const first = MEIKYUU_COLOSSAL_LEVELS[0]!;
      const preview = page.getByTestId("meikyuu-preview");
      await expect(preview).toHaveAttribute("data-drawn", "true");
      await expect(preview).toHaveAttribute("data-maze", first.code);
      await expect(page.getByTestId("meikyuu-preview-maze").locator("svg")).toBeVisible();
      await expect(page.getByTestId("meikyuu-preview-caption")).toContainText(`Level 1 of ${MEIKYUU_COLOSSAL_LEVELS_A_SIZE} at colossal size: not solved yet.`);
      await expect(page.getByTestId("meikyuu-block")).toContainText("Block 1 of 8 · levels 1–16");
      await expect(page.getByTestId("meikyuu-levels-caption")).toContainText(`Colossal: 0 of ${MEIKYUU_COLOSSAL_LEVELS_A_SIZE} solved.`);
      await expect(page.getByTestId("meikyuu-chip-cells")).toContainText(`${first.cells.toLocaleString("en-US")} cells`);
      // The progress rows keep four rows' room, so nothing under them moves, and the options do not change height.
      await expect(page.getByTestId("meikyuu-progress-row")).toHaveCount(2);
      const progressAfter = await page.getByTestId("meikyuu-progress").boundingBox();
      expect(Math.abs(progressAfter!.height - progressBefore!.height)).toBeLessThanOrEqual(1);
      const optionsAfter = await page.getByTestId("puzzle-settings").boundingBox();
      expect(Math.abs(optionsAfter!.height - optionsBefore!.height)).toBeLessThanOrEqual(1);
      // The last block ends at 128, not 256.
      for (let turn = 0; turn < 7; turn += 1) await page.getByTestId("meikyuu-block-on").click();
      await expect(page.getByTestId("meikyuu-block")).toContainText("Block 8 of 8 · levels 113–128");
      await expect(page.getByTestId("meikyuu-block-on")).toBeDisabled();
      await page.locator('[data-testid="meikyuu-level"][data-level="128"]').click();
      await expect(preview).toHaveAttribute("data-maze", MEIKYUU_COLOSSAL_LEVELS[127]!.code);
      await expect(page.getByTestId("puzzle-solve")).toContainText("Start level 128");

      // The tall one: 64×96, upright in the preview, and the way-up choice is live for it.
      await page.locator('[data-testid="set-up-size"][data-size="6496"]').click();
      await expect(preview).toHaveAttribute("data-size", "6496");
      await expect(preview).toHaveAttribute("data-maze", MEIKYUU_COLOSSAL_TALL_LEVELS[0]!.code);
      await expect(page.getByTestId("meikyuu-wayup")).toHaveAttribute("data-active", "true");
      await expect(page.getByTestId("meikyuu-preview-caption")).toContainText(`Level 1 of ${MEIKYUU_COLOSSAL_LEVELS_A_SIZE} at colossal tall 64×96 size`);
      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(/size=64x96&level=easy&seed=1$/);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-maze", MEIKYUU_COLOSSAL_TALL_LEVELS[0]!.code);
      await expect(page.getByTestId("puzzle-asked")).toContainText(`Colossal tall 64×96 · Level 1 of ${MEIKYUU_COLOSSAL_LEVELS_A_SIZE}`);

      // Back on the squares, as they were: four tiles.
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("set-up-size")).toHaveCount(4);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the front door counts a member's progress through the colossal sizes, and the address opens one", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "door");
    try {
      await page.goto(AT);
      await expect(page.getByTestId("meikyuu-levels-line")).toContainText("128 in each of two colossal ones");
      const rows = page.getByTestId("meikyuu-front-progress").getByTestId("meikyuu-progress-row");
      await expect(rows).toHaveCount(4 + 6 + 2 + 18);
      await expect(page.getByTestId("meikyuu-front-progress").locator('[data-testid="meikyuu-progress-row"][data-size="5"]')).toContainText("0 of 128");
      await expect(page.getByTestId("meikyuu-front-progress").locator('[data-testid="meikyuu-progress-row"][data-size="6496"]')).toContainText("64×96");
      await page.goto(`${AT}/new?size=64x96`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("meikyuu-shape-colossal")).toHaveAttribute("data-chosen", "true");
      await expect(page.locator('[data-testid="set-up-size"][data-chosen="true"]')).toHaveAttribute("data-size", "6496");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});

test.describe("playing a colossal maze", () => {
  test("the shortest square one is solved by drawing the line, paid, and kept, and its page draws it", async ({ browser, baseURL }) => {
    const { level, length } = shortest(MEIKYUU_COLOSSAL_LEVELS);
    const { context, page, email } = await aMember(browser, baseURL, "solve");
    try {
      await openLevel(page, "5", level.number);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-maze", level.code);
      await expect(page.getByTestId("puzzle-asked")).toContainText(`Colossal · Level ${level.number} of ${MEIKYUU_COLOSSAL_LEVELS_A_SIZE}`);
      await expect(page.getByTestId("meikyuu-board").locator("svg")).toHaveAttribute("data-cells", String(level.cells));
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      expect(way.length).toBe(length);
      await drawQuickly(page, placed, way);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", String(way.length));
      await page.goto(mySolvePath("meikyuu", await newestSolveOf(email, "meikyuu")));
      await ready(page, "solve-board");
      await expect(page.getByTestId("meikyuu-still")).toHaveAttribute("data-drawn", "true");
      await expect(page.getByTestId("meikyuu-still").locator("svg")).toBeVisible();
      await expect(page.getByTestId("solve-level")).toContainText(`${level.number}, easy`);
      // The board of levels at the colossal size counts it.
      await page.goto(`${AT}/new?size=5`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("meikyuu-levels-caption")).toContainText(`Colossal: 1 of ${MEIKYUU_COLOSSAL_LEVELS_A_SIZE} solved.`);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the longest answer there is, 5,009 steps, goes to the server in a few kilobytes, is checked in a moment, and is paid", async ({ browser, baseURL }, info) => {
    const { level, length } = longest(MEIKYUU_COLOSSAL_LEVELS);
    expect(length).toBeGreaterThan(4000);
    const { context, page, email } = await aMember(browser, baseURL, "longest");
    try {
      await openLevel(page, "5", level.number, "hard");
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      const answer = encodeCells(placed.maze, way)!;
      let sent = 0;
      page.on("request", (request) => {
        if (request.url().endsWith("/api/puzzles/solved") && request.method() === "POST") sent = (request.postData() ?? "").length;
      });
      await drawQuickly(page, placed, way);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved", { timeout: 60_000 });
      expect(sent, "the request carries the whole answer").toBeGreaterThan(answer.length);
      expect(sent, "and a few kilobytes at most").toBeLessThan(8_000);
      info.annotations.push({ type: "request", description: `${sent} characters sent for a ${answer.length}-step answer` });
      // The server's own check, asked directly of the same answer: how long it takes to walk 5,009 steps and say yes.
      const asked = Date.now();
      const checked = await page.request.post("/api/puzzles/solved", { data: { kind: "meikyuu", size: 5, level: "hard", seed: level.number, givens: level.code, answer, elapsedMs: 9000 } });
      const took = Date.now() - asked;
      expect(checked.status()).toBe(200);
      info.annotations.push({ type: "check", description: `${took} ms for the whole request, the check of a ${answer.length}-step answer in it` });
      expect(took).toBeLessThan(5_000);
      // A line one step short, and a line with stones tacked on, are no answer.
      const handed = (body: object) => page.request.post("/api/puzzles/solved", { data: { kind: "meikyuu", size: 5, level: "hard", seed: level.number, givens: level.code, elapsedMs: 9000, ...body } });
      expect((await handed({ answer: answer.slice(0, -1) })).status()).toBe(422);
      expect((await handed({ answer: `${answer}~1a.2f` })).status()).toBe(422);
      expect((await handed({ answer, size: 6496 })).status()).toBe(422);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the tall one lies down on a desk and stands on a phone, and is drawn through either way", async ({ browser, baseURL }) => {
    const { level } = shortest(MEIKYUU_COLOSSAL_TALL_LEVELS);
    const { context, page, email } = await aMember(browser, baseURL, "tall", { width: 390, height: 844 }, true);
    try {
      await openLevel(page, "64x96", level.number);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-maze", level.code);
      // On a phone held upright it stands upright, and the page does not scroll sideways.
      await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-stand", "upright");
      const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      expect(scroll).toBeLessThanOrEqual(inner);
      const placed = await placedMaze(page);
      const way = wayThrough(placed);
      await drawQuickly(page, placed, way.slice(0, 40));
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-cells", "40");
      await drawQuickly(page, placed, way.slice(39));
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved", { timeout: 60_000 });
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});
