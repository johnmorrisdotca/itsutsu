import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { memberContext, memberIdFor, removeMember, seedMember, seenDaysAgo } from "./members";
import { chooseOpponent, chooseRated, chosenOpponent, chosenRated, ready } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * THE SET-UP SCREEN SHOWS WHO YOU PLAY AND EVERY RULE, AND ITS BUTTON CONTINUES.
 *
 * John, on Halma: "BUG! Why can't I choose someone in this Halma page? We're not
 * given a chance to say ANYONE … Or say from Buddies list, or a Bot, a random Bot
 * or whatever other options the site has. … where are the options to change
 * other settings? … it's not Start the Game... button should be 'Continue'".
 * Then, having found them folded behind a small ›: "so very hard to see...".
 *
 * So: on Halma, with nothing opened, every kind of opponent is chosen by clicking
 * its tile — a person named by a link (a Challenge), a buddy, a computer player
 * and a random computer player — with a clock and Friendly chosen too. Each goes
 * through Continue to the doorstep, which must state exactly that; "Change
 * something" must come back with every choice still made; and no press on the
 * screen may ask the server for anything. The last one is begun, and the game it
 * makes is against one of the programs it was drawn from.
 */

const SHOTS = process.env.SHOTS_DIR;

async function shot(page: Page, name: string) {
  if (SHOTS !== undefined) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
}

/** Every RSC payload or document the page asks for after this point. */
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

