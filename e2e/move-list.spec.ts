import { expect, test } from "@playwright/test";
import { ready } from "./support";

/**
 * The moves of a game, where a game is read.
 *
 * John, twice: "WHERE ARE THE GAMES PLAYED WHEN VIEWING A GAME??? where is the
 * game history???" A practice game against yourself listed its moves all
 * along; a real game — being played, or finished — showed a board and a count.
 *
 * So this asserts the list is THERE and that it says the right moves, on both
 * of the pages a real game is read on.
 */
async function playedGame(request: import("@playwright/test").APIRequestContext) {
  const made = await request.post("/api/games/live", {
    data: {
      variant: "tictactoe",
      size: 3,
      blackName: "Aki",
      whiteName: "Bo",
      opener: "black",
      rated: false,
    },
  });
  expect(made.status(), await made.text()).toBe(201);
  const game = (await made.json()) as { id: string; blackToken: string; whiteToken: string };

  const at: [number, number][] = [
    [0, 0],
    [1, 1],
    [0, 1],
    [2, 2],
  ];
  for (const [i, [row, col]] of at.entries()) {
    const token = i % 2 === 0 ? game.blackToken : game.whiteToken;
    const played = await request.post(`/api/games/${game.id}/moves`, { data: { token, row, col } });
    expect(played.status(), await played.text()).toBe(201);
  }
  return game;
}

test.describe("the moves of a game are listed where the game is read", () => {
  test("on a game still being played", async ({ page, request }) => {
    const game = await playedGame(request);
    await page.goto(`/games/tic-tac-toe/match/${game.id}/seat/${game.blackToken}`);

    const list = page.getByTestId("live-moves");
    await expect(list, "a match showed a board and a move count and no moves").toBeVisible();
    await expect(list.getByTestId("played-move")).toHaveCount(4);

    // The first stone was A3 on a three-by-three board: top-left.
    await expect(list.getByTestId("played-move").first()).toContainText("A3");
  });

  test("on a finished game, where each move is a position to go to", async ({ page, request }) => {
    const game = await playedGame(request);
    // Black takes the top row and the game ends.
    await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 0, col: 2 },
    });

    await page.goto(`/games/tic-tac-toe/match/${game.id}`);
    const list = page.getByTestId("played-moves");
    await expect(list).toBeVisible();
    await expect(list.getByTestId("played-move")).toHaveCount(5);

    /*
     * Clicking a move goes to that position. That is the whole reason a
     * record is worth reading — stopping where you meant to.
     */
    // The moves are buttons on the replay's own component, so a press before
    // it is listening moves the scrubber nowhere.
    await ready(page, "game-replay");
    await list.getByTestId("played-move").nth(1).click();
    await expect(page.getByTestId("replay-scrubber")).toHaveValue("2");
  });
});
