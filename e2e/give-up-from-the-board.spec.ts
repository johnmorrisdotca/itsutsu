import { expect, test } from "@playwright/test";

import { playAt } from "./support";

/**
 * Giving a game up from the board a player is actually looking at.
 *
 * John, on a game his twelve-year-old was playing: "My daughter pressed
 * REsign in the TicTacToe game. Not working. Even the confirmation after
 * confirming the game doesn't end. BUG."
 *
 * THE COVERAGE GAP THIS CLOSES. `mygames.spec.ts` has "a game can be resigned
 * from the queue, and is then filed" — from /play, a list, where the
 * button's `router.refresh()` redraws the very list it sits in. Nothing
 * exercised the other place the same button appears, which is the board in
 * `SharedGame` — the place a player actually reaches for it, and the place
 * John's daughter did. There the page is a live client session holding its own
 * state, so "the server ended the game" and "the screen says so" are two
 * different claims, and only one of them was being made.
 *
 * Both are checked here, and separately: the server's word through the API,
 * and the board's through what it stops showing.
 */
test.describe("giving up, from the board", () => {
  test("resigning a game under way ends it, and the board stops asking for a move", async ({
    page,
    request,
  }) => {
    const made = await request.post("/api/games/live", {
      data: { blackName: "Kai", whiteName: "Mio", size: 9 },
    });
    expect(made.status()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string };

    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await playAt(page, 9, 4, 4);
    await expect(page.getByTestId("turn-banner")).toBeVisible();

    await page.getByTestId("resign").click();
    await page.getByTestId("resign-yes").click();

    /*
     * The server's word first, because it is the one that decides. A board
     * that redrew without the game ending would be the worse bug of the two:
     * it would look fixed.
     */
    await expect
      .poll(
        async () =>
          (await (await request.get(`/api/games/${game.id}`)).json()) as {
            status: string;
            result: string;
          },
        { timeout: 15_000 },
      )
      .toMatchObject({ status: "finished", result: "white" });

    /*
     * And the board's. The banner is not reworded when a game ends — it stops
     * being rendered — so its ABSENCE is the assertion, and a refusal the
     * button swallowed would leave it in place.
     */
    await expect(page.getByTestId("turn-banner")).toHaveCount(0);
    await expect(page.getByTestId("resign-refused")).toHaveCount(0);
  });

  test("calling off a seat nobody has taken ends it too, without anybody winning", async ({
    page,
    request,
  }) => {
    /*
     * The other door, and it is deliberately a different one on the server:
     * before the first stone there is nothing to give up, so the button says
     * Cancel and posts to /cancel. Nobody wins a game that was never played.
     */
    const made = await request.post("/api/games/live", { data: { size: 9, open: true } });
    const game = (await made.json()) as { id: string; blackToken: string };

    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await expect(page.getByTestId("turn-banner")).toContainText("waiting for somebody");

    // Resigning is not even offered here — the word would be wrong.
    await expect(page.getByTestId("resign")).toHaveCount(0);
    await page.getByTestId("cancel").click();
    await page.getByTestId("cancel-yes").click();

    await expect
      .poll(
        async () =>
          ((await (await request.get(`/api/games/${game.id}`)).json()) as { status: string }).status,
        { timeout: 15_000 },
      )
      .not.toBe("active");
    await expect(page.getByTestId("turn-banner")).toHaveCount(0);
  });
});
