import { expect, test } from "@playwright/test";

import { PLAYER_STATE, playAt, ready } from "./support";

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

async function start(request: import("@playwright/test").APIRequestContext): Promise<Game> {
  const response = await request.post("/api/games/live", {
    data: { blackName: "Kai", whiteName: "Mio", size: 9, variant: "freestyle" },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as Game;
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
});
