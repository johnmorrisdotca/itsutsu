import { expect, test, type Page } from "@playwright/test";

import { memberIdFor, removeMember, seedMember } from "./members";
import { ready } from "./support";

/**
 * THE OPERATOR LOG KEEPS WHAT WAS DONE TO AN ACCOUNT.
 *
 * Driven the way the operator does it: the Shut button on the Members tab, its
 * confirm, the Log tab, the Open-it-again button, the Log tab again. Nothing is
 * set through the API and nothing reloads — a row that only appeared on a fresh
 * document would be a row the operator, clicking between tabs, never sees.
 *
 * It asserts only about rows for a member it made: other specs shut accounts on
 * this database too, and their rows are not this test's to count.
 */

async function openTab(page: Page, label: string) {
  await page.getByTestId("tab").filter({ hasText: label }).click();
}

test.describe("the operator log", () => {
  const stamp = Date.now().toString(36);
  const member = { email: `oplog-${stamp}@example.test`, name: `Oplog ${stamp}` };

  test.afterAll(async () => {
    await removeMember(member.email);
  });

  test("records a shut and an opening for the member they were done to", async ({ page }) => {
    await seedMember(member);
    const id = await memberIdFor(member.email);
    const rows = (action: string) =>
      page.locator(`[data-testid="operator-log-row"][data-subject="${id}"][data-action="${action}"]`);

    await page.goto("/admin?view=members");
    await ready(page, "admin-members");
    const row = page.getByTestId("admin-member").filter({ hasText: member.name });
    await expect(row).toHaveCount(1);

    // Shut it, the way the operator does: the button, then its confirm.
    await row.getByTestId("ban-member").click();
    // One row asks at a time, so the confirm is found on the page rather than guessed inside the row.
    await page.getByTestId("ban-member-yes").click();
    await expect(row.getByTestId("ban-member")).toHaveText(/Open it again/);

    await openTab(page, "The log");
    await expect(page).toHaveURL(/\?view=log$/);
    await expect(page.getByTestId("operator-log-table")).toBeVisible();
    await expect(rows("shut"), "the shut was not kept").toHaveCount(1);
    // Absent only after the table this row would be in has been drawn, and after the shut row is found.
    await expect(rows("restore")).toHaveCount(0);
    await expect(rows("shut")).toContainText(member.name);

    // Open it again, from the Members tab.
    await openTab(page, "The members");
    await ready(page, "admin-members");
    const again = page.getByTestId("admin-member").filter({ hasText: member.name });
    await again.getByTestId("ban-member").click();
    await expect(again.getByTestId("ban-member")).toHaveText(/Shut the account/);

    await openTab(page, "The log");
    await expect(rows("restore"), "the opening was not kept").toHaveCount(1);
    await expect(rows("shut")).toHaveCount(1);

    // Newest first: the opening stands above the shut it undid.
    const order = await page
      .locator(`[data-testid="operator-log-row"][data-subject="${id}"]`)
      .evaluateAll((found) => found.map((one) => one.getAttribute("data-action")));
    expect(order).toEqual(["restore", "shut"]);
  });
});
