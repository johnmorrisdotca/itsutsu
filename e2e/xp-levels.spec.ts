import { expect, test } from "@playwright/test";

import { XP_LEVELS } from "../src/lib/xp/xpCurve";
import { xpLevelName } from "../src/lib/xp/levelNames";
import { removeXpMembers, seedXpMember, type SeededXpMember } from "./xpMembers";
import { watchForCrashes } from "./support";

/**
 * THE LADDER OF LEVELS, DRIVEN THE WAY A READER DRIVES IT.
 *
 * The control on `/xp/levels` is a level's NAME, and what it promises is the
 * level's own page. So this clicks one rather than navigating to the address it
 * would have produced — AGENTS.md's "drive the control, not the mechanism", and
 * the reason the language picker shipped broken while every test of it passed.
 *
 * **It brings its own member.** The development database has nobody with any
 * experience on it, because nothing is backfilled — so a spec that asserted
 * somebody stands on level 60 would have to skip, and a skip reports green while
 * saying nothing. `seedXpMember` makes the row, the spec asserts about that row
 * and no other, and `removeXpMembers` takes back exactly what it made.
 *
 * **The return trip is tested too.** A one-directional test finds
 * one-directional bugs, and "I cannot get back out of it" is a whole class of
 * fault that only the way back ever sees. So this goes down a rung and up again.
 */

/** A rung in the middle of the ladder: far from both ends, so neither end hides a bug. */
const RUNG = 60;

let member: SeededXpMember;

test.beforeAll(async () => {
  member = await seedXpMember(RUNG, "levels");
});

test.afterAll(async () => {
  await removeXpMembers([member.email]);
});

test("the ladder lists every rung, and a name leads to its own page", async ({ page }) => {
  const crashes = watchForCrashes(page);
  await page.goto("/xp/levels");

  const ladder = page.getByTestId("level-ladder");
  await expect(ladder).toBeVisible();

  /*
   * All hundred, and the count is asserted before anything else is looked for:
   * "the row I wanted is missing" and "the table drew twelve rows" are different
   * faults and the second one explains the first.
   */
  await expect(page.locator("[data-level][data-testid$='rung']")).toHaveCount(XP_LEVELS);

  // The five marked rungs, which are a decision and not arithmetic.
  await expect(page.locator("[data-milestone]")).toHaveCount(5);

  /* The control a reader presses. Found by the name the site gave the level,
     so a renamed catalogue fails here rather than passing on a stale row. */
  const name = xpLevelName(RUNG);
  await page
    .locator(`[data-testid='ladder-rung'][data-level='${RUNG}'] [data-testid='ladder-level-link']`)
    .click();

  await expect(page).toHaveURL(new RegExp(`/xp/levels/${RUNG}$`));
  await expect(page.getByTestId("level-name-heading")).toContainText(name);
  await expect(page.getByTestId("level-costs")).toBeVisible();
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("a level names the rungs either side, and both lead there and back", async ({ page }) => {
  await page.goto(`/xp/levels/${RUNG}`);

  await expect(page.getByTestId("level-above")).toContainText(xpLevelName(RUNG + 1));
  await page.getByTestId("level-below").click();
  await expect(page).toHaveURL(new RegExp(`/xp/levels/${RUNG - 1}$`));
  await expect(page.getByTestId("level-name-heading")).toContainText(xpLevelName(RUNG - 1));

  /* The way back. Pressing "above" from one rung down must return to the rung
     this test started on rather than to wherever the browser happened to be. */
  await page.getByTestId("level-above").click();
  await expect(page).toHaveURL(new RegExp(`/xp/levels/${RUNG}$`));
  await expect(page.getByTestId("level-name-heading")).toContainText(xpLevelName(RUNG));
});

test("the level a member stands on shows that member, linked to their page", async ({ page }) => {
  await page.goto(`/xp/levels/${RUNG}`);

  const table = page.getByTestId("level-members");
  await expect(table).toBeVisible();

  /*
   * The row this spec made, and only that one. The rung may hold other rows on a
   * developer's database and the spec says nothing about them — what it asserts
   * is that the member it created is here, under a name that is a link to them.
   */
  const row = table.getByTestId("level-member").filter({ hasText: member.name });
  await expect(row).toHaveCount(1);
  const link = row.getByTestId("player-name");
  await expect(link).toHaveAttribute("href", new RegExp(`/players/${member.id}$`));
});

test("the ends of the ladder say they are the ends, rather than offering a rung that is not there", async ({
  page,
}) => {
  await page.goto("/xp/levels/1");
  /* Waited for a sibling that IS on the page before asserting the absence, so
     this cannot pass by asking before the page had answered. */
  await expect(page.getByTestId("level-above")).toBeVisible();
  await expect(page.getByTestId("level-below")).toHaveCount(0);

  await page.goto(`/xp/levels/${XP_LEVELS}`);
  await expect(page.getByTestId("level-below")).toBeVisible();
  await expect(page.getByTestId("level-above")).toHaveCount(0);
});

test("a rung shows its table whether or not anybody is standing on it", async ({ page }) => {
  /*
   * THE EMPTY TABLE IS DATA, and this is the assertion that says so without
   * asserting anything about the database. Level 100 costs 68,155 XP and is
   * almost certainly empty — but "almost certainly" is a fact about this machine,
   * and a spec that asserted the emptiness would be a test about whichever rows
   * happened to be here.
   *
   * So what is checked is the CODE's promise: the table and its headings are
   * drawn either way, and exactly one of "here is somebody" and "nobody is here
   * yet" is shown. That holds on an empty database and on a full one, which is
   * what makes it a statement about the page.
   */
  await page.goto(`/xp/levels/${XP_LEVELS}`);

  const table = page.getByTestId("level-members");
  await expect(table).toBeVisible();
  await expect(table.locator("th", { hasText: "Member" })).toBeVisible();
  await expect(table.locator("th", { hasText: "XP" })).toBeVisible();

  const standing = await table.getByTestId("level-member").count();
  const empty = await page.getByTestId("level-empty").count();
  expect(empty, "a rung must say either who is on it or that nobody is").toBe(
    standing > 0 ? 0 : 1,
  );

  // And when it is empty, the way in is offered rather than an apology printed.
  if (standing === 0) await expect(page.getByTestId("level-invite")).toBeVisible();
});

test("a level the ladder does not have is not found", async ({ page }) => {
  for (const address of [`/xp/levels/${XP_LEVELS + 1}`, "/xp/levels/0", "/xp/levels/07"]) {
    const answer = await page.goto(address);
    /*
     * Enumerating what is TOLERATED rather than what is refused. 404 is the
     * answer; anything else — a 200 drawing a nameless rung, a 500 — is the bug,
     * and `not.toBe(200)` would have accepted a crash.
     */
    expect(answer?.status(), `${address} should not be a page`).toBe(404);
  }
});
