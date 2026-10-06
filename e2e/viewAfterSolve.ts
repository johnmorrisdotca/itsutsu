import { expect, type Page } from "@playwright/test";

/**
 * A SOLVED BIG BOARD IS STILL A MAP. John, 2026-10-06, on a phone, with a solved Meikyuu maze he could neither zoom nor move: the
 * boards looked at through the shared box (`TsunagiViewport`) must keep their pad, the wheel and two fingers once the puzzle says
 * "Solved". `name` is the box's name (`tsunagi`, `mahjong`, `picture`, `bridges`, `jirai`, `numbers`); the box's own `data-zoom` is what
 * is read, so it is the view and not a picture of it that is checked.
 *
 * THE WIN'S COVER COMES FIRST. A solve made on the page lays its cover over the board and the pad under it (`WinCover`): a flash that
 * takes no press for 700 ms, then a card that takes every one, the wheel included. A reader presses See the board before moving the
 * map, so this does too (as `meikyuu-after-solve` does). Left out, the helper passed or failed on how long its own first steps took:
 * Fit was pressed under the flash and the wheel under the card, or on a slow runner Fit was met by the card, 300 s at a desk's 1,024
 * squares (CI run 37461308079, `jirai-huge`).
 */
export async function viewStillMovesAfterSolve(page: Page, name: string, { pinch = false }: { pinch?: boolean } = {}) {
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  // The card comes up when the flash is over; See the board is the reader's way to the map under it.
  await page.getByTestId("win-cover-see-board").click();
  await expect(page.getByTestId("win-cover-layer"), "the win's cover did not close").toHaveCount(0);
  const box = page.getByTestId(`${name}-viewport`);
  const zoom = async () => Number((await box.getAttribute("data-zoom")) ?? "0");
  await box.scrollIntoViewIfNeeded();
  await expect(page.getByTestId(`${name}-pad`), "a solved board lost its pad").toBeVisible();
  // Fit puts the whole board in view.
  await page.getByTestId(`${name}-fit`).first().click();
  await expect.poll(zoom, "Fit does not put a solved board whole in view").toBeCloseTo(1, 1);
  const rect = (await box.boundingBox())!;
  const middle = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  // Two fingers spread on the whole board zoom it in (a pinch out has room only from the whole board).
  if (pinch) {
    const session = await page.context().newCDPSession(page);
    const before = await zoom();
    const at = (gap: number) => [
      { x: middle.x - gap, y: middle.y, id: 1 },
      { x: middle.x + gap, y: middle.y, id: 2 },
    ];
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(20) });
    for (const gap of [40, 70, 100]) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(gap) });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(zoom, "two fingers do not zoom a solved board").not.toBeCloseTo(before, 1);
  }
  // The wheel zooms it in, about the pointer.
  await page.mouse.move(middle.x, middle.y);
  await page.mouse.wheel(0, -600);
  await expect.poll(zoom, "the wheel does not zoom a solved board").toBeGreaterThan(1.2);
  // The pad moves it, and Fit brings it whole again.
  const pad = page.getByTestId(`${name}-pad-in`);
  if ((await pad.count()) > 0) {
    const nearer = await zoom();
    await pad.click();
    await expect.poll(zoom, "the pad's zoom in does not zoom a solved board").toBeGreaterThanOrEqual(nearer);
  }
  await page.getByTestId(`${name}-fit`).first().click();
  await expect.poll(zoom, "Fit does not bring a solved board back whole").toBeCloseTo(1, 1);
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
}
