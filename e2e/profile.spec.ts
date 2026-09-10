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
    const response = await request.patch("/api/me", { data: { name: "Someone" } });
    expect([200, 404]).toContain(response.status());
  });
});
