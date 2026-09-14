import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext, memberIdFor, removeMember, removePlayedUnder, seedLadderRow } from "./members";
import { removeGame } from "./tidy";
import { xpForLevel } from "../src/lib/xp/xpCurve";

/**
 * WHO IS WAITING, AND HOW STRONG THEY ARE.
 *
 * The waiting room lists every seat somebody has posted. A reader choosing one
 * wants the poster's strength before sitting down, so each line shows the
 * rating the ladder would print — pool and tier together — and the XP level.
 *
 * Its own world: a poster made here, with a rating row and a total seeded so
 * the figures are known, posting a seat through the route a person uses, and all
 * of it taken away afterwards. Driven by the controls a reader presses — the
 * rating filter, then the level badge — and every absence is asserted after the
 * filter it depends on has been seen to take effect.
 */
test.describe("the waiting room shows each poster's strength", () => {
  test("a poster's rating and level are on their seat, the rating filter reads them, and the level leads to its rung", async ({
    page,
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    // One token, so `shownName` prints it whole and the spec can find what it seeded.
    const poster = { email: `standing-poster-${stamp}@example.test`, name: `Standing-${stamp}` };
    const theirs = await memberContext(browser, baseURL ?? "http://localhost:6600", poster);
    const memberId = await memberIdFor(poster.email);
    let gameId: string | null = null;

    try {
      // Established on the ladder of people at 1712, and standing on level 7.
      await seedLadderRow({ name: poster.name, rating: 1712, games: 25, wins: 15, losses: 10, memberId });
      process.loadEnvFile(".env");
      const prisma = new PrismaClient();
      try {
        await prisma.member.update({ where: { id: memberId }, data: { xp: xpForLevel(7) } });
      } finally {
        await prisma.$disconnect();
      }

      const posted = await theirs.request.post("/api/games/live", {
        data: { blackName: poster.name, variant: "trapThree", size: 5, open: true, moveTimeMs: null },
      });
      expect(posted.status(), await posted.text()).toBe(201);
      gameId = ((await posted.json()) as { id: string }).id;

      await page.goto("/games");
      const seat = page.getByTestId("open-game").filter({ hasText: poster.name });
      await expect(seat).toBeVisible();
      await expect(seat.getByTestId("open-game-rating")).toHaveText("1712 · Established");
      await expect(seat.getByTestId("open-game-level")).toHaveAttribute("data-level", "7");

      // The filter reads the same figure: 1712 is on the "and up" side of 1600.
      await page.getByTestId("seat-rating-over").click();
      await expect(page.getByTestId("seat-rating-over")).toHaveAttribute("aria-current", "true");
      await expect(seat).toBeVisible();

      await page.getByTestId("seat-rating-under").click();
      await expect(page.getByTestId("seat-rating-under")).toHaveAttribute("aria-current", "true");
      // The board is there, narrowed: the seat is gone from it.
      await expect(page.getByTestId("open-games")).toBeVisible();
      await expect(seat).toHaveCount(0);

      await page.getByTestId("seat-rating-any").click();
      await expect(page.getByTestId("seat-rating-any")).toHaveAttribute("aria-current", "true");
      await expect(seat).toBeVisible();

      // And the level is a way to its rung.
      await seat.getByTestId("open-game-level").click();
      await expect(page).toHaveURL(/\/xp\/levels\/7$/);
      await expect(page.getByTestId("level-name-heading")).toBeVisible();
    } finally {
      if (gameId !== null) await removeGame(gameId);
      await removePlayedUnder([poster.name]);
      await theirs.close();
      await removeMember(poster.email);
    }
  });
});
