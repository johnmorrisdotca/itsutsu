import { expect, test } from "@playwright/test";
import { playerSlug } from "../src/lib/rating/playerKey";
import { playAt, playSequence, ready, winningSequence } from "./support";

test.describe("the game record", () => {
  test("a finished game is filed and can be replayed", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku/play");

    // Name the players so this game is findable among the rest.
    const stamp = `Tester${Date.now()}`;
    await page.getByLabel(/Player 1/).first().fill(stamp);

    await playSequence(page, 15, winningSequence());
    await expect(page.getByText(/wins in 9 moves/)).toBeVisible();

    /*
     * A board is written to the server by a mirror running in the background,
     * so the game is filed a moment AFTER the winning stone is drawn. Alone
     * that moment is imperceptible; under a full suite the machine is busy and
     * it can outlast the default patience — which is how this passed on its
     * own and failed in the suite, pointing at the record page rather than at
     * the mirror.
     *
     * Waited for longer, not asserted more loosely: the claim is still that
     * exactly one game is filed under this name. See the row about a game
     * refreshed a second after a move, which is the same mirror seen from the
     * other side.
     */
    await page.goto(`/history?search=${stamp}`);
    const rows = page.getByTestId("history-list").getByRole("listitem");
    await expect(rows).toHaveCount(1, { timeout: 30_000 });
    await expect(rows.first()).toContainText(stamp);
    await expect(rows.first()).toContainText("9 moves");

    // A named player's name leads to their page; the rest of the row is the replay.
    await expect(rows.first().getByTestId("history-player")).toHaveAttribute("href", `/players/${playerSlug(stamp)}`);
    await rows.first().getByRole("link", { name: /^Replay:/ }).click();

    // The replay opens at the final position and steps backwards.
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
    await expect(page.getByTestId("move-made-at")).toBeVisible();
    /*
     * The replay's arrows, its scrubber and its keyboard are all the client
     * component's: the buttons are server-rendered and real before React
     * attaches, and a press then moves nothing — which fails several lines
     * down on a stone that never appeared.
     */
    await ready(page, "game-replay");
    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByRole("button", { name: /^H8, empty$/ })).toBeVisible();
    // At move 0 the line under the count says when the game started, so nothing jumps.
    await expect(page.getByTestId("replay-started-at")).toContainText("started");
    await page.getByTestId("replay-forward").click();
    await expect(page.getByRole("button", { name: "D8, Black stone" })).toBeVisible();
    // The arrow keys walk the record too.
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("button", { name: "A15, White stone" })).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("button", { name: /^A15, empty$/ })).toBeVisible();
    await page.keyboard.press("End");
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
  });

  test("filters narrow the record and survive a reload", async ({ page }) => {
    await page.goto("/history?result=white&size=19");

    await expect(page.getByTestId("history-result")).toHaveValue("white");
    await page.reload();
    await expect(page.getByTestId("history-result")).toHaveValue("white");
  });

  test("one game's record is a collection with its own address", async ({ page }) => {
    await page.goto("/games/gomoku/history?result=white");
    await expect(page.getByTestId("record-game")).toContainText("Gomoku");
    await expect(page.getByTestId("history-game")).toHaveValue("freestyle");
    // The other filters ride along in the query.
    await expect(page.getByTestId("history-result")).toHaveValue("white");
    // Choosing another game moves to its record and keeps them.
    // The filter bar is server-rendered, so a choice made before it is
    // listening goes nowhere and the address never changes.
    await ready(page, "history-filters");
    await page.getByTestId("history-game").selectOption("renju");
    await expect(page).toHaveURL(/\/games\/renju\/history\?result=white$/);
    await page.getByTestId("history-game").selectOption("all");
    await expect(page).toHaveURL(/\/history\?result=white$/);
  });

  test("an unfinished game is not filed", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku/play");

    const stamp = `Unfinished${Date.now()}`;
    await page.getByLabel(/Player 1/).first().fill(stamp);
    await playAt(page, 15, 7, 7);

    await page.goto(`/history?search=${stamp}`);
    await expect(page.getByText(/No games match/)).toBeVisible();
  });
});
