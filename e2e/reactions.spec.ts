import { expect, test } from "@playwright/test";

/** Starts a server-side game and returns its id and both seat tokens. */
async function startGame(request: import("@playwright/test").APIRequestContext) {
  const response = await request.post("/api/games/live", {
    data: { blackName: "Kai", whiteName: "Mio", size: 9 },
  });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ id: string; blackToken: string; whiteToken: string }>;
}

test.describe("reactions between the two players", () => {
  test("an emoji sent from one seat reaches the other within a poll", async ({
    browser,
    request,
  }) => {
    const game = await startGame(request);
    const black = await (await browser.newContext()).newPage();
    const white = await (await browser.newContext()).newPage();
    await black.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await white.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);

    await black.getByRole("button", { name: /^E5, empty$/ }).click();
    // White reacts to the move once its own poll has shown it.
    await expect(white.getByRole("button", { name: "E5, Black stone" })).toBeVisible({
      timeout: 10_000,
    });
    await white.getByRole("button", { name: "Send Nice move" }).click();

    // The sender sees it at once, marked as theirs.
    await expect(white.getByTestId("reaction-mine")).toContainText("👏");
    await expect(white.getByTestId("reaction-mine")).toContainText("move 1");
    // The other side sees it on the next poll, marked as the opponent's.
    await expect(black.getByTestId("reaction-theirs")).toContainText("👏", { timeout: 10_000 });
    await expect(black.getByTestId("reaction-log")).toContainText("👏");
  });

  test("a spectator has no reaction bar, and a bad emoji is refused", async ({
    page,
    request,
  }) => {
    const game = await startGame(request);
    await page.goto(`/games/gomoku/match/${game.id}`);
    await expect(page.getByTestId("reaction-bar")).toHaveCount(0);

    const refused = await request.post(`/api/games/${game.id}/reactions`, {
      data: { token: game.blackToken, emoji: "💩", moveNumber: null },
    });
    expect(refused.status()).toBe(400);

    const wrongSeat = await request.post(`/api/games/${game.id}/reactions`, {
      data: { token: "not-a-seat", emoji: "👏", moveNumber: null },
    });
    expect(wrongSeat.status()).toBe(403);

    const unplayed = await request.post(`/api/games/${game.id}/reactions`, {
      data: { token: game.blackToken, emoji: "👏", moveNumber: 3 },
    });
    expect(unplayed.status()).toBe(422);
  });
});
