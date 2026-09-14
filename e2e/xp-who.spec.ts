import { expect, test, type Locator, type Page } from "@playwright/test";

import { keptPreferences, putPreferencesBack } from "./members";
import { suiteOperator } from "./operator";
import { removeXpMembers, seedProgram, seedXpMember, type SeededXpMember } from "./xpMembers";

/**
 * PEOPLE, COMPUTERS, EVERYONE — ON THE XP BOARD AND ON A RUNG.
 *
 * The programs stand on the ladder like anyone now, and John's answer to a
 * board that mixes the two: "filters are the way to go." The chips are the
 * players page's own, and every case here CLICKS them, the way a reader does;
 * nothing sets the address by hand except an arrival, which is how a known
 * starting state is reached, and nothing reloads.
 *
 * Two rows of its own, both above anything a development database holds —
 * the leaderboard spec seeds level 80 to be the top row, so 92 and 91 are the
 * top two — so ranks can be asserted as 1 and 2 and not "somewhere". Every
 * absence is asserted after a presence on the same table: the row that should
 * be there is found first, then the one that should not is counted.
 *
 * And the board remembers its own choice, separately from /players: picking
 * Computers here must not change what the members list opens with. The
 * operator's preferences are read once and put back afterwards.
 */

const OPERATOR = suiteOperator().email;

function rowFor(table: Locator, member: SeededXpMember): Locator {
  return table.locator(`tbody tr:has(a[href="/players/${member.id}"])`);
}

/** The rank cell: the first cell of the row, a place in the order shown. */
function rankOf(row: Locator): Locator {
  return row.locator("td").first();
}

async function chip(page: Page, who: string) {
  await page.getByTestId("who-filter").getByTestId(`who-${who}`).click();
}

test.describe("who the XP board is about", () => {
  let kept: unknown = null;
  let person: SeededXpMember;
  let program: SeededXpMember;

  test.beforeAll(async () => {
    kept = await keptPreferences(OPERATOR);
  });

  test.beforeEach(async () => {
    person = await seedXpMember(92, "who");
    program = await seedProgram("who", 91);
  });

  test.afterEach(async () => {
    await removeXpMembers([person.email, program.email]);
  });

  test.afterAll(async () => {
    await putPreferencesBack(OPERATOR, kept);
  });

  test("each chip narrows the board, counts it, ranks within it, and Everyone takes it off", async ({ page }) => {
    await page.goto("/xp?who=everyone");
    const board = page.getByTestId("xp-leaderboard");
    await expect(rankOf(rowFor(board, person))).toHaveText("1");
    await expect(rankOf(rowFor(board, program))).toHaveText("2");
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");

    // People: the person is first, and the program is nowhere — counted after the person is found.
    await chip(page, "people");
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");
    await expect(rankOf(rowFor(board, person))).toHaveText("1");
    await expect(rowFor(board, program)).toHaveCount(0);
    await expect(page.getByTestId("xp-narrowed")).toContainText("the people");
    // The rank column says what a rank is among.
    await expect(board.locator("thead th").first()).toHaveAttribute("title", /among the people/);

    // Computers: the program is first among its own kind, and the person is nowhere.
    await chip(page, "computers");
    await expect(page.getByTestId("who-computers")).toHaveAttribute("aria-current", "true");
    await expect(rankOf(rowFor(board, program))).toHaveText("1");
    await expect(rowFor(board, person)).toHaveCount(0);
    await expect(page.getByTestId("xp-narrowed")).toContainText("the computer players");
    // The reader is a person, so the board says they are not among these rather than ranking them.
    await expect(page.getByTestId("your-xp")).toContainText("not among them");

    // The way back: Everyone, and the narrowing is gone once both rows are back.
    await chip(page, "everyone");
    await expect(rankOf(rowFor(board, person))).toHaveText("1");
    await expect(rankOf(rowFor(board, program))).toHaveText("2");
    await expect(page.getByTestId("xp-narrowed")).toHaveCount(0);
  });

  test("a rung narrows the same way, and shares the board's memory", async ({ page }) => {
    await page.goto(`/xp/levels/91?who=everyone`);
    const roll = page.getByTestId("level-members");
    await expect(rowFor(roll, program)).toHaveCount(1);

    // People: nobody of the person's kind stands on 91, so the table keeps its shape and says whose it is.
    await chip(page, "people");
    await expect(page.getByTestId("level-empty")).toContainText("None of the people");
    await expect(rowFor(roll, program)).toHaveCount(0);
    await expect(page.getByTestId("level-narrowed")).toContainText("the people");

    await chip(page, "computers");
    await expect(rowFor(roll, program)).toHaveCount(1);

    // The board opens on the rung's choice: one board, one memory.
    await page.getByTestId("to-leaderboard").click();
    const board = page.getByTestId("xp-leaderboard");
    await expect(rankOf(rowFor(board, program))).toHaveText("1");
    await expect(page.getByTestId("who-computers")).toHaveAttribute("aria-current", "true");
    await expect(rowFor(board, person)).toHaveCount(0);

    await chip(page, "everyone");
    await expect(rankOf(rowFor(board, person))).toHaveText("1");
  });

  test("the board's choice never changes what the players page opens with, or the other way round", async ({ page }) => {
    await page.goto("/players?who=everyone");
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");

    await page.goto("/xp?who=everyone");
    await chip(page, "computers");
    await expect(page.getByTestId("who-computers")).toHaveAttribute("aria-current", "true");

    // Through the bar, to the members list: its own remembered choice, untouched.
    await page.getByRole("navigation").locator('a[href="/players"]').first().click();
    await expect(page).toHaveURL(/\/players(\?|$)/);
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");

    // And the board kept its own when the members list is narrowed.
    await page.getByTestId("who-filter").getByTestId("who-people").click();
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");
    await page.goto("/xp");
    await expect(page.getByTestId("who-computers")).toHaveAttribute("aria-current", "true");

    // The way back on both.
    await chip(page, "everyone");
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");
    await page.goto("/players?who=everyone");
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");
  });
});
