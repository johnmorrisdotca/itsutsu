import { expect, test } from "@playwright/test";

import { readyHere } from "./support";

/**
 * A game still being played, as a picture of every position so far — folded
 * under the move list, made in the browser from the moves the board holds.
 */
test("a live board's positions so far become one picture, drawn in the browser", async ({ page, request }) => {
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
  const fold = page.getByTestId("visual-moves");
  await fold.locator("summary").click();
  await readyHere(page.getByTestId("shared-game"));

  /*
   * What the site is asked while the picture is made. The board's own poll is
   * left out by name: it asks on its own clock whether anybody is drawing or
   * not, and is not work done for the picture.
   */
  const asked: string[] = [];
  page.on("request", (sent) => {
    if (!sent.url().startsWith("http")) return;
    const path = new URL(sent.url()).pathname;
    if (!path.startsWith("/_next/") && path !== `/api/games/${game.id}`) asked.push(path);
  });
  await fold.getByTestId("make-mosaic").click();
  const picture = fold.getByTestId("mosaic-picture");
  await expect(picture).toBeVisible();
  expect(await picture.getAttribute("alt")).toBe("Every position of this game so far, 3 moves");
  expect(asked).toEqual([]);

  const download = page.waitForEvent("download");
  await fold.getByTestId("download-mosaic").click();
  expect((await download).suggestedFilename()).toBe(`itsutsu-gomoku-${game.id}-move-3.png`);
});
