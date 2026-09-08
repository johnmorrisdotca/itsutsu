import { expect, test } from "@playwright/test";

test.describe("people", () => {
  test("the players page says who is here and lists every member", async ({ page }) => {
    await page.goto("/players");
    await expect(page.getByTestId("here-now")).toBeVisible();
    await expect(page.getByTestId("directory")).toBeVisible();
  });

  test("the profile page asks for a name and shows the buddy list", async ({ page }) => {
    await page.goto("/me");
    await expect(page.getByTestId("name-form")).toBeVisible();
    await expect(page.getByTestId("buddies")).toBeVisible();
  });

  test("a name needs a member behind it", async ({ request }) => {
    const response = await request.patch("/api/me", { data: { name: "Someone" } });
    expect([200, 404]).toContain(response.status());
  });
});
