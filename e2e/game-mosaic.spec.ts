import { expect, test } from "@playwright/test";

import { ready, winningSequence } from "./support";

/**
 * A finished game made into one picture of every position, in the reader's
 * browser, and offered as a file.
 *
 * The page asks the server for nothing while it does it: the spec counts the
 * requests the press sends and expects none. That is the whole of John's
 * condition for the feature — "don't do them on the server… I want to avoid
 * making features that… would waste server time" — so it is asserted, not
 * assumed.
 */
test("a finished game becomes one picture of every move, drawn in the browser and downloadable", async ({ page, request }) => {
  const made = await request.post("/api/games/live", { data: { size: 9 } });
  expect(made.status(), await made.text()).toBe(201);
  const game = (await made.json()) as { id: string; blackToken: string; whiteToken: string };
  // Nine stones, black making five along row 7 — the same line every replay spec plays, and it fits 9×9.
  for (const [index, [row, col]] of winningSequence().entries()) {
    const played = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: index % 2 === 0 ? game.blackToken : game.whiteToken, row, col },
    });
    expect(played.status(), await played.text()).toBe(201);
  }

  await page.goto(`/games/gomoku/match/${game.id}`);
  await ready(page, "game-mosaic");

  /*
   * Everything the site is asked for, less the dev server's code files (a chunk
   * loaded the first time something is pressed is a file, not work done for the
   * picture) — and less the picture itself, which is a blob in this browser.
   */
  const asked: string[] = [];
  page.on("request", (sent) => {
    if (!sent.url().startsWith("http")) return;
    const path = new URL(sent.url()).pathname;
    if (!path.startsWith("/_next/")) asked.push(path);
  });

  await page.getByTestId("make-mosaic").click();
  const picture = page.getByTestId("mosaic-picture");
  await expect(picture).toBeVisible();
  // A real picture, decoded: wider than it is tall, as a screen is.
  const shape = await picture.evaluate((image: HTMLImageElement) => ({ width: image.naturalWidth, height: image.naturalHeight }));
  expect(shape.width).toBeGreaterThan(shape.height);
  expect(asked, "making the picture asked the server for something").toEqual([]);

  const download = page.waitForEvent("download");
  await page.getByTestId("download-mosaic").click();
  expect((await download).suggestedFilename()).toBe(`itsutsu-gomoku-${game.id}.png`);
});
