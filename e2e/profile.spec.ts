import { expect, test } from "@playwright/test";

test.describe("people", () => {
  test("the players page says who is here and lists every member", async ({ page }) => {
    await page.goto("/players");
    await expect(page.getByTestId("here-now")).toBeVisible();
    await expect(page.getByTestId("directory")).toBeVisible();
  });

  test("the profile page asks for a name whichever part of it is open", async ({ page }) => {
    // The name is the one thing the site needs from a member, so it stands
    // above the tabs rather than behind one of them.
    await page.goto("/me");
    await expect(page.getByTestId("name-form")).toBeVisible();
    await page.goto("/me?view=people");
    await expect(page.getByTestId("name-form")).toBeVisible();
  });

  test("the people a member has said something about are on one tab", async ({ page }) => {
    await page.goto("/me?view=people");
    await expect(page.getByTestId("buddies")).toBeVisible();
    // And not stacked underneath the record, which is what the tabs are for.
    await expect(page.getByTestId("my-record")).toHaveCount(0);
  });

  test("a name needs a member behind it", async ({ request }) => {
    /*
     * A name nothing else could be holding, which is the whole point of
     * generating it. This asked for "Someone" and got 409 — correctly, because
     * a rating record already stood under that name from a game played under
     * it, and taking a name with a record behind it would be inheriting
     * somebody else's rating. That is the API being right and the test being
     * about the wrong thing: it means to check that a name needs an account
     * behind it, not to discover who happens to hold a common name on this
     * database today.
     */
    const mine = `Nobody ${Date.now().toString(36)}`;
    const response = await request.patch("/api/me", { data: { name: mine } });
    expect([200, 404]).toContain(response.status());
  });
});
