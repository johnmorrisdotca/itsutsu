import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { gamesMade, namesPlayedUnder } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();
/** And the names they were played under, which outlive the games. See `namesPlayedUnder`. */
const under = namesPlayedUnder();

/**
 * What you can do about somebody, on the page about them.
 *
 * The directory has offered all three for a long time, and the page a
 * directory row leads to offered none — so the way to challenge somebody was
 * to go back to the list you had just left and find them again.
 */
test.describe("the actions on a player's page", () => {
  test("offers a game, a buddy and an ignore for another member", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const them = { email: `rival-${stamp}@example.com`, name: `Rival ${stamp}` };
    await memberContext(browser, baseURL!, them);

    const mine = await memberContext(browser, baseURL!, {
      email: `seeker-${stamp}@example.com`,
      name: `Seeker ${stamp}`,
    });
    const page = await mine.newPage();
    await page.goto(`/players/${them.name.toLowerCase().replace(/\s+/g, "-")}`);

    const actions = page.getByTestId("player-actions");
    await expect(actions).toBeVisible();
    /*
     * A LINK, because the offer of a game now leads to the screen that settles
     * one rather than creating a game where it stands. Buddy and Ignore are
     * still buttons: each of those is a thing that happens on the press.
     */
    await expect(actions.getByRole("link", { name: "Play", exact: true })).toBeVisible();
    await expect(actions.getByRole("button", { name: /Buddy/ })).toBeVisible();
    await expect(actions.getByRole("button", { name: /Ignore/ })).toBeVisible();
  });

  test("offers a computer player a game and the star, never an ignore", async ({ page }) => {
    // Playing one is the reason it is listed, and every member can be kept as a
    // buddy (John, 2026-10-01: "ALL members should be addable"). Ignoring a
    // program is not a thing anybody means.
    await page.goto("/players/kyu");
    const actions = page.getByTestId("player-actions");
    await expect(actions).toBeVisible();
    await expect(actions.getByRole("link", { name: /Play/ })).toBeVisible();
    await expect(actions.getByRole("button", { name: /Buddy/ })).toBeVisible();
    await expect(actions.getByRole("button", { name: /Ignore/ })).toHaveCount(0);
  });

  test("offers a kept record the star alone, and takes it back", async ({ browser, baseURL }) => {
    /*
     * Chibi never signed in, so no game is offered and nothing can be ignored;
     * she can be kept as a buddy like anybody. Chibi's row is made by a
     * migration on every database, and the star is pressed by a member this
     * spec makes, so nobody else's list changes.
     */
    const stamp = Date.now().toString(36);
    const mine = await memberContext(browser, baseURL!, { email: `keeper-${stamp}@example.com`, name: `Keeper ${stamp}` });
    const page = await mine.newPage();
    await page.goto("/players/chibi");
    const actions = page.getByTestId("player-actions");
    await expect(actions).toBeVisible();
    await expect(actions.getByRole("link", { name: /Play/ })).toHaveCount(0);
    await expect(actions.getByRole("button", { name: /Ignore/ })).toHaveCount(0);
    await expect(page.getByTestId("ask-after-record")).toHaveCount(0);

    const star = actions.getByTestId("buddy-toggle");
    await expect(star).toHaveAttribute("data-ready", "true");
    await star.click();
    await expect(star).toHaveText("★ Buddy");

    // On the buddy list, with no game offered beside a record that cannot play.
    await page.goto("/players/buddies");
    const row = page.getByTestId("buddy-row").filter({ hasText: "Chibi" });
    await expect(row).toBeVisible();
    await expect(row.getByRole("link", { name: /Play/ })).toHaveCount(0);

    // And the way back: the star in the row takes her off again.
    const off = row.getByTestId("buddy-toggle");
    await expect(off).toHaveAttribute("data-ready", "true");
    await off.click();
    await expect(off).toHaveText("☆ Buddy");
    await mine.close();
  });

  test("offers the star beside each name on the honors roll", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const mine = await memberContext(browser, baseURL!, { email: `honors-${stamp}@example.com`, name: `Honors ${stamp}` });
    const page = await mine.newPage();
    await page.goto("/players/honors");
    const roll = page.getByTestId("legacy-roll-remembered");
    const star = roll.getByTestId("buddy-toggle");
    await expect(star).toHaveCount(1);
    await expect(star).toHaveAttribute("data-ready", "true");
    await star.click();
    await expect(star).toHaveText("★ Buddy");
    await star.click();
    await expect(star).toHaveText("☆ Buddy");
    await mine.close();
  });

  test("offers nothing about yourself", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `alone-${stamp}@example.com`, name: `Alone ${stamp}` };
    const mine = await memberContext(browser, baseURL!, me);
    const page = await mine.newPage();
    await page.goto(`/players/${me.name.toLowerCase().replace(/\s+/g, "-")}`);
    await expect(page.getByTestId("player-profile")).toBeVisible();
    await expect(page.getByTestId("player-actions")).toHaveCount(0);
  });

  test("asks again under the record, but only when there is a record to read", async ({
    browser,
    baseURL,
    request,
  }) => {
    const stamp = Date.now().toString(36);
    const them = { email: `read-${stamp}@example.com`, name: `Read ${stamp}` };
    await memberContext(browser, baseURL!, them);
    const mine = await memberContext(browser, baseURL!, {
      email: `reader2-${stamp}@example.com`,
      name: `Reader2 ${stamp}`,
    });
    const page = await mine.newPage();
    const where = `/players/${them.name.toLowerCase().replace(/\s+/g, "-")}`;

    /*
     * Nothing to have seen yet, so nothing is asked twice: the question would
     * sit an inch under the first offer and be about a record that is not
     * there. My own screenshot found this; the test did not.
     */
    await page.goto(where);
    await expect(page.getByTestId("player-actions")).toBeVisible();
    await expect(page.getByTestId("ask-after-record")).toHaveCount(0);

    // Give them a finished game, so there is something to read down through.
    const started = await request.post("/api/games/live", {
      data: { blackName: under(them.name), whiteName: under(`Other ${stamp}`), size: 9 },
    });
    const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
    tidyAway(game.id);
    await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
    await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } });

    // A profile is read downwards; by the end the buttons at the top are gone.
    await page.goto(where);
    await expect(page.getByTestId("ask-after-record")).toBeVisible();
  });
});
