import { expect, test, type Locator } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { GAME_FAMILIES, boardGamesOf } from "../src/lib/gomoku/families";
import { slugFor } from "../src/lib/gomoku/slugs";

import { removeMember, seedMember } from "./members";
import { chooseGame, openChoice, openMoreSettings, openSetUpPage, ready, readyHere } from "./support";
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

/**
 * The site's two picture sizes, as the browser draws them. John, 2026-09-15:
 * "from multiple icon sizes to exactly two, regular and large" — regular the
 * set-up page's board tile, large "exactly DOUBLE the regular size, for
 * symmetry". `PICTURE_PX` holds them; they are written out here so this
 * measures the page rather than agreeing with the constant.
 */
const REGULAR_PX = 70;
const LARGE_PX = REGULAR_PX * 2;
/** And for a table, a ledger or a row of a list — John: "Tables keep small pictures". */
const SMALL_PX = REGULAR_PX / 2;

/** Scrolled to, because the boards load lazily, and then asked whether the browser drew it. */
async function drawn(picture: Locator): Promise<void> {
  await picture.scrollIntoViewIfNeeded();
  await expect
    .poll(() => picture.evaluate((image) => (image as HTMLImageElement).naturalWidth), { timeout: 10_000 })
    .toBeGreaterThan(0);
}

/** A picture's side in CSS pixels, once it is on screen and known to be square. */
async function sideOf(picture: Locator): Promise<number> {
  await expect(picture).toBeVisible();
  const box = await picture.boundingBox();
  expect(box, "the picture has a box").not.toBeNull();
  expect(Math.round(box!.height), "the picture is square").toBe(Math.round(box!.width));
  return Math.round(box!.width);
}

/** The words under a picture, on one line that stays inside the tile holding it. */
async function isOneLineInside(label: Locator, tile: Locator): Promise<void> {
  const [text, frame] = [await label.boundingBox(), await tile.boundingBox()];
  expect(text, "the label has a box").not.toBeNull();
  const lineHeight = await label.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
  expect(Math.round(text!.height), "one line, not two").toBeLessThanOrEqual(Math.ceil(lineHeight));
  expect(text!.x, "inside the tile on the left").toBeGreaterThanOrEqual(frame!.x);
  expect(text!.x + text!.width, "inside the tile on the right").toBeLessThanOrEqual(frame!.x + frame!.width);
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

  test("draws a family's icon at the regular size, on /games and on the set-up screen, its name on one line", async ({
    page,
  }) => {
    await page.goto("/games");
    await readyHere(page.locator('[data-testid="game-stats"]').first());
    expect(await sideOf(page.getByTestId("lobby-family").first().getByTestId("family-mark"))).toBe(REGULAR_PX);
    await drawn(page.getByTestId("lobby-family").first().getByTestId("game-thumb").first());
    expect(await sideOf(page.getByTestId("lobby-family").first().getByTestId("game-thumb").first())).toBe(REGULAR_PX);

    // To the set-up screen by its own button, not by address.
    await page.getByTestId("lobby-set-up").click();
    await expect(page).toHaveURL(/\/games\/new$/);
    await ready(page, "set-up-game");

    const tabs = page.getByTestId("set-up-family");
    // Every family, the ones with a game two people can play first and then the puzzles (0.285.2: John wanted Numbers on this screen too).
    const offered = [
      ...GAME_FAMILIES.filter((family) => boardGamesOf(family).length > 0),
      ...GAME_FAMILIES.filter((family) => boardGamesOf(family).length === 0),
    ];
    await expect(tabs).toHaveCount(offered.length);
    for (let index = 0; index < offered.length; index += 1) {
      const tab = tabs.nth(index);
      expect(await sideOf(tab.getByTestId("family-mark")), offered[index].title).toBe(REGULAR_PX);
      // English only: the name and nothing else, on one line inside its tile ("Pieces and twists" used to wrap).
      const label = tab.locator(":scope > span");
      await expect(label).toHaveText(offered[index].title);
      // The tile keeps two lines' room for a longer name (`PICK_TILE_NAME`); a family's own takes one at a desk.
      await isOneLineInside(label.locator(":scope > span"), tab);
    }
  });
});

