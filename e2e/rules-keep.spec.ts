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

  test("keeps everything a change does not mention, and changes what it does", async ({ request }) => {
    /*
     * The payload here is exactly the one the panel's own "clear the
     * handicap" button sends: it names the board, the game, the obstacles,
     * the opening, the pace, the penalty and the handicap, and says nothing
     * about the rest. Everything it says nothing about used to be put back to
     * a default — a game created unrated, resignation off, on a whole-game
     * clock, with a draw limit and a posted seat came back rated, resignable,
     * per-move, unlimited and off the board, in one press.
     */
    const made = await request.post("/api/games/live", {
      data: {
        variant: "freestyle",
        size: 9,
        blackName: "Keeper Black",
        whiteName: "Keeper White",
        rated: false,
        allowResign: false,
        clockMode: "game",
        moveTimeMs: 86_400_000,
        drawLimit: "half",
        open: true,
      },
    });
    expect(made.status()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string };
    mine(game.id);

    const cleared = await request.put(`/api/games/${game.id}/settings`, {
      data: {
        token: game.blackToken,
        size: 9,
        variant: "freestyle",
        obstacles: "none",
        opening: "free",
        moveTimeMs: 86_400_000,
        timeoutPenalty: "turn",
        handicap: null,
      },
    });
    expect(cleared.status()).toBe(200);
    const kept = await cleared.json();
    expect({
      size: kept.size,
      rated: kept.rated,
      allowResign: kept.allowResign,
      clockMode: kept.clockMode,
      drawLimit: kept.drawLimit,
      posted: kept.openSeat !== null,
    }).toEqual({
      size: 9,
      rated: false,
      allowResign: false,
      clockMode: "game",
      drawLimit: "half",
      posted: true,
    });

    // And silence is not paralysis: a change that names one really makes it.
    const asked = await request.put(`/api/games/${game.id}/settings`, {
      data: { token: game.blackToken, rated: true, size: 19 },
    });
    expect(asked.status()).toBe(200);
    const now = await asked.json();
    expect(now.rated).toBe(true);
    expect(now.size).toBe(19);
    // Still untouched, because that payload did not mention them either.
    expect(now.allowResign).toBe(false);
    expect(now.drawLimit).toBe("half");
  });

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

/**
 * And the same question of a member's own profile.
 *
 * The settings route reset six things it was not asked about because a schema
 * default stood in for a value it could not see. `/api/me` is the other route
 * on this site that takes a form's worth of fields and writes them to a row,
 * so it is the other place that shape could live. It does not — every field
 * there is optional with no default — and this is the test that says so, and
 * that will notice the day somebody adds one.
 */
test.describe("a profile change keeps what it was not asked about", () => {
  test("changing one field leaves the others alone", async ({ request }) => {
    const stamp = Date.now().toString(36);
    const before = await request.patch("/api/me", {
      data: { city: `City ${stamp}`, country: "Japan", bio: `Bio ${stamp}`, timeZone: "Asia/Tokyo" },
    });
    expect(before.status()).toBe(200);

    const only = await request.patch("/api/me", { data: { bio: `Second ${stamp}` } });
    expect(only.status()).toBe(200);

    /*
     * Read from the page rather than the API: `/api/me` only takes changes,
     * and the profile form is filled from the row, so what it shows is what
     * was stored. Which is also the thing a person would notice.
     */
    const page = await request.get("/me?view=profile");
    expect(page.status()).toBe(200);
    const shown = await page.text();
    expect(shown, "the field that was named should have changed").toContain(`Second ${stamp}`);
    for (const kept of [`City ${stamp}`, "Asia/Tokyo"]) {
      expect(shown, `a field the request never mentioned: ${kept}`).toContain(kept);
    }
  });
});
