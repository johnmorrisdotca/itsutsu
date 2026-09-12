import { expect, test } from "@playwright/test";

import { PLAYER_STATE, playAt, ready } from "./support";

/**
 * Giving a game up from the board a player is actually looking at.
 *
 * John, on a game his twelve-year-old was playing: "My daughter pressed
 * REsign in the TicTacToe game. Not working. Even the confirmation after
 * confirming the game doesn't end. BUG."
 *
 * THE COVERAGE GAP THIS CLOSES. `mygames.spec.ts` has "a game can be resigned
 * from the queue, and is then filed" — from /play, a list, where the
 * button's `router.refresh()` redraws the very list it sits in. Nothing
 * exercised the other place the same button appears, which is the board in
 * `SharedGame` — the place a player actually reaches for it, and the place
 * John's daughter did. There the page is a live client session holding its own
 * state, so "the server ended the game" and "the screen says so" are two
 * different claims, and only one of them was being made.
 *
 * Both are checked here, and separately: the server's word through the API,
 * and the board's through what it stops showing.
 *
 * AND IT MUST SAY WHICH BOARD. The first case below was red on three
 * consecutive CI runs, and on any database where the reader has a second game
 * on the go, for a reason that had nothing to do with resigning — see the
 * comment on it. The lesson is up here because it applies to every spec that
 * plays a move and then asserts something about the page: after a move, the
 * page may legitimately have become a DIFFERENT GAME's.
 */
test.describe("giving up, from the board", () => {
  test("resigning a game under way ends it, and the board stops asking for a move", async ({
    browser,
    request,
  }) => {
    const made = await request.post("/api/games/live", {
      data: { blackName: "Kai", whiteName: "Mio", size: 9 },
    });
    expect(made.status()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string };

    /*
     * A BROWSER HOLDING AN INVITE AND NO ACCOUNT, so the queue of games
     * waiting on this reader holds exactly the one game this test made.
     *
     * It used to play as the operator, and was red on every fresh database
     * with nothing wrong with resigning at all. The board carries a player
     * onward to their next waiting game the moment a move ends their turn —
     * `useAdvanceToNextGame`, which John asked for: "you play your move, then
     * the next game opens up" — and the operator's queue part-way through a
     * full run holds whatever the two hundred specs before this one left
     * waiting. So the stone below landed, the board pushed itself to a
     * stranger's game eight moves old, the resign still reached THIS game and
     * ended it, and the banner the assertion then found was the other game's,
     * correctly asking for a move. The trace said it in three lines: one
     * `/api/games/mine`, one navigation, two game ids.
     *
     * `/api/games/mine` reads the queue from the seat cookies on the request
     * and from the account, and an invite identity is never bound to a member
     * — so this context's queue is its own seat cookies and nothing else. It
     * is also the world the bug was reported from: one game on the go, and
     * nowhere to be carried onward to.
     */
    const context = await browser.newContext({ storageState: PLAYER_STATE });
    const page = await context.newPage();

    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    /*
     * Listening, not merely drawn. Every intersection is server-rendered, so a
     * stone placed before React attaches is dropped in silence and the board
     * looks like a board throughout. This raced hydration and won by forty
     * milliseconds on the CI trace, which is not a margin to keep a spec on.
     */
    await ready(page, "shared-game");
    await playAt(page, 9, 4, 4);
    await expect(page.getByTestId("turn-banner")).toBeVisible();

    /*
     * THE BOARD THIS TEST IS TALKING ABOUT, said out loud before it presses
     * anything and again before it reads the banner. The fault above wore the
     * wrong failure for three CI runs — "the board is still asking for a move"
     * rather than "you are looking at another game" — and this one line is
     * what tells those two apart.
     */
    const thisMatch = new RegExp(`/games/gomoku/match/${game.id}(/|$)`);
    await expect(page).toHaveURL(thisMatch);

    await page.getByTestId("resign").click();
    await page.getByTestId("resign-yes").click();

    /*
     * The server's word first, because it is the one that decides. A board
     * that redrew without the game ending would be the worse bug of the two:
     * it would look fixed.
     */
    await expect
      .poll(
        async () =>
          (await (await request.get(`/api/games/${game.id}`)).json()) as {
            status: string;
            result: string;
          },
        { timeout: 15_000 },
      )
      .toMatchObject({ status: "finished", result: "white" });

    /*
     * And the board's. The banner is not reworded when a game ends — it stops
     * being rendered — so its ABSENCE is the assertion, and a refusal the
     * button swallowed would leave it in place.
     */
    await expect(page, "the board wandered off to another game").toHaveURL(thisMatch);
    await expect(page.getByTestId("turn-banner")).toHaveCount(0);
    await expect(page.getByTestId("resign-refused")).toHaveCount(0);

    await context.close();
  });

  test("calling off a seat nobody has taken ends it too, without anybody winning", async ({
    page,
    request,
  }) => {
    /*
     * The other door, and it is deliberately a different one on the server:
     * before the first stone there is nothing to give up, so the button says
     * Cancel and posts to /cancel. Nobody wins a game that was never played.
     */
    const made = await request.post("/api/games/live", { data: { size: 9, open: true } });
    const game = (await made.json()) as { id: string; blackToken: string };

    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await expect(page.getByTestId("turn-banner")).toContainText("waiting for somebody");
    /*
     * Hydrated before the absence below is read, and before anything is
     * pressed. Nothing carries this reader anywhere — no move is played, so
     * the advance above cannot fire — but a control that has not arrived yet
     * and a control that is not offered look identical to `toHaveCount(0)`,
     * and a Cancel pressed before React attaches is dropped with the page
     * looking exactly as it should.
     */
    await ready(page, "shared-game");

    // Resigning is not even offered here — the word would be wrong.
    await expect(page.getByTestId("resign")).toHaveCount(0);
    await page.getByTestId("cancel").click();
    await page.getByTestId("cancel-yes").click();

    await expect
      .poll(
        async () =>
          ((await (await request.get(`/api/games/${game.id}`)).json()) as { status: string }).status,
        { timeout: 15_000 },
      )
      .not.toBe("active");
    await expect(page.getByTestId("turn-banner")).toHaveCount(0);
  });
});
