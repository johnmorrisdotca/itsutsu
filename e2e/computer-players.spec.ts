import { expect, test, type Page } from "@playwright/test";

import { BOT_ALL_TIERS, BOT_PROFILES } from "../src/lib/gomoku/opponent.constants";
import { shownName } from "../src/lib/rating/shownName";
import { keptPreferences, putPreferencesBack } from "./members";

/**
 * The computer players are findable.
 *
 * Their member rows are written the first time anything needs them, and until
 * this page wrote them nothing anybody visits did — so they existed in the
 * code and not in the database, and the directory that ought to have listed
 * them had nothing to list. John looked for them on /players and on the
 * operator's members list and found neither.
 *
 * THIS FILE WAS RED ON ITS OWN SECOND RUN, and the cause was not the
 * computer players. The last case asks for `/players?who=people`, and the page
 * REMEMBERS the last narrowing somebody asked for — on the account, since it
 * moved off its cookie (see `memberFilter.ts`). The suite is signed in as the
 * operator, so the first run left `people` written on that account and the
 * third case's bare `/players` was then answered with it: seven programs in
 * the directory on a fresh account, none on a second run, and the failure
 * wearing the name of the thing this file is about.
 *
 * A cookie died with the browser context. An account does not, which is the
 * whole point of it — so "before anybody has said anything" is a state this
 * file has to ESTABLISH rather than assume, and it hands back what it found
 * when it is done, because the operator's account on a developer's machine is
 * John's own and his players page is not this suite's to narrow.
 *
 * The remembering itself is `player-filters.spec.ts`'s subject, including
 * setting it, changing it and clearing it — three different tests, and they
 * are all over there. This file only cleans up after itself.
 */

/*
 * Whose account the page writes on: the same expression `auth.setup.ts` mints
 * the session these specs carry with.
 */
const OPERATOR = process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "john@spxis.com";

/**
 * One program that is always here. A name out of the constants rather than
 * typed out, so this is a claim about the seven rows the SOURCE guarantees
 * rather than about what somebody left on this database — and `shownName` is
 * asked for the printed form rather than a second copy of that rule.
 */
const A_ROBOT = shownName(BOT_PROFILES[BOT_ALL_TIERS[0]].name);

/** The directory's name cell, the way `player-filters.spec.ts` addresses it. */
const named = (page: Page, name: string) =>
  page.getByTestId("directory").getByTestId("directory-name").filter({ hasText: name });

/**
 * Puts the reader's account back to never having asked for a narrowing, so a
 * bare `/players` means the ordinary page rather than "however I last asked".
 *
 * Through the API, the way a member would, and null is the registry's word for
 * "never said". A 404 is the operator on a database where they hold no member
 * row — and then there is nothing remembered to forget, so what this
 * establishes already holds.
 */
async function forgetDirectoryFilter(page: Page): Promise<void> {
  const response = await page.request.patch("/api/me", {
    data: { preferences: { playersWho: null, playersSettled: null, playersActive: null } },
  });
  expect([200, 404], `forgetting the filter answered ${response.status()}`).toContain(response.status());
}

