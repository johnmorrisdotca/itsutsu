import { expect, test, type Locator, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { GAME_FAMILIES } from "../src/lib/gomoku/families";
import { slugFor } from "../src/lib/gomoku/slugs";
import { playerKey } from "../src/lib/rating/playerKey";
import { shownName } from "../src/lib/rating/shownName";

import { removeMember, seedMember } from "./members";
import { ready, readyHere } from "./support";
import { removeGames } from "./tidy";

/**
 * The games index says what has been played of every game, and who is best at it.
 *
 * John, on /games: "we see there are 2 captures games in this family... but
 * don't see links to the leaderboards or extended stats. The Top Winner of
 * these leaderboards... Could say 'TOP PLAYER: SO AND SO with 12-0 record'."
 *
 * THIS SPEC BRINGS ITS OWN WORLD. It picks two games that hold no finished
 * game and no standing on this database — checked, and failed loudly rather
 * than skipped when there are not two — seeds two members of its own, five
 * rated games between them at the first, and the standings those games would
 * have written, and removes all of it afterwards. It never touches the
 * operator's row or anybody else's: the figures it asserts are the ones it
 * made, which is the only way a count here is a statement about the code.
 *
 * DRIVEN THE WAY A READER DRIVES IT. Each view is reached by clicking its chip
 * rather than by typing its address, a record number is clicked rather than
 * its href read, and nothing reloads. Every wait is on a ready mark — the strip
 * carries one — and every absence is asserted after a presence in the same
 * strip.
 */

const STAMP = Date.now().toString(36);
const WINNER = { email: `gstats-${STAMP}-kaede@example.test`, name: `Kaede ${STAMP}` };
const LOSER = { email: `gstats-${STAMP}-ren@example.test`, name: `Ren ${STAMP}` };

/** What the winner's standing says, and what the games below add up to. */
const RECORD = { wins: 3, losses: 1, draws: 1 };
const PLAYED = RECORD.wins + RECORD.losses + RECORD.draws;

const every = GAME_FAMILIES.flatMap((family) => family.games);
let seeded = "";
let unplayed = "";
const madeGames: string[] = [];

function database(): PrismaClient {
  process.loadEnvFile(".env");
  expect(isLocalDatabase(process.env.DATABASE_URL), "this spec writes rows, so only to a database on this machine").toBe(
    true,
  );
  return new PrismaClient();
}

test.beforeAll(async () => {
  const prisma = database();
  try {
    const [games, standings] = await Promise.all([
      prisma.game.groupBy({ by: ["variant"], _count: { _all: true } }),
      prisma.playerVariantRating.groupBy({ by: ["variant"], _count: { _all: true } }),
    ]);
    const touched = new Set([...games, ...standings].map((row) => row.variant));
    const empty = every.filter((variant) => !touched.has(variant));
    expect(empty.length, "two games with nothing played and no standing, to seed one and leave one").toBeGreaterThanOrEqual(2);
    [seeded, unplayed] = empty;

    await seedMember(WINNER);
    await seedMember(LOSER);
    const members = await prisma.member.findMany({
      where: { email: { in: [WINNER.email, LOSER.email] } },
      select: { id: true, email: true },
    });
    const idOf = (email: string) => members.find((member) => member.email === email)?.id ?? null;
    const winnerId = idOf(WINNER.email);
    const loserId = idOf(LOSER.email);
    expect(winnerId).not.toBeNull();
    expect(loserId).not.toBeNull();

    // Three wins for the winner, one loss, one draw — all rated, both seats people.
    const results = ["black", "black", "black", "white", "draw"] as const;
    const now = Date.now();
    for (const [index, result] of results.entries()) {
      const id = `gst-${STAMP}-${index}`;
      const at = new Date(now - (results.length - index) * 60_000);
      await prisma.game.create({
        data: {
          id,
          variant: seeded,
          size: 15,
          winLength: 5,
          obstacles: "none",
          opener: "black",
          status: "finished",
          result,
          winner: result === "draw" ? null : result,
          rated: true,
          playedAt: at,
          lastMoveAt: at,
          moveCount: 9,
          blackName: WINNER.name,
          blackMemberId: winnerId,
          whiteName: LOSER.name,
          whiteMemberId: loserId,
        },
      });
      madeGames.push(id);
    }

    // The standings those games write, as `recordResult` would have left them.
    await prisma.playerVariantRating.createMany({
      data: [
        {
          key: playerKey(WINNER.name),
          memberId: winnerId,
          variant: seeded,
          name: WINNER.name,
          rating: 1712,
          ratedGames: PLAYED,
          ...RECORD,
        },
        {
          key: playerKey(LOSER.name),
          memberId: loserId,
          variant: seeded,
          name: LOSER.name,
          rating: 1488,
          ratedGames: PLAYED,
          wins: RECORD.losses,
          losses: RECORD.wins,
          draws: RECORD.draws,
        },
      ],
    });
  } finally {
    await prisma.$disconnect();
  }
});

test.afterAll(async () => {
  await removeGames(madeGames);
  const prisma = database();
  try {
    await prisma.playerVariantRating.deleteMany({
      where: { variant: seeded, key: { in: [playerKey(WINNER.name), playerKey(LOSER.name)] } },
    });
  } finally {
    await prisma.$disconnect();
  }
  await removeMember(WINNER.email);
  await removeMember(LOSER.email);
});

/** One game's strip, once the browser has taken it over. */
async function stripOf(page: Page, variant: string): Promise<Locator> {
  const strip = page.locator(`[data-testid="game-stats"][data-variant="${variant}"]`);
  await readyHere(strip);
  return strip;
}

/** The figures the seeded game must show, in whichever view it is drawn. */
async function showsTheSeededGame(strip: Locator, named: boolean): Promise<void> {
  await expect(strip).toBeVisible();
  await expect(strip.getByTestId("game-stats-played-count")).toHaveText(String(PLAYED));
  await expect(strip.getByTestId("game-stats-top")).toHaveAttribute("data-pool", "people");
  await expect(strip.getByTestId("game-stats-won")).toHaveText(String(RECORD.wins));
  await expect(strip.getByTestId("game-stats-lost")).toHaveText(String(RECORD.losses));
  await expect(strip.getByTestId("game-stats-drawn")).toHaveText(String(RECORD.draws));
  if (named) {
    await expect(strip.getByTestId("game-stats-top-name")).toHaveText(shownName(WINNER.name));
  } else {
    // Presence first — the invitation — and only then the absence of a name.
    await expect(strip.getByTestId("game-stats-join-to-see")).toHaveAttribute("href", "/join");
    await expect(strip.getByTestId("game-stats-top-name")).toHaveCount(0);
  }
}

/** A game nobody has played: the same strip, saying so, with the way in. */
async function invitesTheFirstGame(strip: Locator, href: string): Promise<void> {
  await expect(strip.getByTestId("game-stats-nobody")).toHaveText("Nobody has played this yet");
  await expect(strip.getByTestId("game-stats-be-first")).toHaveAttribute("href", href);
  await expect(strip.getByTestId("game-stats-top")).toBeVisible();
  await expect(strip.getByTestId("game-stats-played-count")).toHaveCount(0);
}

/** Opens the folded family a game is in, the way a reader does: its summary. */
async function openFamilyOf(page: Page, strip: Locator): Promise<void> {
  const family = page.getByTestId("lobby-family").filter({ has: strip });
  if ((await family.getAttribute("open")) === null) {
    await family.locator("summary").click({ position: { x: 8, y: 8 } });
  }
  await expect(strip).toBeVisible();
}

test.describe("a member reading the games index", () => {
  test("sees each game's figures and top player in all three views, and each record number opens exactly those games", async ({
    page,
  }) => {
    await page.goto("/games");

    // FAMILIES, the view /games opens on.
    let strip = await stripOf(page, seeded);
    await openFamilyOf(page, strip);
    await showsTheSeededGame(strip, true);
    await expect(strip.getByTestId("game-stats-standings")).toHaveAttribute("href", `/games/${slugFor(seeded)}/standings`);

    // CARDS, by its chip.
    await page.getByTestId("catalogue-view-cards").click();
    await ready(page, "letter-filter");
    strip = await stripOf(page, seeded);
    await showsTheSeededGame(strip, true);
    await invitesTheFirstGame(await stripOf(page, unplayed), `/games/${slugFor(unplayed)}/play`);

    // PLAIN LIST, by its chip.
    await page.getByTestId("catalogue-view-list").click();
    await expect(page).toHaveURL(/view=list/);
    strip = await stripOf(page, seeded);
    await showsTheSeededGame(strip, true);
    await expect(strip.getByTestId("game-stats-last")).toHaveText("Last played today");
    const empty = await stripOf(page, unplayed);
    await invitesTheFirstGame(empty, `/games/${slugFor(unplayed)}/play`);
    await expect(empty.getByTestId("game-stats-no-standing")).toHaveText("No rated games yet");

    // And the promise a number makes: three wins lead to three games.
    await strip.getByTestId("game-stats-won").click();
    await expect(page).toHaveURL(new RegExp(`/games/${slugFor(seeded)}/history\\?`));
    await expect(page).toHaveURL(/outcome=won/);
    await expect(page).toHaveURL(/pool=people/);
    await expect(page).toHaveURL(/rated=yes/);
    await ready(page, "live-record");
    await expect(page.getByTestId("history-row")).toHaveCount(RECORD.wins);
  });

  test("the games-played count opens every game it counted", async ({ page }) => {
    await page.goto("/games");
    await page.getByTestId("catalogue-view-list").click();
    const strip = await stripOf(page, seeded);
    await expect(strip.getByTestId("game-stats-played-count")).toHaveText(String(PLAYED));
    await strip.getByTestId("game-stats-played-count").click();
    await expect(page).toHaveURL(/outcome=decided/);
    await ready(page, "live-record");
    await expect(page.getByTestId("history-row")).toHaveCount(PLAYED);
  });
});

test.describe("a reader with no invite", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sees the figures and an invitation, and nobody's name", async ({ page }) => {
    await page.goto("/games");
    await page.getByTestId("catalogue-view-list").click();
    await expect(page).toHaveURL(/view=list/);

    await showsTheSeededGame(await stripOf(page, seeded), false);
    const empty = await stripOf(page, unplayed);
    await invitesTheFirstGame(empty, "/join");
    await expect(empty.getByTestId("game-stats-be-first")).toContainText("join to be the first");

    // The open page names no member — e2e/gate.spec.ts's rule, for these names in particular.
    const said = await page.content();
    expect(said).not.toContain(WINNER.name);
    expect(said).not.toContain(shownName(WINNER.name));
  });
});
