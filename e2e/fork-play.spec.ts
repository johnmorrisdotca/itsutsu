import { expect, test } from "@playwright/test";
import type { Browser } from "@playwright/test";

import { memberContext, removeMember, seatTokensFor, seedMember } from "./members";
import { ready } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * PLAY FROM MOVE N, FOLLOWED ALL THE WAY. John, 2026-09-25: "Play from Move 5
 * button - not sure what it does - might not work well - needs some more
 * testing and might be Advanced Options perhaps at the bottom?"
 *
 * `fork-visibility.spec.ts` says when it is offered. This says what it DOES,
 * by doing it the way a player would: scrub a finished game back to move 3,
 * open Advanced under the record, press Play from move 3, see the set-up
 * screen draw those three stones and name the other player, start it, and land
 * on a new game holding exactly those three moves, offered to the same person,
 * with the forker's own colour back.
 */

/** A finished game between two members of this file, "me" as black, won on the top row in five moves. */
async function finishedGame(browser: Browser, baseURL: string, me: { email: string; name: string }, them: { email: string; name: string }) {
  const context = await memberContext(browser, baseURL, me);
  const made = await context.request.post("/api/games/live", {
    data: { challenge: them.email, variant: "freestyle", size: 9, winLength: 3 },
  });
  expect(made.status(), await made.text()).toBe(201);
  const created = (await made.json()) as { id: string };
  tidyAway(created.id);
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
  return { context, id: created.id };
}

test("Play from move 3, under Advanced, starts a new game at that position against the same player", async ({ browser, baseURL }) => {
  const stamp = Date.now().toString(36);
  const me = { email: `forkplay-${stamp}@example.test`, name: `Forkplay ${stamp}` };
  const them = { email: `forkpair-${stamp}@example.test`, name: `Forkpair ${stamp}` };
  await seedMember(me);
  await seedMember(them);
  const { context, id } = await finishedGame(browser, baseURL!, me, them);
  try {
    const page = await context.newPage();
    await page.goto(`/games/gomoku/match/${id}`);
    await ready(page, "game-replay");
    const scrubber = page.getByTestId("replay-scrubber");
    await expect(scrubber).toHaveValue("5");

    // Under Advanced, folded, at the bottom. At the end of the game it says how to get a position to play from.
    const advanced = page.getByTestId("replay-advanced");
    await advanced.getByText("Advanced").click();
    await expect(advanced.getByTestId("replay-advanced-hint")).toBeVisible();
    await expect(advanced.getByRole("link", { name: /Play from move/ })).toHaveCount(0);

    // Scrubbed back to move 3, it offers exactly that.
    await scrubber.press("ArrowLeft");
    await scrubber.press("ArrowLeft");
    await expect(scrubber).toHaveValue("3");
    const fork = advanced.getByRole("link", { name: /Play from move 3/ });
    await expect(fork).toBeVisible();
    await fork.click();

    // The set-up screen: this game, the three stones on its preview, and the same opponent.
    await ready(page, "set-up-game");
    await expect(page).toHaveURL(/\/games\/gomoku\/new\?/);
    await expect(page.getByTestId("board-preview").locator('button[aria-label$=" stone"]')).toHaveCount(3);
    await expect(page.getByTestId("set-up-game")).toContainText(them.name);
    // The board and the opening come with the position, so neither is offered as a choice.
    await expect(page.getByTestId("shared-rules-size")).toHaveCount(0);
    await expect(page.getByTestId("shared-rules-opening")).toHaveCount(0);

    await page.getByTestId("set-up-start").click();
    await page.waitForURL(/\/games\/gomoku\/match\/[^/?]+/);
    const forked = new URL(page.url()).pathname.split("/")[4]!;
    expect(forked).not.toBe(id);
    tidyAway(forked);

    // The new game: those three moves and no more, offered to the same person, the forker black again.
    const read = await context.request.get(`/api/games/${forked}`);
    expect(read.status(), await read.text()).toBe(200);
    const game = (await read.json()) as { moves: { row: number; col: number }[]; blackName: string; whiteName: string; status: string };
    expect(game.moves.map((move) => [move.row, move.col])).toEqual([[0, 0], [1, 0], [0, 1]]);
    expect(game.blackName).toBe(me.name);
    expect(game.whiteName).toBe(them.name);
  } finally {
    await context.close();
    await removeMember(me.email);
    await removeMember(them.email);
  }
});
