import { expect, test } from "@playwright/test";

/**
 * A page with several sections shows one at a time, and the address says
 * which.
 *
 * This is a standing rule rather than one page's design, so it is tested as
 * one: the same behaviour is asked of a player's record and of the operator's
 * page, which are the two that have it. A tab that cannot be linked to is a
 * tab somebody has to explain over the phone.
 */
test.describe("a page of many sections is tabs", () => {
  test("the address names the open tab, and opening that address opens it", async ({ page }) => {
    await page.goto("/players/chibi");
    // The first tab is the plain address: an ordinary link to a player must
    // not grow a query string just by being looked at.
    expect(new URL(page.url()).search).toBe("");
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "ItsYourTurn.com");

    await page.getByTestId("tab").filter({ hasText: "GoldToken" }).click();
    await expect(page).toHaveURL(/\?view=goldtoken$/);
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "GoldToken.com");

    // The whole point: that address, opened cold, is the same page.
    await page.goto("/players/chibi?view=goldtoken");
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "GoldToken.com");
    await expect(page.getByTestId("tab").filter({ hasText: "GoldToken" })).toHaveAttribute("data-open", "true");
  });

  test("an address naming a tab that is not there still lands on the person", async ({ page }) => {
    // A renamed tab, or an address somebody typed. Better the first tab than
    // an empty page.
    await page.goto("/players/chibi?view=myspace");
    await expect(page.getByTestId("player-profile")).toContainText("Chibi");
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "ItsYourTurn.com");
  });

  test("a record from one site still has this site's tab beside it", async ({ page }) => {
    /*
     * Kyokosan played on ItsYourTurn and nowhere else, and never here. She
     * still has two tabs. A page whose tabs depend on a count being zero
     * looks like a different kind of page to the reader, and what this site
     * holds of somebody is worth saying even when it is nothing.
     */
    await page.goto("/players/kyokosan");
    await expect(page.getByTestId("tab")).toHaveCount(2);
    // The record made elsewhere comes first, so the page opens on its substance.
    await expect(page.getByTestId("legacy-source")).toHaveAttribute("data-site", "ItsYourTurn.com");

    await page.getByTestId("tab").filter({ hasText: "Itsutsu" }).click();
    await expect(page).toHaveURL(/\?view=itsutsu$/);
    // And it says what an empty record means for somebody who never played
    // here, rather than telling her to wait for a rating.
    const empty = page.getByTestId("player-no-games");
    await expect(empty).toContainText("No games on Itsutsu");
    await expect(empty).not.toContainText("yet");
  });

  test("a remembered record is not told to wait for a first game", async ({ page }) => {
    // "No finished games yet" is the wrong word about somebody who has died.
    await page.goto("/players/chibi?view=itsutsu");
    const empty = page.getByTestId("player-no-games");
    await expect(empty).toContainText("kept rather than added to");
    await expect(empty).not.toContainText("yet");
  });

  test("the players page is four lists, one at a time", async ({ page }) => {
    /*
     * A directory of two hundred, a ladder of fifty, the computer players and
     * the kept records, stacked down one page — the ladder was three screens
     * below the fold on the day it was added.
     */
    await page.goto("/players");
    // Five since 0.165.0: the door, the site, the members, the bots, the work.
    await expect(page.getByTestId("tab")).toHaveCount(5);
    await expect(page.getByTestId("directory-section")).toBeVisible();
    // One at a time: the ladder is not also on screen below the directory.
    await expect(page.getByTestId("ladder-section")).toHaveCount(0);
    await expect(page.getByTestId("computer-players")).toHaveCount(0);
    await expect(page.getByTestId("remembered-section")).toHaveCount(0);

    // Who is here right now stands above the tabs on every one of them: it is
    // the only thing on the page that answers "can I get a game this minute".
    await expect(page.getByTestId("here-now")).toBeVisible();

    await page.getByTestId("tab").filter({ hasText: "Ladder" }).click();
    await expect(page).toHaveURL(/\?view=ladder$/);
    await expect(page.getByTestId("ladder-section")).toBeVisible();
    await expect(page.getByTestId("directory-section")).toHaveCount(0);
    await expect(page.getByTestId("here-now")).toBeVisible();

    await page.goto("/players?view=computers");
    await expect(page.getByTestId("computer-players")).toBeVisible();
    await expect(page.getByTestId("tab").filter({ hasText: "Computers" })).toHaveAttribute("data-open", "true");

    await page.goto("/players?view=remembered");
    await expect(page.getByTestId("legacy-roll-remembered")).toBeVisible();
  });

  test("a narrowed directory is still an address with no tab on it", async ({ page }) => {
    /*
     * The members are the first tab, so /players?who=computers is a filtered
     * directory rather than a page that needs both a tab and a filter spelled
     * out. Every link somebody had to the players page still works.
     */
    await page.goto("/players?who=everyone");
    await expect(page.getByTestId("directory-section")).toBeVisible();
    await expect(page.getByTestId("tab").filter({ hasText: "Members" })).toHaveAttribute("data-open", "true");
  });

  test("a member's own page is six parts, one at a time", async ({ page }) => {
    /*
     * The record, the profile, the four words, the defaults for a new game,
     * and the people they have said something about. Six panels down one page before this,
     * with the record — the part somebody comes back to look at rather than
     * fills in once — at the bottom of it.
     */
    await page.goto("/me");
    // Six since 0.161.0: Record, XP, Profile, Words, New games, People.
    await expect(page.getByTestId("tab")).toHaveCount(6);
    await expect(page.getByTestId("my-record")).toBeVisible();
    await expect(page.getByTestId("my-profile")).toHaveCount(0);
    await expect(page.getByTestId("my-people")).toHaveCount(0);

    // The name stands above them all: it is the one thing the site asks for.
    await expect(page.getByTestId("name-form")).toBeVisible();

    await page.getByTestId("tab").filter({ hasText: "People" }).click();
    await expect(page).toHaveURL(/\?view=people$/);
    await expect(page.getByTestId("buddies")).toBeVisible();
    await expect(page.getByTestId("name-form")).toBeVisible();
    await expect(page.getByTestId("my-record")).toHaveCount(0);

    await page.goto("/me?view=games");
    await expect(page.getByTestId("game-defaults-panel")).toBeVisible();
    await expect(page.getByTestId("tab").filter({ hasText: "New games" })).toHaveAttribute("data-open", "true");
  });

  test("a new member is asked one question, with no tabs under it", async ({ page }) => {
    /*
     * The welcome exists to ask for a name and nothing else. A row of tabs
     * beneath it is the rest of the site arriving before that is answered,
     * which is what the page was already avoiding by hiding those panels.
     */
    await page.goto("/me?welcome=1");
    await expect(page.getByTestId("welcome")).toBeVisible();
    await expect(page.getByTestId("name-form")).toBeVisible();
    await expect(page.getByTestId("tabs")).toHaveCount(0);
  });

  test("the operator's page is five tabs, one part at a time", async ({ page }) => {
    /*
     * The door, the members, the bots and the work. It was three headings on
     * one page with the whole features board inside the third, which made it
     * long however short the headings were — and the programs were in the
     * members list among the people, which is a different kind of row to
     * anybody who runs a site.
     */
    await page.goto("/admin");
    await expect(page.getByTestId("tab")).toHaveCount(4);
    await expect(page.getByTestId("admin-door")).toBeVisible();
    // One at a time: the board is not also on screen behind the invites.
    await expect(page.getByTestId("admin-backlog")).toHaveCount(0);
    await expect(page.getByTestId("admin-people")).toHaveCount(0);
    await expect(page.getByTestId("admin-machines")).toHaveCount(0);

    await page.getByTestId("tab").filter({ hasText: "The work" }).click();
    await expect(page).toHaveURL(/\?view=work$/);
    await expect(page.getByTestId("admin-backlog")).toBeVisible();
    await expect(page.getByTestId("admin-door")).toHaveCount(0);

    await page.goto("/admin?view=members");
    await expect(page.getByTestId("admin-people")).toBeVisible();
    await expect(page.getByTestId("tab").filter({ hasText: "The members" })).toHaveAttribute("data-open", "true");
    // And the programs are not in it: they are one tab along.
    await expect(page.getByTestId("admin-machines")).toHaveCount(0);

    await page.getByTestId("tab").filter({ hasText: "The bots" }).click();
    await expect(page).toHaveURL(/\?view=bots$/);
    await expect(page.getByTestId("admin-bots-table")).toBeVisible();
    await expect(page.getByTestId("admin-people")).toHaveCount(0);
  });
});
