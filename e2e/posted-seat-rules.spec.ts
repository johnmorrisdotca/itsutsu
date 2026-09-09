import { expect, test, type Page } from "@playwright/test";

import { boardSizesFor } from "../src/lib/gomoku/gomoku.constants";

/**
 * Changing the rules of a game nobody has answered yet.
 *
 * John posted an open seat, changed the board size while it was still
 * waiting, and the page crashed. The narrow bug is worth fixing; the gap
 * behind it is worth closing, and it is the one he named: this whole area —
 * who the opponent is, what board it is on, how far along the game is — is a
 * matrix, and no cell of it should ever produce a hard crash. A combination
 * that makes no sense should be refused or not offered, never thrown at.
 *
 * So these walk the matrix rather than the single report. Anything the panel
 * lets a player click, it has to survive.
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
  return (await started.json()) as Started;
}

/**
 * Every page error, collected. A React error boundary can swallow a throw and
 * leave a plausible-looking page behind, so asserting on what is visible is
 * not enough — the console and the page's own errors are the evidence.
 */
function watchForCrashes(page: Page): string[] {
  const crashes: string[] = [];
  page.on("pageerror", (error) => crashes.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    // Next prints its own dev overlay noise; a real throw shows up either way.
    if (text.includes("Failed to load resource")) return;
    crashes.push(`console: ${text}`);
  });
  return crashes;
}

/**
 * Opens the game as the player holding Black.
 *
 * The seat is claimed through /seat/<token>, which puts the credential in a
 * cookie and then redirects — a token in the address would be a seat anybody
 * could read over a shoulder. Without doing this the rules panel renders
 * read-only and there are no controls to break.
 */
async function openGame(page: Page, game: Started) {
  await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
  await expect(page.getByTestId("shared-rules")).toBeVisible();
  await expect(page.getByTestId("shared-rules-size")).toBeVisible();
}

test.describe("the rules panel on a game still waiting for somebody", () => {
  test("survives a board size change on a posted open seat", async ({ page }) => {
    /*
     * The exact report: create a game, post the seat for anyone to answer,
     * then change the board size while it is still waiting.
     */
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { size: 9, open: true });
    await openGame(page, game);

    const size = page.getByTestId("shared-rules-size");
    await expect(size).toBeVisible();
    await size.selectOption("15");

    // The page is still a page, the seat is still posted, and nothing threw.
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    expect(crashes, `changing the size crashed the page:\n${crashes.join("\n")}`).toEqual([]);
    await expect(size).toHaveValue("15");
  });

  test("survives every size the panel offers, on a posted seat", async ({ page }) => {
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { size: 9, open: true });
    await openGame(page, game);

    // Whatever the control offers, it has to survive being chosen.
    for (const option of boardSizesFor("freestyle")) {
      await page.getByTestId("shared-rules-size").selectOption(String(option));
      await expect(page.getByTestId("shared-rules")).toBeVisible();
      await expect(page.getByTestId("shared-rules-size")).toHaveValue(String(option));
    }
    expect(crashes, crashes.join("\n")).toEqual([]);
  });

  test("survives a size change on a game that was never posted", async ({ page }) => {
    // The same control, one state earlier: a seat kept for a named opponent.
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { size: 9, open: false, whiteName: "Aki" });
    await openGame(page, game);

    await page.getByTestId("shared-rules-size").selectOption("13");
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    expect(crashes, crashes.join("\n")).toEqual([]);
  });

  /**
   * The crash John reported, and the reason for it.
   *
   * The address names the game as well as the match — /games/reversi/<id> —
   * and either player may change the game until the first stone is down. So
   * the moment he did, the address named a game this one was no longer a game
   * of, and the board he was sitting at answered "there is no page at this
   * address". Nothing threw; the page 404ed itself out from under him, which
   * from a chair looks exactly like a crash.
   */
  test("keeps the player at the board when the game itself is changed", async ({ page }) => {
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { size: 15, open: true });
    await openGame(page, game);

    await page.getByTestId("shared-rules-variant").selectOption("reversi");

    // The address follows the game rather than stranding the player on the old name.
    await expect(page).toHaveURL(/\/games\/reversi\//);
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("nothing here");
    expect(crashes, crashes.join("\n")).toEqual([]);
  });

  test("carries the board with the game when the variant has one of its own", async ({ page }) => {
    /*
     * Reversi is 8x8 and nothing else. Switching a posted 15x15 game to it
     * has to take the board along, or the row and the board disagree — and
     * the size control is then showing a size the game is not played on.
     */
    const crashes = watchForCrashes(page);
    const game = await startGame(page.request, { size: 15, open: true });
    await openGame(page, game);

    await page.getByTestId("shared-rules-variant").selectOption("reversi");
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    await expect(page.getByTestId("shared-rules-size")).toHaveValue("8");
    expect(crashes, crashes.join("\n")).toEqual([]);
  });
});
