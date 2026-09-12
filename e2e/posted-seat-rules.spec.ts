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
 *  - THE PAGE SURVIVES A GAME WHOSE RULES MOVE UNDER IT. Most rules can still
 *    change — the settings route allows it while nobody else is in the game — so
 *    the board still has to cope with what it is about being adjusted under it.
 *    Driven through the route now, which is the only door left.
 *  - AN ADDRESS UNDER A NAME THE GAME DOES NOT HAVE STILL LEADS TO THE GAME.
 *    /games/gomoku/match/<id> of a game of Reversi used to answer "there is
 *    nothing here" about a board its own player was sitting at.
 *
 * AND ONE RULE IS NOT A RULE, WHICH IS WHAT THIS FILE NOW ALSO GUARDS. The game
 * is in the address. Everything else about a game nobody has answered may still
 * be fixed — the clock, the board, the opening, the pace, the ratings — and the
 * variant may not, because moving it turns every link, seat token and history
 * row carrying that name into a pointer at a game which is not there. The route
 * answers 409 `different-game`; see `changesTheGame` in `liveGameSettings.ts`.
 *
 * The redirect one line above is what mends the links ALREADY in the wild, and
 * it is a repair rather than a licence — which is why both are asserted here, in
 * the same file, and neither stands in for the other.
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

/**
 * Asks the route to change a waiting game's rules — the only door left.
 *
 * Returns the response rather than asserting on it, because this file now has
 * cases either side of the answer: a refusal that refuses everything is not a
 * rule, so the allowed changes and the refused one go through one helper and
 * each case says which it expects.
 */
async function ask(request: Page["request"], game: Started, data: Record<string, unknown>) {
  return request.put(`/api/games/${game.id}/settings`, {
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
}

/** The same, for a change that is meant to go through. */
async function change(request: Page["request"], game: Started, data: Record<string, unknown>) {
  const response = await ask(request, game, data);
  expect(response.status(), await response.text()).toBe(200);
}

/** What the row says now, read back through the API rather than assumed. */
async function stored(request: Page["request"], id: string) {
  const response = await request.get(`/api/games/${id}`);
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as { variant: string; size: number; moveTimeMs: number | null };
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
   * THE GAME IS THE ONE RULE THAT MAY NOT MOVE, AND THIS IS WHY.
   *
   * The crash John reported was the symptom: /games/gomoku/match/<id> named the
   * game as well as the match, somebody changed the game, and the board he was
   * sitting at answered "there is no page at this address". Nothing threw; the
   * page 404ed itself out from under him, which from a chair looks exactly like
   * a crash.
   *
   * The page was mended by following the game (the case below). The address was
   * not, and could not be: a seat link somebody wrote down, a history row
   * somebody quoted and anybody's idea of what they were invited to all keep the
   * old name, and no redirect reaches those. So the change itself is refused, and
   * refused HERE rather than by hiding a control — the panel stopped offering one
   * in 0.163.0 and the route went on accepting it, which is how the seat links
   * went wrong once already.
   */
  test("refuses to change the game, so the address cannot be made to lie", async ({ page }) => {
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { size: 15, open: true });
    await openGame(page, game);

    const refused = await ask(page.request, game, { variant: "reversi", size: 8 });
    expect(refused.status(), await refused.text()).toBe(409);
    expect(((await refused.json()) as { reason?: string }).reason).toBe("different-game");

    // Nothing was written: the game is what its address says, still.
    expect((await stored(page.request, game.id)).variant).toBe("freestyle");
    await page.goto(`/games/gomoku/match/${game.id}`);
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${game.id}`));
    await expect(page.getByTestId("shared-rules-line")).toContainText("15×15");
    expect(crashes, crashes.join("\n")).toEqual([]);
  });

  test("and the clock can still be fixed, because that is not in the address", async ({ page }) => {
    /*
     * The other half, and the half that makes the refusal above a rule rather
     * than a locked door. A posted seat is genuinely still being set up, so the
     * person setting it up can still put a clock on it — and the board says so.
     */
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { size: 9, open: true });
    await change(page.request, game, { moveTimeMs: 300_000 });
    expect((await stored(page.request, game.id)).moveTimeMs).toBe(300_000);

    await openGame(page, game);
    await openBoardRules(page);
    await expect(page.getByTestId("more-settings-summary")).toContainText("5 minutes a move");
    // And it is still the game the address names.
    await expect(page.getByTestId("shared-rules-line")).toContainText("Gomoku");
    expect(crashes, crashes.join("\n")).toEqual([]);
  });

  test("still leads to the game from an address under a name it does not have", async ({ page }) => {
    /*
     * The repair for the links already in the wild, kept because it is what
     * stops the 404 above — and no longer reachable by changing a game, so it is
     * driven the way a reader reaches it: a link carrying the wrong name. The id
     * is the identity; the slug is how the address reads.
     */
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { variant: "reversi", size: 8, open: true });

    await page.goto(`/games/gomoku/match/${game.id}`);
    await expect(page).toHaveURL(/\/games\/reversi\/match\//);
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("nothing here");
    expect(crashes, crashes.join("\n")).toEqual([]);
  });

  test("carries the board the game has, whatever board is asked for", async ({ page }) => {
    /*
     * Reversi is 8×8 and nothing else. A posted game of it asked for 15×15 keeps
     * the board its rules give it, or the row and the board disagree — and the
     * line above the fold is then describing a board nobody can see.
     *
     * This used to switch a 15×15 Gomoku game TO Reversi, which is the move the
     * case above now refuses. The lesson is the same one and it is the game's,
     * not the switch's: a game the rules decide is not a game a request may
     * argue with.
     */
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { variant: "reversi", size: 8, open: true });
    await change(page.request, game, { variant: "reversi", size: 15 });
    expect((await stored(page.request, game.id)).size).toBe(8);

    await page.goto(`/games/reversi/match/${game.id}`);
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    await expect(page.getByTestId("shared-rules-line")).toContainText("8×8");
    expect(crashes, crashes.join("\n")).toEqual([]);
  });
});
