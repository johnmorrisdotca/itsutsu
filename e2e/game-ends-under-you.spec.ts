import { expect, test } from "@playwright/test";

import { memberContext, seatTokensFor, seedMember } from "./members";
import { playAt, ready, startAndBegin } from "./support";
import { gamesMade } from "./tidy";

/**
 * Every game this file makes, taken away when it finishes.
 *
 * It made none of its own before, and each run left three behind — two games
 * and a rematch. Noticed while offers were being built: the unanswered offers
 * this file's own failing runs had left had nothing to clear them. AGENTS.md
 * on database litter: a database that grows cuts real rows off the end of
 * capped lists and fails other specs for reasons that are not the code's.
 */
const tidyAway = gamesMade();

/**
 * What a game does when it ends while you are sitting in front of it.
 *
 * John lost a game of Tournament Gomoku to the computer player Kyu and asked
 * "where's the rematch button and all the other things we should have in the
 * game page?" There was none — and the reason was not the rematch. A match has
 * one address in two presentations, and the SERVER picks between them from the
 * status when the page is rendered. Nothing ever told it to look again.
 *
 * So the board settled and the result banner read correctly, while everything
 * AROUND the board stayed as it had been drawn for a game in play: no rematch,
 * no heading naming the two players, no applause, and a message composer for a
 * game nobody could speak into again. Reloading fixed it, and only reloading.
 *
 * WHY NOTHING CAUGHT IT. `rematch.spec.ts` plays its game through the API and
 * THEN navigates, so it always meets the filed page on a fresh server render,
 * and it always passed. That is the shape AGENTS.md names: a test that reaches
 * its subject by a route no reader takes. A reader reaches the end of a game by
 * being on the page when it ends.
 *
 * So NOTHING HERE RELOADS, deliberately. A reload throws away exactly the
 * client state the bug lives in, and turns a broken page into a green test.
 */
