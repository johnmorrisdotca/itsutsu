import { appendFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { mySolvePath } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { surveyOfPlays, type Survey } from "./playSurvey";
import { freshPuzzleSeed, openSetUpPage, PLAYER_STATE, ready } from "./support";
import { gamesMade } from "./tidy";

/**
 * NOTHING MOVES WHEN THE LANGUAGE DOES.
 *
 * A reader in the middle of a game chooses Japanese, and the board, the goal
 * and the presses jump, because the words around them are a different width.
 * This opens every play at a fixed window and in a fixed state, reads where
 * everything is, chooses Japanese by CLICKING the account menu's picker, reads
 * again, chooses English by clicking again, and reads a third time. It never
 * reloads: a reload throws away the state the question is about, and the picker
 * in the footer is hidden while a game is played (`PlayingNow`), so the menu is
 * the control a player actually has.
 *
 * WHAT A STATE BEING FIXED MEANS. The clock is stopped once the page is ready,
 * so a computer does not take its turn between two readings and a game clock
 * does not tick from 0:59 to 1:00: whatever moved, the language moved it.
 *
 * THE LIST IS THE CATALOGUE. `surveyOfPlays` is the list `bare-board.spec.ts`
 * walks, and `bareSurvey.coverage.test.ts` holds it to the catalogue, so a new
 * game joins this survey by joining that one.
 *
 * NOT EVERY PLAY AT EVERY WIDTH, AND THAT IS A DECISION. A case takes about a
 * second, and eighty games at three widths is four minutes on every release
 * (AGENTS.md, "A spec's wall time is paid on every release"). So each play is
 * read at one width, taken in turn down the list, and the plays in `AT_EVERY_WIDTH`,
 * one of each kind of layout, at all three. The primitives a width can break are
 * shared, so a width's fault shows on the plays it does take. The whole sweep,
 * about five minutes, is `LANGUAGE_STEADY_EVERY_WIDTH=1`.
 */

/*
 * WHAT THIS TOLERATES, AND NOTHING ELSE MAY MOVE.
 *
 * `BOARD_PX`: the board's box, in all four of its numbers. A rounding of a
 * fraction of a pixel, nothing a person could see.
 *
 * `ROW_PX`: how far the top of anything that plays the board may move. A pixel
 * and a half, because a control centred in its row lands on a half pixel when
 * its neighbour's font sits differently. A line wrapping is at least sixteen.
 *
 * `SLIDE_PX`: how far a press may slide along its row, since the word on it and
 * the words beside it have changed. Below this, a neighbour's word was longer
 * than the room kept for it; above it, the press has gone somewhere a thumb
 * will not find it.
 *
 * `WAY_BACK_PX`: everything on the page, furniture too, back where it was when
 * English came back. A choice that cannot be undone is the fault this file's
 * sibling `language.spec.ts` was written for.
 *
 * What "plays the board" means is what Just the board keeps: everything but
 * `[data-chrome]`, an `aside` not marked `data-bare-keep`, the masthead and the
 * footer. Furniture may reflow, since nobody is aiming at it mid-move, but it
 * may not clip, and it may not push the board.
 *
 * Nothing here says a control may not change its WIDTH: a longer word is wider,
 * and the rule is that its neighbours and the board do not care.
 */
const BOARD_PX = 0.6;
const ROW_PX = 1.5;
const SLIDE_PX = 24;
const WAY_BACK_PX = 1;

/** Things that do move, each named with the reason, so an exception is a decision rather than a loose number. */
const MAY_MOVE: readonly { id: RegExp; why: string }[] = [
  // Australia is 豪州: the list of places is in the reading order of the language it is written in.
  { id: /^button#tenka-region\b/, why: "places are listed in the order of the language they are named in" },
];

type Box = { key: string; principal: boolean; control: boolean; text: string; x: number; y: number; w: number; h: number };
type Reading = { boxes: Box[]; clipped: string[]; across: number; words: string };

declare global {
  interface Window {
    __steady?: { element: Element; key: string; principal: boolean; control: boolean }[];
    __steadyBoard?: Element;
  }
}

/** Where a page that is not a play says its board and its play are. */
type Scope = { boardIs?: string; playIs?: string };

/** Reads the page. The first reading chooses what to follow, and every later one follows the same elements. */
async function readPage(page: Page, scope: Scope = {}): Promise<Reading> {
  return page.evaluate(({ boardIs, playIs }) => {
    const main = document.querySelector("main")!;
    if (window.__steady === undefined) {
      /*
       * The board is the largest drawn thing in the board's column: the wood, a
       * puzzle's grid, a card table's felt, a Houseki well. A word game has
       * none, and its whole column stands in for it.
       */
      const column = main.querySelector("[data-bare-board]") ?? main;
      let board: Element | null = null;
      let largest = 0;
      for (const element of column.querySelectorAll('canvas, svg, [data-testid="board-surface"], [role="grid"], table, [data-testid$="-board"], [data-testid$="-grid"], [data-testid$="-map"], [data-testid$="-well"], [data-testid$="-table"]')) {
        const at = element.getBoundingClientRect();
        const area = at.width * at.height;
        // The outer of two nearly the same size: a frame, not the drawing in it.
        if (area > largest * 1.02) {
          largest = area;
          board = element;
        }
      }
      const theBoard = (boardIs === undefined ? null : main.querySelector(boardIs)) ?? board ?? column;
      window.__steadyBoard = theBoard;
      // What is being played is what the size chooser wraps: under it is the page's furniture, whatever it is not marked.
      const play = (playIs === undefined ? null : main.querySelector(playIs)) ?? main.querySelector("[data-board-scaling]") ?? main;
      const list: NonNullable<Window["__steady"]> = [{ element: theBoard, key: "the board", principal: true, control: false }];
      const counts = new Map<string, number>();
      for (const element of main.querySelectorAll('button, a[href], select, input, textarea, [role="button"], [data-testid], h1, h2, h3, h4')) {
        if (theBoard.contains(element) || element.closest("footer") !== null) continue;
        const at = element.getBoundingClientRect();
        if (at.width <= 1 || at.height <= 1) continue;
        const id = element.getAttribute("data-testid");
        const base = `${element.tagName.toLowerCase()}${id === null ? "" : `#${id}`}`;
        const seen = counts.get(base) ?? 0;
        counts.set(base, seen + 1);
        list.push({
          element,
          key: `${base}[${seen}]`,
          principal: play.contains(element) && element.closest('[data-chrome], aside:not([data-bare-keep]), footer, header') === null,
          control: element.matches('button, a[href], select, input, textarea, [role="button"]'),
        });
      }
      window.__steady = list;
    }
    const boxes = window.__steady.map((tracked) => {
      // A list drawn again by its words (a key holding a phrase) makes new elements: the same testid and place in it is the same thing.
      if (!tracked.element.isConnected) {
        const id = tracked.element.getAttribute("data-testid");
        const again = id === null ? [] : [...main.querySelectorAll(`[data-testid="${id}"]`)];
        const place = Number(/\[(\d+)\]$/.exec(tracked.key)?.[1] ?? 0);
        if (again[place] !== undefined) tracked.element = again[place];
      }
      const { element, key, principal, control } = tracked;
      const at = element.getBoundingClientRect();
      return { key, principal, control, text: (element.textContent ?? "").trim().slice(0, 30), x: at.left + window.scrollX, y: at.top + window.scrollY, w: at.width, h: at.height };
    });
    const clipped: string[] = [];
    for (const element of main.querySelectorAll("*")) {
      if (element.closest("footer, header") !== null || element.closest("svg") !== null) continue;
      if (![...element.childNodes].some((node) => node.nodeType === 3 && node.textContent!.trim() !== "")) continue;
      const style = getComputedStyle(element);
      const box = element as HTMLElement;
      if (box.clientWidth <= 1) continue;
      const cut = (style.overflowX !== "visible" && box.scrollWidth > box.clientWidth + 1) || (style.overflowY !== "visible" && box.scrollHeight > box.clientHeight + 1);
      if (cut) clipped.push(`${element.tagName.toLowerCase()}#${element.getAttribute("data-testid") ?? ""} "${(element.textContent ?? "").trim().slice(0, 40)}"`);
    }
    return {
      boxes,
      clipped,
      across: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      words: (main.textContent ?? "").slice(0, 6000),
    };
  }, scope);
}

/** Lets what the choice drew finish drawing: frames run by hand, because the clock is stopped, until two readings agree. */
async function settled(page: Page, scope: Scope = {}): Promise<Reading> {
  await page.clock.runFor(34);
  let last = await readPage(page, scope);
  for (let turn = 0; turn < 30; turn += 1) {
    await page.clock.runFor(34);
    await page.waitForTimeout(30);
    const now = await readPage(page, scope);
    if (JSON.stringify(now.boxes) === JSON.stringify(last.boxes)) return now;
    last = now;
  }
  return last;
}

/** Chooses a language in the account menu, as a player does, and shuts the menu again. */
async function choose(page: Page, locale: "en" | "ja") {
  const current = page.getByTestId("menu-language-picker").locator('[data-current="true"]');
  await page.getByTestId("account-menu-button").click();
  await page.getByTestId("menu-language-picker").locator(`[data-locale="${locale}"]`).click();
  await expect
    .poll(async () => {
      await page.clock.runFor(16);
      return current.getAttribute("data-locale");
    })
    .toBe(locale);
  await page.getByTestId("account-menu-button").click();
  await expect(page.getByTestId("account-menu-panel")).toHaveCount(0);
}

const rounded = (value: number) => Math.round(value * 10) / 10;

/** What moved between two readings of the same page, in words a failure can be fixed from. */
function movedBetween(before: Reading, after: Reading): string[] {
  const problems: string[] = [];
  const now = new Map(after.boxes.map((box) => [box.key, box]));
  for (const box of before.boxes) {
    const then = now.get(box.key);
    if (then === undefined) continue;
    const dx = then.x - box.x;
    const dy = then.y - box.y;
    const said = `"${box.text}" → "${then.text}"`;
    if (box.key === "the board") {
      const off = [dx, dy, then.w - box.w, then.h - box.h].some((each) => Math.abs(each) > BOARD_PX);
      if (off) problems.push(`the board moved by ${rounded(dx)},${rounded(dy)} and changed size by ${rounded(then.w - box.w)}×${rounded(then.h - box.h)}`);
      continue;
    }
    if (!box.principal || MAY_MOVE.some(({ id }) => id.test(box.key))) continue;
    if (Math.abs(dy) > ROW_PX) problems.push(`${box.key} moved ${rounded(dy)}px down the page, ${said}`);
    if (box.control && Math.abs(dx) > SLIDE_PX) problems.push(`${box.key} slid ${rounded(dx)}px along its row, ${said}`);
  }
  return problems;
}

/** Everything back where it started, furniture too. */
function notBack(before: Reading, after: Reading): string[] {
  const now = new Map(after.boxes.map((box) => [box.key, box]));
  return before.boxes.flatMap((box) => {
    const then = now.get(box.key);
    if (then === undefined || MAY_MOVE.some(({ id }) => id.test(box.key))) return [];
    const off = [then.x - box.x, then.y - box.y, then.w - box.w, then.h - box.h].some((each) => Math.abs(each) > WAY_BACK_PX);
    return off ? [`${box.key} did not come back: ${rounded(box.x)},${rounded(box.y)} ${rounded(box.w)}×${rounded(box.h)} became ${rounded(then.x)},${rounded(then.y)} ${rounded(then.w)}×${rounded(then.h)}`] : [];
  });
}

async function opened(page: Page, play: Survey) {
  await page.clock.install();
  await play.open(page);
  await ready(page, "account-menu");
  await page.clock.pauseAt(Date.now() + 1000);
}

const OUT = process.env.STEADY_OUT ?? "";

/** The survey of one play at one window. */
async function surveyed(page: Page, play: Survey, scope: Scope = {}): Promise<Reading> {
  await opened(page, play);
  const english = await settled(page, scope);
  await choose(page, "ja");
  const japanese = await settled(page, scope);
  await choose(page, "en");
  const back = await settled(page, scope);
  if (OUT !== "") appendFileSync(OUT, `${JSON.stringify({ play: play.name, width: page.viewportSize()!.width, ms: 0, en: english, ja: japanese, back })}\n`);

  // A language that changed nothing is a page this says nothing about: every play has words.
  expect(japanese.words, `${play.name}: choosing Japanese changed none of its words`).not.toBe(english.words);
  expect(english.boxes.filter((box) => box.control && box.principal).length, `${play.name}: nothing to press was found, so nothing was measured`).toBeGreaterThan(0);

  expect(movedBetween(english, japanese), `${play.name}: moved when Japanese was chosen`).toEqual([]);
  expect(notBack(english, back), `${play.name}: was not where it had been when English came back`).toEqual([]);
  expect(japanese.clipped, `${play.name}: words cut off in Japanese`).toEqual([]);
  expect(english.clipped, `${play.name}: words cut off in English`).toEqual([]);
  expect(japanese.across, `${play.name}: the page scrolls sideways in Japanese`).toBeLessThanOrEqual(0);
  expect(english.across, `${play.name}: the page scrolls sideways in English`).toBeLessThanOrEqual(0);
  return back;
}

/*
 * LONG LABELS AND LARGE COUNTERS, which the site cannot be asked to draw: nobody
 * can score a million on request, and no translation here is as long as the
 * longest one will be. So these are written into the page, the one place in this
 * file that does what a reader cannot, and they ask only what a page owes its
 * words whatever they turn out to be: nothing is cut off, nothing runs off the
 * side, and the board keeps its size.
 */

/** Every number around the board, grown. The board is left alone: a figure on a tile is not a counter. */
async function largeCounters(page: Page) {
  await page.evaluate(() => {
    const board = window.__steadyBoard!;
    const walker = document.createTreeWalker(document.querySelector("main")!, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      if (board.contains(node) || node.parentElement?.closest("footer, header") != null) continue;
      if (/\d/.test(node.textContent ?? "")) node.textContent = (node.textContent ?? "").replace(/\d+/g, "888888");
    }
  });
}

/** Every press named in words, named at length. */
async function longLabels(page: Page) {
  await page.evaluate(() => {
    const board = window.__steadyBoard!;
    for (const press of document.querySelectorAll("main button, main a[href]")) {
      if (board.contains(press) || press.closest("footer, header") !== null || press.children.length > 0) continue;
      const words = (press.textContent ?? "").trim();
      if (words.length > 1) press.textContent = `${words} ${words} とても長い翻訳のラベル ${words}`;
    }
  });
}

/** What a page owes its words, whatever they are. */
function owed(name: string, width: number, before: Reading, after: Reading) {
  const board = (reading: Reading) => reading.boxes.find((box) => box.key === "the board")!;
  expect(after.across, `${name}: the page scrolls sideways`).toBeLessThanOrEqual(0);
  expect(after.clipped, `${name}: words cut off`).toEqual([]);
  expect(rounded(board(after).w), `${name}: the board changed width`).toBe(rounded(board(before).w));
  expect(rounded(board(after).h), `${name}: the board changed height`).toBe(rounded(board(before).h));
  const off = after.boxes.filter((box) => box.control && box.principal && box.w > 1 && box.x + box.w > width + 1).map((box) => box.key);
  expect(off, `${name}: presses run off the side of the window`).toEqual([]);
}

/** A puzzle already finished, as its player finds it again: a state with no clock, no keys and a result. */
function finishedPuzzle(): Survey {
  return {
    name: "a finished puzzle",
    open: async (page) => {
      const seed = freshPuzzleSeed();
      const puzzle = generatePuzzle("numberPlace", 9, "easy", seed);
      const handed = await page.request.post("/api/puzzles/solved", {
        data: { kind: "numberPlace", size: 9, level: "easy", seed, givens: puzzle.givens, answer: puzzle.solution, elapsedMs: 61_000 },
      });
      expect(handed.ok(), await handed.text()).toBe(true);
      const { solveId } = (await handed.json()) as { solveId: string };
      await page.goto(mySolvePath("numberPlace", solveId));
      await ready(page, "solve-board");
    },
  };
}

/** The screen every game is set up on, which has its own rule that it does not move (`set-up-steady.spec.ts`). */
const SET_UP: Survey = { name: "the set-up screen", open: openSetUpPage };

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

const EVERY_PLAY = surveyOfPlays(gamesMade()).filter((play) => play.again !== true);

/** One of each kind of layout, where a width's fault would show first. */
const AT_EVERY_WIDTH = new Set(["the practice board", "a live game", "/games/number-place/play", "/games/hearts/pass-and-play", "/games/tenka/pass-and-play", "/games/colour-chains/play", "/games/save-the-character/play"]);

const everyWidth = process.env.LANGUAGE_STEADY_EVERY_WIDTH === "1";

test.describe("nothing moves when the language does", () => {
  test.describe.configure({ timeout: 40_000 });
  // An invited browser, whose account is nobody's: see `language.spec.ts`. Every case ends on English, and a failed one is put back below.
  test.use({ storageState: PLAYER_STATE });
  test.afterEach(async ({ page }, info) => {
    if (info.status !== info.expectedStatus) await page.goto("/about?lang=en");
  });

  /* The tolerances are worth nothing if they would pass anything: a board pushed five pixels has to fail, and a control pushed along its row. */
  test("a move this is meant to catch is caught", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[0]);
    await opened(page, EVERY_PLAY[0]);
    const before = await settled(page);
    await page.addStyleTag({ content: '[data-testid="board-scaling"] { padding-top: 5px; }' });
    const pushed = await settled(page);
    expect(movedBetween(before, pushed).join("\n")).toContain("the board moved by 0,5");
    expect(notBack(before, pushed).length).toBeGreaterThan(0);
    await page.addStyleTag({ content: '[data-testid="board-scaling"] { padding-top: 0; } [data-testid="bare-board-toggle"] { margin-right: 40px; }' });
    const slid = await settled(page);
    expect(movedBetween(before, slid).join("\n")).toContain("slid -40px along its row");
  });

  VIEWPORTS.forEach((viewport, at) => {
    test.describe(`${viewport.width} wide`, () => {
      test.use({ viewport });
      EVERY_PLAY.forEach((play, place) => {
        const here = AT_EVERY_WIDTH.has(play.name) || everyWidth || place % VIEWPORTS.length === at;
        if (!here) return;
        test(play.name, async ({ page }) => {
          const back = await surveyed(page, play);
          if (!AT_EVERY_WIDTH.has(play.name)) return;
          await largeCounters(page);
          owed(`${play.name} with large counters`, viewport.width, back, await settled(page));
          await longLabels(page);
          owed(`${play.name} with long labels`, viewport.width, back, await settled(page));
        });
      });
      test("a finished puzzle", async ({ page }) => void (await surveyed(page, finishedPuzzle(), { boardIs: '[data-testid="puzzle-grid"]', playIs: '[data-testid="solve-board"]' })));
      test("the set-up screen", async ({ page }) => void (await surveyed(page, SET_UP, { boardIs: '[data-testid="board-surface"]', playIs: '[data-testid="set-up-game"]' })));
    });
  });
});
