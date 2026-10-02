import { expect, test, type Locator, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "../src/lib/gomoku/variants.constants";
import { KUMIMOJI_HANDS } from "../src/lib/puzzles/kumimoji/tiles.constants";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * NOTHING YOU PRESS OR PLAY ON IS TEXT TO SELECT; WHAT YOU READ IS.
 *
 * John, 2026-09-28, with a screenshot of Kumimoji's play page where a drag had
 * painted the tray's heading, "37 in the bag", the board-style chips, Draw,
 * Trade, To hand, All back and the letters on the tiles blue: "Site wide:
 * Buttons and labels should usually not be selectable… when these are play
 * elements or buttons, they should not. FIX. MAJOR."
 *
 * Every case here does what a reader does to select — Select All from the
 * keyboard, a drag with the mouse, a triple click — and reads what the
 * browser selected, because a computed style is a claim about the page and
 * the selection is the thing John saw. The computed styles are asked as well,
 * on every control and every element of every play surface, so a surface a
 * gesture happened to miss is still held. And the other half is asked every
 * time: the rules, a move list, a member's name and a text box are still
 * text, since a fix that made the whole site unselectable would pass the
 * first half and break reading.
 *
 * At a desk and at 390 pixels, since the phone is where a stray long press
 * or drag selects things, and the tray sits differently there.
 */

const WIDTHS = [
  { name: "desk", viewport: { width: 1280, height: 1000 } },
  { name: "phone", viewport: { width: 390, height: 844 } },
] as const;

/**
 * In the page: every control, and every element on a play surface, whose
 * computed `user-select` is not `none`. A reading island (`select-text`, a
 * move list) and a text box are the decided exceptions and are left out.
 */
async function selectableThatShouldNotBe(page: Page) {
  return page.evaluate(() => {
    const exempt = (el: Element) => el.closest(".select-text, input, textarea, [contenteditable='true']") !== null;
    const shown = (el: Element) => {
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    };
    const controls = [
      ...document.querySelectorAll('button, summary, label, [role="button"], [role="tab"], [role="radio"], [role="switch"], [role="checkbox"]'),
    ].filter((el) => shown(el) && !exempt(el));
    const surfaces = [...document.querySelectorAll(".play-surface")];
    const onSurfaces = surfaces.flatMap((surface) => [surface, ...surface.querySelectorAll("*")]).filter((el) => !exempt(el));
    const wrong = [...controls, ...onSurfaces].filter((el) => getComputedStyle(el).userSelect !== "none");
    return {
      controls: controls.length,
      surfaces: surfaces.length,
      onSurfaces: onSurfaces.length,
      wrong: [...new Set(wrong)].slice(0, 10).map((el) => `${el.tagName.toLowerCase()}[${el.getAttribute("data-testid") ?? ""}] "${(el.textContent ?? "").trim().slice(0, 40)}"`),
    };
  });
}

async function expectNothingPlayableSelectable(page: Page, surfaces: number) {
  const found = await selectableThatShouldNotBe(page);
  expect(found.controls, "controls were found on the page at all").toBeGreaterThan(0);
  expect(found.surfaces, "play surfaces on the page").toBeGreaterThanOrEqual(surfaces);
  expect(found.wrong, "a control or a play element that a selection could pick up").toEqual([]);
}

async function expectSelectable(target: Locator) {
  await expect(target).toBeVisible();
  expect(["auto", "text"]).toContain(await target.evaluate((el) => getComputedStyle(el).userSelect));
}

/** Select All from the keyboard, the way a reader does, with nothing focused that would keep it to one box. */
async function selectAll(page: Page): Promise<string> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("ControlOrMeta+A");
  return page.evaluate(() => window.getSelection()?.toString() ?? "");
}

async function selection(page: Page): Promise<string> {
  return page.evaluate(() => window.getSelection()?.toString() ?? "");
}

async function clearSelection(page: Page) {
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
}

/** A mouse drag from one corner of a box to the other, pressed the whole way. */
async function dragAcross(page: Page, box: Locator) {
  const at = (await box.boundingBox())!;
  await page.mouse.move(at.x + 3, at.y + 3);
  await page.mouse.down();
  await page.mouse.move(at.x + at.width - 3, at.y + at.height - 3, { steps: 10 });
  await page.mouse.up();
}

