import { expect, test, type Page } from "@playwright/test";

import { PARTY_SLUGS } from "../src/lib/gomoku/slugs";
import { KEPT_OUTBOX_KEY } from "../src/lib/party/kept/keptOutbox";
import { ready } from "./support";

/**
 * EVERY GAME IN THE HISTORY, THE ONES PLAYED ON ONE SCREEN INCLUDED. John,
 * 2026-09-30: card games "don't seem to show up in my history with the other
 * games like Othello", "Should contain all games ever… Even those that aren't
 * completed or just passed around", "we should be allowed to view, resume",
 * and "Sometimes the games are played off-line".
 *
 * A card game started at its table is filed with the site as it starts, is on
 * My games › History, and opens from there to be carried on with. One started
 * with the device offline waits on the device and is filed once it is online.
 */

/** The table, set up and started with the holder of the device against computers. */
async function startCards(page: Page, slug: string) {
  await page.goto(`/games/${slug}/pass-and-play`);
  await page.evaluate(() => {
    for (const key of Object.keys(window.localStorage)) if (key.startsWith("itsutsu.cards.") || key.startsWith("itsutsu:kept")) window.localStorage.removeItem(key);
  });
  await page.reload();
  await ready(page, "cards-set-up");
}

/** The id this browser gave the game at a table (`keptRecord.ts`), read from beside the game. */
async function recordId(page: Page, game: string): Promise<string> {
  let id = "";
  await expect
    .poll(async () => {
      id = await page.evaluate((wanted) => {
        const key = Object.keys(window.localStorage).find((one) => one.endsWith(":record") && one.toLowerCase().includes(wanted.toLowerCase()));
        return key === undefined ? "" : ((JSON.parse(window.localStorage.getItem(key) ?? "{}") as { id?: string }).id ?? "");
      }, game);
      return id;
    })
    .not.toBe("");
  return id;
}

test.describe("the history holds every game", () => {
  test("a card game is filed as it starts, is listed with the rest, and opens again to carry on", async ({ page }) => {
    await startCards(page, PARTY_SLUGS.hearts);
    const filed = page.waitForResponse((answer) => answer.url().includes("/api/kept-games/") && answer.request().method() === "POST");
    await page.getByTestId("cards-start").click();
    await ready(page, "cards-game");
    expect((await filed).status()).toBe(200);
    const id = await recordId(page, "hearts");

    await page.goto("/play/history");
    const row = page.locator(`[data-testid="history-entry"][data-source="device"][data-game="hearts"]`).filter({ has: page.locator(`a[href$="/kept/${id}"]`) });
    await expect(row).toHaveCount(1);
    await expect(row).toHaveAttribute("data-state", "going");

    await row.getByTestId("history-open").click();
    await expect(page.getByTestId("kept-game")).toHaveAttribute("data-state", "going");
    await ready(page, "kept-open");
    // Gone from this device, as on another one: opening it from the history puts it back.
    await page.evaluate(() => {
      for (const key of Object.keys(window.localStorage)) if (key.startsWith("itsutsu.cards.hearts")) window.localStorage.removeItem(key);
    });
    await page.getByTestId("kept-open-button").click();
    await page.waitForURL(/\/pass-and-play$/);
    await ready(page, "cards-game");
    expect(await recordId(page, "hearts")).toBe(id);
  });

  test("a game started offline waits on the device and is filed once the device is back online", async ({ page, context }) => {
    await startCards(page, PARTY_SLUGS.goFish);
    await context.setOffline(true);
    await page.getByTestId("cards-start").click();
    await ready(page, "cards-game");
    const id = await recordId(page, "goFish");
    await expect.poll(() => page.evaluate((key) => Object.keys(JSON.parse(window.localStorage.getItem(key) ?? "{}")), KEPT_OUTBOX_KEY)).toEqual([id]);

    const filed = page.waitForResponse((answer) => answer.url().includes(`/api/kept-games/${id}`));
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    expect((await filed).status()).toBe(200);
    await expect.poll(() => page.evaluate((key) => Object.keys(JSON.parse(window.localStorage.getItem(key) ?? "{}")), KEPT_OUTBOX_KEY)).toEqual([]);

    await page.goto("/play/history");
    await expect(page.locator(`[data-testid="history-entry"][data-game="goFish"]`).filter({ has: page.locator(`a[href$="/kept/${id}"]`) })).toHaveCount(1);
  });
});
