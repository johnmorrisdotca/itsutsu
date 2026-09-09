import { expect, test } from "@playwright/test";

/**
 * The About page.
 *
 * It had no test at all, which is how a page of prose quietly stops
 * rendering: nothing here is typed strictly enough for the compiler to catch
 * a section that throws, and nobody reloads the About page. These walk the
 * two things that are easy to get wrong — that every game named in the prose
 * is a working link to that game, and that the figures are really drawn — and
 * one of them clicks through to prove a link is not merely present.
 */
test.describe("about", () => {
  test("renders every section, including go and the notation", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: "About", exact: false }).first()).toBeVisible();

    for (const heading of [
      "Where this comes from",
      "Five stones, and where they came from",
      "The Japanese thread",
      "Go, the board underneath",
      "Othello",
      "How a move is written down",
      "Sites worth knowing",
    ]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("a game named in the prose links to that game", async ({ page }) => {
    await page.goto("/about");
    // The names, and the page each one has to reach. Checked on the first
    // occurrence: a name that appears twice need only be a link once.
    const named: [string, string][] = [
      ["Othello", "/games/reversi"],
      ["Pente", "/games/ninuki"],
      ["Connect Four", "/games/drop-four"],
      ["gomoku", "/games/gomoku"],
      ["Reversi", "/games/classic-reversi"],
    ];
    for (const [name, path] of named) {
      const link = page.getByRole("link", { name, exact: true }).first();
      await expect(link, `"${name}" should be a link`).toBeVisible();
      await expect(link, `"${name}" should point at ${path}`).toHaveAttribute("href", path);
    }
  });

  test("a linked game name really goes to the game", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("link", { name: "Pente", exact: true }).first().click();
    await expect(page).toHaveURL(/\/games\/ninuki$/);
  });

  test("go is explained, with its diagrams and its numbers", async ({ page }) => {
    await page.goto("/about");
    const go = page.getByTestId("about-section").filter({ hasText: "Go, the board underneath" });
    await expect(go).toHaveCount(1);
    // Liberties and a capture, then two eyes.
    await expect(go.getByTestId("about-diagram")).toHaveCount(2);
    // The size of the game, beside the games this site does play.
    await expect(go.getByTestId("about-table")).toHaveCount(1);
    await expect(go).toContainText("2.08 × 10¹⁷⁰");
    // It does not pretend go is playable here.
    await expect(go).toContainText("cannot play go here yet");
  });

  test("the ratings section keeps our rules and another site's apart", async ({ page }) => {
    await page.goto("/about");
    const ratings = page.getByTestId("about-section").filter({ hasText: "Ratings, in numbers" });
    await expect(ratings).toHaveCount(1);
    // The rule that is ours and was never written down: no farming beginners.
    await expect(ratings).toContainText("gains nothing at all from winning");
    // What is quoted from elsewhere is named as theirs, not stated as ours.
    await expect(ratings).toContainText("Pente.org");
    const tables = ratings.getByTestId("about-table");
    // The example ladder, and ours beside theirs.
    await expect(tables).toHaveCount(2);
    await expect(tables.nth(1)).toContainText("200 below your best");
  });

  test("the notation section says how a move is written, and names SGF", async ({ page }) => {
    await page.goto("/about");
    const notation = page.getByTestId("about-section").filter({ hasText: "How a move is written down" });
    await expect(notation).toHaveCount(1);
    await expect(notation).toContainText("There is no column I");
    await expect(notation).toContainText("Smart Game Format");
    // The two schemes side by side: our H8 is SGF's hh.
    const table = notation.getByTestId("about-table");
    await expect(table).toHaveCount(1);
    await expect(table).toContainText("H8");
    await expect(table).toContainText("hh");
  });
});
