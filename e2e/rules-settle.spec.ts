import { expect, test } from "@playwright/test";

import { memberContext } from "./members";

/**
 * The rules settle when the other player arrives, not when somebody moves.
 *
 * The panel stayed a form until the first stone, so between somebody sitting
 * down and somebody playing there was a window where one seat could change
 * what the other had just agreed to. That is the door the setup screen was
 * built to close, standing open at the far end.
 */
test.describe("when a shared game's rules settle", () => {
  async function posted(request: import("@playwright/test").APIRequestContext) {
    const response = await request.post("/api/games/live", {
      data: {
        variant: "freestyle",
        size: 9,
        open: true,
        moveTimeMs: null,
        blackName: `Poster ${Date.now().toString(36)}`,
      },
    });
    expect(response.status()).toBe(201);
    /*
     * Only the poster's own token comes back for a posted seat — handing out
     * the other would be handing away the seat. Somebody answers it the way
     * anybody answers it, through /sit.
     */
    return response.json() as Promise<{ id: string; blackToken: string }>;
  }

  async function answered(
    browser: import("@playwright/test").Browser,
    baseURL: string,
    id: string,
  ) {
    const stamp = Date.now().toString(36);
    const other = await memberContext(browser, baseURL, {
      email: `answerer-${stamp}-${Math.random().toString(36).slice(2, 7)}@example.com`,
      name: `Answerer ${stamp}`,
    });
    expect((await other.request.post(`/api/games/${id}/sit`)).status()).toBe(200);
  }

  test("stay open while the seat is still waiting for somebody", async ({ page, request }) => {
    const game = await posted(request);
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\//);
    // Nobody has answered, so a creator can still fix a clock they got wrong.
    await expect(page.getByTestId("shared-rules-size")).toBeVisible();
    await expect(page.getByTestId("rules-statement")).toHaveCount(0);
  });

  test("settle the moment the other seat is taken, before any stone", async ({
    page,
    request,
    browser,
    baseURL,
  }) => {
    const game = await posted(request);
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\//);
    await expect(page.getByTestId("shared-rules-size")).toBeVisible();

    await answered(browser, baseURL!, game.id);

    // No stone has been played, and the rules are already what both agreed to.
    await page.reload();
    await expect(page.getByTestId("shared-rules-size")).toHaveCount(0);
    await expect(page.getByTestId("rules-statement")).toBeVisible();
  });

  test("and the server refuses the change, not just the page", async ({ request, browser, baseURL }) => {
    const game = await posted(request);
    await answered(browser, baseURL!, game.id);

    // Straight at the API with a good token, past the panel that stopped offering.
    const changed = await request.put(`/api/games/${game.id}/settings`, {
      data: {
        token: game.blackToken,
        variant: "freestyle",
        size: 19,
        opening: "free",
        obstacles: "none",
        moveTimeMs: null,
        timeoutPenalty: "turn",
        drawLimit: "none",
        clockMode: "move",
        rated: true,
        allowResign: true,
        open: false,
        handicap: null,
      },
    });
    expect(changed.status()).toBe(409);
    expect(((await changed.json()) as { reason?: string }).reason).toBe("settled");

    const after = await (await request.get(`/api/games/${game.id}`)).json();
    expect(after.size).toBe(9);
  });
});
