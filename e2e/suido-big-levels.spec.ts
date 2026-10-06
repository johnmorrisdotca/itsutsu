import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { blockInfo, blockQuartersBetween, decodeLayout, newGame, quartersBetween, SUIDO_PIECE_GUIDE } from "@johnmorrisdotca/suido";
import { SUIDO_BIG } from "@johnmorrisdotca/suido/levels-big";
import { levelAnswer, levelSolution, SUIDO_BIG_SIZES, suidoBigPieces, suidoBigScore } from "@johnmorrisdotca/suido/levels-info";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { suidoSetOfSeed } from "../src/lib/puzzles/suido/seed";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * SUIDO'S BIG-PIECES LEVELS: sixty-four levels with big pieces among the ordinary ones, numbered across every size, chosen on the set-up screen by a pair
 * of chips beside Classic and played, kept, paid and raced like a level by size. Each is a level of its own size, named by a seed in the level block's
 * second half, and its board is the package's own, piece for piece.
 *
 * Every level here is played as a reader plays it: a press at the middle of a piece, or of a big piece, from the answer the package keeps for it, on a
 * member made for the spec and taken away after it.
 */
const KIND = "suido";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

async function aMember(browser: Browser, baseURL: string | undefined, tag: string, options?: Parameters<Browser["newContext"]>[0]): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `suido-big-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Suido Big" }, options);
  return { context, page: await context.newPage(), email };
}

const pieces = (page: Page) => page.getByTestId("suido-cell");
const bigUrl = (level: number) => `${AT}/play?size=${sizeOfLevel(level)}&level=easy&number=${level}&set=big`;
function sizeOfLevel(level: number): string {
  const [width, height] = SUIDO_BIG_SIZES[level - 1]!.split("x");
  return width === height ? width! : `${width}x${height}`;
}

/** The press a finger or a mouse makes at the middle of where a piece was dealt; for a piece of a big piece or a block, whatever is on top there is the same square's. */
async function press(page: Page, touch: boolean, cell: number): Promise<void> {
  const spot = pieces(page).nth(cell).locator(".sd-hit");
  await spot.scrollIntoViewIfNeeded();
  const box = (await spot.boundingBox())!;
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

/** Every piece, and every square as a whole, pressed until the level faces as its answer says. */
async function solveByPressing(page: Page, level: number, touch: boolean): Promise<void> {
  const row = SUIDO_BIG[level - 1]!;
  const game = newGame(row[0])!;
  const answer = levelSolution(row)!;
  const info = blockInfo(game.start);
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
    for (let each = 0; each < need; each += 1) await press(page, touch, target);
  }
}

test.describe("Suido's big-pieces levels", () => {
  test("are chosen on the set-up screen beside Classic, as sixty-four levels in blocks of sixteen across every size, and Start plays the one chosen", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "pick");
    try {
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("suido-set-classic")).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("puzzle-set-up")).toHaveAttribute("data-set", "classic");
      await page.getByTestId("suido-set-big").click();
      await expect(page.getByTestId("puzzle-set-up")).toHaveAttribute("data-set", "big");
      await expect(page.getByTestId("suido-set-big")).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("suido-set-says")).toContainText("Sixty-four levels");
      // Level 1 is the next one: its board in the preview, its size on the tile, and a block of sixteen under it.
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-level", "1");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /size=5&level=easy&number=1&set=big$/);
      await expect(page.getByTestId("suido-preview")).toHaveAttribute("data-set", "big");
      await expect(page.getByTestId("suido-preview-caption")).toContainText("Level 1 of 64 at 5×5: not solved yet.");
      await expect(page.getByTestId("suido-block")).toContainText("Block 1 of 4 · levels 1–16");
      await expect(page.locator('[data-testid="suido-level"]')).toHaveCount(16);
      await expect(page.getByTestId("suido-levels-caption")).toContainText("Big pieces: 0 of 64 solved");
      // The preview is the level's own board with its big pieces on their plates.
      const first = decodeLayout(SUIDO_BIG[0]![0])!;
      await expect(page.getByTestId("suido-preview").getByTestId("suido-cell")).toHaveCount(first.width * first.height);
      await expect(page.getByTestId("suido-preview").locator(".sd-plate")).toHaveCount(first.bigs!.length);
      // Block 2 is shut and can be looked at: its level 20 is at 6×6, and Start says it is locked.
      await page.getByTestId("suido-block-on").click();
      await expect(page.getByTestId("suido-block")).toContainText("Block 2 of 4 · levels 17–32");
      await page.locator('[data-testid="suido-level"][data-level="20"]').click();
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-locked", "true");
      await expect(page.locator('[data-testid="set-up-size"][data-chosen="true"]')).toHaveAttribute("data-size", "6");
      await expect(page.getByTestId("suido-preview-caption")).toContainText("Level 20 of 64 at 6×6: locked");
      // A size tile goes to a level of that size; Classic comes back as it was, at its own 256.
      await page.locator('[data-testid="set-up-size"][data-size="5"]').click();
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-level", "1");
      await page.getByTestId("suido-set-classic").click();
      await expect(page.getByTestId("puzzle-set-up")).toHaveAttribute("data-set", "classic");
      await expect(page.getByTestId("suido-preview-caption")).toContainText("of 256");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a level is solved by pressing its pieces and its squares, paid, kept, and offers the next level and the set's board of levels", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "solve");
    try {
      await page.goto(`${AT}/new?set=big`);
      await ready(page, "puzzle-set-up");
      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(/size=5&level=easy&number=1&set=big$/);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-level", "1");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", SUIDO_BIG[0]![0]);
      await expect(page.getByTestId("puzzle-asked")).toContainText("5×5 · Big-pieces level 1 of 64");
      expect(suidoSetOfSeed(Number(await page.getByTestId("puzzle-play").getAttribute("data-seed")))).toBe("big");
      await expect(page.getByTestId("suido-chip-big-pieces")).toBeVisible();
      await expect(page.getByTestId("suido-chip-difficulty")).toBeVisible();
      await expect(page.getByTestId("puzzle-hint")).toBeDisabled();
      const layout = decodeLayout(SUIDO_BIG[0]![0])!;
      await expect(pieces(page)).toHaveCount(layout.width * layout.height);
      await expect(page.locator('[data-testid="suido-board"] .sd-plate[data-kind="big"]')).toHaveCount(layout.bigs!.length);

      await solveByPressing(page, 1, false);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
      await expect(page.getByTestId("puzzle-next-level")).toHaveText("Level 2 →");

      // Kept on the account: the set's board of levels shows it solved, and the next one is where Start goes.
      await page.getByTestId("puzzle-all-levels").click();
      await expect(page).toHaveURL(/\/new\?size=5&set=big$/);
      await ready(page, "puzzle-set-up");
      await expect(page.getByTestId("puzzle-set-up")).toHaveAttribute("data-set", "big");
      await expect(page.locator('[data-testid="suido-level"][data-level="1"]')).toHaveAttribute("data-state", "solved");
      await expect(page.getByTestId("suido-levels-caption")).toContainText("Big pieces: 1 of 64 solved");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("data-level", "2");
      await page.locator('[data-testid="suido-level"][data-level="1"]').click();
      await expect(page.getByTestId("suido-preview-caption")).toContainText("solved, best");
      await expect(page.getByTestId("suido-preview")).toHaveAttribute("data-board", levelAnswer(SUIDO_BIG[0]!)!);
      // The level by size at the same size is not that level: nothing of Classic's 5×5 is marked solved.
      await page.getByTestId("suido-set-classic").click();
      await expect(page.locator('[data-testid="suido-level"][data-state="solved"]')).toHaveCount(0);

      // A level already solved opens on its finished board, with its fastest table under it.
      await page.goto(bigUrl(1));
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-reviewing", "true");
      await expect(page.getByTestId("suido-level-fastest")).toContainText("Fastest on level 1");
      await expect(page.getByTestId("suido-level-fastest-row").first()).toBeVisible();
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a level past the open block is shut, whatever the size it is at, and says which block opens it", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "shut");
    try {
      await page.goto(bigUrl(20));
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("suido-shut")).toContainText("Level 20 at 6×6 opens when every level in block 1 (levels 1–16) is solved");
      await expect(pieces(page)).toHaveCount(0);
      await expect(page.getByTestId("suido-shut-first")).toHaveAttribute("href", /number=1&set=big/);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the hardest levels are 20×20 boards, shut until their block opens, with the big pieces the package says they have", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "huge");
    try {
      await page.goto(bigUrl(64));
      await ready(page, "puzzle-play");
      // Past the open blocks the level is shut (a link to it opens the way to the first); the board itself is the package's, read here.
      await expect(page.getByTestId("suido-shut")).toBeVisible();
      const layout = decodeLayout(SUIDO_BIG[63]![0])!;
      expect([layout.width, layout.height]).toEqual([20, 20]);
      expect(suidoBigScore(64)).toBeGreaterThanOrEqual(97);
      expect(suidoBigPieces(64)!.count).toBe(layout.bigs!.length);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test.describe("with no account", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("the rules page draws a guide to every piece with the package's pictures, in English and Japanese", async ({ page }) => {
      await page.goto(`${AT}/rules`);
      await ready(page, "suido-guide");
      const guide = page.getByTestId("suido-guide");
      // Every piece the package guides, and a big piece of each of its 32 families.
      await expect(guide.getByTestId("suido-guide-piece")).toHaveCount(SUIDO_PIECE_GUIDE.length + 32);
      for (const group of ["turn", "water", "twist", "block", "big", "families"]) await expect(guide.locator(`[data-group="${group}"]`)).toBeVisible();
      for (const piece of SUIDO_PIECE_GUIDE) {
        const one = guide.locator(`[data-piece="${piece.id}"]`);
        await expect(one.locator("strong")).toHaveText(piece.name);
        await expect(one).toContainText(piece.text);
        // The picture is the package's own drawing: an SVG with the board's class, a plate under a big piece.
        await expect(one.locator("svg.suido")).toHaveCount(1);
      }
      await expect(guide.locator('[data-piece="big-two-straights"] .sd-plate[data-kind="big"]')).toHaveCount(1);
      await expect(guide.locator('[data-piece="block-turn"] .sd-plate[data-kind="turn"]')).toHaveCount(1);
      await expect(guide.locator('[data-piece="family-2-2"] strong')).toHaveText(/^2\+2 · \d+$/);
      // A big piece is drawn twice as wide as a small one, so every pipe is as thick as another.
      const small = (await guide.locator('[data-piece="elbow"] svg').boundingBox())!;
      const big = (await guide.locator('[data-piece="big-two-elbows"] svg').boundingBox())!;
      expect(big.width / small.width).toBeCloseTo(2, 1);
      const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scroll).toBeLessThanOrEqual(client);
    });

    test("and reads in Japanese on a Japanese page, with no English name left in it", async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, locale: "ja-JP", storageState: { cookies: [], origins: [] } });
      const page = await context.newPage();
      try {
        await page.goto(`${AT}/rules`);
        await ready(page, "suido-guide");
        const guide = page.getByTestId("suido-guide");
        await expect(guide.locator('[data-piece="pump"] strong')).toHaveText("ポンプ");
        await expect(guide.locator('[data-piece="big-two-straights"] strong')).toContainText("大きな駒");
        const names = await guide.locator("strong").allTextContents();
        for (const piece of SUIDO_PIECE_GUIDE) expect(names).not.toContain(piece.name);
        await expect(guide.locator('[data-piece="family-2-2"] strong')).toContainText("通り");
      } finally {
        await context.close();
      }
    });
  });
});
