import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  memberContext,
  memberIdFor,
  removeMember,
  removeMemberById,
  seedKeptRecord,
  seedMember,
} from "./members";
import { removeXpMembers, seedXpMember } from "./xpMembers";

/**
 * A row is a row, whatever is in it.
 *
 * A row's height belongs to the table, not to whether that particular row
 * happens to offer any controls. Your own row has nobody to befriend, and a
 * kept record — somebody with a name and a history and no account — has
 * nobody to challenge. A row that shrinks when its buttons go reads as a
 * different kind of thing from the rows around it.
 *
 * The members list was 59 pixels a row, 45 for the reader's own, 53 for the
 * seven programs and 45 for the two kept records: three heights in one table.
 * `RecordTable.tsx` carries the diagnosis — every one of them was a different
 * cell WRAPPING, and the row with no controls had nothing holding their
 * height. This is the guard rather than the fix, and it fails if either half
 * is ever taken away again.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT BRINGS ITS OWN WORLD, WHICH IT DID NOT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * This used to read every row of the directory — two hundred of them on a
 * developer's machine — and one of the admin list, whatever they happened to
 * be. That is a test about this database's history wearing a test about the
 * table: the programs and the kept records it was leaning on are somebody
 * else's rows, and the admin case skipped itself entirely when the list was
 * short, which reports green while asserting nothing.
 *
 * So it seeds the SHAPES a row comes in and compares those:
 *
 *  - the reader's own row, which offers nothing to do about yourself;
 *  - somebody else, which offers buddy, ignore and challenge;
 *  - a kept record with no address at all, which offers nothing either — and
 *    carries a badge and a country after a long name, which is the widest
 *    subject a row can have and the one that used to wrap onto a second line;
 *  - somebody WITH XP, whose name is followed by a level badge.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND THE FOURTH ROW IS HERE BECAUSE THIS SPEC WAS GREEN OVER THE BUG
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The level badge went into the subject cell and made 36 of the 209 rows on
 * /players 53 pixels against the other 45 — this exact fault, one release after
 * it was fixed. THIS SPEC PASSED THROUGHOUT, and could not have done otherwise:
 * `seedMember` and `seedKeptRecord` make members with no XP, `levelShown`
 * answers null for nought, so not one of the three rows above has ever had a
 * badge in it. The spec was comparing three rows that all lacked the thing that
 * broke. It was found by measuring the page by hand.
 *
 * That is the shape AGENTS.md calls a spec that does not bring its own world,
 * in its quietest form: the fixture was not wrong about anything it asserted,
 * it simply did not contain the CONDITION under test. A row with a badge is now
 * one of the shapes, so the next thing added beside a name is measured against
 * the rows that do not have it.
 */

/**
 * The row for one member, found by the id in the link on their name.
 *
 * NOT BY THE NAME, which is what the first attempt did and could not work:
 * the site prints a person as "Even M." — first name and an initial, see
 * `shownName` — so a spec looking for the name it seeded finds nothing, and
 * a spec looking for the abbreviation finds whoever else shares it. The id is
 * in the href of every name on the site and is the one handle no two rows
 * share.
 */
function rowFor(page: Page, table: string, memberId: string): Locator {
  return page.getByTestId(table).locator(`tbody tr:has(a[href="/players/${memberId}"])`);
}

async function heightOf(row: Locator): Promise<number> {
  const box = await row.boundingBox();
  if (box === null) throw new Error("the row is not on the page to be measured");
  return Math.round(box.height);
}

