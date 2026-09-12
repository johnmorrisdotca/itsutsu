import { expect, test, type Page } from "@playwright/test";

import { openBoardRules, watchForCrashes } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * THE RULES OF A GAME NOBODY HAS ANSWERED YET.
 *
 * John posted an open seat, changed the board size while it was still waiting,
 * and the page crashed. The narrow bug was worth fixing; the gap behind it was
 * the one he named — who the opponent is, what board it is on, how far along the
 * game is, is a matrix, and no cell of it should ever produce a hard crash.
 *
 * WHAT HAS CHANGED SINCE, AND WHY THIS FILE READS DIFFERENTLY NOW. These cases
 * used to walk that matrix by clicking the panel's own controls. There are none:
 * every game is agreed on the doorstep before it is written, and a board does not
 * re-offer its rules — the same sentence of John's that asked for the doorstep
 * asked for this ("we do not want to see that Game board with all the settings on
 * the side"). So the panel is a statement at every stage, including this one.
 *
 * The cases are kept rather than deleted, because the two things they really
 * guarded still need guarding and neither is about a select:
 *
 *  - THE PAGE SURVIVES A GAME WHOSE RULES MOVE UNDER IT. The rules can still
 *    change — the settings route allows it while nobody else is in the game — so
 *    the board still has to cope with the game it is about becoming another one.
 *    Driven through the route now, which is the only door left.
 *  - THE ADDRESS FOLLOWS THE GAME. /games/reversi/<id> stops naming the game the
 *    moment somebody changes it, and this page used to answer "there is nothing
 *    here" about the board its own player was sitting at.
 */

type Started = { id: string; blackToken: string };

/** A live game in whatever state the case under test needs. */
async function startGame(
  request: Page["request"],
  data: Record<string, unknown>,
): Promise<Started> {
  const started = await request.post("/api/games/live", {
    data: { blackName: "Poster", whiteName: "", size: 9, ...data },
  });
  expect(started.status(), await started.text()).toBe(201);
  const game = (await started.json()) as Started;
  tidyAway(game.id);
  return game;
}

/**
 * Opens the game as the player holding Black.
 *
 * The seat is claimed through /seat/<token>, which puts the credential in a
 * cookie and then redirects — a token in the address would be a seat anybody
 * could read over a shoulder.
 */
async function openGame(page: Page, game: Started) {
  await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
  await expect(page.getByTestId("shared-rules")).toBeVisible();
}

/** Changes a waiting game's rules the only way left: at the route. */
async function change(request: Page["request"], game: Started, data: Record<string, unknown>) {
  const response = await request.put(`/api/games/${game.id}/settings`, {
    data: {
      token: game.blackToken,
      variant: "freestyle",
      size: 9,
      obstacles: "none",
      opening: "free",
      moveTimeMs: null,
      timeoutPenalty: "turn",
      drawLimit: "none",
      clockMode: "move",
      rated: true,
      allowResign: true,
      open: true,
      handicap: null,
      ...data,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
}

test.describe("the rules panel on a game still waiting for somebody", () => {
  test("states the rules rather than offering them", async ({ page }) => {
    /*
     * The window this closes: a posted seat whose creator could still change the
     * board, the clock or the game itself from the board it was being played on.
     * The doorstep is where those are settled, and a board with no stones on it
     * can be cancelled and set up again, which is a cheaper answer than a window
     * in which two people can disagree about what they agreed to.
     */
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { size: 9, open: true });
    await openGame(page, game);

    await openBoardRules(page);
    for (const control of ["shared-rules-size", "shared-rules-variant", "shared-rules-opening"]) {
      await expect(page.getByTestId(control), control).toHaveCount(0);
    }
    await expect(page.getByTestId("shared-open-line")).toContainText("posted");
    expect(crashes, crashes.join("\n")).toEqual([]);
  });

  test("survives every size the game has, whoever wrote it", async ({ page }) => {
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { size: 9, open: true });

    for (const size of [9, 13, 15, 19]) {
      await change(page.request, game, { size });
      await openGame(page, game);
      await expect(page.getByTestId("shared-rules-line")).toContainText(`${size}×${size}`);
      await expect(page.getByTestId("shared-rules")).toBeVisible();
    }
    expect(crashes, crashes.join("\n")).toEqual([]);
  });

  /**
   * The crash John reported, and the reason for it.
   *
   * The address names the game as well as the match — /games/reversi/<id> — and
   * the rules of a game nobody has answered can still change. So the moment they
   * did, the address named a game this one was no longer a game of, and the board
   * he was sitting at answered "there is no page at this address". Nothing threw;
   * the page 404ed itself out from under him, which from a chair looks exactly
   * like a crash.
   */
  test("keeps the player at the board when the game itself is changed", async ({ page }) => {
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { size: 15, open: true });
    await openGame(page, game);

    await change(page.request, game, { variant: "reversi", size: 8 });
    await page.goto(`/games/gomoku/match/${game.id}`);

    // The address follows the game rather than stranding the player on the old name.
    await expect(page).toHaveURL(/\/games\/reversi\//);
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("nothing here");
    expect(crashes, crashes.join("\n")).toEqual([]);
  });

  test("carries the board with the game when the variant has one of its own", async ({ page }) => {
    /*
     * Reversi is 8×8 and nothing else. A posted 15×15 game switched to it has to
     * take the board along, or the row and the board disagree — and the line above
     * the fold is then describing a board nobody can see.
     */
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { size: 15, open: true });
    await change(page.request, game, { variant: "reversi", size: 15 });

    await page.goto(`/games/reversi/match/${game.id}`);
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    await expect(page.getByTestId("shared-rules-line")).toContainText("8×8");
    expect(crashes, crashes.join("\n")).toEqual([]);
  });
});
