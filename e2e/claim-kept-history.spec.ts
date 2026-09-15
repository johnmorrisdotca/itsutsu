import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { makeMemberId } from "../src/lib/auth/memberId";
import { playerKey } from "../src/lib/rating/playerKey";
import { ready } from "./support";

/**
 * THE OPERATOR ATTACHES A KEPT RECORD TO A MEMBER, AND THEIR PAGE SHOWS IT.
 *
 * A record here is a history under a name nobody had an account for: a finished
 * game with that name on a seat and no member id, and the rating and per-game
 * standing kept under the folded name. The spec brings its own world — a member,
 * a record under a name nobody else holds, an opponent with no account — and
 * takes all of it away in `afterAll`.
 *
 * Driven the way the operator does it: the button on the member's row, the name
 * typed, Look, Attach; then the Log tab; then the member's name, CLICKED from
 * that row, to their page, and the count under their record clicked through to
 * the games it counted. Nothing reloads and nothing is set through the API.
 */

// Before the client is built: Prisma reads DATABASE_URL at construction.
process.loadEnvFile(".env");

const prisma = new PrismaClient();
const STAMP = `ckh${Date.now().toString(36)}`;
const MEMBER = { id: makeMemberId(), email: `${STAMP}-claimant@example.test`, name: `Claimant ${STAMP}` };
const RECORD = `Before ${STAMP}`;
const RIVAL = `Rival ${STAMP}`;
const GAME = `${STAMP}-g1`;

async function openTab(page: Page, label: string) {
  await page.getByTestId("tab").filter({ hasText: label }).click();
}

test.beforeAll(async () => {
  await prisma.member.create({ data: { ...MEMBER, picture: "", invitedWith: "playwright" } });
  // Played under a name before there was an account behind it: names on the seats, no member ids.
  await prisma.game.create({
    data: {
      id: GAME,
      variant: "freestyle",
      size: 15,
      winLength: 5,
      obstacles: "none",
      opener: "black",
      result: "black",
      winner: "black",
      moveCount: 9,
      status: "finished",
      rated: true,
      blackName: RECORD,
      whiteName: RIVAL,
    },
  });
  const kept = { key: playerKey(RECORD), name: RECORD, rating: 1616, ratedGames: 1, wins: 1 };
  await prisma.player.create({ data: kept });
  await prisma.playerVariantRating.create({ data: { ...kept, variant: "freestyle" } });
});

test.afterAll(async () => {
  await prisma.operatorAction.deleteMany({ where: { subjectId: MEMBER.id } });
  await prisma.game.deleteMany({ where: { id: GAME } });
  await prisma.playerVariantRating.deleteMany({ where: { key: playerKey(RECORD) } });
  await prisma.player.deleteMany({ where: { key: { in: [playerKey(RECORD), playerKey(RIVAL)] } } });
  await prisma.member.deleteMany({ where: { id: MEMBER.id } });
  await prisma.$disconnect();
});

test("the operator attaches a record kept under another name, and the member's page then shows it", async ({ page }) => {
  // Before: the member's own page has nothing to show.
  await page.goto(`/players/${MEMBER.id}`);
  await expect(page.getByTestId("player-no-games")).toBeVisible();

  await page.goto("/admin?view=members");
  await ready(page, "admin-members");
  const row = page.getByTestId("admin-member").filter({ hasText: MEMBER.name });
  await expect(row).toHaveCount(1);

  await row.getByTestId("member-claim").click();
  const modal = page.getByTestId("member-claim-modal");
  await expect(modal).toBeVisible();
  await modal.getByTestId("claim-name").fill(RECORD);
  await modal.getByTestId("claim-look").click();

  // What would move, before anything does: the game (a count that opens it), its seat, the rating and the standing.
  const plan = modal.getByTestId("claim-plan");
  await expect(plan).toBeVisible();
  await expect(plan.getByTestId("claim-games")).toHaveText("1");
  await expect(plan.getByTestId("claim-seats")).toContainText("1 seat");
  await expect(plan.getByTestId("claim-rating")).toContainText("A rating");
  await expect(plan.getByTestId("claim-standings")).toContainText("1 per-game standing");
  expect(await prisma.game.findUniqueOrThrow({ where: { id: GAME } })).toMatchObject({ blackMemberId: null });

  await plan.getByTestId("claim-attach").click();
  await expect(modal.getByTestId("claim-done")).toBeVisible();
  await modal.getByTestId("claim-close").click();
  await expect(modal).toHaveCount(0);

  // The act is kept, and says what moved without the name it was kept under.
  await openTab(page, "The log");
  const logged = page.locator(`[data-testid="operator-log-row"][data-subject="${MEMBER.id}"][data-action="recordClaimed"]`);
  await expect(logged, "the claim was not kept").toHaveCount(1);
  await expect(logged).toContainText("1 finished game");
  await expect(logged).not.toContainText(RECORD);

  // To the member's page the way the operator goes: their name on their row.
  await openTab(page, "The members");
  await ready(page, "admin-members");
  await page.getByTestId("admin-member").filter({ hasText: MEMBER.name }).getByRole("link", { name: MEMBER.name }).click();
  await expect(page).toHaveURL(new RegExp(`/players/${MEMBER.id}$`));

  const recent = page.getByTestId("player-recent-game");
  await expect(recent).toHaveCount(1);
  await expect(recent.getByTestId("player-opponent")).toContainText(RIVAL.split(" ")[0]);
  await expect(page.getByTestId("player-no-games")).toHaveCount(0);

  // Every count leads to exactly the games it counted: the one game, by the member, not the name.
  const counts = page.getByTestId("player-by-variant").getByRole("link", { name: "1", exact: true });
  const first = counts.first();
  await expect(first).toHaveAttribute("href", new RegExp(`member=${MEMBER.id}`));
  await first.click();
  await expect(page).toHaveURL(/\/history/);
  const rows = page.getByTestId("history-row");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(RIVAL.split(" ")[0]);
});