test.describe("the set-up page and the page before a game", () => {
  test("draws the family tile, the game chip and the board tile at one size", async ({
    page,
  }) => {
    await openSetUpPage(page);
    // Checkers, chosen the way a reader chooses it — its family, then the game — for its one 8×8 board.
    await chooseGame(page, "checkers");
    await openMoreSettings(page);

    const chip = page.locator('[data-testid="set-up-variant"][data-variant="checkers"]');
    await drawn(chip.getByTestId("game-thumb"));
    const board = page.locator('[data-testid="set-up-size"][data-size="8"]');
    /*
     * THE SIZES ARE READ OFF THE TILES, and a settled choice folds its tiles
     * away behind a row saying what it is (`SetUpFold`). So the fold is opened
     * first — by the same Change a reader presses — and every picture is then
     * scoped to the TILE it belongs to. `getByTestId("rated-icon").first()`
     * used to be that tile's icon and is now the folded row's, which is the
     * site's SMALL size because a row takes a row's picture; asked loosely, this
     * read 35 where it meant 70 and called the page wrong.
     */
    await openChoice(page, "set-up-rated-fold");
    const sides = {
      family: await sideOf(page.locator('[data-testid="set-up-family"][data-open="true"]').getByTestId("family-mark")),
      game: await sideOf(chip.getByTestId("game-thumb")),
      board: await sideOf(board.getByTestId("board-size-mark")),
      opening: await sideOf(page.getByTestId("set-up-opening").first().getByTestId("opening-mark")),
      rated: await sideOf(page.locator('[data-testid="set-up-rated"]').first().getByTestId("rated-icon")),
      opponent: await sideOf(page.getByTestId("set-up-opponent").first().getByTestId("seat-mark")),
    };
    expect(sides, "every picture on the set-up page is the regular size").toEqual({
      family: REGULAR_PX,
      game: REGULAR_PX,
      board: REGULAR_PX,
      opening: REGULAR_PX,
      rated: REGULAR_PX,
      opponent: REGULAR_PX,
    });
    /*
     * AND THE FOLDED ROW'S OWN PICTURE IS THE SMALL ONE — half of a tile's,
     * which is what every row and table on this site draws. Said here because
     * the fold introduced a second size to this screen, and a size nobody
     * asserts is a size that drifts.
     */
    const foldedIcon = page.getByTestId("set-up-rated-fold").getByTestId("rated-icon").first();
    expect(await sideOf(foldedIcon), "the folded row's icon is a row's picture").toBe(SMALL_PX);

    // The board tile's name is English only, one line: "Eight", not "Eight 八路".
    await expect(board.getByTestId("set-up-size-name")).toHaveText("Eight");
    await isOneLineInside(board.getByTestId("set-up-size-name").locator(":scope > span"), board);

    /*
     * THE LARGE PICTURE IS THE DOORSTEP'S, AND IT IS ASSERTED WHERE THE
     * DOORSTEP IS NOW REACHED. This case used to press Continue and read it on
     * the next page; the set-up screen states and begins a game of your own,
     * so that press lands on a board. The doorstep stands in front of somebody
     * else's posted seat, and `doorstep-pictures.spec.ts` drives it there and
     * asserts exactly this — the board at twice the tile it was chosen from,
     * its name on one line, no size text beside it.
     *
     * What is left here is the claim this file is about: every picture on the
     * set-up screen is the regular size, and the doubling is a real number
     * rather than a coincidence of two measurements.
     */
    expect(sides.board * 2, "large is twice regular").toBe(LARGE_PX);
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
      expect(await sideOf(picture), `the By game row for ${variant} keeps a small picture`).toBe(SMALL_PX);
    }

    const recent = page.getByTestId("player-recent-game");
    await expect(recent.first()).toBeVisible();
    await expect(recent).toHaveCount(VARIANTS.length);
    for (let index = 0; index < VARIANTS.length; index += 1) {
      const picture = recent.nth(index).getByTestId("game-thumb");
      await expect(picture).toHaveCount(1);
      await drawn(picture);
      expect(await sideOf(picture), "a Recent games row keeps a small picture").toBe(SMALL_PX);
    }
  });
});
