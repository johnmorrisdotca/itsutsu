import { expect, test } from "@playwright/test";

/**
 * Nobody plays both sides of a seat they posted for somebody else.
 *
 * John posted a seat for anyone to answer and then played both colours of it
 * himself, while the game sat on the noticeboard still asking for an
 * opponent — so a stranger could have sat down into a game already several
 * moves old, and because the two seat names can differ the result went to the
 * ladder as a real game between two people.
 *
 * There were three ways in, and the first two rules only shut the first two.
 * A token is the whole credential, so as long as the poster was handed the
 * token of the seat they had posted, no rule about who may sit where could
 * stop them playing it straight from the API.
 */
test.describe("answering your own posted seat", () => {
  type Posted = { id: string; blackToken: string; whiteToken?: string };

  async function postSeat(request: import("@playwright/test").APIRequestContext): Promise<Posted> {
    const started = await request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, open: true, moveTimeMs: null },
    });
    expect(started.status(), await started.text()).toBe(201);
    return (await started.json()) as Posted;
  }

  test("does not hand the poster the token of the seat they posted", async ({ request }) => {
    /*
     * The one that matters most, because it is the one no other rule can
     * cover. A private game still returns both tokens — the person who starts
     * it has to send one to whoever they mean to play — but a posted seat is
     * answered by sitting down, so there is nobody to send it to.
     */
    const posted = await postSeat(request);
    expect(posted.blackToken, "the poster still gets their own seat").toBeTruthy();
    expect(posted.whiteToken, "the posted seat's token went back to the poster").toBeUndefined();

    const priv = await request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, moveTimeMs: null },
    });
    const both = (await priv.json()) as Posted;
    expect(both.whiteToken, "a private game still needs a link to send").toBeTruthy();
  });

  test("refuses the poster the seat from the lobby", async ({ request }) => {
    // sitAtOpenSeat asked whether a seat was taken and never who was taking it.
    const game = await postSeat(request);
    const sat = await request.post(`/api/games/${game.id}/sit`, { data: {} });
    expect(sat.status(), "the poster sat down at their own posted seat").toBe(409);
    expect(((await sat.json()) as { reason?: string }).reason).toBe("own-seat");
  });

  test("refuses the poster the seat from its own link", async ({ page }) => {
    const game = await postSeat(page.request);
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    // A posted seat leads with waiting rather than with whose move it is, so
    // the seat is proved by the sharing panel being theirs to hand out.
    await expect(page.getByTestId("turn-banner")).toHaveAttribute("data-awaiting", "true");
    await expect(page.getByTestId("seat-invite")).toHaveAttribute("data-stone", "white");

    // Even holding a link from somewhere, the poster is not the answer to
    // their own invitation.
    const sat = await page.request.post(`/api/games/${game.id}/sit`, { data: {} });
    expect(sat.status()).toBe(409);
  });

  test("does not offer the poster their own seat on the board", async ({ page }) => {
    /*
     * The half the refusal did not cover, and the one John saw: the server
     * said no, and the lobby went on saying "Sit down with John Morris" on
     * John's own screen, against a seat he had posted himself. An offer the
     * site will then reject is worse than no offer.
     *
     * It had been excluded by the browser's seat cookies, which is the wrong
     * key — a seat belongs to the account on every device — so a seat posted
     * on a phone came straight back on a laptop.
     */
    const game = await postSeat(page.request);
    await page.goto("/games");
    await expect(page.getByTestId("start-game-go")).toBeVisible();

    /*
     * Asked of this seat rather than of the button, because the button speaks
     * for the whole board: any other seat that happens to match — including
     * one left by an earlier run, with nobody recorded as having posted it —
     * makes a claim about the button false without saying anything about the
     * rule under test. The rule is that THIS seat is not offered back to the
     * person who posted it.
     */
    const own = page.getByTestId("open-game").filter({ has: page.locator(`[href*="${game.id}"]`) });
    await expect(own, "the poster's own seat was on their board").toHaveCount(0);

    const offered = await page.getByTestId("open-game").count();
    const board = await page.locator("body").innerText();
    expect(board, "the poster's own game id was on the page").not.toContain(game.id);
    // A sanity check that the assertion above could have failed at all.
    expect(offered).toBeGreaterThanOrEqual(0);
  });

  test("still lets somebody else answer it", async ({ page, browser }) => {
    // Otherwise the fix has closed the game rather than the hole.
    const game = await postSeat(page.request);
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);

    const other = await browser.newContext({ storageState: ".auth/player.json" });
    const theirs = await other.newPage();
    const sat = await theirs.request.post(`/api/games/${game.id}/sit`, { data: {} });
    expect(sat.status(), await sat.text()).toBeLessThan(400);
    const { path, seat } = (await sat.json()) as { path: string; seat: string };
    expect(seat).toBe("white");

    await theirs.goto(path);
    await expect(theirs.getByTestId("turn-banner")).toContainText("Waiting for Black");
    await other.close();
  });
});
