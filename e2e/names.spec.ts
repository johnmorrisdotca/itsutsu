import { expect, test, type Page } from "@playwright/test";

import { playerSlug } from "../src/lib/rating/playerKey";
import { memberContext } from "./members";

/**
 * A name is a person, so wherever the site prints one it has to lead to them.
 *
 * This is the guard for that rule rather than a test of one page: it makes a
 * member and a finished game between two names, then walks every list that
 * prints a name and insists each mention sits inside a link that leads to
 * that player. A new list that forgets to link fails here, which is the point.
 *
 * Where it leads depends on whose name it is: anyone's name leads to their
 * page, and your own name in the header leads to your own profile instead,
 * which is the same person by a nearer road.
 */
async function everyMentionLinks(page: Page, name: string) {
  const allowed = [`/players/${playerSlug(name)}`, "/me"];
  const mentions = page.getByText(name, { exact: true });
  const count = await mentions.count();
  expect(count, `"${name}" is printed somewhere on ${page.url()}`).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const href = await mentions
      .nth(i)
      .evaluate((node) => node.closest("a")?.getAttribute("href") ?? null);
    expect(allowed, `"${name}" on ${page.url()} (mention ${i + 1}) leads nowhere`).toContain(href);
  }
}

test.describe("every name leads to the player", () => {
  test("a member and their opponent are links in every list that names them", async ({
    browser,
    baseURL,
    request,
  }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `sweep-${stamp}@example.test`, name: `Sweep ${stamp}` };
    const opponent = `Foil ${stamp}`;

    // A shared game, resigned, so both names have a record and a standing.
    const started = await request.post("/api/games/live", {
      data: { blackName: me.name, whiteName: opponent, size: 9 },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; whiteToken: string };
    expect(
      (await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status(),
    ).toBe(200);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // The players page: here now, the directory, and the ladder.
    await page.goto("/players");
    await expect(page.getByTestId("here-name").filter({ hasText: me.name })).toBeVisible();
    await everyMentionLinks(page, me.name);
    await everyMentionLinks(page, opponent);

    // The record.
    await page.goto(`/history?search=${encodeURIComponent(stamp)}`);
    await everyMentionLinks(page, me.name);
    await everyMentionLinks(page, opponent);

    // That game's own ladder.
    await page.goto("/champions/gomoku");
    await everyMentionLinks(page, me.name);
    await everyMentionLinks(page, opponent);

    // A profile names the opponent of every recent game.
    await page.goto(`/players/${playerSlug(me.name)}`);
    await expect(page.getByTestId("player-record")).toContainText("1W · 0L · 0D");
    await everyMentionLinks(page, opponent);

    await context.close();
  });

  test("a member has a page from the day they join, before any game", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const newcomer = { email: `newcomer-${stamp}@example.test`, name: `Newcomer ${stamp}` };
    const context = await memberContext(browser, baseURL!, newcomer);
    const page = await context.newPage();

    // The link the directory and the here list print must lead to a page, not a 404.
    await page.goto("/players");
    await everyMentionLinks(page, newcomer.name);
    await page.getByTestId("here-name").filter({ hasText: newcomer.name }).first().click();

    await expect(page).toHaveURL(new RegExp(`/players/${playerSlug(newcomer.name)}$`));
    await expect(page.getByTestId("player-profile")).toContainText(newcomer.name);
    await expect(page.getByTestId("player-no-games")).toBeVisible();

    await context.close();
  });
});
