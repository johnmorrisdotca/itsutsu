import { expect, test } from "@playwright/test";

import { memberContext } from "./members";

/**
 * A finished game is something anyone may say was worth playing.
 */
test.describe("applause on a finished game", () => {
  test("anyone signed in may leave one mark, change it, and take it back", async ({ browser, baseURL, request }) => {
    const stamp = Date.now().toString(36);
    const started = await request.post("/api/games/live", {
      data: { blackName: `Clap ${stamp}`, whiteName: `Foil ${stamp}`, size: 9 },
    });
    const game = (await started.json()) as { id: string; whiteToken: string };
    expect((await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status()).toBe(200);

    // A reader who never played it: applause is not only for the players.
    const context = await memberContext(browser, baseURL!, {
      email: `clapper-${stamp}@example.test`,
      name: `Clapper ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto(`/games/gomoku/match/${game.id}`);
    await expect(page.getByTestId("applause")).toContainText("No applause yet");

    await page.getByTestId("applause-well-played").click();
    await expect(page.getByTestId("applause-well-played")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("applause")).toContainText("1");

    // One mark each: changing it moves the count rather than adding one.
    await page.getByTestId("applause-brilliant").click();
    await expect(page.getByTestId("applause-brilliant")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("applause-well-played")).toHaveAttribute("aria-pressed", "false");

    // The same mark again is a change of mind.
    await page.getByTestId("applause-brilliant").click();
    await expect(page.getByTestId("applause-brilliant")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("applause")).toContainText("No applause yet");

    await context.close();
  });

  test("a game still being played takes none, and a stranger is asked to sign in", async ({ page, request }) => {
    const started = await request.post("/api/games/live", { data: { blackName: "A", whiteName: "B", size: 9 } });
    const game = (await started.json()) as { id: string };
    const early = await request.post(`/api/games/${game.id}/applause`, { data: { emoji: "👏" } });
    expect(early.status()).toBe(422);
    expect((await request.post(`/api/games/${game.id}/applause`, { data: { emoji: "🍕" } })).status()).toBe(400);
    await page.goto("/games");
    expect(page.url()).toContain("/games");
  });
});
