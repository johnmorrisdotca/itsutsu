import { expect, test } from "@playwright/test";

/** Starts a server-side game and returns its id and both seat tokens. */
async function startGame(request: import("@playwright/test").APIRequestContext) {
  const response = await request.post("/api/games/live", {
    data: { blackName: "Kai", whiteName: "Mio", size: 9 },
  });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ id: string; blackToken: string; whiteToken: string }>;
}

test.describe("your games", () => {
  test("a claimed seat shows in the queue, and moves between its groups", async ({
    browser,
    request,
  }) => {
    const game = await startGame(request);
    const black = await browser.newContext({ storageState: ".auth/admin.json" });
    const white = await browser.newContext({ storageState: ".auth/admin.json" });
    const blackPage = await black.newPage();
    const whitePage = await white.newPage();
    await blackPage.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await whitePage.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);

    // Nobody has moved: not started, for both.
    await blackPage.goto("/games");
    await expect(blackPage.getByTestId("my-games-unstarted")).toContainText("Kai");
    await expect(blackPage.getByTestId("your-turn-badge")).toHaveCount(0);

    // Black plays; now it is white's move, and white's badge says so.
    await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
    await blackPage.goto("/games");
    await expect(blackPage.getByTestId("my-games-theirMove")).toContainText("Kai");
    await whitePage.goto("/games");
    await expect(whitePage.getByTestId("my-games-yourMove")).toContainText("Mio");
    await expect(whitePage.getByTestId("your-turn-badge")).toHaveText("1");

    await black.close();
    await white.close();
  });

  test("a game can be resigned from the queue, and is then filed", async ({ browser, request }) => {
    const game = await startGame(request);
    await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
    const white = await browser.newContext({ storageState: ".auth/admin.json" });
    const page = await white.newPage();
    await page.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);
    await page.goto("/games");

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByTestId("my-games-yourMove").getByTestId("resign").click();
    await expect(page.getByTestId("my-games-finished")).toContainText("Kai");

    // Black won by resignation, and the record says so.
    const detail = await request.get(`/api/games/${game.id}`);
    expect((await detail.json()).winner).toBe("black");
    await page.goto(`/games/gomoku/${game.id}`);
    await expect(page).toHaveURL(new RegExp(`/history/gomoku/${game.id}`));
    await white.close();
  });

  test("resigning needs a seat: the wrong token is refused, and so is none", async ({ request }) => {
    const game = await startGame(request);
    expect((await request.post(`/api/games/${game.id}/resign`, { data: { token: "nope" } })).status()).toBe(403);
    expect((await request.post(`/api/games/${game.id}/resign`, { data: {} })).status()).toBe(403);
    expect((await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status()).toBe(200);
    expect((await request.post(`/api/games/${game.id}/resign`, { data: { token: game.blackToken } })).status()).toBe(409);
  });
});
