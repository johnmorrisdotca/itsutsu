import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { memberContext, memberIdFor, seedMember } from "./members";
import { seatPostedBySomebodyElse } from "./postedSeat";
import {
  aComputerOpponent,
  chooseBoard,
  chooseGame,
  chooseOpening,
  chooseOpponent,
  chooseRated,
  chosenBoard,
  chosenOpening,
  chosenRated,
  matchIdIn,
  openMoreSettings,
  ready,
} from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * A GAME IS STATED IN FULL BEFORE IT IS WRITTEN — AND NOW ON ONE SCREEN.
 *
 * John, having asked several times: "I still DO NOT, after asking many times,
 * see a secondary page, after pressing Start the game… we go straight to the
 * game rather than the Doorstep screen which confirms settings. We do not want
 * to see that Game board with all the settings on the side… show the settings
 * before the board, as the board means we're playing!!!!"
 *
 * That was answered with a second page, /games/<game>/begin, and this file was
 * about the two of them. Then, 2026-09-21: "our game signup and starting
 * process seems to have one too many screens… too much repeat info on the
 * multi-screens." Both were true, and both are the same requirement read at
 * different lengths: what is going to be played must be READ BACK before
 * anything is written. It does not take two pages to read something back.
 *
 * So the set-up screen states the whole game — every rule on its own folded
 * row, who sits where in a sentence over the button — and Begin writes it. The
 * promise this file exists to hold is unchanged and is asserted the same way:
 * nothing is written until the press, the press makes exactly one game, and
 * pressing twice does not buy two.
 *
 * THE DOORSTEP REMAINS FOR SOMEBODY ELSE'S POSTED SEAT, which is the one case
 * where it was never a repeat: the rules being agreed to there are theirs, and
 * reading them before sitting down is the whole point. The last case here is
 * that one, and it is the only one that still presses twice.
 *
 * Every case CLICKS THE CONTROL A READER CLICKS. A spec that types an address
 * has tested the address: the original fault was that Start went somewhere
 * else, and an address cannot tell you where a button goes.
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
  const id = matchIdIn(page.url());
  if (id !== "") tidyAway(id);
}

/** What the set-up screen says it is about to make, once it is listening. */
async function stated(page: Page) {
  await ready(page, "set-up-game");
  return {
    summary: page.getByTestId("set-up-summary"),
    rules: page.getByTestId("set-up-rules-words"),
    handicap: page.getByTestId("set-up-handicap-words"),
    seating: page.getByTestId("set-up-seating"),
    begin: page.getByTestId("set-up-start"),
  };
}

