import { expect, test } from "@playwright/test";

import {
  clearAllComputerStandings,
  clearComputerPlayer,
  clearComputerStandings,
  seedComputerPlayerFor,
  seedComputerStandings,
  seedPeopleStanding,
  seedComputerStandingFor,
  clearPeopleStanding,
} from "./members";

/**
 * The ladder for games against the computer players, per game.
 *
 * Per game because that is the only honest grain: a program that reads Reversi
 * well is not thereby good at Halma, and John's ruling was to do what the elder
 * sites do and keep one ladder per game.
 *
 * The figures below are shaped like what production actually measured, and
 * that shape is the point of the test. Over thirty games of Reversi the gentle
 * grades were BEATING the strong ones — so a page that drew the ladder in the
 * order the grade names suggest would be reporting a plan rather than a result.
 */
const VARIANT = "reversi";
const INVERTED = [
  { key: "kyu", name: "Kyu", rating: 1662, games: 12, wins: 9, losses: 3, draws: 0 },
  { key: "dan", name: "Dan", rating: 1641, games: 11, wins: 8, losses: 3, draws: 0 },
  // One with a draw, so the drawn count is a link somewhere and this suite
  // is not silently only ever checking three of the four.
  { key: "meijin", name: "Meijin", rating: 1558, games: 14, wins: 5, losses: 8, draws: 1 },
  { key: "guoshou", name: "Guoshou", rating: 1539, games: 13, wins: 4, losses: 9, draws: 0 },
];
const KEYS = INVERTED.map((one) => one.key);

