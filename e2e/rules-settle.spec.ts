import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

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
    const game = (await response.json()) as { id: string; blackToken: string };
    tidyAway(game.id);
    return game;
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

  test("settle for a challenge too, where nobody ever follows a link", async ({ browser, baseURL }) => {
    /*
     * The case the seat-link half cannot see. A challenge binds both seats to
     * accounts the moment it is sent and neither player follows a link, so
     * nothing was ever stamped for either of them — and a challenged game's
     * rules stayed open right up to the first stone. Opening the game is that
     * seat's holder arriving, and it says so now.
     */
    const stamp = Date.now().toString(36);
    const asks = { email: `asker-${stamp}@example.com`, name: `Asker ${stamp}` };
    const answers = { email: `asked-${stamp}@example.com`, name: `Asked ${stamp}` };
    const one = await memberContext(browser, baseURL!, asks);
    const two = await memberContext(browser, baseURL!, answers);

    const started = await one.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, moveTimeMs: null, challenge: answers.email },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string };
    tidyAway(game.id);

    // The challenger opens it: still only one of them has arrived.
    const asker = await one.newPage();
    await asker.goto(`/games/gomoku/${game.id}`);
    await expect(asker.getByTestId("shared-rules-size")).toBeVisible();

    // The invited player opens it. Now the rules are what both have.
    const asked = await two.newPage();
    await asked.goto(`/games/gomoku/${game.id}`);
    await expect(asked.getByTestId("rules-statement")).toBeVisible();

    await asker.reload();
    await expect(asker.getByTestId("shared-rules-size")).toHaveCount(0);
    await expect(asker.getByTestId("rules-statement")).toBeVisible();
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
