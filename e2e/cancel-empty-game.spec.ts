import { expect, test } from "@playwright/test";

/**
 * Calling off a game nothing has happened in.
 *
 * John found the wrong word: a game with no moves offered "Resign" as its only
 * action, and resigning means giving up something under way. Nothing was.
 *
 * The word is the small half. The substance is that it must cost nobody
 * anything — not a resignation quietly corrected afterwards, but a path that
 * never rates the game at all. That is what these check.
 */
async function emptyGameAgainstDan(request: import("@playwright/test").APIRequestContext) {
  const made = await request.post("/api/games/live", {
    data: {
      variant: "freestyle",
      size: 9,
      blackName: "Someone",
      whiteName: "Dan",
      opener: "black",
      rated: true,
    },
  });
  expect(made.status(), await made.text()).toBe(201);
  return (await made.json()) as { id: string; blackToken: string };
}

test.describe("a game with nothing played in it", () => {
  test("is called off without a winner and without a result", async ({ request }) => {
    const game = await emptyGameAgainstDan(request);

    const off = await request.post(`/api/games/${game.id}/cancel`, {
      data: { token: game.blackToken },
    });
    expect(off.status(), await off.text()).toBe(200);

    const after = (await (await request.get(`/api/games/${game.id}`)).json()) as {
      status: string;
      winner: string | null;
      result: string;
      moveCount: number;
    };
    expect(after.status).toBe("finished");
    expect(after.winner, "calling off a game must not crown anybody").toBeNull();
    // The one thing the stored result can honestly say: it ended without one.
    expect(after.result).toBe("abandoned");
    expect(after.moveCount).toBe(0);
  });

  test("moves nobody's rating, which is the whole point of it", async ({ page, request }) => {
    /*
     * Read Dan's figures off Dan's own page either side of it. A resignation
     * would move them; calling off must not touch them at all.
     *
     * The page rather than an endpoint, because the page is where somebody
     * would notice. If a rating moved for a game nobody played, this is the
     * screen that would say so.
     */
    const figures = async () => {
      await page.goto("/players/dan");
      await expect(page.getByTestId("player-figures")).toBeVisible();
      return page.getByTestId("player-figures").innerText();
    };

    const before = await figures();
    const game = await emptyGameAgainstDan(request);
    const off = await request.post(`/api/games/${game.id}/cancel`, {
      data: { token: game.blackToken },
    });
    expect(off.status(), await off.text()).toBe(200);

    expect(await figures(), "calling off a game moved somebody's figures").toBe(before);
  });

  test("refuses to call off a game that has a stone on it", async ({ request }) => {
    // One stone and it is a game, and a game is resigned rather than called
    // off. Checked on the server against the record, not on the page.
    const game = await emptyGameAgainstDan(request);
    const moved = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(moved.status()).toBe(201);

    const off = await request.post(`/api/games/${game.id}/cancel`, {
      data: { token: game.blackToken },
    });
    expect(off.status(), "a played game must not be callable off").toBe(409);
  });
});
