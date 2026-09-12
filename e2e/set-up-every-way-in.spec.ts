import { expect, test, type Page } from "@playwright/test";
import { shownName } from "../src/lib/rating/shownName";

import { memberContext, memberIdFor, seedMember } from "./members";
import { gamesMade } from "./tidy";
import { chooseGame, chosenBoard, openMoreSettings, ready } from "./support";

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

/**
 * Waits until the setup screen is listening, then reports what it is offering.
 *
 * The game and the board are PICKERS rather than dropdowns — rows of pictures —
 * so "is the game asked" is whether that fieldset is on the page, and "which one
 * is chosen" is read off the chosen card. The clock and the opponent are behind
 * the More settings drawer, which a spec opens the way a reader does.
 */
async function setUpScreen(page: Page) {
  await ready(page, "set-up-game");
  return {
    opponent: page.getByTestId("set-up-with"),
    start: page.getByTestId("set-up-start"),
    summary: page.getByTestId("set-up-summary"),
    game: page.getByTestId("shared-rules-variant"),
    chosenGame: page.locator('[data-testid="set-up-variant"][data-chosen="true"]'),
    board: chosenBoard(page),
    pace: page.getByTestId("shared-rules-move-time"),
  };
}

/**
 * Presses Start and says what it reaches: the doorstep, and still no game.
 *
 * THE SECOND HALF OF THIS FILE'S RULE, added when the doorstep was. Each case
 * below already proved that a press lands on the setup screen rather than on a
 * board. What none of them said was where the button at the BOTTOM of that
 * screen goes — and for a long time it went straight to a board, which is the
 * complaint John made four times: "we go straight to the game rather than the
 * Doorstep screen which confirms settings".
 *
 * So every entry point is now followed one press further. It is cheap, because
 * the thing being asserted is that nothing happens: no row is written and no
 * board is loaded.
 */
async function throughTheDoorstep(page: Page) {
  await page.getByTestId("set-up-start").click();
  await expect(page).toHaveURL(/\/games\/[^/]+\/begin(\?|$)/);
  await ready(page, "doorstep");
  await expect(page.getByTestId("doorstep-begin")).toBeVisible();
  await expect(page.getByTestId("doorstep-change")).toBeVisible();
  // A statement, not a board and not a second form.
  await expect(page.getByTestId("shared-game")).toHaveCount(0);
  await expect(page.getByTestId("set-up-game")).toHaveCount(0);
}

