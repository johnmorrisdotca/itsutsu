import { expect, test } from "@playwright/test";

/**
 * Nobody answers their own public invitation.
 *
 * John posted a seat for anyone to answer, then played both colours of it
 * himself — and the game sat on the noticeboard asking for an opponent the
 * whole time, so a stranger could have sat down into a game already several
 * moves old. Whoever starts a game holds both seat tokens (they must, or they
 * could not send the other one to anybody) and nothing distinguished sending
 * yourself a link, which is a deliberate two-device game, from answering a
 * seat you had posted for the world.
 *
 * There are two doors into that room and both are checked here: following the
 * posted seat's own link, and sitting down from the lobby, which asked only
 * whether a seat was taken and never who was taking it.
 */
test.describe("answering your own posted seat", () => {
  async function postSeat(request: import("@playwright/test").APIRequestContext) {
    const started = await request.post("/api/games/live", {
      data: { blackName: "Poster", whiteName: "", size: 9, open: true },
    });
    expect(started.status(), await started.text()).toBe(201);
    return (await started.json()) as { id: string; blackToken: string; whiteToken: string };
  }

  test("refuses the posted seat to the person already sitting opposite it", async ({ page }) => {
    const game = await postSeat(page.request);

    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await expect(page.getByTestId("turn-banner")).toContainText("you are Black");

    // The other seat is the one they posted. Following its link must leave
    // them where they were rather than hand them both colours.
    await page.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);
    await expect(
      page.getByTestId("turn-banner"),
      "the poster took the seat they had posted for somebody else",
    ).not.toContainText("you are White");
  });

  test("refuses it from the lobby too, which never asked who was sitting down", async ({ page }) => {
    const game = await postSeat(page.request);
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await expect(page.getByTestId("turn-banner")).toContainText("you are Black");

    const sat = await page.request.post(`/api/games/${game.id}/sit`, { data: {} });
    expect(sat.status(), "sitting down at your own posted seat").toBe(409);
    const body = (await sat.json()) as { reason?: string };
    expect(body.reason).toBe("own-seat");
  });

  test("still lets somebody else answer it", async ({ page, browser }) => {
    // The seat is posted for a reason: a different person must still be able
    // to take it, or the fix has closed the game rather than the hole.
    const game = await postSeat(page.request);
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);

    const other = await browser.newContext({ storageState: ".auth/player.json" });
    const theirs = await other.newPage();
    await theirs.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);

    /*
     * Before Black has played, White's own board reads "Waiting for Black" —
     * which is also what a passer-by sees, so it proves nothing on its own.
     * Black plays, and the seat is proved by the board becoming theirs.
     */
    await expect(theirs.getByTestId("turn-banner")).toContainText("Waiting for Black");
    await page.request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    await theirs.reload();
    await expect(theirs.getByTestId("turn-banner")).toContainText("Your move");
    await other.close();
  });
});
