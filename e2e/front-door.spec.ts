import { expect, test } from "@playwright/test";

/**
 * The front door, after the lobby became two pages.
 *
 * Two things John found looking at it: the hero offered Play, Rules and Learn
 * and never mentioned the catalogue — the page a first-time visitor actually
 * wants, reachable only from the navigation. And Play carried 遊ぶ while
 * everything beside it carried nothing, which read as deliberate while Play
 * stood alone and as an oddity next to Games.
 *
 * It also had a bug the split left behind: the main button said Play and went
 * to the catalogue.
 */
test.describe("the front door", () => {
  test("Play goes to your games, not to the catalogue", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("enter")).toHaveAttribute("href", "/play");
  });

  test("offers the catalogue as well, which is what a first visit wants", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("enter-games")).toHaveAttribute("href", "/games");
  });

  test("the navigation reads in one language", async ({ page }) => {
    /*
     * Only the bar. A kanji paired with a heading elsewhere — a game's name, a
     * section title, the prose about what "itsutsu" means — is the site's own
     * voice and is not what was asked about.
     */
    await page.goto("/games");
    const nav = page.locator("nav").first();
    const said = (await nav.innerText()).replace(/\s+/g, " ");
    expect(said, `the navigation still carries kanji: "${said}"`).not.toMatch(/[぀-ヿ一-龯]/);
  });

  test("and the hero does too, while the page below it keeps its voice", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByTestId("enter").locator("xpath=ancestor::section[1]");
    expect(await hero.innerText()).not.toMatch(/[぀-ヿ一-龯]/);
    // The page itself still speaks both. Removing that was never the ask.
    expect(await page.locator("body").innerText()).toMatch(/[぀-ヿ一-龯]/);
  });
});
