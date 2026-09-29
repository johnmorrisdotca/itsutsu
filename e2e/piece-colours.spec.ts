import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext, removeMember } from "./members";
import { matchIdIn, ready, submitIfPending } from "./support";
import { gamesMade } from "./tidy";

/**
 * EACH PLAYER CHOOSES THE COLOUR OF THEIR OWN PIECES. John, 2026-09-29: "allow
 * people to select their Marble colour when they lay their first move, or at
 * Options setup… and just like we have the board colour selection we can have
 * the marble selection… we just do colours, nice colours… This is for
 * essentially all games."
 *
 * Driven by pressing the colours, as a player would: chosen on the set-up
 * screen, changed on the first move, changed again mid-game, and still there
 * after a reload. In a live game the choice is shared, so the second player —
 * a real second member, never a copy of the first's sign-in — sees the first
 * player's colour on their own board, and the first sees the second's arrive
 * without reloading. And the way back: taking a colour off draws the ordinary
 * stones again.
 */

const tidyAway = gamesMade();
const DESK = { width: 1280, height: 800 };

/** A colour as the browser reports it, for the stone's own middle stop (`PIECE_COLOURS.*.flat`). */
const RGB = {
  plum: "rgb(122, 47, 130)",
  red: "rgb(179, 32, 46)",
  teal: "rgb(15, 120, 120)",
  blue: "rgb(36, 86, 181)",
  green: "rgb(37, 122, 66)",
} as const;

async function stoneShows(page: Page, point: string, rgb: string) {
  // The stone is the round span painted with a gradient (`StoneMark`); the intersection holds other spans besides.
  const stone = page.getByRole("button", { name: new RegExp(`^${point}, (Black|White) stone`) }).locator('span[style*="gradient"]').first();
  await expect.poll(() => stone.evaluate((node) => getComputedStyle(node).backgroundImage), { timeout: 15_000 }).toContain(rgb);
}

function member(tag: string) {
  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  return { email: `colours-${tag}-${stamp}@example.test`, name: `Colour${tag}${stamp}` };
}

