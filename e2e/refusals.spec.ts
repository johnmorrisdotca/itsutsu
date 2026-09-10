import { expect, test, type APIRequestContext } from "@playwright/test";

import { gamesMade } from "./tidy";

/**
 * A refusal is a refusal: the row is exactly as it was.
 *
 * Every bug found in this codebase today was at a route rather than in the
 * engine, and every one had the same shape — a request was ACCEPTED and
 * changed more than it asked to. This is the mirror of that, and the half no
 * happy-path test ever checks: when a request is turned away, nothing may
 * have moved. Not the board, not the clock, not a setting the payload
 * happened to mention on its way past.
 *
 * The check is the same every time, and deliberately blunt. Read the whole
 * game, try the thing, read the whole game again, and compare every field.
 * Naming the fields that matter would mean guessing which ones a bug will
 * choose, and today's bugs chose the win length, the board size, the rated
 * flag, the clock mode, the draw limit and a posted seat — six fields nobody
 * would have thought to name.
 */

/** Everything a game is, minus the two things that move for honest reasons. */
async function wholeGame(request: APIRequestContext, id: string): Promise<Record<string, unknown>> {
  const answer = await request.get(`/api/games/${id}`);
  expect(answer.status(), "the game should still be readable").toBe(200);
  const game = (await answer.json()) as Record<string, unknown>;
  /*
   * `lastSeenAt`-ish fields move on every read for reasons that have nothing
   * to do with the request being tested. Nothing else is allowed to.
   */
  delete game.viewedAt;
  return game;
}

async function unchangedBy(
  request: APIRequestContext,
  id: string,
  what: string,
  attempt: () => Promise<number>,
) {
  const before = await wholeGame(request, id);
  const status = await attempt();
  expect(status, `${what}: should have been refused`).toBeGreaterThanOrEqual(400);
  const after = await wholeGame(request, id);
  expect(after, `${what}: was refused and changed the game anyway`).toEqual(before);
}

test.describe("a refusal changes nothing", () => {
  const mine = gamesMade();

  async function aGame(request: APIRequestContext) {
    const made = await request.post("/api/games/live", {
      data: {
        variant: "freestyle",
        size: 9,
        winLength: 6,
        blackName: "Refusal Black",
        whiteName: "Refusal White",
        rated: false,
        allowResign: false,
        clockMode: "game",
        moveTimeMs: 86_400_000,
        drawLimit: "half",
      },
    });
    expect(made.status()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string; whiteToken: string };
    mine(game.id);
    return game;
  }

  test("a move with a token that holds no seat", async ({ request }) => {
    const game = await aGame(request);
    await unchangedBy(request, game.id, "a move on a stranger's token", async () => {
      const tried = await request.post(`/api/games/${game.id}/moves`, {
        data: { token: "not-a-token", row: 4, col: 4 },
      });
      return tried.status();
    });
  });

  test("a move by the colour whose turn it is not", async ({ request }) => {
    const game = await aGame(request);
    const opened = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(opened.status()).toBe(201);

    await unchangedBy(request, game.id, "black moving twice", async () => {
      const tried = await request.post(`/api/games/${game.id}/moves`, {
        data: { token: game.blackToken, row: 4, col: 5 },
      });
      return tried.status();
    });
  });

  test("a move onto a point that is taken", async ({ request }) => {
    const game = await aGame(request);
    const opened = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(opened.status()).toBe(201);

    await unchangedBy(request, game.id, "white playing on black's stone", async () => {
      const tried = await request.post(`/api/games/${game.id}/moves`, {
        data: { token: game.whiteToken, row: 4, col: 4 },
      });
      return tried.status();
    });
  });

  test("a move off the edge of the board", async ({ request }) => {
    const game = await aGame(request);
    await unchangedBy(request, game.id, "a move at 99,99 on a 9×9 board", async () => {
      const tried = await request.post(`/api/games/${game.id}/moves`, {
        data: { token: game.blackToken, row: 99, col: 99 },
      });
      return tried.status();
    });
  });

  test("a rules change on a token that holds no seat", async ({ request }) => {
    const game = await aGame(request);
    await unchangedBy(request, game.id, "settings on a stranger's token", async () => {
      const tried = await request.put(`/api/games/${game.id}/settings`, {
        data: { token: "not-a-token", variant: "renju", size: 19, rated: true },
      });
      return tried.status();
    });
  });

  test("a rules change once a stone is down", async ({ request }) => {
    const game = await aGame(request);
    const opened = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(opened.status()).toBe(201);

    /*
     * The window closes at the first stone: once one is down the rules are
     * part of the record. A refusal here that had already written the board
     * size would be the worst of both — a game whose stones were played under
     * rules it no longer says it had.
     */
    await unchangedBy(request, game.id, "settings after the first stone", async () => {
      const tried = await request.put(`/api/games/${game.id}/settings`, {
        data: { token: game.blackToken, variant: "renju", size: 19, rated: true, open: true },
      });
      return tried.status();
    });
  });

  test("a rules change asking for something that is not a game", async ({ request }) => {
    const game = await aGame(request);
    await unchangedBy(request, game.id, "settings naming a variant nobody has", async () => {
      const tried = await request.put(`/api/games/${game.id}/settings`, {
        data: { token: game.blackToken, variant: "buckaroo", size: 9 },
      });
      return tried.status();
    });
  });

  test("resigning a game that does not allow it", async ({ request }) => {
    const game = await aGame(request);
    await unchangedBy(request, game.id, "resigning with resignation off", async () => {
      const tried = await request.post(`/api/games/${game.id}/resign`, {
        data: { token: game.blackToken },
      });
      return tried.status();
    });
  });

  test("claiming a deadline that has not gone by", async ({ request }) => {
    const game = await aGame(request);
    await unchangedBy(request, game.id, "claiming a timeout early", async () => {
      const tried = await request.post(`/api/games/${game.id}/timeout`, {
        data: { token: game.whiteToken },
      });
      return tried.status();
    });
  });

  test("sitting at a seat that was never posted", async ({ request }) => {
    const game = await aGame(request);
    await unchangedBy(request, game.id, "sitting at a seat nobody posted", async () => {
      const tried = await request.post(`/api/games/${game.id}/sit`);
      return tried.status();
    });
  });
});