/** A triple click, which selects a whole paragraph of text, straight at the middle of an element — enabled or not. */
async function tripleClick(page: Page, target: Locator) {
  const at = (await target.boundingBox())!;
  await page.mouse.click(at.x + at.width / 2, at.y + at.height / 2, { clickCount: 3 });
}

for (const { name, viewport } of WIDTHS) {
  test.describe(`nothing played on is selectable, on a ${name}`, () => {
    test.use({ viewport });

    test("Kumimoji: Select All, a drag across the tray, a triple click and a tile dragged to the table pick up nothing but the words about it", async ({ page }) => {
      await page.goto(`/games/${PUZZLE_SLUGS.kumimoji}/play?size=${KUMIMOJI_HANDS.quick}&level=medium&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      const tray = page.getByTestId("kumimoji-tray");
      await expect(tray.getByTestId("kumimoji-hand-tile").first()).toBeVisible();
      await expectNothingPlayableSelectable(page, 1);

      // Select All: the words under the puzzle come, and nothing from the tray, its chips or its buttons does.
      const all = await selectAll(page);
      expect(all).toContain(PUZZLE_DISPLAY.kumimoji.tagline);
      for (const label of ["in the bag", "Your hand", "Sort", "Trade", "To hand", "All back", "Reversi", "Gomoku"]) {
        expect(all, `Select All picked up "${label}"`).not.toContain(label);
      }
      expect(all).not.toContain(await page.getByTestId("kumimoji-draw").innerText());
      await clearSelection(page);

      // A drag straight across the tray, labels, tiles and buttons alike.
      await dragAcross(page, tray);
      expect(await selection(page)).toBe("");

      // A triple click on the bag's count and on a button, which would select a whole line of text.
      await tripleClick(page, page.getByTestId("kumimoji-bag"));
      expect(await selection(page)).toBe("");
      await tripleClick(page, page.getByTestId("kumimoji-sort"));
      expect(await selection(page)).toBe("");

      // And the game's own drag: a tile from the hand onto the table.
      const tile = await tray.getByTestId("kumimoji-hand-tile").first().boundingBox();
      const table = await page.getByTestId("kumimoji-table").boundingBox();
      await page.mouse.move(tile!.x + tile!.width / 2, tile!.y + tile!.height / 2);
      await page.mouse.down();
      await page.mouse.move(table!.x + table!.width / 2, table!.y + table!.height / 2, { steps: 12 });
      await page.mouse.up();
      expect(await selection(page)).toBe("");
    });

    test("a board game in play: the board is not text, the move list and the paste box are", async ({ page }) => {
      await page.goto("/games/gomoku/play");
      await ready(page, "game-view");
      const empties = page.getByRole("button", { name: /, empty$/ });
      await empties.first().waitFor({ state: "visible" });
      await empties.nth(112).click();
      await empties.nth(113).click();
      const record = page.getByTestId("move-history");
      await expect(record).toContainText("H8");
      await expectNothingPlayableSelectable(page, 1);

      // The notation is copied, so a move stays text though it is a button to jump to.
      await expectSelectable(record.locator("button[data-move='1']"));
      // And a box to paste a game into is a box to type in.
      const paste = page.getByTestId("paste-moves-text");
      await expectSelectable(paste);
      await paste.fill("1. h8 2. j9");
      await expect(paste).toHaveValue("1. h8 2. j9");
      await paste.fill("");

      expect(await selectAll(page)).toContain("H8");
      await clearSelection(page);

      // A drag across the board selects nothing.
      await dragAcross(page, page.getByTestId("board-surface"));
      expect(await selection(page)).toBe("");
    });

    test("Gomoji: the grid and the keyboard are not text", async ({ page }) => {
      await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/play?size=5&level=easy&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      // The on-screen keys are the device's choice until asked for; a reader at a desk asks with the toggle.
      const keys = page.getByTestId("word-keyboard");
      if (!(await keys.isVisible())) await page.getByTestId("word-keys-toggle").click();
      await expect(keys).toBeVisible();
      await expectNothingPlayableSelectable(page, 2);
      const all = await selectAll(page);
      expect(all).not.toContain("Enter");
      await clearSelection(page);
      await dragAcross(page, keys);
      expect(await selection(page)).toBe("");
      await dragAcross(page, page.getByTestId("puzzle-grid"));
      expect(await selection(page)).toBe("");
    });

    test("a number puzzle: the cells and their digits are not text", async ({ page }) => {
      await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=4&level=easy&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-grid")).toBeVisible();
      await expectNothingPlayableSelectable(page, 2);
      await dragAcross(page, page.getByTestId("puzzle-grid"));
      expect(await selection(page)).toBe("");
    });

    test("Tsunagi: drawing a line across the board selects nothing", async ({ page }) => {
      await page.goto(`/games/${PUZZLE_SLUGS.tsunagi}/play?size=4&seed=1`);
      await ready(page, "puzzle-play");
      const board = page.getByTestId("tsunagi-board");
      await expect(board).toBeVisible();
      await expectNothingPlayableSelectable(page, 2);
      await dragAcross(page, board);
      expect(await selection(page)).toBe("");
    });

    test("Meikyuu: drawing a line across the maze selects nothing, and the buttons under it are not text", async ({ page }) => {
      await page.goto(`/games/${PUZZLE_SLUGS.meikyuu}/play?size=1&level=easy&seed=5`);
      await ready(page, "puzzle-play");
      const board = page.getByTestId("meikyuu-board");
      await expect(board.locator("svg")).toBeVisible();
      await expectNothingPlayableSelectable(page, 2);
      await dragAcross(page, board);
      expect(await selection(page)).toBe("");
    });

    test("a party table: the names are typed into boxes, and the table they sit at is not text", async ({ page }) => {
      await page.goto("/games/dots-and-boxes");
      await page.evaluate(() => window.localStorage.removeItem("itsutsu.dotsAndBoxes"));
      await page.goto("/games/dots-and-boxes/pass-and-play");
      await ready(page, "dots-set-up");
      const first = page.getByTestId("dots-name").first();
      await expectSelectable(first);
      await first.fill("Ann");
      await expect(first).toHaveValue("Ann");
      await page.getByTestId("dots-start").click();
      await ready(page, "dots-game");
      await expect(page.getByTestId("dots-board")).toBeVisible();
      await expectNothingPlayableSelectable(page, 2);
      await dragAcross(page, page.getByTestId("dots-game"));
      expect(await selection(page)).toBe("");
    });

    test("the set-up screen: its tiles and preview are not text, the words about the game are", async ({ page }) => {
      await page.goto("/games/gomoku/new");
      await ready(page, "set-up-game");
      await expectNothingPlayableSelectable(page, 1);
      expect(await selectAll(page)).toContain(RULE_VARIANT_DISPLAY.freestyle.tagline);
    });

    test("a rules page is reading, and reads as text", async ({ page }) => {
      await page.goto("/games/gomoku/rules");
      const rules = page.getByTestId("rules-page");
      await expectSelectable(rules);
      const sentence = (await rules.locator("p").first().innerText()).trim();
      expect(sentence.length).toBeGreaterThan(10);
      expect(await selectAll(page)).toContain(sentence.slice(0, 40));
      await expectNothingPlayableSelectable(page, 0);
    });

    test("a member's name is text, in the players table and on their own page", async ({ page }) => {
      await page.goto("/players");
      const named = page.locator('table a[href^="/players/"]').first();
      await expectSelectable(named);
      const who = (await named.innerText()).trim();
      expect(await selectAll(page)).toContain(who);
      await expectNothingPlayableSelectable(page, 0);

      await clearSelection(page);
      await named.click();
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toContainText(who);
      await expectSelectable(heading);
      expect(await selectAll(page)).toContain(who);
    });

    test("My games: its controls are not text, its heading is", async ({ page }) => {
      await page.goto("/play");
      const heading = page.getByRole("heading", { level: 1 });
      await expectSelectable(heading);
      await expectNothingPlayableSelectable(page, 0);
      expect(await selectAll(page)).toContain((await heading.innerText()).split("\n")[0]!.trim());
    });
  });
}
