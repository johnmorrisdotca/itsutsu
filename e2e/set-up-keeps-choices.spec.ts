import { join } from "node:path";

import { expect, test, type Browser, type Page } from "@playwright/test";

import { GAME_FAMILIES } from "../src/lib/gomoku/families";
import { slugFor } from "../src/lib/gomoku/slugs";
import { memberContext, removeMember } from "./members";
import { chooseBoard, chooseGame, chooseRated, chosenBoard, chosenRated, openMoreSettings, ready } from "./support";

/**
 * THE SET-UP SCREEN REMEMBERS WHAT WAS CHOSEN, IN ITS ADDRESS.
 *
 * John, with Checkers chosen on /games/new: "We need Memory when viewing Gaming
 * pages... a refresh loses the Checkers selections..." Every case here RELOADS,
 * goes Back or opens the address somewhere else, because each of those is the
 * errand being tested — the house rule against reloading is about not hiding a
 * client-state bug, and here the reload is the thing a reader did.
 *
 * Every choice is a click on the tile a reader clicks, after the hydration mark.
 * And every click is watched for what it must NOT do: ask the server. The address
 * is written with the native `history.replaceState` (`useKeptAddress`), so a
 * press makes no RSC request and the document stays the one that was marked.
 *
 * Each case brings its own member, so what the screen opens at is the site's
 * defaults and not a shared account's standing board or clock.
 */

const SHOTS = process.env.SHOTS_DIR;

async function shot(page: Page, name: string) {
  if (SHOTS !== undefined) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
}

async function freshMember(browser: Browser, baseURL: string, tag: string, viewport?: { width: number; height: number }) {
  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const member = { email: `${tag}-${stamp}@example.test`, name: `Keeps ${stamp}` };
  const context = await memberContext(browser, baseURL, member, viewport === undefined ? undefined : { viewport });
  return { context, page: await context.newPage(), email: member.email };
}

/**
 * Every request the server would answer for the set-up page after this point:
 * RSC payloads (a `router.replace` or a refresh would be one) and documents (a
 * reload would be one). Cleared by the caller before each group of presses.
 */
function watchServer(page: Page) {
  const asked: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    const rsc = url.includes("_rsc=") || request.headers()["rsc"] === "1";
    const document = request.isNavigationRequest() && request.frame() === page.mainFrame();
    if (rsc || document) asked.push(url);
  });
  return asked;
}

/** Marks the document, so a reload nobody asked for would be seen as the mark's absence. */
async function markDocument(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { keptMark?: string }).keptMark = "same document";
  });
}

async function documentMark(page: Page) {
  return page.evaluate(() => (window as unknown as { keptMark?: string }).keptMark ?? "a new document");
}

function chosenGame(page: Page) {
  return page.locator('[data-testid="set-up-variant"][data-chosen="true"]');
}

/**
 * The space between the open family's LAST game card and the line saying what the
 * chosen game is — where the empty rows used to sit, whichever family is open.
 */
async function gapUnderFamily(page: Page) {
  const last = await page.getByTestId("set-up-family-games").getByTestId("set-up-variant").last().boundingBox();
  const hint = await page.getByTestId("set-up-variant-hint").boundingBox();
  if (last === null || hint === null) throw new Error("the family's cards or the game's line are not drawn");
  return hint.y - (last.y + last.height);
}

async function expectGoThirteenFriendly(page: Page) {
  await expect(chosenGame(page)).toHaveAttribute("data-variant", "go");
  await expect(chosenBoard(page)).toHaveAttribute("data-size", "13");
  await openMoreSettings(page);
  await expect(chosenRated(page)).toHaveAttribute("data-rated", "friendly");
}

