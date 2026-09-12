import { expect, test } from "@playwright/test";

import { memberContext, seatTokensFor, seedMember } from "./members";
import { chooseGame, chosenBoard, openMoreSettings, ready, startAndBegin } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * A REMATCH AND A FORK ARE CONFIRMATIONS NOW, NOT INSTANT GAMES.
 *
 * Both used to create a game on the press and land on its board, which was
 * defensible for a rematch — it is the same game again, so there is nothing to
 * ask — right up until John said what he actually wanted from it:
 *
 *   "If you choose to rematch someone for a game, then in that screen you're
 *   just confirming the rules, etc... since player and game are chosen. Perhaps
 *   you want to switch over to a variant — you need this page so that you can
 *   say, I want to definitely play Bob at Reversi, but I want to try that
 *   variant, and change some rules..."
 *
 * So the screen has to do two opposite things well: accept the whole thing in
 * one press, AND let every field be changed. The pair of cases below are that
 * pair, and the second one is the one that was impossible before — there was no
 * way to play somebody again at a different variant except by starting a fresh
 * game and filling it in from memory.
 *
 * A rematch's address deliberately does NOT name the game: /games/new is where
 * the game is still a field. That is the difference between it and a fork, whose
 * position belongs to the game it was played in.
 */

/** A finished game between two members, with settings worth losing. */
async function playedOut(
  browser: import("@playwright/test").Browser,
  baseURL: string,
  stamp: string,
) {
  const me = { email: `again-${stamp}@example.test`, name: `Again ${stamp}` };
  const them = { email: `foe-${stamp}@example.test`, name: `Foe ${stamp}` };
  await seedMember(me);
  await seedMember(them);
  const context = await memberContext(browser, baseURL, me);

  /*
   * A small board, a long clock, no resigning, and three in a row to win. None
   * of those is a default, which is the point: a confirmation that quietly
   * handed back the defaults would look identical to one that carried the game.
   */
  const made = await context.request.post("/api/games/live", {
    data: {
      challenge: them.email,
      variant: "freestyle",
      size: 9,
      winLength: 3,
      moveTimeMs: 86_400_000,
      allowResign: false,
    },
  });
  expect(made.status(), await made.text()).toBe(201);
  const created = (await made.json()) as { id: string };
  tidyAway(created.id);

  /*
   * AND THEY ACCEPT IT. A challenge is an OFFER now — one seat bound, one
   * offered — and the moves route answers 409 to either token until it is
   * answered. Read the tokens AFTER, because accepting mints a fresh key for
   * the seat it binds.
   */
  const theirs = await memberContext(browser, baseURL, them);
  const accepted = await theirs.request.post(`/api/games/${created.id}/offer/accept`, {});
  expect(accepted.status(), await accepted.text()).toBe(200);
  await theirs.close();

  const game = { id: created.id, ...(await seatTokensFor(created.id)) };

  // Play it out. Black is the challenger, which is this member.
  const moves: [number, number][] = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [0, 2],
  ];
  for (const [index, [row, col]] of moves.entries()) {
    const played = await context.request.post(`/api/games/${game.id}/moves`, {
      data: { token: index % 2 === 0 ? game.blackToken : game.whiteToken, row, col },
    });
    expect(played.status()).toBe(201);
  }
  return { context, me, them, game };
}

