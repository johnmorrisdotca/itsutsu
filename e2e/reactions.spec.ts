import { expect, test } from "@playwright/test";
import { PLAYER_STATE, ready } from "./support";
import { gamesMade, namesPlayedUnder } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();
/** The names this file's games are played under, which outlive the games. See `namesPlayedUnder`. */
const under = namesPlayedUnder();

/** Distinct per game, so two made in one millisecond are still two names. */
let made = 0;

/** Starts a server-side game and returns its id and both seat tokens. */
async function startGame(request: import("@playwright/test").APIRequestContext) {
  made += 1;
  const stamp = `${Date.now().toString(36)}${made}`;
  const response = await request.post("/api/games/live", {
    data: { blackName: under(`Kai ${stamp}`), whiteName: under(`Mio ${stamp}`), size: 9 },
  });
  expect(response.status()).toBe(201);
  const game = (await response.json()) as { id: string; blackToken: string; whiteToken: string };
  tidyAway(game.id);
  return game;
}

/** The address a case is about, so a wandering board says so itself. */
function boardOf(id: string) {
  return new RegExp(`/games/gomoku/match/${id}(/|$)`);
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * A BROWSER HOLDING AN INVITE AND NO ACCOUNT, FOR THE WHOLE FILE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The first case PLAYS A MOVE, and it was a standing red for weeks for a
 * reason that had nothing to do with reactions. The board carries a player
 * onward to their next waiting game the moment a move ends their turn —
 * `useAdvanceToNextGame` — and `/api/games/mine` builds that queue from the
 * request's seat cookies AND from the account. Black used to play as the
 * operator, whose queue on a developer's machine holds the boards other specs
 * left waiting, so Black's stone landed, Black's page went to a stranger's
 * tic-tac-toe match twenty-seven games deep, and the 👏 White sent arrived on
 * a board nobody was looking at any more. The failure it wore was "no
 * reaction-theirs", which reads as the poll being broken. Same fault, same
 * diagnosis and same remedy as `give-up-from-the-board.spec.ts`,
 * `quick-phrases.spec.ts` and `turn-board.spec.ts`; see AGENTS.md, "A Spec
 * Should Bring Its Own World".
 *
 * An invite identity is never bound to a member, so each browser's queue here
 * is its own seat cookies and nothing else — exactly the seat it took. A
 * reaction is a SEAT's to send rather than an account's
 * (`POST /api/games/:id/reactions` takes a seat token), so nothing here wants
 * a member row and none is seeded. The two seats are two contexts, each
 * holding its own seat cookie, and each named explicitly rather than trusted
 * to inherit.
 *
 * AND THE CASE THAT PLAYS SAYS WHICH BOARD IT IS TALKING ABOUT, before the
 * move and after it — after the advance has had its say, not merely after the
 * click, since "still on this board" is true for a moment on every page.
 */
test.describe("reactions between the two players", () => {
  test.use({ storageState: PLAYER_STATE });

  test("an emoji sent from one seat reaches the other within a poll", async ({
    browser,
    request,
  }) => {
    const game = await startGame(request);
    const thisBoard = boardOf(game.id);
    const blackContext = await browser.newContext({ storageState: PLAYER_STATE });
    const whiteContext = await browser.newContext({ storageState: PLAYER_STATE });
    const black = await blackContext.newPage();
    const white = await whiteContext.newPage();
    await black.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await white.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);

    /*
     * Both boards, before either is driven. A stone played before React has
     * the board is dropped, and then the OTHER side waits out its ten-second
     * poll for a move nobody made — which reads as the poll being broken.
     */
    await ready(black, "shared-game");
    await ready(white, "shared-game");
    // THE BOARD THIS CASE IS TALKING ABOUT, said out loud before the move.
    await expect(black).toHaveURL(thisBoard);
    await black.getByRole("button", { name: /^E5, empty$/ }).click();
    await expect(black.getByRole("button", { name: "E5, Black stone" })).toBeVisible();
    /*
     * And again after it, because the move is what could have moved the page.
     * The advance reads the queue once the move is answered, and with nothing
     * else waiting on this browser it says so where it stands — so the notice
     * is the presence that makes the address below a statement about a
     * decided page rather than about how quickly the check was asked.
     */
    await expect(
      black.getByTestId("nothing-waiting"),
      "the move's advance never said it was staying — the board may have wandered off",
    ).toBeVisible();
    await expect(black, "the board wandered off to another game").toHaveURL(thisBoard);

    // White reacts to the move once its own poll has shown it.
    await expect(white.getByRole("button", { name: "E5, Black stone" })).toBeVisible({
      timeout: 10_000,
    });
    await white.getByRole("button", { name: "Send Nice move" }).click();

    // The sender sees it at once, marked as theirs.
    await expect(white.getByTestId("reaction-mine")).toContainText("👏");
    await expect(white.getByTestId("reaction-mine")).toContainText("move 1");
    // The other side sees it on the next poll, marked as the opponent's.
    await expect(black.getByTestId("reaction-theirs")).toContainText("👏", { timeout: 10_000 });
    await expect(black.getByTestId("reaction-log")).toContainText("👏");
    await expect(black, "the reaction was read on another game's board").toHaveURL(thisBoard);

    await blackContext.close();
    await whiteContext.close();
  });

  test("a spectator has no reaction bar, and a bad emoji is refused", async ({
    page,
    request,
  }) => {
    const game = await startGame(request);
    await page.goto(`/games/gomoku/match/${game.id}`);
    // The board is what a watcher does get, waited for, so the absence below
    // is about a rendered page and not about how fast it answered.
    await ready(page, "shared-game");
    await expect(page.getByTestId("reaction-bar")).toHaveCount(0);

    const refused = await request.post(`/api/games/${game.id}/reactions`, {
      data: { token: game.blackToken, emoji: "💩", moveNumber: null },
    });
    expect(refused.status()).toBe(400);

    const wrongSeat = await request.post(`/api/games/${game.id}/reactions`, {
      data: { token: "not-a-seat", emoji: "👏", moveNumber: null },
    });
    expect(wrongSeat.status()).toBe(403);

    const unplayed = await request.post(`/api/games/${game.id}/reactions`, {
      data: { token: game.blackToken, emoji: "👏", moveNumber: 3 },
    });
    expect(unplayed.status()).toBe(422);
  });
});
