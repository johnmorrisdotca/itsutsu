import { expect, test, type Page } from "@playwright/test";

import { encodeMancala, replayMancala } from "../src/lib/party/mancala/mancala";
import { ready } from "./support";

/**
 * MANCALA, PASSED ACROSS ONE DEVICE: a party game (`PartyKind` "mancala") at
 * home on the Party games shelf, by Kalah's rules or Oware's.
 *
 * Driven as a table would drive it: from the game's own page, by pressing
 * Play, choosing the rules and naming the two players, then tapping pits. The
 * game lives in this browser only, so each case starts by clearing this
 * browser's kept game; nothing here writes to the database.
 *
 * Holes are numbered as the rules number them (`mancala.types.ts`): 0–5 the
 * first player's pits along the bottom, 6 their store, 7–12 the second
 * player's along the top, 13 theirs. A capture is reached from a known
 * position made by the same rules the page plays (`replayMancala`) and kept
 * where the table keeps a game, as a player coming back to one would find it.
 */

const KEPT = "itsutsu.mancala";

const pit = (page: Page, hole: number) => page.locator(`[data-testid="mancala-pit"][data-pit="${hole}"]`);
const store = (page: Page, seat: number) => page.locator(`[data-testid="mancala-store"][data-seat="${seat}"]`);

/** Tap a pit, as a finger would, and wait for the sowing to be kept and drawn to its end. */
async function sow(page: Page, hole: number) {
  const table = page.getByTestId("mancala-game");
  const made = Number(await table.getAttribute("data-moves"));
  await pit(page, hole).click();
  await expect(table).toHaveAttribute("data-moves", String(made + 1));
  await expect(table).not.toHaveAttribute("data-sowing", "true");
}

async function clearKept(page: Page) {
  await page.goto("/games/mancala");
  await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
}

test.describe("Mancala, read by anybody", () => {
  // Reading is open: the game's page and its rules name games and nobody who plays them.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and its rules open with no session, and Play asks a stranger to join", async ({ page }) => {
    await page.goto("/games/mancala");
    await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
    await expect(page.getByRole("heading", { name: /Mancala/ })).toBeVisible();
    await expect(page.getByTestId("party-offered")).toContainText("2 players, by Kalah (the default) or Oware rules");
    await expect(page.getByTestId("game-family")).toContainText("Party games");
    await expect(page.getByTestId("facet-family")).toHaveAttribute("href", "/games/party");

    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(/\/games\/mancala\/rules$/);
    const rules = page.getByTestId("rules-page");
    await expect(rules).toContainText("Kalah (the default) or Oware");
    await expect(rules).toContainText("grand slam");
    await expect(rules).toContainText("twelve or more");

    const picture = page.locator('img[src="/art/games/mancala.jpg"]').first();
    await expect(picture).toBeVisible();
    expect(await picture.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

    // Playing is for members: a stranger pressing Play is asked for an invite.
    await page.goto("/games/mancala");
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/join/);
  });
});

