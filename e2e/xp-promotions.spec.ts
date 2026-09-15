import { expect, test, type Locator, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { IMPORTED_XP_EVENTS } from "../src/lib/xp/importedXp.constants";
import { keptPreferences, putPreferencesBack } from "./members";
import { suiteOperator } from "./operator";
import { removeVisitors } from "./xpLedger";
import { standingData } from "./xpStanding";
import { seedProgram, seedXpMember, type SeededXpMember } from "./xpMembers";

/**
 * RECENT PROMOTIONS 昇級 — WHO WENT UP A LEVEL, READ FROM THE LEDGER.
 *
 * John: "BUG: Where is the recent promotions page?" This drives it the way a
 * reader reaches it: from the leaderboard's own link, then a filter chip, then a
 * level's link out of a line. Nothing sets an address by hand past the arrival,
 * and nothing reloads.
 *
 * ITS OWN WORLD. Five members and their ledgers, made here and taken away here —
 * a spec must not assert anything about a row it did not create, and a
 * development database's ledger is whatever other runs left in it. The ledgers
 * are written as the site writes them: one batch per award, each batch's rows
 * sharing a `createdAt`, the member's totals the sums of the rows.
 *
 *  - a climber who earned twice, crossing level 2 only on the second award;
 *  - a leaper carried from level 1 to level 4 by one award;
 *  - a program, which the Computers chip keeps and People takes off;
 *  - a member a backfill paid, filed under a day long before the row was written;
 *  - a member paid credit for another site's record between two awards here,
 *    as 0.196.0's payer paid Chibi: several imported rows in one batch.
 *
 * Every absence is asserted after a presence in the same table.
 */

const OPERATOR = suiteOperator().email;

/** A day long before today, standing for the day of a game a backfill replayed. */
const PLAYED_LONG_AGO = "2025-08-02";

/** An award earned here, one row; or a payment of imported credit, one row per figure, as the payer writes it. */
type Batch = { at: Date; points: number; dayKey?: string } | { at: Date; imported: readonly number[] };

/** The imported types a payment's rows are written under, in turn. */
const CREDIT_TYPES = [IMPORTED_XP_EVENTS.importedGames, IMPORTED_XP_EVENTS.importedWins] as const;

/**
 * Writes a member's ledger, each batch's rows sharing its moment, and their
 * totals as the sums — earned here into `xp`, credit into `xpImported`.
 * The day is the UTC date of the row unless a replay's earlier day is given:
 * these members hold no zone, so UTC is their day.
 */
async function writeLedger(member: SeededXpMember, batches: readonly Batch[]): Promise<void> {
  const prisma = new PrismaClient();
  try {
    let here = 0;
    let imported = 0;
    let lastEarned: Date | null = null;
    for (const [index, one] of batches.entries()) {
      const dayKey = "dayKey" in one && one.dayKey !== undefined ? one.dayKey : one.at.toISOString().slice(0, 10);
      if ("imported" in one) {
        for (const [part, points] of one.imported.entries()) {
          await prisma.xpEvent.create({
            data: {
              memberId: member.id,
              type: CREDIT_TYPES[part % CREDIT_TYPES.length],
              subject: `promotions-spec-${index}-${part}`,
              points,
              dayKey,
              createdAt: one.at,
            },
          });
          imported += points;
        }
        continue;
      }
      await prisma.xpEvent.create({
        data: {
          memberId: member.id,
          type: "gameFinished",
          subject: `promotions-spec-${index}`,
          points: one.points,
          dayKey,
          createdAt: one.at,
        },
      });
      here += one.points;
      lastEarned = one.at;
    }
    await prisma.member.update({
      where: { id: member.id },
      data: { ...standingData({ here, imported }), xpLastAt: lastEarned },
    });
  } finally {
    await prisma.$disconnect();
  }
}

/** A member's line in the table, found by the member it is about. */
function lineFor(table: Locator, member: SeededXpMember): Locator {
  return table.locator(`tr[data-member="${member.id}"]`);
}

async function chip(page: Page, who: string) {
  await page.getByTestId("who-filter").getByTestId(`who-${who}`).click();
  await expect(page.getByTestId(`who-${who}`)).toHaveAttribute("aria-current", "true");
}

async function scopeChip(page: Page, scope: "everywhere" | "here") {
  await page.getByTestId("record-scope").getByTestId(`scope-${scope}`).click();
  await expect(page.getByTestId("record-scope").getByTestId(`scope-${scope}`)).toHaveAttribute("aria-current", "true");
  await expect(page.getByTestId("promotions-scope-said")).toHaveAttribute("data-scope", scope);
}

test.describe("recent promotions", () => {
  let kept: unknown = null;
  let climber: SeededXpMember;
  let leaper: SeededXpMember;
  let program: SeededXpMember;
  let replayed: SeededXpMember;
  let credited: SeededXpMember;

  test.beforeAll(async () => {
    process.loadEnvFile(".env");
    kept = await keptPreferences(OPERATOR);
  });

  test.beforeEach(async () => {
    climber = await seedXpMember(1, "promo-climber");
    leaper = await seedXpMember(1, "promo-leaper");
    program = await seedProgram("promo", 1);
    replayed = await seedXpMember(1, "promo-replayed");
    credited = await seedXpMember(1, "promo-credited");
    // A minute back, a second apart, so the order newest first is known: credited, replayed, program, leaper, climber.
    const base = Date.now() - 60_000;
    const at = (seconds: number) => new Date(base + seconds * 1000);
    // 40 is still level 1; the second award makes 60, past level 2's 50.
    await writeLedger(climber, [
      { at: at(0), points: 40 },
      { at: at(1), points: 20 },
    ]);
    // 320 in one award: past level 2 (50), 3 (150) and 4 (300) at once.
    await writeLedger(leaper, [{ at: at(2), points: 320 }]);
    await writeLedger(program, [{ at: at(3), points: 160 }]);
    await writeLedger(replayed, [{ at: at(4), points: 60, dayKey: PLAYED_LONG_AGO }]);
    /*
     * 60 earned: level 2 either way. Then 640 of credit in two rows of one batch:
     * Everywhere 700, past level 5's 500 and short of 6's 750. Then 100 earned:
     * Everywhere 800, past 6; Itsutsu only 160, past level 3's 150.
     */
    await writeLedger(credited, [
      { at: at(5), points: 60 },
      { at: at(6), imported: [400, 240] },
      { at: at(7), points: 100 },
    ]);
  });

  test.afterEach(async () => {
    await removeVisitors([climber, leaper, program, replayed, credited]);
  });

  test.afterAll(async () => {
    await putPreferencesBack(OPERATOR, kept);
  });

  test("the leaderboard leads to them, newest first, and a filter and a level's link both work", async ({ page }) => {
    await page.goto("/xp?who=everyone");
    await page.getByTestId("to-promotions").click();
    await expect(page).toHaveURL(/\/xp\/promotions/);

    const table = page.getByTestId("promotions");
    await expect(lineFor(table, replayed)).toBeVisible();

    // Newest first, among the lines this spec made that earn the same under either scope.
    const ours = [replayed.id, program.id, leaper.id, climber.id];
    const order = (await table.getByTestId("promotion").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-member"))))
      .filter((id): id is string => id !== null && ours.includes(id));
    expect(order).toEqual(ours);

    // The climber's first award crossed nothing, so they have one line: 1 to 2.
    await expect(lineFor(table, climber)).toHaveCount(1);
    await expect(lineFor(table, climber)).toHaveAttribute("data-from", "1");
    await expect(lineFor(table, climber)).toHaveAttribute("data-to", "2");

    // One award over three rungs is one line from where they stood to where they arrived.
    await expect(lineFor(table, leaper)).toHaveCount(1);
    await expect(lineFor(table, leaper)).toHaveAttribute("data-from", "1");
    await expect(lineFor(table, leaper)).toHaveAttribute("data-to", "4");
    await expect(lineFor(table, leaper).getByTestId("promotion-several")).toContainText("3 levels at once");

    // The backfilled line says so, with the day of the play; the others do not.
    await expect(lineFor(table, replayed).getByTestId("promotion-backfilled")).toContainText(PLAYED_LONG_AGO);
    await expect(lineFor(table, leaper).getByTestId("promotion-backfilled")).toHaveCount(0);

    // People: the leaper stays, the program goes.
    await chip(page, "people");
    await expect(lineFor(table, leaper)).toBeVisible();
    await expect(lineFor(table, program)).toHaveCount(0);
    await expect(page.getByTestId("promotions-narrowed")).toContainText("the people");

    // Computers: the program is back and the people are gone.
    await chip(page, "computers");
    await expect(lineFor(table, program)).toBeVisible();
    await expect(lineFor(table, leaper)).toHaveCount(0);

    // Everyone again, and out through the rung the leaper arrived at.
    await chip(page, "everyone");
    await expect(lineFor(table, leaper)).toBeVisible();
    await lineFor(table, leaper).getByTestId("promotion-to").click();
    await expect(page).toHaveURL(/\/xp\/levels\/4$/);
    await expect(page.getByTestId("level-name-heading")).toBeVisible();
  });

  /*
   * 0.196.0 paid imported credit into the ledger in one batch a member, and a
   * total run over every row showed Chibi going from level 1 to level 100 that
   * day as though it had been earned. Everywhere counts that credit, so it is a
   * line there, marked as imported; Itsutsu only does not, so it is no line.
   */
  test("credit from another site is a marked line on Everywhere and no line on Itsutsu only, and the chips combine", async ({ page }) => {
    await page.goto("/xp/promotions?scope=everywhere&who=everyone");
    const table = page.getByTestId("promotions");
    const line = (to: number) => table.locator(`tr[data-member="${credited.id}"][data-to="${to}"]`);

    // Everywhere: the credit is its own line, 2 to 5, and says it was imported rather than backfilled or earned.
    await expect(page.getByTestId("promotions-scope-said")).toHaveAttribute("data-scope", "everywhere");
    await expect(line(5)).toHaveAttribute("data-from", "2");
    await expect(line(5).getByTestId("promotion-imported")).toContainText("Imported, for play on");
    await expect(line(5).getByTestId("promotion-several")).toContainText("3 levels at once");
    await expect(line(5).getByTestId("promotion-backfilled")).toHaveCount(0);
    // The award here after it counts on from where the credit left the total, and is not marked.
    await expect(line(6)).toHaveAttribute("data-from", "5");
    await expect(line(6).getByTestId("promotion-imported")).toHaveCount(0);
    await expect(line(2).getByTestId("promotion-imported")).toHaveCount(0);
    await expect(lineFor(table, credited)).toHaveCount(3);

    // Itsutsu only: the same award is 2 to 3 on what was earned here, and the credit is no line at all.
    await scopeChip(page, "here");
    await expect(line(3)).toHaveAttribute("data-from", "2");
    await expect(line(2)).toHaveAttribute("data-from", "1");
    await expect(lineFor(table, credited)).toHaveCount(2);
    await expect(line(5)).toHaveCount(0);
    await expect(table.getByTestId("promotion-imported")).toHaveCount(0);

    // A who chip keeps the scope it was chosen under.
    await chip(page, "people");
    await expect(page.getByTestId("promotions-scope-said")).toHaveAttribute("data-scope", "here");
    await expect(line(3)).toBeVisible();
    await expect(line(5)).toHaveCount(0);

    // And the way back: Everywhere again, the credit marked again, the people still chosen.
    await scopeChip(page, "everywhere");
    await expect(line(5).getByTestId("promotion-imported")).toBeVisible();
    await expect(line(3)).toHaveCount(0);
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");
  });
});
