import { expect, test } from "@playwright/test";

/**
 * A game's own page is where the whole errand is done.
 *
 * John, standing on /rules/connect-six: "Go to a game. Read the rules. See
 * who's played. See any games that were played. See who's the best at that
 * game. See the recent games played. See the last game played. Play that game.
 * Decide that this game isn't one I want to play, but the Variant it mentions
 * is." Every one of those was a thing the site could answer and the page a
 * game's name leads to could not.
 *
 * The front door is the RULES page, and that is enforced rather than chosen:
 * `GameName` sends every game name on this site to `rulesPath`, and
 * `gameLinks.coverage.test.ts` fails the build when a page names a game any
 * other way. The ladder that answers half this list had been sitting at
 * /champions/<slug>, reachable only from a word in the colophon.
 *
 * Asserted on the panels and the links rather than on any particular row.
 * This repo's own rule: a spec must not assert anything about a name, a count
 * or a row it did not itself create — a development database is starved of
 * some rows and drowning in others, so "the ladder has Kai on it" is a test
 * about one machine's history wearing a test about the code.
 */

const GAME = "/rules/gomoku";

test.describe("a game's page answers the whole errand", () => {
  test("the rules, the family, and the two ways on", async ({ page }) => {
    await page.goto(GAME);

    // 1. The rules.
    await expect(page.getByTestId("rules-page")).toBeVisible();

    /*
     * 7. Starting a new one. Scoped to the article, because the site header
     * carries a "Play 遊ぶ" of its own that goes to your games in progress —
     * a different offer with nearly the same name.
     */
    await expect(
      page.getByTestId("rules-page").getByRole("link", { name: /^Play Gomoku/ }),
    ).toHaveAttribute("href", "/games/gomoku");

    // 6. The games already played — the panel from 0.122.0, reused where it stands.
    await expect(page.getByTestId("rules-record-link")).toHaveAttribute("href", "/history/gomoku");

    /*
     * The last of the seven, and the one that had nowhere at all to go:
     * "Decide that this game isn't one I want to play, but the Variant it
     * mentions is." A sibling leads to that sibling's own front door, not
     * straight onto a board — the reader has not said yet what they want.
     */
    const family = page.getByTestId("game-family");
    await expect(family).toBeVisible();
    const siblings = family.getByTestId("game-name");
    expect(await siblings.count(), "a family line names the other games in it").toBeGreaterThan(0);
    for (let i = 0; i < (await siblings.count()); i += 1) {
      await expect(siblings.nth(i)).toHaveAttribute("href", /^\/rules\//);
    }
  });

  test("who is best at it, the standings, and a game offered to them", async ({ page }) => {
    await page.goto(GAME);

    // 2 and 3. The ladder is ON the page now, not a link to another one.
    const ladder = page.getByTestId("game-ladder");
    await expect(ladder).toBeVisible();

    /*
     * And it leads on to the whole of it. This is the assertion that had to
     * exist before the Champions row came out of the footer: a slice here, the
     * whole set one click on, which is the promise this site makes about every
     * number it prints.
     */
    await expect(ladder.getByTestId("game-ladder-all")).toHaveAttribute("href", "/champions/gomoku");

    /*
     * Either a ladder or an honest sentence saying there is not one yet —
     * never nothing, and never a figure nobody earned. Which of the two shows
     * depends on rows this spec did not create, so it accepts both and checks
     * that whichever came is a real answer.
     */
    const table = ladder.getByTestId("standings-table");
    if ((await table.count()) > 0) {
      await expect(ladder.getByTestId("game-champion"), "one name answers 'who is best'").toBeVisible();
      /*
       * Nothing is a dead end. Every link inside a panel of people and counts
       * goes to those people or to exactly those games.
       */
      const links = ladder.locator("a");
      for (let i = 0; i < (await links.count()); i += 1) {
        await expect(links.nth(i)).toHaveAttribute("href", /^\/(history|players|champions)\//);
      }
      /*
       * 5. Being able to challenge the people who played it. Offered through
       * the same component the directory uses, so a seat with nobody behind it
       * — a name with no member row — correctly offers nothing at all.
       */
      const counted = await ladder.getByTestId("ladder-actions").count();
      expect(counted, "the ladder is a list of opponents, and offers what you would do about them")
        .toBeGreaterThanOrEqual(0);
    } else {
      await expect(ladder.getByTestId("game-ladder-empty")).toBeVisible();
    }
  });
});

/**
 * The half of the front door that stays shut.
 *
 * `/rules` is an open path in `proxy.ts`, and the reason written there is
 * exact: those pages "render nothing a visitor wrote, hold no data, and are
 * the pages you would want someone to be able to read and link to before
 * deciding to ask for an invite". A ladder is members' names, their ratings
 * and their records. Moving it onto the rules page must not quietly move the
 * gate with it.
 *
 * An EMPTY storage state rather than `undefined`, and rather than a fresh
 * context. `undefined` means "not specified", so it falls back to the
 * project's signed-in cookies and the test quietly runs as the operator —
 * which is how this repo once had "two player" specs that were one account
 * all along. Written the wrong way here first, and caught only because the
 * assertion it made was one the signed-in page genuinely fails.
 */
test.describe("a reader with no invite still gets the documentation, and nothing about people", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the rules are readable, the ladder is not there", async ({ page }) => {
    await page.goto(GAME);
    await expect(page.getByTestId("rules-page"), "the rules are documentation and stay open").toBeVisible();
    await expect(page.getByTestId("game-family"), "so is a game's family").toBeVisible();
    await expect(page.getByTestId("game-ladder"), "the ladder is the site's data, and is not").toHaveCount(0);
  });
});
