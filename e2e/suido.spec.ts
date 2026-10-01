import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { decodeLayout, flowOf, hintFor, isLocked, makeSuido, newGame, quartersBetween, shapeOf, turn, turnAt, type Game } from "@johnmorrisdotca/suido";
import { levelAnswer, levelSolution, type LevelRow } from "@johnmorrisdotca/suido/levels";
import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
import { SUIDO_8X14 } from "@johnmorrisdotca/suido/levels-8x14";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { suidoKindOfSeed } from "../src/lib/puzzles/suido/seed";
import { removeMember, memberContext } from "./members";
import { suidoLevelSeed } from "../src/lib/puzzles/suido/seed";
import { freshPuzzleSeed, ready } from "./support";

/**
 * SUIDO 水道: a square of pipe pieces that can only be turned, a pump, and
 * water that runs through every opening that meets another. Done when it
 * reaches what the kind asks and nothing leaks.
 *
 * Every piece here is turned as a reader turns one — a click on it, or the
 * keys — from the answer the spec makes out of the same seed the page uses
 * (`generatePuzzle`, which is the package's own board), and the water the page
 * draws is held to the water the package says the pieces make (`flowOf`):
 * after every turn, as many cells wet as there should be.
 */
const KIND = "suido";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;

type Played = { dealt: Game; answer: number[] };

function playedOf(size: number, level: "easy" | "medium" | "hard", seed: number): Played {
  const puzzle = generatePuzzle(KIND, size, level, seed);
  return { dealt: newGame(puzzle.givens)!, answer: decodeLayout(puzzle.solution)!.cells };
}

/** The pieces to turn, in the order the water needs them (nearest the pump first), each with the clockwise turns it takes. */
function turnsToSolve({ dealt, answer }: Played): { cell: number; turns: number; after: Game }[] {
  const steps: { cell: number; turns: number; after: Game }[] = [];
  let game = dealt;
  for (;;) {
    const cell = hintFor(game, answer);
    if (cell === null) return steps;
    const turns = quartersBetween(game.masks[cell]!, answer[cell]!)!;
    for (let each = 0; each < turns; each += 1) game = turnAt(game, cell);
    steps.push({ cell, turns, after: game });
  }
}

function pieces(page: Page) {
  return page.getByTestId("suido-cell");
}
const wet = (page: Page) => page.locator('[data-testid="suido-cell"][data-wet="true"]');

/** How many cells the package says are wet when the pieces face as `game` has them. */
function wetCount(game: Game): number {
  return flowOf(game.start, game.masks).wet.filter(Boolean).length;
}

test.describe("Suido, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, under our own name, in the Logic puzzles family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("pipe-turning puzzle");
    await expect(page.getByTestId("game-family")).toContainText("Logic puzzles");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.locator("main")).toContainText("A drip shows where");
    // The names of the falling-pipes video games are other games: never used here.
    await expect(page.locator("main")).not.toContainText(/pipe mania|pipe dream|plumber/i);
  });
});

