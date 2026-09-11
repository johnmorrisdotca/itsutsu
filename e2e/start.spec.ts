import { expect, test } from "@playwright/test";

import { PLAYER_STATE, openGamesPage } from "./support";

/** A pace nothing else in the suite asks for, so these seats meet only each other. */
const SEVEN_DAYS = String(7 * 24 * 60 * 60_000);

test.describe("starting a game is one sentence", () => {
  test("posts a seat when nobody is asking, and the seat is a real game", async ({ page }) => {
    await openGamesPage(page);
    // A seat left open by an earlier run would be offered to sit in instead of
    // posting; take it first so this test meets an empty board, as a new day would.
    for (let guard = 0; guard < 8; guard += 1) {
      await page.getByTestId("start-game-variant").selectOption("trapThree");
      await page.getByTestId("start-game-pace").selectOption(SEVEN_DAYS);
      if ((await page.getByTestId("start-game-go").textContent()) === "Post the seat") break;
      await page.getByTestId("start-game-go").click();
      await expect(page.getByTestId("turn-banner")).toBeVisible();
      // A posted seat has no stones on it, so it is CALLED OFF rather than
      // resigned — there is nothing to give up, and nobody wins.
      await page.getByTestId("cancel").click();
      await page.getByTestId("cancel-yes").click();
      await openGamesPage(page);
    }
    await page.getByTestId("start-game-variant").selectOption("trapThree");
    await page.getByTestId("start-game-pace").selectOption(SEVEN_DAYS);
    await page.getByTestId("start-game-with").selectOption("anyone");

    // Nobody is asking for this, so the button offers to post it.
    await expect(page.getByTestId("start-game-go")).toHaveText("Post the seat");
    await expect(page.getByTestId("start-game-hint")).toContainText("first on the board");

    await page.getByTestId("start-game-go").click();
    /*
     * Posting goes through the poster's own seat link, which claims the seat
     * and sends them to the match's address. That address carries no move
     * number — the older assertion required one, and only ever held on the
     * other branch of this sentence, where sitting down with somebody lands
     * on a numbered move. It passed all this time because a database littered
     * with seats meant this test almost never took the posting branch.
     */
    await expect(page).toHaveURL(/\/games\/trap-three\/[a-z0-9-]+(\/0)?$/);
    /*
     * And it says it is waiting, not that the game is under way. This used to
     * expect "Your move", which was true and was not what was happening: a
     * seat posted for anyone had nobody opposite it yet. John asked for the
     * sentence to say so; the board stays playable underneath it.
     */
    await expect(page.getByTestId("turn-banner")).toContainText("waiting for somebody");

    // Tidy up after itself: an abandoned seat would meet the next run. Nothing
    // has been played, so this is calling it off rather than resigning it.
    await page.getByTestId("cancel").click();
    await page.getByTestId("cancel-yes").click();
    // A finished game leaves the board for the record, so the seat is off the board.
    await expect(page).toHaveURL(/\/history\/trap-three\//, { timeout: 15_000 });
  });

  test("offers a stranger's seat even when my own is standing beside it", async ({ page, browser, request }) => {
    /*
     * The sentence keeps one seat per game-and-pace-and-board, because that is
     * the only question it asks. Which one it keeps has to be decided AFTER
     * the seats nobody can sit in are taken out, not before: my own seat,
     * posted a minute after somebody else's identical one, was the one kept
     * and then the one removed, and the sentence said "post the seat" with a
     * stranger's seat standing right there.
     *
     * A bug I made myself, in the commit that fixed the one above it. Narrow
     * first, then keep one of each.
     */
    const stamp = Date.now().toString(36);
    const poster = `Beside ${stamp}`;

    const theirs = await browser.newContext({ storageState: PLAYER_STATE });
    const posted = await theirs.request.post("/api/games/live", {
      data: { blackName: poster, variant: "trapThree", moveTimeMs: Number(SEVEN_DAYS), open: true },
    });
    expect(posted.status()).toBe(201);

    // And mine, posted after theirs, so it is the newer of the two.
    const own = await request.post("/api/games/live", {
      data: { blackName: `Mine ${stamp}`, variant: "trapThree", moveTimeMs: Number(SEVEN_DAYS), open: true },
    });
    expect(own.status()).toBe(201);

    await openGamesPage(page);
    await page.getByTestId("start-game-variant").selectOption("trapThree");
    await page.getByTestId("start-game-pace").selectOption(SEVEN_DAYS);

    /*
     * Somebody else's seat, and not mine, and not nothing — rather than that
     * one particular seat. Only one seat of a kind is offered, and an earlier
     * spec's seat of the same kind may be the one standing; asking for this
     * one by name would be asking the suite to run in an order it does not
     * promise.
     */
    const go = page.getByTestId("start-game-go");
    await expect(go).toHaveText(/^Sit down with /);
    await expect(go).not.toHaveText(`Sit down with Mine ${stamp}`);

    await theirs.close();
  });

  test("sits down at once when somebody is already asking for the same", async ({ page, browser }) => {
    const stamp = Date.now().toString(36);
    const poster = `Poster ${stamp}`;
    /*
     * Somebody else has to post it. A seat is not offered back to the account
     * that posted it — you cannot sit across from yourself — and the request
     * fixture is signed in as the same person this page is, so posting it
     * that way tested nothing and now tests the opposite.
     */
    const theirs = await browser.newContext({ storageState: PLAYER_STATE });
    const posted = await theirs.request.post("/api/games/live", {
      data: { blackName: poster, variant: "notakto", moveTimeMs: Number(SEVEN_DAYS), open: true },
    });
    expect(posted.status()).toBe(201);

    await openGamesPage(page);
    await page.getByTestId("start-game-variant").selectOption("notakto");
    await page.getByTestId("start-game-pace").selectOption(SEVEN_DAYS);

    // The seat is on the board, and the sentence offers to take it rather than post another.
    await expect(page.getByTestId("open-games")).toContainText(poster);
    await expect(page.getByTestId("start-game-go")).toHaveText(`Sit down with ${poster}`);
    await expect(page.getByTestId("start-game-hint")).toContainText("asking for exactly this");

    await page.getByTestId("start-game-go").click();
    await expect(page).toHaveURL(/\/games\/notakto\/[a-z0-9-]+\/0$/);
    await expect(page.getByTestId("turn-banner")).toBeVisible();
    await theirs.close();
  });

  test("says what it will do for a game at this screen, and goes to the board", async ({ page }) => {
    await openGamesPage(page);
    await page.getByTestId("start-game-variant").selectOption("halma");
    await page.getByTestId("start-game-with").selectOption("screen");
    await expect(page.getByTestId("start-game-go")).toHaveText("Set up the board");
    await expect(page.getByTestId("start-game-hint")).toContainText("never rated");
    await page.getByTestId("start-game-go").click();
    await expect(page).toHaveURL(/\/games\/halma$/);
  });

  test("the seats board and the room sit side by side, and both say when they are empty", async ({ page }) => {
    await openGamesPage(page);
    await expect(page.getByTestId("open-games")).toBeVisible();
    await expect(page.getByTestId("here-panel")).toBeVisible();
    // The old five cards are gone; the sentence replaces them.
    await expect(page.getByText("Four ways in")).toHaveCount(0);
    await expect(page.getByTestId("start-game")).toBeVisible();
  });
});