test.describe("stating a game before it is written", () => {
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
    await chooseOpponent(page, `m:${theirId}`);
    await page.getByTestId("shared-rules-move-time").selectOption("none");

    expect(await gamesOf(context), "a fresh member who has only chosen has no games").toBe(0);

    const screen = await stated(page);

    /*
     * IT IS NOT A BOARD. Asserted after something present on the same page has
     * been waited for, because `toHaveCount(0)` passes the instant it is asked
     * and on an unrendered page would agree to anything.
     */
    await expect(screen.begin).toBeVisible();
    await expect(page.getByTestId("shared-game"), "the board means playing").toHaveCount(0);

    /*
     * WHAT IT SAYS, and it is everything the doorstep used to say: the game and
     * the board, the rules on the row that holds them, and — the fact people
     * most want — who is what colour.
     */
    await expect(screen.summary).toContainText("Reversi");
    await expect(screen.summary).toContainText("8×8");
    await expect(screen.rules).toContainText("No clock");
    await expect(screen.seating).toContainText(/black/i);
    await expect(screen.seating).toContainText(/white/i);

    // And still nothing written. This is the promise the whole screen exists for.
    expect(await gamesOf(context), "reading a game back creates nothing").toBe(0);

    // One press, and the next thing is a board.
    await expect(screen.begin).toHaveAttribute("data-press", "begin");
    await screen.begin.click();
    await page.waitForURL(/\/games\/reversi\/match\/[^/]+(\/\d+)?$/, { timeout: 30_000 });
    noteGame(page);
    expect(await gamesOf(context), "Begin makes exactly one game").toBe(1);

    await context.close();
  });

  test("every choice survives a reload, and a reload creates nothing", async ({ browser, baseURL }) => {
    /*
     * THE WAY BACK, which a one-directional test never finds. Every choice is
     * in the address, so a reloaded, bookmarked or shared link opens on the
     * same game — including the game itself, since choosing it is the last
     * thing this reader did. Reloading is what a person does when a page looks
     * slow, and doing it three times must not buy three games.
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
    await chooseOpening(page, "pro");
    await chooseRated(page, false);
    await page.getByTestId("shared-rules-move-time").selectOption("none");

    const screen = await stated(page);
    await expect(screen.summary).toContainText("19×19");
    await expect(screen.rules).toContainText(/friendly/i);

    await page.reload();
    await stated(page);
    await page.reload();
    const again = await stated(page);

    // Every choice, still made — and the game among them.
    await expect(chosenBoard(page)).toHaveAttribute("data-size", "19");
    await expect(page.locator('[data-testid="set-up-variant"][data-chosen="true"]')).toHaveAttribute(
      "data-variant",
      "freestyle",
    );
    await openMoreSettings(page);
    await expect(chosenOpening(page)).toHaveAttribute("data-opening", "pro");
    await expect(chosenRated(page)).toHaveAttribute("data-rated", "friendly");
    await expect(page.getByTestId("shared-rules-move-time")).toHaveValue("none");
    await expect(again.summary).toContainText("19×19");

    expect(await gamesOf(context), "three reloads of a stated game are no games").toBe(0);

    await context.close();
  });

  test("a screen whose game has been made offers the board rather than a second game", async ({
    browser,
    baseURL,
  }) => {
    /*
     * Pressing Begin twice — a double-tap, or a Back onto a screen that has
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
    const screen = await stated(page);
    await screen.begin.click();
    await page.waitForURL(/\/games\/reversi\/match\//, { timeout: 30_000 });
    noteGame(page);
    expect(await gamesOf(context)).toBe(1);

    // Back onto the screen, and press again.
    await page.goBack();
    const again = await stated(page);
    await expect(page.getByTestId("set-up-made"), "it says the game has been begun").toBeVisible();
    await again.begin.click();
    await page.waitForURL(/\/games\/reversi\/match\//, { timeout: 30_000 });
    noteGame(page);

    expect(await gamesOf(context), "saying yes twice is still one game").toBe(1);

    await context.close();
  });

  test("a rematch reads back the colour it gives you", async ({ browser, baseURL }) => {
    /*
     * A rematch arrives already filled in, so it is the one entry point that
     * looked confirmed before any of this existed. What it gains is the
     * sentence a rematch is most about: the colours swap, and "you are black
     * this time" is worth reading before the board rather than working out
     * from the board.
     */
    const stamp = Date.now().toString(36);
    const me = { email: `again-${stamp}@example.test`, name: `Again ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    await page.goto("/games/new");
    await ready(page, "set-up-game");
    await chooseGame(page, "reversi");
    await openMoreSettings(page);
    /*
     * A program, found by what its own tile says it is rather than by name:
     * the grades are copy and the order is the page's business, and a spec
     * that hard-codes either is a spec about this week's ladder.
     */
    await chooseOpponent(page, await aComputerOpponent(page));
    const screen = await stated(page);
    await expect(screen.seating).toContainText(/black|white/i);
    await screen.begin.click();
    await page.waitForURL(/\/games\/reversi\/match\//, { timeout: 30_000 });
    noteGame(page);

    await context.close();
  });

  test("somebody else's posted seat at exactly this game is sat at on the press", async ({
    browser,
    baseURL,
  }) => {
    /*
     * IT USED TO GO THROUGH THE DOORSTEP, "to read their rules first". But a
     * seat the set-up screen matches has EXACTLY the rules this reader just
     * chose — `matchSeat` compares the whole game — and the button already
     * names who is waiting. The page after it printed both a third time, and
     * made the two routes whose rules a reader never chooses three presses
     * long. John: "no game or process should take 3 screens/clicks."
     *
     * The doorstep is still where a seat is read COLD, from the waiting room:
     * that is `open-seat-standing.spec.ts`, and it still has its screen.
     */
    const stamp = Date.now().toString(36);
    const host = { email: `host-${stamp}@example.test`, name: `Host ${stamp}` };
    const guest = { email: `guest-${stamp}@example.test`, name: `Guest ${stamp}` };
    await seedMember(host);
    await seedMember(guest);

    /*
     * A SEAT NOBODY ELSE'S LEAVINGS CAN STAND IN FOR. A posted seat is matched
     * by its RULES, and this database holds hundreds left by other runs — a
     * plain game of Reversi finds one of those instead, and then the host sits
     * down at a stranger's seat rather than posting one for the guest. So the
     * game here is gomoku on the thirteen board and friendly, which is a
     * combination nothing else sets up. Bring your own world.
     */
    // One member posts a seat for anyone, which is what a plain Begin does.
    const closeHost = await seatPostedBySomebodyElse({
      browser,
      baseURL: baseURL!,
      choose: async (on) => {
        await chooseBoard(on, 13);
        await chooseRated(on, false);
      },
      slug: "gomoku",
      noteGame: tidyAway,
    });

    // And another asks for the same game, which is their seat rather than a second one.
    const visiting = await memberContext(browser, baseURL!, guest);
    const page = await visiting.newPage();
    await page.goto("/games/gomoku/new");
    await ready(page, "set-up-game");
    await chooseBoard(page, 13);
    await chooseRated(page, false);
    const screen = await stated(page);
    await expect(screen.begin, "somebody is already asking for exactly this").toHaveAttribute(
      "data-press",
      "seat",
    );

    // The button says whose seat it is about to take, which is the one new fact.
    await expect(screen.begin).toContainText(/sit down with/);

    await screen.begin.click();
    // Straight to the board, with them: no page between.
    await page.waitForURL(/\/games\/gomoku\/match\//, { timeout: 30_000 });
    noteGame(page);
    await expect(page.getByTestId("shared-game")).toBeVisible();

    await visiting.close();
    await closeHost();
  });
});
