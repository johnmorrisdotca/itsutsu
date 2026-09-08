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

    // The row for this game, wherever it is listed: other games may be listed too.
    const row = (page: import("@playwright/test").Page) =>
      page.locator(`[data-testid="my-game"][data-id="${game.id}"]`);

    // Nobody has moved: not started, for both.
    await blackPage.goto("/games");
    await expect(blackPage.getByTestId("my-games-unstarted").locator(row(blackPage))).toBeVisible();

    // Black plays; now it is white's move, and white's badge counts it.
    await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
    await blackPage.goto("/games");
    await expect(blackPage.getByTestId("my-games-theirMove").locator(row(blackPage))).toBeVisible();
    await whitePage.goto("/games");
    await expect(whitePage.getByTestId("my-games-yourMove").locator(row(whitePage))).toBeVisible();
    await expect(whitePage.getByTestId("your-turn-badge")).not.toHaveText("0");

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
    const row = page.locator(`[data-testid="my-game"][data-id="${game.id}"]`);
    await row.getByTestId("resign").click();
    await expect(page.getByTestId("my-games-finished").locator(row)).toBeVisible();

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

test.describe("open seats", () => {
  test("a game posted for anyone can be sat at by somebody else, once", async ({ browser, request }) => {
    const created = await request.post("/api/games/live", {
      data: { blackName: "Host", size: 9, open: true },
    });
    expect(created.status()).toBe(201);
    const game = (await created.json()) as { id: string; blackToken: string };

    const guest = await browser.newContext({ storageState: ".auth/admin.json" });
    const page = await guest.newPage();
    await page.goto("/games");
    const row = page.getByTestId("open-game").filter({ hasText: "Host" });
    await expect(row).toBeVisible();
    await row.getByTestId("sit").click();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/${game.id}`));
    await expect(page.getByTestId("turn-banner")).toContainText("Waiting");

    // The seat is gone from the board, and a second taker is refused.
    await page.goto("/games");
    await expect(page.getByTestId("open-game").filter({ hasText: "Host" })).toHaveCount(0);
    expect((await request.post(`/api/games/${game.id}/sit`)).status()).toBe(409);
    await guest.close();
  });

  test("a game set up with no resigning refuses it", async ({ request }) => {
    const created = await request.post("/api/games/live", {
      data: { blackName: "Kai", whiteName: "Mio", size: 9, allowResign: false },
    });
    const game = (await created.json()) as { id: string; whiteToken: string };
    const refused = await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } });
    expect(refused.status()).toBe(409);
    expect(((await refused.json()) as { reason: string }).reason).toBe("not-allowed");
  });
});

