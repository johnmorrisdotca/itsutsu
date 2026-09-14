import { expect, test, type Browser } from "@playwright/test";

import { memberContext, memberIdFor, removeMember, seatTokensFor, seedMember } from "./members";
import { aComputerOpponent, chooseOpponent, openMoreSettings, ready } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * A REMATCH'S HEADING FOLLOWS THE OPPONENT CHOSEN, WITHOUT A RELOAD.
 *
 * Choosing somebody else on a rematch made the notice under the heading say it
 * was a new game, while the heading above still read "Play them again" and "you
 * take White" — drawn from the address the page opened with — until a reload.
 * This drives both directions by clicking: away from the rematch to a computer
 * player, then back to the player from last time, and the document is the same
 * one throughout.
 *
 * Its own world: two members, the game they finished, and the rematch screen.
 */

async function playedOut(browser: Browser, baseURL: string, stamp: string) {
  const me = { email: `heading-${stamp}@example.test`, name: `Heading ${stamp}` };
  const them = { email: `heading-foe-${stamp}@example.test`, name: `Foe ${stamp}` };
  await seedMember(me);
  await seedMember(them);
  const context = await memberContext(browser, baseURL, me);

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

  // A challenge is an offer; the other player accepts it before either side can move.
  const theirs = await memberContext(browser, baseURL, them);
  const accepted = await theirs.request.post(`/api/games/${created.id}/offer/accept`, {});
  expect(accepted.status(), await accepted.text()).toBe(200);
  await theirs.close();

  const game = { id: created.id, ...(await seatTokensFor(created.id)) };
  for (const [index, [row, col]] of [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [0, 2],
  ].entries()) {
    const played = await context.request.post(`/api/games/${game.id}/moves`, {
      data: { token: index % 2 === 0 ? game.blackToken : game.whiteToken, row, col },
    });
    expect(played.status()).toBe(201);
  }
  return { context, me, them, game };
}

test("a rematch's heading follows the opponent chosen, away from the rematch and back, without a reload", async ({
  browser,
  baseURL,
}) => {
  const stamp = Date.now().toString(36);
  const { context, me, them, game } = await playedOut(browser, baseURL!, stamp);
  const page = await context.newPage();
  try {
    await page.goto(`/games/gomoku/match/${game.id}`);
    await page.getByRole("link", { name: /Play again as White/ }).click();
    await ready(page, "set-up-game");

    const title = page.getByTestId("set-up-title");
    await expect(title).toContainText(`Play ${them.name} again`);
    await expect(page.getByTestId("set-up-swap")).toHaveText("you take White");
    await page.evaluate(() => {
      (window as unknown as { headingMark?: string }).headingMark = "same document";
    });

    // Away: a computer player instead. The notice and the heading both say it is a new game.
    await openMoreSettings(page);
    const program = await aComputerOpponent(page);
    const programName = (await page
      .locator(`[data-testid="set-up-opponent"][data-opponent="${program}"]`)
      .getAttribute("data-name")) as string;
    await chooseOpponent(page, program);
    await expect(page.getByTestId("set-up-again")).toContainText("not a rematch");
    await expect(title).toContainText(`Against ${programName}`);
    await expect(title).not.toContainText("again");
    // The swapped colour is gone — asserted after the heading it sits under has been seen to change.
    await expect(page.getByTestId("set-up-swap")).toHaveCount(0);

    // And back: the player from last time, and it reads as a rematch again.
    const themId = await memberIdFor(them.email);
    await chooseOpponent(page, `m:${themId}`);
    await expect(title).toContainText(`Play ${them.name} again`);
    await expect(page.getByTestId("set-up-swap")).toHaveText("you take White");
    await expect(page.getByTestId("set-up-again")).not.toContainText("not a rematch");

    const mark = await page.evaluate(() => (window as unknown as { headingMark?: string }).headingMark);
    expect(mark, "the heading changed by reloading the page").toBe("same document");
  } finally {
    await context.close();
    await removeMember(me.email);
    await removeMember(them.email);
  }
});
