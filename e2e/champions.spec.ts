import { expect, test } from "@playwright/test";

import { playerSlug } from "../src/lib/rating/playerKey";

test.describe("champions", () => {
  test("every game has a line, and a rated game puts its players on that game's ladder", async ({ page, request }) => {
    const stamp = Date.now().toString(36);
    const black = `Hana ${stamp}`;
    const white = `Taro ${stamp}`;
    // A shared game, ended by resignation: the one kind of finish that moves a game's own ladder.
    const started = await request.post("/api/games/live", {
      data: { blackName: black, whiteName: white, size: 9, variant: "freestyle" },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; whiteToken: string };
    expect((await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status()).toBe(200);

    await page.goto("/champions");
    await expect(page.getByTestId("champions")).toBeVisible();
    // Every game is listed, played or not.
    await expect(page.getByTestId("champion-row-notakto")).toBeVisible();
    await expect(page.getByTestId("champion-row-freestyle")).not.toContainText("No rated games yet");

    await page.getByTestId("champion-row-freestyle").getByRole("link", { name: /^Gomoku/ }).click();
    await expect(page).toHaveURL(/\/champions\/gomoku$/);
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
    await expect(page.getByTestId("player-record")).toContainText("0W · 1L · 0D");
    const loserRating = Number((await page.getByTestId("player-rating").innerText()).trim());

    await page.goto(`/players/${playerSlug(black)}`);
    await expect(page.getByTestId("player-by-variant")).toContainText("Gomoku");
    await expect(page.getByTestId("player-record")).toContainText("1W · 0L · 0D");
    const winnerRating = Number((await page.getByTestId("player-rating").innerText()).trim());

    // Winning a rated game puts you above the person you beat.
    expect(winnerRating).toBeGreaterThan(loserRating);
  });

  test("a game's page names its family, and a game that does not exist is not found", async ({ page }) => {
    await page.goto("/champions/toroidal-five");
    await expect(page.getByTestId("game-champions")).toBeVisible();
    await expect(page.getByTestId("sibling-champions")).toContainText("Obstacle");
    const missing = await page.goto("/champions/no-such-game");
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
