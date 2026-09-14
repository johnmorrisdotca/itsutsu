import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext, memberIdFor, removeMember, removePlayedUnder, seedLadderRow } from "./members";
import { ready } from "./support";
import { removeGame } from "./tidy";
import { standingData } from "./xpStanding";
import { xpForLevel } from "../src/lib/xp/xpCurve";

/**
 * THE WAITING ROOM: WHO IS WAITING, AT WHAT, AND HOW STRONG THEY ARE.
 *
 * John, pointing at ItsYourTurn's: "We don't have a specific waiting room do
 * we?" One table across every game, sorted by game name, with the game and its
 * rules, the time limit, and each player's rating, XP, level and country — and a
 * way to sit down at exactly that seat, through the page that states its game.
 *
 * Its own world: a poster made here with a rating row, a total and a country,
 * posting a seat through the route a person uses, and all of it taken away
 * afterwards. Driven by what a reader presses — the rating filter, the level
 * badge, Sit down — and every absence is asserted after the presence it depends
 * on has been seen.
 */
test.describe("the waiting room", () => {
  test("one table shows each waiting player's strength and place, keeps its headings when narrowed, and sits you down through the doorstep", async ({
    page,
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    // One token, so `shownName` prints it whole and the spec can find what it seeded.
    const poster = { email: `standing-poster-${stamp}@example.test`, name: `Standing-${stamp}`, country: "Japan" };
    const theirs = await memberContext(browser, baseURL ?? "http://localhost:6600", poster);
    const memberId = await memberIdFor(poster.email);
    let gameId: string | null = null;

    try {
      // Established on the ladder of people at 1712, and standing on level 7.
      await seedLadderRow({ name: poster.name, rating: 1712, games: 25, wins: 15, losses: 10, memberId });
      process.loadEnvFile(".env");
      const prisma = new PrismaClient();
      try {
        await prisma.member.update({ where: { id: memberId }, data: standingData({ here: xpForLevel(7) }) });
      } finally {
        await prisma.$disconnect();
      }

      const posted = await theirs.request.post("/api/games/live", {
        data: { blackName: poster.name, variant: "trapThree", size: 5, open: true, moveTimeMs: null },
      });
      expect(posted.status(), await posted.text()).toBe(201);
      gameId = ((await posted.json()) as { id: string }).id;

      await page.goto("/games");
      const room = page.getByTestId("waiting-room");
      const seat = room.getByTestId("open-game").filter({ hasText: poster.name });
      await expect(seat).toBeVisible();

      // One table, with the columns a waiting room reads by.
      for (const heading of ["Game", "Time limit", "Player", "Rating", "XP", "Location"]) {
        await expect(room.locator("thead th").filter({ hasText: heading })).toHaveCount(1);
      }

      // The player, by id; their strength; where they are; the time limit in words.
      await expect(seat.locator(`a[href="/players/${memberId}"]`)).toHaveCount(1);
      await expect(seat.getByTestId("open-game-rating")).toHaveText("1712 · Established");
      await expect(seat.getByTestId("open-game-level")).toHaveAttribute("data-level", "7");
      await expect(seat.getByTestId("record-xp")).toHaveText(/1,?050/);
      await expect(seat.getByTestId("open-game-location")).toContainText("Japan");
      await expect(seat.getByTestId("open-game-clock")).toContainText("No clock");
      // The game leads to the game, and the rules are one press away on the row.
      await expect(seat.getByTestId("open-game-rules")).toHaveAttribute("href", /^\/games\/[^/]+\/rules$/);

      // The rating filter reads the same figure: 1712 is on the "and up" side of 1600.
      await page.getByTestId("seat-rating-over").click();
      await expect(page.getByTestId("seat-rating-over")).toHaveAttribute("aria-current", "true");
      await expect(seat).toBeVisible();

      // Narrowed the other way, the seat goes — and the table keeps its headings.
      await page.getByTestId("seat-rating-under").click();
      await expect(page.getByTestId("seat-rating-under")).toHaveAttribute("aria-current", "true");
      await expect(room.locator("thead th").filter({ hasText: "Player" })).toBeVisible();
      await expect(seat).toHaveCount(0);

      await page.getByTestId("seat-rating-any").click();
      await expect(page.getByTestId("seat-rating-any")).toHaveAttribute("aria-current", "true");
      await expect(seat).toBeVisible();

      // The level is a way to its rung.
      await seat.getByTestId("open-game-level").click();
      await expect(page).toHaveURL(/\/xp\/levels\/7$/);
      await expect(page.getByTestId("level-name-heading")).toBeVisible();

      // Sit down leads to the doorstep for exactly this seat, which names the poster before anybody sits.
      await page.goto("/games");
      await room.getByTestId("open-game").filter({ hasText: poster.name }).getByTestId("sit").click();
      await expect(page).toHaveURL(new RegExp(`/begin\\?.*sit=${gameId}`));
      await ready(page, "doorstep");
      await expect(page.getByTestId("doorstep-begin")).toContainText(poster.name);
    } finally {
      if (gameId !== null) await removeGame(gameId);
      await removePlayedUnder([poster.name]);
      await theirs.close();
      await removeMember(poster.email);
    }
  });
});
