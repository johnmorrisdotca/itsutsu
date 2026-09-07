import { expect, test } from "@playwright/test";
import { playAt, playSequence, winningSequence } from "./support";

test.describe("the game record", () => {
  test("a finished game is filed and can be replayed", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/");

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

    await rows.first().getByRole("link").click();

    // The replay opens at the final position and steps backwards.
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByRole("button", { name: /^H8, empty$/ })).toBeVisible();
    await page.getByTestId("replay-forward").click();
    await expect(page.getByRole("button", { name: "D8, Black stone" })).toBeVisible();
  });

  test("filters narrow the record and survive a reload", async ({ page }) => {
    await page.goto("/history?result=white&size=19");

    await expect(page.getByTestId("history-result")).toHaveValue("white");
    await page.reload();
    await expect(page.getByTestId("history-result")).toHaveValue("white");
  });

  test("an unfinished game is not filed", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/");

    const stamp = `Unfinished${Date.now()}`;
    await page.getByLabel(/Player 1/).first().fill(stamp);
    await playAt(page, 15, 7, 7);

    await page.goto(`/history?search=${stamp}`);
    await expect(page.getByText(/No games match/)).toBeVisible();
  });
});
