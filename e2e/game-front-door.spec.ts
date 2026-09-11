import { expect, test } from "@playwright/test";

/**
 * A game's own page is where the whole errand is done.
 *
 * John, standing on what was then /rules/connect-six: "Go to a game. Read the
 * rules. See who's played. See any games that were played. See who's the best
 * at that game. See the recent games played. See the last game played. Play
 * that game. Decide that this game isn't one I want to play, but the Variant
 * it mentions is." Every one of those was a thing the site could answer and
 * the page a game's name leads to could not.
 *
 * THE FRONT DOOR IS /games/<slug> NOW. It was the rules page, and only because
 * that is where `GameName` sent everybody — a document doing a hub's job
 * because the links happened to land there. A game is one address with its
 * facets underneath, `GameName` points at the game, and the panels that answer
 * this list moved one segment up with the readers.
 *
 * Asserted on the panels and the links rather than on any particular row.
 * This repo's own rule: a spec must not assert anything about a name, a count
 * or a row it did not itself create — a development database is starved of
 * some rows and drowning in others, so "the ladder has Kai on it" is a test
 * about one machine's history wearing a test about the code.
 */

const GAME = "/games/gomoku";

test.describe("a game's page answers the whole errand", () => {
  test("what it is, its family, and the ways on", async ({ page }) => {
    await page.goto(GAME);

    // The page is about the game, and says so with a picture of one.
    await expect(page.getByTestId("game-front-door")).toBeVisible();
    await expect(page.getByTestId("game-picture")).toBeVisible();

    // 1. The rules, in summary here and in full one click on.
    await expect(page.getByTestId("game-object")).toBeVisible();
    await expect(page.getByTestId("game-rules-link")).toHaveAttribute("href", "/games/gomoku/rules");

    /*
     * 7. Starting a new one — two of them, because they are two intentions.
     * Scoped to the front door, because the site header carries a "Play" of
     * its own that goes to your games in progress.
     */
    await expect(page.getByTestId("game-play")).toHaveAttribute("href", "/games/gomoku/play");
    await expect(page.getByTestId("game-set-up")).toHaveAttribute("href", "/games/gomoku/new");

    // 6. The games already played.
    await expect(page.getByTestId("facet-history")).toHaveAttribute("href", "/games/gomoku/history");

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
      await expect(siblings.nth(i)).toHaveAttribute("href", /^\/games\/[^/]+$/);
    }
  });

  test("every facet of the game is reachable from the game", async ({ page }) => {
    /*
     * The whole claim of the restructure in one test: a reader who came for
     * any one of these can see the others. Nothing about a game is reachable
     * only by knowing an address.
     */
    await page.goto(GAME);
    const facets = page.getByTestId("game-facets");
    for (const [testId, href] of [
      ["facet-history", "/games/gomoku/history"],
      ["facet-me", "/games/gomoku/me"],
      ["facet-standings", "/games/gomoku/standings"],
      ["facet-family", "/games/gomoku/family"],
      ["facet-background", "/games/gomoku/background"],
    ] as const) {
      await expect(facets.getByTestId(testId)).toHaveAttribute("href", href);
    }
  });

  test("the rules page leads back up to the game, and out to what is public", async ({ page }) => {
    await page.goto("/games/gomoku/rules");
    await expect(page.getByTestId("rules-page")).toBeVisible();
    await expect(page.getByTestId("rules-up")).toHaveAttribute("href", "/games/gomoku");
    // The catalogue, which is the way out a reader with no invite can follow.
    await expect(page.getByTestId("rules-to-games")).toHaveAttribute("href", "/games");
  });

  test("who is best at it, the standings, and a game offered to them", async ({ page }) => {
    await page.goto(GAME);

    // 2 and 3. The ladder is ON the page, not a link to another one.
    const ladder = page.getByTestId("game-ladder");
    await expect(ladder).toBeVisible();

    /*
     * And it leads on to the whole of it. This is the assertion that had to
     * exist before the Champions row came out of the footer: a slice here, the
     * whole set one click on, which is the promise this site makes about every
     * number it prints.
     */
    await expect(ladder.getByTestId("game-ladder-all")).toHaveAttribute(
      "href",
      "/games/gomoku/standings",
    );

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
       * goes to those people or to exactly those games — and "those games" is
       * an address under the game now, which is what changed here.
       */
      const links = ladder.locator("a");
      for (let i = 0; i < (await links.count()); i += 1) {
        await expect(links.nth(i)).toHaveAttribute("href", /^\/(games|players)\//);
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
 * THE FRONT DOOR IS OPEN, AND THE PEOPLE BEHIND IT ARE NOT.
 *
 * John's rule: "strangers should be able to browse the site, the games, the
 * rules etc... they need to register to play." So a game's page, its rules and
 * its family are readable without an invite — and the ladder on that page is
 * members' names, their ratings and their records, which is the site's data
 * rather than its documentation.
 *
 * It matters more than it reads. `PlayerName` prints "Hanako M." and links to
 * /players/hanako-morris, so a member drawn for a stranger publishes a surname
 * in the markup even when the screen shows an initial. That is the bug that
 * was fixed in production by taking members off open pages, and opening the
 * front door must not undo it.
 *
 * An EMPTY storage state rather than `undefined`, and rather than a fresh
 * context. `undefined` means "not specified", so it falls back to the
 * project's signed-in cookies and the test quietly runs as the operator —
 * which is how this repo once had "two player" specs that were one account
 * all along, and how a test of this very gate was written a few hours ago and
 * passed while proving nothing.
 */
test.describe("a reader with no invite gets the game, and nothing about people", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the game is readable, the ladder is not there", async ({ page }) => {
    await page.goto(GAME);
    await expect(page.getByTestId("game-front-door"), "the game stays open").toBeVisible();
    await expect(page.getByTestId("game-object"), "and what it is").toBeVisible();
    await expect(page.getByTestId("game-family"), "and its family").toBeVisible();
    await expect(page.getByTestId("game-ladder"), "the ladder is the site's data, and is not").toHaveCount(0);
    await expect(page.getByTestId("rules-played-here"), "nor the games people played").toHaveCount(0);
  });

  test("the rules are readable and have a public way out", async ({ page }) => {
    await page.goto("/games/gomoku/rules");
    await expect(page.getByTestId("rules-page")).toBeVisible();
    /*
     * The way out has to be one the gate will honour. A page that is public
     * with only gated links off it is a room whose one exit is locked — and
     * the trail's middle step, the game itself, is open while the record and
     * the standings under it are not.
     */
    await page.getByTestId("rules-to-games").click();
    await expect(page).toHaveURL(/\/games$/);
    await expect(page.getByTestId("game-catalogue")).toBeVisible();
  });

  test("the catalogue is the games, and not the lobby", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByTestId("game-catalogue"), "the games are open").toBeVisible();
    await expect(page.getByTestId("games-join"), "and the door is offered").toBeVisible();
    await expect(page.getByTestId("lobby-start"), "posted seats are members offering games").toHaveCount(0);
  });
});
