import { expect, test } from "@playwright/test";

/**
 * The phrases a slow game needs, one tap each.
 *
 * An emoji carries a mood; a game played a move a day needs sentences — that
 * you are going out, that you are not ignoring them, that the last move was a
 * slip. This walks a phrase the whole way: tapped in the live game, seen by
 * the other seat, and kept on the record afterwards against the move it was
 * sent at.
 */
test.describe("quick phrases", () => {
  async function seatedGame(request: import("@playwright/test").APIRequestContext) {
    const response = await request.post("/api/games/live", {
      data: { blackName: `Kaya ${Date.now().toString(36)}`, whiteName: "Sumi", size: 9 },
    });
    expect(response.status()).toBe(201);
    return response.json() as Promise<{ id: string; blackToken: string; whiteToken: string }>;
  }

  test("one tap sends the phrase, and the other seat sees it", async ({ browser, request }) => {
    const game = await seatedGame(request);
    const black = await (await browser.newContext()).newPage();
    const white = await (await browser.newContext()).newPage();
    await black.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await white.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);

    await expect(black.getByTestId("quick-phrases")).toBeVisible();
    await black.getByTestId("quick-phrase").filter({ hasText: "Hello, good luck" }).click();

    await expect(black.getByTestId("reaction-mine")).toContainText("Hello, good luck");
    await expect(white.getByTestId("reaction-theirs")).toContainText("Hello, good luck", {
      timeout: 10_000,
    });
  });

  test("does not cost you a message you were already typing", async ({ page, request }) => {
    const game = await seatedGame(request);
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);

    const box = page.getByTestId("reaction-text");
    await box.fill("half a thought");
    await page.getByTestId("quick-phrase").filter({ hasText: "No rush" }).click();

    await expect(page.getByTestId("reaction-mine")).toContainText("No rush");
    // The draft is still there: a quick phrase is its own message, not a
    // replacement for the one somebody was composing.
    await expect(box).toHaveValue("half a thought");
  });

  test("is kept on the record, against the move it was sent at", async ({ page, request }) => {
    const game = await seatedGame(request);
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await page.getByRole("button", { name: /^E5, empty$/ }).click();
    await expect(page.getByRole("button", { name: "E5, Black stone" })).toBeVisible();
    await page.getByTestId("quick-phrase").filter({ hasText: "Good game, thank you" }).click();
    await expect(page.getByTestId("reaction-mine")).toContainText("Good game, thank you");

    await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } });
    await page.goto(`/history/gomoku/${game.id}`);
    const talk = page.getByTestId("conversation");
    await expect(talk).toBeVisible();
    await expect(talk).toContainText("Good game, thank you");
    await expect(talk).toContainText("Move 1");
  });

  test("a spectator is offered none of them", async ({ page, request }) => {
    const game = await seatedGame(request);
    await page.goto(`/games/gomoku/${game.id}`);
    // Same rule as the emoji bar: only a seat holder may say anything.
    await expect(page.getByTestId("quick-phrases")).toHaveCount(0);
  });
});