test.describe("playing a finished game again", () => {
  test("opens a confirmation with everything already filled in", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const { context, them, game } = await playedOut(browser, baseURL!, stamp);
    const page = await context.newPage();
    await page.goto(`/games/gomoku/match/${game.id}`);

    /*
     * Driven by the control a reader presses. It is a link now rather than a
     * button — it navigates and writes nothing — which is why this asks for a
     * link by name; a spec still asking for a button would fail on a working
     * site and say nothing about the rematch.
     */
    const again = page.getByRole("link", { name: /Play again as White/ });
    await expect(again).toBeVisible();
    await again.click();

    // The game is NOT in the path, and that is on purpose: it is still a field.
    await expect(page).toHaveURL(new RegExp(`/games/new\\?rematch=${game.id}`));
    await ready(page, "set-up-game");

    /*
     * Everything the old game was played under is here, and nothing is asked
     * twice. The board is a row of blocks rather than a dropdown, so the claim is
     * about which block is chosen; the clock and the opponent are behind the More
     * settings drawer, which a reader opens and so does this.
     */
    await expect(chosenBoard(page)).toHaveAttribute("data-size", "9");
    await openMoreSettings(page);
    await expect(page.getByTestId("shared-rules-move-time")).toHaveValue(String(86_400_000));
    await expect(page.getByTestId("set-up-with")).not.toHaveValue("anyone");
    await expect(page.getByTestId("set-up-again")).toContainText(them.name);
    // And the colour, which changes, is said before anybody agrees to it.
    await expect(page.getByTestId("set-up-again")).toContainText("White");
    /*
     * THE FIELD JOHN ASKED FOR. A rematch that locked the game because its
     * address named one would have failed at the one thing he wanted this screen
     * for.
     */
    await expect(page.getByTestId("shared-rules-variant")).toBeVisible();

    await context.close();
  });

  test("one press accepts it, and it really is the same game", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const { context, me, them, game } = await playedOut(browser, baseURL!, stamp);
    const page = await context.newPage();
    await page.goto(`/games/gomoku/match/${game.id}`);
    await page.getByRole("link", { name: /Play again as White/ }).click();
    await ready(page, "set-up-game");

    /*
     * PRESSED IN TWO, BECAUSE WHAT STANDS BETWEEN THEM IS THE POINT. Start states
     * the game; Begin makes it. And a rematch is the case that best earns the page
     * in between: the colours swap, so "you are white this time" is worth reading
     * BEFORE the board rather than being worked out from it three moves in.
     */
    await page.getByTestId("set-up-start").click();
    await ready(page, "doorstep");
    await expect(page.getByTestId("doorstep-colours")).toContainText(them.name.split(" ")[0]);
    await expect(page.getByTestId("doorstep-colours")).toContainText("you are white");
    await page.getByTestId("doorstep-begin").click();
    await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/, { timeout: 30_000 });

    const id = page.url().split("/").pop()!;
    tidyAway(id);
    const started = await context.request.get(`/api/games/${id}`);
    expect(started.status()).toBe(200);
    const next = (await started.json()) as {
      size: number;
      moveTimeMs: number | null;
      allowResign: boolean;
      winLength: number;
      blackName: string;
      whiteName: string;
    };
    expect(next.size, "the board comes with it").toBe(9);
    expect(next.moveTimeMs, "and the clock").toBe(86_400_000);
    expect(next.allowResign, "and the rules, including the ones that are off").toBe(false);
    /*
     * And the line length, which this form has no row for. A freestyle game
     * agreed at three in a row that came back needing five would be unwinnable
     * on the board it was played on — the shape of bug John found in a rematched
     * game of noughts and crosses.
     */
    expect(next.winLength, "and the line length nobody was asked about").toBe(3);
    // Colours swapped: they had white, so they are black now.
    expect(next.blackName).toBe(them.name);
    expect(next.whiteName).toBe(me.name);

    await context.close();
  });

  test("or the variant is changed, which was impossible before", async ({ browser, baseURL }) => {
    /*
     * John's own example, driven: play the same person, at a different game.
     * Until now the only route to it was to abandon the rematch, go to the setup
     * screen from somewhere else, and fill the opponent in again from memory.
     */
    const stamp = Date.now().toString(36);
    const { context, them, game } = await playedOut(browser, baseURL!, stamp);
    const page = await context.newPage();
    await page.goto(`/games/gomoku/match/${game.id}`);
    await page.getByRole("link", { name: /Play again as White/ }).click();
    await ready(page, "set-up-game");

    await chooseGame(page, "reversi");

    /*
     * The screen says it has stopped being a repeat. It has to: a rematch swaps
     * the colours and a fresh challenge does not, so accepting this silently
     * would hand somebody a colour they were told they would not have.
     */
    await expect(page.getByTestId("set-up-again")).toContainText(/new game/i);

    await startAndBegin(page);
    await page.waitForURL(/\/games\/reversi\/match\/[^/]+$/, { timeout: 30_000 });

    const id = page.url().split("/").pop()!;
    tidyAway(id);
    const started = await context.request.get(`/api/games/${id}`);
    expect(started.status()).toBe(200);
    const next = (await started.json()) as { variant: string; blackName: string; whiteName: string };
    expect(next.variant, "the game somebody actually asked for").toBe("reversi");
    // Still against the same person, which is the half that must not be lost.
    expect([next.blackName, next.whiteName]).toContain(them.name);

    await context.close();
  });
});

