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
 * Since 2026-09-29 the hero no longer repeats the header at all: the catalogue
 * is the families just below it, and the header carries My games, Games and
 * New game on every page.
 */
test.describe("the front door", () => {
  /*
   * THE HERO DOES NOT REPEAT THE HEADER. It carried Play, New game and Games
   * under a header offering My games, New game and Games; John, 2026-09-29:
   * "Home page seems to have redundant buttons?", then "remove dedenant.
   * redesign it slightly yes." The hero keeps what only it leads to.
   */
  test("offers only what the header does not: the guides and a member's feed", async ({ page }) => {
    await page.goto("/");
    const ways = page.getByTestId("front-door-ways");
    await expect(ways.getByTestId("enter-learn")).toHaveAttribute("href", "/learn");
    await expect(ways.getByTestId("enter-feed")).toBeVisible();
    // The page has answered, so the header's three are read as absent from the hero, not as not yet drawn.
    for (const gone of ["enter", "enter-new-game", "enter-games"]) await expect(page.getByTestId(gone)).toHaveCount(0);
    await expect(ways.getByRole("link", { name: /^(Play|New game|Games)$/ })).toHaveCount(0);
    await expect(page.getByTestId("nav-new-game").first()).toBeVisible();
  });

  test("counts the whole catalogue and leads to it, with the families straight after", async ({ page }) => {
    await page.goto("/");
    const count = page.getByTestId("front-catalogue-count");
    await expect(count).toHaveText(/^\d+ games$/);
    await expect(count).toHaveAttribute("href", "/games/list");
    await expect(page.getByTestId("front-family").first()).toBeVisible();
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
    const hero = page.getByTestId("front-door");
    expect(await hero.innerText()).not.toMatch(/[぀-ヿ一-龯]/);
    // The page itself still speaks both. Removing that was never the ask.
    expect(await page.locator("body").innerText()).toMatch(/[぀-ヿ一-龯]/);
  });
});

test.describe("the front door, for somebody outside", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("offers the way in and the guides, and no feed", async ({ page }) => {
    await page.goto("/");
    const ways = page.getByTestId("front-door-ways");
    await expect(ways.getByTestId("enter-ask")).toHaveText("Ask for an invite");
    await expect(ways.getByTestId("enter-learn")).toBeVisible();
    await expect(ways.getByTestId("enter-feed")).toHaveCount(0);
  });
});
