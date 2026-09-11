import { expect, test } from "@playwright/test";

/**
 * Games that can actually be won, resigned and finished.
 *
 * John's words after playing his daughter: "Seems like you need some
 * playability tests." He was right, and two bugs got through for want of
 * them — both of which look like the site ignoring you.
 *
 * A rematched game of noughts and crosses was UNWINNABLE: the rules asked for
 * five in a row on a three-by-three board. He put his winning move down and
 * nothing happened, because on that board nothing ever could.
 *
 * And a member who was challenged into a game could not resign it. They never
 * open a seat LINK, so they have no seat cookie, and the button sent no token
 * — so the server said no and the page said nothing at all.
 *
 * So these play games to their end rather than checking a control exists.
 */

type Made = { id: string; blackToken: string; whiteToken: string };

async function start(
  request: import("@playwright/test").APIRequestContext,
  body: Record<string, unknown>,
): Promise<Made> {
  const made = await request.post("/api/games/live", {
    data: { blackName: "Aki", whiteName: "Bo", opener: "black", rated: false, ...body },
  });
  expect(made.status(), await made.text()).toBe(201);
  return (await made.json()) as Made;
}

async function play(
  request: import("@playwright/test").APIRequestContext,
  game: Made,
  stone: "black" | "white",
  row: number,
  col: number,
) {
  const response = await request.post(`/api/games/${game.id}/moves`, {
    data: { token: stone === "black" ? game.blackToken : game.whiteToken, row, col },
  });
  expect(response.status(), await response.text()).toBe(201);
}

async function read(request: import("@playwright/test").APIRequestContext, id: string) {
  return (await (await request.get(`/api/games/${id}`)).json()) as {
    status: string;
    winner: string | null;
    result: string;
    winLength: number;
    variant: string;
  };
}

test.describe("a game can be played to its end", () => {
  test("noughts and crosses is won by three in a row, and says so", async ({ request }) => {
    const game = await start(request, { variant: "tictactoe", size: 3 });

    // The rules the board is played under have to fit the board. Five in a row
    // on three-by-three is a game nobody can win, which is exactly what shipped.
    expect((await read(request, game.id)).winLength, "three in a row on a 3×3 board").toBe(3);

    await play(request, game, "black", 0, 0);
    await play(request, game, "white", 1, 1);
    await play(request, game, "black", 0, 1);
    await play(request, game, "white", 2, 2);
    await play(request, game, "black", 0, 2); // three across the top

    const done = await read(request, game.id);
    expect(done.status, "the winning move did not end the game").toBe("finished");
    expect(done.winner, "black played three in a row and did not win").toBe("black");
  });

  test("a rematch is played under rules that fit its board", async ({ request }) => {
    /*
     * The actual bug. A rematch sends no variant, so the request's variant
     * fell back to the default — whose win length is "whatever the board
     * says" — and the new game was written with five. The rules came from the
     * game being replayed; the win length did not.
     */
    const first = await start(request, { variant: "tictactoe", size: 3 });
    await play(request, first, "black", 0, 0);

    const again = await request.post("/api/games/live", {
      data: { from: { id: first.id, move: 1 }, blackName: "Aki", whiteName: "Bo", rated: false },
    });
    expect(again.status(), await again.text()).toBe(201);
    const forked = (await again.json()) as Made;

    const rules = await read(request, forked.id);
    expect(rules.variant, "a fork keeps the game it came from").toBe("tictactoe");
    expect(rules.winLength, "a 3×3 board asking for five in a row is unwinnable").toBe(3);
  });

  test("a game nobody could win is refused rather than written", async ({ request }) => {
    /*
     * John's question after the bug: "Should there not be checks when a game
     * starts about this sort of thing?" This is that check, asked of the
     * door rather than of the function — a game that cannot be won is
     * refused with a reason, not written and discovered six moves later.
     */
    const refused = await request.post("/api/games/live", {
      data: {
        variant: "freestyle",
        size: 9,
        winLength: 19,
        blackName: "Aki",
        whiteName: "Bo",
        opener: "black",
        rated: false,
      },
    });
    expect(refused.status(), "19 in a row on a 9×9 board was accepted").toBe(422);
    expect(await refused.text()).toContain("will not fit");
  });

  test("a game can be resigned by the person sitting in it", async ({ request }) => {
    const game = await start(request, { variant: "tictactoe", size: 3 });
    await play(request, game, "black", 1, 1);

    const gone = await request.post(`/api/games/${game.id}/resign`, {
      data: { token: game.whiteToken },
    });
    expect(gone.status(), await gone.text()).toBe(200);

    const done = await read(request, game.id);
    expect(done.status, "resigning did not end the game").toBe("finished");
    expect(done.winner).toBe("black");
  });
});