test.describe("carrying a position into a new game", () => {
  /*
   * A FORK OF A GAME AGAINST A COMPUTER PLAYER PLAYS THAT COMPUTER PLAYER AGAIN.
   *
   * It used to become two people at one screen, and every screen in front of it
   * said otherwise. The route bound the second seat from the opponent's EMAIL and
   * a program has none — it never signs in — so the fork found nobody, fell
   * through to a hot seat, and quietly made a board for one device. Meanwhile
   * `personNamed` answers with the program, so the setup screen named it, the
   * doorstep said "who plays white" and offered a rating, and `ratedAtCreation`
   * then refused that rating because a hot-seat game can never move one.
   *
   * DRIVEN THROUGH THE CONTROLS A READER USES, because the fault was invisible
   * from the API: posting `from` directly and reading the row back would have
   * shown the hot seat without showing the three screens that promised otherwise.
   * The fork is CLICKED off the replay, the setup screen is read, Start and Begin
   * are pressed, and only then is the row asked what it says.
   *
   * Its own world: its own member, its own game, both taken away afterwards.
   */
  test("a fork of a game against a computer player plays that computer player again", async ({
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `botfork-${stamp}@example.test`, name: `BotFork ${stamp}` };
    await seedMember(me);
    const context = await memberContext(browser, baseURL!, me);

    /*
     * A graded computer player, by the fixed id `BOT_MEMBERS` gives it — the same
     * `challengeId` the doorstep's `against=<bot id>` sends for a fresh game.
     * Named here rather than imported because nothing under e2e/ resolves `@/`.
     */
    const made = await context.request.post("/api/games/live", {
      data: {
        challengeId: "kyu",
        variant: "freestyle",
        size: 9,
        winLength: 5,
        moveTimeMs: 86_400_000,
        allowResign: true,
      },
    });
    expect(made.status(), await made.text()).toBe(201);
    const created = (await made.json()) as { id: string };
    tidyAway(created.id);

    /*
     * The program's NAME as the row actually holds it, read back rather than
     * written down here: the screens below have to agree with the database, and a
     * name copied into a spec is a second place for it to be right.
     */
    const before = await context.request.get(`/api/games/${created.id}`);
    expect(before.status()).toBe(200);
    const source = (await before.json()) as { whiteMemberId: string | null; whiteName: string };
    expect(source.whiteMemberId, "a program is seated, not asked").toBe("kyu");
    const machine = `${source.whiteName} 機械`;

    /*
     * ONE STONE OF MINE, AND NOT A SECOND, which is a deliberate limit rather
     * than the least I could get away with. The moves route plays the program's
     * reply, and where that reply lands is the program's business — a second
     * stone of mine at a square I had chosen in advance collided with it and
     * failed this spec with "That intersection cannot be played", which is a
     * flake about a search wearing a bug about a fork. One move, then resigned,
     * leaves two moves on the record and nothing that depends on a choice
     * neither of us makes.
     */
    const game = { id: created.id, ...(await seatTokensFor(created.id)) };
    const played = await context.request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 0, col: 0 },
    });
    expect(played.status(), await played.text()).toBe(201);
    const resigned = await context.request.post(`/api/games/${game.id}/resign`, {
      data: { token: game.blackToken },
    });
    expect(resigned.status(), await resigned.text()).toBe(200);

    /*
     * FROM MOVE ONE, so the forked position is the program's to answer. That is
     * the half the old code could not reach at all: with the game hot-seated
     * there was nobody whose move it was, and `playBotTurns` was never called
     * because the route asked the REQUEST for a computer rather than the game.
     */
    const page = await context.newPage();
    await page.goto(`/games/gomoku/match/${game.id}/1`);

    const fork = page.getByRole("link", { name: /Play from move 1/ });
    await expect(fork).toBeVisible();
    await fork.click();

    await expect(page).toHaveURL(new RegExp(`/games/gomoku/new\\?from=${game.id}&move=1`));
    await ready(page, "set-up-game");

    // The screen names the program, and marks it as one — in the hint paragraph
    // and in the folded summary line, which used to read "the same opponent".
    await expect(page.getByTestId("set-up-fork")).toContainText(source.whiteName);
    await expect(page.getByTestId("more-settings-summary")).toContainText(machine);
    await openMoreSettings(page);
    /*
     * AND THE RATING IS STILL OFFERED, which is the promise the route used to
     * break. A game against a computer player is rated — in the computer pool,
     * fully and symmetrically (see `pools.ts`) — so there is nothing here to
     * withhold. The absence is asserted after a control that IS in the drawer has
     * been waited for, so it is a statement about a rendered form.
     */
    await expect(page.getByTestId("shared-rules-move-time")).toBeVisible();
    await expect(page.getByTestId("shared-rules-rated")).toBeVisible();

    await page.getByTestId("set-up-start").click();
    await ready(page, "doorstep");
    // The doorstep says who is playing, and does not say both seats are yours.
    await expect(page.getByTestId("doorstep-colours")).toContainText(machine);
    await expect(page.getByTestId("doorstep-colours")).not.toContainText("Both seats are yours");
    await expect(page.getByTestId("doorstep-colours"), "a program is never asked").not.toContainText(
      "This is an offer",
    );

    await page.getByTestId("doorstep-begin").click();
    await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/, { timeout: 30_000 });

    const id = page.url().split("/").pop()!;
    tidyAway(id);
    const next = await context.request.get(`/api/games/${id}`);
    expect(next.status()).toBe(200);
    const forked = (await next.json()) as {
      blackMemberId: string | null;
      whiteMemberId: string | null;
      rated: boolean;
      moveCount: number;
    };

    expect(forked.whiteMemberId, "the seat the program had, not a hot seat").toBe("kyu");
    expect(forked.blackMemberId, "and the colour I played, kept").not.toBeNull();
    expect(forked.rated, "rated, in the computer pool, as a fresh game against one is").toBe(true);
    /*
     * The position, and the program's answer to it. One move was carried and it
     * was white's turn, so a program that is actually seated has played by now —
     * two moves rather than one is the whole of "the bot answers".
     */
    expect(forked.moveCount, "the carried move, and the program's reply to it").toBe(2);

    await context.close();
  });

  test("a fork names its game in the path, and says how far in", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const { context, them, game } = await playedOut(browser, baseURL!, stamp);
    const page = await context.newPage();
    /*
     * One before the end, not the address `playedOut` finishes on: a fork is
     * hidden at the game's own last move (it would offer to replay the very
     * position that just decided it, beside "Play again"), so this test reads
     * it from a position where it is actually offered. What is under test
     * here is the fork's OWN behaviour once shown — that it names its game
     * and its move — not when it is shown, which `fork.test.ts` and the
     * fork-visibility spec cover.
     */
    await page.goto(`/games/gomoku/match/${game.id}/4`);

    const fork = page.getByRole("link", { name: /Play from move 4/ });
    await expect(fork).toBeVisible();
    await fork.click();

    /*
     * THE GAME IS IN THE PATH HERE, unlike a rematch, and for the opposite
     * reason: a position belongs to the game it was played in. Offering to make
     * a Gomoku position a Halma one would not be a preference.
     */
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/new\\?from=${game.id}&move=4`));
    await ready(page, "set-up-game");

    await expect(page.getByTestId("set-up-fork")).toContainText("move 4");
    await expect(page.getByTestId("set-up-fork")).toContainText(them.name);
    /*
     * So the game is not offered — and the absence is asserted only after
     * something that IS on the form has been waited for, or it would pass on a
     * page that had not rendered at all.
     */
    await openMoreSettings(page);
    await expect(page.getByTestId("shared-rules-move-time")).toBeVisible();
    await expect(page.getByTestId("shared-rules-variant")).toHaveCount(0);

    await context.close();
  });

  /*
   * A FORK WITH NOBODY OFFERS NO RATING, BECAUSE IT CANNOT HONOUR ONE.
   *
   * Forking a game whose other seat nobody signed in for — a board played from
   * a link, at a kitchen table — leaves nobody to hand the second seat to, so
   * the creation route makes the new game a hot seat. A hot-seat game moves no
   * rating whatever its row says: the write path reads the seats before it asks
   * the names and never reaches `recordResult`. The setup screen went on
   * offering the rating select anyway, and both this screen and the doorstep
   * after it printed "Rated" over a game that would count for nothing.
   *
   * Its own world: its own member, its own game, its own unclaimed seat. The
   * absence below is asserted only after `openMoreSettings` has waited for a
   * control that IS in the drawer, so it is a statement about a rendered form
   * rather than about how fast the page answered.
   */
  test("a fork with nobody offers no rating, and says at one screen it will not count", async ({
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `lonefork-${stamp}@example.test`, name: `LoneFork ${stamp}` };
    await seedMember(me);
    const context = await memberContext(browser, baseURL!, me);

    /*
     * A game with nobody challenged: creating one through the API binds NEITHER
     * seat (see kitchen-table.spec.ts), so following the black link below binds
     * this member to black and leaves white a seat no account ever takes.
     * Rated, because that is the row that makes the fault visible — the fork
     * carries `rated: true` into a board at one screen.
     */
    const made = await context.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, winLength: 3, moveTimeMs: null, rated: true },
    });
    expect(made.status(), await made.text()).toBe(201);
    const created = (await made.json()) as { id: string; blackToken: string };
    tidyAway(created.id);

    const page = await context.newPage();
    // Following your own seat link is what a person does, and it is what makes
    // this reader the one the fork is offered to at all — see `forkOffered`.
    await page.goto(`/games/gomoku/match/${created.id}/seat/${created.blackToken}`);

    // After claiming: binding a seat mints a fresh key for it.
    const game = { id: created.id, ...(await seatTokensFor(created.id)) };
    const moves: [number, number][] = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ];
    for (const [index, [row, col]] of moves.entries()) {
      const played = await context.request.post(`/api/games/${game.id}/moves`, {
        data: { token: index % 2 === 0 ? game.blackToken : game.whiteToken, row, col },
      });
      expect(played.status(), await played.text()).toBe(201);
    }

    // One before the end, where the fork is offered at all.
    await page.goto(`/games/gomoku/match/${game.id}/4`);
    await page.getByRole("link", { name: /Play from move 4/ }).click();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/new\\?from=${game.id}&move=4`));
    await ready(page, "set-up-game");

    // Nobody to hand the seat to, which the screen already said before this row existed.
    await expect(page.getByTestId("set-up-fork")).toContainText("move 4");

    await openMoreSettings(page);
    await expect(page.getByTestId("shared-rules-rated")).toHaveCount(0);
    // And the fact is stated in the control's place rather than left out.
    await expect(page.getByTestId("more-settings-summary")).toContainText("Will not count");

    /*
     * AND THE DOORSTEP AGREES WITH ITSELF. Its paragraph and its table of facts
     * both read from the same answer, so neither can say "Rated" beside "both
     * seats are yours". Driven by the Start button rather than by typing the
     * address, because a reader presses Start.
     */
    await page.getByTestId("set-up-start").click();
    await ready(page, "doorstep");
    await expect(page.getByTestId("doorstep-statement")).toContainText("Will not count");
    await expect(page.getByTestId("doorstep-statement")).not.toContainText("Rated.");
    await expect(page.getByTestId("doorstep-colours")).toContainText("two people at one screen");
    // The table of facts has room for the reason as well as the verdict.
    await expect(page.getByTestId("doorstep-facts")).toContainText("Will not count — one screen");

    await context.close();
  });

  test("and the clock it is played on is this game's own business", async ({ browser, baseURL }) => {
    /*
     * The board, the game and the opening come with the position. The PACE does
     * not: it is about the moves still to come rather than the ones already
     * played, so it is offered — and it has to actually stick, or it is a control
     * whose answer the server throws away.
     */
    const stamp = Date.now().toString(36);
    const { context, game } = await playedOut(browser, baseURL!, stamp);
    const page = await context.newPage();
    // One before the end — see the fork test above for why the last move itself offers none.
    await page.goto(`/games/gomoku/match/${game.id}/4`);
    await page.getByRole("link", { name: /Play from move 4/ }).click();
    await ready(page, "set-up-game");

    /*
     * It opens on the clock the game it forks was played on, not on a default —
     * and the clock is in the drawer, so a reader opens it to see that. A fork
     * has no opponent in there, which is what `openMoreSettings` waits on the
     * clock rather than the opponent for.
     */
    await openMoreSettings(page);
    await expect(page.getByTestId("shared-rules-move-time")).toHaveValue(String(86_400_000));
    await page.getByTestId("shared-rules-move-time").selectOption(String(5 * 60_000));
    await startAndBegin(page);
    await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/, { timeout: 30_000 });

    const id = page.url().split("/").pop()!;
    tidyAway(id);
    const made = await context.request.get(`/api/games/${id}`);
    expect(made.status()).toBe(200);
    const next = (await made.json()) as { size: number; moveTimeMs: number | null; moveCount: number };
    expect(next.moveTimeMs, "the pace this game was set up with").toBe(5 * 60_000);
    expect(next.size, "and the board the position needs, which was not asked about").toBe(9);
    expect(next.moveCount, "with the position carried into it").toBe(4);

    await context.close();
  });
});