test.describe("every way into a game reaches the setup screen", () => {
  /* The games this file posts, taken away when it finishes. See `gamesMade`. */
  const mine = gamesMade();

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
    await openMoreSettings(page);
    await expect(screen.opponent).toHaveValue(`m:${theirId}`);
    await expect(page.getByTestId("set-up-against")).toContainText(them.name);
    // And the game is a question: the address named nobody's game, so it is asked.
    await expect(screen.game).toBeVisible();
    await expect(screen.start).toBeVisible();

    await throughTheDoorstep(page);

    await context.close();
  });

  test("Challenge, on a row of the players list", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `lists-${stamp}@example.test`, name: `Lists ${stamp}` };
    const them = { email: `listed-${stamp}@example.test`, name: `Listed${stamp} Tester` };
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
    /*
     * By the name the site PRINTS — a first name and an initial — through the
     * same function it prints with. The stamp is in the first word for that
     * reason: a surname stamp would have this case hunting for "Listed M." in a
     * list of every member, which is exactly how it failed on its first run.
     */
    const row = page.locator("tr", { hasText: shownName(them.name) }).first();
    await expect(row).toBeVisible();
    await row.getByTestId("challenge").click();

    await expect(page).toHaveURL(new RegExp(`/games/new\\?.*against=${theirId}`));
    const screen = await setUpScreen(page);
    await openMoreSettings(page);
    await expect(screen.opponent).toHaveValue(`m:${theirId}`);

    await throughTheDoorstep(page);

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
    await openMoreSettings(page);
    await expect(screen.opponent).not.toHaveValue("anyone");

    await throughTheDoorstep(page);

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
    await expect(screen.chosenGame).toHaveAttribute("data-variant", "reversi");
    await openMoreSettings(page);
    await expect(screen.opponent).toHaveValue("c:tamenoki");
    await expect(page.getByTestId("set-up-not-offered")).toHaveCount(0);

    /*
     * And when the game is changed to one it does not play, the screen SAYS the
     * offer has lapsed rather than quietly posting a seat instead. Falling back
     * is right; falling back in silence is the thing this whole change is about.
     */
    await chooseGame(page, "halma");
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

    /*
     * THIS CASE BRINGS THE SEAT THAT USED TO DECIDE IT.
     *
     * It was green on this machine every run and red on CI's fresh database
     * every run, and neither outcome was about the code being right: the
     * setup screen moves a DEFAULT board onto whichever seat somebody is
     * already waiting on — see `matchSeat`, which exists so that asking for a
     * game sits down with them rather than posting a second seat beside
     * theirs — and it did that to a board the ADDRESS had settled. It only
     * happened where EXACTLY ONE seat matched the game and the pace, so a
     * busy database drowned it and a fresh one hit it every time.
     *
     * So the seat is posted here, by somebody else, at 9×9 — the board this
     * case must NOT end up on. Six hours is picked because no other spec
     * posts a seat at it, which is what keeps the lone match this case needs
     * from depending on what else the database happens to hold.
     */
    const PACE = 6 * 60 * 60_000;
    const poster = await memberContext(browser, baseURL!, {
      email: `posted-${stamp}@example.test`,
      name: `Posted ${stamp}`,
    });
    const seated = await poster.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, moveTimeMs: PACE, open: true, blackName: `Posted ${stamp}` },
    });
    expect(seated.status(), "the seat this case is about has to exist").toBe(201);
    // And taken down when this file finishes: a seat left standing is what the
    // next spec reads in the sentence, which is how this suite lost a day once.
    mine(((await seated.json()) as { id: string }).id);
    await poster.close();

    const page = await context.newPage();
    await page.goto("/games");
    await ready(page, "start-game");

    await page.getByTestId("start-game-variant").selectOption("freestyle");
    await page.getByTestId("start-game-pace").selectOption(String(PACE));
    /*
     * The board is chosen AFTER the pace, because the sentence follows that
     * waiting seat until somebody says otherwise — so this select starts at 9
     * and choosing 19 is a reader overruling it, which is the whole scenario.
     */
    await page.getByTestId("start-game-board").selectOption("19");
    /*
     * TWO CLAIMS, KEPT SEPARATE ON PURPOSE. The sentence's own job is that its
     * Go control — a <Link> whose href is derived from the selects — carries
     * every word it settled. That is asserted directly on the href, and it is
     * the assertion this case was always meant to make.
     *
     * Then the destination is loaded by that verified href rather than by a
     * soft click. That is not about a client cache: the SERVER render was
     * wrong, and loading the address the link proved correct is what makes
     * this an assertion about the destination rather than about the router.
     */
    const go = page.getByTestId("start-game-go");
    await expect(go).toHaveAttribute("href", /board=19/);
    await expect(go).toHaveAttribute("href", new RegExp(`pace=${PACE}`));
    const href = (await go.getAttribute("href")) ?? "";
    // The game it named is in the PATH, because that is identity on this site.
    expect(href).toMatch(/\/games\/gomoku\/new\?board=19/);
    await page.goto(href);

    const screen = await setUpScreen(page);
    /*
     * And the board and the pace it named are filled in rather than asked
     * again — the board in particular, with a 9×9 seat waiting at this very
     * game and pace. A link that says 19 and a screen that shows 9 is John's
     * "started on 9×9 when I chose 19×19", and it was every board-carrying way
     * in: this sentence, a family page, a challenge, the doorstep's way back.
     */
    await expect(screen.board).toHaveAttribute("data-size", "19");
    await openMoreSettings(page);
    await expect(screen.pace).toHaveValue(String(PACE));

    /*
     * And the doorstep repeats the board the sentence settled, which is the point
     * of carrying the whole draft in the address rather than a head start on one:
     * a confirmation that quietly showed 9x9 would be worse than none.
     */
    await throughTheDoorstep(page);
    await expect(page.getByTestId("doorstep-statement")).toContainText("19×19");

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
    await openMoreSettings(page);
    await expect(screen.opponent).toHaveValue(`m:${theirId}`);

    /*
     * The doorstep names them and says which colour each of them gets, which is
     * the fact a person most wants before agreeing to a game.
     */
    await throughTheDoorstep(page);
    await expect(page.getByTestId("doorstep-colours")).toContainText(/black/i);

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

    await chooseGame(page, "reversi");
    await throughTheDoorstep(page);

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

    await chooseGame(page, "reversi");
    await throughTheDoorstep(page);

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
    /*
     * ALL THE WAY TO THE LAST PRESS BEFORE THE GAME. The promise used to end at
     * the setup screen, which was one screen short: the press at the bottom of it
     * wrote a row. Standing on the doorstep, having read what is about to happen,
     * is still nothing written.
     */
    await throughTheDoorstep(page);

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
