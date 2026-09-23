import { expect, test } from "@playwright/test";

import { readyHere } from "./support";

/**
 * A game still being played, as a picture of every position so far — drawn by itself
 * under the move list, made in the browser from the moves the board holds.
 */
test("a live board's positions so far are one picture, drawn by itself in the browser, and the moves sit beside the board", async ({ page, request }) => {
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

  // No fold and no button: the picture is there, drawn by itself.
  const panel = page.getByTestId("visual-moves");
  const picture = panel.getByTestId("mosaic-picture");
  await expect(picture).toBeVisible();
  expect(await picture.getAttribute("alt")).toBe("Every position of this game so far, 3 moves");

  /*
   * Drawing it again asks the site for nothing: the switch redraws it by
   * itself, and every request meanwhile is counted — less the dev server's
   * code files and the board's own poll, which asks on its own clock whether
   * anybody is drawing or not.
   */
  const asked: string[] = [];
  page.on("request", (sent) => {
    if (!sent.url().startsWith("http")) return;
    const path = new URL(sent.url()).pathname;
    if (!path.startsWith("/_next/") && path !== `/api/games/${game.id}`) asked.push(path);
  });
  const before = await picture.getAttribute("src");
  await panel.getByTestId("mosaic-fill").uncheck();
  await expect(picture).not.toHaveAttribute("src", before!);
  expect(asked).toEqual([]);
  await expect(panel.getByTestId("make-mosaic")).toHaveCount(0);

  // The moves are in the panel beside the board.
  await expect(page.getByTestId("live-moves-panel").getByTestId("live-moves")).toContainText("E5");

  const download = page.waitForEvent("download");
  await panel.getByTestId("download-mosaic").click();
  expect((await download).suggestedFilename()).toBe(`itsutsu-gomoku-${game.id}-move-3.png`);
});
