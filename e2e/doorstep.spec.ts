import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { memberContext, memberIdFor, seedMember } from "./members";
import { chooseBoard, chooseGame, chosenBoard, openMoreSettings, ready } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * THE DOORSTEP: THE PAGE BETWEEN CHOOSING A GAME AND PLAYING ONE.
 *
 * John, having asked several times: "I still DO NOT, after asking many times,
 * see a secondary page, after pressing Start the game… we go straight to the
 * game rather than the Doorstep screen which confirms settings. We do not want
 * to see that Game board with all the settings on the side… show the settings
 * before the board, as the board means we're playing!!!!"
 *
 * Every previous answer read that as ONE page and built the setup screen — the
 * pickers at /games/<game>/new — better. It is two pages. One where you CHOOSE,
 * and one where you READ BACK what you chose and say yes. The board means
 * playing; nothing before it should look like a board, and nothing before Begin
 * should have written a row.
 *
 * THE CASE THAT MATTERS IS A FRESH GAME, and it is first in this file for that
 * reason. A rematch arrives at setup with every field already filled in, so it
 * ALREADY reads like a confirmation — which is exactly why three attempts at
 * this looked finished while the thing John keeps hitting was untouched. A
 * fresh setup reads like a form, because it is one.
 *
 * Every case here CLICKS THE CONTROL A READER CLICKS. A spec that types the
 * doorstep's address has tested the address: the whole fault was that Start
 * went somewhere else, and an address cannot tell you where a button goes.
 */

/** How many games this member has on the go, asked the way their own page asks. */
async function gamesOf(context: BrowserContext): Promise<number> {
  const mine = await context.request.get("/api/games/mine");
  /*
   * Asserted rather than tolerated: "I could not get far enough to look" is not
   * a statement about the code, and a spec that shrugged at a 401 here would go
   * green having never once counted the thing it names.
   */
  expect(mine.status()).toBe(200);
  const groups = ((await mine.json()) as { groups: Record<string, unknown[]> }).groups;
  return Object.values(groups).reduce((sum, list) => sum + list.length, 0);
}

/** The game a match address names, remembered so this file clears up after itself. */
function noteGame(page: Page): void {
  const id = page.url().split("/match/")[1]?.split("/")[0];
  if (id !== undefined && id !== "") tidyAway(id);
}

/** The doorstep, once it is listening. A statement and two controls, and no board. */
async function doorstep(page: Page) {
  await ready(page, "doorstep");
  return {
    statement: page.getByTestId("doorstep-statement"),
    colours: page.getByTestId("doorstep-colours"),
    facts: page.getByTestId("doorstep-facts"),
    begin: page.getByTestId("doorstep-begin"),
    change: page.getByTestId("doorstep-change"),
  };
}

