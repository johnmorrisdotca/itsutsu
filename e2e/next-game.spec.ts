import { expect, test } from "@playwright/test";

import { PLAYER_STATE, playAt, ready } from "./support";
import { gamesMade } from "./tidy";

/**
 * After a move, on to the next game that is waiting.
 *
 * John, on playing several correspondence games at once: "IYT does this — you
 * play your move, then the next game opens up... We do not. Not very good
 * discoverability." The badge beside Play was the only signal, and a count
 * asks the reader to go looking.
 *
 * Driven the way a player drives it, for the reason AGENTS.md gives: the move
 * is CLICKED on the board, and where the browser ends up afterwards is the
 * assertion. A spec that posted the move to the API and read a header would
 * be testing the API, which never had this feature and still does not — the
 * advance is a reading decision made in the browser.
 *
 * Nothing here reloads. A reload would throw away exactly the client state
 * this feature lives in and turn a broken advance into a green test.
 *
 * IT CLAIMS ITS SEATS AS AN INVITE-ONLY BROWSER, which is not fussiness. The
 * queue of games waiting on somebody is read from their seat cookies AND from
 * their account, so a spec signed in as the member the whole suite plays as
 * inherits every unfinished board four hundred other tests left behind. The
 * first browser run of this file proved it by working correctly and looking
 * wrong: it carried the player onward to a real waiting game that was eight
 * moves old and belonged to another spec's fixture. A browser holding an
 * invite and no account has exactly the games it claimed, and nothing else.
 */

type Game = { id: string; blackToken: string; whiteToken: string };

/**
 * Its own boards, taken away when the file finishes.
 *
 * The queue this feature reads is the queue every OTHER spec's leftovers are
 * in, so a file that tests "where does a move take me next" and leaves five
 * unfinished games behind is making the next reader's world harder to reason
 * about — and this one leaves them unfinished on purpose, because a dismissed
 * question is the whole point of the case below.
 */
const mine = gamesMade();

async function start(request: import("@playwright/test").APIRequestContext): Promise<Game> {
  const response = await request.post("/api/games/live", {
    data: { blackName: "Kai", whiteName: "Mio", size: 9, variant: "freestyle" },
  });
  expect(response.status(), await response.text()).toBe(201);
  const game = (await response.json()) as Game;
  mine(game.id);
  return game;
}

async function move(
  request: import("@playwright/test").APIRequestContext,
  game: Game,
  token: string,
  row: number,
  col: number,
) {
  const response = await request.post(`/api/games/${game.id}/moves`, {
    data: { token, row, col },
  });
  expect(response.ok(), await response.text()).toBe(true);
}

/**
 * A game genuinely waiting on black: opened, answered, and back round.
 *
 * A board with no stones on it is NOT waiting on anybody, and this test used
 * to assume it was. The site files an unplayed board under "not started" on
 * purpose — the other seat may be a link nobody has opened yet — so it is
 * absent from the queue the badge counts, and being carried into a game with
 * nobody sitting opposite would be the wrong kind of onward.
 */
async function waitingOnBlack(request: import("@playwright/test").APIRequestContext): Promise<Game> {
  const game = await start(request);
  await move(request, game, game.blackToken, 0, 0);
  await move(request, game, game.whiteToken, 8, 8);
  return game;
}

