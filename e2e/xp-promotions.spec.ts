import { expect, test, type Locator, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

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
 * ITS OWN WORLD. Four members and their ledgers, made here and taken away here —
 * a spec must not assert anything about a row it did not create, and a
 * development database's ledger is whatever other runs left in it. The ledgers
 * are written as the site writes them: one batch per award, each batch's rows
 * sharing a `createdAt`, the member's total the sum of the rows.
 *
 *  - a climber who earned twice, crossing level 2 only on the second award;
 *  - a leaper carried from level 1 to level 4 by one award;
 *  - a program, which the Computers chip keeps and People takes off;
 *  - a member a backfill paid, filed under a day long before the row was written.
 *
 * Every absence is asserted after a presence in the same table.
 */

const OPERATOR = suiteOperator().email;

/** A day long before today, standing for the day of a game a backfill replayed. */
const PLAYED_LONG_AGO = "2025-08-02";

type Batch = { at: Date; points: number; dayKey?: string };

/**
 * Writes a member's ledger, one row per batch, and their total as its sum.
 * The day is the UTC date of the row unless a replay's earlier day is given:
 * these members hold no zone, so UTC is their day.
 */
async function writeLedger(member: SeededXpMember, batches: readonly Batch[]): Promise<void> {
  const prisma = new PrismaClient();
  try {
    let total = 0;
    for (const [index, one] of batches.entries()) {
      await prisma.xpEvent.create({
        data: {
          memberId: member.id,
          type: "gameFinished",
          subject: `promotions-spec-${index}`,
          points: one.points,
          dayKey: one.dayKey ?? one.at.toISOString().slice(0, 10),
          createdAt: one.at,
        },
      });
      total += one.points;
    }
    await prisma.member.update({
      where: { id: member.id },
      data: { ...standingData({ here: total }), xpLastAt: batches[batches.length - 1].at },
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

test.describe("recent promotions", () => {
  let kept: unknown = null;
  let climber: SeededXpMember;
  let leaper: SeededXpMember;
  let program: SeededXpMember;
  let replayed: SeededXpMember;

  test.beforeAll(async () => {
    process.loadEnvFile(".env");
    kept = await keptPreferences(OPERATOR);
  });

  test.beforeEach(async () => {
    climber = await seedXpMember(1, "promo-climber");
    leaper = await seedXpMember(1, "promo-leaper");
    program = await seedProgram("promo", 1);
    replayed = await seedXpMember(1, "promo-replayed");
    // A minute back, a second apart, so the order newest first is known: replayed, program, leaper, climber.
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
  });

  test.afterEach(async () => {
    await removeVisitors([climber, leaper, program, replayed]);
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

    // Newest first, among the lines this spec made.
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
});
