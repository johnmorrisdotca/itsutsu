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

  test("does not ask a member who is already in for an invitation", async ({ page }) => {
    await page.goto("/");
    // The page has answered before its absence is read.
    await expect(page.getByTestId("front-story")).toBeVisible();
    await expect(page.getByTestId("invite-line")).toHaveCount(0);
  });

  test("tells a member they are already a tester, rather than asking them for an invite", async ({ page }) => {
    await page.goto("/");
    // The panel has answered before the absence of the ask is read.
    await expect(page.getByTestId("front-beta-member")).toBeVisible();
    await expect(page.getByTestId("front-beta-ask")).toHaveCount(0);
    await expect(page.getByTestId("site-numbers-beta")).toHaveCount(0);
  });

  test("says people are helping test, and leads a member to the page that thanks them", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("front-thanks")).toContainText("thanked by name");
    await page.getByTestId("front-thanks-link").click();
    await page.waitForURL(/\/thanks$/);
    // The list is drawn whether or not anybody is on it yet.
    await expect(page.getByTestId("thanks-testers")).toBeVisible();
    await expect(page.getByTestId("thanks-communities")).toContainText("ItsYourTurn");
  });

  test("shows every family of games, each leading to its own page", async ({ page }) => {
    await page.goto("/");
    const families = page.getByTestId("front-family");
    await expect(families.first()).toBeVisible();
    expect(await families.count()).toBeGreaterThan(1);
    await expect(families.first()).toHaveAttribute("href", /^\/games\/[^/]+\/family$/);
  });

  test("says how many players and games there are, as an early release, people only", async ({ page }) => {
    await page.goto("/");
    const line = page.getByTestId("site-numbers");
    await expect(line).toContainText("early release");
    await expect(line).toContainText(/\d[\d,]* players?/);
    // The games number leads to exactly the games it counted: finished, with no program in either seat.
    const games = line.getByTestId("site-numbers-games");
    await expect(line).toContainText(/\d[\d,]* games? between people/);
    const count = Number(((await games.textContent()) ?? "").replace(/[^\d]/g, ""));
    if (count > 0) await expect(games).toHaveAttribute("href", /\/history\?pool=people$/);
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