test.describe("the ladder against the computer players", () => {
  test.beforeEach(async () => {
    await seedComputerStandings(VARIANT, INVERTED);
  });
  test.afterEach(async () => {
    await clearComputerStandings(VARIANT, KEYS);
  });

  test("stands on its own, beside the ladder of people rather than mixed into it", async ({ page }) => {
    await page.goto("/champions/reversi");
    const section = page.getByTestId("computer-standings");
    await expect(section).toBeVisible();
    // Said in words, because two ratings on one page invite being compared.
    await expect(section).toContainText("never added together");
  });

  test("shows the order the games made, not the order the names suggest", async ({ page }) => {
    /*
     * THE CASE THIS PAGE EXISTS TO GET RIGHT. Kyu and Dan are the gentle two
     * and Meijin and Guoshou the strong two, and on the measured results the
     * gentle two are ahead. The page has to say so.
     */
    await page.goto("/champions/reversi");
    const names = await page
      .getByTestId("computer-standings-table")
      .locator("tbody tr td:nth-child(2)")
      .allInnerTexts();
    /*
     * Their ORDER relative to each other, not their row numbers. This asserted
     * positions nought to three and broke the moment one unrelated row joined
     * the table — which on a shared database is a matter of when somebody else
     * plays, not of whether this page is right. The claim was never "Kyu is
     * first"; it was "the gentle two finish above the strong two".
     */
    const at = (who: string) => names.findIndex((one) => one.includes(who));
    for (const who of ["Kyu", "Dan", "Meijin", "Guoshou"]) {
      expect(at(who), `${who} is on the ladder`).toBeGreaterThanOrEqual(0);
    }
    expect(at("Kyu"), "Kyu above Meijin").toBeLessThan(at("Meijin"));
    expect(at("Kyu"), "Kyu above Guoshou").toBeLessThan(at("Guoshou"));
    expect(at("Dan"), "Dan above Meijin").toBeLessThan(at("Meijin"));
    expect(at("Dan"), "Dan above Guoshou").toBeLessThan(at("Guoshou"));
  });

  test("says how settled each standing is, rather than presenting a dozen games as a verdict", async ({ page }) => {
    // Eleven to fourteen games is provisional, and the row says so. A ladder
    // that looked identical at twelve games and at two hundred would be
    // claiming more than it knows.
    await page.goto("/champions/reversi");
    const rows = page.getByTestId("computer-standings-table").locator("tbody tr");
    await expect(rows.first()).toContainText("Provisional");
  });

  test("every count leads to exactly the games behind it", async ({ page }) => {
    /*
     * A rating's record is the RATED games of ONE pool, and BOTH halves of
     * that have to be on every link. Either one alone opens a wider set than
     * the number it sits under:
     *
     *   pool without rated   catches the unrated bot-against-bot batch, which
     *                        is twenty games nobody's ladder counts
     *   rated without pool   catches the games against people as well
     *
     * Checked over EVERY link rather than the first. The first link being
     * right says nothing about the twentieth, and this is the kind of thing
     * only reading the actual addresses can catch — the peer asked for it by
     * name, and my first version of this test did assert on `.first()` alone.
     */
    await page.goto("/champions/reversi");
    const links = page.getByTestId("computer-standings-table").locator("tbody tr a[href]");
    const count = await links.count();
    /*
     * How many counts OUGHT to be links, worked out from the figures rather
     * than guessed at. A count of nought is deliberately not a link — an empty
     * list reached by a link reads as a page that has broken rather than as an
     * answer — so a row with no draws contributes three links and not four.
     *
     * I first wrote sixteen here and the check failed at twelve, which was the
     * product being right and the test being wrong. Deriving it means the
     * number cannot drift from what the page actually offers.
     */
    const expected = INVERTED.reduce(
      (sum, one) => sum + [one.games, one.wins, one.losses, one.draws].filter((n) => n > 0).length,
      0,
    );
    expect(count).toBeGreaterThanOrEqual(expected);

    let checked = 0;
    for (let at = 0; at < count; at += 1) {
      const href = (await links.nth(at).getAttribute("href")) ?? "";
      // The player's own name links to their page and is not a count.
      if (href.startsWith("/players/")) continue;
      expect(href, `link ${at} of ${count}`).toContain("/history/reversi");
      expect(href, `link ${at} of ${count} must name the pool`).toContain("pool=computer");
      expect(href, `link ${at} of ${count} must exclude unrated games`).toContain("rated=yes");
      checked += 1;
    }
    /*
     * And it really looked at them. Every link being skipped as a player link
     * would have walked the loop and asserted nothing, which is the shape of a
     * test that passes by finding nothing — the thing this suite has been
     * bitten by before.
     */
    /*
     * At least what the seeded rows ought to offer. It was an equality, and
     * that broke as soon as one unrelated row joined the table — the claim is
     * that every link is right and that enough of them were looked at, not
     * that this page has exactly these players on it.
     */
    expect(checked, "counts actually inspected").toBeGreaterThanOrEqual(expected);
  });

  test("keeps a computer-only record off the ladder of people entirely", async ({ page }) => {
    /*
     * THE BUG THIS PAGE UNCOVERED, asserted so it cannot come back.
     *
     * A PlayerVariantRating row is written the first time a name finishes a
     * game of a variant in EITHER pool. So a player whose only games at
     * Reversi were against a program has a row whose PEOPLE columns were never
     * touched — a rating of 1600 over no games at all. The ladder of people
     * listed everybody with a row, so it showed them, at a starting rating
     * they had never played for. Reading the wrong half of a row and calling
     * it a standing, which is the same fault the members directory had.
     *
     * It was invisible on this database until now for the reason the seeding
     * helper exists: there were no computer-pool rows at all, so there was
     * nothing in the wrong half to leak.
     */
    await page.goto("/champions/reversi");
    const people = page.getByTestId("standings-table");
    if ((await people.count()) > 0) {
      for (const one of INVERTED) {
        await expect(people, `${one.name} has no standing among people`).not.toContainText(one.name);
      }
    }
    // And they are on the other ladder, so this is not passing by finding
    // nothing: the rows do exist, they are simply on the right table.
    await expect(page.getByTestId("computer-standings-table")).toContainText(INVERTED[0].name);
  });

  test("gives a game no champion on the strength of games against programs", async ({ page }) => {
    /*
     * The same leak two functions over, and the champions page said so itself:
     * "a variant nobody has played rated is simply absent" was a description
     * of what was meant rather than of what happened. Every row counted, so a
     * game whose only play was against a program got a champion at the
     * starting rating over no games — and the players and games tallies beside
     * the name counted those rows too.
     */
    await seedComputerStandings("halma", INVERTED);
    try {
      await page.goto("/champions");
      const row = page.getByTestId("champion-row-halma");
      await expect(row).toContainText("No rated games yet");
      for (const one of INVERTED) {
        await expect(row, `${one.name} is no champion of Halma`).not.toContainText(one.name);
      }
    } finally {
      await clearComputerStandings("halma", KEYS);
    }
  });

  test("shows a member their own record when all of it was against programs", async ({ page }) => {
    /*
     * THE SAME BUG ON THE PAGE WHERE IT MATTERS MOST. A member's own Record
     * tab read the ladder columns alone, so somebody whose games had all been
     * against the computer players opened it and read "– Unrated · No games
     * yet" about themselves, while their public page showed a rating and a
     * record. That is the members-directory fault of this morning, on the one
     * page a person visits to find THEIR OWN figures.
     *
     * Seeded on the global Player row rather than a variant one, because that
     * is what the overall line reads.
     */
    const key = await seedComputerPlayerFor("john@spxis.com", {
      rating: 1639,
      games: 5,
      wins: 3,
      losses: 2,
    });
    try {
      await page.goto("/me?view=record");
      const rating = page.getByTestId("my-rating");
      await expect(rating).toContainText("1639");
      // Marked, because an unlabelled number there reads as a ladder place.
      await expect(page.getByTestId("my-rating-computer")).toBeVisible();
      await expect(page.getByTestId("my-record")).not.toContainText("No games yet");
    } finally {
      await clearComputerPlayer(key);
    }
  });

  test("makes the champions page's game count a way into those games", async ({ page }) => {
    /*
     * The standing rule, which John has now raised three times: a count of
     * games leads to those games. The champions table was printing the one
     * number on the page that is literally a pile of games as plain text.
     *
     * Needs a ladder among PEOPLE to have a count at all, so this seeds one —
     * the computer-pool rows elsewhere in this file deliberately give that
     * table nothing.
     */
    const key = await seedPeopleStanding("halma", {
      key: "ladder tester",
      name: "Ladder Tester",
      rating: 1700,
      games: 6,
      wins: 4,
      losses: 2,
    });
    try {
      await page.goto("/champions");
      const count = page.getByTestId("champion-games").first();
      await expect(count).toBeVisible();
      const href = (await count.locator("xpath=ancestor-or-self::a").first().getAttribute("href")) ?? "";
      expect(href, "the count is a link").not.toBe("");
      expect(href).toContain("rated=yes");
      expect(href).toContain("pool=people");
    } finally {
      await clearPeopleStanding("halma", key);
    }
  });

  test("lists a game somebody has only played programs at, marked as that", async ({ page }) => {
    /*
     * CLOSING A GAP I MADE. Filtering the per-game table to standings actually
     * earned took a computer-only player from one FALSE line to no line at
     * all, which is a page going silent about somebody who plays here every
     * day. John's ruling is the same as for their overall figure: show it, and
     * mark it 機械.
     *
     * The mark is what stops two lines for one game reading as the same game
     * listed twice with different numbers — and adding the two together is the
     * one operation the pools exist to forbid.
     */
    const key = await seedComputerStandingFor("john@spxis.com", "reversi", {
      rating: 1639,
      games: 5,
      wins: 3,
      losses: 2,
    });
    try {
      await page.goto("/me?view=record");
      const table = page.getByTestId("me-standings");
      await expect(table).toBeVisible();
      const row = table.locator("tr", { hasText: "Reversi" }).first();
      await expect(row.getByTestId("standing-pool-computer")).toBeVisible();
      await expect(row).toContainText("1639");

      // And its counts lead to that pool's games, not to a wider set.
      const href = (await row.locator("a[href*='pool=']").first().getAttribute("href")) ?? "";
      expect(href).toContain("pool=computer");
      expect(href).toContain("rated=yes");
    } finally {
      await clearPeopleStanding("reversi", key);
    }
  });

  test("shows one game played in both pools as two lines, marked once", async ({ page }) => {
    /*
     * THE CASE TWO PEOPLE'S WORK CROSSED ON, and neither had a test for it.
     * A merge put a second 機械 in the rating cell beside the one on the name,
     * carrying copy that read "no games against people at this yet" — which
     * stopped being true the moment a game could hold two lines. Contradictory
     * text, shipped by a clean merge of two correct changes.
     *
     * What the page must say: two lines, because these are two standings and
     * adding them is the one thing the pools forbid; one mark, on the line
     * that needs it; and the two ratings side by side, unsummed.
     */
    const key = await seedComputerStandingFor("john@spxis.com", "reversi", {
      rating: 1639,
      games: 5,
      wins: 3,
      losses: 2,
    });
    await seedPeopleStanding("reversi", {
      key,
      name: key,
      rating: 1712,
      games: 9,
      wins: 6,
      losses: 3,
    });
    try {
      await page.goto("/me?view=record");
      const rows = page.getByTestId("me-standings").locator("tr", { hasText: "Reversi" });
      await expect(rows).toHaveCount(2);
      // One mark, not two: the second was the contradiction.
      await expect(page.getByTestId("standing-pool-computer")).toHaveCount(1);
      // Both ratings, neither summed into the other.
      await expect(rows.nth(0)).toContainText("1712");
      await expect(rows.nth(1)).toContainText("1639");
    } finally {
      await clearPeopleStanding("reversi", key);
    }
  });

  test("is not drawn at all for a game nobody has played a program at", async ({ page }) => {
    // A heading over an empty table reads as a broken page rather than as an
    // answer, and most games have no such standings at all.
    //
    // Cleared first, and that is the whole difference between a test about
    // the code and a test about this database. The assertion is that a game
    // with no computer standings draws no ladder — so it has to hold for rows
    // this run never made, and a bot batch left a Halma row here long ago
    // that made it fail for a reason nothing was wrong with.
    await clearAllComputerStandings("halma");
    await page.goto("/champions/halma");
    await expect(page.getByTestId("computer-standings")).toHaveCount(0);
  });
});
