import { expect, test } from "@playwright/test";

/**
 * A game somebody plays against themselves says so.
 *
 * Two devices, one person, both seats: the ladder has always refused to rate
 * that game, and always refused it in silence. The game was filed, the stones
 * were kept, and the figures did not move — with nothing on the board or the
 * record to say why, or even that anything had been decided. This walks both
 * moments the site now speaks at: while the game is still being played, and
 * afterwards on its record.
 */
test.describe("a game against yourself", () => {
  async function selfGame(request: import("@playwright/test").APIRequestContext) {
    // One person at two devices types the same name into both seats. Spelt
    // differently on purpose: the ladder folds them together and so does this.
    const name = `Solo ${Date.now().toString(36)}`;
    const started = await request.post("/api/games/live", {
      data: { blackName: name, whiteName: `  ${name.toUpperCase()} `, size: 9 },
    });
    expect(started.status()).toBe(201);
    return (await started.json()) as { id: string; blackToken: string; whiteToken: string };
  }

  test("warns while the game is still being played", async ({ page, request }) => {
    const game = await selfGame(request);

    await page.goto(`/games/gomoku/${game.id}`);
    const notice = page.getByTestId("shared-unrated-line");
    await expect(notice).toBeVisible();
    // Future tense: there is still an evening to save.
    await expect(notice).toContainText("will not count");
    await expect(notice).toContainText("Both seats are the same player");
  });

  test("and says so on the record afterwards", async ({ page, request }) => {
    const game = await selfGame(request);
    await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(
      (await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status(),
    ).toBe(200);

    await page.goto(`/history/gomoku/${game.id}`);
    const notice = page.getByTestId("record-unrated");
    await expect(notice).toBeVisible();
    // Past tense: this is the answer to "where did my game go?".
    await expect(notice).toContainText("did not count");
  });

  test("says nothing of the kind about a game between two people", async ({ page, request }) => {
    const stamp = Date.now().toString(36);
    const started = await request.post("/api/games/live", {
      data: { blackName: `Kaya ${stamp}`, whiteName: `Sumi ${stamp}`, size: 9 },
    });
    const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };

    await page.goto(`/games/gomoku/${game.id}`);
    await expect(page.getByTestId("shared-rules")).toBeVisible();
    // The panel is there; the warning is not. A rated game is not nagged at.
    await expect(page.getByTestId("shared-unrated-line")).toHaveCount(0);

    await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } });
    await page.goto(`/history/gomoku/${game.id}`);
    await expect(page.getByTestId("record-unrated")).toHaveCount(0);
  });
});
