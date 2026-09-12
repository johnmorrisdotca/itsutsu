import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

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
    await expect(actions.getByRole("link", { name: /Ask for a game/ })).toBeVisible();
    await expect(actions.getByRole("button", { name: /Buddy/ })).toBeVisible();
    await expect(actions.getByRole("button", { name: /Ignore/ })).toBeVisible();
  });

  test("offers a computer player a game and nothing else", async ({ page }) => {
    // Buddying or ignoring a program is not a thing anybody means; playing one
    // is the entire reason it is listed.
    await page.goto("/players/kyu");
    const actions = page.getByTestId("player-actions");
    await expect(actions).toBeVisible();
    await expect(actions.getByRole("link", { name: /Play/ })).toBeVisible();
    await expect(actions.getByRole("button", { name: /Buddy/ })).toHaveCount(0);
    await expect(actions.getByRole("button", { name: /Ignore/ })).toHaveCount(0);
  });

  test("offers nothing about a kept record, who has nobody on the other end", async ({ page }) => {
    // Chibi never signed in. An invitation would be an offer of a game that
    // cannot happen.
    await page.goto("/players/chibi");
    await expect(page.getByTestId("player-actions")).toHaveCount(0);
    await expect(page.getByTestId("ask-after-record")).toHaveCount(0);
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
      data: { blackName: them.name, whiteName: `Other ${stamp}`, size: 9 },
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
