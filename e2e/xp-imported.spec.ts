import { expect, test, type Locator } from "@playwright/test";

import { keptPreferences, putPreferencesBack } from "./members";
import { suiteOperator } from "./operator";
import {
  removeXpMembers,
  seedImportedMember,
  seedProgram,
  seedXpMember,
  type SeededXpMember,
} from "./xpMembers";

/**
 * EVERYWHERE 通算 OR ITSUTSU ONLY 五 — ON THE XP BOARD AND ON A RUNG.
 *
 * John, 2026-09-14: people imported from other sites "should get that XP! but of
 * course, we will show filters, that show worldwide XP with a justification that
 * they have put in their time or mileage on other sites) and the Itsutsu only XP
 * as well".
 *
 * IT BRINGS ITS OWN WORLD. A kept record whose whole total is credit imported
 * from another site, a person with the same kind of total earned here, and a
 * program — levels 97, 96 and 95, above anything a development database or CI
 * holds, so ranks are asserted as 1, 2 and 3 and not "somewhere". Never John's
 * row, never the operator's, and never Chibi's: every row asserted about is one
 * this file made.
 *
 * EVERY CASE CLICKS the chips a reader clicks — nothing reloads, and nothing
 * sets an address except an arrival. Every absence is asserted after a presence
 * on the same page: the row that should be there, or the chip that says what
 * the board is counting, is found first. And the way back is taken each time.
 *
 * The operator's preferences are read once and put back, because following a
 * chip is what remembers it.
 */

const OPERATOR = suiteOperator().email;

function rowFor(table: Locator, member: SeededXpMember): Locator {
  return table.locator(`tbody tr:has(a[href="/players/${member.id}"])`);
}

/** The rank cell: a place in the order shown. */
function rankOf(row: Locator): Locator {
  return row.locator("td").first();
}

/** The XP cell: # · Member · Level · XP · Last earned. */
function totalOf(row: Locator): Locator {
  return row.locator("td").nth(3);
}

const shown = (value: number) => value.toLocaleString("en-GB");

test.describe("how much experience the XP board counts", () => {
  let kept: unknown = null;
  let imported: SeededXpMember & { imported: number };
  let person: SeededXpMember;
  let program: SeededXpMember;

  test.beforeAll(async () => {
    kept = await keptPreferences(OPERATOR);
  });

  test.beforeEach(async () => {
    imported = await seedImportedMember(97, "imp");
    person = await seedXpMember(96, "imp-person");
    program = await seedProgram("imp", 95);
  });

  test.afterEach(async () => {
    await removeXpMembers([imported.email, person.email, program.email]);
  });

  test.afterAll(async () => {
    await putPreferencesBack(OPERATOR, kept);
  });

  test("Everywhere ranks the credit and justifies it, Itsutsu only leaves it out, and the chips combine", async ({ page }) => {
    await page.goto("/xp?scope=everywhere&who=everyone");
    const board = page.getByTestId("xp-leaderboard");
    const scopes = page.getByTestId("record-scope");
    const who = page.getByTestId("who-filter");

    // Everywhere: the kept record first, on its imported total, saying where it came from.
    await expect(rankOf(rowFor(board, imported))).toHaveText("1");
    await expect(rankOf(rowFor(board, person))).toHaveText("2");
    await expect(rankOf(rowFor(board, program))).toHaveText("3");
    await expect(totalOf(rowFor(board, imported))).toHaveText(shown(imported.xp));
    await expect(rowFor(board, imported).getByTestId("xp-imported-note")).toContainText(`Includes ${shown(imported.imported)} XP`);
    await expect(scopes.getByTestId("scope-everywhere")).toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("xp-scope-said")).toHaveAttribute("data-scope", "everywhere");
    // Nothing imported in the person's total, so nothing to justify — counted after their row is found.
    await expect(rowFor(board, person).getByTestId("xp-imported-note")).toHaveCount(0);

    // Itsutsu only: the person and the program move up, and the kept record, with nothing earned here, is gone.
    await scopes.getByTestId("scope-here").click();
    await expect(scopes.getByTestId("scope-here")).toHaveAttribute("aria-current", "true");
    await expect(rankOf(rowFor(board, person))).toHaveText("1");
    await expect(rankOf(rowFor(board, program))).toHaveText("2");
    await expect(totalOf(rowFor(board, person))).toHaveText(shown(person.xp));
    await expect(rowFor(board, imported)).toHaveCount(0);
    // The page says what it is counting, and offers the way back.
    await expect(page.getByTestId("xp-scope-said")).toContainText("Counting this site only");
    await expect(page.getByTestId("xp-imported-note")).toHaveCount(0);

    // The chips combine: Computers under Itsutsu only.
    await who.getByTestId("who-computers").click();
    await expect(who.getByTestId("who-computers")).toHaveAttribute("aria-current", "true");
    await expect(rankOf(rowFor(board, program))).toHaveText("1");
    await expect(scopes.getByTestId("scope-here")).toHaveAttribute("aria-current", "true");
    await expect(rowFor(board, person)).toHaveCount(0);

    // People under Itsutsu only.
    await who.getByTestId("who-people").click();
    await expect(rankOf(rowFor(board, person))).toHaveText("1");
    await expect(rowFor(board, program)).toHaveCount(0);

    // The way back, by the sentence's own link: People, counted everywhere — the kept record is a person.
    await page.getByTestId("xp-count-everywhere").click();
    await expect(scopes.getByTestId("scope-everywhere")).toHaveAttribute("aria-current", "true");
    await expect(who.getByTestId("who-people")).toHaveAttribute("aria-current", "true");
    await expect(rankOf(rowFor(board, imported))).toHaveText("1");
    await expect(rowFor(board, imported).getByTestId("xp-imported-note")).toBeVisible();
    await expect(rowFor(board, program)).toHaveCount(0);

    // And everyone again: the board as it opened.
    await who.getByTestId("who-everyone").click();
    await expect(rankOf(rowFor(board, program))).toHaveText("3");
    await expect(rankOf(rowFor(board, imported))).toHaveText("1");
  });

  test("a rung counts the same way, and the board opens on the choice the rung remembered", async ({ page }) => {
    await page.goto("/xp/levels/97?scope=everywhere&who=everyone");
    const roll = page.getByTestId("level-members");
    const scopes = page.getByTestId("record-scope");

    // Everywhere: the kept record stands on 97, with its justification.
    await expect(rowFor(roll, imported)).toHaveCount(1);
    await expect(rowFor(roll, imported).getByTestId("xp-imported-note")).toContainText(`Includes ${shown(imported.imported)} XP`);

    // Itsutsu only: it has earned nothing here, so it stands on no rung.
    await scopes.getByTestId("scope-here").click();
    await expect(scopes.getByTestId("scope-here")).toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("level-scope-said")).toHaveAttribute("data-scope", "here");
    await expect(rowFor(roll, imported)).toHaveCount(0);

    // The board, by its link: it opens counting Itsutsu only, because the rung's chip remembered it.
    await page.getByTestId("to-leaderboard").click();
    const board = page.getByTestId("xp-leaderboard");
    await expect(page.getByTestId("record-scope").getByTestId("scope-here")).toHaveAttribute("aria-current", "true");
    await expect(rankOf(rowFor(board, person))).toHaveText("1");
    await expect(rowFor(board, imported)).toHaveCount(0);

    // The way back.
    await page.getByTestId("record-scope").getByTestId("scope-everywhere").click();
    await expect(rankOf(rowFor(board, imported))).toHaveText("1");
  });
});
