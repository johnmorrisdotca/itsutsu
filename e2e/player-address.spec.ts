import { expect, test } from "@playwright/test";

import { memberIdFor, removeMember, seedMember } from "./members";
import { removeXpMembers, seedXpMember } from "./xpMembers";
import { xpLevelName } from "../src/lib/xp/levelNames";
import { countText } from "../src/lib/rating/figures";

/**
 * A link to a person carries their id, not their name.
 *
 * John, on his twelve-year-old daughter: "links can still be full name but
 * maybe links to people might need to be the guids?"
 *
 * WHAT THIS IS ACTUALLY GUARDING. `shownName` shipped at 0.121.0 and prints
 * "Hanako M." wherever a member is named — and the href under it read
 * /players/hanako-morris, so the surname she had taken down sat in the markup
 * of every page that named her. Shortening a name on screen does nothing while
 * the address under it is whole, and the two live in different lines of one
 * component, so they drift apart in silence.
 *
 * Asserted against the MARKUP rather than the rendered text, because the
 * rendered text was never the thing that was wrong: the screen passed and the
 * href failed. That is the same lesson as the production leak fixed in
 * e69fae7, and the reason that fix's test reads the markup too.
 */
test.describe("a member's address", () => {
  test("does not carry their surname, on any page that names them", async ({ page }) => {
    const stamp = Date.now();
    const surname = `Sasaki${stamp}`;
    await seedMember({ email: `addr-${stamp}@example.test`, name: `Hanako ${surname}` });

    await page.goto("/players");
    const link = page.getByTestId("directory-name").filter({ hasText: "Hanako" }).first();
    await expect(link).toBeVisible();

    const href = (await link.getAttribute("href")) ?? "";
    expect(href, "a member's link must not be built from their name").not.toContain(
      surname.toLowerCase(),
    );
    expect(href, "and it should be their id under /players").toMatch(/^\/players\/[a-z0-9]+$/);

    /*
     * And nowhere else in the document either. The href is where this was
     * found, but the property worth holding is about the whole markup — a
     * surname reaching the page by some other route is the same leak.
     */
    const markup = await page.content();
    expect(markup, "the surname reached the markup by another route").not.toContain(
      surname.toLowerCase(),
    );
  });

  test("is a real address: following it opens their page", async ({ page }) => {
    const stamp = Date.now();
    await seedMember({ email: `addr2-${stamp}@example.test`, name: `Mio Tanaka${stamp}` });

    await page.goto("/players");
    const link = page.getByTestId("directory-name").filter({ hasText: "Mio" }).first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");

    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("still answers to a name for somebody with no account behind it", async ({ page }) => {
    /*
     * The fallback, and it is not a leftover: a record kept from another site
     * has no member to be addressed by, so the name IS its address. John's own
     * kept records are reached this way and must go on working.
     */
    await page.goto("/players/john-morris");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  /*
   * ─────────────────────────────────────────────────────────────────────────
   * AND THE PAGE SAYS WHERE THEY STAND
   * ─────────────────────────────────────────────────────────────────────────
   *
   * Both directions. This used to assert that somebody with no XP got NO badge,
   * on the argument that "Level 1 · Insert Coin" on a stranger who has never
   * played is a badge about a default. John reversed it — "Everyone is level 1
   * if 0xp." — because level 1 is where a person starts, and hiding it tells a
   * new member the ladder does not include them. So the second case below visits
   * somebody with nought and asserts the rung and the 0, which is the only test
   * that can tell the rule apart from a page that forgot to ask.
   *
   * A program's page draws no rung at all — `awardXp` refuses one, so it is not
   * on this ladder. That is decided in `levelShown` and unit-tested there, rather
   * than asserted here against a computer player this spec did not make.
   *
   * Straight to `/players/<id>`, not through the members list: that list is
   * capped at the 200 most recently seen and this database holds four hundred,
   * so a spec that navigated would be asserting about the cap.
   */
  test("says where a member stands, by the name of their level and their total", async ({ page }) => {
    const seeded = await seedXpMember(5, "addr-level");
    try {
      await page.goto(`/players/${seeded.id}`);
      // The heading first: the standing is INSIDE it, so waiting on the panel
      // alone would be reading a page that has not drawn its own name yet.
      await expect(page.getByTestId("player-profile")).toBeVisible();
      const standing = page.getByTestId("member-level");
      await expect(standing).toBeVisible();

      /*
       * The level's NAME, and the rung it leads to — not `Level 5`. The badge
       * is drawn under the block's own id, `member-level-name`, since the
       * header names every part of itself after `member-level`; the kanji,
       * where a level has one, is a sibling element and no longer part of
       * the badge's text.
       */
      const badge = standing.getByTestId("member-level-name");
      await expect(badge).toHaveText(`Lv 5 · ${xpLevelName(5)}`);
      await expect(badge).toHaveAttribute("href", "/xp/levels/5");
      /*
       * And the total, which is the half a profile has room for and a table
       * does not: the number alone, written as every count on the site is
       * (`countText`), under an XP heading of its own, linking to the board.
       */
      const total = standing.getByTestId("member-level-total");
      await expect(total).toHaveText(countText(seeded.xp));
      await expect(total).toHaveAttribute("href", "/xp");
    } finally {
      await removeXpMembers([seeded.email]);
    }
  });

  test("puts somebody who has never earned any on level 1, with a total of 0", async ({ page }) => {
    const email = `addr-noxp-${Date.now()}@example.test`;
    await seedMember({ email, name: `Nought Tester${Date.now()}` });
    try {
      await page.goto(`/players/${await memberIdFor(email)}`);
      await expect(page.getByTestId("player-profile")).toBeVisible();
      /*
       * A PRESENCE, and the rung it names. Not "a badge exists": the first rung
       * by its own name and the nought beside it, so a page that defaulted a
       * missing read to 0 and a page that asked are still told apart by what
       * `seedMember` wrote — a row with `xp` at its default of nought.
       */
      const standing = page.getByTestId("member-level");
      await expect(standing).toBeVisible();
      const badge = standing.getByTestId("member-level-name");
      await expect(badge).toHaveText(`Lv 1 · ${xpLevelName(1)}`);
      await expect(badge).toHaveAttribute("href", "/xp/levels/1");
      await expect(standing.getByTestId("member-level-total")).toHaveText(countText(0));
    } finally {
      await removeMember(email);
    }
  });
});
