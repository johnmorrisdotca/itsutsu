import { expect, test } from "@playwright/test";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * A shared game is played on a board it has.
 *
 * Reversi is 8×8 and nothing else, and its rules panel was offering 9×9,
 * 13×13, 15×15 and 19×19 — the sizes the *site* knows, not the sizes the game
 * has. Worse, the panel showed 9×9 as the current board of an 8×8 game,
 * because 8 was not in the list for the value to match. And the size was not
 * only offered: it was accepted and written, so a Reversi game could be filed
 * at 19×19 and played on 8×8.
 */
test.describe("the board a game is played on", () => {
  test("the panel offers a Reversi game only the board Reversi has", async ({ page, request }) => {
    const started = await request.post("/api/games/live", {
      data: { variant: "reversi", blackName: `Kaya ${Date.now().toString(36)}`, whiteName: "Sumi", size: 8 },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string };
    tidyAway(game.id);

    // Through the seat link, so the panel is editable: only a seat holder sees it.
    await page.goto(`/games/reversi/match/${game.id}/seat/${game.blackToken}`);
    await page.waitForURL(/\/games\/reversi\//);

    /*
     * The panel beside a board does not offer boards at all any more — the rules
     * of a game are agreed on the doorstep before it is written, and a board is
     * not the place to re-offer them. What this case has always really been about
     * survives that: the panel says which board the game is actually on, and it
     * is the board the game has rather than the number somebody sent.
     *
     * The absence is asserted after the line above it has been waited for, so it
     * is a statement about a rendered page rather than about how fast a request is.
     */
    await expect(page.getByTestId("shared-rules-line")).toContainText("8×8");
    await expect(page.getByTestId("shared-rules-size")).toHaveCount(0);
  });

  test("a game that takes any board says which one it is on", async ({ page, request }) => {
    /*
     * The companion of the case above, on a game with four boards to choose from
     * — the one where a panel offering a list could disagree with the board being
     * drawn. It states the board instead, which cannot.
     */
    const started = await request.post("/api/games/live", {
      data: { variant: "freestyle", blackName: `Kaya ${Date.now().toString(36)}`, whiteName: "Sumi", size: 15 },
    });
    const game = (await started.json()) as { id: string; blackToken: string };
    tidyAway(game.id);

    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\//);
    await expect(page.getByTestId("shared-rules-line")).toContainText("15×15");
    await expect(page.getByTestId("shared-rules-size")).toHaveCount(0);
  });

  test("a size the game does not have is not written down, whoever asks", async ({ request }) => {
    const started = await request.post("/api/games/live", {
      data: { variant: "reversi", blackName: `Kaya ${Date.now().toString(36)}`, whiteName: "Sumi", size: 8 },
    });
    const game = (await started.json()) as { id: string; blackToken: string };
    tidyAway(game.id);

    // Straight at the API, past the panel: the page is not the only caller.
    const changed = await request.put(`/api/games/${game.id}/settings`, {
      data: {
        token: game.blackToken,
        variant: "reversi",
        size: 19,
        opening: "free",
        obstacles: "none",
        moveTimeMs: null,
        timeoutPenalty: "turn",
        drawLimit: "none",
        clockMode: "move",
        rated: true,
        allowResign: true,
        open: false,
        handicap: null,
      },
    });
    expect(changed.status()).toBe(200);

    const after = await (await request.get(`/api/games/${game.id}`)).json();
    expect(after.size).toBe(8);
  });

  test("and a game asked for on the wrong board is created on the right one", async ({ request }) => {
    const started = await request.post("/api/games/live", {
      data: { variant: "reversi", blackName: `Kaya ${Date.now().toString(36)}`, whiteName: "Sumi", size: 19 },
    });
    const game = (await started.json()) as { id: string };
    tidyAway(game.id);
    const made = await (await request.get(`/api/games/${game.id}`)).json();
    expect(made.size).toBe(8);
  });
});
