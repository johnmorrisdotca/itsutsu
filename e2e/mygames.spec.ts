import { expect, request as playwrightRequest, test } from "@playwright/test";

import { PLAYER_STATE, readyHere } from "./support";

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
    await blackPage.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await whitePage.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);

    // The row for this game, wherever it is listed: other games may be listed too.
    const row = (page: import("@playwright/test").Page) =>
      page.locator(`[data-testid="my-game"][data-id="${game.id}"]`);

    // Nobody has moved: not started, for both.
    await blackPage.goto("/play");
    await expect(blackPage.getByTestId("my-games-unstarted").locator(row(blackPage))).toBeVisible();

    // Black plays; now it is white's move, and white's badge counts it.
    await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
    await blackPage.goto("/play");
    await expect(blackPage.getByTestId("my-games-theirMove").locator(row(blackPage))).toBeVisible();
    await whitePage.goto("/play");
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
    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);
    await page.goto("/play");

    const row = page.locator(`[data-testid="my-game"][data-id="${game.id}"]`);
    /*
     * `readyHere` and not `ready`, because there is one of these per row: a
     * page-wide `getByTestId("resign")` on a queue with two games in it is a
     * strict-mode violation rather than a wait. The press itself needs it —
     * the trigger is server-rendered, so an early press puts no question up
     * and the line below then fails on a `-yes` button that never existed.
     */
    await readyHere(row.getByTestId("resign"));
    await row.getByTestId("resign").click();
    await row.getByTestId("resign-yes").click();
    await expect(page.getByTestId("my-games-finished").locator(row)).toBeVisible();

    // Black won by resignation, and the record says so.
    const detail = await request.get(`/api/games/${game.id}`);
    expect((await detail.json()).winner).toBe("black");
    await page.goto(`/games/gomoku/match/${game.id}`);
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${game.id}`));
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
  test("a game posted for anyone can be sat at by somebody else, once", async ({ browser, request, baseURL }) => {
    /*
     * Posted by somebody with no member behind them, not by this file's own
     * admin session. "Whoever starts a game is sitting at it" (games/live's
     * route) binds a SIGNED-IN poster's own member id to a seat they post,
     * and seatName() (currentNames.ts) always shows a bound seat's CURRENT
     * member name over whatever the row's own field says — both deliberate,
     * and both already covered elsewhere. So the admin identity every other
     * request in this file uses would have its own live profile name shown
     * on the noticeboard instead of "Host", which is what actually broke
     * this test: this file's session is real (`ensureMember` gives the
     * operator a row), so the label picked here was never what the row
     * showed once posting started binding its poster. An invite-only
     * identity is never bound, so the label chosen here is the label shown.
     */
    const minted = await request.post("/api/invites", { data: { note: "mygames-host" } });
    expect(minted.status()).toBe(201);
    const { code } = (await minted.json()) as { code: string };
    const host = await playwrightRequest.newContext({ baseURL });
    const signedIn = await host.post("/api/session", { data: { kind: "invite", code } });
    expect(signedIn.ok()).toBe(true);

    const created = await host.post("/api/games/live", {
      data: { blackName: "Host", size: 9, open: true },
    });
    expect(created.status()).toBe(201);
    const game = (await created.json()) as { id: string; blackToken: string };
    await host.dispose();

    /*
     * Somebody else, and it has to be somebody else: this used to sign the
     * guest in as the same account that posted the seat, so it read as a
     * stranger answering an invitation while actually being the poster
     * answering their own — which the site now refuses.
     */
    const guest = await browser.newContext({ storageState: PLAYER_STATE });
    const page = await guest.newPage();
    await page.goto("/games");
    const row = page.getByTestId("open-game").filter({ hasText: "Host" });
    await expect(row).toBeVisible();
    // Taking a seat posts to the API from the browser, so the button does
    // nothing at all until React is holding it.
    await readyHere(row.getByTestId("sit"));
    await row.getByTestId("sit").click();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${game.id}`));
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

