import { expect, test } from "@playwright/test";

import { openSetup } from "./support";
import { GAME_FAMILIES } from "../src/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "../src/lib/gomoku/gomoku.constants";

/** The rules pages and the learning shelf, and the link from one to the board. */
test.describe("rules and learning", () => {
  test("every game has a rules page in the same template", async ({ page }) => {
    await page.goto("/rules");
    const index = page.getByTestId("rules-index");
    // One card per game, however many there are today.
    await expect(index.getByRole("link")).toHaveCount(RULE_VARIANT_LIST.length);
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

  test("every game is on one plain page, family by family, with its other names", async ({ page }) => {
    await page.goto("/rules");
    await page.getByTestId("every-game-link").click();
    await expect(page).toHaveURL(/\/games\/all$/);
    await expect(page.getByTestId("every-game-family")).toHaveCount(GAME_FAMILIES.length);
    await expect(page.getByTestId("every-game").locator("dt")).toHaveCount(RULE_VARIANT_LIST.length);
    await expect(page.getByTestId("every-game-freestyle")).toContainText("Also known as Go-Moku");
    // Our own name for a game is not one of its other names.
    await expect(page.getByTestId("every-game-halma")).not.toContainText("Also known as");
    await page.getByTestId("every-game-halma").getByRole("link", { name: "rules", exact: true }).click();
    await expect(page).toHaveURL(/\/rules\/halma$/);
  });

  test("a rules page shows the game being played, and the picture really loads", async ({ page }) => {
    /*
     * The New Game Gate requires a screenshot on every rules page, and nothing
     * checked that one arrives. Nothing had to, while the page was deciding
     * from a filesystem read that happens to work — but a picture that is
     * required and never asserted is a picture that can quietly stop
     * appearing.
     *
     * Asserting the element is not enough: a broken image is still an element,
     * and the failures worth catching here leave a perfectly good one. This
     * asks the browser whether it has pixels.
     */
    await page.goto("/rules/gomoku");
    const shot = page.getByRole("img", { name: /in progress$/ });
    await expect(shot).toBeVisible();
    await expect(async () => {
      const width = await shot.evaluate((img) => (img as HTMLImageElement).naturalWidth);
      expect(width).toBeGreaterThan(0);
    }).toPass({ timeout: 10_000 });
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

  test("the rules can be narrowed to a first letter", async ({ page }) => {
    await page.goto("/rules");
    const cards = page.getByTestId("rules-index").getByRole("listitem");
    const all = await cards.count();
    // No game starts with X; the button says so by refusing.
    await expect(page.getByTestId("letter-X")).toBeDisabled();
    await page.getByTestId("letter-T").click();
    await expect(page).toHaveURL(/\/rules\?letter=T$/);
    await expect(cards.first()).toContainText(/^T/);
    expect(await cards.count()).toBeLessThan(all);
    for (const card of await cards.allTextContents()) expect(card.trim()).toMatch(/^T/);
    await page.getByTestId("letter-All").click();
    await expect(cards).toHaveCount(all);
  });

  test("the rules can be narrowed by what wins, together with a letter", async ({ page }) => {
    await page.goto("/rules");
    const cards = page.getByTestId("rules-index").getByRole("listitem");
    await page.getByTestId("kind-flips").click();
    await expect(page).toHaveURL(/\/rules\?kind=flips$/);
    for (const card of await cards.allTextContents()) expect(card).toMatch(/Reversi/);
    // With flips chosen, a letter no flipping game starts with cannot be pressed.
    await expect(page.getByTestId("letter-T")).toBeDisabled();
    await page.getByTestId("letter-A").click();
    await expect(page).toHaveURL(/\/rules\?kind=flips&letter=A$/);
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Anti-Reversi");
  });

  test("a rules page can start a game of that kind", async ({ page }) => {
    await page.goto("/rules/twist-four");
    await page.getByRole("link", { name: /Play Twist Four/ }).click();
    await openSetup(page);
    await expect(page.getByTestId("rules")).toHaveValue("twistFour");
    /*
     * Twist Four is `boardSizes: [4]`, so its board is stated rather than
     * offered — a rule the game has settled is not drawn as a control nobody
     * may use. The decision, and the test that guards it, are in games.spec.ts.
     */
    await expect(page.getByTestId("fixed-by-rules")).toContainText("4×4");
  });

  test("the lobby offers the ways to start a game and folds the catalogue into families", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByTestId("lobby-start")).toContainText("Start a game");
    await expect(page.getByTestId("start-game")).toBeVisible();
    const families = page.getByTestId("lobby-family");
    await expect(families).toHaveCount(GAME_FAMILIES.length);
    // The first family is open; the rest are folded, so the page stays short.
    await expect(families.nth(1).getByTestId("game-name").first()).toBeHidden();
    const small = families.filter({ hasText: "Small boards" });
    await small.locator("summary").click();
    // The families are for looking around: a game is read about here and
    // started above, so nothing in this list drops straight onto a board.
    await expect(small.getByRole("link", { name: "play", exact: true })).toHaveCount(0);
    // The game's own name is the way in, which is the standing rule; the
    // little "rules" beside it was what that name should always have been.
    await small.getByTestId("game-name").filter({ hasText: "Notakto" }).click();
    await expect(page).toHaveURL(/\/rules\/notakto$/);
  });

  test("the record is reached from a game, not from the header", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByRole("navigation").getByRole("link", { name: /^Record/ })).toHaveCount(0);
    // It is still one click away at the foot of every page.
    await page.getByTestId("site-footer").getByRole("link", { name: "Record" }).click();
    await expect(page).toHaveURL(/\/history$/);
  });

  test("the header reaches rules, learning and players", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.getByRole("navigation").getByRole("link", { name: /^Rules/ }).click();
    await expect(page).toHaveURL(/\/rules$/);
    await page.getByRole("navigation").getByRole("link", { name: /^Learn/ }).click();
    await expect(page).toHaveURL(/\/learn$/);
    await page.getByRole("navigation").getByRole("link", { name: /^Players/ }).click();
    await expect(page).toHaveURL(/\/players$/);
  });
});

test.describe("signing out", () => {
  test("clears the session and sends the visitor to the front page", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByTestId("account-menu")).toBeVisible();
    await page.getByTestId("sign-out").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("sign-in")).toBeVisible();
    await page.goto("/games");
    await expect(page).toHaveURL(/\/join/);
  });
});

