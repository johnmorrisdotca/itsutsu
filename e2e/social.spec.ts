import { expect, test } from "@playwright/test";
import { RATING_START, TIER_DISPLAY } from "../src/lib/rating/elo";
import { playerSlug } from "../src/lib/rating/playerKey";
import { removePlayedUnder } from "./members";
import { RATED_TO_SETTLE, playAt, playRatedGames } from "./support";
import { shownName } from "../src/lib/rating/shownName";

/** Starts a server-side game and returns its id and both seat tokens. */
async function startGame(
  request: import("@playwright/test").APIRequestContext,
  extra: Record<string, unknown> = {},
) {
  const response = await request.post("/api/games/live", {
    data: { blackName: "Kai", whiteName: "Mio", size: 9, ...extra },
  });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ id: string; blackToken: string; whiteToken: string }>;
}

test.describe("notes, messages, deadlines and players", () => {
  test("private notes stay in this browser, per game", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    const notes = page.getByTestId("game-notes");
    await notes.fill("Try the diagonal next time.");
    await page.reload();
    await expect(page.getByTestId("game-notes")).toHaveValue("Try the diagonal next time.");
    // A new game is a new note.
    await page.getByRole("button", { name: "New game" }).click();
    await expect(page.getByTestId("game-notes")).toHaveValue("");
  });

  test("a message rides along with an emoji and reaches the other side", async ({ browser, request }) => {
    const game = await startGame(request);
    const black = await (await browser.newContext()).newPage();
    const white = await (await browser.newContext()).newPage();
    await black.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await white.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);

    await white.getByTestId("reaction-text").fill("Take your time, no rush");
    await white.getByRole("button", { name: "Send Take your time" }).click();
    await expect(white.getByTestId("reaction-message")).toContainText("no rush");
    await expect(black.getByTestId("reaction-theirs")).toContainText("no rush", { timeout: 10_000 });
    await expect(black.getByTestId("reaction-log")).toContainText("no rush");
  });

  test("a shared game with a clock shows the deadline and refuses an early claim", async ({ browser, request }) => {
    const game = await startGame(request, { moveTimeMs: 5 * 60_000, timeoutPenalty: "turn" });
    const white = await (await browser.newContext()).newPage();
    await white.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);

    /*
     * The clock is stated inside the rules statement now (0.163.0): the board
     * no longer carries a settings form or its own clock line, because the
     * rules were agreed on the doorstep before the game was written.
     */
    await expect(white.getByTestId("rules-statement")).toContainText("5 minutes a move");
    await expect(white.getByTestId("deadline")).toContainText("Black must move by");
    await expect(white.getByTestId("claim-timeout")).toHaveCount(0);

    const early = await request.post(`/api/games/${game.id}/timeout`, {
      data: { token: game.whiteToken },
    });
    expect(early.status()).toBe(409);
    const body = (await early.json()) as { reason: string };
    expect(body.reason).toBe("not-due");

    // The mover cannot claim against themselves.
    const own = await request.post(`/api/games/${game.id}/timeout`, {
      data: { token: game.blackToken },
    });
    expect(own.status()).toBe(409);
  });

  test("a finished shared game between named players rates them and shows on their profiles", async ({ page, request }) => {
    const stamp = Date.now().toString(36);
    /*
     * Unique in the FIRST word, because that is what the site prints now — a
     * surname is not on display, so a fixture made unique with one could no
     * longer find itself in a list.
     */
    const black = `Sora${stamp} Tester`;
    const white = `Ren${stamp} Tester`;
    /*
     * Shared games, each given up by white. Only a shared game rates: a game
     * at one screen is filed and never rated, because the site cannot tell who
     * was really playing it.
     *
     * FOUR OF THEM, AND THE SPEC FOLLOWED THE RULE RATHER THAN THE OTHER WAY
     * ROUND. This asserted "1620" after one game, and since 0.157.0 one rated
     * game leaves a player `unrated` — `ratingShown` answers null for that
     * tier and the page prints a dash, deliberately, because a rating nobody
     * has earned is not a rating of 1600. So the number was right about the
     * arithmetic and wrong about whether the site should print it, and this
     * had been red on every fresh database. `elo.ts` decides how many games
     * settle a tier and `playRatedGames` plays that many.
     */
    await playRatedGames(request, { winner: black, loser: white });
    try {
      await page.goto(`/players/${playerSlug(black)}`);
      await expect(page.getByTestId("player-record")).toContainText(`${RATED_TO_SETTLE}W · 0L · 0D`);
      await expect(page.getByTestId("player-by-variant")).toContainText("Gomoku");
      /*
       * The rating, said the two ways the page says it: a number rather than a
       * dash, and the word that says the number is worth printing. Not the
       * exact figure — that follows from K, the rounding and the order of the
       * games, and a spec holding a copy of it fails the day any of the three
       * is tuned, which is how this case came to be red in the first place.
       * What IS asserted is the direction: the winner ends above where
       * everybody starts and the loser below, which is the claim this test's
       * name makes.
       */
      await expect(page.getByTestId("player-rating")).toHaveText(/^\d{4}$/);
      await expect(page.getByText(TIER_DISPLAY.provisional.label)).toBeVisible();
      const winner = Number((await page.getByTestId("player-rating").innerText()).trim());
      expect(winner, "winning four rated games did not put this player above the start").toBeGreaterThan(
        RATING_START,
      );

      await page.goto(`/players/${playerSlug(white)}`);
      await expect(page.getByTestId("player-record")).toContainText(`0W · ${RATED_TO_SETTLE}L · 0D`);
      await expect(page.getByTestId("player-rating")).toHaveText(/^\d{4}$/);
      await expect(page.getByText(TIER_DISPLAY.provisional.label)).toBeVisible();
      const loser = Number((await page.getByTestId("player-rating").innerText()).trim());
      expect(loser, "losing four rated games did not put this player below the start").toBeLessThan(
        RATING_START,
      );

      await page.goto("/players?view=ladder");
      /*
       * By the name the ladder PRINTS, which is the first one. The address still
       * carries the whole of it — that is what playerSlug uses above — but a list
       * shows a person by their first name now.
       */
      await expect(page.getByTestId("players-table")).toContainText(shownName(black));
    } finally {
      // The standings these names earned outlive the games; see removePlayedUnder.
      await removePlayedUnder([black, white]);
    }
  });

  test("a local game can still be played after the notes panel appears", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await playAt(page, 15, 7, 7);
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
  });
});
