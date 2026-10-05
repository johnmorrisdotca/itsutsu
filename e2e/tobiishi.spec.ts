import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { mySolvePath, PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { TOBIISHI_LEVELS_A_SIZE } from "../src/lib/puzzles/tobiishi/levelCounts";
import { tobiishiCodeOf, tobiishiRefOf } from "../src/lib/puzzles/tobiishi/levels";
import { encodeJumps } from "../src/lib/puzzles/tobiishi/way";
import { jumpAt } from "@johnmorrisdotca/tobiishi";
import { memberContext, newestSolveOf, removeMember } from "./members";
import { ready } from "./support";
import { dragJump, hole, jumpsMade, levelOf, pegsLeft, playByTapping, runToTheWrongHole, tapJump } from "./tobiishi";

/**
 * TOBIISHI 飛び石: peg solitaire, in the package's 81 named levels: nine boards, three goal holes each, at
 * three lengths (the jumps in the shortest way: 3, 6 or 9).
 *
 * Every jump here is made as a player makes one, by a tap on a peg and then on the hole, or by a drag from
 * one to the other with the mouse (`e2e/tobiishi.ts`), and every level is the package's own, made again from
 * its place in its length. Each case is a member of its own, made for it and taken away after, so what it
 * counts is its own: levels solved, runs kept, and nothing another run left. The package holds its levels
 * to their rules (every one replayed to its goal); what is held here is the site's side: the set-up, the
 * play, the kept run, the check the server runs and the page a solve keeps.
 */
const KIND = "tobiishi";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;
const BAND = { 3: "easy", 6: "medium", 9: "hard" } as const;

/** A level's address, as the set-up's Start writes it. */
const levelUrl = (size: 3 | 6 | 9, level: number) => `${AT}/play?size=${size}&level=${BAND[size]}&seed=${level}`;

/** A fresh member's context, and the member's address for taking them away. */
async function aMember(browser: Browser, baseURL: string | undefined, tag: string): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `tobiishi-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  // A window tall enough for the whole board and the buttons under it: a mouse can only press what is on the screen.
  const context = await memberContext(browser, baseURL!, { email, name: "Tobiishi Player" }, { viewport: { width: 1280, height: 1100 } });
  return { context, page: await context.newPage(), email };
}

/** The play screen, its board drawn and the browser in charge of it. */
async function openLevel(page: Page, size: 3 | 6 | 9, level: number) {
  await page.goto(levelUrl(size, level));
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("tobiishi-board")).toBeVisible();
}

test.describe("Tobiishi, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, under our own name, in the Numbers family and on Small boards", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("also-known-as")).toContainText("Peg solitaire");
    await expect(page.getByTestId("game-family")).toContainText("Numbers");
    await expect(page.getByTestId("tobiishi-levels-line")).toContainText(`${TOBIISHI_LEVELS_A_SIZE} of 3 jumps, ${TOBIISHI_LEVELS_A_SIZE} of 6 jumps, ${TOBIISHI_LEVELS_A_SIZE} of 9 jumps`);
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.locator("main")).toContainText("Every level has at least one answer");
  });

  test("it is on the Small boards shelf too, saying where it lives, and Mini Reversi is no longer a guest there", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByTestId("lobby-family").first()).toBeAttached();
    // At home in Numbers, and a guest on one shelf: the same game, shown twice.
    const home = page.locator(`[data-testid="family-game"][data-variant="${KIND}"][data-listed="home"]`);
    const guest = page.locator(`[data-testid="family-game"][data-variant="${KIND}"][data-listed="shelf"]`);
    await expect(home).toHaveCount(1);
    await expect(guest).toHaveCount(1);
    await expect(guest.getByTestId("family-game-home")).toContainText("also under Numbers");
    await expect(guest.getByTestId("family-game-why")).toContainText("Peg solitaire on a small board");
    // The shelf is full at eight, guests counted: Mini Reversi's listing there made way for it, and it is still at home in Turn and take.
    await expect(page.locator('[data-testid="family-game"][data-variant="miniReversi"][data-listed="shelf"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="family-game"][data-variant="miniReversi"][data-listed="home"]')).toHaveCount(1);

    // And on the shelf's own page, the card says why it is there and leads to the one game.
    await page.goto("/games/tic-tac-toe/family");
    const onShelf = page.getByTestId("family-game-tobiishi");
    await expect(onShelf).toHaveAttribute("data-listed", "shelf");
    await expect(onShelf.getByTestId("family-game-why")).toContainText("Peg solitaire on a small board");
    await expect(onShelf.getByTestId("family-game-home")).toContainText("Numbers");
    await onShelf.getByRole("link", { name: /Tobiishi/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`${AT}$`));
  });
});

test.describe("the Tobiishi levels", () => {
  test("the set-up draws the chosen level's board live, in three lengths, and Start plays the level chosen", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "setup");
    try {
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      // Three lengths, one tile each, named by how long the shortest way is.
      await expect(page.getByTestId("set-up-size")).toHaveCount(3);
      await expect(page.getByTestId("set-up-size-name")).toHaveText(["Short", "Medium", "Long"]);
      // All twenty-seven levels of a length stand in the picker, none locked.
      await expect(page.getByTestId("tobiishi-level")).toHaveCount(TOBIISHI_LEVELS_A_SIZE);
      await expect(page.locator('[data-testid="tobiishi-level"][data-state="locked"]')).toHaveCount(0);

      // The preview is level 1's own board, pegs and goal.
      const preview = page.getByTestId("tobiishi-preview");
      await expect(preview).toHaveAttribute("data-code", tobiishiCodeOf(tobiishiRefOf(3, 1)!));
      await expect(page.getByTestId("tobiishi-preview-board").locator("svg")).toBeVisible();
      await expect(page.getByTestId("tobiishi-preview-caption")).toContainText(`Level 1 of ${TOBIISHI_LEVELS_A_SIZE} at 3 jumps: Crossroads, Centre. Not solved yet.`);
      await expect(page.getByTestId("puzzle-solve")).toContainText("Start level 1");

      // Another length is another list and another board.
      await page.locator('[data-testid="set-up-size"][data-size="9"]').click();
      await expect(preview).toHaveAttribute("data-size", "9");
      await expect(preview).toHaveAttribute("data-code", tobiishiCodeOf(tobiishiRefOf(9, 1)!));
      await expect(page.getByTestId("tobiishi-preview-caption")).toContainText(`Level 1 of ${TOBIISHI_LEVELS_A_SIZE} at 9 jumps`);

      // Every level is open: any can be chosen, the preview shows it, and Start plays it.
      const twenty = page.locator('[data-testid="tobiishi-level"][data-level="20"]');
      await expect(twenty).toHaveAttribute("data-state", "open");
      await twenty.click();
      await expect(preview).toHaveAttribute("data-level", "20");
      await expect(preview).toHaveAttribute("data-code", tobiishiCodeOf(tobiishiRefOf(9, 20)!));
      await expect(page.getByTestId("puzzle-solve")).toContainText("Start level 20");
      // What the level is, before it is started: how hard, which board, which goal and how many pegs.
      await expect(page.getByTestId("tobiishi-chip-difficulty")).toBeVisible();
      await expect(page.getByTestId("tobiishi-chip-board")).toBeVisible();
      await expect(page.getByTestId("tobiishi-chip-goal")).toBeVisible();
      await expect(page.getByTestId("tobiishi-chip-pegs")).toContainText("10 pegs");

      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(/size=9&level=hard&seed=20$/);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-asked")).toContainText(`Long · Level 20 of ${TOBIISHI_LEVELS_A_SIZE}`);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", tobiishiCodeOf(tobiishiRefOf(9, 20)!));
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  for (const width of [390, 1280]) {
    test(`choosing another length or level moves nothing on the set-up screen, ${width}px wide`, async ({ browser, baseURL }) => {
      const { context, page, email } = await aMember(browser, baseURL, `steady-${width}`);
      try {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${AT}/new`);
        await ready(page, "puzzle-set-up");
        const reading = async () =>
          page.evaluate(() => {
            const preview = document.querySelector('[data-testid="tobiishi-preview"] > div')!.getBoundingClientRect();
            const panel = document.querySelector('[data-testid="puzzle-set-up"]')!.getBoundingClientRect();
            const play = document.querySelector('[data-testid="puzzle-play-buttons"]')!.getBoundingClientRect();
            return { box: `${Math.round(preview.width)}×${Math.round(preview.height)}`, bottom: Math.round(panel.bottom - panel.top), play: Math.round(play.top - panel.top), across: document.documentElement.scrollWidth <= document.documentElement.clientWidth };
          });
        const preview = page.getByTestId("tobiishi-preview");
        await expect(page.getByTestId("tobiishi-chips")).toBeVisible();
        const first = await reading();
        expect(first.across, "the page runs wider than the screen").toBe(true);
        for (const size of ["6", "9", "3"]) {
          await page.locator(`[data-testid="set-up-size"][data-size="${size}"]`).click();
          await expect(preview).toHaveAttribute("data-size", size);
          expect(await reading(), `after choosing length ${size}`).toEqual(first);
        }
        // A wide board and a tall one in the same box: the boxes do not change with the shape.
        for (const level of ["22", "25", "27", "1"]) {
          await page.locator(`[data-testid="tobiishi-level"][data-level="${level}"]`).click();
          await expect(preview).toHaveAttribute("data-level", level);
          expect(await reading(), `after choosing level ${level}`).toEqual(first);
        }
      } finally {
        await context.close();
        await removeMember(email);
      }
    });
  }

  test("level 2 at 3 jumps is solved by tapping, paid, kept, and offers the next level and the board of levels", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "solve");
    try {
      const level = levelOf(3, 2);
      await openLevel(page, 3, 2);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-level", "2");
      await expect(page.getByTestId("puzzle-asked")).toContainText(`Short · Level 2 of ${TOBIISHI_LEVELS_A_SIZE}`);
      expect(await pegsLeft(page)).toBe(4);
      // A level has no hint and no countdown, and Undo and Restart have nothing to take back yet.
      await expect(page.getByTestId("puzzle-hint")).toHaveCount(0);
      await expect(page.getByTestId("tobiishi-undo")).toBeDisabled();
      await expect(page.getByTestId("tobiishi-restart")).toBeDisabled();
      await expect(page.getByTestId("tobiishi-said")).toContainText("Tap a peg, then the empty hole it should jump to");

      await playByTapping(page, level.answer);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
      expect(await pegsLeft(page)).toBe(1);
      // The way on is the next level and the board of levels, not Another.
      await expect(page.getByTestId("puzzle-another")).toHaveCount(0);
      await expect(page.getByTestId("puzzle-next-level")).toContainText("Level 1, the first one you have not finished");
      await expect(page.getByTestId("tobiishi-level-fastest")).toContainText("Fastest on level 2");

      // The board of levels shows it solved, with its time, and the preview draws the board as it ended.
      await page.getByTestId("puzzle-all-levels").click();
      await ready(page, "puzzle-set-up");
      const tile = page.locator('[data-testid="tobiishi-level"][data-level="2"]');
      await expect(tile).toHaveAttribute("data-state", "solved");
      await expect(page.getByTestId("tobiishi-levels-caption")).toContainText(`Short: 1 of ${TOBIISHI_LEVELS_A_SIZE} solved.`);
      await tile.click();
      await expect(page.getByTestId("tobiishi-preview")).toHaveAttribute("data-state", "solved");
      await expect(page.getByTestId("tobiishi-preview-board")).toHaveAttribute("data-pegs", "1");
      await expect(page.getByTestId("tobiishi-preview-caption")).toContainText("Solved, best");

      // Opened again, a solved level shows how it ended, and only Play it again starts it over.
      await page.getByTestId("puzzle-solve").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("tobiishi-solved-view")).toContainText("Solved, best");
      await page.getByTestId("tobiishi-play-again").click();
      await expect(page.getByTestId("tobiishi-board")).toBeVisible();
      expect(await jumpsMade(page)).toBe(0);
      expect(await pegsLeft(page)).toBe(4);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a long level is solved by dragging each peg across, and a solve is kept and its page draws the board it ended on", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "drag");
    try {
      const level = levelOf(6, 14);
      await openLevel(page, 6, 14);
      expect(await pegsLeft(page)).toBe(7);
      for (const { from, to } of level.answer) await dragJump(page, from, to);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      expect(await pegsLeft(page)).toBe(1);
      // The solve is a row of the account's: its own page draws the board as the jumps left it.
      await page.goto(mySolvePath(KIND, await newestSolveOf(email, KIND)));
      await ready(page, "solve-board");
      await expect(page.getByTestId("tobiishi-still")).toHaveAttribute("data-pegs", "1");
      await expect(page.getByTestId("tobiishi-still").locator("svg")).toBeVisible();
      await expect(page.getByTestId("solve-level")).toContainText("14, medium");
      await expect(page.getByTestId("solve-outcome")).toContainText("Solved");
      await expect(page.getByTestId("solve-note-finished")).toContainText("one peg left, in the goal");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a peg jumps only where the rules allow, Undo and Restart take jumps back, and a stuck board says so", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "rules");
    try {
      const level = levelOf(6, 5);
      await openLevel(page, 6, 5);
      const [first] = level.answer;
      // A peg chosen rings the holes it can reach and no others; a hole that is not one of them does nothing.
      await hole(page, first!.from).click();
      await expect(hole(page, first!.to)).toHaveAttribute("data-legal", "true");
      const reachable = await page.locator('[data-testid="tobiishi-hole"][data-legal="true"]').count();
      expect(reachable).toBeGreaterThan(0);
      const pegs = await pegsLeft(page);
      // The goal hole is empty at the start and is not a jump from this peg (a level is made so that the first jump is the only ring... or one of few).
      const notReached = page.locator('[data-testid="tobiishi-hole"][data-legal="false"][data-peg="false"]').first();
      await notReached.click();
      expect(await pegsLeft(page), "a jump the rules do not allow took a peg").toBe(pegs);
      expect(await jumpsMade(page)).toBe(0);
      // Choosing the peg again lets go of it.
      await hole(page, first!.from).click();
      await hole(page, first!.from).click();
      await expect(page.locator('[data-testid="tobiishi-hole"][data-legal="true"]')).toHaveCount(0);

      // Two jumps, then Undo takes one back and Restart sets all the pegs out again.
      await playByTapping(page, level.answer, 2);
      await expect(page.getByTestId("tobiishi-said")).toContainText("5 pegs left after 2 jumps.");
      await page.getByTestId("tobiishi-undo").click();
      expect(await jumpsMade(page)).toBe(1);
      expect(await pegsLeft(page)).toBe(6);
      await page.getByTestId("tobiishi-restart").click();
      expect(await jumpsMade(page)).toBe(0);
      expect(await pegsLeft(page)).toBe(7);
      await expect(page.getByTestId("tobiishi-undo")).toBeDisabled();
      await expect(page.getByTestId("tobiishi-said")).toContainText("Tap a peg");

      // Taking pegs in an order that ends on one peg away from the goal is not a solve, and says so.
      const wrong = runToTheWrongHole(level.game);
      expect(wrong, "a level of seven pegs has a run that ends away from its goal").not.toBeNull();
      await playByTapping(page, wrong!);
      await expect(page.getByTestId("tobiishi-said")).toContainText("One peg is left, but not in the goal");
      await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "false");
      await expect(page.getByTestId("puzzle-done")).toHaveCount(0);
      await expect(page.getByTestId("tobiishi-board")).toHaveAttribute("data-stuck", "true");
      // And Undo goes back out of it.
      await page.getByTestId("tobiishi-undo").click();
      await expect(page.getByTestId("tobiishi-board")).toHaveAttribute("data-stuck", "false");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the keyboard plays too: arrow keys move between holes, Enter chooses a peg and then a hole", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "keys");
    try {
      const level = levelOf(3, 1);
      await openLevel(page, 3, 1);
      const [first] = level.answer;
      await hole(page, first!.from).focus();
      await page.keyboard.press("Enter");
      await expect(hole(page, first!.to)).toHaveAttribute("data-legal", "true");
      await page.keyboard.press("Escape");
      await expect(page.locator('[data-testid="tobiishi-hole"][data-legal="true"]')).toHaveCount(0);
      // An arrow key moves the focus to another hole.
      await page.keyboard.press("ArrowRight");
      const focused = await page.evaluate(() => document.activeElement?.getAttribute("data-cell"));
      expect(focused, "the arrow key moved the focus to a hole").not.toBeNull();
      expect(focused).not.toBe(String(first!.from));
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a level left half played is in My games, opens with its jumps made again, and finishes", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "kept");
    try {
      const level = levelOf(9, 9);
      await openLevel(page, 9, 9);
      await playByTapping(page, level.answer, 4);
      expect(await jumpsMade(page)).toBe(4);
      await page.getByTestId("puzzle-pause").click();
      await expect(page.getByTestId("puzzle-paused")).toBeVisible();

      // Clicked away by the site's own navigation: it waits in My games, named by its level.
      await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
      await expect(page).toHaveURL(/\/play$/);
      await ready(page, "tabs");
      await page.locator('[data-testid="tab"][data-tab="going"]').click();
      const row = page.locator(`[data-testid="puzzle-going"][data-kind="tobiishi"][data-seed="9"]`);
      await expect(row, "the level left unfinished is not in My games").toBeVisible();
      await expect(row).toContainText("Long · Level 9");

      await row.getByTestId("puzzle-going-continue").click();
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-pausable")).toHaveAttribute("data-paused", "false");
      // Opened where it was left: the same jumps, made again, and running.
      await expect(page.getByTestId("tobiishi-board")).toHaveAttribute("data-jumps", "4");
      expect(await pegsLeft(page)).toBe(6);
      await expect(page.getByTestId("tobiishi-undo")).toBeEnabled();
      await playByTapping(page, level.answer.slice(4));
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");

      // Solved, it is no longer going.
      await page.goto("/play");
      await expect(page.getByTestId("my-games")).toBeVisible();
      await expect(page.locator(`[data-testid="puzzle-going"][data-kind="tobiishi"][data-seed="9"]`), "a solved level is still listed as going").toHaveCount(0);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the server pays for a run to the goal and for nothing else", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "check");
    try {
      const ref = tobiishiRefOf(6, 4)!;
      const level = levelOf(6, 4);
      await openLevel(page, 6, 4);
      let game = level.game;
      for (const { from, to } of level.answer) game = jumpAt(game, from, to);
      const answer = encodeJumps(game);
      const handed = (body: object) => page.request.post("/api/puzzles/solved", { data: { kind: KIND, size: 6, level: "medium", seed: 4, givens: tobiishiCodeOf(ref), elapsedMs: 5000, ...body } });
      // A run one jump short, a run twice over, a code that is no level's, and a length it is not of: each refused, none paid.
      expect((await handed({ answer: answer.slice(0, -4) })).status()).toBe(422);
      expect((await handed({ answer: answer + answer })).status()).toBe(422);
      expect((await handed({ answer: "0000" })).status()).toBe(422);
      expect((await handed({ answer, givens: "english:centre:5" })).status()).toBe(422);
      expect((await handed({ answer, size: 3, level: "easy" })).status()).toBe(422);
      const paid = await handed({ answer });
      expect(paid.status()).toBe(200);
      expect(((await paid.json()) as { ok: boolean }).ok).toBe(true);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("on a phone the board fits, and a finger drags a peg across or taps the jumps", async ({ browser, baseURL }) => {
    const email = `tobiishi-phone-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
    const context = await memberContext(browser, baseURL!, { email, name: "Tobiishi Phone" }, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    try {
      const page = await context.newPage();
      const level = levelOf(6, 3);
      await openLevel(page, 6, 3);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "the page runs wider than the screen").toBeLessThanOrEqual(0);
      // The first jump with a real touch, dragged: pressed on the peg, moved across, lifted over the hole (the mouse is not a finger).
      const [first, ...rest] = level.answer;
      const a = (await hole(page, first!.from).boundingBox())!;
      const b = (await hole(page, first!.to).boundingBox())!;
      const touch = await context.newCDPSession(page);
      const at = (box: { x: number; y: number; width: number; height: number }) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 });
      await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [at(a)] });
      for (let step = 1; step <= 6; step += 1) {
        const mid = { x: a.x + ((b.x - a.x) * step) / 6, y: a.y + ((b.y - a.y) * step) / 6, width: a.width, height: a.height };
        await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [at(mid)] });
      }
      await expect(page.getByTestId("tobiishi-ghost"), "a peg dragged by a finger follows it").toBeVisible();
      await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await expect(page.getByTestId("tobiishi-board")).toHaveAttribute("data-jumps", "1");
      await expect(page.getByTestId("tobiishi-ghost")).toHaveCount(0);
      // The rest by taps.
      for (const { from, to } of rest) {
        const before = await jumpsMade(page);
        await hole(page, from).tap();
        await expect(hole(page, to)).toHaveAttribute("data-legal", "true");
        await hole(page, to).tap();
        await expect(page.getByTestId("tobiishi-board")).toHaveAttribute("data-jumps", String(before + 1));
      }
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a tap on one peg then another peg moves the choice, and tapJump is the same as a tap", async ({ browser, baseURL }) => {
    const { context, page, email } = await aMember(browser, baseURL, "choice");
    try {
      const level = levelOf(3, 3);
      await openLevel(page, 3, 3);
      const [first] = level.answer;
      const other = level.game.pegs.findIndex((peg, at) => peg && at !== first!.from);
      await hole(page, first!.from).click();
      await expect(page.getByTestId("tobiishi-board")).toHaveAttribute("data-selected", String(first!.from));
      await hole(page, other).click();
      await expect(page.getByTestId("tobiishi-board")).toHaveAttribute("data-selected", String(other));
      await hole(page, other).click();
      await expect(page.getByTestId("tobiishi-board")).toHaveAttribute("data-selected", "");
      await tapJump(page, first!.from, first!.to);
      expect(await jumpsMade(page)).toBe(1);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});
