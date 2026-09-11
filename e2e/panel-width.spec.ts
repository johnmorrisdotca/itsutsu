import { expect, test } from "@playwright/test";

import { openAdvanced, openSetup } from "./support";

/**
 * A control stays inside the panel it is in.
 *
 * The settings panel carries selects whose options are sentences rather than
 * words — "Loses the turn. Three in a row lose the game" is one — and a
 * select is sized by its content unless it is told otherwise. One of them ran
 * past the panel's right edge.
 *
 * The fix belongs to the control rather than to the panel, and it is in
 * SELECT_CLASS, which every select on the site shares: a minimum width of
 * nothing, a maximum of the container, and an ellipsis. So this measures the
 * selects rather than reading the class, and it does it with the longest
 * option of each actually chosen — a select showing its shortest option would
 * pass whatever the class said.
 */
test.describe("the settings panel on a phone", () => {
  test("keeps every select inside its own row, at the longest option each has", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/games/gomoku/play");
    await openAdvanced(page);
    await openSetup(page);

    const selects = page.locator("select");
    const count = await selects.count();
    expect(count, "no selects on the settings panel to measure").toBeGreaterThan(4);

    /*
     * Only the ones whose options are sentences. Changing every select on the
     * panel re-makes the game between each, which is slow and proves nothing
     * extra: the overflow was always about option text, and these are the
     * three that carry any.
     */
    for (const name of ["timeout-penalty", "draw-limit", "time-control"]) {
      const select = page.getByTestId(name);
      if ((await select.count()) === 0) continue;
      const longest = await select.evaluate((el) => {
        const box = el as HTMLSelectElement;
        let best = box.value;
        let length = 0;
        for (const option of Array.from(box.options)) {
          if (option.text.length > length) {
            length = option.text.length;
            best = option.value;
          }
        }
        return best;
      });
      await select.selectOption(longest).catch(() => undefined);
    }

    for (let i = 0; i < count; i += 1) {
      const select = selects.nth(i);
      if (!(await select.isVisible())) continue;
      const over = await select.evaluate((el) => {
        const own = el.getBoundingClientRect();
        const parent = el.parentElement?.getBoundingClientRect();
        return parent === undefined ? 0 : Math.round(own.right - parent.right);
      });
      const name = (await select.getAttribute("data-testid")) ?? `select ${i + 1}`;
      expect(over, `${name} runs ${over}px past its row`).toBeLessThanOrEqual(1);
    }
  });
});

/**
 * The page itself does not scroll sideways on a narrow phone.
 *
 * Separate from the test above, and it has to be: every select sat inside its
 * own row at 360 and the page still scrolled 11px, because the row it sat in
 * was the thing that was too wide. A test that measures children against their
 * parent cannot see a parent that is wrong — it asks whether the panel is
 * self-consistent, not whether it fits the screen.
 *
 * The numbers were the tell. The overflow was 51px at 320, 11px at 360 and
 * none at 375, which is one width — 371 — reached from three directions: the
 * set-up grid's single column was an implicit auto track, so it sized to its
 * content once and never shrank again.
 */
test.describe("the whole page on a narrow phone", () => {
  for (const width of [320, 360, 375]) {
    test(`does not scroll sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/games/gomoku/play");
      // Open the set-up, because that is where the grid is: a folded panel
      // cannot overflow, so a test that never opens it always passes.
      await openAdvanced(page);
      await openSetup(page);

      const over = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(over, `the page scrolls ${over}px sideways at ${width}px`).toBe(0);
    });
  }
});
