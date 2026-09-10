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

  /** The same, keeping the move each thing was said at. */
  async function whenSaid(
    request: import("@playwright/test").APIRequestContext,
    id: string,
  ): Promise<{ text: string; moveNumber: number | null }[]> {
    const game = (await (await request.get(`/api/games/${id}`)).json()) as {
      reactions?: { stone: string; text: string | null; moveNumber: number | null }[];
    };
    return (game.reactions ?? [])
      .filter((r) => r.stone === "white")
      .map((r) => ({ text: r.text ?? "", moveNumber: r.moveNumber }));
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

  test("says thank you at the move it ended on, not before the first stone", async ({ request }) => {
    /*
     * John found this on his own game: the record groups what was said by the
     * move it was said at, and the computer's goodbye was filed under BEFORE
     * THE FIRST STONE — so a reader saw a program thanking them for a game
     * that had not started, sitting above a message of their own from move 42.
     *
     * The greeting genuinely belongs there and stays there. Both are asserted
     * together, because the fix is only right if it moved one and not the
     * other.
     */
    const game = await playDan(request);
    await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    await request.post(`/api/games/${game.id}/resign`, { data: { token: game.blackToken } });

    const said = await whenSaid(request, game.id);
    const hello = said.find((one) => one.text === BOT_PHRASES.hello.text);
    const bye = said.find((one) => one.text === BOT_PHRASES.goodGame.text);

    expect(hello, "the computer never said hello").toBeDefined();
    expect(bye, "the computer never said thank you").toBeDefined();

    // Before the first stone, which is what null means here.
    expect(hello?.moveNumber, "hello belongs before the first stone").toBeNull();
    // And at the end, which is a real move rather than nothing at all.
    expect(bye?.moveNumber, "thank you was filed before the game started").not.toBeNull();
    expect(bye?.moveNumber ?? 0).toBeGreaterThan(0);
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
