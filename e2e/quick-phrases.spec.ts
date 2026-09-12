import { expect, test } from "@playwright/test";
import { gamesMade, namesPlayedUnder } from "./tidy";
import { PLAYER_STATE, ready } from "./support";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();
/** And the names they were played under, which outlive the games. */
const under = namesPlayedUnder();

/**
 * The phrases a slow game needs, one tap each.
 *
 * An emoji carries a mood; a game played a move a day needs sentences — that
 * you are going out, that you are not ignoring them, that the last move was a
 * slip. This walks a phrase the whole way: tapped in the live game, seen by
 * the other seat, and kept on the record afterwards against the move it was
 * sent at.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A BROWSER HOLDING AN INVITE AND NO ACCOUNT, FOR THE WHOLE FILE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * "is kept on the record" PLAYS A MOVE, and it was red on two of four runs
 * here for a reason that had nothing to do with phrases. The board carries a
 * player onward to their next waiting game the moment a move ends their turn
 * — `useAdvanceToNextGame`, which John asked for: "you play your move, then
 * the next game opens up" — and `/api/games/mine` builds that queue from the
 * request's seat cookies AND from the account. The suite signs in as the
 * operator, whose queue on a developer's machine holds the twenty-odd boards
 * four hundred other specs left waiting, so the stone below landed, the board
 * pushed itself to a stranger's game, and the phrase was tapped on somebody
 * else's board. Same fault, same diagnosis and same remedy as
 * `give-up-from-the-board.spec.ts` and `next-game.spec.ts`; see AGENTS.md,
 * "A Spec Should Bring Its Own World".
 *
 * An invite identity is never bound to a member, so this file's queue is its
 * own seat cookies and nothing else — exactly the games it made. A phrase is
 * a SEAT's to send rather than an account's (`POST /api/games/:id/reactions`
 * takes a seat token, and `addReaction` refuses one that holds no seat), so
 * nothing here wants a member row and none is seeded.
 *
 * A FRESH CONTEXT ALONE IS NOT THE FIX, and was tried: `browser.newContext()`
 * inherits the project's `storageState`, so a new context is the same
 * operator. The identity has to be named, which is what `test.use` does here.
 *
 * AND EVERY CASE THAT PLAYS SAYS WHICH BOARD IT IS TALKING ABOUT, before the
 * move and after it. The failure above wore the wrong failure for two runs —
 * a phrase missing from a bubble, rather than "you are looking at another
 * game" — and that is the one line that tells those two apart.
 */
test.describe("quick phrases", () => {
  test.use({ storageState: PLAYER_STATE });

  async function seatedGame(request: import("@playwright/test").APIRequestContext) {
    const stamp = Date.now().toString(36);
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

  test("one tap sends the phrase, and the other seat sees it", async ({ browser, request }) => {
    const game = await seatedGame(request);
    const black = await (await browser.newContext()).newPage();
    const white = await (await browser.newContext()).newPage();
    await black.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await white.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);

    // The phrases live in the shared board's own component, which says when
    // it is listening. A tap before then sends nothing.
    await ready(black, "shared-game");
    await expect(black.getByTestId("quick-phrases")).toBeVisible();
    await black.getByTestId("quick-phrase").filter({ hasText: "Hello, good luck" }).click();

    await expect(black.getByTestId("reaction-mine")).toContainText("Hello, good luck");
    await expect(white.getByTestId("reaction-theirs")).toContainText("Hello, good luck", {
      timeout: 10_000,
    });
  });

  test("does not cost you a message you were already typing", async ({ page, request }) => {
    const game = await seatedGame(request);
    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);

    await ready(page, "shared-game");
    const box = page.getByTestId("reaction-text");
    await box.fill("half a thought");
    await page.getByTestId("quick-phrase").filter({ hasText: "No rush" }).click();

    await expect(page.getByTestId("reaction-mine")).toContainText("No rush");
    // The draft is still there: a quick phrase is its own message, not a
    // replacement for the one somebody was composing.
    await expect(box).toHaveValue("half a thought");
  });

  test("is kept on the record, against the move it was sent at", async ({ page, request }) => {
    const game = await seatedGame(request);
    const thisBoard = boardOf(game.id);
    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    // The board too: a stone played before the browser has the board is
    // swallowed, and the next line fails on a stone that was never laid.
    await ready(page, "shared-game");
    // THE BOARD THIS CASE IS TALKING ABOUT, said out loud before the move.
    await expect(page).toHaveURL(thisBoard);
    await page.getByRole("button", { name: /^E5, empty$/ }).click();
    await expect(page.getByRole("button", { name: "E5, Black stone" })).toBeVisible();
    /*
     * And again after it, because the move is what could have moved the page:
     * the turn has ended, so this is the moment the advance reads the queue.
     * Nothing is waiting on this browser but the board it is on, so it stays
     * — and if that ever stops being true, this line says which board the
     * phrase below was really tapped on.
     */
    await expect(page, "the board wandered off to another game").toHaveURL(thisBoard);
    await page.getByTestId("quick-phrase").filter({ hasText: "Good game, thank you" }).click();
    await expect(page.getByTestId("reaction-mine")).toContainText("Good game, thank you");
    await expect(page, "the phrase was sent on another game's board").toHaveURL(thisBoard);

    await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } });
    await page.goto(`/games/gomoku/match/${game.id}`);
    const talk = page.getByTestId("conversation");
    await expect(talk).toBeVisible();
    await expect(talk).toContainText("Good game, thank you");
    await expect(talk).toContainText("Move 1");
  });

  test("a spectator is offered none of them", async ({ page, request }) => {
    const game = await seatedGame(request);
    await page.goto(`/games/gomoku/match/${game.id}`);
    // Waited for before anything is called absent: the board is what a
    // watcher does get, and `toHaveCount(0)` on its own would agree to an
    // empty page as readily as to a board with no phrases on it.
    await ready(page, "shared-game");
    // Same rule as the emoji bar: only a seat holder may say anything.
    await expect(page.getByTestId("quick-phrases")).toHaveCount(0);
  });
});
