import { expect, test } from "@playwright/test";
import type { Browser } from "@playwright/test";

import { memberContext, removeMember, seatTokensFor, seedMember } from "./members";
import { ready } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * A STARRED GAME GOES TO THE TOP. John, 2026-09-25: "ability to favourite your
 * game, it moves to the top".
 *
 * Two finished games of the member's own; the OLDER one is starred on its own
 * page, and the Completed tab then lists it first, in the Starred panel above
 * the newest. The star is taken off from the row, and the panel is empty again.
 * Somebody who did not play the game is offered no star. Every press is a click.
 */

/** A finished game between two members of this file, "me" as black, won on the top row. */
async function finishedGame(browser: Browser, baseURL: string, me: { email: string; name: string }, them: { email: string; name: string }) {
  const context = await memberContext(browser, baseURL, me);
  const made = await context.request.post("/api/games/live", {
    data: { challenge: them.email, variant: "freestyle", size: 9, winLength: 3 },
  });
  expect(made.status(), await made.text()).toBe(201);
  const created = (await made.json()) as { id: string };
  tidyAway(created.id);
  // A challenge is an offer: they accept it before anybody moves, and accepting mints the seat's key.
  const theirs = await memberContext(browser, baseURL, them);
  const accepted = await theirs.request.post(`/api/games/${created.id}/offer/accept`, {});
  expect(accepted.status(), await accepted.text()).toBe(200);
  await theirs.close();
  const tokens = await seatTokensFor(created.id);
  const moves: [number, number][] = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]];
  for (const [index, [row, col]] of moves.entries()) {
    const played = await context.request.post(`/api/games/${created.id}/moves`, {
      data: { token: index % 2 === 0 ? tokens.blackToken : tokens.whiteToken, row, col },
    });
    expect(played.status()).toBe(201);
  }
  await context.close();
  return created.id;
}

test("a starred game is listed first on the Completed tab, and unstarred from its row", async ({ browser, baseURL }) => {
  const stamp = Date.now().toString(36);
  const me = { email: `starrer-${stamp}@example.test`, name: `Starrer ${stamp}` };
  const them = { email: `starred-${stamp}@example.test`, name: `Starred ${stamp}` };
  const stranger = { email: `stranger-${stamp}@example.test`, name: `Stranger ${stamp}` };
  await seedMember(me);
  await seedMember(them);
  await seedMember(stranger);
  try {
    const older = await finishedGame(browser, baseURL!, me, them);
    const newer = await finishedGame(browser, baseURL!, me, them);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // Nothing starred: the panel is there, empty, saying how a game gets into it; the newest game heads the list.
    await page.goto("/play?view=completed");
    await ready(page, "tabs");
    await expect(page.getByTestId("my-games-favourites-empty")).toBeVisible();
    await expect(page.getByTestId("my-games-finished").getByTestId("my-game").first()).toHaveAttribute("data-id", newer);

    // Starred on the older game's own page.
    await page.goto(`/games/gomoku/match/${older}`);
    const star = page.getByTestId("favourite-star");
    await expect(star).toHaveAttribute("aria-pressed", "false");
    const saved = page.waitForResponse((response) => response.url().endsWith(`/api/games/${older}/favourite`) && response.request().method() === "PUT");
    await star.click();
    expect((await saved).ok()).toBe(true);
    await expect(star).toHaveAttribute("aria-pressed", "true");

    // First on the Completed tab now, in the Starred panel above the newest game, and starred in the list too.
    await page.goto("/play?view=completed");
    await ready(page, "tabs");
    const panel = page.getByTestId("my-games-favourites");
    await expect(panel.getByTestId("my-game")).toHaveCount(1);
    await expect(panel.getByTestId("my-game").first()).toHaveAttribute("data-id", older);
    const box = await panel.boundingBox();
    const list = await page.getByTestId("my-games-finished").boundingBox();
    expect(box!.y).toBeLessThan(list!.y);
    await expect(page.locator(`[data-testid="my-games-finished"] [data-testid="my-game"][data-id="${older}"] [data-testid="favourite-star"]`)).toHaveAttribute("aria-pressed", "true");

    // Taken off from its row, and the panel is empty again.
    await panel.getByTestId("favourite-star").click();
    await expect(page.getByTestId("my-games-favourites-empty")).toBeVisible();
    await context.close();

    // Somebody who did not play it is offered no star, and the route refuses them.
    const theirs = await memberContext(browser, baseURL!, stranger);
    const looking = await theirs.newPage();
    await looking.goto(`/games/gomoku/match/${older}`);
    await ready(looking, "game-replay");
    await expect(looking.getByTestId("favourite-star")).toHaveCount(0);
    expect((await theirs.request.put(`/api/games/${older}/favourite`)).status()).toBe(404);
    await theirs.close();
  } finally {
    await removeMember(me.email);
    await removeMember(them.email);
    await removeMember(stranger.email);
  }
});
