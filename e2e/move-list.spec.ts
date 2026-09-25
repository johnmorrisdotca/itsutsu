import { expect, test } from "@playwright/test";
import { ready } from "./support";
import { namesPlayedUnder } from "./tidy";

/** The names this file's games are played under, which outlive the games. See `namesPlayedUnder`. */
const under = namesPlayedUnder();

/** Distinct per game, so two made in one millisecond are still two names. */
let games = 0;

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
  games += 1;
  const stamp = `${Date.now().toString(36)}${games}`;
  const made = await request.post("/api/games/live", {
    data: {
      variant: "tictactoe",
      size: 3,
      blackName: under(`Aki ${stamp}`),
      whiteName: under(`Bo ${stamp}`),
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

/*
 * WHAT A READER CHOOSES ABOUT A FINISHED GAME'S RECORD IS KEPT. John,
 * 2026-09-25: "Show move numbers needs memory, we lose it on refresh", "Move
 * list I thought I asked for ability to be in multi-formats", and "Moves might
 * be collapsed or hidden naturally as some people might not want it." Each is
 * chosen by pressing it, read back after a reload, and put back as it was,
 * since the suite's operator is one account every spec shares.
 */
test.describe("a finished game's record remembers how the reader reads it", () => {
  async function finished(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
    const game = await playedGame(request);
    await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 0, col: 2 } });
    await page.goto(`/games/tic-tac-toe/match/${game.id}`);
    await ready(page, "game-replay");
    return game;
  }
  const saved = (page: import("@playwright/test").Page) =>
    page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");

  test("move numbers stay on after a reload", async ({ page, request }) => {
    await finished(page, request);
    const numbers = page.getByTestId("show-move-numbers");
    await expect(numbers).toHaveText("Show move numbers");
    let wrote = saved(page);
    await numbers.click();
    expect((await wrote).ok()).toBe(true);
    await page.reload();
    await ready(page, "game-replay");
    await expect(numbers).toHaveText("Hide move numbers");
    wrote = saved(page);
    await numbers.click();
    expect((await wrote).ok()).toBe(true);
  });

  test("the moves are written in the format chosen, and still are after a reload", async ({ page, request }) => {
    await finished(page, request);
    const list = page.getByTestId("played-moves");
    // Ours: one a line, the first stone at the top left of three by three is A3.
    await expect(list).toHaveAttribute("data-format", "itsutsu");
    await expect(list.getByTestId("played-line")).toHaveCount(5);
    const wrote = saved(page);
    await page.getByTestId("move-format-itsYourTurn").click();
    expect((await wrote).ok()).toBe(true);
    // ItsYourTurn's: two a line, lower case, rows counted as ours are — a3.
    await expect(list.getByTestId("played-line")).toHaveCount(3);
    await expect(list.getByTestId("played-move").first()).toContainText("a3");
    await expect(page.getByTestId("move-list")).toContainText("1. a3");

    await page.reload();
    await ready(page, "game-replay");
    await expect(page.getByTestId("played-moves")).toHaveAttribute("data-format", "itsYourTurn");
    const back = saved(page);
    await page.getByTestId("move-format-itsutsu").click();
    expect((await back).ok()).toBe(true);
  });

  test("the moves fold away, and stay folded after a reload", async ({ page, request }) => {
    await finished(page, request);
    const fold = page.getByTestId("moves-fold");
    await expect(fold).toHaveAttribute("open", "");
    let wrote = saved(page);
    await fold.locator("summary").click();
    expect((await wrote).ok()).toBe(true);
    await expect(page.getByTestId("played-moves")).toBeHidden();

    await page.reload();
    await ready(page, "game-replay");
    await expect(page.getByTestId("moves-fold")).not.toHaveAttribute("open", /.*/);
    await expect(page.getByTestId("played-moves")).toBeHidden();
    wrote = saved(page);
    await page.getByTestId("moves-fold").locator("summary").click();
    expect((await wrote).ok()).toBe(true);
    await expect(page.getByTestId("played-moves")).toBeVisible();
  });
});
