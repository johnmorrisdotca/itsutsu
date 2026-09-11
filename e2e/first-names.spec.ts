import { expect, test } from "@playwright/test";

import { seedMember } from "./members";

/**
 * A person is shown by their first name.
 *
 * John's twelve-year-old daughter signed up and the site put her full name on
 * the board, in the record, and in every list on it. His words: "We shouldn't
 * show her full name. Just her first name I think."
 *
 * What this does NOT claim, and the test says so out loud below: the full name
 * is still in the address of a player's page. Addressing people by id instead
 * is a decision John has flagged and not yet made, and it would touch every
 * player address and the ratings keyed by one. This is the smaller, honest
 * thing — her name is not on display.
 */
const FULL = "Testchild Lastname";
const FIRST = "Testchild";
const SURNAME = "Lastname";

test.describe("the name the site prints", () => {
  test.beforeEach(async () => {
    await seedMember({ email: "testchild@example.com", name: FULL });
  });

  test("is the first name, on the members list", async ({ page }) => {
    await page.goto("/players?who=everyone");
    const row = page.getByTestId("directory").locator("tr", { hasText: FIRST });
    await expect(row.first()).toBeVisible();
    await expect(
      page.getByTestId("directory"),
      "a member's surname is on display in the members list",
    ).not.toContainText(SURNAME);
  });

  test("and the link still goes to them", async ({ page }) => {
    /*
     * The half that must not break. Showing less has to keep leading to the
     * same person, or "every name leads to that player" stops being true.
     */
    await page.goto("/players?who=everyone");
    const named = page.getByTestId("directory-name").filter({ hasText: FIRST }).first();
    await expect(named).toHaveAttribute("href", /\/players\//);
    await named.click();
    await expect(page.getByTestId("player-profile")).toContainText(FIRST);
  });

  test("but the operator still sees who somebody is", async ({ page }) => {
    // Administering members means telling two Hanakos apart, and a page only
    // the operator can open is not a page a name is on display on.
    // The members are behind their own tab, so the address says so — asking
    // for /admin and counting what is on it was a skip that read as "no such
    // panel" and meant "I looked on the wrong tab".
    await page.goto("/admin?view=members");
    const members = page.getByTestId("admin-members");
    await expect(members).toBeVisible();
    await expect(members, "the operator cannot tell two people apart").toContainText(SURNAME);
  });

  test("a computer player keeps its whole name", async ({ page }) => {
    // Nobody to protect, and the full name is the character.
    await page.goto("/players?view=computers");
    await expect(page.getByTestId("computer-players")).toContainText("Tamenoki");
  });
});
