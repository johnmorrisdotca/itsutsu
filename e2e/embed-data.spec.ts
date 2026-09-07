import { expect, request as playwrightRequest, test } from "@playwright/test";

/**
 * An embedded board reading live data from the server.
 *
 * These mint their own tokens through the operator API rather than reusing the
 * one from auth.setup, because the point of them is the difference between the
 * two scopes. The embed itself is then loaded in a fresh context with no
 * cookies at all, which is the position a real third-party iframe is in.
 */
async function mint(
  request: import("@playwright/test").APIRequestContext,
  scope: "board" | "data",
): Promise<string> {
  const response = await request.post("/api/embed-tokens", {
    data: { label: `playwright-${scope}`, scope },
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { token: string }).token;
}

/** A context with no cookies at all — the position a third-party iframe is in. */
async function anonymousContext(baseURL: string | undefined) {
  return playwrightRequest.newContext({
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
}

test.describe("an embed reading server data", () => {
  test("a data token reads the summary, a board token cannot", async ({
    request,
    baseURL,
  }) => {
    const boardToken = await mint(request, "board");
    const dataToken = await mint(request, "data");

    const anonymous = await anonymousContext(baseURL);

    // The wider grant works.
    const allowed = await anonymous.get(`/api/embed/summary?token=${dataToken}`);
    expect(allowed.status()).toBe(200);
    expect((await allowed.json()).totalGames).toBeGreaterThanOrEqual(0);

    // The narrower one does not, and does not admit the endpoint exists.
    expect((await anonymous.get(`/api/embed/summary?token=${boardToken}`)).status())
      .toBe(404);
    expect((await anonymous.get("/api/embed/summary")).status()).toBe(401);

    await anonymous.dispose();
  });

  test("a data token still unlocks nothing else", async ({ request, baseURL }) => {
    const dataToken = await mint(request, "data");
    const anonymous = await anonymousContext(baseURL);

    expect((await anonymous.get(`/api/games?token=${dataToken}`)).status()).toBe(401);
    expect((await anonymous.get(`/api/players?q=a&token=${dataToken}`)).status())
      .toBe(401);
    expect(
      (await anonymous.post(`/api/games/live?token=${dataToken}`, { data: { size: 9 } }))
        .status(),
    ).toBe(401);

    await anonymous.dispose();
  });

  test("the board shows the summary beside it, and still plays locally", async ({
    request,
    browser,
  }) => {
    const dataToken = await mint(request, "data");

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`/embed?token=${dataToken}&size=9&stats=1`);

    await expect(page.getByTestId("embed-stats")).toBeVisible();
    await expect(page.getByTestId("embed-stats")).toContainText(/game/);

    // The game itself is still local: a stone lands without a network call.
    await page.getByRole("button", { name: /^E5, empty$/ }).click();
    await expect(page.getByRole("button", { name: "E5, Black stone" })).toBeVisible();

    await context.close();
  });

  test("the summary stays off unless the host asks for it", async ({
    request,
    browser,
  }) => {
    const dataToken = await mint(request, "data");

    const context = await browser.newContext();
    const page = await context.newPage();
    // Same token, no stats=1: an embed that wants only a board gets only a board.
    await page.goto(`/embed?token=${dataToken}&size=9`);

    await expect(page.getByRole("button", { name: /^E5, empty$/ })).toBeVisible();
    await expect(page.getByTestId("embed-stats")).toHaveCount(0);

    await context.close();
  });

  test("reports a named player's record", async ({ request, browser }) => {
    const dataToken = await mint(request, "data");
    const name = `Sim${Date.now()}`;

    // Record a finished game under a known name, through the operator session.
    const recorded = await request.post("/api/games", {
      data: {
        blackName: name, whiteName: "Opponent", size: 15, winLength: 5,
        variant: "freestyle", obstacles: "none", opener: "black",
        result: "black", winner: "black",
        moves: [
          { row: 7, col: 3, stone: "black" }, { row: 0, col: 0, stone: "white" },
          { row: 7, col: 4, stone: "black" }, { row: 0, col: 1, stone: "white" },
          { row: 7, col: 5, stone: "black" }, { row: 0, col: 2, stone: "white" },
          { row: 7, col: 6, stone: "black" }, { row: 0, col: 3, stone: "white" },
          { row: 7, col: 7, stone: "black" },
        ],
      },
    });
    expect(recorded.status()).toBe(201);

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`/embed?token=${dataToken}&size=9&stats=1&player=${name}`);

    await expect(page.getByTestId("embed-player-record")).toContainText(name);
    await expect(page.getByTestId("embed-player-record")).toContainText("1W");

    await context.close();
  });
});