test.describe("a game that ends while you are looking at it", () => {
  test("becomes the record by itself, with the rematch on it and no reload", async ({
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    // One word each, so the site prints the name whole: `shownName` shortens
    // "Ada Lovelace" to "Ada L.", and an assertion on a name it has cut is an
    // assertion about the wrong thing.
    const me = { email: `ends-${stamp}@example.test`, name: `Ends${stamp}` };
    const them = { email: `foe-${stamp}@example.test`, name: `Foe${stamp}` };
    await seedMember(me);
    await seedMember(them);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // Small board, three in a row, and no clock to expire underneath the test.
    const made = await context.request.post("/api/games/live", {
      data: {
        challenge: them.email,
        variant: "freestyle",
        size: 9,
        winLength: 3,
        moveTimeMs: null,
      },
    });
    expect(made.status(), await made.text()).toBe(201);
    const created = (await made.json()) as { id: string };
    tidyAway(created.id);

    /*
     * ACCEPTED FIRST. A challenge is an OFFER now — one seat bound, one
     * offered — and nothing may be played on it until the other person agrees.
     * This file is about a game ENDING under a reader, so it needs a game.
     */
    const theirs = await memberContext(browser, baseURL!, them);
    const accepted = await theirs.request.post(`/api/games/${created.id}/offer/accept`, {});
    expect(accepted.status(), await accepted.text()).toBe(200);
    await theirs.close();

    /*
     * Read from the row: since 0.133.1 the API hands back only the caller's own
     * seat token, correctly. This spec has to move the opponent's stones, which
     * is a fixture rather than anything a player can do. See `seatTokensFor`.
     *
     * AFTER the acceptance, which mints a fresh key for the seat it binds.
     */
    const seats = await seatTokensFor(created.id);

    await page.goto(`/games/gomoku/match/${created.id}`);

    /*
     * Wait for the board to be LISTENING, not merely drawn. Every intersection
     * is server-rendered, so a stone placed before React attaches is dropped on
     * the floor, and the failure surfaces as a move that never happened.
     */
    await ready(page, "shared-game");

    const banner = page.getByTestId("turn-banner");
    /*
     * A LINK, because playing again now leads to the screen that settles the
     * game rather than creating one on the press. What this case is about is
     * unchanged: a game still being played has no rematch to offer at all.
     */
    const rematch = page.getByRole("link", { name: /Play again as/ });

    // It opens as a game in play. That is the state the fault needs.
    await expect(banner).toContainText("Your move");
    await expect(rematch, "a game still being played has nothing to play again").toHaveCount(0);

    /** My stone, clicked on the board, and then waited for the way a player waits. */
    const myStone = async (row: number, col: number) => {
      await expect(banner).toContainText("Your move");
      await playAt(page, 9, row, col);
      // The board only moves on the server's answer, so the banner turning over
      // is the proof my stone was taken — and the cue that it is their go.
      await expect(banner).not.toContainText("Your move");
    };

    /** The opponent, at their own screen. They are not this page; they are the post. */
    const theirStone = async (row: number, col: number) => {
      const played = await context.request.post(`/api/games/${created.id}/moves`, {
        data: { token: seats.whiteToken, row, col },
      });
      expect(played.status(), await played.text()).toBe(201);
    };

    /*
     * Played the way a player plays it. Mine are scattered so that WHITE is the
     * one who makes three — John's case, where the move that ends the game is
     * the one that lands under you while you are looking at it.
     */
    await myStone(0, 0);
    await theirStone(8, 8);
    await myStone(2, 4);
    await theirStone(8, 7);
    await myStone(4, 0);
    await theirStone(8, 6); // the move that ends it

    /*
     * THE ASSERTION. The page must become the record of the game on its own.
     * Before the fix it stayed the live board for ever: the result banner would
     * appear and read correctly, and none of the rest of this would be here.
     * The wait is generous because it costs one poll interval.
     */
    await expect(
      rematch,
      "the game ended in front of me and the page never became the record",
    ).toBeVisible({ timeout: 20_000 });

    // Black had it, so the rematch offers white. The swap is on the button.
    await expect(rematch).toHaveText(/Play again as White/);

    // The heading the filed page draws and the live one has no notion of.
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(me.name);
    await expect(heading).toContainText(them.name);

    /*
     * And the live furniture is gone. These two are what John's screenshot
     * showed on a game that had been over for hours: a mute checkbox for an
     * opponent who cannot speak again, and a line in the present tense saying
     * he IS playing black against Kyu. Neither carries a status condition, so
     * both outlive the ending — they go only when the page does.
     */
    await expect(
      page.getByTestId("mute-game"),
      "the live board's controls are still on a game that is over",
    ).toHaveCount(0);
    await expect(
      page.getByTestId("opponent-line"),
      "the page still says the game is being played",
    ).toHaveCount(0);

    /*
     * Same address throughout, and never reloaded — the whole point. The board
     * keeps the move number current as play goes on, so this is the position
     * after the closing stone.
     */
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${created.id}/6$`));

    await context.close();
  });

  test("offers the rematch against a computer player, which is most games here", async ({
    browser,
    baseURL,
  }) => {
    /*
     * The case John actually met. Of the rated games here with two bound seats,
     * only a handful are between two people — so a rematch that does not work
     * against a program works almost nowhere. A computer player has no address
     * at all, which is why this asks for the game again by NAMING THE GAME
     * rather than by addressing its other player.
     */
    const stamp = Date.now().toString(36);
    const me = { email: `botagain-${stamp}@example.test`, name: `BotAgain${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    const made = await context.request.post("/api/games/live", {
      data: { challengeId: "kyu", variant: "freestyle", size: 9, winLength: 3, moveTimeMs: null },
    });
    expect(made.status(), await made.text()).toBe(201);
    const created = (await made.json()) as { id: string };
    tidyAway(created.id);

    await page.goto(`/games/gomoku/match/${created.id}`);
    await ready(page, "shared-game");

    /*
     * Ended by giving it up rather than by out-playing the program: a spec that
     * has to beat a search is a spec about the search, and it would fail the day
     * the search got better. Resigning is a real reader's ending and a settled
     * one — and it needs a stone down first, because before the first move the
     * button says Cancel and calls the game off instead of finishing it.
     */
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");
    await playAt(page, 9, 4, 4);
    await page.getByTestId("resign").click();
    await page.getByTestId("resign-yes").click();

    const again = page.getByRole("link", { name: /Play again as/ });
    await expect(again, "no rematch offered after a game against a computer player").toBeVisible({
      timeout: 20_000,
    });

    /*
     * THROUGH THE SETUP SCREEN, which is where every way into a game goes now.
     * It opens filled in from the game just finished, so accepting it is one
     * press — and this case is about the rematch being OFFERED at all against a
     * computer player, which is unchanged.
     */
    await again.click();
    await page.waitForURL(/\/games\/new\?rematch=/);
    await ready(page, "set-up-game");
    await startAndBegin(page);
    await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/, { timeout: 30_000 });

    // A real second game, with the same board and the same opponent in it.
    const id = page.url().split("/").pop()!;
    tidyAway(id);
    const started = await context.request.get(`/api/games/${id}`);
    expect(started.status()).toBe(200);
    const next = (await started.json()) as { size: number; blackName: string; whiteName: string };
    expect(next.size, "the board comes with it").toBe(9);
    expect([next.blackName, next.whiteName], "the computer player is in the rematch").toContain(
      "Kyu",
    );

    await context.close();
  });
});