test.describe("who you play and every rule are on the set-up screen", () => {
  test("on Halma: a named person, a buddy, a computer player and a random one, through Continue and back", async ({
    browser,
    baseURL,
  }) => {
    const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
    const me = { email: `shows-${stamp}@example.test`, name: `Shows ${stamp}` };
    const buddy = { email: `buddy-${stamp}@example.test`, name: `Buddy ${stamp}` };
    const named = { email: `named-${stamp}@example.test`, name: `Named ${stamp}` };
    await seedMember(buddy);
    await seedMember(named);
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();
    try {
      const starred = await context.request.post("/api/buddies", { data: { email: buddy.email } });
      expect(starred.status(), await starred.text()).toBeLessThan(300);
      // Out of "Here now", whose run on a shared machine is whoever else is about.
      await seenDaysAgo(buddy.email, 2);
      await seenDaysAgo(named.email, 2);
      const buddyId = await memberIdFor(buddy.email);
      const namedId = await memberIdFor(named.email);

      // A person named by a link, which is what a Challenge from the players list is.
      await page.goto(`/games/halma/new?against=${namedId}`);
      await ready(page, "set-up-game");

      // ALL OF IT ON THE PAGE, with nothing opened.
      await expect(page.getByTestId("more-settings")).toHaveCount(0);
      await expect(page.getByTestId("set-up-who")).toBeVisible();
      await expect(page.getByTestId("set-up-rules")).toBeVisible();
      await expect(page.getByTestId("shared-rules-move-time")).toBeVisible();
      await expect(page.getByTestId("set-up-handicap-stone")).toBeVisible();
      await expect(chosenOpponent(page)).toHaveAttribute("data-opponent", `m:${namedId}`);
      await expect(page.getByTestId("set-up-opponent-elsewhere")).toBeVisible();
      await expect(page.getByTestId("set-up-start")).toHaveText(/^Continue/);
      // Who you play comes straight after the board, before the rules.
      const whoTop = (await page.getByTestId("set-up-who").boundingBox())!.y;
      const boardTop = (await page.getByTestId("shared-rules-size").boundingBox())!.y;
      const rulesTop = (await page.getByTestId("set-up-rules").boundingBox())!.y;
      expect(boardTop).toBeLessThan(whoTop);
      expect(whoTop).toBeLessThan(rulesTop);

      const computerTile = page.locator('[data-testid="set-up-opponent"][data-computer="true"]').first();
      const computerValue = (await computerTile.getAttribute("data-opponent")) as string;
      const computerName = (await computerTile.getAttribute("data-name")) as string;
      const programs = (
        await page
          .locator('[data-testid="set-up-opponent"][data-computer="true"]')
          .evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute("data-name") ?? ""))
      ).filter((name) => name !== "A random computer player");
      await expect(page.locator('[data-testid="set-up-opponent"][data-opponent="random-computer"]')).toBeVisible();

      await page.emulateMedia({ colorScheme: "light" });
      await shot(page, "setupchoices-desktop-light");
      await page.emulateMedia({ colorScheme: "dark" });
      await shot(page, "setupchoices-desktop-dark");
      await page.emulateMedia({ colorScheme: "light" });

      // A clock and Friendly, and no press asks the server anything.
      const asked = watchServer(page);
      const clock = page.getByTestId("shared-rules-move-time");
      await clock.selectOption({ index: 1 });
      const pace = await clock.inputValue();
      expect(pace).not.toBe("none");
      await chooseRated(page, false);
      expect(asked, "a choice on the screen asked the server").toEqual([]);

      const choices: [value: string, said: RegExp][] = [
        [`m:${namedId}`, /Named/],
        [`m:${buddyId}`, /Buddy/],
        [computerValue, new RegExp(computerName)],
        ["random-computer", /drawn at random/],
      ];
      for (const [value, said] of choices) {
        asked.length = 0;
        await chooseOpponent(page, value);
        expect(asked, `choosing ${value} asked the server`).toEqual([]);

        await page.getByTestId("set-up-start").click();
        await ready(page, "doorstep");
        // The doorstep states exactly what was chosen: who, the clock, and that it will not count.
        await expect(page.getByTestId("doorstep-colours")).toContainText(said);
        await expect(page).toHaveURL(new RegExp(`[?&]pace=${pace}(&|$)`));
        await expect(page).toHaveURL(/[?&]rated=friendly(&|$)/);
        await expect(page.getByTestId("doorstep-facts")).toContainText(/friendly/i);
        if (value === "random-computer") {
          for (const program of programs) await expect(page.getByTestId("doorstep-colours")).toContainText(program);
        }

        await page.getByTestId("doorstep-change").click();
        await ready(page, "set-up-game");
        await expect(chosenOpponent(page)).toHaveAttribute("data-opponent", value);
        await expect(chosenRated(page)).toHaveAttribute("data-rated", "friendly");
        await expect(page.getByTestId("shared-rules-move-time")).toHaveValue(pace);
        await expect(page.locator('[data-testid="set-up-variant"][data-chosen="true"]')).toHaveAttribute(
          "data-variant",
          "halma",
        );
      }

      // And the random one, begun: the game is against one of the programs it was drawn from.
      await page.getByTestId("set-up-start").click();
      await ready(page, "doorstep");
      await page.getByTestId("doorstep-begin").click();
      await page.waitForURL(/\/games\/halma\/match\/[^/?]+/, { timeout: 30_000 });
      const id = tidyAway(page.url().split("/games/halma/match/")[1].split(/[/?]/)[0]);
      const made = await context.request.get(`/api/games/${id}`);
      expect(made.status()).toBe(200);
      const game = (await made.json()) as { blackName: string; whiteName: string; rated: boolean };
      expect(programs).toContain([game.blackName, game.whiteName].find((name) => programs.includes(name)));
      expect(game.rated).toBe(false);
    } finally {
      await context.close();
      await removeMember(me.email);
      await removeMember(buddy.email);
      await removeMember(named.email);
    }
  });

  test("at 400px every group reads down the screen, and nothing scrolls sideways", async ({ browser, baseURL }) => {
    const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
    const me = { email: `narrow-${stamp}@example.test`, name: `Narrow ${stamp}` };
    const context = await memberContext(browser, baseURL!, me, { viewport: { width: 400, height: 860 } });
    const page = await context.newPage();
    try {
      await page.goto("/games/new?game=halma");
      await ready(page, "set-up-game");
      await expect(page.getByTestId("set-up-who")).toBeVisible();
      await expect(page.getByTestId("set-up-rules")).toBeVisible();
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(sideways, "the set-up screen scrolls sideways at 400px").toBeLessThanOrEqual(0);
      await shot(page, "setupchoices-phone");
    } finally {
      await context.close();
      await removeMember(me.email);
    }
  });
});
