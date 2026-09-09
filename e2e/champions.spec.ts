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
    // The ladder shows the top fifty, so the winner is on it: a win puts you
    // above everybody who has only lost. The loser may be below the cut on a
    // busy board, which is why their standing is read from their own page
    // rather than from a list that was never promised to hold everybody.
    const table = page.getByTestId("standings-table");
    await expect(table).toContainText(black);

    await page.goto(`/players/${playerSlug(white)}`);
    const byVariant = page.getByTestId("player-by-variant");
    await expect(byVariant).toContainText("Gomoku");
    // Rated, and the loss is against their name.
    await expect(page.getByTestId("player-record")).toContainText("1");
    // A loss leaves you below where you started, and the winner above.
    const loserRating = Number((await page.getByTestId("player-rating").innerText()).trim());
    await page.goto(`/players/${playerSlug(black)}`);
    const winnerRating = Number((await page.getByTestId("player-rating").innerText()).trim());
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
    await page.goto("/players");
    await page.getByTestId("champions-link").click();
    await expect(page).toHaveURL(/\/champions$/);
  });
});
