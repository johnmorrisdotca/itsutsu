import { expect, test } from "@playwright/test";

import { BOT_PHRASES } from "../src/lib/history/reactions.constants";

/**
 * The computer players say hello, and thank you for the game.
 *
 * John played draughts against Dan, used the phrase buttons that sit under
 * every board to say hello and to thank him at the end, and Dan said nothing
 * either time. The three of them hold seats, carry ratings and have pages of
 * their own; saying nothing at all made them a mechanism rather than an
 * opponent.
 */
test.describe("a computer player's manners", () => {
  async function playDan(request: import("@playwright/test").APIRequestContext) {
    const started = await request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, challengeId: "dan", moveTimeMs: null },
    });
    expect(started.status(), await started.text()).toBe(201);
    return (await started.json()) as { id: string; blackToken: string };
  }

  async function saidBy(
    request: import("@playwright/test").APIRequestContext,
    id: string,
  ): Promise<string[]> {
    const game = (await (await request.get(`/api/games/${id}`)).json()) as {
      reactions?: { stone: string; text: string | null }[];
    };
    return (game.reactions ?? []).filter((r) => r.stone === "white").map((r) => r.text ?? "");
  }

  test("says hello before the first stone it plays, and only once", async ({ request }) => {
    const game = await playDan(request);

    // Black opens; the request that plays it is the one that asks Dan to answer.
    const first = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(first.status()).toBe(201);
    expect(await saidBy(request, game.id)).toContain(BOT_PHRASES.hello.text);

    // Several more moves must not collect a row of hellos.
    for (const [row, col] of [[0, 0], [0, 1], [0, 2]]) {
      await request.post(`/api/games/${game.id}/moves`, {
        data: { token: game.blackToken, row, col },
      });
    }
    const hellos = (await saidBy(request, game.id)).filter((t) => t === BOT_PHRASES.hello.text);
    expect(hellos, "Dan said hello more than once").toHaveLength(1);
  });

  test("thanks you for the game when you give it up", async ({ request }) => {
    /*
     * A resignation is the case nothing else covers: the computer has no move
     * to make, so without asking it explicitly the one game a person is most
     * likely to want a civil word from ends in silence.
     */
    const game = await playDan(request);
    await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });

    const gone = await request.post(`/api/games/${game.id}/resign`, {
      data: { token: game.blackToken },
    });
    expect(gone.status()).toBe(200);
    expect(await saidBy(request, game.id)).toContain(BOT_PHRASES.goodGame.text);
  });

  test("says nothing at all in a game between two people", async ({ request }) => {
    // The phrases belong to the computer players; a game of two people is
    // theirs to fill or leave quiet.
    const started = await request.post("/api/games/live", {
      data: { blackName: "Kai", whiteName: "Mio", size: 9, variant: "freestyle" },
    });
    const game = (await started.json()) as { id: string; blackToken: string };
    await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });

    const detail = (await (await request.get(`/api/games/${game.id}`)).json()) as {
      reactions?: unknown[];
    };
    expect(detail.reactions ?? []).toHaveLength(0);
  });
});
