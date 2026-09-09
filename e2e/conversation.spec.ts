import { expect, test } from "@playwright/test";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * What the players said, kept with the game.
 *
 * The messages were being stored and thrown away: every reaction carries the
 * move it was sent at and the record page showed none of it. This walks the
 * whole way round — two people talking over a game, the game finishing, and
 * the talk still being there against the moves it belongs to.
 */
test.describe("the conversation in a finished game", () => {
  async function playedAndTalked(request: import("@playwright/test").APIRequestContext) {
    const started = await request.post("/api/games/live", {
      data: { blackName: `Kaya ${Date.now().toString(36)}`, whiteName: "Sumi", size: 9 },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
    tidyAway(game.id);

    await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    await request.post(`/api/games/${game.id}/reactions`, {
      data: { token: game.blackToken, emoji: "👋", text: "Good evening", moveNumber: 1 },
    });
    await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.whiteToken, row: 3, col: 3 },
    });
    await request.post(`/api/games/${game.id}/reactions`, {
      data: { token: game.whiteToken, emoji: "🤔", text: "That is a new one on me", moveNumber: 2 },
    });
    expect(
      (await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status(),
    ).toBe(200);
    return game;
  }

  test("keeps what was said, against the move it was said at", async ({ page, request }) => {
    const game = await playedAndTalked(request);

    await page.goto(`/history/gomoku/${game.id}`);
    const talk = page.getByTestId("conversation");
    await expect(talk).toBeVisible();

    // Both remarks, each under the move it belongs to and in the right order.
    const entries = talk.getByTestId("conversation-entry");
    await expect(entries).toHaveCount(2);
    await expect(entries.nth(0)).toContainText("Move 1");
    await expect(entries.nth(0)).toContainText("Good evening");
    await expect(entries.nth(1)).toContainText("Move 2");
    await expect(entries.nth(1)).toContainText("That is a new one on me");
  });

  test("a remark leads to the position it was made at", async ({ page, request }) => {
    const game = await playedAndTalked(request);

    await page.goto(`/history/gomoku/${game.id}`);
    // The point of grouping by move rather than by the clock: the board goes
    // to what somebody was reacting to.
    await page.getByTestId("conversation").getByTestId("conversation-move").nth(1).click();
    await expect(page).toHaveURL(new RegExp(`/history/gomoku/${game.id}/2$`));
  });

  test("keeps a long conversation whole, not the last thirty of it", async ({ page, request }) => {
    /*
     * A game carries its last thirty remarks to a board being played, which is
     * right: it is polled, and an evening's talk on every poll is a payload
     * nobody reads twice. The record was served from the same query, so a
     * chatty game's record began in the middle with nothing saying so — the
     * one page the conversation is supposed to survive on.
     *
     * Both seats speak, because one seat may only say twenty things a minute.
     */
    const started = await request.post("/api/games/live", {
      data: { blackName: `Chatty ${Date.now().toString(36)}`, whiteName: "Sumi", size: 9 },
    });
    const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
    tidyAway(game.id);
    await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });

    const said = 35;
    for (let i = 0; i < said; i += 1) {
      const posted = await request.post(`/api/games/${game.id}/reactions`, {
        data: {
          token: i % 2 === 0 ? game.blackToken : game.whiteToken,
          emoji: "👋",
          text: `Remark ${i}`,
          moveNumber: 1,
        },
      });
      expect(posted.status(), `remark ${i}`).toBe(201);
    }
    await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } });

    await page.goto(`/history/gomoku/${game.id}`);
    const talk = page.getByTestId("conversation");
    await expect(talk).toBeVisible();
    // The first thing said is the half that used to go missing.
    await expect(talk).toContainText("Remark 0");
    await expect(talk).toContainText(`Remark ${said - 1}`);
  });

  test("says nothing at all when nobody spoke", async ({ page, request }) => {
    const started = await request.post("/api/games/live", {
      data: { blackName: `Quiet ${Date.now().toString(36)}`, whiteName: "Also quiet", size: 9 },
    });
    const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
    tidyAway(game.id);
    await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } });

    await page.goto(`/history/gomoku/${game.id}`);
    // An empty panel headed "What they said" would be worse than no panel.
    await expect(page.getByTestId("conversation")).toHaveCount(0);
  });
});