test.describe("every row in a table is the same height", () => {
  test("on the players directory, whoever the rows belong to", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `even-${stamp}@example.test`, name: `Even ${stamp}` };
    const other = { email: `other-${stamp}@example.test`, name: `Other ${stamp}` };
    // A long name, a country and a badge: the widest subject there is.
    const keptName = `Kyokosan Remembered ${stamp}`;
    const kept = await seedKeptRecord({ name: keptName, country: "Japan" });
    await seedMember(other);
    /*
     * Level 5 rather than level 1: `levelShown` gives a level-1 member with no
     * XP no badge at all, so seeding one would have reproduced the blind spot
     * this row exists to close. A rung with a real total is a row that really
     * carries the mark.
     */
    const levelled = await seedXpMember(5, "rowheights");

    const context = await memberContext(browser, baseURL!, me);
    try {
      const page = await context.newPage();
      await page.goto("/players");

      const mine = rowFor(page, "directory", await memberIdFor(me.email));
      const theirs = rowFor(page, "directory", await memberIdFor(other.email));
      const remembered = rowFor(page, "directory", kept);
      const badged = rowFor(page, "directory", levelled.id);

      /*
       * Waited for, one by one, before a single height is read. Three rows
       * this spec created, so "not there" is a failure rather than a fact
       * about the database — and measuring a row that has not arrived is how
       * a bounding box comes back null.
       */
      for (const row of [mine, theirs, remembered, badged]) {
        await expect(row, "a row this spec seeded is not in the directory").toHaveCount(1);
      }
      /*
       * The badge is really THERE, or this compares a row against itself and
       * reports green over exactly the bug it was added for. An absence is only
       * meaningful after a presence has been waited for, and so is a presence
       * the whole assertion rests on.
       */
      await expect(
        badged.getByTestId("record-level"),
        "the row seeded with XP has no level badge, so its height proves nothing",
      ).toHaveCount(1);
      // The one with controls really has them, or this compares two empty rows.
      await expect(theirs.getByTestId("challenge"), "somebody else's row offers nothing").toHaveCount(
        1,
      );
      await expect(mine.getByTestId("challenge"), "your own row offers to challenge you").toHaveCount(
        0,
      );

      const heights = {
        mine: await heightOf(mine),
        theirs: await heightOf(theirs),
        remembered: await heightOf(remembered),
        badged: await heightOf(badged),
      };
      expect(
        new Set(Object.values(heights)).size,
        `own row ${heights.mine}, somebody else's ${heights.theirs}, a kept record ${heights.remembered}, one with a level ${heights.badged}`,
      ).toBe(1);
    } finally {
      await context.close();
      await removeMember(me.email);
      await removeMember(other.email);
      await removeMemberById(kept);
      await removeXpMembers([levelled.email]);
    }
  });

  test("on the operator's members list, where a kept record has no account", async ({ browser }) => {
    const stamp = Date.now().toString(36);
    const ordinary = { email: `admin-row-${stamp}@example.test`, name: `Admin Row ${stamp}` };
    await seedMember(ordinary);
    // No address: nothing to shut, nothing to rename, and so no buttons.
    const keptName = `Chibi Remembered ${stamp}`;
    const kept = await seedKeptRecord({ name: keptName });

    const context = await browser.newContext({ storageState: ".auth/admin.json" });
    try {
      const page = await context.newPage();
      await page.goto("/admin?view=members");

      const list = page.getByTestId("admin-members");
      const withAccount = list.locator(`li[data-email="${ordinary.email}"]`);
      // No address to find it by, so the id in the link on its name — see `rowFor`.
      const without = list.locator(`li:has(a[href="/players/${kept}"])`);
      /*
       * Both rows present before anything is measured. The old version of
       * this case skipped when the list held one row or none, which is a
       * green run that asserted nothing — and on a database with rows in it,
       * an assertion about rows it had not made.
       */
      await expect(withAccount, "the seeded account is not in the operator's list").toHaveCount(1);
      await expect(without, "the seeded kept record is not in the operator's list").toHaveCount(1);

      expect(
        await heightOf(withAccount),
        "an account's row and a kept record's row are different heights",
      ).toBe(await heightOf(without));
    } finally {
      await context.close();
      await removeMember(ordinary.email);
      await removeMemberById(kept);
    }
  });
});
