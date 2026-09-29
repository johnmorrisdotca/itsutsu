import { expect, test, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * DOTS AND BOXES, PASSED ROUND ONE DEVICE: the first party game of its own
 * (`PartyKind`), at home on the Party games shelf.
 *
 * Driven as a table would drive it: from the game's own page, by pressing
 * Play, choosing how many and which board, naming the players, then tapping
 * between two dots. The game lives in this browser only, so each case starts
 * by clearing this browser's kept game; nothing here writes to the database.
 *
 * Lines are numbered as the rules number them (`dotsAndBoxes.types.ts`). On a
 * board of 3×3 boxes the lines across are 0–11, row by row of dots, and the
 * lines down 12–23: box 0, the top left, has sides 0 (top), 3 (bottom), 12
 * (left) and 13 (right).
 */

const KEPT = "itsutsu.dotsAndBoxes";

const line = (page: Page, number: number) => page.locator(`[data-testid="dots-line"][data-line="${number}"]`);

/** Tap between two dots, as a finger would, and wait for the line to land. */
async function draw(page: Page, number: number) {
  const drawn = Number(await page.getByTestId("dots-game").getAttribute("data-lines"));
  await line(page, number).click();
  await expect(page.getByTestId("dots-game")).toHaveAttribute("data-lines", String(drawn + 1));
  await expect(page.locator(`[data-testid="dots-drawn"][data-line="${number}"]`)).toHaveCount(1);
}

test.describe("Dots and Boxes, read by anybody", () => {
  // Reading is open: the game's page and its rules name games and nobody who plays them.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and its rules open with no session, and Play asks a stranger to join", async ({ page }) => {
    await page.goto("/games/dots-and-boxes");
    await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
    await expect(page.getByRole("heading", { name: /Dots and Boxes/ })).toBeVisible();
    await expect(page.getByTestId("party-offered")).toContainText("2–6 players");
    // Its family is Party games, whose page is its own address, and the guests on its shelf are listed beside it.
    await expect(page.getByTestId("game-family")).toContainText("Party games");
    await expect(page.getByTestId("facet-family")).toHaveAttribute("href", "/games/party");

    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(/\/games\/dots-and-boxes\/rules$/);
    const rules = page.getByTestId("rules-page");
    await expect(rules).toContainText("fourth side of a box");
    await expect(rules).toContainText("share the win");

    // The picture really loads.
    const picture = page.locator('img[src="/art/games/dotsAndBoxes.jpg"]').first();
    await expect(picture).toBeVisible();
    expect(await picture.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

    // Playing is for members: a stranger pressing Play is asked for an invite.
    await page.goto("/games/dots-and-boxes");
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/join/);
  });
});

