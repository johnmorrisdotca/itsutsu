import { expect, test } from "@playwright/test";

import { openAdvanced, openSetup, playAt } from "./support";

/** The match id in a /games/gomoku/<id>/<move> address. */
const MATCH = /\/games\/gomoku\/match\/([A-Za-z0-9_-]+)\/(\d+)$/;

test.describe("a game at one screen is a match from its first stone", () => {
  test("gets an address, keeps it across a reload, and takes moves back on the server", async ({ page, request }) => {
    await page.goto("/games/gomoku/play");
    await page.getByRole("button", { name: "New game" }).click();
    await expect(page).toHaveURL(/\/games\/gomoku\/play$/);

    await playAt(page, 15, 7, 7);
    await expect(page).toHaveURL(MATCH);
    const id = page.url().match(MATCH)![1];
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${id}/1$`));

    await playAt(page, 15, 7, 8);
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${id}/2$`));
    await expect
      .poll(async () => ((await (await request.get(`/api/games/${id}`)).json()) as { moveCount: number }).moveCount)
      .toBe(2);

    // Stepping back in the record names the position; the record keeps every move.
    const record = page.getByTestId("move-history");
    await record.getByRole("button").first().click();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${id}/1$`));
    await expect(record.getByRole("button")).toHaveCount(2);
    await page.getByTestId("return-to-latest").click();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${id}/2$`));

    // Undo, then a different stone: the server's record follows the new line.
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${id}/1$`));
    await playAt(page, 15, 8, 8);
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${id}/2$`));
    await expect
      .poll(async () => {
        const game = (await (await request.get(`/api/games/${id}`)).json()) as {
          moves: { row: number; col: number }[];
        };
        return game.moves.map((move) => `${move.row},${move.col}`).join(" ");
      })
      .toBe("7,7 8,8");

    // A fork starts a new game at a chosen position, with the moves copied in.
    const forked = await request.post("/api/games/live", { data: { from: { id, move: 1 } } });
    expect(forked.status()).toBe(201);
    const fork = (await forked.json()) as { id: string };
    const copy = (await (await request.get(`/api/games/${fork.id}`)).json()) as { moveCount: number; moves: { row: number; col: number }[] };
    expect(copy.moveCount).toBe(1);
    expect(copy.moves[0]).toMatchObject({ row: 7, col: 7 });

    // The address is the game: opening it again finds the board, at the move named.
    await page.goto(`/games/gomoku/match/${id}/1`);
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^J9, empty$/ })).toBeVisible();
    await expect(page.getByTestId("move-history").getByRole("button")).toHaveCount(2);
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${id}/1$`));
  });

  test("a game that may be resized stays in the browser and has no address", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await page.getByRole("button", { name: "New game" }).click();
    await openSetup(page);
    await openAdvanced(page);
    await page.getByLabel("Allow resizing the board").check();
    await playAt(page, 15, 7, 7);
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(/\/games\/gomoku\/play$/);
  });
});