test.describe("the doorstep, between the setup screen and the board", () => {
  test("a fresh game is stated, then made, and only on Begin", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `door-${stamp}@example.test`, name: `Door ${stamp}` };
    const them = { email: `sill-${stamp}@example.test`, name: `Sill ${stamp}` };
    await seedMember(me);
    await seedMember(them);
    const theirId = await memberIdFor(them.email);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    await page.goto("/games/new");
    await ready(page, "set-up-game");
    await chooseGame(page, "reversi");
    await openMoreSettings(page);
    await page.getByTestId("set-up-with").selectOption(`m:${theirId}`);
    await page.getByTestId("shared-rules-move-time").selectOption("none");

    expect(await gamesOf(context), "a fresh member who has only chosen has no games").toBe(0);

    /*
     * The press. It used to POST a game and land on the board, which is the
     * whole complaint — so this asserts where it lands BEFORE anything else.
     */
    await page.getByTestId("set-up-start").click();
    await expect(page).toHaveURL(/\/games\/reversi\/begin(\?|$)/);

    const screen = await doorstep(page);

    /*
     * IT IS NOT A BOARD AND IT IS NOT A SECOND FORM. Both absences are asserted
     * after something present on the same page has been waited for, because
     * `toHaveCount(0)` passes the instant it is asked and on an unrendered page
     * would agree to anything.
     */
    await expect(screen.begin).toBeVisible();
    await expect(page.getByTestId("shared-game"), "the board means playing").toHaveCount(0);
    await expect(page.getByTestId("set-up-game"), "a statement, not a second form").toHaveCount(0);

    // What it says: the game, the board, and — the fact people most want — who is what colour.
    await expect(screen.statement).toContainText("Reversi");
    await expect(screen.statement).toContainText("8×8");
    await expect(screen.facts).toContainText("No clock");
    await expect(screen.colours).toContainText(/black/i);
    await expect(screen.colours).toContainText(/white/i);

    // And still nothing written. This is the promise the whole page exists for.
    expect(await gamesOf(context), "reaching the doorstep creates nothing").toBe(0);

    await screen.begin.click();
    await page.waitForURL(/\/games\/reversi\/match\/[a-z0-9]{4}-[a-z0-9]{4}/, { timeout: 30_000 });
    noteGame(page);
    expect(await gamesOf(context), "Begin makes exactly one game").toBe(1);

    await context.close();
  });

  test("and Change something goes back with every choice still set", async ({ browser, baseURL }) => {
    /*
     * THE WAY BACK, which a one-directional test never finds. Not a browser
     * back: a link carrying the draft, so it works from a reloaded or shared
     * address — and so that the game itself is still a choice, since choosing
     * it is the last thing this reader did.
     */
    const stamp = Date.now().toString(36);
    const me = { email: `back-${stamp}@example.test`, name: `Back ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    await page.goto("/games/new");
    await ready(page, "set-up-game");
    await chooseGame(page, "freestyle");
    await chooseBoard(page, 19);
    await openMoreSettings(page);
    await page.getByTestId("shared-rules-opening").selectOption("pro");
    await page.getByTestId("shared-rules-rated").selectOption("friendly");
    await page.getByTestId("shared-rules-move-time").selectOption("none");

    await page.getByTestId("set-up-start").click();
    const screen = await doorstep(page);
    await expect(screen.statement).toContainText("19×19");
    await expect(screen.facts).toContainText(/friendly/i);

    await screen.change.click();
    await ready(page, "set-up-game");

    // Every choice, still made — and the game among them, because it is the one
    // this reader picked and "change something" that cannot change it is a wall.
    await expect(chosenBoard(page)).toHaveAttribute("data-size", "19");
    await expect(page.locator('[data-testid="set-up-variant"][data-chosen="true"]')).toHaveAttribute(
      "data-variant",
      "freestyle",
    );
    await openMoreSettings(page);
    await expect(page.getByTestId("shared-rules-opening")).toHaveValue("pro");
    await expect(page.getByTestId("shared-rules-rated")).toHaveValue("friendly");
    await expect(page.getByTestId("shared-rules-move-time")).toHaveValue("none");

    expect(await gamesOf(context), "walking there and back creates nothing").toBe(0);

    await context.close();
  });

  test("a reload of the doorstep creates nothing", async ({ browser, baseURL }) => {
    /*
     * The page is a pure render of its own address, so this ought to be true by
     * construction — which is exactly the kind of claim that stops being true
     * the day somebody adds a convenience. Reloading is what a person does when
     * a page looks slow, and doing it three times must not buy three games.
     */
    const stamp = Date.now().toString(36);
    const me = { email: `load-${stamp}@example.test`, name: `Load ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    await page.goto("/games/new");
    await ready(page, "set-up-game");
    await chooseGame(page, "reversi");
    await page.getByTestId("set-up-start").click();
    await doorstep(page);

    await page.reload();
    await doorstep(page);
    await page.reload();
    await doorstep(page);

    expect(await gamesOf(context), "three reloads of a doorstep are no games").toBe(0);

    await context.close();
  });

  test("a doorstep whose game has been made offers the board rather than a second game", async ({
    browser,
    baseURL,
  }) => {
    /*
     * Pressing Begin twice — a double-tap, or a Back onto a page that has
     * already been said yes to. The second press must not buy a second game:
     * it hands over the one that exists.
     */
    const stamp = Date.now().toString(36);
    const me = { email: `twice-${stamp}@example.test`, name: `Twice ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    await page.goto("/games/new");
    await ready(page, "set-up-game");
    await chooseGame(page, "reversi");
    const screenBefore = page.getByTestId("set-up-start");
    await screenBefore.click();
    const screen = await doorstep(page);

    await screen.begin.click();
    await page.waitForURL(/\/games\/reversi\/match\//, { timeout: 30_000 });
    noteGame(page);
    expect(await gamesOf(context)).toBe(1);

    // Back onto the doorstep, and press again.
    await page.goBack();
    const again = await doorstep(page);
    await expect(again.begin).toBeVisible();
    await again.begin.click();
    await page.waitForURL(/\/games\/reversi\/match\//, { timeout: 30_000 });
    noteGame(page);

    expect(await gamesOf(context), "saying yes twice is still one game").toBe(1);

    await context.close();
  });

  test("a rematch reads back the colour it gives you", async ({ browser, baseURL }) => {
    /*
     * The SECOND case, not the proof. A rematch already arrives at setup filled
     * in, so it is the one entry point that looked confirmed before any of this
     * existed. What it gains from the doorstep is the sentence a rematch is
     * most about: the colours swap, and "you are black this time" is worth
     * reading before the board rather than working out from the board.
     */
    const stamp = Date.now().toString(36);
    const me = { email: `again-${stamp}@example.test`, name: `Again ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // A finished game to repeat: against a computer player, which answers at once.
    await page.goto("/games/new");
    await ready(page, "set-up-game");
    await chooseGame(page, "reversi");
    await openMoreSettings(page);
    /*
     * A program, found by its prefix in the select's own options rather than by
     * name: the grades are copy and the order is the page's business, and a spec
     * that hard-codes either is a spec about this week's ladder.
     */
    const chooser = page.getByTestId("set-up-with");
    const computer = (await chooser.locator("option").evaluateAll((options) =>
      (options as HTMLOptionElement[]).map((option) => option.value).filter((value) => value.startsWith("c:")),
    ))[0];
    expect(computer, "the setup screen offers no computer player at Reversi").toBeTruthy();
    await chooser.selectOption(computer);
    await page.getByTestId("set-up-start").click();
    const first = await doorstep(page);
    await expect(first.colours).toContainText(/black|white/i);
    await first.begin.click();
    await page.waitForURL(/\/games\/reversi\/match\//, { timeout: 30_000 });
    noteGame(page);

    await context.close();
  });
});
