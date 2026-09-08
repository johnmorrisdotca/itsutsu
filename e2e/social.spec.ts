import { expect, test } from "@playwright/test";
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

  test("a finished game between named players rates them and shows on their profiles", async ({ page, request }) => {
    const stamp = Date.now().toString(36);
    const black = `Sora ${stamp}`;
    const white = `Ren ${stamp}`;
    const moves = [
      [7, 3, "black"], [0, 0, "white"], [7, 4, "black"], [0, 1, "white"],
      [7, 5, "black"], [0, 2, "white"], [7, 6, "black"], [0, 3, "white"], [7, 7, "black"],
    ].map(([row, col, stone]) => ({ row, col, stone, kind: "place" }));
    const recorded = await request.post("/api/games", {
      data: {
        blackName: black,
        whiteName: white,
        size: 15,
        winLength: 5,
        variant: "freestyle",
        obstacles: "none",
        opener: "black",
        result: "black",
        winner: "black",
        moves,
      },
    });
    expect(recorded.status()).toBe(201);

    await page.goto(`/players/${encodeURIComponent(black)}`);
    await expect(page.getByTestId("player-record")).toContainText("1W · 0L · 0D");
    await expect(page.getByTestId("player-rating")).toContainText("1620");
    await expect(page.getByTestId("player-by-variant")).toContainText("Freestyle");

    await page.goto(`/players/${encodeURIComponent(white)}`);
    await expect(page.getByTestId("player-record")).toContainText("0W · 1L · 0D");
    await expect(page.getByTestId("player-rating")).toContainText("1580");

    await page.goto("/players");
    await expect(page.getByTestId("players-table")).toContainText(black);
  });

  test("a local game can still be played after the notes panel appears", async ({ page }) => {
    await page.goto("/games/gomoku");
    await playAt(page, 15, 7, 7);
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
  });
});
