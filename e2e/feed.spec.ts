import { expect, test, type APIRequestContext, type BrowserContext } from "@playwright/test";

import { memberContext, memberIdFor, removeMember } from "./members";
import { gamesMade, namesPlayedUnder } from "./tidy";
import { ready } from "./support";

/**
 * THE FEED (John, 2026-09-25, after Duolingo's): your own games and your
 * buddies', and on the Everyone tab the games finished lately between players
 * it is safe to show everybody — never one with a member under 18 in it.
 *
 * The spec brings its own world: three members nobody else has met, two
 * adults and a teenager, each answering the age question through the profile
 * route the way the form does. Ada keeps Ben as a buddy. Ben beats Ada; Ben
 * beats the teenager. Ada then reads her feed by clicking, as a member does:
 * both games on her own tab, and on Everyone only the one between adults. The
 * absence is asserted only after the presence beside it has been waited for.
 */
test.describe("the feed", () => {
  const mine = gamesMade();
  const under = namesPlayedUnder();
  const stamp = Date.now().toString(36);
  const ADA = { email: `feed-ada-${stamp}@example.test`, name: under(`Ada${stamp} Feed`) };
  const BEN = { email: `feed-ben-${stamp}@example.test`, name: under(`Ben${stamp} Feed`) };
  const TEEN = { email: `feed-teen-${stamp}@example.test`, name: under(`Tia${stamp} Feed`) };
  let ada: BrowserContext;
  let ben: BrowserContext;
  let teen: BrowserContext;

  test.beforeAll(async ({ browser, baseURL }) => {
    ada = await memberContext(browser, baseURL!, ADA);
    ben = await memberContext(browser, baseURL!, BEN);
    teen = await memberContext(browser, baseURL!, TEEN);
  });

  test.afterAll(async () => {
    await ada?.close();
    await ben?.close();
    await teen?.close();
    await removeMember(ADA.email);
    await removeMember(BEN.email);
    await removeMember(TEEN.email);
  });

  /** A game the poster starts and then resigns, so whoever sat down wins it. */
  async function lostBy(poster: APIRequestContext, posterName: string, sitter: APIRequestContext, sitterName: string): Promise<string> {
    const started = await poster.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, winLength: 5, moveTimeMs: null, rated: false, blackName: posterName, whiteName: sitterName, open: true },
    });
    expect(started.status(), await started.text()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string };
    mine(game.id);
    const sat = await sitter.post(`/api/games/${game.id}/sit`);
    expect(sat.status(), await sat.text()).toBe(200);
    const played = await poster.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
    expect(played.status(), await played.text()).toBe(201);
    const resigned = await poster.post(`/api/games/${game.id}/resign`, { data: { token: game.blackToken } });
    expect(resigned.status(), await resigned.text()).toBe(200);
    return game.id;
  }

  test("shows your games and your buddies', and keeps anyone under 18 off Everyone", async () => {
    for (const [context, band] of [
      [ada, "18_plus"],
      [ben, "18_plus"],
      [teen, "13_17"],
    ] as const) {
      const answered = await context.request.patch("/api/me", { data: { ageBand: band } });
      expect(answered.ok(), await answered.text()).toBe(true);
    }
    const kept = await ada.request.post("/api/buddies", { data: { memberId: await memberIdFor(BEN.email) } });
    expect(kept.ok(), await kept.text()).toBe(true);

    const between = await lostBy(ben.request, BEN.name, ada.request, ADA.name);
    const withTeen = await lostBy(teen.request, TEEN.name, ben.request, BEN.name);

    // Reached the way a member reaches it: from the account menu.
    const page = await ada.newPage();
    await page.goto("/play");
    await ready(page, "account-menu");
    await page.getByTestId("account-menu-button").click();
    await page.getByTestId("account-menu-panel").getByTestId("feed-link").click();
    await expect(page).toHaveURL(/\/feed$/);

    const own = page.locator(`[data-testid="feed-entry"][data-game-id="${between}"]`);
    await expect(own).toHaveAttribute("data-kind", "game");
    await expect(own).toHaveAttribute("data-you", "true");
    await expect(own.getByTestId("feed-sentence")).toContainText("You beat");
    await expect(own.getByTestId("feed-other")).toContainText(BEN.name.split(" ")[0]);
    await expect(own.getByTestId("game-name")).toBeVisible();
    await expect(own.getByTestId("feed-open")).toHaveAttribute("href", new RegExp(between));

    // The buddy's game with the teenager is theirs to follow on your own tab.
    const buddys = page.locator(`[data-testid="feed-entry"][data-game-id="${withTeen}"]`);
    await expect(buddys).toHaveAttribute("data-you", "false");
    await expect(buddys.getByTestId("feed-who")).toContainText(BEN.name.split(" ")[0]);

    // Everyone: the game between two adults, and not the one with a teenager in it.
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="everyone"]').click();
    await expect(page).toHaveURL(/\/feed\?view=everyone$/);
    await expect(page.getByTestId("feed-panel")).toHaveAttribute("data-tab", "everyone");
    /* The game's own line — or, when it was the first game of its kind on this
       database, the news that says so, which tells the same game with both
       players named and stands in for its line (`gamesToldByNews`). Those two,
       and nothing else. */
    await expect(
      page.locator(
        `[data-testid="feed-entry"][data-game-id="${between}"], [data-testid="feed-entry"][data-news="firstGameOfGame"][data-news-game="${between}"]`,
      ),
    ).toBeVisible();
    await expect(page.locator(`[data-testid="feed-entry"][data-game-id="${withTeen}"]`)).toHaveCount(0);

    // And back again: the way there is not the only way tested.
    await page.locator('[data-testid="tab"][data-tab="mine"]').click();
    await expect(page.getByTestId("feed-panel")).toHaveAttribute("data-tab", "mine");
    await expect(page.locator(`[data-testid="feed-entry"][data-game-id="${withTeen}"]`)).toBeVisible();
  });

  test("is shut to a visitor with no invite", async ({ browser, baseURL }) => {
    const stranger = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    try {
      const page = await stranger.newPage();
      await page.goto("/feed");
      await expect(page).toHaveURL(/\/join/);
    } finally {
      await stranger.close();
    }
  });
});
