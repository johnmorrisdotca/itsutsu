import { expect, test } from "@playwright/test";
import { playerSlug } from "../src/lib/rating/playerKey";
import { playAt } from "./support";

/** Starts a server-side game and returns its id and both seat tokens. */
async function startGame(
  request: import("@playwright/test").APIRequestContext,
  extra: Record<string, unknown> = {},
) {
  const response = await request.post("/api/games/live", {
    data: { blackName: "Kai", whiteName: "Mio", size: 9, ...extra },
  });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ id: string; blackToken: string; whiteToken: string }>;
}

test.describe("notes, messages, deadlines and players", () => {
  test("private notes stay in this browser, per game", async ({ page }) => {
    await page.goto("/games/gomoku");
    const notes = page.getByTestId("game-notes");
    await notes.fill("Try the diagonal next time.");
    await page.reload();
    await expect(page.getByTestId("game-notes")).toHaveValue("Try the diagonal next time.");
    // A new game is a new note.
    await page.getByRole("button", { name: "New game" }).click();
    await expect(page.getByTestId("game-notes")).toHaveValue("");
  });

  test("a message rides along with an emoji and reaches the other side", async ({ browser, request }) => {
    const game = await startGame(request);
    const black = await (await browser.newContext()).newPage();
    const white = await (await browser.newContext()).newPage();
    await black.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await white.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);

    await white.getByTestId("reaction-text").fill("Take your time, no rush");
    await white.getByRole("button", { name: "Send Take your time" }).click();
    await expect(white.getByTestId("reaction-message")).toContainText("no rush");
    await expect(black.getByTestId("reaction-theirs")).toContainText("no rush", { timeout: 10_000 });
    await expect(black.getByTestId("reaction-log")).toContainText("no rush");
  });

  test("a shared game with a clock shows the deadline and refuses an early claim", async ({ browser, request }) => {
    const game = await startGame(request, { moveTimeMs: 5 * 60_000, timeoutPenalty: "turn" });
    const white = await (await browser.newContext()).newPage();
    await white.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);

    await expect(white.getByTestId("shared-clock-line")).toContainText("5 minutes a move");
    await expect(white.getByTestId("deadline")).toContainText("Black must move by");
    await expect(white.getByTestId("claim-timeout")).toHaveCount(0);

    const early = await request.post(`/api/games/${game.id}/timeout`, {
      data: { token: game.whiteToken },
    });
    expect(early.status()).toBe(409);
    const body = (await early.json()) as { reason: string };
    expect(body.reason).toBe("not-due");

    // The mover cannot claim against themselves.
    const own = await request.post(`/api/games/${game.id}/timeout`, {
      data: { token: game.blackToken },
    });
    expect(own.status()).toBe(409);
  });

  test("a finished shared game between named players rates them and shows on their profiles", async ({ page, request }) => {
    const stamp = Date.now().toString(36);
    const black = `Sora ${stamp}`;
    const white = `Ren ${stamp}`;
    /*
     * A shared game, given up by white. Only a shared game rates: a game at
     * one screen is filed and never rated, because the site cannot tell who
     * was really playing it.
     */
    const started = await request.post("/api/games/live", {
      data: { blackName: black, whiteName: white, size: 9, variant: "freestyle" },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; whiteToken: string };
    expect(
      (await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status(),
    ).toBe(200);

    await page.goto(`/players/${playerSlug(black)}`);
    await expect(page.getByTestId("player-record")).toContainText("1W · 0L · 0D");
    await expect(page.getByTestId("player-rating")).toContainText("1620");
    await expect(page.getByTestId("player-by-variant")).toContainText("Gomoku");

    await page.goto(`/players/${playerSlug(white)}`);
    await expect(page.getByTestId("player-record")).toContainText("0W · 1L · 0D");
    await expect(page.getByTestId("player-rating")).toContainText("1580");

    await page.goto("/players?view=ladder");
    await expect(page.getByTestId("players-table")).toContainText(black);
  });

  test("a local game can still be played after the notes panel appears", async ({ page }) => {
    await page.goto("/games/gomoku");
    await playAt(page, 15, 7, 7);
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
  });
});
