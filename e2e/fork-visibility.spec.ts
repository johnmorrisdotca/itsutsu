import { expect, test } from "@playwright/test";
import type { Browser } from "@playwright/test";

import { memberContext, seatTokensFor, seedMember } from "./members";
import { ready } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * When the fork control is offered, on a finished game's replay and on a
 * live one's board.
 *
 * John, on a game he had just lost: "What is the point of the PLAY FROM MOVE
 * 26 button? Why do I want to play from the END where I lost??? ... It should
 * probably only show up when someone browses through their game history as
 * the game is going on... but not shown by a viewer as it forces another game
 * by the opponent." And earlier, the same complaint from the other direction:
 * "People think it's a rematch button."
 *
 * Two rules follow, and both are tested here rather than assumed from the
 * predicate alone: a fork replays a position that could have gone
 * differently, which the final move never is, and it is only for somebody
 * who played the game, since forking binds a new game to a player who was
 * never asked.
 */

/** A finished game between two members, "me" as black, decided in three moves each. */
async function finishedGame(browser: Browser, baseURL: string, stamp: string) {
  const me = { email: `forker-${stamp}@example.test`, name: `Forker ${stamp}` };
  const them = { email: `forked-${stamp}@example.test`, name: `Forked ${stamp}` };
  await seedMember(me);
  await seedMember(them);
  const context = await memberContext(browser, baseURL, me);

  const made = await context.request.post("/api/games/live", {
    data: { challenge: them.email, variant: "freestyle", size: 9, winLength: 3 },
  });
  expect(made.status(), await made.text()).toBe(201);
  const created = (await made.json()) as { id: string };
  tidyAway(created.id);
  /*
   * AND THEY ACCEPT IT, because a challenge is an OFFER now: one seat bound,
   * one offered, and no move from either of them until the question is
   * answered. A game they never agreed to is exactly what this file's own
   * subject — forking somebody into a new game — was raised about, so the two
   * lines are a fixture for this file rather than a detour from it.
   *
   * Before the tokens are read: accepting mints a fresh key for the seat it
   * binds, so a token read earlier would no longer play anything.
   */
  const theirs = await memberContext(browser, baseURL, them);
  const accepted = await theirs.request.post(`/api/games/${created.id}/offer/accept`, {});
  expect(accepted.status(), await accepted.text()).toBe(200);
  await theirs.close();

  const game = { id: created.id, ...(await seatTokensFor(created.id)) };

  // Black (the challenger, "me") takes the top row: a short, certain win.
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

test.describe("the fork on a finished game's replay", () => {
  test("is hidden at the final move, and appears the moment a reader scrubs back one, naming it", async ({
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const { context, game } = await finishedGame(browser, baseURL!, stamp);
    const page = await context.newPage();
    await page.goto(`/games/gomoku/match/${game.id}`);

    /*
     * The scrubber is the presence to wait for: on this page it renders the
     * final position (5 of 5) as soon as the page has actually answered, so
     * the absence right after it is a statement about a rendered page rather
     * than about the speed of the request.
     */
    const scrubber = page.getByTestId("replay-scrubber");
    await expect(scrubber).toHaveValue("5");
    await expect(page.getByRole("link", { name: /Play from move/ })).toHaveCount(0);

    /*
     * Scrub back one move — the control a reader would actually use, not a
     * different address typed in by hand. Next's App Router treats the
     * scrubber's own `history.replaceState` call as a real navigation (see
     * app-router.js's patched replaceState/ACTION_RESTORE), so this re-renders
     * the header from the server exactly as clicking a link would.
     */
    await scrubber.press("ArrowLeft");
    await expect(scrubber).toHaveValue("4");
    await expect(page.getByRole("link", { name: "Play from move 4 分岐" })).toBeVisible();

    await context.close();
  });

  test("is never offered to a reader who did not play it, at the end or scrubbed back", async ({
    browser,
    baseURL,
    page,
  }) => {
    const stamp = Date.now().toString(36);
    const { game } = await finishedGame(browser, baseURL!, stamp);

    // A third member, seated in nothing here.
    const stranger = { email: `bystander-${stamp}@example.test`, name: `Bystander ${stamp}` };
    const strangerContext = await memberContext(browser, baseURL!, stranger);

    /*
     * Two ways to be "not a player": a different signed-in account, and this
     * project's own stand-in for "somebody who only watched" — the operator's
     * default session (see rematch.spec.ts) — rather than a fully anonymous
     * context. This site's own invite gate stops a visitor with no session at
     * all before any game page, seated or not, which is a real and separate
     * rule from the one under test here; a truly cookie-less context would
     * be testing that gate rather than this one.
     */
    for (const watcherPage of [await strangerContext.newPage(), page]) {
      await watcherPage.goto(`/games/gomoku/match/${game.id}`);
      const scrubber = watcherPage.getByTestId("replay-scrubber");
      await expect(scrubber).toHaveValue("5");
      await expect(watcherPage.getByRole("link", { name: /Play from move/ })).toHaveCount(0);

      await scrubber.press("ArrowLeft");
      await expect(scrubber).toHaveValue("4");
      await expect(watcherPage.getByRole("link", { name: /Play from move/ })).toHaveCount(0);
    }

    await strangerContext.close();
  });
});

test.describe("the fork panel on a live match", () => {
  test("does not appear at the game's current position, even for the player sitting in it", async ({
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `liveforker-${stamp}@example.test`, name: `LiveForker ${stamp}` };
    const them = { email: `liveopp-${stamp}@example.test`, name: `LiveOpp ${stamp}` };
    await seedMember(me);
    await seedMember(them);
    const context = await memberContext(browser, baseURL!, me);

    const made = await context.request.post("/api/games/live", {
      data: { challenge: them.email, variant: "freestyle", size: 9, winLength: 3 },
    });
    expect(made.status(), await made.text()).toBe(201);
    const created = (await made.json()) as { id: string; blackToken: string };
    tidyAway(created.id);

    // Accepted first: a challenge is an offer, and an offer takes no move.
    const theirs = await memberContext(browser, baseURL!, them);
    const accepted = await theirs.request.post(`/api/games/${created.id}/offer/accept`, {});
    expect(accepted.status(), await accepted.text()).toBe(200);
    await theirs.close();

    // One move, well short of a finish: the game is still active.
    const played = await context.request.post(`/api/games/${created.id}/moves`, {
      data: { token: created.blackToken, row: 0, col: 0 },
    });
    expect(played.status(), await played.text()).toBe(201);

    const page = await context.newPage();
    await page.goto(`/games/gomoku/match/${created.id}`);
    // The board this reader is actually seated at, waited for by the marker
    // this page hydrates rather than by an element the server also renders.
    await ready(page, "shared-game");

    await expect(page.getByTestId("shared-rules")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Fork/ })).toHaveCount(0);

    await context.close();
  });
});
