import { expect, test, type Locator } from "@playwright/test";

import { readyHere } from "./support";

/**
 * The picture of every position in its two shapes. John, 2026-09-25, looking
 * at AlphaGo against Lee Sedol as one picture: a bar across the top naming the
 * game, a grid that ends on its last tile, and "a 1080P shape and a vertical
 * iPhone popular format shape". It starts on the shape the reader's screen is,
 * and the other is one press away.
 *
 * Driven on the famous games because they need no seat and no database rows:
 * the record is in the source, so the spec brings its own world.
 */
const FINAL = '[data-testid="famous-game"][data-id="alphago-leesedol-4"]';

/** The picture's own pixels, once the browser has decoded it. */
async function pixels(picture: Locator): Promise<{ width: number; height: number }> {
  return picture.evaluate(async (image: HTMLImageElement) => {
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  });
}

/** Opens AlphaGo against Lee Sedol's picture window. */
async function openFinal(page: import("@playwright/test").Page): Promise<Locator> {
  await page.goto("/famous");
  const open = page.locator(FINAL).getByTestId("open-mosaic");
  await readyHere(open);
  await open.click();
  const dialog = page.getByTestId("mosaic-dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

test("on a wide screen the picture starts landscape at 1920×1080's shape, and turns portrait at a press", async ({ page }) => {
  const dialog = await openFinal(page);
  const picture = dialog.getByTestId("mosaic-picture");

  await expect(dialog.getByTestId("mosaic-shape-landscape")).toBeChecked();
  await expect(picture).toHaveAttribute("data-shape", "landscape");
  const wide = await pixels(picture);
  expect(wide.width / wide.height).toBeCloseTo(1920 / 1080, 2);
  // 211 moves are more than one picture holds, so the choice of which is offered.
  await expect(dialog.getByTestId("mosaic-pick-spread")).toBeChecked();

  // Headed as ours, with its name and the game's (John, 2026-09-26), and the picture above what changes it.
  await expect(dialog.getByTestId("mosaic-masthead")).toContainText("Game wallpaper");
  await expect(dialog.getByTestId("mosaic-game-name")).toContainText("AlphaGo");
  const pictureBottom = (await picture.boundingBox())!;
  const controlsTop = (await dialog.getByTestId("mosaic-controls").boundingBox())!;
  expect(pictureBottom.y + pictureBottom.height).toBeLessThanOrEqual(controlsTop.y + 1);

  // The opening is a choice too, and choosing it draws the picture again; then back to the whole game.
  const before = await picture.getAttribute("src");
  await dialog.getByTestId("mosaic-pick-opening").check();
  await expect(picture).not.toHaveAttribute("src", before!);
  await dialog.getByTestId("mosaic-pick-spread").check();

  await dialog.getByTestId("mosaic-shape-portrait").check();
  await expect(picture).toHaveAttribute("data-shape", "portrait");
  const tall = await pixels(picture);
  expect(tall.width / tall.height).toBeCloseTo(1170 / 2532, 2);

  // And back again: the way there is not the only way tested.
  await dialog.getByTestId("mosaic-shape-landscape").check();
  await expect(picture).toHaveAttribute("data-shape", "landscape");
  const again = await pixels(picture);
  expect(again.width).toBeGreaterThan(again.height);

  const download = page.waitForEvent("download");
  await dialog.getByTestId("download-mosaic").click();
  expect((await download).suggestedFilename()).toBe("itsutsu-famous-alphago-leesedol-4.png");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the picture starts portrait, and the window fits the screen with nothing to scroll sideways", async ({ page }) => {
    const dialog = await openFinal(page);
    const picture = dialog.getByTestId("mosaic-picture");

    await expect(dialog.getByTestId("mosaic-shape-portrait")).toBeChecked();
    await expect(picture).toHaveAttribute("data-shape", "portrait");
    const tall = await pixels(picture);
    expect(tall.height).toBeGreaterThan(tall.width);

    const fits = await dialog.evaluate((element) => ({
      page: document.documentElement.scrollWidth,
      dialog: element.scrollWidth - element.clientWidth,
      picture: (element.querySelector('[data-testid="mosaic-picture"]') as HTMLElement).getBoundingClientRect().right,
    }));
    expect(fits.page).toBeLessThanOrEqual(390);
    expect(fits.dialog).toBeLessThanOrEqual(0);
    expect(fits.picture).toBeLessThanOrEqual(390);
  });
});
