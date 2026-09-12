import { expect, test, type Page } from "@playwright/test";

import { memberContext, memberIdFor, seedMember } from "./members";
import { ready } from "./support";

/**
 * EVERY WAY OF STARTING A GAME GOES THROUGH THE SETUP SCREEN FIRST.
 *
 * John, for the third time, looking at a computer player's page: "The Play
 * button for user takes us right to a game which is Gomoku and you have to
 * change the game, otherwise you're playing Gomoku with an accidental click (or
 * just clicking around). I keep telling you we need to take the user to the Game
 * settings page, the page BEFORE the game starts."
 *
 * A previous round built that screen and wired ONE way in to it. These are the
 * rest. Each case CLICKS THE CONTROL A READER CLICKS and asserts where it lands
 * and what is already filled in — because a spec that visits /games/new?against=…
 * by typing it has tested the address and said nothing whatever about the button.
 * That is not a hypothetical on this site: the language picker was verified six
 * ways by header and query string, and the bug was in clicking it.
 *
 * They all assert the same two things, which together are the rule:
 *
 *  - the press lands on the setup screen and NOT on a board, and
 *  - what the press already knew is filled in, so nothing is asked twice.
 */

/** Waits until the setup screen is listening, then reports what it is offering. */
async function setUpScreen(page: Page) {
  await ready(page, "set-up-game");
  return {
    opponent: page.getByTestId("set-up-with"),
    start: page.getByTestId("set-up-start"),
    summary: page.getByTestId("set-up-summary"),
    game: page.getByTestId("shared-rules-variant"),
    board: page.getByTestId("shared-rules-size"),
    pace: page.getByTestId("shared-rules-move-time"),
  };
}

