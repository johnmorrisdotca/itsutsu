import { expect, test } from "@playwright/test";
import { gamesMade, namesPlayedUnder } from "./tidy";
import { PLAYER_STATE, ready } from "./support";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();
/** And the names they were played under, which outlive the games. */
const under = namesPlayedUnder();

/**
 * Turning the board round, for yourself.
 *
 * A per-viewer view and nothing else: it moves no stone, changes no
 * coordinate, and the other seat never learns of it. The thing to prove is
 * both halves of that — that the board really does turn, gutters and all, and
 * that the opponent's board does not.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A BROWSER HOLDING AN INVITE AND NO ACCOUNT, FOR THE WHOLE FILE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The first case PLAYS A MOVE, and it was red on one of two runs here with a
 * failure that named a coordinate: `"A3, Black stone" [disabled]`. A turned
 * 9×9 board begins at J1 and A3 is no corner of one, and `[disabled]` means
 * finished — so the locator had found a move-list entry on SOMEBODY ELSE'S
 * finished match. Nothing was wrong with turning a board.
 *
 * What moved the page was the move. The board carries a player onward to their
 * next waiting game the moment a move ends their turn — `useAdvanceToNextGame`
 * — and `/api/games/mine` builds that queue from the request's seat cookies AND
 * from the account. The suite signs in as the operator, whose queue on a
 * developer's machine holds the twenty-odd boards four hundred other specs left
 * waiting. Same fault, same diagnosis and same remedy as
 * `give-up-from-the-board.spec.ts` and `next-game.spec.ts`; see AGENTS.md,
 * "A Spec Should Bring Its Own World".
 *
 * An invite identity is never bound to a member, so this file's queue is its
 * own seat cookies and nothing else — exactly the games it made. It wants no
 * member row either way: which way up a board is read is kept per game in THIS
 * BROWSER's storage (`turned.ts`), and the fallback under it is the seat's own
 * side, which for an empty-board game like gomoku is not turned at all. The
 * operator's standing appearance preference used to sit between the two, which
 * is a second thing about a real account this file was quietly leaning on.
 *
 * AND EVERY CASE SAYS WHICH BOARD IT IS TALKING ABOUT. `waitForURL` used to
 * wait for `/games/gomoku/` — which any other game's board satisfies, so it
 * could not have caught this. The board's own address can.
 */
test.describe("turning the board round", () => {
  test.use({ storageState: PLAYER_STATE });

  /** Distinct per game, so two made in one millisecond are still two names. */
  let made = 0;

  async function game(request: import("@playwright/test").APIRequestContext) {
    made += 1;
    const stamp = `${Date.now().toString(36)}${made}`;
    const response = await request.post("/api/games/live", {
      data: { blackName: under(`Kaya ${stamp}`), whiteName: under(`Sumi ${stamp}`), size: 9 },
    });
    expect(response.status()).toBe(201);
    const game = (await response.json()) as { id: string; blackToken: string; whiteToken: string };
    tidyAway(game.id);
    return game;
  }

  /** The address this case is about, so a wandering board says so itself. */
  function boardOf(id: string) {
    return new RegExp(`/games/gomoku/match/${id}(/|$)`);
  }

  test("turns the board, and takes the letters and numbers with it", async ({ page, request }) => {
    const live = await game(request);
    const thisBoard = boardOf(live.id);
    await page.goto(`/games/gomoku/match/${live.id}/seat/${live.blackToken}`);
    await page.waitForURL(thisBoard);

    /*
     * The board and the Turn button are both the shared game's, and both are
     * server-rendered: a stone played or a turn asked for before React
     * attaches is dropped, and the failure lands on a coordinate.
     */
    await ready(page, "shared-game");
    // A stone somewhere off-centre, so a half turn is visible rather than symmetric.
    await page.getByRole("button", { name: /^A9, empty$/ }).click();
    await expect(page.getByRole("button", { name: "A9, Black stone" })).toBeVisible();
    /*
     * And this is still this game's board. The move ended the turn, so it is
     * the moment the advance reads the queue; nothing is waiting on this
     * browser but the board it is on, so it stays. Said out loud because
     * every coordinate below is meaningless about another game's board — which
     * is exactly the failure this case used to wear.
     */
    await expect(page, "the board wandered off to another game").toHaveURL(thisBoard);

    const board = page.getByRole("button", { name: /^[A-J]\d+, / });
    // Unturned, the first cell drawn is the top-left, A9.
    await expect(board.first()).toHaveAccessibleName(/^A9, /);

    await page.getByTestId("turn-board").click();

    // Turned, the first cell drawn is the opposite corner — and A9 is now last.
    await expect(board.first()).toHaveAccessibleName(/^J1, /);
    await expect(board.last()).toHaveAccessibleName(/^A9, Black stone$/);
  });

  test("the other player's board does not move", async ({ browser, request }) => {
    const live = await game(request);
    const black = await (await browser.newContext()).newPage();
    const white = await (await browser.newContext()).newPage();
    await black.goto(`/games/gomoku/match/${live.id}/seat/${live.blackToken}`);
    await white.goto(`/games/gomoku/match/${live.id}/seat/${live.whiteToken}`);

    await ready(black, "shared-game");
    await black.getByTestId("turn-board").click();
    await expect(black.getByRole("button", { name: /^[A-J]\d+, / }).first()).toHaveAccessibleName(
      /^J1, /,
    );

    // White's board is where it always was. This is the whole promise.
    await white.reload();
    await expect(white.getByRole("button", { name: /^[A-J]\d+, / }).first()).toHaveAccessibleName(
      /^A9, /,
    );
    await expect(white.getByTestId("turn-board")).toHaveText(/Turn the board round/);
  });

  test("the record shows the game the way it was being read", async ({ page, request }) => {
    const live = await game(request);
    const thisBoard = boardOf(live.id);
    await page.goto(`/games/gomoku/match/${live.id}/seat/${live.blackToken}`);
    await page.waitForURL(thisBoard);
    await ready(page, "shared-game");
    await page.getByRole("button", { name: /^A9, empty$/ }).click();
    await expect(page.getByRole("button", { name: "A9, Black stone" })).toBeVisible();
    // Still this board, so the button turned below is this game's. See above.
    await expect(page, "the board wandered off to another game").toHaveURL(thisBoard);
    await page.getByTestId("turn-board").click();

    // The same game, filed. It was being read upside down; it still is.
    await request.post(`/api/games/${live.id}/resign`, { data: { token: live.whiteToken } });
    await page.goto(`/games/gomoku/match/${live.id}`);
    await expect(page.getByRole("button", { name: /^[A-J]\d+, / }).first()).toHaveAccessibleName(/^J1, /);
    await expect(page.getByTestId("turn-board")).toHaveText(/Turn the board back/);
  });

  test("is remembered for that game, and not for another", async ({ page, request }) => {
    const one = await game(request);
    const two = await game(request);

    await page.goto(`/games/gomoku/match/${one.id}/seat/${one.blackToken}`);
    await page.waitForURL(boardOf(one.id));
    await ready(page, "shared-game");
    await page.getByTestId("turn-board").click();
    await expect(page.getByTestId("turn-board")).toHaveText(/Turn the board back/);

    // Still turned when you come back to it.
    await page.reload();
    await expect(page.getByTestId("turn-board")).toHaveText(/Turn the board back/);

    // A different game is a different sitting, and is left alone.
    await page.goto(`/games/gomoku/match/${two.id}/seat/${two.blackToken}`);
    await page.waitForURL(boardOf(two.id));
    await expect(page.getByTestId("turn-board")).toHaveText(/Turn the board round/);
  });
});
