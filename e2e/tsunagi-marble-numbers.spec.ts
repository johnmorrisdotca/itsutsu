import { expect, test, type Locator, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * EVERY MARBLE'S NUMBER SITS INSIDE ITS MARBLE. John, 2026-09-28, on Tsunagi's
 * set-up at 12×12 in Numbers: "higher levels have numbers that are too big
 * since the squares have gotten smaller." The number was a fixed font size, so
 * on a big board a 16 was wider than the marble it was written on.
 *
 * At 4×4, 9×9 and 12×12 (both with two-digit numbers), on a phone and on a
 * desktop, the reader chooses Numbers on the set-up screen, looks at the
 * preview, presses Start and looks at the board in play: every marble's number,
 * measured as the text itself (a range over it, not the box holding it), lies
 * inside its marble's box, and no wider than most of the marble, so it stays
 * off the round edge too.
 */
const AT = "/games/tsunagi";
const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
] as const;
const SIZES = [
  { size: 4, twoDigits: false },
  { size: 9, twoDigits: true },
  { size: 12, twoDigits: true },
] as const;

/** Every marble under `root`, its number's text box against the marble's own box. */
async function numbersInside(root: Locator, twoDigits: boolean, testId = "tsunagi-marble") {
  await expect(root.getByTestId(testId).first()).toBeVisible();
  const found = await root.evaluate((element, id) =>
    [...element.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)].map((marble) => {
      const range = document.createRange();
      range.selectNodeContents(marble);
      const text = range.getBoundingClientRect();
      const box = marble.getBoundingClientRect();
      return {
        number: marble.textContent ?? "",
        inside: text.left >= box.left - 0.5 && text.right <= box.right + 0.5 && text.top >= box.top - 0.5 && text.bottom <= box.bottom + 0.5,
        // A number as wide as the marble's box would still cross its round edge.
        clearOfEdge: text.width <= box.width * 0.8,
        text: `${text.width.toFixed(1)}×${text.height.toFixed(1)}`,
        marble: `${box.width.toFixed(1)}×${box.height.toFixed(1)}`,
      };
    }),
    testId,
  );
  expect(found.length).toBeGreaterThan(0);
  // Numbers, not colours: every marble carries its number.
  for (const each of found) expect(each.number).toMatch(/^\d{1,3}$/);
  if (twoDigits) expect(found.some((each) => each.number.length >= 2), "there is a number of two digits or more to measure").toBe(true);
  const spilling = found.filter((each) => !each.inside || !each.clearOfEdge);
  expect(spilling, "every number sits inside its marble").toEqual([]);
}

async function chooseNumbers(page: Page, size: number) {
  await page.goto(`${AT}/new?size=${size}`);
  await ready(page, "puzzle-set-up");
  await page.getByTestId("tsunagi-marks-numbers").click();
  await expect(page.getByTestId("tsunagi-marks-numbers")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("tsunagi-preview")).toHaveAttribute("data-drawn", "true");
}

for (const viewport of VIEWPORTS) {
  test.describe(`Tsunagi's numbers fit their marbles on a ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const { size, twoDigits } of SIZES) {
      test(`at ${size}×${size}, in the set-up preview and in play`, async ({ page }) => {
        await chooseNumbers(page, size);
        await numbersInside(page.getByTestId("tsunagi-preview"), twoDigits);

        await page.getByTestId("puzzle-solve").click();
        await ready(page, "puzzle-play");
        await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-marks", "numbers");
        await numbersInside(page.getByTestId("puzzle-grid"), twoDigits);
      });
    }
  });
}

test.describe("Tsunagi's numbers fit their marbles zoomed in", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("at 12×12 on a phone, zoomed and back at Fit", async ({ page }) => {
    await chooseNumbers(page, 12);
    await page.getByTestId("puzzle-solve").click();
    await ready(page, "puzzle-play");
    await page.getByTestId("tsunagi-arrows").click();
    await page.getByTestId("tsunagi-pad-in").click();
    await expect(page.getByTestId("tsunagi-viewport")).toHaveAttribute("data-zoom", "1.50");
    await numbersInside(page.getByTestId("puzzle-grid"), true);
    await page.getByTestId("tsunagi-fit").click();
    await expect(page.getByTestId("tsunagi-viewport")).toHaveAttribute("data-zoom", "1.00");
    await numbersInside(page.getByTestId("puzzle-grid"), true);
  });
});

test.describe("Tsunagi's solved levels carry their number on a marble too", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("at 12×12, the last block's three-digit levels sit inside their marbles", async ({ page }) => {
    // Every level solved in this browser, as a player who has finished them all would have it.
    const solved = JSON.stringify(Object.fromEntries(Array.from({ length: 128 }, (_, at) => [at + 1, 60_000])));
    await page.addInitScript((record) => window.localStorage.setItem("itsutsu.tsunagi.solved.12@2026-09-26", record), solved);
    await page.goto(`${AT}/new?size=12`);
    await ready(page, "puzzle-set-up");
    const block = page.getByTestId("tsunagi-block");
    for (let turn = 0; turn < 8 && !(await block.textContent())?.startsWith("Block 8 of 8"); turn += 1) await page.getByTestId("tsunagi-block-on").click();
    await expect(block).toHaveText("Block 8 of 8 · levels 113–128");
    await numbersInside(page.getByTestId("tsunagi-levels"), true, "tsunagi-level-marble");
  });
});