test.describe("every way into a game reaches the setup screen", () => {
  test("Play, on the page about a player", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `asks-${stamp}@example.test`, name: `Asks ${stamp}` };
    const them = { email: `asked-${stamp}@example.test`, name: `Asked ${stamp}` };
    await seedMember(me);
    await seedMember(them);
    const theirId = await memberIdFor(them.email);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();
    await page.goto(`/players/${theirId}`);

    /*
     * The heading's own offer, which is the button John was looking at. Clicked
     * rather than read: it used to POST a game of Gomoku and land on the board.
     */
    const offer = page.getByTestId("player-actions").getByTestId("challenge");
    await expect(offer).toBeVisible();
    await offer.click();

    await expect(page).toHaveURL(new RegExp(`/games/new\\?.*against=${theirId}`));
    const screen = await setUpScreen(page);
    // Their name is filled in and selected, so the game is the only question left.
    await expect(screen.opponent).toHaveValue(`m:${theirId}`);
    await expect(page.getByTestId("set-up-against")).toContainText(them.name);
    // And the game is a question: the address named nobody's game, so it is asked.
    await expect(screen.game).toBeVisible();
    await expect(screen.start).toBeVisible();

    await context.close();
  });

  test("Challenge, on a row of the players list", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `lists-${stamp}@example.test`, name: `Lists ${stamp}` };
    const them = { email: `listed-${stamp}@example.test`, name: `Listed ${stamp}` };
    await seedMember(me);
    await seedMember(them);
    const theirId = await memberIdFor(them.email);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();
    await page.goto("/players");

    /*
     * The likeliest accidental press on the whole site: a button at the end of
     * every line of a long list, which used to make a game on the spot. Found by
     * the row rather than by position, because the list is ordered by who was
     * last seen and this spec must not care.
     */
    const row = page.locator("tr", { hasText: them.name }).first();
    await expect(row).toBeVisible();
    await row.getByTestId("challenge").click();

    await expect(page).toHaveURL(new RegExp(`/games/new\\?.*against=${theirId}`));
    const screen = await setUpScreen(page);
    await expect(screen.opponent).toHaveValue(`m:${theirId}`);

    await context.close();
  });

  test("Play, on the computer players tab", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `robots-${stamp}@example.test`, name: `Robots ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();
    await page.goto("/players?view=computers");

    const rows = page.getByTestId("computer-player");
    /*
     * Asserted after waiting for the table, not by counting straight after a
     * goto: a count of zero passes the instant it is asked and cannot tell "no
     * computer players" from "the page has not answered".
     */
    await expect(page.getByTestId("computer-players-table")).toBeVisible();
    await expect(rows.first()).toBeVisible();

    await rows.first().getByTestId("challenge").click();

    /*
     * THE CASE JOHN REPORTED. This button knew a program and nothing else, and
     * a program plays every game here — so the one thing the row could never
     * decide was WHICH game, and it decided Gomoku, silently, every time.
     */
    await expect(page).toHaveURL(/\/games\/new\?.*against=/);
    const screen = await setUpScreen(page);
    await expect(screen.game, "the game is asked, because a program plays any of them").toBeVisible();
    await expect(screen.opponent).not.toHaveValue("anyone");

    await context.close();
  });

  test("Play, on a computer player that plays ONE game", async ({ browser, baseURL }) => {
    /*
     * THE HOLE IN THE CASE ABOVE, and it is a quiet one. A specialist plays a
     * single game — away from its own board it is somebody else under another
     * name and a different flag — so a screen that opened at the site's default
     * game would show it as the chosen opponent while the list of players offered
     * at THAT game did not hold it. Pressing Start would then post a seat for
     * anyone, which is the right fallback for a game nobody can be found for and
     * a terrible answer to "play this program".
     *
     * So the screen opens at a game the named program actually plays.
     */
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `expert-${stamp}@example.test`,
      name: `Expert ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/players?view=computers");
    await expect(page.getByTestId("computer-players-table")).toBeVisible();

    /*
     * Tamenoki is the Reversi specialist, found by its grade rather than by its
     * name or its position: the grade is the key, the name is copy, and the order
     * is the page's business.
     */
    const specialist = page.locator('[data-testid="computer-player"][data-tier="tamenoki"]');
    await expect(specialist).toBeVisible();
    await specialist.getByTestId("challenge").click();

    await expect(page).toHaveURL(/\/games\/new\?.*against=tamenoki/);
    const screen = await setUpScreen(page);
    // Opened at a game it plays, with it chosen — not at Gomoku with it dropped.
    await expect(screen.game).toHaveValue("reversi");
    await expect(screen.opponent).toHaveValue("c:tamenoki");
    await expect(page.getByTestId("set-up-not-offered")).toHaveCount(0);

    /*
     * And when the game is changed to one it does not play, the screen SAYS the
     * offer has lapsed rather than quietly posting a seat instead. Falling back
     * is right; falling back in silence is the thing this whole change is about.
     */
    await screen.game.selectOption("halma");
    await expect(page.getByTestId("set-up-not-offered")).toContainText(/does not play/i);

    await context.close();
  });

  test("the one-line sentence on the lobby, which keeps every word of it", async ({
    browser,
    baseURL,
  }) => {
    /*
     * The sentence was removed once and John asked for it back by name — "we
     * need that one line version back" — so it is not being replaced here. It
     * leads to the same screen as everything else, carrying what it settled:
     * the game, the board, the pace and the opponent.
     */
    const stamp = Date.now().toString(36);
    const me = { email: `sentence-${stamp}@example.test`, name: `Sentence ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();
    await page.goto("/games");
    await ready(page, "start-game");

    await page.getByTestId("start-game-variant").selectOption("freestyle");
    await page.getByTestId("start-game-board").selectOption("19");
    await page.getByTestId("start-game-pace").selectOption(String(24 * 60 * 60_000));
    await page.getByTestId("start-game-go").click();

    // The game it named is in the PATH, because that is identity on this site.
    await expect(page).toHaveURL(/\/games\/gomoku\/new\?/);
    const screen = await setUpScreen(page);
    // And the board and the pace it named are filled in rather than asked again.
    await expect(screen.board).toHaveValue("19");
    await expect(screen.pace).toHaveValue(String(24 * 60 * 60_000));

    await context.close();
  });

  test("the sentence carries a named opponent too", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `saying-${stamp}@example.test`, name: `Saying ${stamp}` };
    const them = { email: `said-${stamp}@example.test`, name: `Said ${stamp}` };
    await seedMember(them);
    const context = await memberContext(browser, baseURL!, me);
    const theirId = await memberIdFor(them.email);
    // They have to be somewhere the sentence offers: a buddy is the steady one,
    // since "here now" is a half-hour window and racing it would be a flake.
    expect((await context.request.post("/api/buddies", { data: { email: them.email } })).status()).toBeLessThan(300);

    const page = await context.newPage();
    await page.goto("/games");
    await ready(page, "start-game");
    await page.getByTestId("start-game-with").selectOption(`m:${theirId}`);
    await page.getByTestId("start-game-go").click();

    await expect(page).toHaveURL(new RegExp(`/new\\?.*against=${theirId}`));
    const screen = await setUpScreen(page);
    await expect(screen.opponent).toHaveValue(`m:${theirId}`);

    await context.close();
  });

  test("someone at this screen still goes to a board, and must", async ({ browser, baseURL }) => {
    /*
     * The one press in the sentence that is NOT a way into a shared game. A
     * scratch board is "try this out", deliberately not a game anybody set up,
     * and sending it to the setup screen would take away the fastest way to meet
     * one of the games nobody has played.
     */
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `screen-${stamp}@example.test`,
      name: `Screen ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/games");
    await ready(page, "start-game");
    await page.getByTestId("start-game-with").selectOption("screen");
    await page.getByTestId("start-game-go").click();
    await expect(page).toHaveURL(/\/games\/gomoku\/play$/);
    await context.close();
  });

  test("New game, in the navigation, from anywhere", async ({ browser, baseURL }) => {
    /*
     * The entry point that was MISSING rather than wrong. /play lists the games
     * you have going and had no way to start another — you went to Games, picked
     * one, and only then met this screen. Every site this was modelled on has a
     * permanent New Game row; ItsYourTurn puts it under Game Status.
     */
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `nav-${stamp}@example.test`,
      name: `Nav ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/play");

    await page.getByRole("link", { name: "New game", exact: true }).first().click();
    await expect(page).toHaveURL(/\/games\/new$/);
    await setUpScreen(page);

    /*
     * And the bar says which row you are in, once rather than twice. /games/new
     * sits under /games, so a plain prefix match lit both rows up and the
     * navigation claimed the reader was in two places at once.
     */
    await expect(page.getByRole("link", { name: "New game", exact: true }).first()).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("link", { name: "Games", exact: true }).first()).not.toHaveAttribute(
      "aria-current",
      "page",
    );

    await context.close();
  });

  test("and from the empty list on the page a member lands on", async ({ browser, baseURL }) => {
    /*
     * A member with nothing to move is exactly who wants a game, and this page
     * used to tell them what they could do without offering it. The member is
     * brand new, so the list this asserts about holds only what this spec made
     * — which is nothing.
     */
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `empty-${stamp}@example.test`,
      name: `Empty ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/play");

    const invitation = page.getByTestId("empty-new-game");
    await expect(page.getByTestId("my-games-empty")).toBeVisible();
    await expect(invitation).toBeVisible();
    await invitation.click();
    await expect(page).toHaveURL(/\/games\/new$/);
    await setUpScreen(page);

    await context.close();
  });

  /*
   * THE PROMISE UNDERNEATH ALL OF THE ABOVE, checked once at the end: reaching
   * the screen creates nothing. It is the whole reason the screen exists, and
   * the one thing that would make every case above worthless if it stopped
   * being true.
   */
  test("and reaching it from a press creates nothing at all", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `nothing-${stamp}@example.test`, name: `Nothing ${stamp}` };
    const them = { email: `nobody-${stamp}@example.test`, name: `Nobody ${stamp}` };
    await seedMember(them);
    const context = await memberContext(browser, baseURL!, me);
    const theirId = await memberIdFor(them.email);
    const page = await context.newPage();

    await page.goto(`/players/${theirId}`);
    await page.getByTestId("player-actions").getByTestId("challenge").click();
    await setUpScreen(page);

    const mine = await context.request.get("/api/games/mine");
    /*
     * The status is asserted rather than tolerated. "I could not get far enough
     * to look" is not a statement about the code, and a spec that shrugged at a
     * 401 here would go green having never once checked the thing it names.
     */
    expect(mine.status()).toBe(200);
    const groups = ((await mine.json()) as { groups: Record<string, unknown[]> }).groups;
    const total = Object.values(groups).reduce((sum, list) => sum + list.length, 0);
    expect(total, "a fresh member who only looked at the screen has no games").toBe(0);

    await context.close();
  });
});
