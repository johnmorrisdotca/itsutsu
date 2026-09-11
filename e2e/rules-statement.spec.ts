import { expect, test } from "@playwright/test";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * The rules of a game already being played are said, not offered.
 *
 * Until the first stone the panel is a form. After it the form went away and
 * took the answers with it — the opening, whether resigning was allowed, what
 * running out of time costs, all simply gone from the page. Hardest on the
 * player who was invited, who never saw the settings the game was started
 * from and then watched the one screen that would have shown them disappear.
 */
test.describe("the rules once play has begun", () => {
  async function game(request: import("@playwright/test").APIRequestContext) {
    const response = await request.post("/api/games/live", {
      data: {
        variant: "freestyle",
        size: 9,
        blackName: `Kaya ${Date.now().toString(36)}`,
        whiteName: "Sumi",
        moveTimeMs: 300000,
        timeoutPenalty: "turn",
        allowResign: false,
        rated: false,
      },
    });
    expect(response.status()).toBe(201);
    const game = (await response.json()) as { id: string; blackToken: string; whiteToken: string };
    tidyAway(game.id);
    return game;
  }

  test("offers a form before the first stone, and no statement", async ({ page, request }) => {
    const live = await game(request);
    await page.goto(`/games/gomoku/match/${live.id}/seat/${live.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\/match\//);
    await expect(page.getByTestId("shared-rules-opening")).toBeVisible();
    await expect(page.getByTestId("rules-statement")).toHaveCount(0);
  });

  test("states them once a stone is down, including what the form was holding", async ({ page, request }) => {
    const live = await game(request);
    await request.post(`/api/games/${live.id}/moves`, {
      data: { token: live.blackToken, row: 4, col: 4 },
    });

    await page.goto(`/games/gomoku/match/${live.id}/seat/${live.whiteToken}`);
    await page.waitForURL(/\/games\/gomoku\/match\//);

    const said = page.getByTestId("rules-statement");
    await expect(said).toBeVisible();
    // The controls are gone; every answer they were holding is not.
    await expect(page.getByTestId("shared-rules-opening")).toHaveCount(0);
    await expect(said).toContainText("Opening");
    await expect(said).toContainText("Not allowed");
    await expect(said).toContainText("Friendly");
    await expect(said).toContainText("5 minutes a move");
    // The whole sentence, where there is room for it rather than in a control.
    await expect(said).toContainText("Three in a row lose the game");
  });

  test("says them to a watcher too, who never had the form at all", async ({ page, request }) => {
    const live = await game(request);
    await request.post(`/api/games/${live.id}/moves`, {
      data: { token: live.blackToken, row: 4, col: 4 },
    });
    await page.goto(`/games/gomoku/match/${live.id}`);
    await expect(page.getByTestId("rules-statement")).toContainText("Opening");
  });

  test("nor on the panel that turns a local game into a shared one", async ({ page }) => {
    /*
     * The third place these settings are offered, and the one most easily
     * forgotten: it lives beside a local board rather than a shared one. It
     * had the same sentence-as-an-option and so the same overflow.
     */
    await page.goto("/games/gomoku");
    const penalty = page.getByTestId("shared-penalty");
    const time = page.getByTestId("shared-move-time");
    await expect(time).toBeVisible();
    await time.selectOption({ index: 1 });
    await expect(penalty).toBeVisible();

    const panel = penalty.locator("xpath=ancestor::*[contains(@class,'rounded')][1]");
    const outer = await panel.boundingBox();
    const inner = await penalty.boundingBox();
    expect(outer).not.toBeNull();
    expect(inner!.x + inner!.width).toBeLessThanOrEqual(outer!.x + outer!.width + 1);
  });

  test("no control is wider than the panel it sits in", async ({ page, request }) => {
    /*
     * A select is as wide as its longest option, and one of the timeout
     * options was a whole sentence — it pushed the control past the edge of
     * the panel. Measured rather than eyeballed.
     */
    const live = await game(request);
    await page.goto(`/games/gomoku/match/${live.id}/seat/${live.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\/match\//);

    const panel = page.getByTestId("shared-rules");
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    for (const testId of ["shared-rules-penalty", "shared-rules-move-time", "shared-rules-opening"]) {
      const control = page.getByTestId(testId);
      if ((await control.count()) === 0) continue;
      const inner = await control.boundingBox();
      expect(inner, testId).not.toBeNull();
      expect(inner!.x + inner!.width, testId).toBeLessThanOrEqual(box!.x + box!.width + 1);
    }
  });
});
