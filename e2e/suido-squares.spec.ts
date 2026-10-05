import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { blockInfo, blockQuartersBetween, decodeLayout, newGame, quartersBetween } from "@johnmorrisdotca/suido";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { SUIDO_BIG_SEED_BLOCK } from "../src/lib/puzzles/random";
import { suidoKindOfSeed, suidoSquaresOfSeed } from "../src/lib/puzzles/suido/seed";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * SUIDO'S SQUARES: pieces that fill four squares and turn as one. A board made with big pieces is a network in which some pieces are four
 * squares with up to eight openings; a tap on any part of one turns the whole piece a quarter, where it stands, and a plate and a ring at its
 * middle mark it. It is chosen in Make a board, and the seed says it from then on.
 *
 * Every board here is played as a reader plays it, by the press a finger or a mouse makes at the middle of a piece, from the answer the spec
 * makes out of the same seed the page uses (`generatePuzzle`), on a member made for the spec and taken away after it.
 */
const KIND = "suido";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const BIG = SUIDO_BIG_SEED_BLOCK.from + 11;
const BIG_URL = `${AT}/play?size=7&level=medium&seed=${BIG}`;

async function aMember(browser: Browser, baseURL: string | undefined, tag: string, options?: Parameters<Browser["newContext"]>[0]): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `suido-squares-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Suido Squares" }, options);
  return { context, page: await context.newPage(), email };
}

const pieces = (page: Page) => page.getByTestId("suido-cell");

/** The press a finger or a mouse makes at the middle of where a piece was dealt; for a piece of a big piece, whatever is on top there is the same piece's, and the page turns it all. */
async function press(page: Page, touch: boolean, cell: number): Promise<void> {
  const spot = pieces(page).nth(cell).locator(".sd-hit");
  await spot.scrollIntoViewIfNeeded();
  const box = (await spot.boundingBox())!;
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

/** Every piece, and every big piece as a whole, pressed until the board faces as its answer says. Returns how many presses it took. */
async function solveByPressing(page: Page, size: number, seed: number, touch: boolean): Promise<number> {
  const puzzle = generatePuzzle(KIND, size, "medium", seed);
  const game = newGame(puzzle.givens)!;
  const answer = decodeLayout(puzzle.solution)!.cells;
  const info = blockInfo(game.start);
  let presses = 0;
  const seen = new Set<number>();
  for (let cell = 0; cell < game.masks.length; cell += 1) {
    const at = info.of[cell]!;
    let need: number;
    let target = cell;
    if (at >= 0) {
      if (seen.has(at)) continue;
      seen.add(at);
      target = info.blocks[at]!.anchor;
      need = blockQuartersBetween(game.masks, answer, info.blocks[at]!) ?? 0;
    } else need = quartersBetween(game.masks[cell]!, answer[cell]!) ?? 0;
    for (let each = 0; each < need; each += 1) {
      await press(page, touch, target);
      presses += 1;
    }
  }
  return presses;
}

test.describe("Suido's big pieces", () => {
  test("are chosen in Make a board, which makes the board a network, and Drains takes them off again", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "choose");
    try {
      await page.goto(`${AT}/new?mode=make&size=7&level=medium`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("suido-squares-none")).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("suido-kind-drains")).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("set-up-puzzle-preview").locator(".sd-plate")).toHaveCount(0);
      await page.getByTestId("suido-squares-big").click();
      await expect(page.getByTestId("suido-squares-big")).toHaveAttribute("aria-checked", "true");
      // Big pieces are a network's: the kind follows, and the address says the squares, which say the rest.
      await expect(page.getByTestId("suido-kind-network")).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("suido-squares-blurb")).toContainText("four squares that are one piece");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /squares=big/);
      await expect(page.getByTestId("puzzle-solve")).not.toHaveAttribute("href", /pipes=/);
      // The preview is a board of that kind: its big pieces on their plates.
      await expect(page.getByTestId("set-up-puzzle-preview").locator(".sd-plate").first()).toBeVisible();
      expect(await page.getByTestId("set-up-puzzle-preview").locator(".sd-plate").count()).toBeGreaterThanOrEqual(2);
      // Choosing Drains takes them off.
      await page.getByTestId("suido-kind-drains").click();
      await expect(page.getByTestId("suido-squares-none")).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("puzzle-solve")).not.toHaveAttribute("href", /squares=/);
      await expect(page.getByTestId("set-up-puzzle-preview").locator(".sd-plate")).toHaveCount(0);
      // A reload opens on what was chosen.
      await page.getByTestId("suido-squares-big").click();
      await expect(page).toHaveURL(/squares=big/);
      await page.reload();
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("suido-squares-big")).toHaveAttribute("aria-checked", "true");
      // Start makes a board whose seed says it.
      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(/seed=\d+/);
      await ready(page, "puzzle-play");
      const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
      expect(suidoSquaresOfSeed(seed)).toBe("big");
      expect(suidoKindOfSeed(seed)).toBe("network");
      await expect(page).not.toHaveURL(/squares=/);
      await expect(page.getByTestId("suido-chip-big-pieces")).toBeVisible();
      await expect(page.locator('[data-testid="suido-cell"][data-block]').first()).toBeVisible();
      await expect(page.locator('[data-testid="suido-board"] .sd-plate[data-kind="big"]').first()).toBeVisible();
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a tap on any part of a big piece turns the whole piece a quarter, each part moving round to the next place", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "tap");
    try {
      await page.goto(BIG_URL);
      await ready(page, "puzzle-play");
      const puzzle = generatePuzzle(KIND, 7, "medium", BIG);
      const dealt = newGame(puzzle.givens)!;
      const block = blockInfo(dealt.start).blocks[0]!;
      await expect(pieces(page)).toHaveCount(49);
      const masks = () => pieces(page).evaluateAll((all) => all.map((one) => Number(one.getAttribute("data-mask"))));
      const was = await masks();
      let moved = 0;
      for (const [at, cell] of block.cells.entries()) {
        await press(page, false, cell);
        const now = await masks();
        const changed = now.flatMap((mask, index) => (mask === was[index] ? [] : [index]));
        // Only this big piece's four squares can have changed (half a turn of some can look the same), and four turns bring it home.
        for (const index of changed) expect(block.cells, `tap ${at}`).toContain(index);
        moved += changed.length;
        await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", /.+/);
      }
      expect(moved).toBeGreaterThan(0);
      expect(await masks()).toEqual(was);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", puzzle.givens);
      // A fifth press is one more turn.
      await press(page, false, block.cells[0]!);
      await expect(page.getByTestId("puzzle-play")).not.toHaveAttribute("data-code", puzzle.givens);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a board with big pieces is solved on a phone by touch, the water drawn through each piece, and is paid like any board", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "phone", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    try {
      await page.goto(BIG_URL);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("suido-chip-big-pieces")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      const presses = await solveByPressing(page, 7, BIG, true);
      expect(presses).toBeGreaterThan(5);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
      // Every piece wet, a big piece's four parts and all.
      await expect(page.locator('[data-testid="suido-cell"][data-wet="true"]')).toHaveCount(49);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a board with big pieces is solved on a desk by mouse, at a size where the board is zoomed on a phone", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "desk", { viewport: { width: 1280, height: 900 } });
    try {
      await page.goto(`${AT}/play?size=12&level=medium&seed=${BIG}`);
      await ready(page, "puzzle-play");
      const presses = await solveByPressing(page, 12, BIG, false);
      expect(presses).toBeGreaterThan(10);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a Hint lights a big piece whole, and turns it to face the answer", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "hint");
    try {
      // A board made with hints allowed: the address says so.
      await page.goto(`${BIG_URL}&hints=1`);
      await ready(page, "puzzle-play");
      const hint = page.getByTestId("puzzle-hint");
      await expect(hint).toBeEnabled();
      await hint.click();
      // Whatever it lights, a big piece's plate is lit with all four of its squares or a single piece is lit alone.
      const lit = await page.locator('[data-testid="suido-cell"][data-hint="true"]').count();
      const plates = await page.locator('.sd-plate[data-hint="true"]').count();
      expect([1, 4]).toContain(lit);
      expect(plates).toBe(lit === 4 ? 1 : 0);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("left half way, a board with big pieces waits in My games and opens where it was left", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "going");
    try {
      await page.goto(BIG_URL);
      await ready(page, "puzzle-play");
      const puzzle = generatePuzzle(KIND, 7, "medium", BIG);
      const block = blockInfo(newGame(puzzle.givens)!.start).blocks[0]!;
      await press(page, false, block.cells[0]!);
      const code = await page.getByTestId("puzzle-play").getAttribute("data-code");
      expect(code).not.toBe(puzzle.givens);
      await page.getByTestId("puzzle-pause").click();
      await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
      await expect(page).toHaveURL(/\/play$/);
      await ready(page, "tabs");
      await page.locator('[data-testid="tab"][data-tab="going"]').click();
      const row = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"]`);
      await expect(row).toHaveCount(1);
      await row.getByTestId("puzzle-going-continue").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", code!);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});
