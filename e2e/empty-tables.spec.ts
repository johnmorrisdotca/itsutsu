import { expect, test } from "@playwright/test";

import { PLAYER_STATE } from "./support";

/**
 * An empty table is data, and an invite is not a stranger.
 *
 * Two rules that arrived together and are checked together because they are
 * the same mistake twice: a page deciding, on its own, that a reader should be
 * shown nothing.
 *
 * John, on the panels that hid themselves: "empty tables are fine! show the
 * table. Show nothing has been played yet... and that's a change to have a
 * link saying - be the first to play!" Thirty-nine of the games here have
 * barely been played, and a panel that vanishes turns each of them into a
 * silence rather than an invitation.
 */
test.describe("a game nobody has played yet", () => {
  // Misère Five is played in the suite but never as a RATED game between two
  // named members, which is the only thing that puts anybody on a ladder.
  const quiet = "/games/misere-five";

  test("shows the ladder's shape rather than hiding it, and offers the way in", async ({ page }) => {
    await page.goto(quiet);

    // The table is drawn: a reader learns what this site keeps about a game
    // before there is anything of this game to keep.
    const ladder = page.getByTestId("ladder-side-view");
    await expect(ladder).toBeVisible();
    await expect(ladder.locator("th")).toHaveText(["#", "Player", "Rating"]);

    // And it says what no rows means, rather than leaving a reader to guess.
    await expect(page.getByTestId("ladder-side-view-empty")).toContainText("Nobody holds a standing");

    // The invitation, which is the change John asked for by name.
    const beFirst = page.getByTestId("ladder-be-first");
    await expect(beFirst).toBeVisible();
    await expect(beFirst).toHaveAttribute("href", "/games/misere-five/play");
  });

  test("says the same on the whole ladder, and shows both pools", async ({ page }) => {
    await page.goto(`${quiet}/standings`);

    // The people's ladder, drawn empty rather than replaced by an apology.
    await expect(page.getByTestId("standings-table")).toBeVisible();
    await expect(page.getByTestId("standings-be-first")).toHaveAttribute(
      "href",
      "/games/misere-five/play",
    );

    /*
     * And the OTHER ladder, which used to appear only once somebody had
     * happened to play a program. A reader cannot learn that this site keeps a
     * separate pool for the computer players from a section that is not there.
     */
    await expect(page.getByTestId("computer-standings")).toBeVisible();
    await expect(page.getByTestId("computer-standings-table")).toBeVisible();
  });
});

test.describe("a reader with no invite", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is told what the ladder is and shown the door, not a false empty table", async ({ page }) => {
    // Gomoku HAS been played here. An empty table drawn for a stranger would
    // say the opposite, which is the dishonest version of the rule above.
    await page.goto("/games/gomoku");

    await expect(page.getByTestId("ladder-side-view")).toHaveCount(0);
    await expect(page.getByTestId("game-ladder-shut")).toContainText("needs an invite");
    await expect(page.getByTestId("ladder-join")).toHaveAttribute("href", "/join");

    // And still no member's name anywhere on the open page.
    const said = await page.content();
    expect(said, "a stranger was shown a link to somebody's page").not.toMatch(/\/players\//);
  });
});

test.describe("a reader who joined with an invite code", () => {
  // The regression this file was written around: an invite session has no
  // address, and /games read "no address" as "no session" and showed the
  // person who had just redeemed a code the page telling them to go and get
  // one. Every person John invites arrives exactly this way.
  test.use({ storageState: PLAYER_STATE });

  test("reaches the lobby rather than being told to go and get an invite", async ({ page }) => {
    await page.goto("/games");

    // The playing half, which is what they came through the door for.
    await expect(page.getByTestId("lobby-start")).toBeVisible();
    await expect(page.getByTestId("open-games")).toBeVisible();

    // And NOT the page written for somebody who has never been here.
    await expect(page.getByTestId("games-join")).toHaveCount(0);
  });

  test("is shown a game's ladder, which is not a thing kept from members", async ({ page }) => {
    await page.goto("/games/gomoku");
    await expect(page.getByTestId("game-ladder")).toBeVisible();
    await expect(page.getByTestId("game-ladder-shut")).toHaveCount(0);
  });
});