test.describe("Mancala, pass and play", () => {
  test("Kalah by default: sowing by tapping, another turn for a last seed home, kept through a reload, waiting on My games", async ({ page }) => {
    await clearKept(page);
    await page.goto("/games/mancala");
    await ready(page, "party-kind-offer");
    await expect(page.getByTestId("game-set-up")).toHaveText("Play →");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/games\/mancala\/pass-and-play$/);
    await ready(page, "mancala-set-up");

    // Kalah is chosen until another is, and the preview is the live board under it.
    await expect(page.locator('[data-testid="mancala-rule-set"][data-rules="kalah"]')).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("mancala-preview").getByTestId("mancala-board")).toHaveAttribute("data-rules", "kalah");
    await page.getByTestId("mancala-name").nth(0).fill("Ann");
    await page.getByTestId("mancala-name").nth(1).fill("Ben");
    await page.getByTestId("mancala-start").click();

    await ready(page, "mancala-game");
    const table = page.getByTestId("mancala-game");
    await expect(table).toHaveAttribute("data-rules", "kalah");
    await expect(table).toHaveAttribute("data-state", "playing");
    await expect(page.getByTestId("mancala-turn-name")).toHaveText("Ann");
    await expect(page.getByTestId("mancala-rules-name")).toHaveText("Kalah");
    await expect(page.getByTestId("mancala-pit")).toHaveCount(12);
    await expect(page.locator('[data-testid="mancala-pit"][data-legal="true"]')).toHaveCount(6);
    // Every hole says how many it holds, as a number beside its seeds.
    await expect(pit(page, 2)).toHaveAttribute("data-seeds", "4");

    // Four seeds from Ann's third pit: the last falls in her own store, and she sows again.
    await sow(page, 2);
    await expect(store(page, 0)).toHaveAttribute("data-seeds", "1");
    await expect(page.getByTestId("mancala-turn-name")).toHaveText("Ann");
    const result = page.getByTestId("mancala-result");
    await expect(result).toHaveAttribute("data-kind", "again");
    await expect(result).toContainText("Another turn");

    // Her first pit's four stop short of the store: the turn passes to Ben, whose pits are now the ones on offer.
    await sow(page, 0);
    await expect(page.getByTestId("mancala-turn-name")).toHaveText("Ben");
    await expect(pit(page, 1)).toHaveAttribute("data-seeds", "5");
    await expect(pit(page, 7)).toHaveAttribute("data-legal", "true");
    await expect(pit(page, 0)).not.toHaveAttribute("data-legal", "true");
    // Ben sows from his first pit, and the opponent's store is never sown into.
    await sow(page, 7);
    await expect(store(page, 0)).toHaveAttribute("data-seeds", "1");

    // Kept in this browser: a reload brings back the same seeds and the same turn.
    await page.reload();
    await ready(page, "mancala-game");
    await expect(table).toHaveAttribute("data-moves", "3");
    await expect(page.getByTestId("mancala-turn-name")).toHaveText("Ann");
    await expect(pit(page, 1)).toHaveAttribute("data-seeds", "5");

    // And it waits on My games' Pass and play tab, with the way back.
    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="party-game"][data-variant="mancala"]');
    await expect(card).toContainText("Kalah");
    await expect(card).toContainText("3 sowings");
    await expect(card).toContainText("Ann to play");
    await card.getByTestId("party-game-continue").click();
    await ready(page, "mancala-game");
    await expect(table).toHaveAttribute("data-moves", "3");

    // The front door says Continue while it is going.
    await page.goto("/games/mancala");
    await ready(page, "party-kind-offer");
    await expect(page.getByTestId("game-set-up")).toHaveText("Continue →");
    await page.getByTestId("game-set-up").click();
    await ready(page, "mancala-game");

    // On a phone the whole table fits the glass with nothing to scroll sideways, and a pit is big enough for a finger.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("mancala-turn")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const target = await pit(page, 3).boundingBox();
    expect(target!.width).toBeGreaterThanOrEqual(38);
    expect(target!.height).toBeGreaterThanOrEqual(100);
    await sow(page, 3);
    await expect(table).toHaveAttribute("data-moves", "4");
  });

  test("Kalah: a last seed alone in an empty pit of yours takes the pit opposite", async ({ page }) => {
    // Fifteen sowings in, Ben to sow from his pit 11: its seeds end alone in his empty pit 8, across from Ann's pit 4.
    const before = replayMancala(14, ["Ann", "Ben"], 0, [5, 12, 3, 8, 10, 2, 12, 5, 9, 4, 10, 5, 1, 7, 1])!;
    const after = replayMancala(14, ["Ann", "Ben"], 0, [5, 12, 3, 8, 10, 2, 12, 5, 9, 4, 10, 5, 1, 7, 1, 11])!;
    const taken = after.last!.captured;
    expect(taken).toBeGreaterThan(1);
    await clearKept(page);
    await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [KEPT, encodeMancala(before)]);
    await page.goto("/games/mancala/pass-and-play");
    await ready(page, "mancala-game");
    await expect(page.getByTestId("mancala-turn-name")).toHaveText("Ben");
    await sow(page, 11);
    const result = page.getByTestId("mancala-result");
    await expect(result).toHaveAttribute("data-kind", "captured");
    await expect(result).toHaveText(`Ben captured ${taken}.`);
    // One seed dropped in passing, and the capture on top.
    await expect(store(page, 1)).toHaveAttribute("data-seeds", String(after.holes[13]));
    for (const hole of after.last!.takenFrom) await expect(pit(page, hole)).toHaveAttribute("data-seeds", "0");
    await expect(page.getByTestId("mancala-turn-name")).toHaveText("Ann");
  });

  test("Oware, chosen at the set-up: its stores are never sown into, and it waits on My games by its own name", async ({ page }) => {
    await clearKept(page);
    await page.goto("/games/mancala/pass-and-play");
    await ready(page, "mancala-set-up");
    await page.locator('[data-testid="mancala-rule-set"][data-rules="oware"]').click();
    await expect(page.locator('[data-testid="mancala-rule-set"][data-rules="oware"]')).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("mancala-preview").getByTestId("mancala-board")).toHaveAttribute("data-rules", "oware");
    await page.getByTestId("mancala-name").nth(0).fill("Kofi");
    await page.getByTestId("mancala-name").nth(1).fill("Ama");
    await page.getByTestId("mancala-start").click();
    await ready(page, "mancala-game");
    await expect(page.getByTestId("mancala-game")).toHaveAttribute("data-rules", "oware");
    await expect(page.getByTestId("mancala-rules-name")).toHaveText("Oware");

    // Kofi's last pit: four seeds over to Ama's first four pits, none into his store, and no second turn.
    await sow(page, 5);
    await expect(store(page, 0)).toHaveAttribute("data-seeds", "0");
    await expect(pit(page, 10)).toHaveAttribute("data-seeds", "5");
    await expect(page.getByTestId("mancala-turn-name")).toHaveText("Ama");
    // Ama's last pit: four seeds round past her store into Kofi's first four pits, her store still empty.
    await sow(page, 12);
    await expect(store(page, 1)).toHaveAttribute("data-seeds", "0");
    await expect(pit(page, 3)).toHaveAttribute("data-seeds", "5");
    await expect(pit(page, 4)).toHaveAttribute("data-seeds", "4");
    await expect(page.getByTestId("mancala-turn-name")).toHaveText("Kofi");

    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="party-game"][data-variant="mancala"]');
    await expect(card).toContainText("Oware");
    await expect(card).toContainText("Kofi to play");

    // A new game asks first, and then the set-up is back.
    await card.getByTestId("party-game-continue").click();
    await ready(page, "mancala-game");
    await page.getByTestId("mancala-new").click();
    await page.getByTestId("mancala-new-yes").click();
    await ready(page, "mancala-set-up");
  });
});

test.describe("Mancala on the Party games shelf", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is at home there, and leads to its own page, which fits a phone", async ({ page }) => {
    await page.goto("/games/party");
    const card = page.getByTestId("family-game-mancala");
    await expect(card).toHaveAttribute("data-listed", "home");
    await card.getByRole("link", { name: /Mancala/ }).first().click();
    await expect(page).toHaveURL(/\/games\/mancala$/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/mancala");
    await expect(page.getByTestId("game-front-door")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
