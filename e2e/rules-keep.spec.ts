import { expect, test } from "@playwright/test";

import { gamesMade } from "./tidy";

/**
 * Changing one rule changes one rule.
 *
 * The window where a shared game's rules may still be changed is the one
 * window where a game can quietly become a different game, so what the form
 * does not ask about has to survive it. It did not: the settings route
 * decided the win length without the game's row in hand, so the only answer
 * available to it was a default — and a freestyle game set to six in a row
 * became five the moment anybody changed the pace. Nothing said so.
 *
 * Asked of the API rather than of a page because the page is not the only
 * caller, and because the site's own forms do not offer a win length at all:
 * a game gets one from being mirrored out of a game at one screen, where the
 * setting does exist. That is exactly the shape of thing a browser test walks
 * past.
 */
test.describe("a rules change keeps what it was not asked about", () => {
  const mine = gamesMade();

  const change = (id: string, token: string, variant: string) => ({
    token,
    variant,
    size: 15,
    moveTimeMs: null,
    obstacles: "none",
    opening: "free",
    handicap: { stone: null, stones: 0 },
    timeoutPenalty: "turn",
    drawLimit: "none",
  });

  for (const asked of [4, 6]) {
    test(`keeps a line of ${asked} that the game was set to`, async ({ request }) => {
      const made = await request.post("/api/games/live", {
        data: {
          variant: "freestyle",
          size: 15,
          winLength: asked,
          blackName: "Keeper Black",
          whiteName: "Keeper White",
        },
      });
      expect(made.status()).toBe(201);
      const game = (await made.json()) as { id: string; blackToken: string };
      mine(game.id);

      const before = await request.get(`/api/games/${game.id}`);
      expect((await before.json()).winLength).toBe(asked);

      const changed = await request.put(`/api/games/${game.id}/settings`, {
        data: change(game.id, game.blackToken, "freestyle"),
      });
      expect(changed.status()).toBe(200);
      expect((await changed.json()).winLength).toBe(asked);
    });
  }

  test("but a game whose rules fix the line still gets the line its rules fix", async ({ request }) => {
    /*
     * The Reversi lesson, in the other direction: a game the rules decide is
     * not a game a request may argue with. Tournament Gomoku is exactly five,
     * so asking for six is refused at the door and refused again here.
     */
    const made = await request.post("/api/games/live", {
      data: {
        variant: "standard",
        size: 15,
        winLength: 6,
        blackName: "Keeper Black",
        whiteName: "Keeper White",
      },
    });
    expect(made.status()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string };
    mine(game.id);

    const before = await request.get(`/api/games/${game.id}`);
    expect((await before.json()).winLength).toBe(5);

    const changed = await request.put(`/api/games/${game.id}/settings`, {
      data: change(game.id, game.blackToken, "standard"),
    });
    expect(changed.status()).toBe(200);
    expect((await changed.json()).winLength).toBe(5);
  });
});
