import { expect, test } from "@playwright/test";

/** The rules pages and the learning shelf, and the link from one to the board. */
test.describe("rules and learning", () => {
  test("every game has a rules page in the same template", async ({ page }) => {
    await page.goto("/rules");
    const index = page.getByTestId("rules-index");
    await expect(index.getByRole("link")).toHaveCount(29);
    await expect(page.getByTestId("rules-attribution")).toContainText("trademark");

    await page.getByRole("link", { name: /Hot Drop/ }).click();
    const rules = page.getByTestId("rules-page");
    await expect(rules).toContainText("Object");
    await expect(rules).toContainText("Board");
    await expect(rules).toContainText("Play");
    await expect(rules).toContainText("House rules");
    await expect(rules).toContainText("hotspot");
    await expect(rules).toContainText("falls to the lowest empty point");
  });

  test("renju's rules page names the forbidden shapes and links a guide", async ({ page }) => {
    await page.goto("/rules/renju");
    await expect(page.getByTestId("rules-page")).toContainText("double three");
    await expect(page.getByTestId("rules-page")).toContainText("長連");
    await page.getByRole("link", { name: /playing black with your hands tied/ }).click();
    await expect(page.getByTestId("guide-page")).toContainText("forbidden points");
  });

  test("the learning shelf lists the guides and each guide links its games", async ({ page }) => {
    await page.goto("/learn");
    await expect(page.getByTestId("learn-index").getByRole("link")).toHaveCount(8);
    await page.getByRole("link", { name: /gravity is the board/ }).click();
    await expect(page.getByTestId("guide-page")).toContainText("Parity");
    await page.getByRole("link", { name: "Ring Drop" }).click();
    await expect(page.getByTestId("rules-page")).toContainText("edges join");
  });

  test("a rules page can start a game of that kind", async ({ page }) => {
    await page.goto("/rules/twistFour");
    await page.getByRole("link", { name: /Play Twist Four/ }).click();
    await expect(page.getByTestId("rules")).toHaveValue("twistFour");
    await expect(page.getByTestId("board-size")).toHaveValue("4");
  });

  test("the lobby leads with one game and folds the rest into families", async ({ page }) => {
    await page.goto("/lobby");
    await expect(page.getByTestId("lobby-start")).toContainText("Start here");
    const families = page.getByTestId("lobby-family");
    await expect(families).toHaveCount(5);
    // Folded until opened, so the page is short.
    await expect(families.first().getByRole("link", { name: "play" })).toBeHidden();
    await families.filter({ hasText: "Small boards" }).locator("summary").click();
    await families
      .filter({ hasText: "Small boards" })
      .locator("li", { hasText: "Notakto" })
      .getByRole("link", { name: "play" })
      .click();
    await expect(page.getByTestId("rules")).toHaveValue("notakto");
  });

  test("the header reaches rules, learning and players", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /^Rules/ }).click();
    await expect(page).toHaveURL(/\/rules$/);
    await page.getByRole("link", { name: /^Learn/ }).click();
    await expect(page).toHaveURL(/\/learn$/);
    await page.getByRole("link", { name: /^Players/ }).click();
    await expect(page).toHaveURL(/\/players$/);
  });
});
