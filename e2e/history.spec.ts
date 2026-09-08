import { expect, test } from "@playwright/test";
import { playAt, playSequence, winningSequence } from "./support";

test.describe("the game record", () => {
  test("a finished game is filed and can be replayed", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");

    // Name the players so this game is findable among the rest.
    const stamp = `Tester${Date.now()}`;
    await page.getByLabel(/Player 1/).first().fill(stamp);

    await playSequence(page, 15, winningSequence());
    await expect(page.getByText(/wins in 9 moves/)).toBeVisible();

    await page.goto(`/history?search=${stamp}`);
    const rows = page.getByTestId("history-list").getByRole("listitem");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(stamp);
    await expect(rows.first()).toContainText("9 moves");

    // A named player's name leads to their page; the rest of the row is the replay.
    await expect(rows.first().getByTestId("history-player")).toHaveAttribute("href", `/players/${encodeURIComponent(stamp)}`);
    await rows.first().getByRole("link", { name: /^Replay:/ }).click();

    // The replay opens at the final position and steps backwards.
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
    await expect(page.getByTestId("move-made-at")).toBeVisible();
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
    await page.goto("/history/gomoku?result=white");
    await expect(page.getByTestId("record-game")).toContainText("Freestyle");
    await expect(page.getByTestId("history-game")).toHaveValue("freestyle");
    // The other filters ride along in the query.
    await expect(page.getByTestId("history-result")).toHaveValue("white");
    // Choosing another game moves to its record and keeps them.
    await page.getByTestId("history-game").selectOption("renju");
    await expect(page).toHaveURL(/\/history\/renju\?result=white$/);
    await page.getByTestId("history-game").selectOption("all");
    await expect(page).toHaveURL(/\/history\?result=white$/);
  });

  test("an unfinished game is not filed", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");

    const stamp = `Unfinished${Date.now()}`;
    await page.getByLabel(/Player 1/).first().fill(stamp);
    await playAt(page, 15, 7, 7);

    await page.goto(`/history?search=${stamp}`);
    await expect(page.getByText(/No games match/)).toBeVisible();
  });
});
