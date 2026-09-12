import { expect, test } from "@playwright/test";

import { PLAYER_STATE, chooseGame, openGamesPage, openMoreSettings, openSetUpPage } from "./support";

/*
 * This file was called "starting a game is one sentence" and tested a one-line
 * form in the lobby with dropdowns in it. John called that very bad design and
 * asked for a screen where the game, the board, the pace and the opponent are
 * all settled before anything exists. The sentence is gone.
 *
 * The INTENTIONS it carried are not, and they still live here:
 *  - asking for a game nobody is asking for posts a seat, and it is a real game
 *  - asking for one somebody IS asking for sits you down with them instead
 *  - a stranger's seat is offered even when one of my own stands beside it
 *  - the seats board and who-is-here still sit side by side
 *
 * What went with the sentence, on purpose, is picking a game from the lobby
 * without going anywhere. That was the design being replaced, not a casualty
 * of replacing it.
 */

/** A pace nothing else in the suite asks for, so these seats meet only each other. */
const SEVEN_DAYS = String(7 * 24 * 60 * 60_000);

/** The setup screen, with the game and the pace these tests share already chosen. */
async function askFor(page: import("@playwright/test").Page, variant: string) {
  await openSetUpPage(page);
  await chooseGame(page, variant);
  // The pace and the opponent are behind the summary line now.
  await openMoreSettings(page);
  await page.getByTestId("shared-rules-move-time").selectOption(SEVEN_DAYS);
}

test.describe("asking for a game", () => {
  test("posts a seat when nobody is asking, and the seat is a real game", async ({ page }) => {
    await askFor(page, "trapThree");
    await page.getByTestId("set-up-with").selectOption("anyone");

    const button = page.getByTestId("set-up-start");
    await expect(button).toBeVisible();
    /*
     * Either it offers to post, or somebody is already asking and it offers to
     * sit — both are correct and which one depends on what the suite has left
     * on the board. Asserting the posting case only would be asserting an
     * order the suite does not promise.
     */
    await button.click();

    // Whichever it did, it landed on a real game with an address of its own.
    await page.waitForURL(/\/games\/[^/]+\/match\//);
  });

  test("sits down at once when somebody is already asking for the same", async ({ page, browser }) => {
    /*
     * The half most easily lost in the move, and the reason it was ported
     * rather than dropped: auto-match and posting a seat are the same wish
     * said twice — the only difference is whether anybody is already asking,
     * and the site knows that.
     */
    const theirs = await browser.newContext({ storageState: PLAYER_STATE });
    const posted = await theirs.request.post("/api/games/live", {
      data: { variant: "trapThree", moveTimeMs: Number(SEVEN_DAYS), open: true },
    });
    expect(posted.status()).toBe(201);

    await askFor(page, "trapThree");

    // The button says which of the two it will do, because to the person
    // pressing it they are different things: one starts a game, one starts a wait.
    await expect(page.getByTestId("set-up-start")).toContainText("Sit down with");
    await expect(page.getByTestId("set-up-match")).toBeVisible();

    await page.getByTestId("set-up-start").click();
    await page.waitForURL(/\/games\/[^/]+\/match\//);
    await theirs.close();
  });

  test("offers a stranger's seat even when my own is standing beside it", async ({ page, browser, request }) => {
    /*
     * Only one seat of a kind is worth offering, and WHICH one has to be
     * decided after the seats nobody can sit in are taken out, not before. My
     * own seat, posted a minute after an identical one of somebody else's, was
     * the one kept and then the one removed — so the screen offered to post a
     * seat with a stranger's already standing there. Narrow first, then keep
     * one of each.
     */
    const stamp = Date.now().toString(36);

    const theirs = await browser.newContext({ storageState: PLAYER_STATE });
    const posted = await theirs.request.post("/api/games/live", {
      data: { blackName: `Beside ${stamp}`, variant: "trapThree", moveTimeMs: Number(SEVEN_DAYS), open: true },
    });
    expect(posted.status()).toBe(201);

    // And mine, posted after theirs, so it is the newer of the two.
    const own = await request.post("/api/games/live", {
      data: { blackName: `Mine ${stamp}`, variant: "trapThree", moveTimeMs: Number(SEVEN_DAYS), open: true },
    });
    expect(own.status()).toBe(201);

    await askFor(page, "trapThree");

    /*
     * Somebody else's seat, and not mine — rather than that one seat by name.
     * An earlier spec's seat of the same kind may be the one standing, and
     * naming this one would be asking the suite to run in an order it does not
     * promise.
     */
    const button = page.getByTestId("set-up-start");
    await expect(button).toContainText("Sit down with");
    await expect(button).not.toContainText(`Mine ${stamp}`);

    await theirs.close();
  });

  test("the seats board and the room sit side by side, and both say when they are empty", async ({ page }) => {
    await openGamesPage(page);
    await expect(page.getByTestId("open-games")).toBeVisible();
    await expect(page.getByTestId("here-panel")).toBeVisible();

    /*
     * BOTH WAYS IN STAND HERE, and this case used to assert the opposite.
     *
     * 0.135.0 removed the one-line sentence and this line was written to hold
     * it removed — `toHaveCount(0)` on `start-game`. John asked for it back in
     * 0.143.0 ("we need that one line version back"), so the requirement
     * changed under a correct test rather than the test being wrong.
     *
     * What he had objected to was landing on a board with nothing agreed, and
     * the sentence being the ONLY way in. Neither is true now: it settles the
     * game, the board, the pace and the opponent, its "set up the board" path
     * goes to the game's front door, and `/games/new` stands beside it for
     * everything the sentence does not ask. So the thing to assert is that
     * BOTH are offered — a page with only one of them is the bug, in either
     * direction.
     *
     * Still asserted after something already present, which is the half of
     * this worth keeping from the original: an absence, or a presence, checked
     * before a page has rendered is a statement about timing.
     */
    await expect(page.getByTestId("lobby-set-up")).toBeVisible();
    await expect(page.getByTestId("start-game")).toBeVisible();
  });
});
