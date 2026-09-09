import { expect, test } from "@playwright/test";

import { PLAYER_STATE } from "./support";

/**
 * A seat's link is only shown while that seat is still to be given out.
 *
 * The token is the whole credential: POST /api/games/:id/moves takes it in
 * the body and plays that seat, with no cookie and no account. The invite
 * panel used to render both seats' links to whoever held either seat, so each
 * player was shown the other's credential for the length of the game and
 * could have played their opponent's moves.
 *
 * This is the mitigation rather than the whole cure — a-taken-seat-still-
 * hands-out-its-link carries the rest, which is making a claimed token stop
 * working — so the test is about what is on screen.
 */
test.describe("seat links", () => {
  test("both are offered while both seats are empty, and the taken one goes", async ({ browser, request }) => {
    const started = await request.post("/api/games/live", {
      data: { blackName: "Poster", whiteName: "", size: 9 },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };

    // Black takes their own seat by following their link, as the creator does.
    const black = await browser.newContext();
    const blackPage = await black.newPage();
    await blackPage.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await expect(blackPage.getByTestId("seat-invite")).toHaveCount(1);
    // Black's own link is gone the moment black sits down; white's remains,
    // because white's seat is the one still waiting for somebody.
    await expect(blackPage.getByTestId("seat-invite")).toHaveAttribute("data-stone", "white");

    // White answers it.
    const white = await browser.newContext();
    const whitePage = await white.newPage();
    await whitePage.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);

    // Now nobody's link is on anybody's screen. This is the whole point: the
    // opponent must not be able to read your credential off the board.
    await expect(whitePage.getByTestId("seat-invite")).toHaveCount(0);
    await blackPage.reload();
    await expect(blackPage.getByTestId("seat-invite")).toHaveCount(0);

    await black.close();
    await white.close();
  });

  test("stop entirely once a stone is down, whoever is sitting opposite", async ({ browser, request }) => {
    /*
     * The stronger rule, and the one that covers what the per-seat one
     * cannot. A computer player never follows a link, so its seat is never
     * stamped and read as free for ever — John found both QR codes on screen
     * in a game he was already playing against Kyu. More generally: once play
     * has begun there is nobody left to invite, and a link still on screen is
     * only a credential for somebody to read over your shoulder.
     */
    const started = await request.post("/api/games/live", {
      data: { blackName: "Poster", whiteName: "", size: 9 },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string };

    const black = await browser.newContext();
    const page = await black.newPage();
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    // White's seat is still going out, so its link is there.
    await expect(page.getByTestId("seat-invite")).toHaveCount(1);

    const played = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(played.status()).toBe(201);

    await page.reload();
    await expect(page.getByTestId("seat-invite")).toHaveCount(0);
    await black.close();
  });

  test("a seat posted on the noticeboard keeps its link until somebody sits down", async ({
    browser,
    request,
  }) => {
    // An open game's whole purpose is that its seat is still going out, so
    // the backfill and the rule both have to leave a posted seat alone.
    const started = await request.post("/api/games/live", {
      data: { blackName: "Poster", whiteName: "", size: 9, open: true },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string };

    const black = await browser.newContext();
    const page = await black.newPage();
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await expect(page.getByTestId("seat-invite")).toHaveAttribute("data-stone", "white");

    /*
     * Somebody sits down through the noticeboard, without ever following the
     * link. That is a seat being taken too, and the link must stop.
     *
     * Somebody, and not the poster: a seat posted for anyone is not one its
     * poster may answer, so this needs a second person to be a test of the
     * noticeboard rather than of that refusal.
     */
    const guest = await browser.newContext({ storageState: PLAYER_STATE });
    const sat = await guest.request.post(`/api/games/${game.id}/sit`);
    expect(sat.status()).toBeLessThan(400);

    await page.reload();
    await expect(page.getByTestId("seat-invite")).toHaveCount(0);
    await guest.close();
    await black.close();
  });
});
