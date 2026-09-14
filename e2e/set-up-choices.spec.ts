import { expect, test, type Browser } from "@playwright/test";

import { memberContext } from "./members";
import {
  aComputerOpponent,
  chooseGame,
  chooseOpening,
  chooseOpponent,
  chooseRated,
  chosenOpening,
  chosenOpponent,
  chosenRated,
  openMoreSettings,
  ready,
  startAndBegin,
} from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * THE OPENING, THE RATING AND THE OPPONENT, AS TILES.
 *
 * John, on the set-up screen: "UGLY dropdown… much better than a dropdown." The
 * game and the board went first; these three were the selects left. Every case
 * here CLICKS the tile a reader clicks — never a form value — and never reloads,
 * because a reload throws away exactly the client state a picker's bugs live in.
 *
 * Each case brings its own member, so what it opens on is the site's defaults
 * and not whatever a previous run left on a shared account.
 */
async function freshPage(browser: Browser, baseURL: string, tag: string, viewport?: { width: number; height: number }) {
  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const context = await memberContext(
    browser,
    baseURL,
    { email: `${tag}-${stamp}@example.test`, name: `Tiles ${stamp}` },
    viewport === undefined ? undefined : { viewport },
  );
  return { context, page: await context.newPage() };
}

test.describe("the last three choices on the set-up screen are tiles", () => {
  test("the tiles clicked are the game that is made", async ({ browser, baseURL }) => {
    const { context, page } = await freshPage(browser, baseURL!, "tiles");
    await page.goto("/games/gomoku/new");
    await ready(page, "set-up-game");
    await openMoreSettings(page);
    const summary = page.getByTestId("more-settings-summary");

    // What a new member opens on: a free opening, a game that counts, a seat for anyone.
    await expect(chosenOpening(page)).toHaveAttribute("data-opening", "free");
    await expect(chosenRated(page)).toHaveAttribute("data-rated", "rated");
    await expect(chosenOpponent(page)).toHaveAttribute("data-opponent", "anyone");

    /*
     * EACH ONE CHANGED, CHANGED BACK, AND CHANGED AGAIN. The way back is where
     * a picker that cannot be left shows itself, and a one-directional test
     * never finds it. The summary line is read after each press because it is
     * built from the draft the button will send, not from the tiles.
     */
    await chooseOpening(page, "longPro");
    await expect(summary).toContainText("Long Pro opening");
    await chooseOpening(page, "free");
    await expect(summary).toContainText("Free opening");
    await chooseOpening(page, "pro");
    await expect(summary).toContainText("Pro opening");
    await expect(summary).not.toContainText("Long Pro");
    await expect(chosenOpening(page)).toHaveCount(1);

    await chooseRated(page, false);
    await expect(summary).toContainText("Friendly");
    await chooseRated(page, true);
    await expect(summary).toContainText("Rated");
    await chooseRated(page, false);
    await expect(summary).toContainText("Friendly");
    await expect(chosenRated(page)).toHaveCount(1);

    const first = await aComputerOpponent(page, 0);
    const second = await aComputerOpponent(page, 1);
    await chooseOpponent(page, second);
    // A chosen program says what it is like, under the programs.
    await expect(page.getByTestId("set-up-opponent-hint")).toBeVisible();
    await chooseOpponent(page, "anyone");
    // Asked after the tile it replaced has been seen chosen, so the absence means something.
    await expect(page.getByTestId("set-up-opponent-hint")).toHaveCount(0);
    await chooseOpponent(page, first);
    const name = (await page
      .locator(`[data-testid="set-up-opponent"][data-opponent="${first}"]`)
      .getAttribute("data-name")) as string;
    await expect(summary).toContainText(`Against ${name}`);
    await expect(chosenOpponent(page)).toHaveCount(1);

    await startAndBegin(page);
    await page.waitForURL(/\/games\/gomoku\/match\/[a-z0-9]{4}-[a-z0-9]{4}/, { timeout: 30_000 });
    const id = tidyAway(page.url().split("/games/gomoku/match/")[1].split("/")[0]);

    const made = await context.request.get(`/api/games/${id}`);
    expect(made.status()).toBe(200);
    const game = (await made.json()) as { opening: string; rated: boolean; blackName: string; whiteName: string };
    expect(game.opening).toBe("pro");
    expect(game.rated).toBe(false);
    expect([game.blackName, game.whiteName]).toContain(name);

    await context.close();
  });

  test("the arrow keys move along a group, and the page fits a phone", async ({ browser, baseURL }) => {
    const { context, page } = await freshPage(browser, baseURL!, "arrows", { width: 390, height: 844 });
    await page.goto("/games/gomoku/new");
    await ready(page, "set-up-game");
    await openMoreSettings(page);

    /*
     * A radio group, driven as one: the chosen radio takes focus, an arrow
     * chooses the next, and focus is where a keyboard user can see it.
     */
    await page.locator('input[name="set-up-opening"]:checked').focus();
    await page.keyboard.press("ArrowRight");
    await expect(chosenOpening(page)).toHaveAttribute("data-opening", "pro");
    expect(
      await page.evaluate(() => {
        const focused = document.activeElement as HTMLInputElement | null;
        return focused !== null && focused.value === "pro" && focused.matches(":focus-visible");
      }),
      "focus is on the chosen opening, and visible",
    ).toBe(true);
    await page.keyboard.press("ArrowLeft");
    await expect(chosenOpening(page)).toHaveAttribute("data-opening", "free");

    await page.locator('input[name="set-up-rated"]:checked').focus();
    await page.keyboard.press("ArrowRight");
    await expect(chosenRated(page)).toHaveAttribute("data-rated", "friendly");

    await page.locator('input[name="set-up-opponent"]:checked').focus();
    await page.keyboard.press("ArrowDown");
    await expect(chosenOpponent(page)).not.toHaveAttribute("data-opponent", "anyone");
    await page.keyboard.press("ArrowUp");
    await expect(chosenOpponent(page)).toHaveAttribute("data-opponent", "anyone");

    // Every tile open on a phone, and nothing wider than the screen.
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sideways, "the set-up screen scrolls sideways at 390px").toBeLessThanOrEqual(0);

    await context.close();
  });

  test("a game with one opening states it, and the way back offers all three again", async ({ browser, baseURL }) => {
    const { context, page } = await freshPage(browser, baseURL!, "only");
    await page.goto("/games/new");
    await ready(page, "set-up-game");
    await chooseGame(page, "freestyle");
    await openMoreSettings(page);
    await chooseOpening(page, "pro");

    /*
     * Reversi is played with the free opening and nothing else, so it is a
     * fact rather than a picker of one — and the draft follows it, since Pro
     * carried over would be made as Free anyway and the summary would be lying.
     */
    await chooseGame(page, "reversi");
    const only = chosenOpening(page);
    await expect(only).toHaveAttribute("data-only", "true");
    await expect(only).toHaveAttribute("data-opening", "free");
    await expect(page.getByTestId("shared-rules-opening").locator('input[type="radio"]')).toHaveCount(0);
    await expect(page.getByTestId("more-settings-summary")).toContainText("Free opening");

    await chooseGame(page, "freestyle");
    await expect(page.locator('[data-testid="set-up-opening"][data-only="false"]')).toHaveCount(3);
    await expect(chosenOpening(page)).toHaveAttribute("data-opening", "free");
    await chooseOpening(page, "longPro");

    await context.close();
  });
});