test.describe("Dots and Boxes, pass and play", () => {
  test("three players draw by name, a box closed gives the drawer another line, and the game is kept, waits on My games and ends with the score", async ({ page }) => {
    await page.goto("/games/dots-and-boxes");
    await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);

    // From the front door, by the one big Play.
    await page.goto("/games/dots-and-boxes");
    await ready(page, "party-kind-offer");
    await expect(page.getByTestId("game-set-up")).toHaveText("Play →");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/games\/dots-and-boxes\/pass-and-play$/);
    await ready(page, "dots-set-up");

    // Three at the table, on the smallest board; the preview is the live board at the size chosen.
    await page.locator('[data-testid="dots-count"][data-count="3"]').click();
    await page.locator('[data-testid="dots-size"][data-size="3"]').click();
    await expect(page.getByTestId("dots-preview").getByTestId("dots-board")).toHaveAttribute("data-size", "3");
    await page.getByTestId("dots-name").nth(0).fill("Ann");
    await page.getByTestId("dots-name").nth(1).fill("Ben");
    // The third leaves their name blank and is called by their place at the table.
    await page.getByTestId("dots-start").click();
    await ready(page, "dots-game");
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-players", "3");
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-state", "playing");
    await expect(page.getByTestId("dots-line")).toHaveCount(24);
    await expect(page.getByTestId("dots-turn-name")).toHaveText("Ann");

    // A line that closes nothing passes the turn round the table.
    await draw(page, 0);
    await expect(page.getByTestId("dots-turn-name")).toHaveText("Ben");
    await draw(page, 3);
    await expect(page.getByTestId("dots-turn-name")).toHaveText("Player 3");
    await draw(page, 12);
    await expect(page.getByTestId("dots-turn-name")).toHaveText("Ann");
    await expect(page.getByTestId("dots-box")).toHaveCount(0);

    // Ann draws the fourth side: the box is hers, in her colour with her letter, and she draws again.
    await draw(page, 13);
    const box = page.locator('[data-testid="dots-box"][data-box="0"]');
    await expect(box).toHaveAttribute("data-owner", "0");
    await expect(box).toContainText("R");
    await expect(page.getByTestId("dots-turn-name")).toHaveText("Ann");
    await expect(page.getByTestId("dots-turn")).toHaveAttribute("data-again", "true");
    await expect(page.getByTestId("dots-extra-turn")).toHaveText("Closed a box: draw again.");
    await expect(page.locator('[data-testid="dots-player"][data-player="0"]')).toHaveAttribute("data-boxes", "1");
    // A line already drawn is no longer there to tap.
    await expect(line(page, 13)).toHaveCount(0);

    // Kept in this browser: a reload brings back the same table, the same boxes and the same turn.
    await page.reload();
    await ready(page, "dots-game");
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-lines", "4");
    await expect(page.getByTestId("dots-turn-name")).toHaveText("Ann");
    await expect(box).toHaveAttribute("data-owner", "0");

    // And it waits on My games' Pass and play tab, with the way back.
    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="party-game"][data-variant="dotsAndBoxes"]');
    await expect(card).toContainText("3 players");
    await expect(card).toContainText("4 of 24 lines drawn.");
    await expect(card).toContainText("Ann to play");
    await card.getByTestId("party-game-continue").click();
    await ready(page, "dots-game");
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-lines", "4");

    // The front door says Continue while it is going.
    await page.goto("/games/dots-and-boxes");
    await ready(page, "party-kind-offer");
    await expect(page.getByTestId("game-set-up")).toHaveText("Continue →");
    await page.getByTestId("game-set-up").click();
    await ready(page, "dots-game");

    // On a phone the whole table fits the width of the glass, with nothing to scroll sideways.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("dots-turn")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    // Every other line, tapped in turn by whoever the turn line names, to the end.
    for (let left = 20; left > 0; left -= 1) {
      const next = Number(await page.getByTestId("dots-line").first().getAttribute("data-line"));
      await draw(page, next);
    }
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("dots-line")).toHaveCount(0);
    await expect(page.getByTestId("dots-box")).toHaveCount(9);

    // The score: nine boxes between the three, and the winner line names everybody level on the most.
    const held = await page.getByTestId("dots-player").evaluateAll((rows) => rows.map((row) => Number(row.getAttribute("data-boxes"))));
    expect(held.reduce((sum, count) => sum + count, 0)).toBe(9);
    const most = Math.max(...held);
    const winners = held.flatMap((count, seat) => (count === most ? [seat] : []));
    const winner = page.getByTestId("dots-winner");
    await expect(winner).toHaveAttribute("data-winners", winners.join(","));
    await expect(winner).toContainText(winners.length === 1 ? "wins, with" : "share the win");
    await expect(winner).toContainText(`${most} ${most === 1 ? "box" : "boxes"}`);

    // The same table again, from nothing, the next player round drawing first — and waiting on My games as it goes.
    await page.getByTestId("dots-again").click();
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-state", "playing");
    await expect(page.getByTestId("dots-game")).toHaveAttribute("data-lines", "0");
    await expect(page.getByTestId("dots-turn-name")).toHaveText("Ben");
    await page.goto("/play/pass-and-play");
    await expect(page.locator('[data-testid="party-game"][data-variant="dotsAndBoxes"]')).toContainText("Ben to play");
  });
});

test.describe("Dots and Boxes on the Party games shelf", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is at home there, before the games shown from other families, and leads to its own page", async ({ page }) => {
    await page.goto("/games/party");
    const card = page.getByTestId("family-game-dotsAndBoxes");
    await expect(card).toHaveAttribute("data-listed", "home");
    await expect(card.getByTestId("family-game-home")).toHaveCount(0);
    await card.getByRole("link", { name: /Dots and Boxes/ }).first().click();
    await expect(page).toHaveURL(/\/games\/dots-and-boxes$/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/dots-and-boxes");
    await expect(page.getByTestId("game-front-door")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
