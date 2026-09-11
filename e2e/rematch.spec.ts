import { expect, test } from "@playwright/test";

import { memberContext, seatTokensFor, seedMember } from "./members";

/**
 * Playing that game again.
 *
 * John's report was "No rematch option!!!". What a finished game offered was a
 * fork labelled "Play from move 0" — which is what you do to a game still
 * being played — and one real Rematch button that was addressed to an email,
 * so it could never appear against a computer player. That is the case it is
 * most wanted for: a computer answers instantly, so wanting another game the
 * moment one ends is the ordinary thing rather than the rare one.
 */
test.describe("a finished game offers to be played again", () => {
  test("carries the board, the clock and the rules, and swaps the colours", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `again-${stamp}@example.test`, name: `Again ${stamp}` };
    const them = { email: `foe-${stamp}@example.test`, name: `Foe ${stamp}` };
    await seedMember(me);
    await seedMember(them);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // A game with settings worth losing: a small board, a long clock, no
    // resigning. The defaults are none of those.
    const made = await context.request.post("/api/games/live", {
      data: {
        challenge: them.email,
        variant: "freestyle",
        size: 9,
        winLength: 3,
        moveTimeMs: 86_400_000,
        allowResign: false,
      },
    });
    expect(made.status()).toBe(201);
    const created = (await made.json()) as { id: string; blackToken: string };
    /*
     * The white token is NOT in that response any more, and must not be: this
     * is a challenge, so white is bound to the other member, and handing it
     * over is what let a challenger resign on their opponent's behalf. The
     * spec reads it from the row it made — a fixture, not something a player
     * can do. See `seatTokensFor`.
     */
    const game = { id: created.id, ...(await seatTokensFor(created.id)) };

    // Play it out. Black is the challenger, which is this member.
    const moves: [number, number][] = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ];
    for (const [index, [row, col]] of moves.entries()) {
      const played = await context.request.post(`/api/games/${game.id}/moves`, {
        data: { token: index % 2 === 0 ? game.blackToken : game.whiteToken, row, col },
      });
      expect(played.status()).toBe(201);
    }

    await page.goto(`/games/gomoku/match/${game.id}`);

    /*
     * The colour is named on the button, and it is the other one: this member
     * played black, so the rematch offers white. A swap nobody mentions is the
     * kind of thing somebody notices three moves in.
     */
    const again = page.getByRole("button", { name: /Play again as White/ });
    await expect(again).toBeVisible();

    await again.click();
    await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/);

    // The new game really is the old one's game.
    const id = page.url().split("/").pop()!;
    const started = await context.request.get(`/api/games/${id}`);
    expect(started.status()).toBe(200);
    const next = (await started.json()) as {
      size: number;
      moveTimeMs: number | null;
      allowResign: boolean;
      blackName: string;
      whiteName: string;
    };
    expect(next.size, "the board comes with it").toBe(9);
    expect(next.moveTimeMs, "and the clock, which used to be dropped").toBe(86_400_000);
    expect(next.allowResign, "and the rules, including the ones that are off").toBe(false);
    // Colours swapped: they had white, so they are black now.
    expect(next.blackName).toBe(them.name);
    expect(next.whiteName).toBe(me.name);

    await context.close();
  });

  test("is not offered to somebody who only watched", async ({ page, request }) => {
    const made = await request.post("/api/games/live", {
      data: { blackName: "One", whiteName: "Two", size: 9, winLength: 3 },
    });
    expect(made.status()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string; whiteToken: string };
    const moves: [number, number][] = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ];
    for (const [index, [row, col]] of moves.entries()) {
      await request.post(`/api/games/${game.id}/moves`, {
        data: { token: index % 2 === 0 ? game.blackToken : game.whiteToken, row, col },
      });
    }

    // A reader who was not in it has nobody to play again.
    await page.goto(`/games/gomoku/match/${game.id}`);
    await expect(page.getByRole("button", { name: /Play again as/ })).toHaveCount(0);
  });

  test("refuses at the door too, not only on the page", async ({ request }) => {
    // Hiding a control whose route still answers is how the seat links went
    // wrong; the refusal belongs on the route.
    const made = await request.post("/api/games/live", {
      data: { blackName: "One", whiteName: "Two", size: 9, winLength: 3 },
    });
    const game = (await made.json()) as { id: string };
    const refused = await request.post("/api/games/live", { data: { variant: "freestyle", rematch: game.id } });
    expect(refused.status(), "a game still being played cannot be replayed").toBeGreaterThanOrEqual(400);
  });
});
