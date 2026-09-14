import { expect, test, type Locator } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { GAME_FAMILIES } from "../src/lib/gomoku/families";
import { slugFor } from "../src/lib/gomoku/slugs";

import { removeMember, seedMember } from "./members";
import { ready, readyHere } from "./support";
import { removeGames } from "./tidy";

/**
 * A game named in a list shows its picture, and a family's icon is one size.
 *
 * John, 2026-09-14: "Looks like we aren't showing the icons for all the variant
 * games in a family! Why is this when we do it in the other page. The size for
 * the Top Level Family size is better to be larger too, and should be
 * consistent between some pages. Strange how we don't see icons in the Player
 * pages, etc... that's a BUG too."
 *
 * `gamePictures.coverage.test.ts` holds the source to the rule; this holds the
 * rendered page to it, the way a reader meets it: a family opened by clicking
 * its summary, a player's page reached by clicking their name in a record, the
 * set-up screen reached by pressing Play. Every picture is asked whether it has
 * pixels, because a broken image is still an element. Nothing reloads.
 */

/** `FAMILY_ICON_SIZE` is `size-14`: 56 CSS pixels, on every page that shows a family. */
const FAMILY_ICON_PX = 56;

/** Scrolled to, because the boards load lazily, and then asked whether the browser drew it. */
async function drawn(picture: Locator): Promise<void> {
  await picture.scrollIntoViewIfNeeded();
  await expect
    .poll(() => picture.evaluate((image) => (image as HTMLImageElement).naturalWidth), { timeout: 10_000 })
    .toBeGreaterThan(0);
}

async function isFamilySized(mark: Locator): Promise<void> {
  await expect(mark).toBeVisible();
  const box = await mark.boundingBox();
  expect(box, "the family icon has a box").not.toBeNull();
  expect(Math.round(box!.width)).toBe(FAMILY_ICON_PX);
  expect(Math.round(box!.height)).toBe(FAMILY_ICON_PX);
}

test.describe("the games index", () => {
  test("draws a board on every game card of a family opened from its summary", async ({ page }) => {
    await page.goto("/games");
    // The strips under the cards carry the hydration mark; wait on it before clicking anything.
    await readyHere(page.locator('[data-testid="game-stats"]').first());

    // A folded family, opened the way a reader opens it. Its games, in the table's order.
    const family = page.getByTestId("lobby-family").nth(1);
    const games = GAME_FAMILIES[1].games;
    await family.locator("summary").click({ position: { x: 8, y: 8 } });
    const cards = family.getByTestId("family-game");
    await expect(cards.first()).toBeVisible();
    await expect(cards).toHaveCount(games.length);

    for (const [index, variant] of games.entries()) {
      const picture = cards.nth(index).getByTestId("game-thumb");
      await expect(picture, `${variant}'s card draws its board`).toHaveAttribute("data-variant", variant);
      await drawn(picture);
    }
  });

  test("draws a family's icon at the one family size, on /games and on the set-up screen", async ({ page }) => {
    await page.goto("/games");
    await readyHere(page.locator('[data-testid="game-stats"]').first());
    await isFamilySized(page.getByTestId("lobby-family").first().getByTestId("family-mark"));

    // To the set-up screen by its own button, not by address.
    await page.getByTestId("lobby-set-up").click();
    await expect(page).toHaveURL(/\/games\/new$/);
    await ready(page, "set-up-game");

    const tabs = page.getByTestId("set-up-family");
    await expect(tabs).toHaveCount(GAME_FAMILIES.length);
    for (let index = 0; index < GAME_FAMILIES.length; index += 1) {
      await isFamilySized(tabs.nth(index).getByTestId("family-mark"));
    }
  });
});

test.describe("a player's page", () => {
  const STAMP = Date.now().toString(36);
  const MEMBER = { email: `gamepics-${STAMP}@example.test`, name: `Pictor${STAMP}` };
  /** Two unalike games, so a board that is the wrong one cannot pass for the right one. */
  const VARIANTS = ["freestyle", "hex"] as const;
  const made: string[] = [];

  test.beforeAll(async () => {
    process.loadEnvFile(".env");
    expect(isLocalDatabase(process.env.DATABASE_URL), "this spec writes rows, so only to a database on this machine").toBe(
      true,
    );
    await seedMember(MEMBER);
    const prisma = new PrismaClient();
    try {
      const member = await prisma.member.findUnique({ where: { email: MEMBER.email }, select: { id: true } });
      expect(member).not.toBeNull();
      const now = Date.now();
      for (const [index, variant] of VARIANTS.entries()) {
        const id = `gpx-${STAMP}-${index}`;
        const at = new Date(now - (index + 1) * 60_000);
        await prisma.game.create({
          data: {
            id,
            variant,
            size: variant === "hex" ? 11 : 15,
            winLength: 5,
            obstacles: "none",
            opener: "black",
            status: "finished",
            result: "black",
            winner: "black",
            // Friendly: nobody's standing is written, so nothing outlives the games but the member.
            rated: false,
            playedAt: at,
            lastMoveAt: at,
            moveCount: 9,
            blackName: MEMBER.name,
            blackMemberId: member!.id,
            whiteName: `Rin${STAMP}`,
          },
        });
        made.push(id);
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  test.afterAll(async () => {
    await removeGames(made);
    await removeMember(MEMBER.email);
  });

  test("draws a board beside every game in By game and in Recent games", async ({ page }) => {
    // Reached the way a reader reaches a person: their name, in the record of a game they played.
    await page.goto(`/games/${slugFor(VARIANTS[0])}/history`);
    await ready(page, "live-record");
    await page.getByTestId("history-player").filter({ hasText: MEMBER.name }).first().click();
    await expect(page).toHaveURL(/\/players\//);

    const byGame = page.getByTestId("player-by-variant");
    await expect(byGame).toBeVisible();
    for (const variant of VARIANTS) {
      const picture = byGame.locator(`[data-testid="game-thumb"][data-variant="${variant}"]`);
      await expect(picture, `the By game row for ${variant} draws its board`).toHaveCount(1);
      await drawn(picture);
    }

    const recent = page.getByTestId("player-recent-game");
    await expect(recent.first()).toBeVisible();
    await expect(recent).toHaveCount(VARIANTS.length);
    for (let index = 0; index < VARIANTS.length; index += 1) {
      const picture = recent.nth(index).getByTestId("game-thumb");
      await expect(picture).toHaveCount(1);
      await drawn(picture);
    }
  });
});
