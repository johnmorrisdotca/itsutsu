import { expect, test } from "@playwright/test";

import { memberContext, seedMember } from "./members";

/**
 * A row is a row, whatever is in it.
 *
 * A row's height belongs to the table, not to whether that particular row
 * happens to offer any controls. Your own row has nobody to befriend, and a
 * kept record — somebody with a name and a history and no account — has
 * nobody to challenge. A row that shrinks when its buttons go reads as a
 * different kind of thing from the rows around it.
 *
 * This is the guard rather than the fix: the fix is that the cell holding a
 * row's controls keeps its height either way, and this fails if anybody ever
 * takes that away again.
 */
test.describe("every row in a table is the same height", () => {
  test("on the players directory, whoever the rows belong to", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `even-${stamp}@example.test`, name: `Even ${stamp}` };
    await seedMember(me);
    // Somebody else, so there is a row with controls beside the one without.
    await seedMember({ email: `other-${stamp}@example.test`, name: `Other ${stamp}` });

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();
    await page.goto("/players");

    // The directory alone: the page holds other tables with no controls at all.
    const rows = page.getByTestId("directory").locator("tbody tr");
    const count = await rows.count();
    expect(count, "the directory should have rows to compare").toBeGreaterThan(1);

    const heights: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const box = await rows.nth(index).boundingBox();
      if (box !== null) heights.push(Math.round(box.height));
    }
    // Every row the same, including this member's own — which is the one with
    // no buddy or ignore button, and the one that used to be shorter.
    expect(new Set(heights).size, `heights were ${heights.join(", ")}`).toBe(1);

    await context.close();
  });

  test("on the operator's members list, where a kept record has no account", async ({ browser }) => {
    // Chibi and Kyokosan are members with no address: nothing to shut, nothing
    // to rename, and so no buttons on their rows.
    const context = await browser.newContext({ storageState: ".auth/admin.json" });
    const page = await context.newPage();
    await page.goto("/admin");

    const rows = page.getByTestId("admin-members").locator("li");
    const count = await rows.count();
    if (count > 1) {
      const heights: number[] = [];
      for (let index = 0; index < count; index += 1) {
        const box = await rows.nth(index).boundingBox();
        if (box !== null) heights.push(Math.round(box.height));
      }
      expect(new Set(heights).size, `heights were ${heights.join(", ")}`).toBe(1);
    }

    await context.close();
  });
});
