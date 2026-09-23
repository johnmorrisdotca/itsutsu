import { expect, test } from "@playwright/test";

import { readyHere } from "./support";

/**
 * A game still being played: its moves beside the board, and every position so
 * far as one picture in a window opened from beside them, drawn in the browser.
 */
test("a live board's moves sit beside it, and open as one picture of every position so far, in a window", async ({ page, request }) => {
  const made = await request.post("/api/games/live", { data: { size: 9 } });
  expect(made.status(), await made.text()).toBe(201);
  const game = (await made.json()) as { id: string; blackToken: string; whiteToken: string };
  for (const [index, [row, col]] of ([[4, 4], [4, 5], [3, 3]] as const).entries()) {
    const played = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: index % 2 === 0 ? game.blackToken : game.whiteToken, row, col },
    });
    expect(played.status(), await played.text()).toBe(201);
  }

  await page.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);
  await readyHere(page.getByTestId("shared-game"));

  // The moves are in the panel beside the board, and beside them the quiet way into the picture.
  const panel = page.getByTestId("live-moves-panel");
  await expect(panel.getByTestId("live-moves")).toContainText("E5");
  await expect(page.getByTestId("mosaic-picture")).toHaveCount(0);
  const open = panel.getByTestId("open-mosaic");
  await readyHere(open);

  /*
   * Opening it asks the site for nothing: every request meanwhile is counted —
   * less the dev server's code files and the board's own poll, which asks on
   * its own clock whether anybody is drawing or not.
   */
  const asked: string[] = [];
  page.on("request", (sent) => {
    if (!sent.url().startsWith("http")) return;
    const path = new URL(sent.url()).pathname;
    if (!path.startsWith("/_next/") && path !== `/api/games/${game.id}`) asked.push(path);
  });
  await open.click();
  const dialog = page.getByTestId("mosaic-dialog");
  const picture = dialog.getByTestId("mosaic-picture");
  await expect(picture).toBeVisible();
  expect(await picture.getAttribute("alt")).toBe("Every position of this game so far, 3 moves");
  expect(asked).toEqual([]);

  const download = page.waitForEvent("download");
  await dialog.getByTestId("download-mosaic").click();
  expect((await download).suggestedFilename()).toBe(`itsutsu-gomoku-${game.id}-move-3.png`);
});