test.describe("the Suido puzzle", () => {
  test("set up at 5×5 as a network, then solved by turning pieces, the water reaching further with each", async ({ page }) => {
    await page.goto(`${AT}/new?mode=make`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="5"]').click();
    await page.getByTestId("puzzle-level-easy").click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", "5");
    // Drains is the usual kind and leaves the address alone; Network says so, until a seed is drawn.
    await expect(page.getByTestId("suido-kind-drains")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-solve")).not.toHaveAttribute("href", /pipes=/);
    await page.getByTestId("suido-kind-network").click();
    await expect(page.getByTestId("suido-kind-network")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /pipes=network/);
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/size=5/);
    await expect(page).toHaveURL(/seed=\d+/);
    await ready(page, "puzzle-play");
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    // The seed says it is a network from now on, and the address no longer needs to.
    expect(suidoKindOfSeed(seed)).toBe("network");
    await expect(page).not.toHaveURL(/pipes=/);

    const played = playedOf(5, "easy", seed);
    await expect(pieces(page)).toHaveCount(25);
    // A network has a piece in every cell, and the board as dealt has the water where the package says.
    await expect(wet(page)).toHaveCount(wetCount(played.dealt));
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", /^5x5:/);
    await expect(page.getByTestId("suido-said")).toContainText("Tap a piece");

    const steps = turnsToSolve(played);
    expect(steps.length).toBeGreaterThan(0);
    for (const [at, step] of steps.entries()) {
      for (let each = 0; each < step.turns; each += 1) await pieces(page).nth(step.cell).click();
      await expect(pieces(page).nth(step.cell)).toHaveAttribute("data-mask", String(played.answer[step.cell]));
      // The water the page draws is the water the pieces make.
      await expect(wet(page)).toHaveCount(wetCount(step.after));
      if (at === 0) await expect(page.getByTestId("suido-said")).toContainText("pieces wet");
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
    // Every piece wet, and nothing left to turn once it is done.
    await expect(wet(page)).toHaveCount(25);
    const before = await pieces(page).first().getAttribute("data-mask");
    await pieces(page).first().click({ force: true });
    await expect(pieces(page).first()).toHaveAttribute("data-mask", before!);

    // Kept and scored: its own page draws it solved, and the fastest table has it.
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("solve-board").locator('[data-testid="suido-cell"][data-wet="true"]')).toHaveCount(25);
    await page.goto(AT);
    await expect(page.getByTestId("puzzle-fastest-rank").first()).toBeVisible();
    await expect(page.getByTestId("puzzle-points")).toContainText("every piece of pipe");
  });

  test("a drains board is solved the same way, and its spare pieces may be left as they were", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const played = playedOf(7, "medium", seed);
    expect(suidoKindOfSeed(seed)).toBe("drains");
    await page.goto(`${AT}/play?size=7&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", /^7x7d:/);
    for (const step of turnsToSolve(played)) {
      for (let each = 0; each < step.turns; each += 1) await pieces(page).nth(step.cell).click();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
  });

  test("a piece turns clockwise by default and the other way when chosen, by Shift or by a right click", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const { dealt } = playedOf(7, "medium", seed);
    // A piece that looks different turned (an end, an elbow or a T), and not in the last column, so an arrow key has somewhere to go.
    const cell = dealt.masks.findIndex((mask, at) => ["end", "elbow", "tee"].includes(shapeOf(mask)) && at % 7 !== 6);
    expect(cell).toBeGreaterThanOrEqual(0);
    const start = dealt.masks[cell]!;
    await page.goto(`${AT}/play?size=7&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    const piece = pieces(page).nth(cell);
    await expect(piece).toHaveAttribute("data-mask", String(start));

    await piece.click();
    await expect(piece).toHaveAttribute("data-mask", String(turn(start, 1)));
    await page.getByTestId("suido-way-anticlockwise").click();
    await expect(page.getByTestId("suido-way-anticlockwise")).toHaveAttribute("aria-checked", "true");
    await piece.click();
    await expect(piece).toHaveAttribute("data-mask", String(start));
    // The way chosen, Shift turns it the other way again; and a right click always turns it back.
    await piece.click({ modifiers: ["Shift"] });
    await expect(piece).toHaveAttribute("data-mask", String(turn(start, 1)));
    await page.getByTestId("suido-way-clockwise").click();
    await piece.click({ button: "right" });
    await expect(piece).toHaveAttribute("data-mask", String(start));
    // And the keys: the arrows move one piece at a time, Enter turns it, Shift with Enter turns it back.
    await piece.focus();
    await page.keyboard.press("Enter");
    await expect(piece).toHaveAttribute("data-mask", String(turn(start, 1)));
    await page.keyboard.press("Shift+Enter");
    await expect(piece).toHaveAttribute("data-mask", String(start));
    await page.keyboard.press("ArrowRight");
    await expect(pieces(page).nth(cell + 1)).toBeFocused();
  });

  test("left half way, it waits in My games and opens where it was left", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const played = playedOf(9, "medium", seed);
    const [first] = turnsToSolve(played);
    await page.goto(`${AT}/play?size=9&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    for (let each = 0; each < first!.turns; each += 1) await pieces(page).nth(first!.cell).click();
    await expect(pieces(page).nth(first!.cell)).toHaveAttribute("data-mask", String(played.answer[first!.cell]));
    const code = await page.getByTestId("puzzle-play").getAttribute("data-code");
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"][data-seed="${seed}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-pausable")).toHaveAttribute("data-paused", "false");
    // The board as it was left, piece for piece, and the water in it.
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", code!);
    await expect(pieces(page).nth(first!.cell)).toHaveAttribute("data-mask", String(played.answer[first!.cell]));
    await expect(wet(page)).toHaveCount(wetCount(first!.after));
  });

  test("with hints chosen, Hint turns the next piece to face the way the answer has it, and lights it", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const played = playedOf(7, "easy", seed);
    const [first] = turnsToSolve(played);
    await page.goto(`${AT}/play?size=7&level=easy&seed=${seed}&hints=1`);
    await ready(page, "puzzle-play");
    const hint = page.getByTestId("puzzle-hint");
    await expect(hint).toHaveAttribute("data-allowed", "true");
    await hint.click();
    await expect(hint).toContainText("1 used");
    await expect(pieces(page).nth(first!.cell)).toHaveAttribute("data-mask", String(played.answer[first!.cell]));
    await expect(pieces(page).nth(first!.cell)).toHaveAttribute("data-hint", "true");
    await expect(wet(page)).toHaveCount(wetCount(first!.after));
    // Lit until the next turn.
    const other = pieces(page).nth((first!.cell + 1) % 49);
    await other.click({ force: true });
    await expect(pieces(page).nth(first!.cell)).not.toHaveAttribute("data-hint", "true");
  });

  test("just the board: the pieces, the water and a few buttons in a modal, and Esc leaves", async ({ page }) => {
    await page.goto(`${AT}/play?size=7&level=easy&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    await ready(page, "bare-board");
    await page.getByTestId("bare-board-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
    await expect(pieces(page)).toHaveCount(49);
    await expect(pieces(page).first()).toBeVisible();
    // Still played in the modal.
    const target = pieces(page).nth(24);
    const before = Number(await target.getAttribute("data-mask"));
    await target.click({ force: true });
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", /.+/);
    expect([before, turn(before, 1)]).toContain(Number(await target.getAttribute("data-mask")));
    await page.keyboard.press("Escape");
    await expect(page.locator("html")).not.toHaveAttribute("data-bare", "true");
  });

  test("a 12×12 on a phone fits the screen, zooms, and fits back", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${AT}/play?size=12&level=hard&seed=5`);
    await ready(page, "puzzle-play");
    const view = page.getByTestId("suido-viewport");
    await expect(view).toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("suido-arrows").click();
    await page.getByTestId("suido-pad-in").click();
    await expect(view).not.toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("suido-fit").click();
    await expect(view).toHaveAttribute("data-zoom", "1.00");
    // Put the arrows away again: this browser remembers them for every board.
    await page.getByTestId("suido-arrows").click();
    const wide = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(wide).toBeLessThanOrEqual(390);
  });

  test("played on the Rabbit, the minute counts down from the first turn", async ({ page }) => {
    await page.clock.install();
    await page.goto(`${AT}/new?mode=make&size=7&level=easy`);
    await ready(page, "puzzle-set-up");
    const rabbit = page.getByTestId("puzzle-clock-rabbit");
    await rabbit.click();
    await expect(rabbit).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/clock=rabbit/);
    await ready(page, "puzzle-play");
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const [first] = turnsToSolve(playedOf(7, "easy", seed));
    const clock = page.getByTestId("puzzle-clock");
    await expect(clock).toHaveAttribute("data-clock", "rabbit");
    await expect(clock).toHaveText("1:00");
    await pieces(page).nth(first!.cell).click();
    await page.clock.runFor("00:20");
    await expect(clock).toHaveText(/^0:4\d$/);
  });

  test("run out on the Rabbit, it ends unsolved with the board as it stood, and its page draws that board", async ({ page }) => {
    await page.clock.install();
    const seed = freshPuzzleSeed();
    const [first] = turnsToSolve(playedOf(7, "easy", seed));
    await page.goto(`${AT}/play?size=7&level=easy&seed=${seed}&clock=rabbit`);
    await ready(page, "puzzle-play");
    await pieces(page).nth(first!.cell).click();
    const code = await page.getByTestId("puzzle-play").getAttribute("data-code");
    await page.clock.runFor("01:01");
    await expect(page.getByTestId("puzzle-out-of-time")).toContainText("Out of time");
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-outcome")).toHaveText("Out of time");
    // The board as it stood when the minute ran out, not the answer and not the board as dealt.
    const board = page.getByTestId("solve-board");
    await expect(board).toHaveAttribute("data-state", "unsolved");
    const masks = await board.getByTestId("suido-cell").evaluateAll((all) => all.map((cell) => cell.getAttribute("data-mask")));
    expect(masks.length).toBe(49);
    expect(decodeLayout(code!)!.cells.map(String)).toEqual(masks);
  });

  test("its family has a page, and the set-up screen shows it beside Bridges and Picture logic", async ({ page }) => {
    await page.goto(`${AT}/family`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Logic puzzles");
    await expect(page.getByTestId("family-games")).toContainText(NAME);
    await page.goto("/games/new");
    await ready(page, "set-up-game");
    const logic = page.getByTestId("set-up-family").filter({ hasText: "Logic puzzles" });
    await logic.click();
    await expect(logic).toHaveAttribute("data-open", "true");
    const tile = page.locator(`[data-testid="set-up-puzzle"][data-kind="${KIND}"]`);
    await expect(tile).toHaveCount(1);
    await tile.click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-kind", KIND);
    // The preview is a live board of the size chosen.
    await expect(page.getByTestId("set-up-puzzle-preview").getByTestId("suido-cell")).toHaveCount(49);
  });
});

/**
 * SUIDO'S FIXED LEVELS: 256 at each of thirteen sizes, the same board for
 * everybody, opened a block of sixteen at a time and picked on the set-up
 * screen beside "Make a board", the boards made from a seed.
 *
 * Each spec brings its own world: a member made for it and taken away after,
 * with no solves, so what the set-up says is open, solved or next is a fact
 * about the spec and not about this database's history. A level is played as a
 * reader plays it — a click on a piece — from the answer the package keeps
 * for it, and the water the page draws is held to the water the package says
 * the pieces make. A block is opened where it is not the subject by this
 * browser's own record of solves (`suidoKept`), which is how a visitor with no
 * account opens one, and where it is the subject by solving.
 */
const LEVELS5 = SUIDO_5X5 as readonly LevelRow[];
const LEVELS8X14 = SUIDO_8X14 as readonly LevelRow[];

function levelPlayed(rows: readonly LevelRow[], level: number): Played {
  const row = rows[level - 1]!;
  return { dealt: newGame(row[0])!, answer: levelSolution(row)! };
}

/** A fresh member's context, and the member's address for taking them away. */
async function aMember(browser: Browser, baseURL: string | undefined, tag: string): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `suido-levels-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Suido Levels" });
  return { context, page: await context.newPage(), email };
}

/** This browser's own record of solves at 5×5, as `suidoKept` keeps it: the first `upTo` levels solved, by their boards. */
async function solvedHereTo(context: BrowserContext, upTo: number): Promise<void> {
  const record = Object.fromEntries(LEVELS5.slice(0, upTo).map(([board], at) => [board, 60_000 + at]));
  await context.addInitScript(([key, value]) => {
    try {
      window.localStorage.setItem(key!, value!);
    } catch {
      /* A browser that keeps nothing: the spec says so by failing on what it needed. */
    }
  }, ["itsutsu.suido.solved.5", JSON.stringify(record)]);
}

/**
 * Every piece of a level turned by clicks, in the order the water needs them. From the board as the page has it now, read
 * from its pieces: a level part-played, or turned a time already, is finished from where it stands.
 */
async function solveLevelOnPage(page: Page, played: Played): Promise<void> {
  const masks = await pieces(page).evaluateAll((all) => all.map((cell) => Number(cell.getAttribute("data-mask"))));
  const standing: Played = { dealt: { ...played.dealt, masks, quarters: masks.map(() => 0) }, answer: played.answer };
  for (const step of turnsToSolve(standing)) {
    for (let each = 0; each < step.turns; each += 1) await pieces(page).nth(step.cell).click();
    await expect(pieces(page).nth(step.cell)).toHaveAttribute("data-mask", String(played.answer[step.cell]));
  }
}

const levelUrl = (size: string, number: number) => `${AT}/play?size=${size}&number=${number}`;

test.describe("Suido's levels", () => {
  test("a level is picked on the set-up screen: a size, a block of sixteen, a level, and Start plays that one", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "pick");
    try {
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("puzzle-set-up")).toHaveAttribute("data-mode", "levels");
      await page.locator('[data-testid="set-up-size"][data-size="5"]').click();
      const picked = page.locator('[data-testid="suido-level"][data-level="5"]');
      await expect(picked).toHaveAttribute("data-state", "open");
      // Level 1 is the next one, and what Start plays until another is chosen.
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-level", "1");
      await picked.click();
      await expect(picked).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("suido-preview")).toHaveAttribute("data-level", "5");
      await expect(page.getByTestId("suido-preview-caption")).toContainText("Level 5 of 256 at 5×5: not solved yet.");
      await expect(page.getByTestId("puzzle-solve")).toContainText("Start level 5");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /size=5&level=easy&number=5/);
      // The preview is the level's own board, drawn live: 25 pieces at 5×5.
      await expect(page.getByTestId("suido-preview").getByTestId("suido-cell")).toHaveCount(25);

      // A block of sixteen at a time; the next is shut until this one is solved, and can be looked at, and Start says so.
      await expect(page.getByTestId("suido-block")).toContainText("Block 1 of 16 · levels 1–16");
      await page.getByTestId("suido-block-on").click();
      await expect(page.getByTestId("suido-block")).toContainText("Block 2 of 16 · levels 17–32");
      const shut = page.locator('[data-testid="suido-level"][data-level="17"]');
      await expect(shut).toHaveAttribute("data-state", "locked");
      await shut.click();
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-locked", "true");
      await expect(page.getByTestId("puzzle-solve")).toContainText("Level 17 is locked");
      await expect(page.getByTestId("suido-preview-caption")).toContainText("locked until every level of block 1 is solved");
      // And a level beyond the open blocks, asked for by address, opens nothing but the way to the first.
      await page.goto(levelUrl("5", 17));
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("suido-shut")).toContainText("Level 17 at 5×5 opens when every level in block 1 (levels 1–16) is solved");
      await expect(pieces(page)).toHaveCount(0);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("thirteen sizes fit four tiles: the shelves turn, and the long boards are drawn as long boards", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "shelves");
    try {
      await page.goto(`${AT}/new?size=5`);
      await ready(page, "puzzle-set-up");
      const sizes = page.getByTestId("set-up-size");
      await expect(sizes).toHaveCount(4);
      const turn = page.getByTestId("suido-more-sizes");
      await expect(turn).toContainText("Bigger boards, to 12×12");
      await turn.click();
      await expect(sizes).toHaveCount(4);
      await turn.click();
      await expect(sizes).toHaveCount(4);
      await turn.click();
      // The last shelf is full too: 14 and the three long boards, and the press goes back to the first.
      await expect(sizes).toHaveCount(4);
      await expect(page.locator('[data-testid="set-up-size"][data-size="814"]')).toBeVisible();
      await expect(turn).toContainText("Smaller boards, from 5×5");
      // A long board's tile is that shape: taller than it is wide, in the same 70px box as every other.
      const mark = page.locator('[data-testid="set-up-size"][data-size="814"] [data-testid="board-size-mark"] > span');
      const box = (await mark.boundingBox())!;
      expect(box.height).toBeGreaterThan(box.width * 1.5);
      await expect(page.locator('[data-testid="set-up-size"][data-size="814"]').getByTestId("board-size-mark")).toHaveAttribute("aria-label", "8 by 14 board");
      await page.locator('[data-testid="set-up-size"][data-size="814"]').click();
      await expect(page.getByTestId("suido-preview")).toHaveAttribute("data-size", "814");
      await expect(page.getByTestId("suido-preview-caption")).toContainText("at 8×14");
      await expect(page.getByTestId("suido-preview").getByTestId("suido-cell")).toHaveCount(112);
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /size=8x14&level=easy&number=1/);
      // The board is drawn at its own shape: eight across and fourteen down.
      const grid = page.getByTestId("suido-preview").getByTestId("puzzle-grid");
      await expect(grid).toHaveAttribute("data-size", "8");
      await expect(grid).toHaveAttribute("data-rows", "14");
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
        await page.goto(`${AT}/new?size=5`);
        await ready(page, "puzzle-set-up");
        const reading = async () =>
          page.evaluate(() => {
            const preview = document.querySelector('[data-testid="suido-preview"] > div')!.getBoundingClientRect();
            const panel = document.querySelector('[data-testid="puzzle-set-up"]')!.getBoundingClientRect();
            const play = document.querySelector('[data-testid="puzzle-play-buttons"]')!.getBoundingClientRect();
            return { box: `${Math.round(preview.width)}×${Math.round(preview.height)}`, bottom: Math.round(panel.bottom - panel.top), play: Math.round(play.top - panel.top) };
          });
        await expect(page.getByTestId("suido-preview")).toHaveAttribute("data-drawn", "true");
        const first = await reading();
        // A big board, a long one, a level in another block and back: the box, the page's end and the Start column stay where they were.
        const turn = page.getByTestId("suido-more-sizes");
        for (const size of ["8", "9", "13", "507", "814", "5"]) {
          while ((await page.locator(`[data-testid="set-up-size"][data-size="${size}"]`).count()) === 0) await turn.click();
          await page.locator(`[data-testid="set-up-size"][data-size="${size}"]`).click();
          await expect(page.getByTestId("suido-preview")).toHaveAttribute("data-size", size);
          await expect(page.getByTestId("suido-preview")).toHaveAttribute("data-drawn", "true");
          const now = await reading();
          expect(now, `after choosing ${size}`).toEqual(first);
        }
        await page.getByTestId("suido-block-on").click();
        await page.locator('[data-testid="suido-level"][data-level="20"]').click();
        await expect(page.getByTestId("suido-preview")).toHaveAttribute("data-state", "locked");
        expect(await reading()).toEqual(first);
      } finally {
        await context.close();
        await removeMember(email);
      }
    });
  }

  test("level 1 at 5×5 is solved by turning pieces, paid, kept, and offers the next level and the board of levels", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "solve");
    try {
      await page.goto(`${AT}/new?size=5`);
      await ready(page, "puzzle-set-up");
      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(/size=5&level=easy&number=1$/);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-level", "1");
      await expect(page.getByTestId("puzzle-asked")).toContainText("5×5 · Level 1 of 256");
      // A level has no hint and no clock, whatever the address asks for: the Hint press is there, switched off, and says why.
      await expect(page.getByTestId("puzzle-hint")).toHaveAttribute("data-allowed", "false");
      await expect(page.getByTestId("puzzle-hint")).toBeDisabled();
      await expect(page.getByTestId("puzzle-hint")).toHaveAttribute("title", /no hint/);

      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", LEVELS5[0]![0]);
      await expect(page.getByTestId("suido-chip-difficulty")).toBeVisible();
      // The board is the package's own level 1, piece for piece.
      await expect(pieces(page)).toHaveCount(25);
      await expect(wet(page)).toHaveCount(wetCount(levelPlayed(LEVELS5, 1).dealt));

      await solveLevelOnPage(page, levelPlayed(LEVELS5, 1));
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
      // The way on is the next level and the board of levels, not Another.
      await expect(page.getByTestId("puzzle-another")).toHaveCount(0);
      await expect(page.getByTestId("puzzle-next-level")).toHaveText("Level 2 →");
      await expect(page.getByTestId("puzzle-all-levels")).toBeVisible();

      // Kept on the account: the board of levels shows it solved, and its time opens that solve.
      await page.getByTestId("puzzle-all-levels").click();
      await expect(page).toHaveURL(/\/new\?size=5$/);
      await ready(page, "puzzle-set-up");
      await expect(page.locator('[data-testid="suido-level"][data-level="1"]')).toHaveAttribute("data-state", "solved");
      await expect(page.getByTestId("suido-levels-caption")).toContainText("1 of 256 solved");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-level", "2");
      await page.locator('[data-testid="suido-level"][data-level="1"]').click();
      await expect(page.getByTestId("suido-preview-caption")).toContainText("solved, best");
      await page.getByTestId("suido-preview-best").click();
      await expect(page).toHaveURL(/\/games\/suido\/me\/[a-z0-9]+$/);
      // Its page names the level, and draws the board as it was solved.
      await expect(page.getByTestId("solve-level")).toContainText("1, easy");
      await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", "finished");

      // A level already solved opens on its finished board, and only "Play it again" starts it over.
      await page.goto(levelUrl("5", 1));
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-reviewing", "true");
      await expect(page.getByTestId("suido-solved-view")).toContainText("Solved, best");
      await expect(wet(page)).toHaveCount(25);
      await page.getByTestId("suido-play-again").click();
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "false");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", LEVELS5[0]![0]);

      // Everybody's time on a level is one race run apart: its fastest table is under the board, and a time on it opens that solve.
      await expect(page.getByTestId("suido-level-fastest")).toContainText("Fastest on level 1");
      await expect(page.getByTestId("suido-level-fastest-row").first().getByTestId("solve-time-link")).toHaveAttribute("href", /\/games\/suido\/history\/[a-z0-9]+$/);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the server checks a level's solve against the level: its board, its answer and the seed that names it", async ({ browser, baseURL }) => {
    const { context, email } = await aMember(browser, baseURL, "check");
    try {
      const row = LEVELS5[94]!;
      const level = 95;
      const good = { kind: KIND, size: 5, level: "medium", seed: suidoLevelSeed(level), givens: row[0], answer: levelAnswer(row), elapsedMs: 8000 };
      const solve = async (data: object) => (await context.request.post("/api/puzzles/solved", { data })).status();
      // The board as dealt is not its own answer.
      expect(await solve({ ...good, answer: row[0] })).toBe(422);
      // A board of a size's own shape that is no level of it, in a level's place: made with edges that join, which no level of this number has.
      const made = makeSuido({ size: 5, wrap: true, seed: 11 });
      expect(await solve({ ...good, givens: made.code, answer: made.answer })).toBe(422);
      // A board that is a level of another size is no level of this one.
      expect(await solve({ ...good, size: 6 })).toBe(422);
      // The right answer to the level: paid, and kept. What makes the board a level is what it is, a row of its size's levels, and not what a browser says it is: it passes with no seed too.
      expect(await solve(good)).toBe(200);
      expect(await solve({ ...good, seed: undefined })).toBe(200);

      // A race over a level is made on the same terms, and refused on a board that is not one.
      const race = { kind: KIND, size: 5, level: "easy", seed: suidoLevelSeed(3), givens: LEVELS5[2]![0], solution: levelAnswer(LEVELS5[2]!), checksAllowed: null };
      const raced = await context.request.post("/api/puzzles/races", { data: race });
      expect(raced.status()).toBe(201);
      expect((await raced.json()).at).toMatch(/\/games\/suido\/match\/[a-z0-9-]+$/i);
      expect((await context.request.post("/api/puzzles/races", { data: { ...race, givens: made.code, solution: made.answer } })).status()).toBe(422);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a level is played with no clock and no hint, whatever its address asks for", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "plain");
    try {
      await page.goto(`${levelUrl("5", 2)}&clock=rabbit&hints=1`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-level", "2");
      await expect(page.getByTestId("puzzle-hint")).toHaveAttribute("data-allowed", "false");
      await expect(page.getByTestId("puzzle-clock")).toHaveText("0:00");
      await expect(page.getByTestId("puzzle-clock")).not.toHaveAttribute("data-clock", /.+/);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the sixteenth level of a block, solved, opens the next block", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "opens");
    try {
      // Fifteen levels handed in as a reader's own browser hands them (the check is the server's, and every answer is the package's).
      for (let level = 1; level <= 15; level += 1) {
        const row = LEVELS5[level - 1]!;
        const handed = await context.request.post("/api/puzzles/solved", {
          data: { kind: KIND, size: 5, level: "easy", seed: suidoLevelSeed(level), givens: row[0], answer: levelAnswer(row), elapsedMs: 9000 + level },
        });
        expect(handed.status(), `level ${level} handed in`).toBe(200);
      }
      await page.goto(`${AT}/new?size=5`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("suido-levels-caption")).toContainText("15 of 256 solved");
      // Start goes to the first one not finished, and the block after this one is still shut.
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-level", "16");
      await page.getByTestId("suido-block-on").click();
      await expect(page.locator('[data-testid="suido-level"][data-level="17"]')).toHaveAttribute("data-state", "locked");

      await page.getByTestId("puzzle-solve").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-level", "16");
      await solveLevelOnPage(page, levelPlayed(LEVELS5, 16));
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-next-level")).toHaveText("Level 17 →");
      await page.getByTestId("puzzle-next-level").click();
      await ready(page, "puzzle-play");
      // The block is open: level 17 is a board to play, not a lock.
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-level", "17");
      await expect(page.getByTestId("suido-shut")).toHaveCount(0);
      await expect(pieces(page)).toHaveCount(25);
      await page.goto(`${AT}/new?size=5`);
      await ready(page, "puzzle-set-up");
      // The set-up opens on the block the next level is in, which is now the second.
      await expect(page.getByTestId("suido-block")).toContainText("Block 2 of 16");
      await expect(page.locator('[data-testid="suido-level"][data-level="17"]')).toHaveAttribute("data-state", "open");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-level", "17");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a locked piece will not turn, and the others do", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "locked");
    try {
      await solvedHereTo(context, 48);
      const played = levelPlayed(LEVELS5, 63);
      const locked = played.dealt.start.locked ?? [];
      expect(locked.length).toBeGreaterThan(0);
      await page.goto(levelUrl("5", 63));
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-level", "63");
      await expect(page.getByTestId("suido-chip-locked")).toBeVisible();
      const lockedCell = locked[0]!;
      const before = String(played.dealt.masks[lockedCell]);
      await expect(pieces(page).nth(lockedCell)).toHaveAttribute("aria-label", /, locked,/);
      await pieces(page).nth(lockedCell).click();
      await pieces(page).nth(lockedCell).click({ button: "right" });
      await expect(pieces(page).nth(lockedCell)).toHaveAttribute("data-mask", before);
      // Nothing was turned, so nothing has started: the clock is waiting for a first turn.
      await expect(page.getByTestId("suido-said")).toContainText("Tap a piece");
      // A piece beside it that is not locked turns as ever.
      const free = played.dealt.masks.findIndex((mask, cell) => !isLocked(played.dealt.start, cell) && ["end", "elbow", "tee"].includes(shapeOf(mask)));
      await pieces(page).nth(free).click();
      await expect(pieces(page).nth(free)).toHaveAttribute("data-mask", String(turn(played.dealt.masks[free]!, 1)));
      // And the level is solved by turning every piece but the locked ones.
      await solveLevelOnPage(page, played);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      for (const cell of locked) await expect(pieces(page).nth(cell)).toHaveAttribute("data-mask", String(played.dealt.masks[cell]));
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  for (const [level, twist, chip] of [
    [79, "walls", "suido-chip-walls"],
    [95, "wrap", "suido-chip-wrap"],
    [111, "inlet-outlet", "suido-chip-inlet-outlet"],
  ] as const) {
    test(`level ${level}, which has ${twist}, is solved, the water doing what the package says at every turn`, async ({ browser, baseURL }) => {
      const { context, page, email } = await aMember(browser, baseURL, `twist-${level}`);
      try {
        // Every block before this level's, solved, so it is open and not yet solved itself.
        await solvedHereTo(context, Math.floor((level - 1) / 16) * 16);
        const played = levelPlayed(LEVELS5, level);
        expect(LEVELS5[level - 1]![2]).toContain(twist);
        await page.goto(levelUrl("5", level));
        await ready(page, "puzzle-play");
        await expect(page.getByTestId(chip)).toBeVisible();
        await expect(wet(page)).toHaveCount(wetCount(played.dealt));
        for (const step of turnsToSolve(played)) {
          for (let each = 0; each < step.turns; each += 1) await pieces(page).nth(step.cell).click();
          // The water the page draws is the water the pieces make, across a joined edge and stopped by a wall.
          await expect(wet(page)).toHaveCount(wetCount(step.after));
        }
        await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      } finally {
        await context.close();
        await removeMember(email);
      }
    });
  }

  test("a long board, 8×14, is played on a phone: eight across and fourteen down, inside the screen, and solved", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "long");
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(levelUrl("8x14", 1));
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-asked")).toContainText("8×14 · Level 1 of 256");
      await expect(pieces(page)).toHaveCount(112);
      const grid = page.getByTestId("puzzle-grid");
      await expect(grid).toHaveAttribute("data-size", "8");
      await expect(grid).toHaveAttribute("data-rows", "14");
      // Taller than wide, and the page does not scroll sideways: no zoom is asked of a board whose pieces are thumb-sized across.
      const box = (await grid.boundingBox())!;
      expect(box.height).toBeGreaterThan(box.width * 1.5);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      await expect(page.getByTestId("suido-viewport")).toHaveCount(0);
      // A piece is big enough to tap: eight across a phone's width.
      const piece = (await pieces(page).first().boundingBox())!;
      expect(Math.min(piece.width, piece.height)).toBeGreaterThan(30);
      await solveLevelOnPage(page, levelPlayed(LEVELS8X14, 1));
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("left half way, a level waits in My games by its number and opens where it was left", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "going");
    try {
      const played = levelPlayed(LEVELS5, 3);
      const [first] = turnsToSolve(played);
      await page.goto(levelUrl("5", 3));
      await ready(page, "puzzle-play");
      for (let each = 0; each < first!.turns; each += 1) await pieces(page).nth(first!.cell).click();
      await expect(pieces(page).nth(first!.cell)).toHaveAttribute("data-mask", String(played.answer[first!.cell]));
      const code = await page.getByTestId("puzzle-play").getAttribute("data-code");
      await page.getByTestId("puzzle-pause").click();
      await expect(page.getByTestId("puzzle-paused")).toBeVisible();
      await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
      await expect(page).toHaveURL(/\/play$/);
      await ready(page, "tabs");
      await page.locator('[data-testid="tab"][data-tab="going"]').click();
      const row = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"]`);
      await expect(row).toHaveCount(1);
      await expect(row).toContainText("5×5 · Level 3");
      // The board of levels is one press from it, opened on its size.
      await expect(row.getByTestId("puzzle-going-levels")).toHaveAttribute("href", /\/new\?size=5$/);
      await row.getByTestId("puzzle-going-continue").click();
      await ready(page, "puzzle-play");
      await expect(page).toHaveURL(/size=5&level=easy&number=3$/);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", code!);
      await expect(page.getByTestId("puzzle-pausable")).toHaveAttribute("data-paused", "false");
      await expect(wet(page)).toHaveCount(wetCount(first!.after));
      // Finished from there, it is solved and the kept run is gone.
      await solveLevelOnPage(page, played);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
      await ready(page, "tabs");
      await page.locator('[data-testid="tab"][data-tab="going"]').click();
      await expect(page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"]`)).toHaveCount(0);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a visitor with no account opens the next block from this browser's own solves, and is told where they are kept", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: ".auth/player.json" });
    const page = await context.newPage();
    try {
      await solvedHereTo(context, 16);
      await page.goto(`${AT}/new?size=5`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("suido-kept-where")).toContainText(/in this browser|on your account/);
      await expect(page.getByTestId("suido-levels-caption")).toContainText("16 of 256 solved");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-level", "17");
      await page.getByTestId("puzzle-solve").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-level", "17");
      await expect(page.getByTestId("suido-shut")).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});

test.describe("Suido's two ways to play", () => {
  test("Levels come first, Make a board is one press away and makes boards as it always did, and each stays where it is on a reload", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "modes");
    try {
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("suido-mode-levels")).toHaveAttribute("aria-current", "page");
      await expect(page.getByTestId("suido-mode-make")).not.toHaveAttribute("aria-current", "page");
      await page.getByTestId("suido-mode-make").click();
      await expect(page).toHaveURL(/mode=make/);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("suido-mode-make")).toHaveAttribute("aria-current", "page");
      // The set-up it always was: four boards, a level, a kind, hints and a clock.
      await expect(page.getByTestId("set-up-size")).toHaveCount(4);
      await expect(page.getByTestId("suido-kind-drains")).toHaveAttribute("aria-checked", "true");
      await page.locator('[data-testid="set-up-size"][data-size="9"]').click();
      await page.getByTestId("puzzle-level-hard").click();
      // Its choices are in the address beside the mode, so a reload opens on them and not on the levels.
      await expect(page).toHaveURL(/mode=make/);
      await expect(page).toHaveURL(/size=9&level=hard/);
      await page.reload();
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("suido-mode-make")).toHaveAttribute("aria-current", "page");
      await expect(page.locator('[data-testid="set-up-size"][data-size="9"]')).toHaveAttribute("data-chosen", "true");
      await expect(page.getByTestId("puzzle-level-hard")).toHaveAttribute("aria-checked", "true");
      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(/size=9&level=hard&seed=\d+/);
      await ready(page, "puzzle-play");
      // A board made from a seed, not a level: its seed is its number, and it still has its Another.
      await expect(page.getByTestId("puzzle-asked")).toContainText("№");
      await expect(page.getByTestId("puzzle-play")).not.toHaveAttribute("data-level", /.+/);
      // And back to the levels, which keep the size.
      await page.goto(`${AT}/new?mode=make&size=9`);
      await ready(page, "puzzle-set-up");
      await page.getByTestId("suido-mode-levels").click();
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("puzzle-set-up")).toHaveAttribute("data-mode", "levels");
      await expect(page.getByTestId("suido-preview")).toHaveAttribute("data-size", "9");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a board made from a seed at a long size is a board of that shape, and its level is its seed's and not a level's", async ({ page }) => {
    const seed = freshPuzzleSeed();
    await page.goto(`${AT}/play?size=5x7&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(pieces(page)).toHaveCount(35);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", /^5x7d:/);
    await expect(page.getByTestId("puzzle-asked")).toContainText("5×7");
    await expect(page.getByTestId("puzzle-asked")).toContainText("№");
  });
});
