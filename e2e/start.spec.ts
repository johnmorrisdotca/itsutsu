import { expect, test } from "@playwright/test";

import { PLAYER_STATE } from "./support";

/** A pace nothing else in the suite asks for, so these seats meet only each other. */
const SEVEN_DAYS = String(7 * 24 * 60 * 60_000);

test.describe("starting a game is one sentence", () => {
  test("posts a seat when nobody is asking, and the seat is a real game", async ({ page }) => {
    await page.goto("/games");
    // A seat left open by an earlier run would be offered to sit in instead of
    // posting; take it first so this test meets an empty board, as a new day would.
    for (let guard = 0; guard < 8; guard += 1) {
      await page.getByTestId("start-game-variant").selectOption("trapThree");
      await page.getByTestId("start-game-pace").selectOption(SEVEN_DAYS);
      if ((await page.getByTestId("start-game-go").textContent()) === "Post the seat") break;
      await page.getByTestId("start-game-go").click();
      await expect(page.getByTestId("turn-banner")).toBeVisible();
      await page.getByTestId("resign").click();
      await page.getByTestId("resign-yes").click();
      await page.goto("/games");
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
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");

    // Tidy up after itself: an abandoned seat would meet the next run.
    await page.getByTestId("resign").click();
    await page.getByTestId("resign-yes").click();
    // A finished game leaves the board for the record, so the seat is off the board.
    await expect(page).toHaveURL(/\/history\/trap-three\//, { timeout: 15_000 });
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

    await page.goto("/games");
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
    await page.goto("/games");
    await page.getByTestId("start-game-variant").selectOption("halma");
    await page.getByTestId("start-game-with").selectOption("screen");
    await expect(page.getByTestId("start-game-go")).toHaveText("Set up the board");
    await expect(page.getByTestId("start-game-hint")).toContainText("never rated");
    await page.getByTestId("start-game-go").click();
    await expect(page).toHaveURL(/\/games\/halma$/);
  });

  test("the seats board and the room sit side by side, and both say when they are empty", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByTestId("open-games")).toBeVisible();
    await expect(page.getByTestId("here-panel")).toBeVisible();
    // The old five cards are gone; the sentence replaces them.
    await expect(page.getByText("Four ways in")).toHaveCount(0);
    await expect(page.getByTestId("start-game")).toBeVisible();
  });
});