test.describe("the set-up screen keeps its choices", () => {
  test("a reload keeps the game, the board and a rule, and no press asks the server", async ({ browser, baseURL }) => {
    const { context, page, email } = await freshMember(browser, baseURL!, "keeps");
    try {
      await page.goto("/games/new");
      await ready(page, "set-up-game");
      const asked = watchServer(page);
      await markDocument(page);

      await chooseGame(page, "checkers");
      await expect(page).toHaveURL(/\/games\/new\?game=checkers$/);
      await expect(chosenBoard(page)).toHaveAttribute("data-size", "8");
      expect(asked, "choosing a game asked the server").toEqual([]);
      expect(await documentMark(page)).toBe("same document");

      // THE RELOAD, which is John's complaint.
      await page.reload();
      await ready(page, "set-up-game");
      await expect(chosenGame(page)).toHaveAttribute("data-variant", "checkers");
      await expect(chosenBoard(page)).toHaveAttribute("data-size", "8");
      // The family's cards sit on the game's line, without a band of empty rows under them.
      expect(await gapUnderFamily(page)).toBeLessThan(24);
      await shot(page, "setupkeeps-checkers-after-reload");

      // The watcher is not blind: the reload itself was a document it saw.
      expect(asked.length, "the watcher saw no request for a reload").toBeGreaterThan(0);
      asked.length = 0;
      await markDocument(page);
      await chooseGame(page, "go");
      await chooseBoard(page, 13);
      await openMoreSettings(page);
      await chooseRated(page, false);
      await expect(page).toHaveURL(/[?&]game=go(&|$)/);
      await expect(page).toHaveURL(/[?&]board=13(&|$)/);
      await expect(page).toHaveURL(/[?&]rated=friendly(&|$)/);
      expect(asked, "a choice asked the server").toEqual([]);
      expect(await documentMark(page)).toBe("same document");

      await page.reload();
      await ready(page, "set-up-game");
      await expectGoThirteenFriendly(page);
      await shot(page, "setupkeeps-go-13-friendly-after-reload");

      // And the way back to plain: the default game again leaves the address bare of it.
      await chooseGame(page, "freestyle");
      await expect(page).not.toHaveURL(/[?&]game=/);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("Back from the doorstep and Forward again keep every choice", async ({ browser, baseURL }) => {
    const { context, page, email } = await freshMember(browser, baseURL!, "back");
    try {
      await page.goto("/games/new");
      await ready(page, "set-up-game");
      await chooseGame(page, "go");
      await chooseBoard(page, 13);
      await openMoreSettings(page);
      await chooseRated(page, false);
      const setUpAt = page.url();

      const asked = watchServer(page);
      await page.getByTestId("set-up-start").click();
      await ready(page, "doorstep");
      const doorstepAt = page.url();
      // A navigation IS an RSC request, and the watcher sees one — so its silence on a press means something.
      expect(asked.some((url) => url.includes("_rsc=")), "the watcher saw no RSC request for a navigation").toBe(true);

      await page.goBack();
      await ready(page, "set-up-game");
      expect(page.url()).toBe(setUpAt);
      await expectGoThirteenFriendly(page);

      await page.goForward();
      await ready(page, "doorstep");
      expect(page.url()).toBe(doorstepAt);

      await page.goBack();
      await ready(page, "set-up-game");
      await expectGoThirteenFriendly(page);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("the address copied into a browser nobody has used opens the same choices", async ({ browser, baseURL }) => {
    const first = await freshMember(browser, baseURL!, "copier");
    const second = await freshMember(browser, baseURL!, "pasted");
    try {
      await first.page.goto("/games/new");
      await ready(first.page, "set-up-game");
      await chooseGame(first.page, "go");
      await chooseBoard(first.page, 13);
      await openMoreSettings(first.page);
      await chooseRated(first.page, false);
      const copied = first.page.url();

      await second.page.goto(copied);
      await ready(second.page, "set-up-game");
      await expectGoThirteenFriendly(second.page);
    } finally {
      await first.context.close();
      await second.context.close();
      await removeMember(first.email);
      await removeMember(second.email);
    }
  });

  test("the smallest family has no empty band under its games, on a desk and on a phone", async ({ browser, baseURL }) => {
    /*
     * Whichever family holds the fewest games, found from the table rather than
     * named. Checkers was the one-game family when this was written and gained
     * five draughts games the same week — which is how a named example quietly
     * stops testing the thing it was named for.
     */
    const smallest = [...GAME_FAMILIES].sort((one, two) => one.games.length - two.games.length)[0];
    const lone = smallest.games[0];
    const { context, page, email } = await freshMember(browser, baseURL!, "smallest");
    try {
      await page.goto(`/games/new?game=${slugFor(lone)}`);
      await ready(page, "set-up-game");
      await expect(chosenGame(page)).toHaveAttribute("data-variant", lone);
      expect(await gapUnderFamily(page)).toBeLessThan(24);
      await shot(page, "setupkeeps-smallest-family-desk");
      await page.setViewportSize({ width: 400, height: 860 });
      expect(await gapUnderFamily(page)).toBeLessThan(24);
      await shot(page, "setupkeeps-smallest-family-phone");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("an address naming what the game does not offer says so, and opens at the usual setting", async ({
    browser,
    baseURL,
  }) => {
    const { context, page, email } = await freshMember(browser, baseURL!, "unread");
    try {
      await page.goto("/games/new?game=checkers&board=19");
      await ready(page, "set-up-game");
      await expect(chosenBoard(page)).toHaveAttribute("data-size", "8");
      await expect(page.getByTestId("set-up-problem")).toContainText("board");
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});
