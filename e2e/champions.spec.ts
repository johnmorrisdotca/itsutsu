import { expect, test } from "@playwright/test";

import { TIER_DISPLAY } from "../src/lib/rating/elo";
import { playerSlug } from "../src/lib/rating/playerKey";
import { removePlayedUnder } from "./members";
import { RATED_TO_SETTLE, playRatedGames } from "./support";

test.describe("champions", () => {
  test("every game has a line, and a rated game puts its players on that game's ladder", async ({ page, request }) => {
    const stamp = Date.now().toString(36);
    const black = `Hana ${stamp}`;
    const white = `Taro ${stamp}`;
    /*
     * Shared games, each given up by white: the one kind of finish that moves
     * a game's own ladder. FOUR of them, because one leaves both players
     * `unrated` and a page shows a dash for a rating that is not worth
     * printing yet — so the numbers read below were `NaN` and this has been
     * red on every fresh database since 0.157.0. The rule is deliberate and
     * stands; the spec plays as many games as the rule asks for. See
     * `playRatedGames`, which carries the reasoning.
     */
    await playRatedGames(request, { winner: black, loser: white });
    try {
      await page.goto("/champions");
      await expect(page.getByTestId("champions")).toBeVisible();
      // Every game is listed, played or not.
      await expect(page.getByTestId("champion-row-notakto")).toBeVisible();
      await expect(page.getByTestId("champion-row-freestyle")).not.toContainText("No rated games yet");

      await page.getByTestId("champion-row-freestyle").getByRole("link", { name: /^Gomoku/ }).click();
      // A game's own ladder is a facet of the game: /games/<slug>/standings.
      await expect(page).toHaveURL(/\/games\/gomoku\/standings$/);
      /*
       * The ladder itself is only checked for having a ladder in it. Neither of
       * these two is looked for by name here, and that is deliberate: the page
       * shows the top fifty, everybody with one win ties on rating and on games
       * played, and the order among a tie is the database's to choose. Asserting
       * a particular newcomer is among the first fifty of them is asserting
       * something the page never promised, and it passes or fails depending on
       * how many games somebody happened to play before this test ran.
       */
      const table = page.getByTestId("standings-table");
      await expect(table.locator("tbody tr").first()).toBeVisible();

      // What the ladder is built from, read where it is certain: each player's
      // own page, which holds every standing they have.
      await page.goto(`/players/${playerSlug(white)}`);
      await expect(page.getByTestId("player-by-variant")).toContainText("Gomoku");
      await expect(page.getByTestId("player-record")).toContainText(`0W · ${RATED_TO_SETTLE}L · 0D`);
      /*
       * A NUMBER, asserted as one before it is read as one. `Number("—")` is
       * NaN and every comparison against NaN is false, so reading the cell and
       * comparing would have said "the winner is not above the loser" whatever
       * the site did — a failure about the rating system wearing a failure
       * about a dash. The tier word beside it is the other half: it is what
       * says the number is worth printing at all.
       */
      await expect(page.getByTestId("player-rating")).toHaveText(/^\d{4}$/);
      await expect(page.getByText(TIER_DISPLAY.provisional.label)).toBeVisible();
      const loserRating = Number((await page.getByTestId("player-rating").innerText()).trim());

      await page.goto(`/players/${playerSlug(black)}`);
      await expect(page.getByTestId("player-by-variant")).toContainText("Gomoku");
      await expect(page.getByTestId("player-record")).toContainText(`${RATED_TO_SETTLE}W · 0L · 0D`);
      await expect(page.getByTestId("player-rating")).toHaveText(/^\d{4}$/);
      await expect(page.getByText(TIER_DISPLAY.provisional.label)).toBeVisible();
      const winnerRating = Number((await page.getByTestId("player-rating").innerText()).trim());

      // Winning a rated game puts you above the person you beat.
      expect(winnerRating).toBeGreaterThan(loserRating);
    } finally {
      // The standings these names earned outlive the games; see removePlayedUnder.
      await removePlayedUnder([black, white]);
    }
  });

  test("a game's page names its family, and a game that does not exist is not found", async ({ page }) => {
    await page.goto("/games/toroidal-five/standings");
    await expect(page.getByTestId("game-champions")).toBeVisible();
    await expect(page.getByTestId("sibling-champions")).toContainText("Obstacle");
    const missing = await page.goto("/games/no-such-game/standings");
    expect(missing?.status()).toBe(404);
  });

  test("the players page leads to the champions", async ({ page }) => {
    // The pointer sits with the site ladder, which is the thing it qualifies:
    // a rating here is across every game, and that is not what somebody who
    // wants the best Reversi player is asking.
    await page.goto("/players?view=ladder");
    await page.getByTestId("champions-link").click();
    await expect(page).toHaveURL(/\/champions$/);
  });
});
