import { expect, test } from "@playwright/test";

/** Starts a server-side game and returns its id and both seat tokens. */
async function startGame(request: import("@playwright/test").APIRequestContext) {
  const response = await request.post("/api/games/live", {
    data: { blackName: "Kai", whiteName: "Mio", size: 9 },
  });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{
    id: string;
    blackToken: string;
    whiteToken: string;
  }>;
}

test.describe("a game played from two devices", () => {
  test("each seat link plays its own colour, and the other side sees it", async ({
    browser,
    request,
  }) => {
    const game = await startGame(request);

    const black = await browser.newContext();
    const white = await browser.newContext();
    const blackPage = await black.newPage();
    const whitePage = await white.newPage();

    await blackPage.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await whitePage.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);

    await expect(blackPage.getByTestId("turn-banner")).toContainText("Your move");
    await expect(whitePage.getByTestId("turn-banner")).toContainText("Waiting");

    await blackPage.getByRole("button", { name: /^E5, empty$/ }).click();
    await expect(blackPage.getByTestId("turn-banner")).toContainText("Waiting");

    // White's board catches up on its own, without a reload.
    await expect(whitePage.getByRole("button", { name: "E5, Black stone" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(whitePage.getByTestId("turn-banner")).toContainText("Your move");

    await black.close();
    await white.close();
  });

  test("a seat link claims the seat and leaves the token out of the address", async ({
    page,
    request,
  }) => {
    const game = await startGame(request);
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);

    // The claim is in a cookie now; the bar shows the match and nothing secret.
    await expect(page).toHaveURL(/\/games\/gomoku\/[a-z0-9]+\/0$/);
    expect(page.url()).not.toContain(game.blackToken);
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");

    // And it holds across a plain visit to the match.
    await page.goto(`/games/gomoku/${game.id}`);
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");
  });

  test("a seat link with a token that fits no seat is not a page", async ({ page, request }) => {
    const game = await startGame(request);
    const response = await page.goto(`/games/gomoku/${game.id}/seat/not-a-token`);
    expect(response?.status()).toBe(404);
  });

  test("a seat link shows both invitations with QR codes", async ({ page, request }) => {
    const game = await startGame(request);
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);

    await expect(page.getByRole("img", { name: /QR code for the Black seat/ })).toBeVisible();
    await expect(page.getByRole("img", { name: /QR code for the White seat/ })).toBeVisible();
  });

  test("someone without a token can watch but not play", async ({ page, request }) => {
    const game = await startGame(request);
    await page.goto(`/games/gomoku/${game.id}`);

    await expect(page.getByText(/You are watching\./).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^E5, empty$/ })).toBeDisabled();
    // And is never shown the seat links.
    await expect(page.getByRole("img", { name: /QR code/ })).toHaveCount(0);
  });

  test("the server refuses a move played out of turn", async ({ request }) => {
    const game = await startGame(request);

    const first = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(first.status()).toBe(201);

    const outOfTurn = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 0, col: 0 },
    });
    expect(outOfTurn.status()).toBe(409);
    expect((await outOfTurn.json()).reason).toBe("not-your-turn");
  });

  test("starting a shared game from the board lands on the match", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.getByTestId("start-shared-game").click();

    // The match, with its move count on the end: a fresh board is position 0.
    await expect(page).toHaveURL(/\/games\/gomoku\/[a-z0-9]+\/0$/);
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");
  });
});
