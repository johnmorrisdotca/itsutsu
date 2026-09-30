import { expect, test, type Page } from "@playwright/test";

import { PARTY_SLUGS } from "../src/lib/gomoku/slugs";
import { PLAYER_STATE, ready } from "./support";

/**
 * SOMEBODY ELSE'S WHOLE HISTORY, ON THEIR PAGE. John, 2026-09-30: "Be able to
 * browse the history of all your friends as well", then "viewing your buddy
 * profile page". A card game one member started on their device is on their
 * player page for another member, read from their side, and opens to be
 * looked at, never offered to the reader's device.
 */

/** A game of Hearts started at the table on this device, filed with the site; its record's id. */
async function fileHearts(page: Page): Promise<string> {
  await page.goto(`/games/${PARTY_SLUGS.hearts}/pass-and-play`);
  await page.evaluate(() => {
    for (const key of Object.keys(window.localStorage)) if (key.startsWith("itsutsu.cards.") || key.startsWith("itsutsu:kept")) window.localStorage.removeItem(key);
  });
  await page.reload();
  await ready(page, "cards-set-up");
  const filed = page.waitForResponse((answer) => answer.url().includes("/api/kept-games/") && answer.request().method() === "POST");
  await page.getByTestId("cards-start").click();
  await ready(page, "cards-game");
  const answer = await filed;
  expect(answer.status()).toBe(200);
  return answer.url().split("/api/kept-games/")[1].split(/[?#]/)[0];
}

test("a member's card game is in their history on their page, and another member can look at it", async ({ page, browser }, testInfo) => {
  const id = await fileHearts(page);

  // Whose page it is, read from their own seat at the game.
  await page.goto(`/games/${PARTY_SLUGS.hearts}/kept/${id}`);
  await expect(page.getByTestId("kept-game")).toBeVisible();
  const profile = await page.getByTestId("kept-seats").locator('a[href^="/players/"]').first().getAttribute("href");
  expect(profile).not.toBeNull();

  const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL, storageState: PLAYER_STATE });
  const other = await context.newPage();
  try {
    await other.goto(profile!);
    await expect(other.getByTestId("player-history")).toBeVisible();
    const row = other.locator('[data-testid="history-entry"][data-source="device"][data-game="hearts"]').filter({ has: other.locator(`a[href$="/kept/${id}"]`) });
    await expect(row).toHaveCount(1);
    await expect(row.getByTestId("history-open")).toContainText("Watch");

    await row.getByTestId("history-open").click();
    await expect(other.getByTestId("kept-game")).toHaveAttribute("data-state", "going");
    await expect(other.getByTestId("kept-whose")).toBeVisible();
    // Looked at, not taken: the page is drawn, and nothing offers it to this device.
    await expect(other.getByTestId("kept-seats")).toBeVisible();
    await expect(other.getByTestId("kept-open")).toHaveCount(0);
    await expect(other.getByTestId("kept-back")).toHaveAttribute("href", `${profile}#history`);
  } finally {
    await context.close();
  }
});