test.describe("each player's piece colour", () => {
  test("chosen at set-up, changed on the first move and mid-game, kept on a reload, and seen by the other player", async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    const one = member("a");
    const two = member("b");
    const a = await memberContext(browser, baseURL!, one, { viewport: DESK });
    const b = await memberContext(browser, baseURL!, two, { viewport: DESK });
    try {
      const pageA = await a.newPage();
      // At set-up: Plum, with a seat posted for anybody.
      await pageA.goto("/games/gomoku/new?board=9");
      await ready(pageA, "set-up-game");
      await pageA.locator('[data-testid="set-up-piece-colours"] [data-colour="plum"]').click();
      await expect(pageA.locator('[data-testid="set-up-piece-colours"] [data-colour="plum"]')).toHaveAttribute("data-chosen", "true");
      await pageA.getByTestId("set-up-start").click();
      await pageA.waitForURL(/\/games\/gomoku\/match\//, { timeout: 30_000 });
      const id = tidyAway(matchIdIn(pageA.url()));
      await ready(pageA, "shared-game");

      // The first move asks, beside whose turn it is, and shows the set-up's choice.
      const first = pageA.getByTestId("seat-colour");
      await expect(first).toHaveAttribute("data-first", "true");
      await expect(first).toHaveAttribute("data-colour", "plum");
      // Changed on the first move: Deep Red.
      await first.locator('[data-colour="red"]').click();
      await expect(first).toHaveAttribute("data-colour", "red");
      await pageA.getByRole("button", { name: /^E5, empty$/ }).click();
      await submitIfPending(pageA);
      await stoneShows(pageA, "E5", RGB.red);

      // The second player, a member of their own, takes the other seat by its link.
      const prisma = new PrismaClient();
      const row = await prisma.game.findUnique({ where: { id }, select: { whiteToken: true } }).finally(() => prisma.$disconnect());
      const pageB = await b.newPage();
      await pageB.goto(`/games/gomoku/match/${id}/seat/${row!.whiteToken}`);
      await ready(pageB, "shared-game");
      // They see the first player's colour on their own board.
      await stoneShows(pageB, "E5", RGB.red);
      // Deep Red is the other side's: offered, but not to be had.
      const theirs = pageB.getByTestId("seat-colour");
      await expect(theirs).toHaveAttribute("data-first", "true");
      await expect(theirs.locator('[data-colour="red"]')).toBeDisabled();
      await theirs.locator('[data-colour="teal"]').click();
      await expect(theirs).toHaveAttribute("data-colour", "teal");
      await pageB.getByRole("button", { name: /^D4, empty$/ }).click();
      await submitIfPending(pageB);
      await stoneShows(pageB, "D4", RGB.teal);
      // And the first player sees Teal arrive on their board without reloading.
      await stoneShows(pageA, "D4", RGB.teal);

      // Mid-game, from under the board: Blue for the first player, seen across the table.
      const later = pageA.getByTestId("seat-colour");
      await expect(later).toHaveAttribute("data-first", "false");
      await later.locator('[data-colour="blue"]').click();
      await expect(later).toHaveAttribute("data-colour", "blue");
      await stoneShows(pageA, "E5", RGB.blue);
      await stoneShows(pageB, "E5", RGB.blue);

      // Kept: a reload shows the same colours.
      await pageA.reload();
      await ready(pageA, "shared-game");
      await stoneShows(pageA, "E5", RGB.blue);
      await stoneShows(pageA, "D4", RGB.teal);

      // And the way back: the ordinary stones again.
      await pageA.getByTestId("seat-colour").locator('[data-colour="usual"]').click();
      await expect(pageA.getByTestId("seat-colour")).toHaveAttribute("data-colour", "usual");
      const plain = pageA.getByRole("button", { name: /^E5, Black stone/ }).locator('span[style*="gradient"]').first();
      await expect.poll(() => plain.evaluate((node) => getComputedStyle(node).backgroundImage)).not.toContain(RGB.blue);
    } finally {
      await a.close();
      await b.close();
      await removeMember(one.email);
      await removeMember(two.email);
    }
  });

  test("on the practice board, both sides' colours are chosen, changed and kept on a reload", async ({ page }) => {
    await page.setViewportSize(DESK);
    await page.goto("/games/gomoku/play");
    await ready(page, "game-view");
    await page.getByRole("button", { name: /^H8, empty$/ }).click();
    await page.locator('[data-testid="seat-colours-black"] [data-colour="green"]').click();
    await stoneShows(page, "H8", RGB.green);
    // White may not take Green, the other side's.
    await expect(page.locator('[data-testid="seat-colours-white"] [data-colour="green"]')).toBeDisabled();
    await page.locator('[data-testid="seat-colours-black"] [data-colour="plum"]').click();
    await stoneShows(page, "H8", RGB.plum);
    await page.reload();
    await ready(page, "game-view");
    await stoneShows(page, "H8", RGB.plum);
    // Back to the ordinary stones, which is where every other spec's board stays.
    await page.locator('[data-testid="seat-colours-black"] [data-colour="usual"]').click();
    await expect(page.locator('[data-testid="seat-colours-side"][data-side="black"]')).toHaveAttribute("data-colour", "usual");
  });

  test("at a pass-and-play table, each place chooses at set-up and on its turn, and it is kept", async ({ page }) => {
    await page.setViewportSize(DESK);
    await page.goto("/games/chinese-checkers/pass-and-play");
    await ready(page, "party-set-up");
    // At set-up: Player 1's marble, pressed, opens the colours; Teal.
    await page.locator('[data-testid="set-up-seat-colour"][data-seat="0"]').click();
    await page.locator('[data-testid="set-up-seat-colour-picker"] [data-colour="teal"]').click();
    await expect(page.locator('[data-testid="set-up-seat-colour"][data-seat="0"]')).toHaveAttribute("data-colour", "teal");
    await page.getByTestId("party-start").click();
    await ready(page, "party-checkers");
    // In the game, on their turn: Player 1 changes to Plum; the turn line's marble follows.
    const mine = page.getByTestId("party-seat-colour");
    await expect(mine).toHaveAttribute("data-seat", "0");
    await expect(mine).toHaveAttribute("data-colour", "teal");
    await mine.locator('[data-colour="plum"]').click();
    await expect(mine).toHaveAttribute("data-colour", "plum");
    await expect(page.getByTestId("party-turn")).toContainText("Plum");
    await page.reload();
    await ready(page, "party-checkers");
    await expect(page.getByTestId("party-seat-colour")).toHaveAttribute("data-colour", "plum");
    // Back to the table's own red, so the next spec at this table finds it as it was.
    await page.getByTestId("party-seat-colour").locator('[data-colour="usual"]').click();
    await expect(page.getByTestId("party-seat-colour")).toHaveAttribute("data-colour", "usual");
  });
});