test.describe("after a move, the next game that is waiting", () => {
  test.use({ storageState: PLAYER_STATE });

  test("carries you to the other board, and stops when that was the last one", async ({
    page,
    request,
  }) => {
    // Two boards genuinely waiting on black, the first of them the older.
    const first = await waitingOnBlack(request);
    const second = await waitingOnBlack(request);
    // And one with no stones on it, which is not waiting on anybody.
    const unplayed = await start(request);

    // Claim all three seats, the way somebody handed three links would.
    for (const game of [unplayed, second, first]) {
      await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
      await ready(page, "shared-game");
    }
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");

    /*
     * One move, clicked. The board it was played on is no longer waiting on
     * anybody here, so the browser should be looking at the other one — which
     * is the whole feature, and the thing a count beside Play could not do.
     */
    await playAt(page, 9, 4, 4);
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${second.id}(/|$)`));
    await ready(page, "shared-game");
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");

    /*
     * The way back, which is the half a one-directional test misses: from the
     * last board waiting on you there is nowhere to be carried to. The board
     * stays put and says so, rather than landing somebody on a blank page or
     * on the board they have just moved on — and the unplayed game is not an
     * answer to "where next", though this browser holds a seat in it.
     */
    await playAt(page, 9, 4, 4);
    await expect(page.getByTestId("nothing-waiting")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${second.id}(/|$)`));
    await expect(page.getByTestId("turn-banner")).toContainText("Waiting");
  });

  test("leaves a watcher where they are", async ({ page, request }) => {
    /*
     * Somebody reading a game they hold no seat in plays no move, so there is
     * nothing to be carried on from. Worth pinning because the advance reads
     * the queue of games waiting on this browser, and a watcher with a game of
     * their own elsewhere is exactly who a careless version would whisk away
     * from the board they chose to open.
     */
    const watched = await waitingOnBlack(request);
    const mine = await waitingOnBlack(request);
    await page.goto(`/games/gomoku/match/${mine.id}/seat/${mine.blackToken}`);
    await ready(page, "shared-game");

    await page.goto(`/games/gomoku/match/${watched.id}`);
    await ready(page, "shared-game");
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${watched.id}(/|$)`));
    await expect(page.getByTestId("nothing-waiting")).toHaveCount(0);
  });

  test("waits for an open resign, then goes when it is waved away", async ({ page, request }) => {
    /*
     * The advance lands a MOMENT after the move — a POST, a redraw, a read of
     * the queue — and a player who plays a stone and reaches straight for
     * Resign opens the question inside that moment. On a CI trace the board
     * then navigated with the question still on it and the click hit nothing:
     * "element was detached from the DOM".
     *
     * Two boards waiting, so the advance genuinely has somewhere to go: a case
     * where nothing would have moved anyway cannot tell holding from having
     * nowhere to hold from.
     */
    const other = await waitingOnBlack(request);
    const here = await waitingOnBlack(request);

    for (const game of [other, here]) {
      await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
      await ready(page, "shared-game");
    }
    const thisMatch = new RegExp(`/games/gomoku/match/${here.id}(/|$)`);
    await expect(page).toHaveURL(thisMatch);
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");

    /*
     * THE WINDOW, WIDENED RATHER THAN INVENTED. Held for two seconds, the move
     * is the same move, the click is a real click on the real control and the
     * advance runs its real course; what changes is that a race measured in
     * a couple of hundred milliseconds on localhost becomes one a test can be
     * inside. It is also the world the bug belongs to — a slow answer is
     * exactly when somebody has time to reach for Resign first.
     */
    await page.route(new RegExp(`/api/games/${here.id}/moves$`), async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await route.continue();
    });

    // The move goes, and the question goes up over it before the answer lands.
    await playAt(page, 9, 4, 4);
    await page.getByTestId("resign").click();
    await expect(page.getByTestId("resign-confirm")).toBeVisible();

    /*
     * THE MOVE HAS LANDED, said by the address rather than waited out. The
     * board writes the move count into it as it redraws, so `/3` is the client
     * having taken the server's answer — which is the same breath in which the
     * advance decides — and the id in front of it is this board and not
     * another. One assertion, two facts, and no sleeping.
     */
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${here.id}/3$`));
    // So the question is still there to answer, which it was not before.
    await expect(page.getByTestId("resign-confirm")).toBeVisible();
    await expect(page.getByTestId("turn-banner")).toContainText("Waiting");

    /*
     * And waved away, the advance goes ahead: the player changed their mind
     * about giving the game up, not about having finished their turn on it.
     * This half is what proves the advance was HELD rather than never due —
     * a feature that had quietly stopped working would stay here for ever.
     */
    await page.getByTestId("resign-no").click();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${other.id}(/|$)`));
    await ready(page, "shared-game");
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");
  });

  test("and stays put when the resign is gone through with", async ({ page, request }) => {
    /*
     * The other exit, and it must not be the same one. A question answered has
     * ENDED THE GAME, and a game that has just ended is the one board worth
     * staying on — the same reasoning `carriesOnwardFrom` gives for not
     * whisking somebody past their own win. So the held advance is dropped
     * rather than let through, and where to go next is the ending's business.
     *
     * Held over from the case above, because a held advance that fired a beat
     * late would look identical to one that was dropped: this is the half that
     * says WHICH.
     */
    const other = await waitingOnBlack(request);
    const here = await waitingOnBlack(request);

    for (const game of [other, here]) {
      await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
      await ready(page, "shared-game");
    }
    const thisMatch = new RegExp(`/games/gomoku/match/${here.id}(/|$)`);
    await expect(page).toHaveURL(thisMatch);

    await page.route(new RegExp(`/api/games/${here.id}/moves$`), async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await route.continue();
    });

    await playAt(page, 9, 4, 4);
    await page.getByTestId("resign").click();
    await expect(page.getByTestId("resign-confirm")).toBeVisible();
    // The move is in, so there is a held advance to drop rather than none.
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${here.id}/3$`));

    await page.getByTestId("resign-yes").click();

    /*
     * The server's word first, so the absence below is read off a page whose
     * game has actually ended rather than off a page that has not answered.
     */
    await expect
      .poll(
        async () =>
          ((await (await request.get(`/api/games/${here.id}`)).json()) as { status: string }).status,
        { timeout: 15_000 },
      )
      .toBe("finished");
    await expect(page, "the board was carried off its own ending").toHaveURL(thisMatch);
    await expect(page.getByTestId("turn-banner")).toHaveCount(0);
    await expect(page.getByTestId("resign-refused")).toHaveCount(0);
  });
});