test.describe("the computer players", () => {
  /** What the account held before this file touched it, read once. */
  let kept: unknown = null;

  test.beforeAll(async () => {
    kept = await keptPreferences(OPERATOR);
  });

  /*
   * Every case starts from "nobody has narrowed anything", whatever the case
   * before it asked for — the last one here asks for `people` on purpose, and
   * `player-filters.spec.ts` leaves its own answers on the same account.
   */
  test.beforeEach(async ({ page }) => {
    await forgetDirectoryFilter(page);
  });

  test.afterAll(async () => {
    await putPreferencesBack(OPERATOR, kept);
  });

  test("are listed together, badged, and each leads to their own page", async ({ page }) => {
    await page.goto("/players?view=computers");
    const rows = page.getByTestId("computer-player");
    // Counted from the list rather than written down, so a new grade or a new
    // specialist does not fail a test whose subject is that they are listed.
    await expect(rows).toHaveCount(BOT_ALL_TIERS.length);

    // Easiest first and the specialists last, so the ladder reads itself
    // rather than reordering with whichever of them moved most recently.
    await expect(rows.nth(0)).toHaveAttribute("data-tier", BOT_ALL_TIERS[0]);
    for (const [index, tier] of BOT_ALL_TIERS.entries()) {
      await expect(rows.nth(index)).toHaveAttribute("data-tier", tier);
    }

    // A program is a member, so it is badged as what it is.
    await expect(rows.first().getByTestId("member-kind")).toHaveAttribute("data-kind", "robot");

    // And a name leads to the person, the same rule as everywhere else.
    const name = rows.first().getByTestId("computer-player-name");
    await expect(name).toHaveAttribute("href", /\/players\//);
    await name.click();
    await expect(page.getByTestId("player-profile")).toBeVisible();
  });

  test("are members, badged as robots wherever members are listed", async ({ page }) => {
    /*
     * They were absent from every list entirely, which is how the gap was
     * found: their rows are written on demand and nothing anybody visits was
     * demanding them.
     *
     * Asserted on the players page rather than on the operator's list,
     * because that list is capped at two hundred rows ordered by who was seen
     * most recently, and a development database has hundreds of test members
     * newer than players who are always here. On production, with six
     * members, they are on both. The cap is its own ticket.
     */
    await page.goto("/players?view=computers");
    const robots = page.getByTestId("computer-player").filter({ has: page.locator('[data-kind="robot"]') });
    await expect(robots).toHaveCount(BOT_ALL_TIERS.length);
  });

  test("are listed with everybody else, and never pass as a person", async ({ page }) => {
    /*
     * This used to assert the opposite — that no program appeared in the
     * directory at all — on the reasoning that "a program in the directory of
     * people would be a person as far as anybody reading it is concerned".
     * The objection was right and the answer was wrong: hiding the five
     * opponents who are always available, on a site whose difficulty is that
     * nobody is about, cost more than it protected. So they are listed by
     * default now, and the reading the old test was defending is guarded
     * directly instead — by the row saying what it is.
     *
     * The bare address on purpose: the subject is the ORDINARY page, which is
     * why the `beforeEach` above has to have taken the remembered narrowing
     * off first. Said out loud rather than assumed, since a bare `/players`
     * has meant "however I last asked" ever since the filter moved onto the
     * account.
     */
    await page.goto("/players");
    await expect(page.getByTestId("who-everyone")).toHaveAttribute("aria-current", "true");

    /*
     * The program is PRESENT, which is a claim about seven rows the source
     * guarantees. The badge beside its name is a claim about the code too —
     * `MemberKindBadge` reads `botTier` off the row — and neither is a claim
     * about the record, the rating or the standing those rows have picked up
     * on this database, which is somebody else's history and not this file's.
     */
    const row = page
      .getByTestId("directory")
      .locator("tr")
      .filter({ has: page.getByTestId("directory-name").filter({ hasText: A_ROBOT }) });
    await expect(row).toHaveCount(1);
    await expect(row.getByTestId("member-kind")).toHaveAttribute("data-kind", "robot");
  });

  test("can still be left out by somebody who wants only people", async ({ page }) => {
    /*
     * THE SAME LOCATOR, FIRST, ON THE PAGE THAT DOES LIST THEM. An absence
     * proved with a locator that would find nothing anywhere is a statement
     * about the locator, not about the filter — so the one below is only worth
     * reading because this one found the program a moment earlier.
     */
    await page.goto("/players?who=everyone");
    await expect(named(page, A_ROBOT)).toHaveCount(1);

    await page.goto("/players?who=people");
    /*
     * And SOMETHING THAT IS THERE, WAITED FOR, BEFORE READING WHAT IS NOT: an
     * absence passes the instant it is asked, so on its own it could not tell
     * "no program is listed" from "the page had not answered yet", and the
     * second is true for a moment on every page. The chip and the count are
     * the page's own furniture, so waiting on them says the people-only
     * directory has rendered without asserting anything about whose rows are
     * in it.
     */
    await expect(page.getByTestId("who-people")).toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("directory-count")).toHaveText(/listed$/);
    await expect(named(page, A_ROBOT)).toHaveCount(0);
  });
});
